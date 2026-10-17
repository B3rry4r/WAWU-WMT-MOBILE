import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { IconTile } from '@/components/IconTile';
import { KeyValueRow } from '@/components/ListRow';
import { Money } from '@/components/Money';
import { PinSheet, type PinCheckResult } from '@/components/pin-sheet';
import { formatPoints, PointsFigure } from '@/components/PointsFigure';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { StatusPill } from '@/components/StatusPill';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { isNoWallet, useOpenWalletEntry } from '@/features/open-wallet/entry';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { newRequestKey } from '@/features/wallet/api/settings';
import { font, radius, space, useWawu } from '@/theme';

import { myPointsQuery } from './api';
import { buyPack, fetchPackQuote, fetchPurchase, plansQuery, purchaseQuery, runningTierQuery, type PackPurchase, type PackQuote } from './buyApi';
import { dropIntent, findIntent, putIntent } from './buyIntent';
import { blurbFor, bonusChip, BUY_WORDS, CHANGED_LINE, failedLine, feeLine, naira, NOT_READY_LINE, payLabel, pinPurpose, quoteMoved, SHORT_LINE, startingPack } from './buyModel';
import { PointsFrame } from './PointsFrame';

/** How often a purchase the Hub has not finished is read again (`GET /plans/purchases/{id}`, our own record). Default (agent), owner may override. */
const POLL_MS = 4000;
const BODY_GAP = 12;
const RESULT = { mark: 72, between: 10, title: 28 } as const;
/** PT4's heading is the board's 28 bold, tracked -0.035em (PT6b's headline is the same family). */
const HEAD = { title: 28, tracking: -0.035 } as const;
const PACK = { radio: 22, dot: 10, padV: 16, chipTop: 8 } as const;

export type BuyScreenProps = {
  onBack: () => void;
  /** Done: back to where Buy points was opened from. */
  onDone: () => void;
  /** Forgot PIN? (W37). */
  onForgotPin: () => void;
  /** No PIN is set yet: A9 sets one and comes back here. */
  onSetPin: () => void;
};

/** The request this screen is sending: one key and what it carries. `sent` once it has left the phone with no answer that proves anything. */
type Attempt = { key: string; packId: string; method: 'wallet' | 'transfer'; expectedTotalKobo: number; quoteToken: string; sent: boolean };

/**
 * PT4 · Buy points, with PT4b (paying) and PT4c (points added). The packs and their prices are the Hub's (`GET /plans`), the bonus on
 * each is the person's running tier's percent, and the figures under them (the Bank charge, the total, the wallet's balance, how long
 * points last) are the pack's own quote. Pay is the total the payer pays, the Bank charge in it (BRIEF rule 5). The dollar packs (PT4a)
 * are not built at launch (R-16, R-65).
 *
 * Once, with a fresh quote for each attempt (V8). Tapping Pay asks the Hub for a new quote of that pack: figures that moved since the
 * person looked are put on screen and nothing is sent; the same figures open the PIN sheet and the request carries that quote's token.
 * One `Idempotency-Key` per attempt, kept on the phone (`./buyIntent`) until the Hub gives a final answer: a wrong PIN, a request that
 * got no answer and a second tap all send the SAME request, so one pack is bought and one debit made.
 *
 * The purchase's own answers: `paid` is PT4c; `pending` (the bank has not confirmed) is PT4b and is read by its id, never sent again;
 * `awaiting_transfer` shows the wallet's own account to send to and completes when the money lands; `failed` says why in the Hub's
 * words. "Back to AI tools" on the board is not drawn: AI tools has no screen yet (R-47), so the sheet's button is Done.
 */
export function BuyScreen(props: BuyScreenProps) {
  const owner = useSessionAccount(undefined);
  const entry = useOpenWalletEntry();

  const [looked, setLooked] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);
  const [method, setMethod] = useState<'wallet' | 'transfer'>('wallet');
  const [round, setRound] = useState(0);
  const [fresh, setFresh] = useState<PackQuote | null>(null);
  const [busy, setBusy] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [resend, setResend] = useState(false);
  const [done, setDone] = useState<PackPurchase | null>(null);
  const [watching, setWatching] = useState<string | null>(null);
  const attempt = useRef<Attempt | null>(null);
  const inFlight = useRef<Promise<PinCheckResult> | null>(null);
  // Set the moment Pay is tapped and cleared when the fresh price is in: `busy` is state and lags the tap by a render, so a second tap in the same tick would ask again.
  const asking = useRef(false);

  const plans = useQuery(plansQuery(owner), queryClient);
  const tier = useQuery(runningTierQuery(owner), queryClient);
  const packs = plans.data?.packs ?? [];
  const selected = packs.find((p) => p.id === chosen) ?? (chosen === null ? startingPack(packs) : null);

  // The phone is asked once for a purchase an earlier visit left: one sent with no answer is sent again as it was; one the Hub has not finished is read by its id.
  useEffect(() => {
    if (!owner) return undefined;
    let current = true;
    void findIntent(owner).then((intent) => {
      if (!current) return;
      if (intent?.phase === 'pending' && intent.purchaseId) {
        setMethod(intent.method);
        setChosen(intent.packId);
        setWatching(intent.purchaseId);
      } else if (intent) {
        attempt.current = { key: intent.key, packId: intent.packId, method: intent.method, expectedTotalKobo: intent.expectedTotalKobo, quoteToken: intent.quoteToken, sent: true };
        setChosen(intent.packId);
        setMethod(intent.method);
        setResend(true);
      }
      setLooked(true);
    });
    return () => {
      current = false;
    };
  }, [owner]);

  const quoted = useQuery(
    {
      queryKey: ['plans', 'pack-quote', owner ?? '', selected?.id ?? 'none', round] as const,
      queryFn: () => fetchPackQuote(selected?.id as string),
      enabled: Boolean(owner) && looked && selected !== null && done === null,
      staleTime: Infinity,
      gcTime: 0,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
      placeholderData: (previous: PackQuote | undefined) => previous,
    },
    queryClient,
  );
  const quote = fresh && fresh.packId === selected?.id ? fresh : quoted.data && quoted.data.packId === selected?.id ? quoted.data : null;

  // Nobody has a wallet until they open one (R-6): the quote says so, and the way in opens, once.
  const led = useRef(false);
  useEffect(() => {
    if (isNoWallet(quoted.error) && !led.current) {
      led.current = true;
      entry.open();
    }
  }, [quoted.error, entry]);

  const refresh = useCallback(() => {
    // The points, the wallet and everything that reads them: a quote is never re-read after the purchase it was for.
    void queryClient.invalidateQueries({ queryKey: ['points', 'me'] });
    void queryClient.invalidateQueries({ queryKey: ['money'] });
  }, []);

  // The Hub decided a purchase it had not finished: PT4c, or why it did not go through.
  const decide = useCallback(
    (p: PackPurchase) => {
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
        if (p.status === 'paid' || p.status === 'failed' || p.status === 'reversed' || p.status === 'expired') decideRef.current(p);
        return p;
      },
      refetchInterval: (query) => {
        const s = query.state.data?.status;
        return s === undefined || s === 'pending' || s === 'awaiting_transfer' ? POLL_MS : false;
      },
    },
    queryClient,
  );
  const waiting = watching !== null ? polled.data ?? null : null;

  // Once it is paid, the balance after it comes from the points the Hub holds now.
  const points = useQuery({ ...myPointsQuery(owner), enabled: Boolean(owner) && done !== null }, queryClient);

  const short = method === 'wallet' && quote !== null && quote.payment.shortfallKobo !== null && quote.payment.shortfallKobo > 0;
  const paying = busy || watching !== null;

  const pay = async () => {
    if (asking.current || pinOpen || paying || !owner || !selected || !quote) return;
    // Sent with no answer: the same request goes again, never a new quote and never a new key.
    if (attempt.current?.sent) {
      setPinOpen(true);
      return;
    }
    asking.current = true;
    setBusy(true);
    setFailure(null);
    try {
      const now = await fetchPackQuote(selected.id);
      if (quoteMoved(quote, now)) {
        setFresh(now);
        setNotice(CHANGED_LINE);
        return;
      }
      attempt.current = { key: newRequestKey(), packId: now.packId, method, expectedTotalKobo: now.payment.totalKobo, quoteToken: now.payment.quoteToken, sent: false };
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

  const submit = async (pin: string): Promise<PinCheckResult> => {
    const sending = attempt.current;
    if (!sending || !owner) return { code: 'unanswered' };
    const kept = await putIntent(owner, { key: sending.key, packId: sending.packId, method: sending.method, expectedTotalKobo: sending.expectedTotalKobo, quoteToken: sending.quoteToken, phase: 'unknown', purchaseId: null, at: Date.now() });
    // A request the phone could not keep is not sent: it could not be protected from being bought twice.
    if (!kept) {
      setPinOpen(false);
      attempt.current = null;
      setNotice(NOT_READY_LINE);
      return { code: 'approved' };
    }
    attempt.current = { ...sending, sent: true };
    const outcome = await buyPack({ packId: sending.packId, method: sending.method, expectedTotalKobo: sending.expectedTotalKobo, quoteToken: sending.quoteToken, key: sending.key, pin });
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
        props.onSetPin();
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
          void putIntent(owner, { key: sending.key, packId: sending.packId, method: sending.method, expectedTotalKobo: sending.expectedTotalKobo, quoteToken: sending.quoteToken, phase: 'pending', purchaseId: p.id, at: Date.now() });
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

  // One request at a time: a second submit while one is running is that same request, never another.
  const submitPin = (pin: string): Promise<PinCheckResult> => {
    if (inFlight.current) return inFlight.current;
    const running = submit(pin).finally(() => {
      inFlight.current = null;
    });
    inFlight.current = running;
    return running;
  };

  // A tier that is running adds its percent to every pack (the Hub's `packBonusPercent` for it); none, or an ended one, adds nothing.
  const percent = tier.data ? (plans.data?.bonusByTier[tier.data.id] ?? 0) : 0;
  const chip = bonusChip(tier.data?.name ?? null, percent);

  let body;
  if (plans.isError && !plans.data) {
    body = (
      <ErrorState
        testID="buy-error"
        icon={isApiError(plans.error) && plans.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
        title="We couldn't load the packs"
        message={isApiError(plans.error) && plans.error.message ? plans.error.message : 'Check your connection and try again.'}
        onRetry={() => void plans.refetch()}
      />
    );
  } else if (!plans.data || !looked) {
    body = <BuyLoading />;
  } else if (packs.length === 0) {
    body = <ErrorState testID="buy-none" icon="TriangleAlert" title="No packs to buy" message="There are no points packs on sale right now. Try again later." onRetry={() => void plans.refetch()} />;
  } else {
    body = (
      <>
        <View>
          <Text variant="display" accessibilityRole="header" testID="buy-title" style={{ fontSize: HEAD.title, letterSpacing: HEAD.tracking * HEAD.title }}>
            {BUY_WORDS.title}
          </Text>
          <Text variant="body" tone="textSecondary" testID="buy-blurb" style={styles.blurb}>
            {blurbFor(quote)}
          </Text>
        </View>
        <View testID="buy-packs" accessibilityRole="radiogroup" style={styles.packs}>
          {packs.map((pack) => (
            <PackRow key={pack.id} pack={pack} on={selected?.id === pack.id} chip={chip} disabled={paying || resend} onPress={() => (setChosen(pack.id), setFresh(null), setFailure(null))} />
          ))}
        </View>
        <View style={styles.pay}>
          <Text variant="label" accessibilityRole="header">
            {BUY_WORDS.payWith}
          </Text>
          <GroupedList testID="buy-methods">
            <MethodRow
              testID="buy-method-wallet"
              icon="Wallet"
              tone="accent"
              title={BUY_WORDS.wallet}
              subtitle={quote && quote.payment.balanceKobo !== null ? naira(quote.payment.balanceKobo) : undefined}
              on={method === 'wallet'}
              disabled={paying || resend}
              onPress={() => setMethod('wallet')}
            />
            <MethodRow
              testID="buy-method-transfer"
              icon="Landmark"
              tone="neutral"
              title={BUY_WORDS.transfer}
              subtitle={BUY_WORDS.transferSub}
              on={method === 'transfer'}
              disabled={paying || resend}
              onPress={() => setMethod('transfer')}
            />
          </GroupedList>
        </View>
        {quote ? (
          <Text variant="meta" tone="textMuted" testID="buy-fees" style={styles.centre}>
            {feeLine(quote)}
          </Text>
        ) : quoted.isError && !isNoWallet(quoted.error) ? (
          <ErrorState
            testID="buy-quote-error"
            icon="TriangleAlert"
            title="We couldn't work out the price"
            message={isApiError(quoted.error) && quoted.error.message ? quoted.error.message : 'Check your connection and try again.'}
            onRetry={() => setRound((r) => r + 1)}
          />
        ) : (
          <Skeleton testID="buy-quote-loading" height={14} width="40%" style={styles.centred} />
        )}
        {short ? (
          <Text variant="meta" tone="danger" testID="buy-short" accessibilityLiveRegion="polite" style={styles.centre}>
            {SHORT_LINE}
          </Text>
        ) : null}
        {failure ? (
          <Text variant="meta" tone="danger" testID="buy-failure" accessibilityLiveRegion="polite" style={styles.centre}>
            {failure}
          </Text>
        ) : null}
        {resend ? (
          <Text variant="meta" tone="textMuted" testID="buy-resend" style={styles.centre}>
            Your last try got no answer. Paying again checks it first, so you are not charged twice.
          </Text>
        ) : null}
        {waiting?.status === 'awaiting_transfer' && waiting.transfer ? <TransferCard purchase={waiting} /> : null}
      </>
    );
  }

  const label = paying ? BUY_WORDS.paying : quote ? payLabel(quote.payment.totalKobo) : 'Pay';
  const awaitingTransfer = waiting?.status === 'awaiting_transfer';
  const foot =
    plans.data && looked && packs.length > 0 ? (
      <Button
        testID="buy-pay"
        label={awaitingTransfer ? 'Waiting for your transfer' : label}
        full
        disabled={paying || quote === null || short || selected === null}
        loading={busy}
        onPress={() => void pay()}
      />
    ) : undefined;

  return (
    <>
      <PointsFrame title="" onBack={props.onBack} gap={BODY_GAP} foot={foot} testID="buy-screen">
        {body}
      </PointsFrame>
      {quote ? (
        <PinSheet
          visible={pinOpen}
          onClose={closePin}
          approval={{ totalKobo: quote.payment.totalKobo, purpose: pinPurpose(quote) }}
          onSubmit={submitPin}
          onForgotPin={() => {
            closePin();
            props.onForgotPin();
          }}
          lockedUntil={lockedUntil}
        />
      ) : null}
      {done ? <Added purchase={done} balance={points.data?.balance ?? null} onDone={props.onDone} /> : null}
      {notice ? <Toast message={notice} tone="alert" placement="top" lines={2} onHide={() => setNotice(null)} testID="buy-notice" /> : null}
    </>
  );
}

function PackRow({ pack, on, chip, disabled, onPress }: { pack: { id: string; points: number; priceMinor: number }; on: boolean; chip: string | null; disabled: boolean; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`pack-${pack.id}`}
      accessibilityRole="radio"
      accessibilityState={{ checked: on, disabled }}
      accessibilityLabel={`${formatPoints(pack.points)}, ${naira(pack.priceMinor)}${chip ? `, ${chip}` : ''}`}
      disabled={disabled}
      onPress={onPress}
      {...ring.handlers}
      style={[
        styles.pack,
        {
          backgroundColor: on ? colors.accentTint : colors.surfaceCard,
          boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: on ? 2 : 1, color: on ? colors.accent : colors.borderHairline, inset: true }],
        },
        ring.style,
      ]}
    >
      <View style={styles.packWords}>
        <PointsFigure count={pack.points} size="row" />
        {chip ? (
          <View style={styles.chip}>
            <StatusPill label={chip} tone="accent" />
          </View>
        ) : null}
      </View>
      <Money minorUnits={pack.priceMinor} size={16} weight={700} decimals={pack.priceMinor % 100 !== 0} />
      <Radio on={on} />
    </Pressable>
  );
}

function MethodRow({ testID, icon, tone, title, subtitle, on, disabled, onPress }: { testID: string; icon: 'Wallet' | 'Landmark'; tone: 'accent' | 'neutral'; title: string; subtitle?: string; on: boolean; disabled: boolean; onPress: () => void }) {
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ checked: on, disabled }}
      accessibilityLabel={[title, subtitle].filter(Boolean).join(', ')}
      disabled={disabled}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.method, ring.style]}
    >
      <IconTile icon={icon} tone={tone} size={44} />
      <View style={styles.methodWords}>
        <Text variant="body" style={font(600)}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="secondary" tone="textMuted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Radio on={on} />
    </Pressable>
  );
}

function Radio({ on }: { on: boolean }) {
  const { colors } = useWawu();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.radio, { borderColor: on ? colors.accent : colors.borderStrong, backgroundColor: on ? colors.accent : 'transparent' }]}
    >
      {on ? <View style={[styles.dot, { backgroundColor: colors.textOnAccent }]} /> : null}
    </View>
  );
}

/** The wallet's own account to send to for a bank transfer, from the Hub's purchase: what to send, and where. The points land when the money does. */
function TransferCard({ purchase }: { purchase: PackPurchase }) {
  const t = purchase.transfer;
  if (!t) return null;
  const send = t.amountNeededKobo ?? t.totalKobo;
  return (
    <View style={styles.transfer}>
      <GroupedList testID="buy-transfer">
        <KeyValueRow testID="transfer-amount" label="Send" value={<Money minorUnits={send} size={14.5} weight={700} />} />
        <KeyValueRow testID="transfer-bank" label="Bank" value={t.bankName} />
        <KeyValueRow testID="transfer-name" label="Account name" value={t.accountName} />
        <KeyValueRow testID="transfer-number" label="Account number" value={t.accountNumber} />
      </GroupedList>
      <Text variant="meta" tone="textMuted" style={styles.centre}>
        Your points are added when the money lands.
      </Text>
    </View>
  );
}

/** PT4c: the points added and the balance now, over the same screen. */
function Added({ purchase, balance, onDone }: { purchase: PackPurchase; balance: number | null; onDone: () => void }) {
  const added = purchase.grant?.totalPoints ?? purchase.points + purchase.bonusPoints;
  return (
    <BottomSheet visible onClose={onDone} label="Points added" testID="buy-added">
      <View style={styles.result}>
        <IconTile icon="Sparkles" tone="accent" size={RESULT.mark} strokeWidth={2.2} />
        <Text variant="display" accessibilityRole="header" testID="buy-added-title" style={[styles.centre, { fontSize: RESULT.title }]}>
          {`${new Intl.NumberFormat('en-US').format(added)} ${added === 1 ? 'point' : 'points'} added`}
        </Text>
        {balance !== null ? (
          <Text variant="body" tone="textSecondary" testID="buy-added-balance" style={styles.centre}>
            {`Your balance is ${formatPoints(balance)}.`}
          </Text>
        ) : null}
      </View>
      <Button testID="buy-done" label={BUY_WORDS.done} full onPress={onDone} />
    </BottomSheet>
  );
}

function BuyLoading() {
  return (
    <LoadingView label="Loading the packs" testID="buy-loading">
      <View style={styles.packs}>
        <Skeleton height={40} width="55%" radius={radius.tile} />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={72} radius={radius.card} />
        ))}
        <Skeleton height={120} radius={radius.card} />
      </View>
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  blurb: { marginTop: space.xs },
  packs: { gap: BODY_GAP },
  pack: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: PACK.padV, paddingHorizontal: space.lg, borderRadius: radius.card },
  packWords: { flex: 1 },
  chip: { marginTop: PACK.chipTop },
  pay: { gap: space.sm },
  method: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, paddingHorizontal: space.lg },
  methodWords: { flex: 1 },
  radio: { width: PACK.radio, height: PACK.radio, borderRadius: PACK.radio / 2, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dot: { width: PACK.dot, height: PACK.dot, borderRadius: PACK.dot / 2 },
  centre: { textAlign: 'center' },
  centred: { alignSelf: 'center' },
  transfer: { gap: space.sm },
  result: { alignItems: 'center', gap: RESULT.between, paddingVertical: space.lg },
});
