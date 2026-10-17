import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isApiError } from '@/api/errors';
import type { PayStatus } from '@/components/pay-sheet';
import type { PinCheckResult } from '@/components/pin-sheet';
import { creditsKey } from '@/features/communities/api';
import { attemptFor, dropAttempt, keepAttempt, type Attempt } from '@/features/money-attempt/attempts';
import { newRequestKey } from '@/features/wallet/api/settings';

import {
  buyPack,
  fetchPacks,
  fetchPackQuote,
  fetchPurchase,
  packQuoteKey,
  packsKey,
  purchaseKey,
  type PackId,
  type PackPurchase,
  type PackQuote,
} from './api';
import { affordablePack, defaultPack, PRICE_CHANGED_LINE, quoteAddsUp, quoteSpent } from './model';

/** How often a purchase the Hub has not finished is read again (`GET /credits/purchase/wallet/{id}`, our own records). Default (agent), owner may override. */
const POLL_MS = 4000;
const WALLET_NOT_READY = ['wallet_not_open', 'wallet_opening'];

export type BuyCreditsArgs = {
  /** The sheet is open: nothing is asked of the Hub while it is closed. */
  visible: boolean;
  /** Closes the sheet (a person with no wallet is led away). */
  onClose: () => void;
  /** No wallet yet (R-6): Open your wallet. */
  onOpenWallet: () => void;
  /** No PIN is set yet: A9 sets one. */
  onSetPin: () => void;
  /** Forgot PIN? (W37). */
  onForgotPin: () => void;
  /** Add money for the shortfall (kobo). */
  onAddMoney: (shortfallKobo: number) => void;
};

/** What I29 draws: what was bought, what it cost with the bank's charge, and the person's count now. */
export type CreditsAdded = { credits: number; totalKobo: number; balance: number | null };

const subjectOf = (pack: PackId) => `pack:${pack}`;

/**
 * Buying credits from the wallet, from I28 to I29 (INBOX-13): the packs, the quote for the chosen one, the PIN, the purchase and
 * the still-confirming state. A fresh quote is asked for on every tap on Buy, and the PIN sheet opens only when its total is the one
 * on screen (a changed total is shown first). One `Idempotency-Key` per attempt: a wrong PIN, a request that got no answer and a PIN
 * typed again all send the SAME key and the SAME quote, so the wallet is charged once; the attempt outlives the sheet
 * (`money-attempt/attempts`). A purchase the Hub took and has not finished is only read, never bought again. A person with no
 * wallet is led to Open your wallet and the sheet closes; a short wallet shows what is missing and offers Add money.
 */
export function useBuyCredits(args: BuyCreditsArgs) {
  const { visible } = args;
  const client = useQueryClient();
  const [chosen, setChosen] = useState<PackId | null>(null);
  const [opening, setOpening] = useState<{ decided: boolean; pack: PackId | null }>({ decided: false, pack: null });
  const [fresh, setFresh] = useState<{ pack: PackId; quote: PackQuote } | null>(null);
  const [tapping, setTapping] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [shortOf, setShortOf] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [status, setStatus] = useState<PayStatus>({ kind: 'review' });
  const [pendingIdNow, setPendingId] = useState<string | null>(null);
  const [confirmingNow, setConfirmingPack] = useState<PackId | null>(null);
  const [added, setAdded] = useState<CreditsAdded | null>(null);
  const handled = useRef<string | null>(null);
  const led = useRef(false);

  const packs = useQuery({ queryKey: packsKey, queryFn: fetchPacks, enabled: visible, staleTime: 0 });
  const list = useMemo(() => packs.data ?? [], [packs.data]);
  // The sheet opens on the pack the Hub marks popular; a held attempt for another pack shows that pack, whose purchase is still open.
  const heldPack = list.find((candidate) => attemptFor(subjectOf(candidate.pack)) !== null)?.pack ?? null;
  const pack: PackId | null = chosen ?? heldPack ?? opening.pack ?? defaultPack(list);

  const held = pack ? attemptFor<PackQuote>(subjectOf(pack)) : null;
  // A purchase kept as pending is read again by its id. It is not bought again.
  const keptPending = held?.phase === 'pending' ? held : null;
  const pendingId = pendingIdNow ?? keptPending?.paymentId ?? null;
  const confirmingPack = confirmingNow ?? (keptPending ? keptPending.quote.pack : null);

  const quoted = useQuery(
    {
      queryKey: packQuoteKey((pack ?? 'popular') as PackId),
      queryFn: () => fetchPackQuote(pack as PackId),
      enabled: visible && pack !== null && held === null && added === null,
      staleTime: 0,
      gcTime: 0,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
    },
  );

  // The sheet opens on the popular pack. When the wallet cannot pay for it and can pay for a smaller one, that one is drawn chosen
  // instead (the largest the wallet covers). Decided once per opening, and never over a pack the person picked or one with a purchase open.
  // Adjusted while rendering, not in an effect: the pack it moves to is drawn on the very next render, with no frame of the wrong one.
  if (!visible && opening.decided) setOpening({ decided: false, pack: null });
  const first = quoted.data;
  if (visible && !opening.decided && first && first.pack === pack && chosen === null && heldPack === null && pack === defaultPack(list)) {
    const short = first.payment.shortfallKobo;
    const smaller =
      short !== null && short > 0 ? affordablePack(list, first.payment.balanceKobo, first.payment.fee.providerFeeKobo + first.payment.fee.wawuFeeKobo) : null;
    setOpening({ decided: true, pack: smaller !== pack ? smaller : null });
  }

  const noWallet = isApiError(quoted.error) && !!quoted.error.code && WALLET_NOT_READY.includes(quoted.error.code);
  useEffect(() => {
    if (!visible) led.current = false;
    if (visible && noWallet && !led.current) {
      led.current = true;
      args.onClose();
      args.onOpenWallet();
    }
    // The two callbacks are the host's; a new one is no reason to lead the person away again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, noWallet]);

  const quote: PackQuote | null = held?.quote ?? (fresh && fresh.pack === pack ? fresh.quote : null) ?? quoted.data ?? null;

  const choose = (next: PackId) => {
    if (status.kind === 'paying' || pinOpen || tapping) return;
    setChosen(next);
    setFresh(null);
    setShortOf(null);
    setNotice(null);
    setStatus({ kind: 'review' });
  };

  const afterMoney = useCallback(() => {
    void client.invalidateQueries({ queryKey: ['money'] });
    void client.invalidateQueries({ queryKey: creditsKey });
  }, [client]);

  const settlePaid = useCallback(
    (purchase: PackPurchase, key: string | null) => {
      if (handled.current === `${purchase.id}:paid`) return;
      handled.current = `${purchase.id}:paid`;
      dropAttempt(subjectOf(purchase.pack), key ?? undefined);
      setPinOpen(false);
      setPendingId(null);
      setConfirmingPack(null);
      setFresh(null);
      setStatus({ kind: 'review' });
      setAdded({ credits: purchase.credits, totalKobo: purchase.payment.totalKobo, balance: purchase.creditBalance ?? null });
      afterMoney();
    },
    [afterMoney],
  );

  const settleFailed = useCallback(
    (purchase: PackPurchase, key: string | null) => {
      if (handled.current === `${purchase.id}:failed`) return;
      handled.current = `${purchase.id}:failed`;
      dropAttempt(subjectOf(purchase.pack), key ?? undefined);
      setPinOpen(false);
      setPendingId(null);
      setConfirmingPack(null);
      setFresh(null);
      setStatus({ kind: 'failed', message: purchase.statusMessage?.trim() || purchase.payment.failureReason?.trim() || 'This purchase did not go through. Nothing left your wallet.' });
      afterMoney();
    },
    [afterMoney],
  );

  const polled = useQuery(
    {
      queryKey: purchaseKey(pendingId ?? ''),
      queryFn: () => fetchPurchase(pendingId as string),
      enabled: visible && pendingId !== null,
      refetchInterval: (query) => (query.state.data?.status === 'pending' ? POLL_MS : false),
      staleTime: 0,
    },
  );
  useEffect(() => {
    const purchase = polled.data;
    if (!purchase || purchase.id !== pendingId || !polled.isFetchedAfterMount) return;
    const key = attemptFor<PackQuote>(subjectOf(purchase.pack))?.key ?? null;
    if (purchase.status === 'paid') queueMicrotask(() => settlePaid(purchase, key));
    else if (purchase.status === 'failed' || purchase.status === 'reversed') queueMicrotask(() => settleFailed(purchase, key));
  }, [polled.data, polled.isFetchedAfterMount, pendingId, settlePaid, settleFailed]);

  const confirming = (pendingId !== null && polled.data?.status !== 'paid' && polled.data?.status !== 'failed' && polled.data?.status !== 'reversed') || confirmingPack !== null;

  const leadToWallet = (error: unknown): boolean => {
    if (!isApiError(error) || !error.code || !WALLET_NOT_READY.includes(error.code)) return false;
    args.onClose();
    args.onOpenWallet();
    return true;
  };

  /** Buy: a fresh quote for this tap; the PIN opens only when its total is the one on screen. A purchase already sent is asked again as it was. */
  const buy = async () => {
    if (!pack || tapping || confirming || pinOpen) return;
    setNotice(null);
    if (status.kind === 'failed') setStatus({ kind: 'review' });
    if (held) {
      setPinOpen(true);
      return;
    }
    const shown = quote;
    if (!shown) return;
    setTapping(true);
    try {
      // A quote still inside its time is asked for again anyway: a fresh quote per tap.
      const again = await fetchPackQuote(pack);
      setFresh({ pack, quote: again });
      setShortOf(null);
      if (again.payment.totalKobo !== shown.payment.totalKobo || again.credits !== shown.credits) {
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
    if (!pack || !quote) return { code: 'unanswered' };
    // The request this purchase carries: the one already sent (same key, same quote) or the first one, made now from what is on screen.
    const sending: Attempt<PackQuote> = attemptFor<PackQuote>(subjectOf(pack)) ?? {
      subject: subjectOf(pack),
      key: newRequestKey(),
      quote,
      phase: 'sent',
      paymentId: null,
    };
    keepAttempt(sending);
    setStatus({ kind: 'paying' });
    const outcome = await buyPack({ pack, quote: sending.quote, key: sending.key, pin });
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
          client.setQueryData(purchaseKey(purchase.id), purchase);
          setPinOpen(false);
          setPendingId(purchase.id);
          setConfirmingPack(purchase.pack);
          setStatus({ kind: 'review' });
        } else settleFailed(purchase, sending.key);
        return { code: 'approved' };
      }
      case 'in_progress':
        keepAttempt({ ...sending, phase: 'pending', paymentId: null });
        setPinOpen(false);
        setConfirmingPack(pack);
        setStatus({ kind: 'review' });
        return { code: 'approved' };
      case 'pin_not_set':
        nothingMoved();
        setPinOpen(false);
        args.onClose();
        args.onSetPin();
        return { code: 'approved' };
      case 'no_wallet':
        nothingMoved();
        setPinOpen(false);
        args.onClose();
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
        void client.invalidateQueries({ queryKey: packQuoteKey(pack) });
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

  const reset = useCallback(() => {
    setAdded(null);
    // The next opening starts on the default pack again, after the wallet is read again.
    setChosen(null);
    setOpening({ decided: false, pack: null });
    setPinOpen(false);
    setNotice(null);
    setShortOf(null);
    setFresh(null);
    setStatus({ kind: 'review' });
  }, []);

  const balanceKobo = shortOf ?? quote?.payment.balanceKobo ?? null;
  const shortfallKobo =
    shortOf !== null && quote ? Math.max(0, quote.payment.totalKobo - shortOf) : quote?.payment.shortfallKobo != null && quote.payment.shortfallKobo > 0 ? quote.payment.shortfallKobo : 0;

  return useMemo(
    () => ({
      packs,
      list,
      pack,
      choose,
      quote,
      quoteError: quoted.isError && !noWallet && held === null ? quoted.error : null,
      quoteLoading: quote === null && quoted.isPending && !noWallet,
      retryQuote: () => void quoted.refetch(),
      balanceKobo,
      shortfallKobo,
      buy,
      tapping,
      pinOpen,
      closePin: () => setPinOpen(false),
      submitPin,
      forgotPin: () => {
        setPinOpen(false);
        args.onClose();
        args.onForgotPin();
      },
      lockedUntil,
      status,
      notice,
      confirming,
      refresh,
      refreshing: polled.isFetching,
      added,
      reset,
      addMoney: () => args.onAddMoney(shortfallKobo),
      dismissFailed: () => setStatus({ kind: 'review' }),
    }),
    // The handlers close over the state above; the memo only spares the sheet a re-render when nothing it draws changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [packs.data, packs.status, pack, quote, quoted.status, quoted.error, balanceKobo, shortfallKobo, tapping, pinOpen, lockedUntil, status, notice, confirming, polled.isFetching, added, held, noWallet],
  );
}
