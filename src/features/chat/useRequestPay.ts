import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { isApiError } from '@/api/errors';
import { walletBalanceQuery } from '@/api/money';
import type { PayStatus } from '@/components/pay-sheet';
import { attemptFor, dropAttempt, keepAttempt, type Attempt } from '@/features/money-attempt/attempts';
import { feeLinesFromParts } from '@/features/money-attempt/fees';
import { newRequestKey } from '@/features/wallet/api/settings';
import { failureLine, limitLine, quoteAddsUp, quoteSpent } from '@/features/send/model';

import type { MoneyRequest } from './api';
import { declineMoneyRequest, fetchFeeQuote, fetchMoneyRequest, payMoneyRequest, requestKey, type FeeQuote } from './requestApi';
import { isApprovalStop, noRecordToForget, notApproved, stopCode, type Credential, type Settled } from '@/features/device-approval';

/** How often a payment the provider has not confirmed is read again (`GET .../money-requests/{id}`, which settles it first). Default (agent), owner may override. */
const POLL_MS = 4000;
const WALLET_NOT_READY = ['wallet_not_open', 'wallet_opening'];

export const PRICE_CHANGED_LINE = 'The fees changed. Check the new total before you pay.';
export const CLOSED_LINE = 'This request is no longer open.';
export const REQUEST_CONFIRMING_LINE = 'We’re still confirming this payment. Don’t pay again. The request shows Paid when it is done.';

export type RequestPayArgs = {
  chatId: string;
  /** Puts a request's new state on its bubble. */
  patchRequest: (request: Pick<MoneyRequest, 'id'> & Partial<MoneyRequest>) => void;
  /** No wallet yet (R-6): Open your wallet. */
  onOpenWallet: () => void;
  /** No PIN is set yet: A9 sets one. */
  onSetPin: () => void;
  /** Forgot PIN? (W37). */
  onForgotPin: () => void;
  /** Add money for the shortfall (kobo). Opens Add money (W15) with the shortfall. A caller that leaves it out shows the short notice without the button. */
  onAddMoney?: (shortfallKobo: number) => void;
};

const subjectOf = (requestId: string) => `request:${requestId}`;

/**
 * Paying a request someone made in the chat, from the bubble's Pay to the bubble flipping to Paid (INBOX-20: I18, I19). A fresh fee quote is
 * asked for on every tap on Pay (a request already sent and not answered is asked again as it was), and the sheet shows what it costs
 * before the PIN: the bank's charge, WAWU's fee, the total, and what the other person gets (R-10). One `Idempotency-Key` per attempt, kept for
 * as long as the app runs: a wrong PIN, an answer that never came and a PIN typed again all send the SAME key and the SAME quote, so the
 * wallet is charged once; the Hub also pays a request once whatever the taps (two phones, a replay). A payment the provider has not confirmed
 * is read, never paid again. A request the other person cancelled, or that was paid, while this was going on says so and moves nothing.
 */
export function useRequestPay(args: RequestPayArgs) {
  const { chatId, patchRequest } = args;
  const client = useQueryClient();
  const [target, setTarget] = useState<MoneyRequest | null>(null);
  const [quote, setQuote] = useState<FeeQuote | null>(null);
  const [open, setOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [status, setStatus] = useState<PayStatus>({ kind: 'review' });
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [shortOf, setShortOf] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [declining, setDeclining] = useState<string | null>(null);
  const [watching, setWatching] = useState<string | null>(null);
  const handled = useRef<string | null>(null);

  const balance = useQuery({ ...walletBalanceQuery, enabled: open });

  const afterMoney = useCallback(() => {
    void client.invalidateQueries({ queryKey: ['money'] });
    void client.invalidateQueries({ queryKey: ['inbox'] });
  }, [client]);

  const closeAll = useCallback(() => {
    setPinOpen(false);
    setOpen(false);
    setTarget(null);
    setQuote(null);
    setShortOf(null);
    setStatus({ kind: 'review' });
  }, []);

  /** The request as the Hub holds it now, on its bubble. */
  const reread = useCallback(
    async (requestId: string) => {
      try {
        const now = await fetchMoneyRequest(chatId, requestId);
        patchRequest(now);
        return now;
      } catch {
        return null;
      }
    },
    [chatId, patchRequest],
  );

  const settlePaid = useCallback(
    (requestId: string, key: string | null) => {
      if (handled.current === `${requestId}:paid`) return;
      handled.current = `${requestId}:paid`;
      dropAttempt(subjectOf(requestId), key ?? undefined);
      patchRequest({ id: requestId, status: 'paid', paying: false });
      setWatching(null);
      closeAll();
      afterMoney();
    },
    [patchRequest, closeAll, afterMoney],
  );

  // A payment the provider has not confirmed: the request is read until it is decided. The Hub settles it on each read.
  const polled = useQuery({
    queryKey: requestKey(chatId, watching ?? ''),
    queryFn: () => fetchMoneyRequest(chatId, watching as string),
    enabled: watching !== null,
    refetchInterval: (query) => (query.state.data && (query.state.data.paying || query.state.data.status === 'pending') ? POLL_MS : false),
    staleTime: 0,
  });
  useEffect(() => {
    const request = polled.data;
    if (!request || request.id !== watching || !polled.isFetchedAfterMount) return;
    patchRequest(request);
    const key = attemptFor<FeeQuote>(subjectOf(request.id))?.key ?? null;
    if (request.status === 'paid') queueMicrotask(() => settlePaid(request.id, key));
    else if (!request.paying && request.status === 'pending') {
      // The payment did not go through: nothing moved, and the request is still open to pay again.
      queueMicrotask(() => {
        if (handled.current === `${request.id}:failed`) return;
        handled.current = `${request.id}:failed`;
        dropAttempt(subjectOf(request.id), key ?? undefined);
        setWatching(null);
        setStatus({ kind: 'failed', message: 'This payment did not go through. Nothing left your wallet.' });
        afterMoney();
      });
    } else if (request.status === 'declined' || request.status === 'cancelled') {
      queueMicrotask(() => {
        dropAttempt(subjectOf(request.id), key ?? undefined);
        setWatching(null);
        closeAll();
        setNotice(CLOSED_LINE);
      });
    }
  }, [polled.data, polled.isFetchedAfterMount, watching, patchRequest, settlePaid, closeAll, afterMoney]);

  const confirming = watching !== null && !(polled.data?.status === 'paid');

  const leadToWallet = (error: unknown): boolean => {
    if (!isApiError(error) || !error.code || !WALLET_NOT_READY.includes(error.code)) return false;
    closeAll();
    args.onOpenWallet();
    return true;
  };

  /** Tap on Pay in the bubble: a fresh quote, then the review sheet. A payment already sent for this request is shown as it was. */
  const start = async (request: MoneyRequest) => {
    if (starting || request.status !== 'pending' || request.paying) return;
    setNotice(null);
    const held = attemptFor<FeeQuote>(subjectOf(request.id));
    setTarget(request);
    setShortOf(null);
    setStatus({ kind: 'review' });
    if (held) {
      setQuote(held.quote);
      setOpen(true);
      if (held.phase === 'pending') setWatching(request.id);
      return;
    }
    setStarting(true);
    try {
      setQuote(await fetchFeeQuote(request.amountKobo));
      setOpen(true);
    } catch (error) {
      setTarget(null);
      if (!leadToWallet(error)) setNotice(isApiError(error) && error.message ? error.message : 'Check your connection and try again.');
    } finally {
      setStarting(false);
    }
  };

  /** Pay in the sheet: a quote past its time is asked for again first, and a changed total is shown before the PIN. */
  const pay = async () => {
    if (!target || !quote) return;
    const held = attemptFor<FeeQuote>(subjectOf(target.id));
    if (!held && quoteSpent(quote, Date.now())) {
      try {
        const again = await fetchFeeQuote(target.amountKobo);
        setQuote(again);
        if (again.totalKobo !== quote.totalKobo) {
          setNotice(PRICE_CHANGED_LINE);
          return;
        }
      } catch (error) {
        if (!leadToWallet(error)) setNotice(isApiError(error) && error.message ? error.message : 'Check your connection and try again.');
        return;
      }
    }
    setPinOpen(true);
  };

  /** Pays with the PIN, or with the phone's fingerprint or face approval of exactly this request (FIX-112): one path for both. */
  const run = async (credential: Credential): Promise<Settled> => {
    if (!target || !quote) return { code: 'unanswered' };
    // An earlier try of this payment that the Hub may have taken (its answer was lost) is held: this try repeats it.
    const earlierTry = attemptFor(subjectOf(target.id)) !== null;
    const sending: Attempt<FeeQuote> = attemptFor<FeeQuote>(subjectOf(target.id)) ?? {
      subject: subjectOf(target.id),
      key: newRequestKey(),
      quote,
      phase: 'sent',
      paymentId: null,
    };
    keepAttempt(sending);
    setStatus({ kind: 'paying' });
    const outcome = await payMoneyRequest({ chatId, requestId: target.id, quote: sending.quote, key: sending.key, ...credential });
    // THE RULE (FIX-108 round 2, FIX-112): a closed or refused fingerprint proves nothing about an earlier try under this key. It is settled
    // by `notApproved`: the key and an earlier try's stored intent stay, and only a first try lets go of what it wrote itself.
    if (isApprovalStop(outcome)) {
      setStatus({ kind: 'review' });
      return notApproved(stopCode(outcome), earlierTry, noRecordToForget);
    }
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
        const transfer = outcome.transfer;
        setPinOpen(false);
        if (transfer.status === 'completed') settlePaid(target.id, sending.key);
        else if (transfer.status === 'pending') {
          keepAttempt({ ...sending, phase: 'pending', paymentId: transfer.id });
          patchRequest({ id: target.id, paying: true });
          setStatus({ kind: 'review' });
          setWatching(target.id);
        } else {
          nothingMoved();
          setStatus({ kind: 'failed', message: failureLine(transfer) });
          afterMoney();
        }
        return { code: 'approved' };
      }
      case 'in_progress':
        keepAttempt({ ...sending, phase: 'pending', paymentId: null });
        setPinOpen(false);
        setStatus({ kind: 'review' });
        setWatching(target.id);
        return { code: 'approved' };
      case 'not_pending': {
        // The other person cancelled it, or it was paid, while this was going on: nothing moved.
        nothingMoved();
        setPinOpen(false);
        const now = await reread(target.id);
        closeAll();
        setNotice(now?.status === 'paid' ? 'This request was already paid.' : CLOSED_LINE);
        return { code: 'approved' };
      }
      case 'not_yours':
        nothingMoved();
        closeAll();
        setNotice(CLOSED_LINE);
        return { code: 'approved' };
      case 'pin_not_set':
        nothingMoved();
        closeAll();
        args.onSetPin();
        return { code: 'approved' };
      case 'no_wallet':
        nothingMoved();
        closeAll();
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
        setQuote(outcome.quote);
        setNotice(PRICE_CHANGED_LINE);
        return { code: 'approved' };
      case 'refused':
        nothingMoved();
        setPinOpen(false);
        setStatus({ kind: 'failed', message: outcome.message });
        return { code: 'approved' };
    }
  };

  /** Decline: the person says no; the bubble shows what the Hub answers. */
  const decline = async (request: MoneyRequest) => {
    if (declining) return;
    setDeclining(request.id);
    setNotice(null);
    try {
      patchRequest(await declineMoneyRequest(chatId, request.id));
    } catch (error) {
      setNotice(isApiError(error) && error.message ? error.message : 'Check your connection and try again.');
      await reread(request.id);
    } finally {
      setDeclining(null);
    }
  };

  const total = quote?.totalKobo ?? null;
  const balanceKobo = shortOf ?? balance.data?.availableKobo ?? null;
  const addsUp = quote ? quoteAddsUp(quote) : false;
  const limit = quote ? limitLine(quote) : null;
  const shortfallKobo = total !== null && balanceKobo !== null && balanceKobo < total ? total - balanceKobo : 0;

  return {
    start,
    starting,
    decline,
    declining,
    sheet: target && quote && open
      ? {
          request: target,
          quote,
          fees: feeLinesFromParts(quote.parts),
          balanceKobo,
          shortfallKobo,
          addsUp,
          limit,
          status,
          confirming,
          pinOpen,
          lockedUntil,
          pay,
          run,
          closePin: () => setPinOpen(false),
          cancel: closeAll,
          refresh: () => void polled.refetch(),
          retry: () => setStatus({ kind: 'review' }),
          addMoney: args.onAddMoney ? () => args.onAddMoney?.(shortfallKobo) : undefined,
          forgotPin: () => {
            setPinOpen(false);
            args.onForgotPin();
          },
        }
      : null,
    notice,
    clearNotice: () => setNotice(null),
  };
}
