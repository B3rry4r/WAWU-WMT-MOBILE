import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isApiError } from '@/api/errors';
import type { PayStatus } from '@/components/pay-sheet';
import type { PinCheckResult } from '@/components/pin-sheet';
import { quoteAddsUp, quoteSpent } from '@/features/credits/model';
import { attemptFor, dropAttempt, keepAttempt, type Attempt } from '@/features/money-attempt/attempts';
import { newRequestKey } from '@/features/wallet/api/settings';

import {
  buyPass,
  fetchPassPurchase,
  fetchPassQuote,
  passKey,
  passPurchaseKey,
  passQuoteKey,
  type PassPurchase,
  type PassQuote,
} from './api';
import { PRICE_CHANGED_LINE, refundedLine } from './model';

/** How often a purchase the Hub has not finished is read again (`GET /communities/{id}/pass/{paymentId}`, our own records). Default (agent), owner may override. */
const POLL_MS = 4000;
const WALLET_NOT_READY = ['wallet_not_open', 'wallet_opening'];

export type PassPurchaseArgs = {
  /** The community the pass is for. */
  id: string;
  /** The Hub says this person can pay for a pass now (the room sells one and they are not its host). Nothing is asked of the wallet before. */
  enabled: boolean;
  /** No wallet yet (R-6): Open your wallet. */
  onOpenWallet: () => void;
  /** No PIN is set yet: A9 sets one. */
  onSetPin: () => void;
  /** Forgot PIN? (W37). */
  onForgotPin: () => void;
  /** Add money for the shortfall (kobo). Left out until Add money is built (WALLET-05, R-47): the short notice shows without the button. */
  onAddMoney?: (shortfallKobo: number) => void;
};

/** What I31 draws once a pass is paid: what it cost with the bank's charge, and the day it ends. */
export type PassBought = { totalKobo: number; passUntil: string | null };

const subjectOf = (id: string) => `pass:${id}`;

/**
 * Paying for a private room's pass from the wallet, on I30 and for a renewal (INBOX-14, R-63): the quote, the PIN, the purchase and the
 * still-confirming state. A fresh quote is asked for on every tap on Join or Renew, and the PIN sheet opens only when its total is the
 * one on screen (a changed total is shown first). One `Idempotency-Key` per attempt: a wrong PIN, a request that got no answer and a PIN typed
 * again all send the SAME key and the SAME quote, so the wallet is charged once and one pass is given; the attempt outlives the screen
 * (`money-attempt/attempts`). A purchase the Hub took and has not finished is only read, never paid again. A person with no wallet is
 * led to Open your wallet; a short wallet shows what is missing (Add money joins it once WALLET-05 builds it, R-47). Nothing is paid
 * without a PIN-confirmed tap: no timer and no reminder starts a payment (R-63).
 */
export function usePassPurchase(args: PassPurchaseArgs) {
  const { id, enabled } = args;
  const client = useQueryClient();
  const subject = subjectOf(id);
  const [fresh, setFresh] = useState<PassQuote | null>(null);
  const [tapping, setTapping] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [shortOf, setShortOf] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [status, setStatus] = useState<PayStatus>({ kind: 'review' });
  const [pendingIdNow, setPendingId] = useState<string | null>(null);
  const [confirmingNow, setConfirming] = useState(false);
  const [bought, setBought] = useState<PassBought | null>(null);
  const handled = useRef<string | null>(null);

  const held = attemptFor<PassQuote>(subject);
  // A purchase kept as pending is read again by its id. It is not paid again.
  const keptPending = held?.phase === 'pending' ? held : null;
  const pendingId = pendingIdNow ?? keptPending?.paymentId ?? null;

  const quoted = useQuery({
    queryKey: passQuoteKey(id),
    queryFn: () => fetchPassQuote(id),
    enabled: enabled && held === null && bought === null,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
  const noWallet = isApiError(quoted.error) && !!quoted.error.code && WALLET_NOT_READY.includes(quoted.error.code);
  const quote: PassQuote | null = held?.quote ?? fresh ?? quoted.data ?? null;

  const afterMoney = useCallback(() => {
    void client.invalidateQueries({ queryKey: ['money'] });
    // The pass, the room and every list of rooms read the Hub again: the person is in, or their end date moved.
    void client.invalidateQueries({ queryKey: passKey(id) });
    void client.invalidateQueries({ queryKey: ['community', id] });
    void client.invalidateQueries({ queryKey: ['inbox'] });
    void client.invalidateQueries({ queryKey: ['communities'] });
  }, [client, id]);

  const settlePaid = (purchase: PassPurchase, key: string | null) => {
    if (handled.current === `${purchase.id}:paid`) return;
    handled.current = `${purchase.id}:paid`;
    dropAttempt(subjectOf(id), key ?? undefined);
    setPinOpen(false);
    setPendingId(null);
    setConfirming(false);
    setFresh(null);
    setStatus({ kind: 'review' });
    setBought({ totalKobo: purchase.payment.totalKobo, passUntil: purchase.passUntil });
    afterMoney();
  };

  const settleFailed = (purchase: PassPurchase, key: string | null) => {
    if (handled.current === `${purchase.id}:failed`) return;
    handled.current = `${purchase.id}:failed`;
    dropAttempt(subjectOf(id), key ?? undefined);
    setPinOpen(false);
    setPendingId(null);
    setConfirming(false);
    setFresh(null);
    const message =
      purchase.status === 'refunded'
        ? refundedLine(purchase.priceKobo)
        : purchase.statusMessage?.trim() || purchase.payment.failureReason?.trim() || 'This pass did not go through. Nothing left your wallet.';
    setStatus({ kind: 'failed', message });
    afterMoney();
  };

  const polled = useQuery({
    queryKey: passPurchaseKey(id, pendingId ?? ''),
    queryFn: () => fetchPassPurchase(id, pendingId as string),
    enabled: pendingId !== null,
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? POLL_MS : false),
    staleTime: 0,
  });
  useEffect(() => {
    const purchase = polled.data;
    if (!purchase || purchase.id !== pendingId || !polled.isFetchedAfterMount) return;
    const key = attemptFor<PassQuote>(subject)?.key ?? null;
    if (purchase.status === 'paid') queueMicrotask(() => settlePaid(purchase, key));
    else if (purchase.status === 'failed' || purchase.status === 'reversed' || purchase.status === 'refunded') queueMicrotask(() => settleFailed(purchase, key));
    // The settle functions only read this render's state and are guarded by `handled`, so a new one each render is no reason to run again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polled.data, polled.isFetchedAfterMount, pendingId, subject]);

  const confirming = (pendingId !== null && polled.data?.status === 'pending') || (pendingId !== null && !polled.data) || confirmingNow || (keptPending !== null && keptPending.paymentId === null);

  const leadToWallet = (error: unknown): boolean => {
    if (!isApiError(error) || !error.code || !WALLET_NOT_READY.includes(error.code)) return false;
    args.onOpenWallet();
    return true;
  };

  /** Join or Renew: a fresh quote for this tap; the PIN opens only when its total is the one on screen. A payment already sent is asked again as it was. */
  const pay = async () => {
    if (tapping || confirming || pinOpen) return;
    setNotice(null);
    if (status.kind === 'failed') setStatus({ kind: 'review' });
    if (noWallet) {
      args.onOpenWallet();
      return;
    }
    if (held) {
      setPinOpen(true);
      return;
    }
    const shown = quote;
    if (!shown) return;
    setTapping(true);
    try {
      // A quote still inside its time is asked for again anyway: a fresh quote per tap.
      const again = await fetchPassQuote(id);
      setFresh(again);
      setShortOf(null);
      if (again.payment.totalKobo !== shown.payment.totalKobo || again.priceKobo !== shown.priceKobo) {
        setNotice(PRICE_CHANGED_LINE);
        return;
      }
      if (!quoteAddsUp(again.payment) || quoteSpent(again.payment, Date.now())) {
        setNotice('We couldn’t work out the total. Try again.');
        return;
      }
      if (again.payment.shortfallKobo !== null && again.payment.shortfallKobo > 0) return;
      setPinOpen(true);
    } catch (error) {
      if (!leadToWallet(error)) setNotice(isApiError(error) && error.message ? error.message : 'Check your connection and try again.');
    } finally {
      setTapping(false);
    }
  };

  const submitPin = async (pin: string): Promise<PinCheckResult> => {
    if (!quote) return { code: 'unanswered' };
    // The request this purchase carries: the one already sent (same key, same quote) or the first one, made now from what is on screen.
    const sending: Attempt<PassQuote> = attemptFor<PassQuote>(subject) ?? { subject, key: newRequestKey(), quote, phase: 'sent', paymentId: null };
    keepAttempt(sending);
    setStatus({ kind: 'paying' });
    const outcome = await buyPass({ id, quote: sending.quote, key: sending.key, pin });
    const nothingMoved = () => {
      dropAttempt(sending.subject, sending.key);
      setStatus({ kind: 'review' });
    };
    switch (outcome.kind) {
      case 'pin_incorrect':
        nothingMoved();
        return { code: 'pin_incorrect', triesLeft: outcome.triesLeft };
      case 'pin_locked':
        nothingMoved();
        setLockedUntil(outcome.lockedUntil);
        return { code: 'pin_locked', lockedUntil: outcome.lockedUntil };
      case 'unanswered':
        // Nothing proves the money did not move: the attempt stays, and the next try is the same request.
        setStatus({ kind: 'review' });
        return { code: 'unanswered' };
      case 'done': {
        const purchase = outcome.purchase;
        if (purchase.status === 'paid') settlePaid(purchase, sending.key);
        else if (purchase.status === 'pending') {
          keepAttempt({ ...sending, phase: 'pending', paymentId: purchase.id });
          client.setQueryData(passPurchaseKey(id, purchase.id), purchase);
          setPinOpen(false);
          setPendingId(purchase.id);
          setConfirming(true);
          setStatus({ kind: 'review' });
        } else settleFailed(purchase, sending.key);
        return { code: 'approved' };
      }
      case 'in_progress':
        keepAttempt({ ...sending, phase: 'pending', paymentId: null });
        setPinOpen(false);
        setConfirming(true);
        setStatus({ kind: 'review' });
        return { code: 'approved' };
      case 'pin_not_set':
        nothingMoved();
        setPinOpen(false);
        args.onSetPin();
        return { code: 'approved' };
      case 'no_wallet':
        nothingMoved();
        setPinOpen(false);
        args.onOpenWallet();
        return { code: 'approved' };
      case 'insufficient_funds':
        nothingMoved();
        setPinOpen(false);
        setShortOf(outcome.balanceKobo);
        return { code: 'approved' };
      case 'quote_changed':
        nothingMoved();
        setPinOpen(false);
        setFresh(null);
        void client.invalidateQueries({ queryKey: passQuoteKey(id) });
        setNotice(PRICE_CHANGED_LINE);
        return { code: 'approved' };
      case 'refused':
        nothingMoved();
        setPinOpen(false);
        setStatus({ kind: 'failed', message: outcome.message });
        return { code: 'approved' };
    }
  };

  /** Reads the purchase again now (Refresh on the still-confirming line). */
  const refresh = () => {
    if (pendingId) void polled.refetch();
    else afterMoney();
  };

  const balanceKobo = shortOf ?? quote?.payment.balanceKobo ?? null;
  const shortfallKobo =
    shortOf !== null && quote
      ? Math.max(0, quote.payment.totalKobo - shortOf)
      : quote?.payment.shortfallKobo != null && quote.payment.shortfallKobo > 0
        ? quote.payment.shortfallKobo
        : 0;

  return useMemo(
    () => ({
      quote,
      quoteError: quoted.isError && !noWallet && held === null ? quoted.error : null,
      quoteLoading: enabled && quote === null && quoted.isPending && !noWallet,
      retryQuote: () => void quoted.refetch(),
      noWallet,
      balanceKobo,
      shortfallKobo,
      pay,
      tapping,
      pinOpen,
      closePin: () => setPinOpen(false),
      submitPin,
      forgotPin: () => {
        setPinOpen(false);
        args.onForgotPin();
      },
      lockedUntil,
      status,
      notice,
      confirming,
      refresh,
      refreshing: polled.isFetching,
      bought,
      addMoney: args.onAddMoney ? () => args.onAddMoney?.(shortfallKobo) : undefined,
      dismissFailed: () => setStatus({ kind: 'review' }),
    }),
    // The handlers close over the state above; the memo only spares the screen a re-render when nothing it draws changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quote, quoted.status, quoted.error, enabled, noWallet, balanceKobo, shortfallKobo, tapping, pinOpen, lockedUntil, status, notice, confirming, polled.isFetching, bought, held],
  );
}
