import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { KeyValueRow } from '@/components/ListRow';
import { PAYMENT_UNANSWERED_LINE } from '@/components/pin-sheet';
import { isApprovalStop, notApproved, PayPinSheet, stopCode, type Credential, type Settled } from '@/features/device-approval';
import { formatPoints } from '@/components/PointsFigure';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { useOpenWalletEntry } from '@/features/open-wallet/entry';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { useSettled } from '@/features/send/parts';
import { newRequestKey } from '@/features/wallet/api/settings';
import { radius, space } from '@/theme';

import {
  convertPoints,
  conversionQuery,
  fetchConversion,
  fetchConvertQuote,
  type Conversion,
  type ConvertQuote,
} from './api';
import { dropIntent, findIntent, putIntent } from './intent';
import { BALANCE_MOVED_LINE, blockLine, cashText, CHANGED_LINE, digitsOf, NOT_READY_LINE, pinPurpose, pointsOf, QUOTE_ERROR_TITLE, quoteMoved, rateText, unquotableLine, WORDS } from './model';
import { PointsFrame } from './PointsFrame';
import { BalanceCard, PointsField } from './parts';

/** How often a conversion the bank has not confirmed is read again (`GET /points/convert/{id}`, our own record). Default (agent), owner may override. */
const POLL_MS = 4000;
/** The quote is asked for once the person stops typing: the Hub answers a quote that is not one keystroke behind. Default (agent), owner may override. */
const TYPE_WAIT_MS = 400;
/** points.js line 99, `pt6`: the parts stand 14 apart; a result (PT6b) starts 160 below the bar, which the frame's own 8 already covers in part. */
const BODY_GAP = 14;
const RESULT = { top: 152, mark: 88, stroke: 2.2, between: 10, title: 30, titleTracking: -0.035, titleTop: space.sm, line: 14.5 } as const;
const SKELETON = { balance: 92, field: 96, card: 108 } as const;

export type ConvertScreenProps = {
  onBack: () => void;
  /** Done: back to the wallet. */
  onDone: () => void;
  /** Forgot PIN? (W37). */
  onForgotPin: () => void;
  /** No PIN is set yet: A9 sets one and comes back here. */
  onSetPin: () => void;
  /** Buy: PT4. */
  onBuy: () => void;
};

/** The request this screen is sending: one key, the points and the quote token it carries. `sent` once it has left the phone with no answer that proves anything. */
type Attempt = { key: string; points: number; quoteToken: string; sent: boolean };

/**
 * PT6 · Convert to cash, with PT6a (below the minimum) and PT6b (converted). The points to convert start as the whole balance
 * (the Hub quotes the whole balance when none is asked); typing asks the Hub again once the person pauses. The rate, the cash,
 * the minimum and why a figure cannot be converted are the Hub's, never the design's (R-65). The line "Spent on AI tools, points
 * go further than cash." is not drawn: the Hub serves no figure behind it (BACKEND_GAPS G-836). Buy opens PT4 (POINTS-06).
 *
 * Once, with a fresh quote for each attempt (V8). Tapping Convert asks the Hub for a new quote of those points: a closed quote, or
 * figures that moved since the person looked, put the new figures on screen and stop; the same figures open the PIN sheet and the
 * request carries that quote's token. One `Idempotency-Key` per attempt, kept (also on the phone, `./intent`) until the Hub gives a
 * final answer: a wrong PIN, a request that got no answer and a second tap all send the SAME request, so the points convert once.
 * `409 quote_changed` is a new attempt with the quote the Hub gave.
 *
 * The conversion's own answers: `completed` is PT6b; `pending` (the bank has not confirmed) says so in the Hub's words and is read
 * by its id, never sent again; `failed` says why in the Hub's words and the points are back.
 */
export function ConvertScreen(props: ConvertScreenProps) {
  const owner = useSessionAccount(undefined);
  const entry = useOpenWalletEntry();

  const [looked, setLooked] = useState(false);
  const [digits, setDigits] = useState('');
  const [touched, setTouched] = useState(false);
  const [round, setRound] = useState(0);
  const [fresh, setFresh] = useState<ConvertQuote | null>(null);
  const [busy, setBusy] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinQuote, setPinQuote] = useState<ConvertQuote | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [resend, setResend] = useState(false);
  const [done, setDone] = useState<Conversion | null>(null);
  const [watching, setWatching] = useState<string | null>(null);
  // The Hub's words for a conversion it has taken and the bank has not confirmed, until the first read of it by its id.
  const [watchLine, setWatchLine] = useState<string | null>(null);
  const attempt = useRef<Attempt | null>(null);
  const inFlight = useRef<Promise<Settled> | null>(null);

  const entering = done === null && watching === null;

  // The phone is asked once for a conversion an earlier visit left: one sent with no answer is sent again as it was; one the bank has not confirmed is read by its id.
  useEffect(() => {
    if (!owner) return undefined;
    let current = true;
    void findIntent(owner).then((intent) => {
      if (!current) return;
      if (intent?.phase === 'pending' && intent.conversionId) setWatching(intent.conversionId);
      else if (intent) {
        attempt.current = { key: intent.key, points: intent.points, quoteToken: intent.quoteToken, sent: true };
        setDigits(String(intent.points));
        setTouched(true);
        setResend(true);
      }
      setLooked(true);
    });
    return () => {
      current = false;
    };
  }, [owner]);

  // The first quote is for the whole balance (no points asked): it fills the field, or, past what one conversion carries, the most it carries.
  const whole = useQuery(
    {
      queryKey: ['points', 'convert-quote', owner ?? '', 'all', round] as const,
      queryFn: () => fetchConvertQuote(),
      enabled: Boolean(owner) && looked && entering && !touched,
      staleTime: Infinity,
      gcTime: 0,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    queryClient,
  );
  const first = whole.data;
  const start = first && first.points > 0 ? (first.maximumPoints !== null ? Math.min(first.points, first.maximumPoints) : first.points) : null;
  const capped = first && start !== null && start !== first.points ? start : null;
  const shownDigits = touched ? digits : start !== null ? String(start) : '';
  const typed = pointsOf(shownDigits);
  const settled = useSettled(shownDigits, TYPE_WAIT_MS);
  const asked = touched ? pointsOf(settled) : capped;

  const quoted = useQuery(
    {
      queryKey: ['points', 'convert-quote', owner ?? '', asked ?? 'none', round] as const,
      queryFn: () => fetchConvertQuote(asked as number),
      enabled: Boolean(owner) && looked && entering && asked !== null,
      staleTime: Infinity,
      gcTime: 0,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      // The quote on screen stays while the next one is asked for, so the field keeps its focus as the person types.
      placeholderData: (previous: ConvertQuote | undefined) => previous,
    },
    queryClient,
  );
  const live = touched || capped !== null ? quoted : whole;
  const quote = fresh ?? quoted.data ?? first ?? null;
  const current = quote !== null && typed !== null && quote.points === typed;

  const change = (typedText: string) => {
    setDigits(digitsOf(typedText));
    setTouched(true);
    setFresh(null);
    setFailure(null);
  };

  const refreshPoints = useCallback(() => {
    // The balance and the movements, and everything the wallet reads: a quote is never re-read after the conversion it was for.
    void queryClient.invalidateQueries({ queryKey: ['points', 'me'] });
    void queryClient.invalidateQueries({ queryKey: ['money'] });
  }, []);

  // The Hub decided a conversion the bank had not confirmed: PT6b, or why it did not move and the points back.
  const decide = useCallback(
    (c: Conversion) => {
      if (owner) void findIntent(owner).then((intent) => (intent ? dropIntent(owner, intent.key) : undefined));
      attempt.current = null;
      refreshPoints();
      setWatching(null);
      if (c.status === 'completed') setDone(c);
      else {
        setFailure(c.failureReason);
        setRound((r) => r + 1);
      }
    },
    [owner, refreshPoints],
  );
  const decideRef = useRef(decide);
  useEffect(() => {
    decideRef.current = decide;
  });

  // A conversion the bank has not confirmed is read until the Hub decides it.
  const polled = useQuery(
    {
      ...conversionQuery(owner, watching),
      queryFn: async () => {
        const c = await fetchConversion(watching as string);
        if (c.status !== 'pending') decideRef.current(c);
        return c;
      },
      refetchInterval: (query) => (query.state.data?.status === 'pending' || query.state.data === undefined ? POLL_MS : false),
    },
    queryClient,
  );

  const convert = async () => {
    if (busy || !owner || !current || !quote || typed === null) return;
    // Sent with no answer: the same request goes again, never a new quote and never a new key.
    if (attempt.current?.sent) {
      setPinQuote(quote);
      setPinOpen(true);
      return;
    }
    setBusy(true);
    try {
      const now = await fetchConvertQuote(typed);
      if (!now.canConvert || quoteMoved(quote, now)) {
        setFresh(now);
        if (now.canConvert) setNotice(CHANGED_LINE);
        else if (now.balancePoints !== quote.balancePoints) setNotice(BALANCE_MOVED_LINE);
        return;
      }
      attempt.current = { key: newRequestKey(), points: typed, quoteToken: now.quoteToken, sent: false };
      setPinQuote(now);
      setPinOpen(true);
    } catch (error) {
      if (!entry.leadIfNoWallet(error)) setNotice(isApiError(error) ? error.message : 'We could not check the cash for your points. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const closePin = () => {
    setPinOpen(false);
    // A request that never left the phone is not kept: the next Convert asks for a fresh quote.
    if (attempt.current && !attempt.current.sent) attempt.current = null;
  };

  const submit = async (credential: Credential): Promise<Settled> => {
    const sending = attempt.current;
    if (!sending || !owner) return { code: 'unanswered' };
    const kept = await putIntent(owner, { key: sending.key, points: sending.points, quoteToken: sending.quoteToken, phase: 'unknown', conversionId: null, at: Date.now() });
    // A request the phone could not keep is not sent: it could not be protected from being converted twice.
    if (!kept) {
      setPinOpen(false);
      attempt.current = null;
      setNotice(NOT_READY_LINE);
      return { code: 'approved' };
    }
    // An earlier try under this key that left the phone with no answer that proves anything: this try repeats it.
    const earlierTry = sending.sent;
    attempt.current = { ...sending, sent: true };
    const outcome = await convertPoints({ points: sending.points, quoteToken: sending.quoteToken, key: sending.key, ...credential });
    // The Hub gave an answer that proves nothing was converted for the key: it is free for the next try.
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
      case 'quote_changed':
        // No conversion exists for the key: this is a new attempt with the quote the Hub gave.
        start();
        if (outcome.quote) setFresh(outcome.quote);
        else setRound((r) => r + 1);
        setNotice(outcome.message || CHANGED_LINE);
        return { code: 'approved' };
      case 'blocked':
        start();
        setRound((r) => r + 1);
        setNotice(outcome.message);
        return { code: 'approved' };
      case 'refused':
        start();
        setNotice(outcome.message || 'We could not convert your points. Nothing was changed.');
        return { code: 'approved' };
      case 'done': {
        const c = outcome.conversion;
        setPinOpen(false);
        setResend(false);
        refreshPoints();
        if (c.status === 'pending') {
          // The points are on hold and the cash is on its way: read it by its id, never send it again.
          void putIntent(owner, { key: sending.key, points: sending.points, quoteToken: sending.quoteToken, phase: 'pending', conversionId: c.id, at: Date.now() });
          setWatchLine(c.statusMessage);
          setWatching(c.id);
        } else {
          void dropIntent(owner, sending.key);
          attempt.current = null;
          if (c.status === 'completed') setDone(c);
          else {
            setFailure(c.failureReason);
            setRound((r) => r + 1);
          }
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

  if (done) {
    return (
      <PointsFrame title="Convert to cash" onBack={props.onBack} gap={BODY_GAP} foot={<Button testID="convert-done" label={WORDS.done} onPress={props.onDone} size="lg" full />} testID="convert-screen">
        <Result icon="Banknote" tone="in" title={`${cashText(done.cashKobo)} added to your wallet`} line={`${formatPoints(done.points)} converted`} testID="convert-result" />
      </PointsFrame>
    );
  }
  if (watching) {
    const pending = polled.data;
    return (
      <PointsFrame title="Convert to cash" onBack={props.onBack} gap={BODY_GAP} foot={<Button testID="convert-done" label={WORDS.done} onPress={props.onDone} size="lg" full />} testID="convert-screen">
        <Result
          icon="Clock"
          tone="accent"
          title="Still confirming"
          line={pending?.statusMessage ?? watchLine ?? ''}
          testID="convert-pending"
        />
      </PointsFrame>
    );
  }

  const unavailable = live.data === undefined && fresh === null && live.isError ? live.error : null;
  const code = isApiError(unavailable) ? unavailable.code : undefined;
  // Empty, zero or too many points cannot be quoted: the field says why Convert is off (SWEEP-APP-3 row 123).
  const unquotable = looked && (touched || shownDigits !== '') ? unquotableLine(shownDigits, quote?.minimumPoints ?? null) : null;
  const hint = unquotable?.tone === 'hint' ? unquotable.text : current && quote.canConvert ? `You get ${cashText(quote.cashKobo)}` : undefined;
  const error = unquotable?.tone === 'error' ? unquotable.text : current && !quote.canConvert ? (blockLine(quote) ?? undefined) : undefined;
  const youGet = current ? (quote.canConvert ? quote.cashKobo : 0) : null;
  const canTap = current && quote.canConvert && !busy;

  let body: React.ReactNode;
  if (!looked || (quote === null && !unavailable && (live.isPending || live.isFetching))) {
    body = <Loading />;
  } else if (unavailable) {
    body =
      code === 'currency_not_supported' ? (
        <EmptyState testID="convert-unavailable" icon="Banknote" title="You can't convert points yet" message={isApiError(unavailable) ? unavailable.message : ''} />
      ) : code === 'wallet_not_open' || code === 'wallet_opening' ? (
        <EmptyState
          testID="convert-no-wallet"
          icon="Wallet"
          title="Open your wallet to convert points"
          message="The cash for your points goes into your wallet."
          action={{ label: 'Open your wallet', onPress: entry.open }}
        />
      ) : (
        <ErrorState
          testID="convert-error"
          icon={isApiError(unavailable) && unavailable.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
          title={QUOTE_ERROR_TITLE}
          message={isApiError(unavailable) ? unavailable.message : 'Something went wrong. Try again.'}
          onRetry={() => setRound((r) => r + 1)}
        />
      );
  } else {
    body = (
      <>
        {resend ? (
          <Banner
            testID="convert-resend"
            tone="info"
            title="We didn't hear back about your last conversion"
            body="Tap Convert and enter your PIN to find out. Your points won't be converted twice."
          />
        ) : null}
        {failure ? <Banner testID="convert-failed" tone="danger" title="We couldn't convert your points" body={failure} /> : null}
        {quote ? <BalanceCard points={quote.balancePoints} buy={{ label: 'Buy', onPress: props.onBuy, testID: 'convert-buy' }} testID="convert-balance" /> : null}
        <PointsField digits={shownDigits} onChangeDigits={change} hint={hint} error={error} disabled={busy || pinOpen} testID="convert-points" />
        {quote ? (
          <GroupedList testID="convert-figures">
            <KeyValueRow label={WORDS.rate} value={rateText(quote.rate)} />
            <KeyValueRow label={WORDS.youGet} value={youGet === null ? '' : cashText(youGet)} />
          </GroupedList>
        ) : null}
      </>
    );
  }

  const showFoot = Boolean(quote) && !unavailable && looked;
  return (
    <>
      <PointsFrame
        title="Convert to cash"
        onBack={props.onBack}
        gap={BODY_GAP}
        centered={Boolean(unavailable)}
        foot={showFoot ? <Button testID="convert-button" label={WORDS.convert} onPress={() => void convert()} size="lg" full disabled={!canTap} loading={busy} /> : undefined}
        testID="convert-screen"
      >
        {body}
      </PointsFrame>
      {pinQuote ? (
        <PayPinSheet
          visible={pinOpen}
          onClose={closePin}
          approval={{ totalKobo: pinQuote.cashKobo, purpose: pinPurpose(pinQuote.points) }}
          run={run}
          unansweredLine={PAYMENT_UNANSWERED_LINE}
          onForgotPin={() => {
            closePin();
            props.onForgotPin();
          }}
          lockedUntil={lockedUntil}
        />
      ) : null}
      {notice ? <Toast message={notice} tone="alert" placement="top" lines={2} onHide={() => setNotice(null)} testID="convert-notice" /> : null}
    </>
  );
}

/** points.js line 67, `result`: a mark 88 across, the title at 30 and the line under it at 14.5, 10 apart. The page starts 160 below the bar (PT6b). */
function Result({ icon, tone, title, line, testID }: { icon: 'Banknote' | 'Clock'; tone: 'in' | 'accent'; title: string; line: string; testID: string }) {
  return (
    <View testID={testID} accessibilityLiveRegion="polite" style={styles.result}>
      <IconTile icon={icon} tone={tone} size={RESULT.mark} strokeWidth={RESULT.stroke} />
      <Text variant="title" accessibilityRole="header" style={styles.resultTitle}>
        {title}
      </Text>
      {line ? (
        <Text variant="secondary" style={styles.resultLine}>
          {line}
        </Text>
      ) : null}
    </View>
  );
}

/** The page before the Hub has answered: the shape of the balance, the field and the figures, never a number. */
function Loading() {
  return (
    <LoadingView label="Checking the cash for your points" testID="convert-loading">
      <View style={styles.loading}>
        <Skeleton height={SKELETON.balance} radius={radius.card} />
        <Skeleton height={SKELETON.field} radius={radius.tile} />
        <Skeleton height={SKELETON.card} radius={radius.card} />
      </View>
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  result: { alignItems: 'center', gap: RESULT.between, paddingTop: RESULT.top },
  resultTitle: { textAlign: 'center', fontSize: RESULT.title, letterSpacing: RESULT.titleTracking * RESULT.title, marginTop: RESULT.titleTop },
  resultLine: { textAlign: 'center', fontSize: RESULT.line },
  loading: { gap: BODY_GAP },
});

