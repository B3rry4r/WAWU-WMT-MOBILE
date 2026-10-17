import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { isApiError } from '@/api/errors';
import { walletBalanceQuery } from '@/api/money';
import type { PayStatus, PayWallet } from '@/components/pay-sheet';
import type { PinCheckResult } from '@/components/pin-sheet';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { newRequestKey } from '@/features/wallet/api/settings';

import type { TicketType } from './api';
import { createOrder, fetchOrder, fetchOrderQuote, payOrder, walletOrderKey, type OrderQuote, type WalletOrder } from './buyApi';
import { dropBuyIntent, findBuyIntent, putBuyIntent, type BuyIntent } from './buyIntent';
import {
  failedLine,
  feeLines,
  limitLine,
  NO_TOTAL_TITLE,
  NOT_READY_LINE,
  ORDER_LIMIT_TITLE,
  orderLines,
  OVER_LIMIT_TITLE,
  PRICE_CHANGED_LINE,
  quoteAddsUp,
  quoteSpent,
  sheetSubtitle,
} from './buyModel';
import type { Basket } from './format';

/**
 * How often an order the Hub has not finished is read again (`GET /events/orders/wallet/{id}`, our own records).
 * PROVISIONAL(EVENT-ORDER-POLL, owner=EVENTS-06, why=no ruling sizes it; four seconds is the send's own read).
 */
const POLL_MS = 4000;

export type TicketBuyArgs = {
  eventId: string;
  eventName: string;
  tiers: readonly TicketType[];
  basket: Basket;
  /** The tickets are issued: E5. */
  onOpenOrder: (orderId: string) => void;
  /** No wallet yet (R-6): Open your wallet. */
  onOpenWallet: () => void;
  /** No PIN is set yet: A9 sets one. */
  onSetPin: () => void;
  /** Forgot PIN? (W37). */
  onForgotPin: () => void;
  /** Add money for the shortfall (kobo). Opens Add money (W15) with the shortfall. A caller that leaves it out shows the short notice without the button. */
  onAddMoney?: (shortfallKobo: number) => void;
};

/** What E3 and E4 draw, ready for `PaySheet` and `PinSheet`. Null while no payment is being reviewed. */
export type BuySheet = {
  payOpen: boolean;
  pinOpen: boolean;
  quote: OrderQuote & { payment: NonNullable<OrderQuote['payment']> };
  subtitle: string;
  wallet: PayWallet;
  status: PayStatus;
  lockedUntil: string | null;
  fees: ReturnType<typeof feeLines>;
  pay: () => Promise<void>;
  submitPin: (pin: string) => Promise<PinCheckResult>;
  cancel: () => void;
  closePin: () => void;
  forgotPin: () => void;
  openWallet: () => void;
  addMoney?: (shortfallKobo: number) => void;
  tryAgain: () => void;
  eventName: string;
};

const WALLET_NOT_READY = ['wallet_not_open', 'wallet_opening'];

/**
 * Buying tickets from the wallet, from E2's Get tickets to E5 (EVENTS-06): the order, E3's quote, E4's PIN, the payment, and
 * E10's still-confirming. One `Idempotency-Key` per payment intent: a wrong PIN, a request that got no answer and a PIN typed
 * again all send the SAME key, so the money moves once. The intent outlives the screen (`./buyIntent`): a payment that got no
 * answer is sent again as it was, and one the Hub took and has not finished is only read, never paid again.
 *
 * A basket that costs nothing is issued by the order call itself (R-8): no sheet, no wallet, no PIN.
 */
export function useTicketBuy(args: TicketBuyArgs) {
  const { eventId, eventName, tiers, basket } = args;
  const client = useQueryClient();
  const owner = useSessionAccount(undefined);

  // undefined while the phone is asked; null when no payment is kept for this event.
  const [intent, setIntent] = useState<BuyIntent | null | undefined>(undefined);
  const [fresh, setFresh] = useState<OrderQuote | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [status, setStatus] = useState<PayStatus>({ kind: 'review' });
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [shortOf, setShortOf] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  // One key per tap on Get tickets: the same tickets asked for again answer the same order.
  const createKey = useRef<{ sig: string; key: string } | null>(null);
  // One key per payment intent: the same quote is paid with the same key.
  const payKey = useRef<{ token: string; key: string } | null>(null);
  const handled = useRef<string | null>(null);
  const openOrder = useRef(args.onOpenOrder);
  useEffect(() => {
    openOrder.current = args.onOpenOrder;
  });

  const keyForQuote = (token: string) => {
    if (payKey.current?.token !== token) payKey.current = { token, key: newRequestKey() };
    return payKey.current.key;
  };

  // The phone is asked once for a payment kept for this event: Back, a reload or a closed app leaves one.
  useEffect(() => {
    if (!owner) return undefined;
    let current = true;
    void findBuyIntent(owner, eventId).then((found) => {
      if (!current) return;
      if (found) payKey.current = { token: found.payment.quoteToken, key: found.key };
      setIntent(found);
    });
    return () => {
      current = false;
    };
  }, [owner, eventId]);

  const keep = useCallback(
    (next: BuyIntent | null, dropped?: BuyIntent): Promise<unknown> => {
      setIntent(next);
      if (!owner) return Promise.resolve();
      if (next) return putBuyIntent(owner, next);
      return dropped ? dropBuyIntent(owner, eventId, dropped.key) : Promise.resolve();
    },
    [owner, eventId],
  );

  const afterMoney = useCallback(() => {
    void client.invalidateQueries({ queryKey: ['money'] });
    void client.invalidateQueries({ queryKey: ['events', 'tickets', eventId] });
    void client.invalidateQueries({ queryKey: ['events', 'held'] });
  }, [client, eventId]);

  const closeSheets = () => {
    setPinOpen(false);
    setPayOpen(false);
  };

  const settlePaid = useCallback(
    (order: WalletOrder, from: BuyIntent | null) => {
      // Once per order: the payment's own answer and a read of the order can both arrive.
      if (handled.current === `${order.id}:paid`) return;
      handled.current = `${order.id}:paid`;
      client.setQueryData(walletOrderKey(order.id), order);
      void keep(null, from ?? undefined);
      setFresh(null);
      setPinOpen(false);
      setPayOpen(false);
      setStatus({ kind: 'review' });
      afterMoney();
      openOrder.current(order.id);
    },
    [client, keep, afterMoney],
  );

  const settleFailed = useCallback(
    (order: WalletOrder, from: BuyIntent | null) => {
      if (handled.current === `${order.id}:failed`) return;
      handled.current = `${order.id}:failed`;
      void keep(null, from ?? undefined);
      setFresh(null);
      setPinOpen(false);
      setPayOpen(false);
      setStatus({ kind: 'review' });
      setFailed(failedLine(order));
      afterMoney();
    },
    [keep, afterMoney],
  );

  // The order the Hub holds for a kept payment, read again while it is not finished. Only an answer read after this screen opened counts.
  const watched = intent?.order.id ?? null;
  const polled = useQuery({
    queryKey: walletOrderKey(watched ?? ''),
    queryFn: () => fetchOrder(watched as string),
    enabled: Boolean(owner && watched),
    refetchInterval: (query) => (query.state.data?.status === 'processing' ? POLL_MS : false),
    staleTime: 0,
  });
  useEffect(() => {
    const order = polled.data;
    if (!intent || !order || order.id !== intent.order.id || !polled.isFetchedAfterMount) return;
    if (order.status === 'processing' && intent.phase === 'unknown') {
      // Kept as processing after this render, as a callback: the decision is not part of drawing it.
      queueMicrotask(() => void keep({ ...intent, phase: 'processing' }));
      return;
    }
    if (order.status === 'paid') queueMicrotask(() => settlePaid(order, intent));
    else if (order.status === 'failed') queueMicrotask(() => settleFailed(order, intent));
  }, [polled.data, polled.isFetchedAfterMount, intent, keep, settlePaid, settleFailed]);

  const confirming =
    intent?.phase === 'processing' && polled.data?.status !== 'paid' && polled.data?.status !== 'failed';

  const held = intent?.phase === 'unknown' ? { order: intent.order, payment: intent.payment } : null;
  const quote = held ?? fresh;
  const payment = quote?.payment ?? null;

  const balance = useQuery({ ...walletBalanceQuery, enabled: Boolean(owner && payment && payment.balanceKobo === null) });

  const open = (next: OrderQuote) => {
    setFresh(next);
    setStatus({ kind: 'review' });
    setShortOf(null);
    setPayOpen(true);
  };

  const leadToWallet = (error: unknown): boolean => {
    if (!isApiError(error) || !error.code || !WALLET_NOT_READY.includes(error.code)) return false;
    args.onOpenWallet();
    return true;
  };

  /** Get tickets: a payment kept from before is reviewed again; otherwise the order is made. */
  const start = async () => {
    if (starting || intent === undefined || confirming) return;
    setFailed(null);
    if (held) {
      open(held);
      return;
    }
    const lines = orderLines(tiers, basket);
    if (lines.length === 0) return;
    const sig = JSON.stringify(lines);
    if (createKey.current?.sig !== sig) createKey.current = { sig, key: newRequestKey() };
    setStarting(true);
    try {
      const made = await createOrder({ eventId, lines, key: createKey.current.key });
      if (made.payment === null) {
        // A basket that costs nothing is issued on the spot (R-8): the tickets, with no wallet and no PIN.
        if (made.order.status === 'paid') settlePaid(made.order, null);
        else setNotice('These tickets are not ready yet. Try again.');
      } else {
        open(made);
      }
    } catch (error) {
      if (!leadToWallet(error)) setNotice(isApiError(error) && error.message ? error.message : 'Check your connection and try again.');
    } finally {
      setStarting(false);
    }
  };

  const refreshQuote = async () => {
    if (!quote) return;
    try {
      const again = await fetchOrderQuote(quote.order.id);
      if (again.payment) {
        setFresh(again);
        setStatus({ kind: 'review' });
      }
      return again;
    } catch (error) {
      if (!leadToWallet(error)) setNotice(isApiError(error) && error.message ? error.message : 'Check your connection and try again.');
      closeSheets();
      return undefined;
    }
  };

  const pay = async () => {
    if (!payment || !quote) return;
    // A quote past its time is asked for again before the PIN, so the sheet never approves a total the Hub will refuse. Not for a
    // request that already went out with no answer: that one is sent again as it was (same key, same quote), because the Hub
    // answers a key it knows before it looks at the quote, and a new key could pay twice.
    if (intent?.phase !== 'unknown' && quoteSpent(payment, Date.now())) {
      const again = await refreshQuote();
      if (!again?.payment) return;
      if (again.payment.totalKobo !== payment.totalKobo) {
        setNotice(PRICE_CHANGED_LINE);
        return;
      }
    }
    setPinOpen(true);
  };

  const submitPin = async (pin: string): Promise<PinCheckResult> => {
    if (!payment || !quote || !owner || intent === undefined) return { code: 'unanswered' };
    // The request this payment carries: the one already sent (same key, same body) or the first one, made now from what is on screen.
    const sending: BuyIntent = intent?.phase === 'unknown' ? intent : { eventId, order: quote.order, payment, key: keyForQuote(payment.quoteToken), phase: 'unknown', at: Date.now() };
    // Written before it leaves the phone, so a screen that goes away mid-payment still finds it. A first payment the store cannot keep
    // is not sent at all: the phone could not protect it from being paid twice. (A repeat of one already kept has its entry.)
    const kept = await putBuyIntent(owner, sending);
    if (!kept && sending !== intent) {
      setPinOpen(false);
      setNotice(NOT_READY_LINE);
      return { code: 'approved' };
    }
    setIntent(sending);
    const outcome = await payOrder({
      orderId: sending.order.id,
      expectedTotalKobo: sending.payment.totalKobo,
      quoteToken: sending.payment.quoteToken,
      key: sending.key,
      pin,
    });
    // The Hub gave an answer that proves nothing moved for the key: the intent is not kept, the key is free for the next try.
    const nothingMoved = () => keep(null, sending);
    switch (outcome.kind) {
      case 'pin_incorrect':
        void nothingMoved();
        return { code: 'pin_incorrect', triesLeft: outcome.triesLeft };
      case 'pin_locked':
        void nothingMoved();
        setLockedUntil(outcome.lockedUntil);
        return { code: 'pin_locked', lockedUntil: outcome.lockedUntil };
      case 'unanswered':
        return { code: 'unanswered' };
      case 'done':
        if (outcome.order.status === 'paid') settlePaid(outcome.order, sending);
        else if (outcome.order.status === 'failed') settleFailed(outcome.order, sending);
        else {
          // Processing (or anything the Hub has not finished): the order is read until it is decided; the person is never asked to pay again.
          client.setQueryData(walletOrderKey(outcome.order.id), outcome.order);
          void keep({ ...sending, order: outcome.order, phase: 'processing' });
          closeSheets();
        }
        return { code: 'approved' };
      case 'in_progress':
        void keep({ ...sending, phase: 'processing' });
        closeSheets();
        return { code: 'approved' };
      case 'pin_not_set':
        void nothingMoved();
        setPinOpen(false);
        args.onSetPin();
        return { code: 'approved' };
      case 'no_wallet':
        void nothingMoved();
        closeSheets();
        args.onOpenWallet();
        return { code: 'approved' };
      case 'insufficient_funds':
        // The bank's own figures now: the sheet's "not enough" reads them, and the key is spent on nothing.
        void nothingMoved();
        setPinOpen(false);
        setShortOf(outcome.balanceKobo);
        return { code: 'approved' };
      case 'quote_changed':
        // No payment exists for the key: the price moved, so this is a new intent with the quote the Hub gave.
        void nothingMoved();
        setPinOpen(false);
        if (outcome.quote) setFresh({ order: quote.order, payment: outcome.quote });
        else void refreshQuote();
        setNotice(PRICE_CHANGED_LINE);
        return { code: 'approved' };
      case 'refused':
        void nothingMoved();
        setPinOpen(false);
        setStatus(
          outcome.code === 'event_order_limit'
            ? { kind: 'blocked', title: ORDER_LIMIT_TITLE, message: outcome.message }
            : { kind: 'failed', message: outcome.message },
        );
        return { code: 'approved' };
    }
  };

  const cancel = () => {
    setPayOpen(false);
    setPinOpen(false);
    setStatus({ kind: 'review' });
    setFresh(null);
  };

  let sheet: BuySheet | null = null;
  if (quote && payment && payOpen) {
    const balanceKobo = shortOf ?? payment.balanceKobo ?? balance.data?.availableKobo;
    const limit = limitLine(payment);
    const blocked: PayStatus | null =
      limit !== null
        ? { kind: 'blocked', title: OVER_LIMIT_TITLE, message: limit }
        : quoteAddsUp(payment)
          ? null
          : { kind: 'blocked', title: NO_TOTAL_TITLE, message: 'Try again to ask for the total once more.', tryAgain: true };
    sheet = {
      payOpen,
      pinOpen,
      quote: { order: quote.order, payment },
      subtitle: sheetSubtitle(quote.order),
      wallet: balanceKobo !== undefined ? { kind: 'open', balanceKobo } : { kind: 'loading' },
      status: blocked !== null && status.kind === 'review' ? blocked : status,
      lockedUntil,
      fees: feeLines(payment.fee),
      pay,
      submitPin,
      cancel,
      closePin: () => setPinOpen(false),
      forgotPin: () => {
        setPinOpen(false);
        args.onForgotPin();
      },
      openWallet: () => {
        closeSheets();
        args.onOpenWallet();
      },
      addMoney: args.onAddMoney,
      tryAgain: () => {
        setStatus({ kind: 'review' });
        void refreshQuote();
      },
      eventName,
    };
  }

  return {
    /** The phone has been asked about a kept payment; Get tickets waits for it. */
    ready: intent !== undefined,
    starting,
    start,
    sheet,
    /** E10: the Hub has the payment and has not finished. */
    confirming,
    refreshing: polled.isFetching,
    refresh: () => void polled.refetch(),
    refreshFailed: confirming && polled.isError,
    /** The order failed after payment: the Hub's reason. */
    failed,
    dismissFailed: () => setFailed(null),
    notice,
    clearNotice: () => setNotice(null),
  };
}
