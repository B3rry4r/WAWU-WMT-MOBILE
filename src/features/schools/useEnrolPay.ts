import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { isApiError } from '@/api/errors';
import { walletBalanceQuery } from '@/api/money';
import { queryClient } from '@/api/query';
import type { PayStatus, PayWallet } from '@/components/pay-sheet';
import type { PaymentQuote } from '@/features/events/buyApi';
import { feeLines, limitLine, NO_TOTAL_TITLE, NOT_READY_LINE, OVER_LIMIT_TITLE, PRICE_CHANGED_LINE, quoteAddsUp } from '@/features/events/buyModel';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { newRequestKey } from '@/features/wallet/api/settings';

import { enrolKeys, fetchEnrolment, fetchFeeQuote, fetchPayment, OpenPaymentError, payFee, type Enrolment, type FeePayment } from './enrolApi';
import { dropEnrolIntent, findEnrolIntent, putEnrolIntent, type EnrolIntent } from './enrolIntent';
import { failedLine, PRICE_UNREADABLE } from './enrolModel';
import { isApprovalStop, notApproved, stopCode, type Credential, type Settled } from '@/features/device-approval';

/**
 * How often an enrolment whose payment the Hub has not finished is read again (`GET /schools/enrolments/{id}`, our own records), and
 * the payment itself beside it (`GET /money/payments/{id}`, MONEY-17), so a payment that fails is told.
 * PROVISIONAL(SCHOOL-ENROL-POLL, owner=SCHOOLS-06, why=no ruling sizes it; four seconds is the send's and the tickets' own read).
 */
const POLL_MS = 4000;

export type EnrolPayArgs = {
  /** The enrolment being paid: `reserved`. */
  enrolment: Enrolment;
  /** The pay sheet was dismissed with nothing paid: leave the screen (the place stays held for a while). A price that could not be worked out does not leave: the page says so and offers Try again. */
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
  run: (credential: Credential) => Promise<Settled>;
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
  // The first quote for the held place could not be asked for (the Hub's word, or ours when it gave none): the page stays, with the
  // place still held, and says so with Try again (the tier checkout's, the tip sheet's and Buy points' own state, FIX-100 #2).
  const [quoteProblem, setQuoteProblem] = useState<string | null>(null);
  const lastProblem = useRef<string | null>(null);
  // A payment of this person's that the Hub has not finished and this phone did not start (a second phone): the Hub named it when it
  // refused the quote. Never kept: asking for the quote again names it again.
  const [openId, setOpenId] = useState<string | null>(null);

  // One key per payment attempt: the same quote is paid with the same key.
  const payKey = useRef<{ token: string; key: string } | null>(null);
  const startedFor = useRef<string | null>(null);
  // Set when a quote could not be asked for because there is no wallet yet: the person is already being taken to Open your wallet.
  const walletLed = useRef(false);
  // Set when a quote was refused because a payment is already being confirmed: the screen is already drawing that, not leaving.
  const waiting = useRef(false);
  // The payment whose failure was already handled, so a read that comes twice shows it once.
  const failureHandled = useRef<string | null>(null);
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

  const confirming = intent?.phase === 'processing' || openId !== null;
  // The Hub's id for the payment being waited for: the one its answer gave this phone, or the one it named to a second phone.
  const watched = intent?.phase === 'processing' ? (intent.paymentId ?? openId) : openId;

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

  // The payment read beside it while confirming: when it fails the person is told, the money is back, and Pay runs again.
  const paymentRead = useQuery(
    {
      queryKey: ['money', 'payment', watched],
      queryFn: () => fetchPayment(watched ?? ''),
      enabled: Boolean(owner && confirming && watched),
      refetchInterval: confirming && watched ? POLL_MS : false,
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
    waiting.current = false;
    try {
      return await fetchFeeQuote(enrolment.id);
    } catch (error) {
      if (error instanceof OpenPaymentError) {
        // A payment of theirs is already being confirmed: no Pay is drawn, the screen waits for it like the phone that started it.
        waiting.current = true;
        setOpenId(error.paymentId);
        return undefined;
      }
      if (!leadToWallet(error)) {
        lastProblem.current = isApiError(error) && error.message ? error.message : PRICE_UNREADABLE;
        setNotice(lastProblem.current);
      }
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

  // The quote for a held place, asked as the screen opens and again by Try again. A quote the Hub could not give keeps the page (the
  // place is still held) and says what went wrong; only a wallet that has to be opened, or a payment already being confirmed, is
  // answered by something other than this page.
  const firstQuote = () => {
    setQuoteProblem(null);
    setLoadingQuote(true);
    void askQuote()
      .then((quote) => {
        if (quote) {
          setNotice(null);
          setFresh(quote);
          setStatus({ kind: 'review' });
          setPayOpen(true);
        } else if (!walletLed.current && !waiting.current) {
          setNotice(null);
          setQuoteProblem(lastProblem.current ?? PRICE_UNREADABLE);
        }
      })
      .finally(() => setLoadingQuote(false));
  };

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
    queueMicrotask(firstQuote);
    // The quote is asked for once per opening of the screen; later taps ask again from `pay`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent, enrolment.id, shown]);

  // A payment the Hub has decided needs no intent kept for it: the phone lets it go when the enrolment shows the answer.
  const decided = polled.data && polled.data.status !== 'reserved' ? polled.data.id : null;
  useEffect(() => {
    if (decided && intent) queueMicrotask(() => void keep(null, intent));
  }, [decided, intent, keep]);

  // The payment being waited for came back failed (or reversed): nothing was taken, the money is back. The attempt is let go, the
  // failure is shown on the pay sheet, and Pay runs again with a fresh quote and a new key.
  const failedPayment: FeePayment | null =
    paymentRead.data && (paymentRead.data.status === 'failed' || paymentRead.data.status === 'reversed') ? paymentRead.data : null;
  useEffect(() => {
    if (!failedPayment || failureHandled.current === failedPayment.id) return;
    failureHandled.current = failedPayment.id;
    const line = failedLine(failedPayment.failureReason ?? failedPayment.statusMessage);
    // Started as a callback after this render: reacting to a read is not part of drawing the screen.
    queueMicrotask(() => {
      payKey.current = null;
      setOpenId(null);
      if (intent) void keep(null, intent);
      afterMoney();
      void askQuote().then((quote) => {
        if (quote) {
          setFresh(quote);
          setStatus({ kind: 'failed', message: line });
          setPayOpen(true);
        } else if (!waiting.current && !walletLed.current) {
          setNotice(line);
        }
      });
    });
    // `askQuote` and `afterMoney` are rebuilt each render; the failure is handled once per payment (the ref above).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failedPayment, intent, keep]);

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

  /** Pays with the PIN, or with the phone's fingerprint or face approval of exactly this request (FIX-112): one path for both. */
  const run = async (credential: Credential): Promise<Settled> => {
    if (!payment || !owner || intent === undefined) return { code: 'unanswered' };
    // The request this payment carries: the one already sent (same key, same body) or the first one, made now from what is on screen.
    // An earlier try under this key that the Hub may have taken: the store has it as unknown, read before this try writes its own.
    const earlierTry = intent?.phase === 'unknown';
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
      ...credential,
    });
    // The Hub gave an answer that proves nothing moved for the key: the intent is not kept, the key is free for the next try.
    const nothingMoved = () => keep(null, sending);
    // THE RULE (FIX-108 round 2, FIX-112): a closed or refused fingerprint proves nothing about an earlier try under this key. It is settled
    // by `notApproved`: the key and an earlier try's stored intent stay, and only a first try lets go of what it wrote itself.
    if (isApprovalStop(outcome)) {
      return notApproved(stopCode(outcome), earlierTry, () => void nothingMoved());
    }
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
        // Completed or pending: the Hub has the payment. The enrolment and the payment are read until it is decided; the person is never
        // asked to pay again.
        void keep({ ...sending, phase: 'processing', paymentId: outcome.payment.id });
        closeSheets();
        afterMoney();
        return { code: 'approved' };
      }
      case 'in_progress':
        void keep({ ...sending, phase: 'processing', paymentId: outcome.paymentId ?? sending.paymentId ?? null });
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
      run,
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
    /** The quote for the held place could not be asked for: what the Hub (or the app) says went wrong. Null otherwise. */
    quoteProblem,
    /** Try again on that state: the quote is asked for once more. */
    retryQuote: firstQuote,
    /** The Hub has the payment and has not finished: the enrolment is read until it is decided. */
    confirming,
    refreshing: polled.isFetching || paymentRead.isFetching,
    refresh: () => {
      void polled.refetch();
      if (watched) void paymentRead.refetch();
    },
    refreshFailed: confirming && polled.isError,
    /** A notice for the screen to show (the price moved, the phone could not keep a record, a quote that could not be read). */
    notice,
    clearNotice: () => setNotice(null),
  };
}
