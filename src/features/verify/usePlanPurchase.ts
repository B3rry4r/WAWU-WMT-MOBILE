import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { isNoWallet, useOpenWalletEntry } from '@/features/open-wallet/entry';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { newRequestKey } from '@/features/wallet/api/settings';

import { buy, fetchPurchase, fetchQuote, purchaseQuery, targetId, type Purchase, type PurchaseQuote, type PurchaseTarget } from './purchaseApi';
import { dropIntent, findIntent, putIntent } from './purchaseIntent';
import { CHANGED_LINE, failedLine, NOT_READY_LINE, quoteMoved, SHORT_LINE } from './purchaseModel';
import { isApprovalStop, stopResult, type Credential, type Settled } from '@/features/device-approval';

/** How often a purchase the Hub has not finished is read again (`GET /plans/purchases/{id}`, our own record). Default (agent), owner may override. */
export const POLL_MS = 4000;

/** The request this screen is sending: one key and what it carries. `sent` once it has left the phone with no answer that proves anything. */
type Attempt = { key: string; target: PurchaseTarget; method: 'wallet' | 'transfer'; expectedTotalKobo: number; quoteToken: string; sent: boolean };

export type PlanPurchaseOptions = {
  /** No PIN is set yet: A9 sets one and comes back. */
  onSetPin: () => void;
  /** An unanswered purchase of this same plan, left by an earlier visit, is sent again as it was (with the offer it was sent with). */
  onAdopt?: (target: PurchaseTarget) => void;
};

const sameThing = (a: PurchaseTarget, b: PurchaseTarget): boolean => a.kind === b.kind && ('tierId' in a ? 'tierId' in b && a.tierId === b.tierId : !('tierId' in b));

/**
 * Pays for a plan once (V8), with a fresh quote for each attempt: a tier, its renewal or upgrade, or five more products.
 *
 * Tapping Pay asks the Hub for a new quote of the target: figures that moved since the person looked are put on screen and nothing is
 * sent; the same figures open the PIN sheet and the request carries that quote's token. One `Idempotency-Key` per attempt, kept on the
 * phone (`./purchaseIntent`) until the Hub gives a final answer: a wrong PIN, a request that got no answer and a second tap all send the
 * SAME request, so one tier is bought and one debit made. The Hub's answers: `paid` is the grant; `pending` (the bank has not confirmed)
 * is read by its id, never sent again; `awaiting_transfer` shows the wallet's own account to send to and completes when the money lands;
 * `failed` says why in the Hub's words. Nobody has a wallet until they open one (R-6): the quote says so and the way in opens, once.
 */
export function usePlanPurchase(target: PurchaseTarget, options: PlanPurchaseOptions) {
  const owner = useSessionAccount(undefined);
  const entry = useOpenWalletEntry();
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const [looked, setLooked] = useState(false);
  const [picked, setPicked] = useState<'wallet' | 'transfer'>('wallet');
  const [round, setRound] = useState(0);
  // A quote that moved while the person looked, kept for the round it was read in: a later read replaces it.
  const [fresh, setFresh] = useState<{ quote: PurchaseQuote; round: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [resend, setResend] = useState(false);
  const [done, setDone] = useState<Purchase | null>(null);
  const [watching, setWatching] = useState<string | null>(null);
  const attempt = useRef<Attempt | null>(null);
  const inFlight = useRef<Promise<Settled> | null>(null);
  // Set the moment Pay is tapped and cleared when the fresh price is in: `busy` is state and lags the tap by a render, so a second tap in the same tick would ask again.
  const asking = useRef(false);
  const wanted = targetId(target);

  // The phone is asked once for a purchase an earlier visit left: one sent with no answer is sent again as it was; one the Hub has not finished is read by its id.
  useEffect(() => {
    if (!owner) return undefined;
    let current = true;
    void findIntent(owner).then((intent) => {
      if (!current) return;
      if (intent && sameThing(intent.target, target)) {
        optionsRef.current.onAdopt?.(intent.target);
        setPicked(intent.method);
        if (intent.phase === 'pending' && intent.purchaseId) setWatching(intent.purchaseId);
        else {
          attempt.current = { key: intent.key, target: intent.target, method: intent.method, expectedTotalKobo: intent.expectedTotalKobo, quoteToken: intent.quoteToken, sent: true };
          setResend(true);
        }
      }
      setLooked(true);
    });
    return () => {
      current = false;
    };
    // The target is read once, when the phone is asked: a person who changes the offer later is making a new attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner]);

  const quoted = useQuery(
    {
      queryKey: ['plans', 'purchase-quote', owner ?? '', wanted, round] as const,
      queryFn: () => fetchQuote(target),
      enabled: Boolean(owner) && looked && done === null,
      staleTime: Infinity,
      gcTime: 0,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
      placeholderData: (previous: PurchaseQuote | undefined) => previous,
    },
    queryClient,
  );
  const quote = fresh && fresh.round === round && targetId(fresh.quote.target) === wanted ? fresh.quote : quoted.data && targetId(quoted.data.target) === wanted ? quoted.data : null;

  const led = useRef(false);
  useEffect(() => {
    if (isNoWallet(quoted.error) && !led.current) {
      led.current = true;
      entry.open();
    }
  }, [quoted.error, entry]);

  const refresh = useCallback(() => {
    // The tier, the products, the wallet and everything that reads them: a quote is never re-read after the purchase it was for.
    for (const key of [['profile'], ['verification'], ['points', 'me'], ['money'], ['uploads']]) void queryClient.invalidateQueries({ queryKey: key });
  }, []);

  // The Hub decided a purchase it had not finished: the grant, or why it did not go through.
  const decide = useCallback(
    (p: Purchase) => {
      if (owner) void findIntent(owner).then((intent) => (intent ? dropIntent(owner, intent.key) : undefined));
      attempt.current = null;
      refresh();
      setWatching(null);
      if (p.status === 'paid') setDone(p);
      else {
        setFailure(failedLine(p));
        setRound((r) => r + 1);
      }
    },
    [owner, refresh],
  );
  const decideRef = useRef(decide);
  useEffect(() => {
    decideRef.current = decide;
  });

  // A purchase the Hub has not finished is read until it is decided (a bank transfer waits for the money; a debit waits for the bank).
  const polled = useQuery(
    {
      ...purchaseQuery(owner, watching),
      queryFn: async () => {
        const p = await fetchPurchase(watching as string);
        if (p.status === 'paid' || p.status === 'failed' || p.status === 'reversed' || p.status === 'refunded' || p.status === 'expired') decideRef.current(p);
        return p;
      },
      refetchInterval: (query) => {
        const s = query.state.data?.status;
        return s === undefined || s === 'pending' || s === 'awaiting_transfer' ? POLL_MS : false;
      },
    },
    queryClient,
  );
  const waiting = watching !== null ? (polled.data ?? null) : null;

  const walletShort = quote !== null && quote.shortfallKobo !== null && quote.shortfallKobo > 0;
  const paying = busy || watching !== null;
  // Bank transfer is offered only when the wallet is short (POINTS-06, the lead's ruling of 17 Oct 2026): a wallet that covers the
  // total is paid from by the Hub. A transfer already under way (kept on the phone, awaiting the money, or with its PIN open) stays.
  const transferOffered = walletShort || paying || resend || pinOpen;
  const method: 'wallet' | 'transfer' = picked === 'transfer' && transferOffered ? 'transfer' : 'wallet';
  const short = method === 'wallet' && walletShort;

  const pay = async () => {
    if (asking.current || pinOpen || paying || !owner || !quote) return;
    // Sent with no answer: the same request goes again, never a new quote and never a new key.
    if (attempt.current?.sent) {
      setPinOpen(true);
      return;
    }
    asking.current = true;
    setBusy(true);
    setFailure(null);
    try {
      const now = await fetchQuote(target);
      if (quoteMoved(quote, now)) {
        setFresh({ quote: now, round });
        setNotice(CHANGED_LINE);
        return;
      }
      attempt.current = { key: newRequestKey(), target, method, expectedTotalKobo: now.totalKobo, quoteToken: now.quoteToken, sent: false };
      setPinOpen(true);
    } catch (error) {
      if (!entry.leadIfNoWallet(error)) setNotice(isApiError(error) ? error.message : 'We could not check the price. Try again.');
    } finally {
      asking.current = false;
      setBusy(false);
    }
  };

  const closePin = () => {
    setPinOpen(false);
    // A request that never left the phone is not kept: the next Pay asks for a fresh quote.
    if (attempt.current && !attempt.current.sent) attempt.current = null;
  };

  const submit = async (credential: Credential): Promise<Settled> => {
    const sending = attempt.current;
    if (!sending || !owner) return { code: 'unanswered' };
    const kept = await putIntent(owner, { key: sending.key, target: sending.target, method: sending.method, expectedTotalKobo: sending.expectedTotalKobo, quoteToken: sending.quoteToken, phase: 'unknown', purchaseId: null, at: Date.now() });
    // A request the phone could not keep is not sent: it could not be protected from being bought twice.
    if (!kept) {
      setPinOpen(false);
      attempt.current = null;
      setNotice(NOT_READY_LINE);
      return { code: 'approved' };
    }
    attempt.current = { ...sending, sent: true };
    const outcome = await buy({ target: sending.target, method: sending.method, expectedTotalKobo: sending.expectedTotalKobo, quoteToken: sending.quoteToken, key: sending.key, ...credential });
    // THE RULE (FIX-108 finding, FIX-112): a closed prompt or a failed approval changes nothing held for this payment (its key, its quote,
    // any record that an earlier try may have moved money); only the sheet is told. Taken before every other answer.
    if (isApprovalStop(outcome)) return stopResult(outcome);
    // The Hub gave an answer that proves nothing was bought for the key: it is free for the next try.
    const nothingMoved = () => {
      void dropIntent(owner, sending.key);
      attempt.current = { ...sending, sent: false };
    };
    const start = () => {
      void dropIntent(owner, sending.key);
      attempt.current = null;
      setResend(false);
      setPinOpen(false);
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
        return { code: 'unanswered' };
      case 'pin_not_set':
        start();
        optionsRef.current.onSetPin();
        return { code: 'approved' };
      case 'no_wallet':
        start();
        entry.open();
        return { code: 'approved' };
      case 'insufficient_funds':
        start();
        setRound((r) => r + 1);
        setNotice(SHORT_LINE);
        return { code: 'approved' };
      case 'quote_changed':
        // No purchase exists for the key: this is a new attempt, asked for from the quote as it stands now.
        start();
        setFresh(null);
        setRound((r) => r + 1);
        setNotice(outcome.message || CHANGED_LINE);
        return { code: 'approved' };
      case 'refused':
        start();
        setNotice(outcome.message || 'We could not take this payment. Nothing was changed.');
        return { code: 'approved' };
      case 'done': {
        const p = outcome.purchase;
        setPinOpen(false);
        setResend(false);
        refresh();
        if (p.status === 'paid') {
          void dropIntent(owner, sending.key);
          attempt.current = null;
          setDone(p);
        } else if (p.status === 'pending' || p.status === 'awaiting_transfer') {
          // The Hub took it and has not finished: read it by its id, never send it again.
          void putIntent(owner, { key: sending.key, target: sending.target, method: sending.method, expectedTotalKobo: sending.expectedTotalKobo, quoteToken: sending.quoteToken, phase: 'pending', purchaseId: p.id, at: Date.now() });
          setWatching(p.id);
        } else {
          void dropIntent(owner, sending.key);
          attempt.current = null;
          setFailure(failedLine(p));
          setRound((r) => r + 1);
        }
        return { code: 'approved' };
      }
    }
  };

  // One request at a time: a second submit while one is running is that same request, never another. Pays with the PIN, or with the
  // phone's fingerprint or face approval of exactly this request (FIX-112): one path for both.
  const run = (credential: Credential): Promise<Settled> => {
    if (inFlight.current) return inFlight.current;
    const running = submit(credential).finally(() => {
      inFlight.current = null;
    });
    inFlight.current = running;
    return running;
  };

  return {
    owner,
    /** The phone has been asked for an unfinished purchase of an earlier visit (the quote waits for it). */
    looked,
    quote,
    quoteError: quoted.isError && !isNoWallet(quoted.error) ? quoted.error : null,
    retryQuote: () => setRound((r) => r + 1),
    method,
    setMethod: setPicked,
    transferOffered,
    walletShort,
    short,
    busy,
    paying,
    resend,
    pinOpen,
    lockedUntil,
    failure,
    notice,
    clearNotice: () => setNotice(null),
    /** The purchase the Hub is still finishing (pending, or a bank transfer awaiting the money), as it reads now. */
    waiting,
    /** The purchase once the Hub has granted it. */
    done,
    pay: () => void pay(),
    closePin,
    run,
    /** Asks the Hub about a purchase it has not finished, now ("I've sent it"). */
    checkNow: () => void polled.refetch(),
    checking: polled.isFetching,
  };
}
