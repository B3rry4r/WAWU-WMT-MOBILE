import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { walletBalanceQuery } from '@/api/money';
import { queryClient } from '@/api/query';
import { AmountKeypad } from '@/components/amount-entry';
import { Banner } from '@/components/Banner';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { PAYMENT_UNANSWERED_LINE } from '@/components/pin-sheet';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { PayPinSheet } from '@/features/device-approval';
import { useOpenWalletEntry } from '@/features/open-wallet/entry';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { canvasNormalLineHeight, font, radius, space, type, useWawu } from '@/theme';

import { deleteLastKey, formatMinor, formatTrim, minorOfText, pressAmountKey, rateLine, secondsUntil } from '../amount';
import { walletHomeQuery } from '../../api/home';
import { accountsQuery, currenciesQuery, fetchQuote, type FxQuote, type FxSwap } from '../api';
import { fxProblem, sentenceOf } from '../model';
import { FxAmount, FxFlag, HoldPill } from '../parts';
import { useNow } from '../useNow';
import { feeSummary, quoteProblem, sidesOf, startingSides, type Side } from './model';
import { SwapReview } from './SwapReview';
import { useSwapPay } from './useSwapPay';

/** How long typing must stop before a rate is asked for. Default (agent), owner may override. */
const SETTLE_MS = 500;
const CARD = { pad: space.lg, figure: 44, chipH: 40, flag: 28, chipPad: 6, flip: 52 } as const;

export type SwapScreenProps = {
  /** The currency codes the route named (`from`, `to`), if any. */
  from?: string;
  to?: string;
  onBack: () => void;
  onSwapped: (swap: FxSwap) => void;
  /** With nothing to swap between: the wallet, where an account is opened. Left out, the empty state has no button. */
  onOpenAccounts?: () => void;
  onForgotPin: () => void;
  onSetPin: () => void;
};

/**
 * W20 · Swap, with W21's review sheet over it and W11's PIN sheet over that (R-83, R-84). Two cards (what you swap, what you get),
 * each with the account it is from and its balance, the rate the provider gives held until the quote's own `expiresAt` (a countdown
 * from the Hub's time, never a fixed number), the fee as the Hub's breakdown, and the keypad. Every figure is the Hub's: a quote is
 * asked for once typing stops, and asked for again when the hold runs out or the person taps Review after it has.
 */
export function SwapScreen(props: SwapScreenProps) {
  const owner = useSessionAccount(undefined);
  const { colors } = useWawu();
  const entry = useOpenWalletEntry();
  const balance = useQuery({ ...walletBalanceQuery, enabled: Boolean(owner) }, queryClient);
  const currencies = useQuery(currenciesQuery(owner), queryClient);
  const accounts = useQuery(accountsQuery(owner), queryClient);
  // A person who opened from outside Nigeria has no naira account to swap from or into (WALLET-41): their swap is between their own accounts.
  const home = useQuery({ ...walletHomeQuery(owner), enabled: Boolean(owner) }, queryClient);
  const world = home.data?.world !== undefined;
  const sides = useMemo(() => sidesOf(currencies.data ?? null, accounts.data ?? null, balance.data?.availableKobo ?? null, !world), [currencies.data, accounts.data, balance.data, world]);

  const [pick, setPick] = useState<{ from: string | null; to: string | null }>({ from: null, to: null });
  const start = useMemo(() => startingSides(sides, props.from, props.to), [sides, props.from, props.to]);
  const from = sides.find((s) => s.key === pick.from) ?? start.from;
  const to = sides.find((s) => s.key === pick.to) ?? (to_ok(start.to, from) ? start.to : sides.find((s) => s.key !== from?.key));
  const [text, setText] = useState('');
  const minor = from ? minorOfText(text, from.decimals) : 0;
  const [settled, setSettled] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setSettled(minor), minor === 0 ? 0 : SETTLE_MS);
    return () => clearTimeout(id);
  }, [minor]);

  const [round, setRound] = useState(0);
  const over = from?.availableMinor != null && minor > from.availableMinor;
  const asking = Boolean(from && to && settled > 0 && settled === minor && !over);
  const quoted = useQuery(
    {
      queryKey: ['money', 'fx', 'quote', owner ?? '', from?.key ?? '', to?.key ?? '', settled, round],
      queryFn: () =>
        fetchQuote({
          fromCurrency: (from as Side).code,
          toCurrency: (to as Side).code,
          fromAccountId: (from as Side).accountId,
          toAccountId: (to as Side).accountId,
          amountFromMinor: settled,
        }),
      enabled: Boolean(owner) && asking,
      staleTime: Infinity,
      gcTime: 0,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    queryClient,
  );
  const quote: FxQuote | null = asking && quoted.data && quoted.data.amountFromMinor === minor ? quoted.data : null;
  const now = useNow(quote !== null);
  // The clock may be older than the quote on the first frame, so the hold never reads more than the seconds the Hub said it had.
  const left = quote ? Math.min(secondsUntil(quote.expiresAt, now), quote.validForSeconds) : 0;
  const expired = quote !== null && left === 0;

  // The hold ran out: the rate is asked for again, once for each quote, so what is on screen is never a rate the provider has dropped.
  const refreshed = useRef<string | null>(null);
  useEffect(() => {
    if (quote && expired && refreshed.current !== quote.id) {
      refreshed.current = quote.id;
      setRound((r) => r + 1);
    }
  }, [quote, expired]);

  const [picker, setPicker] = useState<'from' | 'to' | null>(null);
  const [review, setReview] = useState<FxQuote | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const pay = useSwapPay({
    owner,
    onSwapped: props.onSwapped,
    onNoWallet: () => entry.open(),
    onSetPin: props.onSetPin,
    onQuoteGone: () => {
      setReview(null);
      setRound((r) => r + 1);
      setNotice('The rate ran out. Check the new one before you swap.');
    },
    onClosePin: () => {
      setPinOpen(false);
      setReview(null);
    },
  });

  const noWallet = [currencies.error, accounts.error, quoted.error].some((e) => fxProblem(e) === 'no_wallet' || fxProblem(e) === 'opening');
  const ledToWallet = useRef(false);
  useEffect(() => {
    if (noWallet && !ledToWallet.current) {
      ledToWallet.current = true;
      entry.open();
    }
  }, [noWallet, entry]);

  const swapOff = currencies.data ? !currencies.data.products.swap : false;
  const quoteWords = quoted.isError && !noWallet ? quoteProblem(isApiError(quoted.error) ? quoted.error.code : undefined, sentenceOf(quoted.error, '')) : null;

  const flip = () => {
    if (!from || !to) return;
    setPick({ from: to.key, to: from.key });
    setText('');
  };
  const choose = (side: Side) => {
    if (picker === 'from') setPick({ from: side.key, to: to && side.key === to.key ? (from?.key ?? null) : (to?.key ?? null) });
    else setPick({ to: side.key, from: from && side.key === from.key ? (to?.key ?? null) : (from?.key ?? null) });
    setPicker(null);
    setText('');
  };

  const readError = currencies.isError && !currencies.data ? currencies.error : accounts.isError && !accounts.data ? accounts.error : null;
  const loading = !from || !to ? (currencies.isPending || accounts.isPending) && !readError : false;

  const tapReview = async () => {
    if (!quote || !from || !to) return;
    if (expired) {
      setRound((r) => r + 1);
      return;
    }
    setNotice(null);
    pay.clearProblem();
    setReview(quote);
  };

  const canReview = Boolean(quote) && !expired && !over && !swapOff;
  const approvalText = review && from && to ? `Approve swapping ${formatTrim(review.amountFromMinor, from.code, from.decimals)} for ${formatTrim(review.amountToMinor, to.code, to.decimals)}` : 'Approve this swap';

  // Nothing to swap between is not a fault of the connection (R2-MONEY D-06): it says what is missing and leads to where an account is opened.
  if (!readError && !loading && (!from || !to)) {
    return (
      <AuthFrame testID="swap-screen" navTitle="Swap" onBack={props.onBack}>
        <View style={styles.state}>
          <EmptyState
            testID="swap-empty"
            icon="ArrowLeftRight"
            title={world ? 'You need two accounts to swap' : 'You have no account to swap with'}
            message={world ? 'Open another currency account in your wallet, then swap between them.' : 'Open a dollar or other currency account in your wallet, then swap with your naira.'}
            action={props.onOpenAccounts ? { label: 'Go to your wallet', onPress: props.onOpenAccounts } : undefined}
            actionVariant="primary"
          />
        </View>
      </AuthFrame>
    );
  }
  if (readError) {
    return (
      <AuthFrame testID="swap-screen" navTitle="Swap" onBack={props.onBack}>
        <View style={styles.state}>
          <ErrorState
            testID="swap-error"
            icon={isApiError(readError) && readError.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
            title="We couldn’t load your accounts"
            message={sentenceOf(readError, 'Check your connection and try again.')}
            onRetry={() => {
              void currencies.refetch();
              void accounts.refetch();
            }}
          />
        </View>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      testID="swap-screen"
      navTitle="Swap"
      onBack={props.onBack}
      footer={<Button testID="swap-review" label={expired ? 'Getting a new rate' : 'Review swap'} full disabled={!canReview} onPress={() => void tapReview()} />}
    >
      {loading || !from || !to ? (
        <View style={styles.stack} testID="swap-loading">
          <Skeleton height={150} radius={radius.card} />
          <Skeleton height={150} radius={radius.card} />
          <Skeleton height={110} radius={radius.card} />
        </View>
      ) : (
        <View style={styles.stack}>
          <View>
            <SwapCard
              testID="swap-from"
              label="You swap"
              side={from}
              onPickSide={() => setPicker('from')}
              figure={<Figure minor={minor} side={from} typed={text} muted={minor === 0} danger={over} />}
              balance={from.availableMinor}
              over={over}
            />
            <View style={styles.flipWrap} pointerEvents="box-none">
              <FlipButton onPress={flip} />
            </View>
            <View style={styles.gap} />
            <SwapCard
              testID="swap-to"
              label="You get"
              side={to}
              onPickSide={() => setPicker('to')}
              figure={
                quote ? (
                  <FxAmount testID="swap-get" minor={quote.amountToMinor} code={to.code} decimals={quote.toDecimals} size={CARD.figure} weight={700} />
                ) : quoted.isFetching && asking ? (
                  <Skeleton width={160} height={CARD.figure * 0.8} radius={radius.chip} />
                ) : (
                  <FxAmount testID="swap-get" minor={0} code={to.code} decimals={to.decimals} size={CARD.figure} weight={700} tone="textMuted" places={false} />
                )
              }
              balance={to.availableMinor}
            />
          </View>

          <View style={[styles.info, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]} testID="swap-info">
            <View style={styles.infoRow}>
              <Text variant="body" tone="textSecondary" style={styles.infoLabel}>
                Rate
              </Text>
              {quote ? (
                <View style={styles.rateEnd}>
                  <Text variant="body" numberOfLines={1} style={[font(700), styles.rate]} testID="swap-rate">
                    {rateLine(quote) ?? 'Not available'}
                  </Text>
                  <HoldPill left={left} />
                </View>
              ) : (
                <Text variant="body" tone="textMuted" testID="swap-rate">
                  {minor === 0 ? 'Enter an amount' : over ? 'Over your balance' : quoted.isFetching ? 'Getting the rate' : quoteWords ? 'Not available' : '...'}
                </Text>
              )}
            </View>
            <View style={[styles.rule, { backgroundColor: colors.borderHairline }]} />
            <View style={styles.infoRow}>
              <Text variant="body" tone="textSecondary" style={styles.infoLabel}>
                Fee
              </Text>
              <Text variant="body" tone={quote ? 'textPrimary' : 'textMuted'} style={font(700)} testID="swap-fee">
                {quote ? feeSummary(quote) : 'Shown with the rate'}
              </Text>
            </View>
          </View>

          {swapOff ? <Banner tone="warning" title="Swaps are switched off" body="Try again later." testID="swap-off" /> : null}
          {quoteWords ? <Banner tone="danger" title={quoteWords.title} body={quoteWords.message} testID="swap-quote-problem" /> : null}
          {pay.problem ? <Banner tone="danger" title={pay.problem.title} body={pay.problem.message} testID="swap-pay-problem" /> : null}

          <AmountKeypad
            onKey={(key) => setText((was) => pressAmountKey(was, key, from.decimals))}
            onDelete={() => setText(deleteLastKey)}
            onClear={() => setText('')}
          />
        </View>
      )}

      <SideSheet
        open={picker !== null}
        title={picker === 'from' ? 'Swap from' : 'Swap to'}
        sides={sides}
        chosen={picker === 'from' ? from : to}
        onChoose={choose}
        onClose={() => setPicker(null)}
      />
      {review && from && to ? (
        <SwapReview
          visible={review !== null && !pinOpen}
          quote={review}
          from={from}
          to={to}
          secondsLeft={Math.min(secondsUntil(review.expiresAt, now), review.validForSeconds)}
          onConfirm={() => setPinOpen(true)}
          onCancel={() => setReview(null)}
        />
      ) : null}
      {review ? (
        <PayPinSheet
          visible={pinOpen}
          onClose={() => setPinOpen(false)}
          approval={{ purpose: approvalText }}
          run={(credential) => pay.run(review, credential)}
          unansweredLine={PAYMENT_UNANSWERED_LINE}
          onForgotPin={() => {
            setPinOpen(false);
            props.onForgotPin();
          }}
          lockedUntil={pay.lockedUntil}
        />
      ) : null}
      {notice ? <Toast message={notice} tone="alert" placement="top" lines={2} onHide={() => setNotice(null)} testID="swap-notice" /> : null}
    </AuthFrame>
  );
}

const to_ok = (candidate: Side | undefined, from: Side | undefined): candidate is Side => Boolean(candidate && candidate.key !== from?.key);

function Figure({ minor, side, typed, muted, danger }: { minor: number; side: Side; typed: string; muted: boolean; danger: boolean }) {
  return (
    <FxAmount
      testID="swap-amount"
      minor={minor}
      code={side.code}
      decimals={side.decimals}
      size={CARD.figure}
      weight={700}
      places={typed.includes('.')}
      tone={muted ? 'textMuted' : danger ? 'danger' : 'textPrimary'}
    />
  );
}

type SwapCardProps = {
  testID: string;
  label: string;
  side: Side;
  onPickSide: () => void;
  figure: React.ReactNode;
  balance: number | null;
  over?: boolean;
};

function SwapCard({ testID, label, side, onPickSide, figure, balance, over }: SwapCardProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <View testID={testID} style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]}>
      <View style={styles.cardHead}>
        <Text variant="body" tone="textMuted" style={[font(600), styles.cardLabel]}>
          {label}
        </Text>
        <Pressable
          testID={`${testID}-side`}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${side.label}. Change`}
          onPress={onPickSide}
          {...ring.handlers}
          style={[styles.chip, { backgroundColor: colors.surfaceSunken }, ring.style]}
        >
          <FxFlag currency={side.code} size={CARD.flag} />
          <Text variant="body" numberOfLines={1} style={[font(700), styles.chipLabel]}>
            {side.label}
          </Text>
          <Icon name="ChevronDown" size={16} color={colors.textPrimary} />
        </Pressable>
      </View>
      <View style={styles.figure}>{figure}</View>
      {balance !== null ? (
        <Text variant="secondary" tone={over ? 'danger' : 'textMuted'} style={styles.balance} testID={`${testID}-balance`}>
          {over ? 'Over your balance of ' : 'Balance '}
          {formatMinor(balance, side.code, side.decimals)}
        </Text>
      ) : (
        <Text variant="secondary" tone="textMuted" style={styles.balance} testID={`${testID}-balance`}>
          Balance not read
        </Text>
      )}
    </View>
  );
}

function FlipButton({ onPress }: { onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID="swap-flip"
      accessibilityRole="button"
      accessibilityLabel="Swap the two sides"
      onPress={onPress}
      {...ring.handlers}
      style={[styles.flip, { backgroundColor: colors.surfaceCard, borderColor: colors.surfacePage }, ring.style]}
    >
      <Icon name="ArrowDownUp" size={22} color={colors.textPrimary} />
    </Pressable>
  );
}

function SideSheet({ open, title, sides, chosen, onChoose, onClose }: { open: boolean; title: string; sides: readonly Side[]; chosen: Side | undefined; onChoose: (side: Side) => void; onClose: () => void }) {
  const { colors } = useWawu();
  return (
    <BottomSheet visible={open} onClose={onClose} label={title} gap={space.md} testID="swap-picker">
      <Text variant="sheetTitleSm" style={styles.pickTitle}>
        {title}
      </Text>
      {sides.map((side) => (
        <Pressable
          key={side.key}
          testID={`swap-pick-${side.key}`}
          accessibilityRole="button"
          accessibilityState={{ selected: side.key === chosen?.key }}
          accessibilityLabel={`${side.longLabel}${side.availableMinor !== null ? `, ${formatMinor(side.availableMinor, side.code, side.decimals)}` : ''}`}
          onPress={() => onChoose(side)}
          style={[styles.pickRow, { borderColor: side.key === chosen?.key ? colors.accent : colors.borderHairline, backgroundColor: colors.surfaceCard }]}
        >
          <FxFlag currency={side.code} size={36} />
          <View style={styles.pickWords}>
            <Text variant="cardTitle" numberOfLines={1}>
              {side.label}
            </Text>
            <Text variant="secondary" tone="textMuted" numberOfLines={1}>
              {side.availableMinor !== null ? formatMinor(side.availableMinor, side.code, side.decimals) : 'Balance not read'}
            </Text>
          </View>
          {side.key === chosen?.key ? <Icon name="Check" size={20} color={colors.accent} /> : null}
        </Pressable>
      ))}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space.lg },
  state: { flex: 1 },
  card: { borderRadius: radius.card + 6, borderWidth: StyleSheet.hairlineWidth, padding: CARD.pad, gap: space.sm },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  cardLabel: { fontSize: 15, lineHeight: canvasNormalLineHeight(15) },
  chip: { height: CARD.chipH, borderRadius: radius.chip, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingLeft: CARD.chipPad, paddingRight: space.md, maxWidth: '65%' },
  chipLabel: { fontSize: 16, flexShrink: 1 },
  figure: { marginTop: space.xs, minHeight: CARD.figure },
  balance: { fontSize: 14 },
  gap: { height: 10 },
  flipWrap: { position: 'absolute', left: 0, right: 0, top: '50%', marginTop: -CARD.flip / 2, alignItems: 'center', zIndex: 2 },
  flip: { width: CARD.flip, height: CARD.flip, borderRadius: CARD.flip / 2, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  info: { borderRadius: radius.card + 6, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: CARD.pad },
  infoRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  infoLabel: { fontSize: type.size.body },
  rateEnd: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexShrink: 1 },
  rate: { fontSize: 16, flexShrink: 1 },
  rule: { height: StyleSheet.hairlineWidth },
  pickTitle: { textAlign: 'center' },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.tile, borderWidth: 1 },
  pickWords: { flex: 1, minWidth: 0 },
});
