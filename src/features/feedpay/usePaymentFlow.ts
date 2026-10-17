import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { PayStatus } from '@/components/pay-sheet';
import type { PinCheckResult } from '@/components/pin-sheet';
import { OVER_LIMIT_TITLE, NO_TOTAL_TITLE, PRICE_CHANGED_LINE, limitLine, quoteAddsUp } from '@/features/events/buyModel';
import { newRequestKey } from '@/features/wallet/api/settings';

import type { PayOutcome, PaymentQuote } from './payCall';
import { isWalletNotReady, sentenceOf } from './payCall';

/**
 * One wallet payment made from the feed, from the first ask for a quote to the settled view: a tip (H26 to H28) or an
 * unlock (H14 to H18). The two differ only in what they ask and send (`Engine`); everything that keeps the money safe is here
 * once:
 *
 * - a FRESH quote on every tap of Pay, before the PIN (`pay`): the person never approves a total the Hub has moved on from.
 *   A total that differs from the one on screen is shown and NOT paid; the person looks and taps again;
 * - ONE `Idempotency-Key` per attempt, kept for as long as the attempt is not decided. A wrong PIN (nothing moved), a PIN
 *   typed again, and a request that got no answer all send the SAME key and the SAME quote, so the money moves once. The
 *   attempt outlives the sheet (a module map keyed by what is being paid), so closing the sheet and opening it again
 *   after a lost answer sends the same request, not a new one;
 * - what the Hub took and has not finished (`pending`) is only READ (`engine.read`), never paid again.
 */
export type ViewStatus = 'pending' | 'failed' | 'reversed' | 'refunded' | 'paid';

/** What both views (`TipWalletView`, `UnlockWalletView`) carry that the flow reads. */
export type PaymentViewLike = {
  id: string;
  status: ViewStatus;
  statusMessage: string | null;
  payment: { status: string; delivered: boolean; failureReason: string | null };
};

export type QuoteLike = { payment: PaymentQuote };

export type Engine<Q extends QuoteLike, V extends PaymentViewLike> = {
  /** Names what is being paid (its target and every figure the request body holds), so a kept attempt is only reused for the same request. */
  scope: string;
  /** Asks the Hub for the quote of what is on screen, fresh. */
  ask: () => Promise<Q>;
  /** Sends the payment for that quote, with the PIN and the attempt's key. Never rejects. */
  send: (quote: Q, key: string, pin: string) => Promise<PayOutcome<V>>;
  /** One payment as it stands now (what the app polls after `pending`). */
  read: (id: string) => Promise<V>;
  /** Where a polled view is cached. */
  readKey: (id: string) => readonly unknown[];
  /** The sentence for a payment the Hub could not take for lack of money, when it sent no figures. */
  shortLine: string;
};

export type FlowHandlers = {
  /** No wallet yet (R-6): Open your wallet. */
  onOpenWallet: () => void;
  /** No PIN is set yet: A9 sets one. */
  onSetPin: () => void;
  /** Forgot PIN? (W37). */
  onForgotPin: () => void;
  /** Add money for the shortfall (kobo). */
  onAddMoney: (shortfallKobo: number) => void;
};

/** How the Hub's view stands, for the screens: done, money moving, money gone but not yet delivered, or not taken. */
export type Stage = 'paid' | 'confirming' | 'opening' | 'failed';

export function stageOf(view: Pick<PaymentViewLike, 'status' | 'payment'>): Stage {
  if (view.status === 'paid') return 'paid';
  if (view.status === 'pending') return view.payment.status === 'completed' && !view.payment.delivered ? 'opening' : 'confirming';
  return 'failed';
}

/** The words for a payment that did not complete: the Hub's own, else a plain line. */
export function failedSentence(view: Pick<PaymentViewLike, 'statusMessage' | 'payment'>): string {
  return view.statusMessage?.trim() || view.payment.failureReason?.trim() || 'The payment did not go through. Check your wallet before you try again.';
}

/** How often a payment the Hub has not finished is read again: our own records, never the provider. PROVISIONAL(FEEDPAY-POLL, owner=HOME-13, why=no ruling sizes it; four seconds is the send's and the tickets' own read). */
export const POLL_MS = 4000;

type Attempt<Q> = { key: string; quote: Q };
/** Attempts that were sent and not decided, by scope: kept across the sheet closing, so a retry is the same request. */
const attempts = new Map<string, Attempt<unknown>>();

/** Forgets every kept attempt (a test starts clean; the app never calls it: an undecided attempt stays until the Hub answers). */
export function clearAttempts(): void {
  attempts.clear();
}

export function usePaymentFlow<Q extends QuoteLike, V extends PaymentViewLike>(engine: Engine<Q, V>, handlers: FlowHandlers) {
  const client = useQueryClient();
  const live = useRef(engine);
  const hands = useRef(handlers);
  useEffect(() => {
    live.current = engine;
    hands.current = handlers;
  });

  const [quote, setQuote] = useState<Q | null>(null);
  const quoteRef = useRef<Q | null>(null);
  const [asking, setAsking] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [status, setStatus] = useState<PayStatus>({ kind: 'review' });
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [shortOf, setShortOf] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [view, setView] = useState<V | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const askSeq = useRef(0);
  const busy = useRef(false);
  const handled = useRef<string | null>(null);

  const afterMoney = useCallback(() => {
    void client.invalidateQueries({ queryKey: ['money'] });
  }, [client]);

  const hold = useCallback((next: Q | null) => {
    quoteRef.current = next;
    setQuote(next);
  }, []);

  const closeSheets = () => {
    setPinOpen(false);
    setPayOpen(false);
  };

  /** Asks the Hub for a quote. Only the newest answer counts; "no wallet yet" leads to Open your wallet; any other refusal is a notice. */
  const ask = useCallback(async (): Promise<Q | null> => {
    const mine = ++askSeq.current;
    setAsking(true);
    try {
      const next = await live.current.ask();
      if (mine !== askSeq.current) return null;
      hold(next);
      setStatus((was) => (was.kind === 'paying' ? was : { kind: 'review' }));
      setShortOf(null);
      return next;
    } catch (error) {
      if (mine !== askSeq.current) return null;
      if (isWalletNotReady(error)) {
        closeSheets();
        hands.current.onOpenWallet();
      } else {
        setNotice(sentenceOf(error, 'Check your connection and try again.'));
      }
      return null;
    } finally {
      if (mine === askSeq.current) setAsking(false);
    }
  }, [hold]);

  /** Opens the pay sheet on a fresh quote. */
  const open = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      setNotice(null);
      setView(null);
      setPendingId(null);
      handled.current = null;
      const next = await ask();
      if (next) {
        setStatus({ kind: 'review' });
        setPayOpen(true);
      }
    } finally {
      busy.current = false;
    }
  }, [ask]);

  /** Pay: a fresh quote first, then the PIN. A total that moved is shown, not paid. */
  const pay = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const sent = attempts.get(live.current.scope);
      if (sent) {
        // A request that went out and was not answered: the SAME quote and key go again, never a new quote.
        hold(sent.quote as Q);
        setPinOpen(true);
        return;
      }
      const before = quoteRef.current;
      const again = await ask();
      if (!again) return;
      if (before && again.payment.totalKobo !== before.payment.totalKobo) {
        setNotice(PRICE_CHANGED_LINE);
        return;
      }
      setPinOpen(true);
    } finally {
      busy.current = false;
    }
  }, [ask, hold]);

  const settle = useCallback(
    (next: V) => {
      const stage = stageOf(next);
      const mark = `${next.id}:${stage}`;
      if (handled.current === mark) return;
      handled.current = mark;
      setView(next);
      // Only a payment the Hub has not decided is read again.
      setPendingId(stage === 'confirming' || stage === 'opening' ? next.id : null);
      if (stage === 'paid') {
        closeSheets();
        setStatus({ kind: 'review' });
        afterMoney();
      } else if (stage === 'failed') {
        closeSheets();
        setPayOpen(true);
        setStatus({ kind: 'failed', message: failedSentence(next) });
        afterMoney();
      } else {
        // Confirming or opening: the Hub has it and has not finished. Read until it decides; never pay again.
        setPinOpen(false);
        setPayOpen(true);
        setStatus({ kind: 'confirming' });
      }
    },
    [afterMoney],
  );

  const submitPin = async (pin: string): Promise<PinCheckResult> => {
    const q = quoteRef.current;
    if (!q) return { code: 'unanswered' };
    const scope = live.current.scope;
    // The request this payment carries: the one already sent and not answered, else the first one, made now.
    const attempt = (attempts.get(scope) as Attempt<Q> | undefined) ?? { key: newRequestKey(), quote: q };
    attempts.set(scope, attempt);
    const outcome = await live.current.send(attempt.quote, attempt.key, pin);
    // An answer that proves nothing moved and ends this try (the money, the wallet or the price said no): the attempt is over, and the
    // next try gets a new quote and a new key. A wrong PIN is not that: the person types it again for the SAME payment, so the attempt
    // (its quote and its key) stays, which the contract allows (a refusal before money moves is not stored against the key).
    const nothingMoved = () => attempts.delete(scope);
    switch (outcome.kind) {
      case 'pin_incorrect':
        return { code: 'pin_incorrect', triesLeft: outcome.triesLeft };
      case 'pin_locked':
        setLockedUntil(outcome.lockedUntil);
        return { code: 'pin_locked', lockedUntil: outcome.lockedUntil };
      case 'unanswered':
        return { code: 'unanswered' };
      case 'done':
        attempts.delete(scope);
        settle(outcome.view);
        return { code: 'approved' };
      case 'in_progress':
        // Another payment for this is being confirmed: this key moved nothing.
        nothingMoved();
        setPinOpen(false);
        setStatus({
          kind: 'blocked',
          title: 'Still confirming',
          message: 'A payment for this is still being confirmed. Check your wallet activity before you pay again.',
        });
        return { code: 'approved' };
      case 'pin_not_set':
        nothingMoved();
        setPinOpen(false);
        hands.current.onSetPin();
        return { code: 'approved' };
      case 'no_wallet':
        nothingMoved();
        closeSheets();
        hands.current.onOpenWallet();
        return { code: 'approved' };
      case 'insufficient_funds':
        // The bank's own figures now: the sheet's "not enough" reads them, and the key is spent on nothing.
        nothingMoved();
        setPinOpen(false);
        setShortOf(outcome.balanceKobo);
        return { code: 'approved' };
      case 'quote_changed':
        // No payment exists for the key: the price moved, so the next tap is a new attempt on the quote the Hub gave.
        nothingMoved();
        setPinOpen(false);
        if (outcome.quote) hold({ ...q, payment: outcome.quote });
        else void ask();
        setNotice(PRICE_CHANGED_LINE);
        return { code: 'approved' };
      case 'refused':
        nothingMoved();
        setPinOpen(false);
        setStatus({ kind: 'failed', message: outcome.message });
        return { code: 'approved' };
    }
  };

  // What the Hub has and has not finished is read again until it decides. Only our own records are asked.
  const polled = useQuery({
    queryKey: engine.readKey(pendingId ?? ''),
    queryFn: () => live.current.read(pendingId as string),
    enabled: Boolean(pendingId),
    refetchInterval: (query) => (query.state.data && query.state.data.status !== 'pending' ? false : POLL_MS),
    staleTime: 0,
  });
  useEffect(() => {
    const next = polled.data;
    if (!next || next.id !== pendingId || !polled.isFetchedAfterMount) return;
    queueMicrotask(() => settle(next));
  }, [polled.data, polled.isFetchedAfterMount, pendingId, settle]);

  const cancel = () => {
    askSeq.current += 1;
    setAsking(false);
    closeSheets();
    setStatus({ kind: 'review' });
    setShortOf(null);
  };

  /** Back to a clean slate after the person is done with a settled payment. */
  const finish = () => {
    cancel();
    hold(null);
    setView(null);
    setPendingId(null);
    handled.current = null;
  };

  const payment = quote?.payment ?? null;
  const limit = payment ? limitLine(payment) : null;
  const blocked: PayStatus | null = payment
    ? limit !== null
      ? { kind: 'blocked', title: OVER_LIMIT_TITLE, message: limit }
      : quoteAddsUp(payment)
        ? null
        : { kind: 'blocked', title: NO_TOTAL_TITLE, message: 'Try again to ask for the total once more.', tryAgain: true }
    : null;

  return {
    quote,
    asking,
    payOpen,
    pinOpen,
    status: blocked !== null && status.kind === 'review' ? blocked : status,
    setStatus,
    shortOf,
    lockedUntil,
    notice,
    clearNotice: () => setNotice(null),
    view,
    stage: view ? stageOf(view) : null,
    ask,
    open,
    pay,
    submitPin,
    cancel,
    finish,
    closePin: () => setPinOpen(false),
    refreshing: polled.isFetching,
    /** Read the payment again now (Refresh). */
    refresh: () => void polled.refetch(),
    refreshFailed: Boolean(pendingId) && polled.isError,
  };
}
