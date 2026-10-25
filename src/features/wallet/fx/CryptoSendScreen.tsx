import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Banner } from '@/components/Banner';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { browserOutlineOff, useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { KeyValueRow } from '@/components/ListRow';
import { PAYMENT_UNANSWERED_LINE } from '@/components/pin-sheet';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { isApprovalStop, notApproved, PayPinSheet, stopCode, type Credential, type Settled } from '@/features/device-approval';
import { attemptFor, dropAttempt, keepAttempt } from '@/features/money-attempt/attempts';
import { useOpenWalletEntry } from '@/features/open-wallet/entry';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { newRequestKey } from '@/features/wallet/api/settings';
import { fieldMetrics } from '@/components/TextField';
import { canvasNormalLineHeight, font, radius, space, useWawu } from '@/theme';

import { chainName, formatMinor, formatTrim, minorOfText, pressAmountKey, textOfMinor, type FxChain, type FxCode } from './amount';
import { accountsQuery, fetchSendQuote, sendCoin, sendQuery, type FxAccount, type FxSend, type FxSendQuote } from './api';
import { COIN_ORDER, fxProblem, sentenceOf } from './model';
import { shortAddress } from './FxReceiptScreen';

const SETTLE_MS = 500;
const SHEET_GAP = 14;

/** What an address must look like before it is sent anywhere: 20 to 64 letters and digits, as the Hub's own check begins (`FxSendDto.address`). */
export const looksLikeAddress = (value: string): boolean => /^[A-Za-z0-9]{20,64}$/.test(value);

/** The amount the account is debited: what they get, plus WAWU's fee. The provider's network fee is charged on top and named only when it takes the send. */
/** What a send says when the provider will not take it (M-02): one plain sentence, never the provider's words. Nothing left the account. */
export const SEND_DECLINED = "We couldn't send this right now. Nothing left your account. Try again later.";

export const totalFrom = (amountMinor: number, wawuFeeMinor: number): number => amountMinor + wawuFeeMinor;

export type CryptoSendScreenProps = {
  onBack: () => void;
  onSent: (send: FxSend) => void;
  onForgotPin: () => void;
  onSetPin: () => void;
};

type Problem = { title: string; message: string };

/**
 * W23 · Crypto · send: the coin, the recipient's address (pasted), the network (the account's, which must match the address's), the
 * amount with Max and the account's balance, the fees the Hub names on top, and Review. The review (as W21's sheet), the PIN (W11, or
 * the phone's fingerprint or face) and a receipt follow, with one `Idempotency-Key` per send exactly as Send in naira has. The provider
 * may refuse a send (it does on dev); its words are drawn as the plain refusal they are.
 */
export function CryptoSendScreen(props: CryptoSendScreenProps) {
  const owner = useSessionAccount(undefined);
  const { colors } = useWawu();
  const entry = useOpenWalletEntry();
  const accounts = useQuery(accountsQuery(owner), queryClient);
  const coinAccounts = useMemo(() => (accounts.data ?? []).filter((a) => COIN_ORDER.includes(a.currency as FxCode) && a.status === 'open'), [accounts.data]);
  const coins = COIN_ORDER.filter((c) => coinAccounts.some((a) => a.currency === c));

  const [coin, setCoin] = useState<FxCode | null>(null);
  const [chainPick, setChainPick] = useState<FxChain | null>(null);
  const code = coin && coins.includes(coin) ? coin : coins[0];
  const own = coinAccounts.filter((a) => a.currency === code);
  const account: FxAccount | undefined = own.find((a) => a.chain === chainPick) ?? own[0];
  const chain = account?.chain as FxChain | undefined;
  const decimals = account?.decimals ?? 2;

  const [address, setAddress] = useState('');
  const [text, setText] = useState('');
  const amountMinor = minorOfText(text, decimals);
  const available = account?.balance?.availableMinor ?? null;
  const over = available !== null && amountMinor > available;
  const [settled, setSettled] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setSettled(amountMinor), amountMinor === 0 ? 0 : SETTLE_MS);
    return () => clearTimeout(id);
  }, [amountMinor]);

  const quoted = useQuery(
    {
      queryKey: ['money', 'fx', 'send-quote', owner ?? '', account?.id ?? '', code ?? '', chain ?? '', settled],
      queryFn: () => fetchSendQuote((account as FxAccount).id, code as FxCode, chain as FxChain, settled),
      enabled: Boolean(owner && account && chain) && settled > 0 && settled === amountMinor && !over,
      staleTime: 0,
      gcTime: 0,
      retry: false,
    },
    queryClient,
  );
  const quote: FxSendQuote | null = quoted.data && quoted.data.amountMinor === amountMinor ? quoted.data : null;

  const [review, setReview] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const wallet = [accounts.error, quoted.error].some((e) => fxProblem(e) === 'no_wallet' || fxProblem(e) === 'opening');
  useEffect(() => {
    if (wallet) entry.open();
    // Led once when the Hub says there is no wallet yet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet]);

  const addressOk = looksLikeAddress(address.trim());
  const ready = Boolean(account && chain && addressOk && amountMinor > 0 && !over && quote);

  const paste = async () => {
    try {
      const pasted = (await Clipboard.getStringAsync()).trim();
      if (pasted) setAddress(pasted);
    } catch {
      // The phone refused the clipboard: the address can still be typed.
    }
  };

  const run = async (credential: Credential): Promise<Settled> => {
    if (!account || !chain || !code) return { code: 'unanswered' };
    const input = { accountId: account.id, currency: code, chain, address: address.trim(), amountMinor };
    const subject = `send:${input.accountId}:${input.currency}:${input.chain}:${input.address}:${input.amountMinor}`;
    const held = attemptFor<typeof input>(subject);
    const attempt = held ?? { subject, key: newRequestKey(), quote: input, phase: 'sent' as const, paymentId: null };
    keepAttempt(attempt);
    const outcome = await sendCoin({ ...input, key: attempt.key, ...credential });
    if (isApprovalStop(outcome)) return notApproved(stopCode(outcome), held !== null, () => dropAttempt(subject, attempt.key));
    const stop = (title: string, message: string): Settled => {
      dropAttempt(subject, attempt.key);
      setPinOpen(false);
      setReview(false);
      setProblem({ title, message });
      return { code: 'approved' };
    };
    switch (outcome.kind) {
      case 'done':
        void queryClient.invalidateQueries({ queryKey: ['money'], predicate: (q) => q.queryKey[2] !== 'send-quote' });
        queryClient.setQueryData(sendQuery(owner, outcome.value.id).queryKey, outcome.value);
        if (outcome.value.status === 'pending') keepAttempt({ ...attempt, phase: 'pending', paymentId: outcome.value.id });
        else dropAttempt(subject, attempt.key);
        setPinOpen(false);
        props.onSent(outcome.value);
        return { code: 'approved' };
      // A wrong or locked PIN proves nothing moved, and the attempt stays: the PIN typed again goes under the SAME key.
      case 'pin_incorrect':
        return { code: 'pin_incorrect', triesLeft: outcome.triesLeft };
      case 'pin_locked':
        setLockedUntil(outcome.lockedUntil);
        return { code: 'pin_locked', lockedUntil: outcome.lockedUntil };
      case 'unanswered':
        return { code: 'unanswered' };
      case 'pin_not_set':
        dropAttempt(subject, attempt.key);
        setPinOpen(false);
        props.onSetPin();
        return { code: 'approved' };
      case 'no_wallet':
        dropAttempt(subject, attempt.key);
        setPinOpen(false);
        entry.open();
        return { code: 'approved' };
      case 'insufficient_funds':
        return stop('Not enough to send', 'Your balance does not cover this send and its fees. Nothing left your account.');
      case 'frozen':
        return stop('This account is frozen', 'Money can arrive, but it cannot be sent until it is opened again. Nothing left your account.');
      case 'switched_off':
        return stop('Sending is switched off', 'Try again later. Nothing left your account.');
      case 'bad_address':
        return stop('Check the address', outcome.message);
      case 'quote_expired':
        return stop('The fees changed', 'Check the amount and try again.');
      case 'declined':
        return stop('This send was not taken', SEND_DECLINED);
      default:
        return stop('This send was not taken', outcome.kind === 'refused' ? outcome.message : 'Nothing left your account. Try again.');
    }
  };

  const readError = accounts.isError && !accounts.data ? accounts.error : null;
  const loading = accounts.isPending && !readError;
  const sendsOff = false;
  const total = quote && account ? totalFrom(amountMinor, quote.wawuFeeMinor) : null;

  if (readError || (!loading && !account)) {
    return (
      <AuthFrame testID="crypto-send-screen" navTitle="Send crypto" onBack={props.onBack}>
        <View style={styles.state}>
          {readError ? (
            <ErrorState
              testID="crypto-send-error"
              icon={isApiError(readError) && readError.kind === 'network' ? 'WifiOff' : fxProblem(readError) === 'unreachable' ? 'CloudOff' : 'TriangleAlert'}
              title={fxProblem(readError) === 'unreachable' ? 'We couldn’t reach your account' : 'We couldn’t load your accounts'}
              message={sentenceOf(readError, 'Check your connection and try again.')}
              onRetry={() => void accounts.refetch()}
            />
          ) : (
            <EmptyState testID="crypto-send-none" icon="Coins" title="Nothing to send yet" message="Get a crypto address and be paid first, then you can send from it." />
          )}
        </View>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      testID="crypto-send-screen"
      navTitle={code ? `Send ${code}` : 'Send crypto'}
      onBack={props.onBack}
      footer={<Button testID="crypto-send-review" label="Review" full disabled={!ready || sendsOff} onPress={() => setReview(true)} />}
    >
      {loading || !account || !code ? (
        <View style={styles.stack} testID="crypto-send-loading">
          <Skeleton height={fieldMetrics.height} radius={fieldMetrics.radius} />
          <Skeleton height={fieldMetrics.height} radius={fieldMetrics.radius} />
          <Skeleton height={fieldMetrics.height} radius={fieldMetrics.radius} />
        </View>
      ) : (
        <View style={styles.stack}>
          {coins.length > 1 ? (
            <SegmentedTabs
              testID="crypto-send-coins"
              label="Coin"
              items={coins.map((c) => ({ value: c, label: c }))}
              value={code}
              onChange={(next) => {
                setCoin(next as FxCode);
                setChainPick(null);
                setText('');
              }}
            />
          ) : null}
          <Text variant="label" style={styles.fieldLabel}>
            Recipient address
          </Text>
          <View style={[styles.field, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]}>
            <TextInput
              testID="crypto-send-address"
              value={address}
              onChangeText={(v) => setAddress(v.replace(/\s/g, ''))}
              placeholder="Paste the address"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Recipient address"
              selectionColor={colors.accent}
              cursorColor={colors.accent}
              style={[styles.input, Platform.OS === 'web' ? browserOutlineOff : null, { color: colors.textPrimary }]}
            />
            <PasteButton onPress={() => void paste()} />
          </View>
          {address.trim() && !addressOk ? (
            <Text variant="secondary" tone="danger" testID="crypto-send-address-note">
              That does not look like an address. Check it and try again.
            </Text>
          ) : null}

          <Text variant="label" style={styles.fieldLabel}>
            Network
          </Text>
          <View style={styles.chips} accessibilityRole="radiogroup">
            {own.map((a) => {
              const c = a.chain as FxChain;
              const selected = a.id === account.id;
              return (
                <Pressable
                  key={a.id}
                  testID={`crypto-send-chain-${c}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={chainName(c)}
                  onPress={() => {
                    setChainPick(c);
                    setText('');
                  }}
                  style={[
                    styles.chip,
                    selected ? { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary } : { borderColor: colors.borderStrong },
                  ]}
                >
                  <Text variant="body" style={[font(700), styles.chipLabel, { color: selected ? colors.surfacePage : colors.textSecondary }]}>
                    {chainName(c)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text variant="secondary" tone="textMuted">
            Must match the receiving wallet’s network.
          </Text>

          <Text variant="label" style={styles.fieldLabel}>
            Amount
          </Text>
          <View style={[styles.field, styles.amountField, { backgroundColor: colors.surfaceCard, borderColor: over ? colors.danger : colors.accent }]}>
            <TextInput
              testID="crypto-send-amount"
              value={text}
              onChangeText={(v) => setText(Array.from(v).reduce((was, ch) => pressAmountKey(was, ch, decimals), ''))}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel={`Amount in ${code}`}
              selectionColor={colors.accent}
              cursorColor={colors.accent}
              style={[styles.input, styles.amountInput, Platform.OS === 'web' ? browserOutlineOff : null, { color: colors.textPrimary }]}
            />
            <Text variant="body" tone="textSecondary" style={font(700)}>
              {code}
            </Text>
            {available !== null && available > 0 ? (
              <Pressable testID="crypto-send-max" accessibilityRole="button" accessibilityLabel="Use the whole balance" onPress={() => setText(textOfMinor(available, decimals))} hitSlop={space.sm}>
                <Text variant="linkStrong">Max</Text>
              </Pressable>
            ) : null}
          </View>
          <Text variant="secondary" tone={over ? 'danger' : 'textMuted'} testID="crypto-send-balance">
            {available === null ? 'Balance not read' : `${over ? 'Over your balance of' : 'Balance'} ${formatMinor(available, code, decimals)}`}
          </Text>

          <GroupedList testID="crypto-send-fees">
            <KeyValueRow label="Network fee" value={<Val text={quote ? (quote.providerFeeMinor === null ? 'Shown on your receipt' : formatMinor(quote.providerFeeMinor, code, decimals)) : 'Shown with the amount'} muted={!quote} />} />
            <KeyValueRow label="WAWU fee" value={<Val text={quote ? formatMinor(quote.wawuFeeMinor, code, decimals) : 'Shown with the amount'} muted={!quote} />} />
            <KeyValueRow
              label="Total from your balance"
              value={<Val text={total !== null ? `${formatMinor(total, code, decimals)}${quote?.providerFeeMinor === null ? ' + network fee' : ''}` : 'Shown with the amount'} muted={total === null} />}
            />
            <KeyValueRow label="They get" value={<Val text={amountMinor > 0 ? formatMinor(amountMinor, code, decimals) : 'Enter an amount'} muted={amountMinor === 0} />} />
          </GroupedList>
          {quoted.isError && !wallet ? (
            <Banner tone="danger" title="We couldn’t work out the fees" body={sentenceOf(quoted.error, 'Check the amount and try again.')} testID="crypto-send-quote-problem" />
          ) : null}
          {problem ? <Banner tone="danger" title={problem.title} body={problem.message} testID="crypto-send-problem" /> : null}
        </View>
      )}

      {account && code && chain ? (
        <BottomSheet visible={review && !pinOpen} onClose={() => setReview(false)} label="Review send" gap={SHEET_GAP} testID="crypto-send-review-sheet">
          <Text variant="sheetTitle" style={styles.center} testID="crypto-send-review-title">
            Send {formatTrim(amountMinor, code, decimals)}
          </Text>
          <GroupedList testID="crypto-send-review-card">
            <KeyValueRow label="To" value={<Val text={address.trim()} wrap />} />
            <KeyValueRow label="Network" value={<Val text={chainName(chain)} />} />
            <KeyValueRow label="Amount" value={<Val text={formatMinor(amountMinor, code, decimals)} />} />
            <KeyValueRow label="Network fee" value={<Val text={quote?.providerFeeMinor == null ? 'Shown on your receipt' : formatMinor(quote.providerFeeMinor, code, decimals)} />} />
            <KeyValueRow label="WAWU fee" value={<Val text={quote ? formatMinor(quote.wawuFeeMinor, code, decimals) : 'Shown with the amount'} />} />
            <KeyValueRow
              label="Total"
              value={<Val text={total !== null ? `${formatMinor(total, code, decimals)}${quote?.providerFeeMinor == null ? ' + network fee' : ''}` : 'Shown with the amount'} />}
            />
          </GroupedList>
          <View style={styles.buttons}>
            <Button
              testID="crypto-send-confirm"
              label={`Send ${total !== null ? formatTrim(total, code, decimals) : ''}`.trim()}
              full
              onPress={() => {
                setProblem(null);
                setPinOpen(true);
              }}
            />
            <Button testID="crypto-send-cancel" label="Cancel" variant="secondary" full onPress={() => setReview(false)} />
          </View>
        </BottomSheet>
      ) : null}
      <PayPinSheet
        visible={pinOpen}
        onClose={() => setPinOpen(false)}
        approval={{ purpose: `Approve sending ${code ? formatTrim(amountMinor, code, decimals) : ''} to ${shortAddress(address.trim())}` }}
        run={run}
        unansweredLine={PAYMENT_UNANSWERED_LINE}
        onForgotPin={() => {
          setPinOpen(false);
          props.onForgotPin();
        }}
        lockedUntil={lockedUntil}
      />
    </AuthFrame>
  );
}

function Val({ text, muted, wrap }: { text: string; muted?: boolean; wrap?: boolean }) {
  return (
    <Text variant="body" tone={muted ? 'textMuted' : 'textPrimary'} numberOfLines={wrap ? 3 : 2} selectable={wrap} style={[font(muted ? 600 : 700), styles.val]}>
      {text}
    </Text>
  );
}

function PasteButton({ onPress }: { onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable testID="crypto-send-paste" accessibilityRole="button" accessibilityLabel="Paste the address" onPress={onPress} hitSlop={space.sm} {...ring.handlers} style={ring.style}>
      <Icon name="ClipboardPaste" size={22} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space.md },
  state: { flex: 1 },
  fieldLabel: { marginTop: space.xs },
  field: { minHeight: fieldMetrics.height, borderRadius: fieldMetrics.radius, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg },
  amountField: { borderWidth: 1.5 },
  input: { flex: 1, minWidth: 0, fontSize: 17, lineHeight: canvasNormalLineHeight(17), padding: 0, ...font(600) },
  amountInput: { fontSize: 22, lineHeight: canvasNormalLineHeight(22), ...font(700) },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { height: 40, paddingHorizontal: space.lg, borderRadius: radius.chip, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipLabel: { fontSize: 15 },
  val: { fontSize: 16, textAlign: 'right', flexShrink: 1 },
  center: { textAlign: 'center' },
  buttons: { gap: space.md },
});
