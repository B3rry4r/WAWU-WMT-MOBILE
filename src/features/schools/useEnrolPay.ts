import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { isApiError } from '@/api/errors';
import { walletBalanceQuery } from '@/api/money';
import { queryClient } from '@/api/query';
import type { PayStatus, PayWallet } from '@/components/pay-sheet';
import type { PinCheckResult } from '@/components/pin-sheet';
import type { PaymentQuote } from '@/features/events/buyApi';
import { feeLines, limitLine, NO_TOTAL_TITLE, NOT_READY_LINE, OVER_LIMIT_TITLE, PRICE_CHANGED_LINE, quoteAddsUp } from '@/features/events/buyModel';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { newRequestKey } from '@/features/wallet/api/settings';

import { enrolKeys, fetchEnrolment, fetchFeeQuote, payFee, type Enrolment } from './enrolApi';
import { dropEnrolIntent, findEnrolIntent, putEnrolIntent, type EnrolIntent } from './enrolIntent';
import { PRICE_UNREADABLE } from './enrolModel';

/**
 * How often an enrolment whose payment the Hub has not finished is read again (`GET /schools/enrolments/{id}`, our own records).
 * PROVISIONAL(SCHOOL-ENROL-POLL, owner=SCHOOLS-06, why=no ruling sizes it; four seconds is the send's and the tickets' own read).
 */
const POLL_MS = 4000;

export type EnrolPayArgs = {
  /** The enrolment being paid: `reserved`. */
  enrolment: Enrolment;
  /** The pay sheet was dismissed with nothing paid: leave the screen (the place stays held for a while). */
  onLeave: () => void;
  /** No wallet yet (R-6): Open your wallet. */
  onOpenWallet: () => void;
  /** No PIN is set yet: A9 sets one. */
  onSetPin: () => void;
  /** Forgot PIN? (W37). */
  onForgotPin: () => void;
  /** Add money for the shortfall (kobo). */
  onAddMoney: (shortfallKobo: number) => void;
};

/** What SC5 and SC6 draw, ready for `PaySheet` and `PinSheet`. Null while no payment is being reviewed. */
export type EnrolSheet = {
  payOpen: boolean;
  pinOpen: boolean;
  payment: PaymentQuote;
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
  addMoney: (shortfallKobo: number) => void;
  tryAgain: () => void;
};

const WALLET_NOT_READY = ['wallet_not_open', 'wallet_opening'];

/**
 * Paying for a held place from the wallet, from SC4's Continue to SC7 (SCHOOLS-06): SC5's quote, SC6's PIN, the payment and the
 * still-confirming state. One fresh quote per tap on Pay, so the sheet never approves a total the Hub will refuse. One
 * `Idempotency-Key` per payment attempt: a wrong PIN, a request that got no answer and a PIN typed again all send the SAME key (and
 * the same quote), so the money moves once. The attempt outlives the screen (`./enrolIntent`): a payment that got no answer is sent
 * again as it was, and one the Hub took and has not finished is only read, never paid again.
 *
 * A course with no fee never reaches this: the Hub enrols it at Continue.
 */
export function useEnrolPay(args: EnrolPayArgs) {
  const { enrolment } = args;
  const owner = useSessionAccount(undefined);

  // undefined while the phone is asked; null when no payment is kept for this enrolment.
  const [intent, setIntent] = useState<EnrolIntent | null | undefined>(undefined);
  const [fresh, setFresh] = useState<PaymentQuote | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [status, setStatus] = useState<PayStatus>({ kind: 'review' });
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [shortOf, setShortOf] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);

  // One key per payment attempt: the same quote is paid with the same key.
  const payKey = useRef<{ token: string; key: string } | null>(null);
  const startedFor = useRef<string | null>(null);
  // Set when a quote could not be asked for because there is no wallet yet: the person is already being taken to Open your wallet.
  const walletLed = useRef(false);
  // Counts the times the screen is shown again after being left (Open your wallet, A9, Wallet): the quote is asked for again then.
  const [shown, setShown] = useState(0);
  const left = useRef(false);
  const keyForQuote = (token: string) => {
    if (payKey.current?.token !== token) payKey.current = { token, key: newRequestKey() };
    return payKey.current.key;
  };

  // The phone is asked once for a payment kept for this enrolment: Back, a reload or a closed app leaves one.
  useEffect(() => {
    if (!owner) return undefined;
    let current = true;
    void findEnrolIntent(owner, enrolment.id).then((found) => {
      if (!current) return;
      if (found) payKey.current = { token: found.payment.quoteToken, key: found.key };
      setIntent(found);
    });
    return () => {
      current = false;
    };
  }, [owner, enrolment.id]);

  const keep = useCallback(
    (next: EnrolIntent | null, dropped?: EnrolIntent): Promise<unknown> => {
      setIntent(next);
      if (!owner) return Promise.resolve();
      if (next) return putEnrolIntent(owner, next);
      return dropped ? dropEnrolIntent(owner, enrolment.id, dropped.key) : Promise.resolve();
    },
    [owner, enrolment.id],
  );

  const afterMoney = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['money'] });
    void queryClient.invalidateQueries({ queryKey: ['schools', 'enrolments'] });
    void queryClient.invalidateQueries({ queryKey: enrolKeys.enrolment(enrolment.id) });
  }, [enrolment.id]);

  const closeSheets = () => {
    setPinOpen(false);
    setPayOpen(false);
  };

  const confirming = intent?.phase === 'processing';

  // The enrolment read again while a payment the Hub has not finished is waited for. When it is decided here, the screen redraws as the receipt.
  const polled = useQuery(
    {
      queryKey: enrolKeys.enrolment(enrolment.id),
      queryFn: () => fetchEnrolment(enrolment.id),
      enabled: Boolean(owner && confirming),
      refetchInterval: confirming ? POLL_MS : false,
      staleTime: 0,
    },
    queryClient,
  );

  const held = intent?.phase === 'unknown' ? intent.payment : null;
  const payment = held ?? fresh;
  const balance = useQuery({ ...walletBalanceQuery, enabled: Boolean(owner && payment && payment.balanceKobo === null) }, queryClient);

  const leadToWallet = (error: unknown): boolean => {
    if (!isApiError(error) || !error.code || !WALLET_NOT_READY.includes(error.code)) return false;
    walletLed.current = true;
    args.onOpenWallet();
    return true;
  };

  const askQuote = async (): Promise<PaymentQuote | undefined> => {
    walletLed.current = false;
    try {
      return await fetchFeeQuote(enrolment.id);
    } catch (error) {
      if (!leadToWallet(error)) setNotice(isApiError(error) && error.message ? error.message : PRICE_UNREADABLE);
      return undefined;
    }
  };

  // Coming back to this screen after leaving it asks again: the person may have opened a wallet, set a PIN or added money meanwhile.
  useFocusEffect(
    useCallback(() => {
      if (left.current) {
        left.current = false;
        startedFor.current = null;
        setShown((n) => n + 1);
      }
      return () => {
        left.current = true;
      };
    }, []),
  );

  // When the screen opens: a payment kept from before is reviewed again (or only waited for); otherwise the quote is asked for.
  useEffect(() => {
    if (intent === undefined || startedFor.current === enrolment.id) return;
    startedFor.current = enrolment.id;
    if (intent?.phase === 'processing') return;
    if (intent) {
      // Kept as a callback after this render: the decision to open the sheet is not part of drawing it.
      queueMicrotask(() => setPayOpen(true));
      return;
    }
    // Started as a callback after this render: asking for the quote is not part of drawing the screen.
    queueMicrotask(() => {
      setLoadingQuote(true);
      void askQuote()
        .then((quote) => {
          if (quote) {
            setFresh(quote);
            setStatus({ kind: 'review' });
            setPayOpen(true);
          } else if (!walletLed.current) {
            args.onLeave();
          }
        })
        .finally(() => setLoadingQuote(false));
    });
    // The quote is asked for once per opening of the screen; later taps ask again from `pay`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent, enrolment.id, shown]);

  // A payment the Hub has decided needs no intent kept for it: the phone lets it go when the enrolment shows the answer.
  const decided = polled.data && polled.data.status !== 'reserved' ? polled.data.id : null;
  useEffect(() => {
    if (decided && intent) queueMicrotask(() => void keep(null, intent));
  }, [decided, intent, keep]);

  const pay = async () => {
    if (!payment) return;
    // A request that already went out with no answer is sent again as it was (same key, same quote): the Hub answers a key it knows
    // before it looks at the quote, and a new key could pay twice. Otherwise every tap asks for a fresh quote first.
    if (intent?.phase !== 'unknown') {
      const again = await askQuote();
      if (!again) {
        closeSheets();
        return;
      }
      const changed = again.totalKobo !== payment.totalKobo;
      setFresh(again);
      if (changed) {
        setNotice(PRICE_CHANGED_LINE);
        return;
      }
    }
    setPinOpen(true);
  };

  const submitPin = async (pin: string): Promise<PinCheckResult> => {
    if (!payment || !owner || intent === undefined) return { code: 'unanswered' };
    // The request this payment carries: the one already sent (same key, same body) or the first one, made now from what is on screen.
    const sending: EnrolIntent =
      intent?.phase === 'unknown' ? intent : { enrolmentId: enrolment.id, payment, key: keyForQuote(payment.quoteToken), phase: 'unknown', at: Date.now() };
    // Written before it leaves the phone, so a screen that goes away mid-payment still finds it. A first payment the store cannot keep
    // is not sent at all: the phone could not protect it from being paid twice. (A repeat of one already kept has its entry.)
    const kept = await putEnrolIntent(owner, sending);
    if (!kept && sending !== intent) {
      setPinOpen(false);
      setNotice(NOT_READY_LINE);
      return { code: 'approved' };
    }
    setIntent(sending);
    const outcome = await payFee({
      enrolmentId: enrolment.id,
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
      case 'done': {
        const paid = outcome.payment.status;
        if (paid === 'failed' || paid === 'reversed') {
          void nothingMoved();
          setPinOpen(false);
          setStatus({ kind: 'failed', message: outcome.payment.failureReason ?? outcome.payment.statusMessage ?? undefined });
          afterMoney();
          return { code: 'approved' };
        }
        // Completed or pending: the Hub has the payment. The enrolment is read until it is decided; the person is never asked to pay again.
        void keep({ ...sending, phase: 'processing' });
        closeSheets();
        afterMoney();
        return { code: 'approved' };
      }
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
        // No payment exists for the key: the price moved, so this is a new attempt with the quote the Hub gave.
        void nothingMoved();
        setPinOpen(false);
        if (outcome.quote) setFresh(outcome.quote);
        setNotice(PRICE_CHANGED_LINE);
        return { code: 'approved' };
      case 'refused':
        void nothingMoved();
        setPinOpen(false);
        setStatus({ kind: 'failed', message: outcome.message });
        return { code: 'approved' };
    }
  };

  const cancel = () => {
    setPayOpen(false);
    setPinOpen(false);
    setStatus({ kind: 'review' });
    setFresh(null);
    args.onLeave();
  };

  const tryAgain = () => {
    setStatus({ kind: 'review' });
    setShortOf(null);
    void askQuote().then((quote) => {
      if (quote) setFresh(quote);
    });
  };

  let sheet: EnrolSheet | null = null;
  if (payment && payOpen) {
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
      payment,
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
      tryAgain,
    };
  }

  return {
    sheet,
    /** The quote is being asked for as the screen opens. */
    loadingQuote,
    /** The Hub has the payment and has not finished: the enrolment is read until it is decided. */
    confirming,
    refreshing: polled.isFetching,
    refresh: () => void polled.refetch(),
    refreshFailed: confirming && polled.isError,
    /** A notice for the screen to show (the price moved, the phone could not keep a record, a quote that could not be read). */
    notice,
    clearNotice: () => setNotice(null),
  };
}
