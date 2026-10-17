import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { isApiError } from '@/api/errors';
import { walletBalanceQuery } from '@/api/money';
import type { PayStatus, PayWallet } from '@/components/pay-sheet';
import type { PinCheckResult } from '@/components/pin-sheet';
import { feeLines, limitLine, NO_TOTAL_TITLE, OVER_LIMIT_TITLE, PRICE_CHANGED_LINE, quoteAddsUp } from '@/features/events/buyModel';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { newRequestKey } from '@/features/wallet/api/settings';

import { fetchRequest, matterKeys } from '../matter/api';
import { fetchFeePayment, fetchFeeQuote, payFee, type FeePayment, type FeeQuote } from './api';
import { CONFIRMING_LINE, failedPaymentLine, feeSettled } from './model';

/** How often a fee the Hub has not finished is read again (our own records). PROVISIONAL(LEGAL-FEE-POLL, owner=LEGAL-04, why=no ruling sizes it; four seconds is the send's own read). */
const POLL_MS = 4000;

export type FeePayArgs = {
  requestId: string;
  /** The fee is paid and the matter has moved on: the caller reads the matter again. */
  onPaid: (stage: FeeQuote['stage']) => void;
  /** No wallet yet (R-6): Open your wallet. */
  onOpenWallet: () => void;
  /** No PIN is set yet: A9 sets one. */
  onSetPin: () => void;
  /** Forgot PIN? (W37). */
  onForgotPin: () => void;
  /** Add money for the shortfall (kobo). */
  onAddMoney: (shortfallKobo: number) => void;
};

const WALLET_NOT_READY = ['wallet_not_open', 'wallet_opening'];

/**
 * Paying a legal fee from the wallet (LEGAL-04 S19, LEGAL-06 S22): the fee quote, the PIN, the payment, and "still confirming".
 *
 * - **A fresh quote per tap.** Every tap on Pay asks the Hub for the quote again, so the sheet never approves a total the Hub will
 *   refuse; if the total moved, the new one is shown and nothing is asked of the PIN.
 * - **One Idempotency-Key per attempt.** The key is made when a PIN is first sent for a quote and travels again, unchanged, after a
 *   wrong PIN and after an answer that never came. Until the Hub has given an answer that proves nothing moved, the next tap on Pay
 *   reuses that attempt (same quote, same key) instead of asking again: the Hub answers a key it knows with the first payment.
 * - **Nobody pays twice.** A payment the Hub took and has not finished (`pending`, or `payment_in_progress`) is only ever read
 *   (the matter every four seconds), never sent again.
 */
export function useLegalFeePay(args: FeePayArgs) {
  const { requestId } = args;
  const client = useQueryClient();
  const owner = useSessionAccount(undefined);

  const [quote, setQuote] = useState<FeeQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [status, setStatus] = useState<PayStatus>({ kind: 'review' });
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [shortOf, setShortOf] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noWallet, setNoWallet] = useState(false);
  const [confirming, setConfirming] = useState<{ stage: FeeQuote['stage']; paymentId: string | null } | null>(null);

  // The attempt that has been sent and not settled: the quote it carried and its key.
  const attempt = useRef<{ quote: FeeQuote; key: string } | null>(null);
  // A tap is one at a time: set before anything is awaited, so two taps in one frame ask once.
  const tapping = useRef(false);
  const settled = useRef(false);
  const live = useRef(true);
  const paid = useRef(args.onPaid);
  useEffect(() => {
    paid.current = args.onPaid;
  });
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  const sentence = (error: unknown) => (isApiError(error) && error.message ? error.message : 'Check your connection and try again.');

  const afterMoney = useCallback(() => {
    void client.invalidateQueries({ queryKey: ['money'] });
    void client.invalidateQueries({ queryKey: matterKeys.request(requestId) });
    void client.invalidateQueries({ queryKey: ['legal', 'fee-quote', requestId] });
  }, [client, requestId]);

  const settlePaid = useCallback(
    (stage: FeeQuote['stage']) => {
      if (settled.current) return;
      settled.current = true;
      attempt.current = null;
      setConfirming(null);
      setPinOpen(false);
      setPayOpen(false);
      setStatus({ kind: 'review' });
      setQuote(null);
      afterMoney();
      paid.current(stage);
    },
    [afterMoney],
  );

  const settleFailed = useCallback(
    (payment: Pick<FeePayment, 'status' | 'statusMessage'>) => {
      attempt.current = null;
      setConfirming(null);
      setPinOpen(false);
      setStatus({ kind: 'failed', message: failedPaymentLine(payment) });
      afterMoney();
    },
    [afterMoney],
  );

  /** Reads the Hub's records for a payment it has not finished: the payment (when its id is known) and the matter. */
  const check = useCallback(async () => {
    if (!confirming) return;
    try {
      if (confirming.paymentId) {
        const payment = await fetchFeePayment(requestId, confirming.paymentId);
        if (!live.current) return;
        if (payment.status === 'paid') return settlePaid(confirming.stage);
        if (payment.status !== 'pending') return settleFailed(payment);
      }
      const request = await fetchRequest(requestId);
      if (live.current && feeSettled(request, confirming.stage)) settlePaid(confirming.stage);
    } catch {
      // The next read tries again; nothing is decided from a read that failed.
    }
  }, [confirming, requestId, settlePaid, settleFailed]);

  useEffect(() => {
    if (!confirming) return undefined;
    const timer = setInterval(() => void check(), POLL_MS);
    return () => clearInterval(timer);
  }, [confirming, check]);

  const balance = useQuery({ ...walletBalanceQuery, enabled: Boolean(owner && quote && (quote.payment.balanceKobo ?? null) === null) });

  /**
   * Asks the Hub for the quote. Null when it could not be had: why is in `problem`, or the person was sent to Open your wallet (R-6). A page
   * that draws the fee before anything is tapped (`lead` false) is not sent anywhere: it says there is no wallet (`noWallet`) and offers it.
   */
  const ask = useCallback(
    async (lead = true): Promise<FeeQuote | null> => {
      try {
        const got = await fetchFeeQuote(requestId);
        if (!live.current) return null;
        setQuote(got);
        setProblem(null);
        setNoWallet(false);
        return got;
      } catch (error) {
        if (!live.current) return null;
        if (isApiError(error) && error.code && WALLET_NOT_READY.includes(error.code)) {
          if (lead) args.onOpenWallet();
          else setNoWallet(true);
        } else setProblem(sentence(error));
        return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requestId],
  );

  /** A page that draws the fee before anything is tapped (S22) loads the quote this way. */
  const load = useCallback(async () => {
    setLoading(true);
    await ask(false);
    if (live.current) setLoading(false);
  }, [ask]);

  const open = (next: FeeQuote) => {
    setQuote(next);
    setStatus({ kind: 'review' });
    setShortOf(null);
    setPayOpen(true);
  };

  /** S19: the pay sheet opens over the booking, with a fresh quote. */
  const start = async () => {
    if (tapping.current || confirming) return;
    tapping.current = true;
    setProblem(null);
    setLoading(true);
    try {
      // An attempt that was sent and never settled is shown as it was sent.
      if (attempt.current) return open(attempt.current.quote);
      const got = await ask();
      if (got) open(got);
    } finally {
      tapping.current = false;
      if (live.current) setLoading(false);
    }
  };

  /** Pay: a fresh quote, then the PIN. Not for an attempt already sent: that one goes again as it was. */
  const pay = async () => {
    if (!quote || tapping.current) return;
    tapping.current = true;
    try {
      if (!attempt.current) {
        const again = await ask();
        if (!again) {
          setPayOpen(false);
          return;
        }
        if (again.payment.totalKobo !== quote.payment.totalKobo) {
          setNotice(PRICE_CHANGED_LINE);
          return;
        }
      }
      setPinOpen(true);
    } finally {
      tapping.current = false;
    }
  };

  const submitPin = async (pin: string): Promise<PinCheckResult> => {
    if (!quote || !owner) return { code: 'unanswered' };
    const sending = attempt.current ?? { quote, key: newRequestKey() };
    attempt.current = sending;
    const outcome = await payFee({
      requestId,
      expectedTotalKobo: sending.quote.payment.totalKobo,
      quoteToken: sending.quote.payment.quoteToken,
      key: sending.key,
      pin,
    });
    // The Hub gave an answer that proves nothing moved for the key: the attempt is not kept, the next tap asks again.
    const nothingMoved = () => {
      attempt.current = null;
    };
    switch (outcome.kind) {
      case 'pin_incorrect':
        return { code: 'pin_incorrect', triesLeft: outcome.triesLeft };
      case 'pin_locked':
        nothingMoved();
        setLockedUntil(outcome.lockedUntil);
        return { code: 'pin_locked', lockedUntil: outcome.lockedUntil };
      case 'unanswered':
        return { code: 'unanswered' };
      case 'done': {
        const stage = outcome.payment.stage;
        if (outcome.payment.status === 'paid') settlePaid(stage);
        else if (outcome.payment.status === 'pending') {
          // Taken, not finished: read until it is decided; the person is never asked to pay again.
          setConfirming({ stage, paymentId: outcome.payment.id });
          setPinOpen(false);
          setStatus({ kind: 'confirming', line: CONFIRMING_LINE });
        } else settleFailed(outcome.payment);
        return { code: 'approved' };
      }
      case 'in_progress':
        setConfirming({ stage: quote.stage, paymentId: null });
        setPinOpen(false);
        setStatus({ kind: 'confirming', line: CONFIRMING_LINE });
        return { code: 'approved' };
      case 'pin_not_set':
        nothingMoved();
        setPinOpen(false);
        args.onSetPin();
        return { code: 'approved' };
      case 'no_wallet':
        nothingMoved();
        setPinOpen(false);
        setPayOpen(false);
        args.onOpenWallet();
        return { code: 'approved' };
      case 'insufficient_funds':
        // The bank's own figures now: the sheet's "not enough" reads them, and the key is spent on nothing.
        nothingMoved();
        setPinOpen(false);
        setShortOf(outcome.balanceKobo);
        return { code: 'approved' };
      case 'quote_changed':
        // The fee moved with the stage: no payment exists for the key, so this is a new attempt with the quote the Hub gave.
        nothingMoved();
        setPinOpen(false);
        if (outcome.quote) setQuote({ ...quote, priceKobo: outcome.quote.priceKobo, payment: outcome.quote });
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

  const cancel = () => {
    setPayOpen(false);
    setPinOpen(false);
    setStatus({ kind: 'review' });
  };

  // What the sheet and the page draw, from the quote as it stands.
  const payment = quote?.payment ?? null;
  const balanceKobo = shortOf ?? payment?.balanceKobo ?? balance.data?.availableKobo;
  const wallet: PayWallet = balanceKobo !== undefined && balanceKobo !== null ? { kind: 'open', balanceKobo } : { kind: 'loading' };
  const limit = payment ? limitLine(payment) : null;
  const blocked: PayStatus | null =
    payment === null
      ? null
      : limit !== null
        ? { kind: 'blocked', title: OVER_LIMIT_TITLE, message: limit }
        : quoteAddsUp(payment)
          ? null
          : { kind: 'blocked', title: NO_TOTAL_TITLE, message: 'Try again to ask for the total once more.', tryAgain: true };

  return {
    quote,
    fees: payment ? feeLines(payment.fee) : [],
    wallet,
    status: blocked !== null && status.kind === 'review' ? blocked : status,
    payOpen,
    pinOpen,
    lockedUntil,
    loading,
    noWallet,
    problem,
    notice,
    clearNotice: () => setNotice(null),
    confirming: confirming !== null,
    load,
    start,
    pay,
    submitPin,
    cancel,
    closePin: () => setPinOpen(false),
    forgotPin: () => {
      setPinOpen(false);
      args.onForgotPin();
    },
    addMoney: args.onAddMoney,
    openWallet: () => {
      cancel();
      args.onOpenWallet();
    },
    tryAgain: () => {
      setStatus({ kind: 'review' });
      void ask();
    },
    refresh: () => void check(),
  };
}

export type LegalFeePay = ReturnType<typeof useLegalFeePay>;
