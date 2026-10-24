import { useQuery } from '@tanstack/react-query';
import { useFocusEffect, usePathname } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Banner } from '@/components/Banner';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { KeyValueRow } from '@/components/ListRow';
import { PAYMENT_UNANSWERED_LINE } from '@/components/pin-sheet';
import { isApprovalStop, notApproved, PayPinSheet, stopCode, type Credential, type Settled } from '@/features/device-approval';
import { PointsFigure } from '@/components/PointsFigure';
import { EmptyState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { addMoneyHref } from '@/features/addmoney/entry';
import { useOpenWalletEntry } from '@/features/open-wallet/entry';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { newRequestKey } from '@/features/wallet/api/settings';
import { space } from '@/theme';

import { dropIntent, findIntent, putIntent } from './shortfallIntent';
import { buyShortfall, fetchJobQuote, fetchShortfall, shortfallQuery, type JobInput, type JobQuote, type Shortfall } from './studioApi';
import { CAP_WORDS, capTitle, naira, offerNote, pinPurpose, quoteMoved, SHEET_WORDS, sheetState, verdictOf, walletTotal } from './studioModel';
import { PointsFrame } from './PointsFrame';

/** The board's sheet stacks its parts 12 apart (points.js `pt3`, the sheet's second argument). */
const SHEET_GAP = space.md;
/** How often a purchase the Hub has not finished is read again (`GET /points/shortfall/{id}`, our own record). */
const POLL_MS = 4000;

export type JobCheckOptions = {
  /** The Hub says the points cover the job and no cap stops it: now, or after the missing points were bought. The quote's `quoteToken` is what the job carries. */
  onReady: (quote: JobQuote, job: JobInput) => void;
  /** Buy points (PT4): the sheet's Buy points, "Buy points instead". */
  onBuyPoints: () => void;
  /** PT3b's Add money, for the wallet's shortfall (kobo): the screen opens W15 with it (`addMoneyHref`, as every pay sheet does). The sheet closes first; when the screen is shown again the check starts again. */
  onAddMoney: (shortfallKobo: number) => void;
  /** Forgot PIN? (W37). */
  onForgotPin: () => void;
  /** No PIN is set yet: A9 sets one and comes back. */
  onSetPin: () => void;
  /** "Back to AI tools" on the daily limit (PT7). */
  onLeave: () => void;
};

/** The route Add money lives at (W15): a trip there is not leaving. */
const ADD_MONEY_PATH: string = addMoneyHref(0).pathname;

type View_ = { kind: 'sheet'; job: JobInput; quote: JobQuote } | { kind: 'cap'; job: JobInput; quote: JobQuote } | null;

/**
 * The check before a job runs (PT3, PT3a, PT3b, PT7), for the screen that runs one tool (POINTS-08's VoiceOver; every later tool). The
 * screen calls `check(job)` when the person taps Run; the Hub quotes the job (`POST /points/quote`: nothing held, nothing taken) and:
 *
 * - the points cover it and no cap stops it: `onReady(quote, job)`, and nothing is drawn here;
 * - a cap stops it (a daily or per-job limit): PT7, in the Hub's own words (it names the cap and when it resets);
 * - the points fall short: the sheet (PT3 the wallet pays the missing points, PT3b the wallet is too low for them, PT3a Use wallet is
 *   off: Buy points). Confirming asks for the PIN; the purchase buys exactly the shortfall, once, and the check starts again, so the job
 *   only runs when the Hub's own count says it can.
 *
 * `node` is rendered by the screen. `checking` is true while the quote is being asked for (the Run button's busy state).
 */
export function useJobCheck(options: JobCheckOptions): { check: (job: JobInput) => void; checking: boolean; node: ReactNode } {
  const [view, setView] = useState<View_>(null);
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const busy = useRef(false);
  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });
  // The job the person left for Add money (PT3b), and the screen they left from: when this screen is shown again the Hub quotes it again,
  // so the sheet that comes back is the one the new balance earns (PT3 to pay, PT3b once more, or the job running). The trip ends when
  // they come back, when they go anywhere that is not this screen or Add money, and when this screen goes away; after that nothing is
  // quoted unasked.
  const adding = useRef<{ job: JobInput; from: string } | null>(null);
  const pathname = usePathname();
  useEffect(() => {
    const trip = adding.current;
    if (trip && pathname !== trip.from && pathname !== ADD_MONEY_PATH) adding.current = null;
  }, [pathname]);
  useEffect(
    () => () => {
      adding.current = null;
    },
    [],
  );

  /** Puts a quote where it belongs: the job runs, or the cap, or the sheet. Returns whether the job is running. */
  const settle = useCallback((job: JobInput, quote: JobQuote) => {
    const verdict = verdictOf(quote);
    if (verdict === 'ready') {
      setView(null);
      latest.current.onReady(quote, job);
    } else if (verdict === 'cap') setView({ kind: 'cap', job, quote });
    else if (verdict === 'short') setView({ kind: 'sheet', job, quote });
    else {
      setView(null);
      setNotice(SHEET_WORDS.checkFailed);
    }
  }, []);

  const check = useCallback(
    (job: JobInput) => {
      if (busy.current) return;
      busy.current = true;
      setChecking(true);
      setNotice(null);
      fetchJobQuote(job)
        .then((quote) => settle(job, quote))
        .catch((error: unknown) => setNotice(isApiError(error) && error.message ? error.message : SHEET_WORDS.checkFailed))
        .finally(() => {
          busy.current = false;
          setChecking(false);
        });
    },
    [settle],
  );

  /** The quote again, after the sheet changed what is true (points bought, a price moved, a limit reached). */
  const requote = useCallback(
    async (job: JobInput): Promise<JobQuote | null> => {
      try {
        const quote = await fetchJobQuote(job);
        settle(job, quote);
        return quote;
      } catch (error) {
        setNotice(isApiError(error) && error.message ? error.message : SHEET_WORDS.checkFailed);
        return null;
      }
    },
    [settle],
  );

  useFocusEffect(
    useCallback(() => {
      const trip = adding.current;
      if (!trip) return;
      adding.current = null;
      void requote(trip.job);
    }, [requote]),
  );

  const node = (
    <>
      {view?.kind === 'sheet' ? (
        <ShortfallSheet
          key="shortfall"
          job={view.job}
          quote={view.quote}
          onClose={() => setView(null)}
          onBuyPoints={() => {
            setView(null);
            options.onBuyPoints();
          }}
          onAddMoney={(shortfallKobo) => {
            adding.current = { job: view.job, from: pathname };
            setView(null);
            options.onAddMoney(shortfallKobo);
          }}
          onForgotPin={() => {
            setView(null);
            options.onForgotPin();
          }}
          onSetPin={() => {
            setView(null);
            options.onSetPin();
          }}
          onRequote={(quote) => settle(view.job, quote)}
          onBought={() => void requote(view.job)}
        />
      ) : null}
      {view?.kind === 'cap' ? (
        <CapReachedScreen
          quote={view.quote}
          onBack={() => {
            setView(null);
            options.onLeave();
          }}
        />
      ) : null}
      {notice ? <Toast message={notice} tone="alert" placement="top" lines={2} onHide={() => setNotice(null)} testID="job-check-notice" /> : null}
    </>
  );
  return { check, checking, node };
}

/** What the sheet shows above its buttons when a try did not go as the person was shown. */
type SheetNotice = { title: string; body: string };

type ShortfallSheetProps = {
  job: JobInput;
  quote: JobQuote;
  onClose: () => void;
  onBuyPoints: () => void;
  onAddMoney: (shortfallKobo: number) => void;
  onForgotPin: () => void;
  onSetPin: () => void;
  /** The Hub's quote now, when it is not the one the person was shown (it moved, points arrived, a cap came into play). */
  onRequote: (quote: JobQuote) => void;
  /** The missing points were added: the check starts again. */
  onBought: () => void;
};

/** The request this sheet is sending: one key and what it carries. `sent` once it has left the phone with no answer that proves anything. */
type Attempt = { key: string; job: JobInput; expectedTotalKobo: number; quoteToken: string; sent: boolean };

/**
 * PT3 · Not enough points, with PT3a (Use wallet off) and PT3b (the wallet is too low too). Every figure is the Hub's quote: what the job
 * costs, what the person has, the shortfall, and the wallet money for exactly the shortfall (the Bank charge in it, BRIEF rule 5).
 * Nothing is taken until the PIN is entered.
 *
 * Once, with a fresh quote for each try (V8). Confirm asks the Hub for a new quote of the job: figures that moved since the person looked
 * are put on the sheet and nothing is sent; the same figures open the PIN sheet and the request carries that quote's token. One
 * `Idempotency-Key` per try, kept on the phone (`./shortfallIntent`) until the Hub gives a final answer: a wrong PIN, a request that got
 * no answer and a second tap all send the SAME request, so one purchase is made and one debit taken. A purchase the Hub has not finished
 * (`pending`) is read by its id, never sent again.
 *
 * An unresolved intent an earlier visit left comes first: it is finished as it was (sent again, or read) before any new one.
 */
export function ShortfallSheet(props: ShortfallSheetProps) {
  const { job, quote } = props;
  const owner = useSessionAccount(undefined);
  const entry = useOpenWalletEntry();
  const state = sheetState(quote);

  const [busy, setBusy] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  // The total the PIN sheet names: the request's own (a request sent earlier carries the total it was sent with).
  const [pinTotal, setPinTotal] = useState<number | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [notice, setNotice] = useState<SheetNotice | null>(null);
  const [resend, setResend] = useState(false);
  const [watching, setWatching] = useState<string | null>(null);
  const attempt = useRef<Attempt | null>(null);
  const inFlight = useRef<Promise<Settled> | null>(null);
  // Set the moment Confirm is tapped and cleared when the fresh quote is in: `busy` is state and lags the tap by a render.
  const asking = useRef(false);
  const latest = useRef(props);
  useEffect(() => {
    latest.current = props;
  });

  // The phone is asked once for a purchase an earlier visit left: one sent with no answer is sent again as it was; one the Hub has not finished is read by its id.
  useEffect(() => {
    if (!owner) return undefined;
    let current = true;
    void findIntent(owner).then((intent) => {
      if (!current || !intent) return;
      if (intent.phase === 'pending' && intent.shortfallId) setWatching(intent.shortfallId);
      else {
        attempt.current = {
          key: intent.key,
          job: { action: intent.action, units: intent.units, ...(intent.languages ? { languages: intent.languages } : {}), ...(intent.characters ? { characters: intent.characters } : {}) },
          expectedTotalKobo: intent.expectedTotalKobo,
          quoteToken: intent.quoteToken,
          sent: true,
        };
        setResend(true);
      }
    });
    return () => {
      current = false;
    };
  }, [owner]);

  /** The Hub decided a purchase it had not finished: the points are in (the check starts again) or it did not go through. */
  const decide = useCallback(
    (p: Shortfall) => {
      if (owner) void findIntent(owner).then((intent) => (intent ? dropIntent(owner, intent.key) : undefined));
      attempt.current = null;
      setWatching(null);
      setResend(false);
      void queryClient.invalidateQueries({ queryKey: ['points', 'me'] });
      void queryClient.invalidateQueries({ queryKey: ['money'] });
      if (p.status === 'paid') latest.current.onBought();
      else {
        setNotice({ title: "That didn't go through", body: p.statusMessage?.trim() || 'This purchase did not go through.' });
        void fetchJobQuote(job).then(latest.current.onRequote, () => undefined);
      }
    },
    [owner, job],
  );
  const decideRef = useRef(decide);
  useEffect(() => {
    decideRef.current = decide;
  });

  // A purchase the Hub has not finished is read until it is decided (the debit waits for the bank).
  useQuery(
    {
      ...shortfallQuery(owner, watching),
      queryFn: async () => {
        const p = await fetchShortfall(watching as string);
        if (p.status !== 'pending') decideRef.current(p);
        return p;
      },
      refetchInterval: (query) => (query.state.data === undefined || query.state.data.status === 'pending' ? POLL_MS : false),
    },
    queryClient,
  );

  const paying = busy || watching !== null;

  const confirm = async () => {
    if (asking.current || pinOpen || paying || !owner) return;
    // Sent with no answer: the same request goes again, never a new quote and never a new key.
    if (attempt.current?.sent) {
      setPinTotal(attempt.current.expectedTotalKobo);
      setPinOpen(true);
      return;
    }
    asking.current = true;
    setBusy(true);
    setNotice(null);
    try {
      const now = await fetchJobQuote(job);
      if (verdictOf(now) !== 'short' || sheetState(now) !== 'wallet') {
        // A cap came into play, the points arrived, or the wallet can no longer pay: the sheet is drawn again from the Hub's own quote.
        props.onRequote(now);
        return;
      }
      if (quoteMoved(quote, now)) {
        props.onRequote(now);
        setNotice({ title: 'The price changed', body: SHEET_WORDS.changed });
        return;
      }
      attempt.current = { key: newRequestKey(), job, expectedTotalKobo: walletTotal(now), quoteToken: now.wallet?.payment.quoteToken ?? '', sent: false };
      setPinTotal(attempt.current.expectedTotalKobo);
      setPinOpen(true);
    } catch (error) {
      if (!entry.leadIfNoWallet(error)) setNotice({ title: SHEET_WORDS.checkFailed, body: isApiError(error) && error.message ? error.message : 'Check your connection and try again.' });
    } finally {
      asking.current = false;
      setBusy(false);
    }
  };

  const closePin = () => {
    setPinOpen(false);
    // A request that never left the phone is not kept: the next Confirm asks for a fresh quote.
    if (attempt.current && !attempt.current.sent) attempt.current = null;
  };

  const submit = async (credential: Credential): Promise<Settled> => {
    const sending = attempt.current;
    if (!sending || !owner) return { code: 'unanswered' };
    const body = { ...sending.job, expectedTotalKobo: sending.expectedTotalKobo, quoteToken: sending.quoteToken };
    const kept = await putIntent(owner, { key: sending.key, ...sending.job, expectedTotalKobo: sending.expectedTotalKobo, quoteToken: sending.quoteToken, phase: 'unknown', shortfallId: null, at: Date.now() });
    // A request the phone could not keep is not sent: it could not be protected from being bought twice.
    if (!kept) {
      setPinOpen(false);
      attempt.current = null;
      setNotice({ title: SHEET_WORDS.notReady, body: 'Nothing was taken.' });
      return { code: 'approved' };
    }
    // An earlier try under this key that left the phone with no answer that proves anything: this try repeats it.
    const earlierTry = sending.sent;
    attempt.current = { ...sending, sent: true };
    const outcome = await buyShortfall({ ...body, key: sending.key, ...credential });
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
    const again = () => void fetchJobQuote(job).then(props.onRequote, () => undefined);
    // THE RULE (FIX-108 round 2, FIX-112): a closed or refused fingerprint proves nothing about an earlier try under this key. It is settled
    // by `notApproved`: the key and an earlier try's stored intent stay, and only a first try lets go of what it wrote itself.
    if (isApprovalStop(outcome)) {
      return notApproved(stopCode(outcome), earlierTry, nothingMoved);
    }
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
        props.onSetPin();
        return { code: 'approved' };
      case 'no_wallet':
        start();
        entry.open();
        return { code: 'approved' };
      case 'wallet_short':
        // The wallet cannot pay it: PT3b, from the Hub's own quote.
        start();
        again();
        return { code: 'approved' };
      case 'quote_changed':
        // No purchase exists for the key: this is a new try, asked for from the quote as it stands now.
        start();
        again();
        setNotice({ title: 'The price changed', body: outcome.message || SHEET_WORDS.changed });
        return { code: 'approved' };
      case 'not_short':
        start();
        again();
        return { code: 'approved' };
      case 'cap_reached':
        start();
        again();
        return { code: 'approved' };
      case 'refused':
        start();
        setNotice({ title: "That didn't go through", body: outcome.message || 'We could not take this payment. Nothing was changed.' });
        return { code: 'approved' };
      case 'done': {
        const p = outcome.purchase;
        setPinOpen(false);
        setResend(false);
        void queryClient.invalidateQueries({ queryKey: ['points', 'me'] });
        void queryClient.invalidateQueries({ queryKey: ['money'] });
        if (p.status === 'paid') {
          void dropIntent(owner, sending.key);
          attempt.current = null;
          props.onBought();
        } else if (p.status === 'pending') {
          // The Hub took it and has not finished: read it by its id, never send it again.
          void putIntent(owner, { key: sending.key, ...sending.job, expectedTotalKobo: sending.expectedTotalKobo, quoteToken: sending.quoteToken, phase: 'pending', shortfallId: p.id, at: Date.now() });
          setWatching(p.id);
        } else {
          void dropIntent(owner, sending.key);
          attempt.current = null;
          setNotice({ title: "That didn't go through", body: p.statusMessage?.trim() || 'This purchase did not go through.' });
          again();
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

  const total = walletTotal(quote);
  return (
    <>
      <BottomSheet visible onClose={props.onClose} label={SHEET_WORDS.title} dismissible={!paying && !pinOpen} gap={SHEET_GAP} testID="shortfall-sheet">
        <Text variant="sheetTitleSm" accessibilityRole="header">
          {SHEET_WORDS.title}
        </Text>
        <GroupedList testID="shortfall-figures">
          <KeyValueRow label={SHEET_WORDS.costs} value={<PointsFigure count={quote.costPoints} size="line" testID="shortfall-cost" />} />
          <KeyValueRow label={SHEET_WORDS.have} value={<PointsFigure count={quote.balancePoints} size="line" testID="shortfall-have" />} />
          <KeyValueRow label={SHEET_WORDS.short} value={<PointsFigure count={quote.shortfallPoints} size="line" testID="shortfall-short" />} />
        </GroupedList>
        {notice ? <Banner tone="danger" title={notice.title} body={notice.body} testID="shortfall-notice" /> : null}
        {state === 'wallet' ? (
          <>
            <Banner tone="info" icon="Wallet" title={`Use ${naira(total)} from your wallet for the missing points?`} body={offerNote(quote)} testID="shortfall-offer" />
            <View style={styles.buttons}>
              <Button testID="shortfall-confirm" label={paying ? SHEET_WORDS.paying : `Confirm · ${naira(total)}`} onPress={() => void confirm()} loading={paying} full />
              <Button testID="shortfall-buy" label={SHEET_WORDS.buyInstead} onPress={props.onBuyPoints} variant="secondary" disabled={paying || resend} full />
            </View>
          </>
        ) : state === 'wallet_low' ? (
          <>
            <Banner tone="warning" icon="Wallet" title={SHEET_WORDS.walletLowTitle} body={SHEET_WORDS.walletLowBody} testID="shortfall-low" />
            <View style={styles.buttons}>
              <Button testID="shortfall-add" label={SHEET_WORDS.addMoney} onPress={() => props.onAddMoney(quote.wallet?.payment.shortfallKobo ?? 0)} full />
            </View>
          </>
        ) : (
          <View style={styles.buttons}>
            <Button testID="shortfall-buy" label={SHEET_WORDS.buyPoints} onPress={props.onBuyPoints} full />
            <Button testID="shortfall-close" label={SHEET_WORDS.notNow} onPress={props.onClose} variant="secondary" full />
          </View>
        )}
      </BottomSheet>
      {pinOpen ? (
        <PayPinSheet
          visible={pinOpen}
          onClose={closePin}
          approval={{ totalKobo: pinTotal ?? total, purpose: pinPurpose(quote) }}
          run={run}
          unansweredLine={PAYMENT_UNANSWERED_LINE}
          onForgotPin={() => {
            closePin();
            props.onForgotPin();
          }}
          lockedUntil={lockedUntil}
        />
      ) : null}
    </>
  );
}

/**
 * PT7 · The limit: a daily limit (or the size of one job) reached. The Hub's quote names the cap and, for the day's, when it resets, in
 * its own friendly sentence; nothing was held and nothing was taken, so the points are safe. "Back to AI tools" leaves.
 */
export function CapReachedScreen({ quote, onBack }: { quote: Pick<JobQuote, 'title' | 'cap'>; onBack: () => void }) {
  const cap = quote.cap;
  if (!cap) return null;
  return (
    <Modal visible animationType="fade" onRequestClose={onBack} statusBarTranslucent>
      <PointsFrame title={quote.title || 'AI tools'} onBack={onBack} gap={space.md} centered testID="cap-screen">
        <EmptyState testID="cap-reached" icon="Timer" title={capTitle(cap)} message={`${cap.message} Your points are safe.`} action={{ label: CAP_WORDS.back, onPress: onBack }} />
      </PointsFrame>
    </Modal>
  );
}

const styles = StyleSheet.create({
  buttons: { gap: space.sm },
});
