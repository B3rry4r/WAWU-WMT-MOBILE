import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { balanceProblem, walletBalanceQuery } from '@/api/money';
import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card, GroupedList } from '@/components/Card';
import { browserOutlineOff, useFocusRing } from '@/components/focusRing';
import { IconTile } from '@/components/IconTile';
import { KeyValueRow } from '@/components/ListRow';
import { Money } from '@/components/Money';
import { PinSheet, type PinCheckResult } from '@/components/pin-sheet';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { fieldMetrics } from '@/components/TextField';
import { textOfKobo } from '@/components/amount-entry';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { useOpenWalletEntry } from '@/features/open-wallet/entry';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { fetchFeeQuote, sendToBankAccount, transferQuery, type FeeQuote } from '@/features/send/api';
import { dropIntent, putIntent, rereadIntent } from '@/features/send/intent';
import { NOT_READY_LINE } from '@/features/send/model';
import { useSettled } from '@/features/send/parts';
import { payoutAccountQuery, type PayoutAccount } from '@/features/wallet/api/payoutAccount';
import { newRequestKey } from '@/features/wallet/api/settings';
import { canvasNormalLineHeight, font, radius, space, useWawu } from '@/theme';

import { feeAt, withdrawQuoteQuery } from './api';
import {
  amountKobo as amountOf,
  AMOUNT_LABEL,
  AVAILABLE_LABEL,
  bankGetsLine,
  blockLine,
  CHANGE_LABEL,
  destinationLine,
  destinationSub,
  groupedAmount,
  MAX_LABEL,
  maxWithdrawKobo,
  sanitizeAmount,
  SETTLE_MS,
  TO_LABEL,
  withdrawBlock,
  withdrawFeeRows,
  withdrawKey,
  withdrawLabel,
  WITHDRAW_TITLE,
} from './model';

/** The board's field: the amount at 26 bold with the naira sign, "Max" in the accent at the end; the balance's figure is 36. The radio is 26 with a 10 dot. */
const LOOK = { amount: 26, balance: 36, avatar: 44, radio: 26, dot: 10, ring: fieldMetrics.ring, max: 15 } as const;

export type WithdrawScreenProps = {
  onBack: () => void;
  /** Change: A21, where the payout account is saved or replaced. */
  onChangeDestination: () => void;
  /** The Hub took the withdrawal: W19 shows it. */
  onStarted: (transferId: string) => void;
  /** The bank did not take it after the Hub accepted it: W14 says what came back. */
  onFailed: (transferId: string) => void;
  /** Forgot PIN? (W37). */
  onForgotPin: () => void;
  /** No PIN is set yet: A9 sets one. */
  onSetPin: () => void;
};

/** What one tap on Withdraw sends: one Idempotency-Key, the quote it carries, and when the request was first made. */
type Attempt = { key: string; quote: FeeQuote; at: number };

/**
 * W17 · Withdraw (WALLET-05): the bank's available balance, an amount with Max, the saved payout account as the destination with
 * Change, the fee as its parts ("Bank charge", WAWU's fee, Fees), a button that shows the total that leaves the wallet and a line
 * that says what the bank gets (BRIEF W17, R-10, R-53). Withdraw opens the PIN sheet (W11); a taken withdrawal opens W19.
 *
 * It is a bank send to the payout account (`POST /money/transfers/bank`): the same quote, PIN and Idempotency-Key rules as a send. The
 * quote is asked for once the amount settles and again on every tap, so the PIN approves a total the Hub will accept. One tap starts
 * one attempt with one key, and the key travels again, unchanged, on a wrong PIN and on a request that got no answer; the attempt is
 * kept on the phone (`@/features/send/intent`) so a lost answer is sent again as it was, never as a second withdrawal. A tap while
 * a request is out does nothing. A refusal before any money moved (a short balance, an account not in the person's name, a limit)
 * is said here in the Hub's words, with nothing taken.
 *
 * Fintava's balance is the truth (R-1's rule, now the bank's): every figure is the Hub's answer, never a sum of ours. With no wallet
 * the screen leads to Open your wallet (R-6); with no payout account it says so and leads to A21.
 */
export function WithdrawScreen(props: WithdrawScreenProps) {
  const owner = useSessionAccount(undefined);
  const { colors } = useWawu();
  const entry = useOpenWalletEntry();
  const [text, setText] = useState('');
  const amount = amountOf(text);
  const settled = amountOf(useSettled(text, SETTLE_MS));

  const balance = useQuery({ ...walletBalanceQuery, enabled: Boolean(owner) }, queryClient);
  const payoutRead = useQuery({ ...payoutAccountQuery, enabled: Boolean(owner) }, queryClient);
  const payout = payoutRead.data ?? null;
  const [round, setRound] = useState(0);
  const quoted = useQuery(withdrawQuoteQuery(owner, settled, round, payout !== null), queryClient);
  const [fresh, setFresh] = useState<FeeQuote | null>(null);
  const quote = fresh && fresh.amountKobo === amount ? fresh : quoted.data && quoted.data.amountKobo === amount ? quoted.data : null;

  const [shortOf, setShortOf] = useState<number | null>(null);
  const balanceKobo = shortOf ?? balance.data?.availableKobo ?? null;
  const block = withdrawBlock({ payout, amountKobo: amount, balanceKobo, quote });

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [maxing, setMaxing] = useState(false);
  const tapping = useRef(false);
  const [focused, setFocused] = useState(false);
  const ring = useFocusRing();

  // Nobody has a wallet until they open one (R-6).
  const led = useRef(false);
  const noWallet = balance.isError && balanceProblem(balance.error) === 'no_wallet';
  useEffect(() => {
    if (noWallet && !led.current) {
      led.current = true;
      entry.open();
    }
  }, [noWallet, entry]);

  const intentKey = payout ? withdrawKey(payout) : null;

  const change = (typed: string) => {
    setText(sanitizeAmount(typed));
    setProblem(null);
    setShortOf(null);
  };

  /** Max: what is left after the Hub's own fees, found from fresh quotes. */
  const fillMax = async () => {
    if (balance.data === undefined || maxing) return;
    setMaxing(true);
    setProblem(null);
    try {
      const kobo = await maxWithdrawKobo(balance.data.availableKobo, feeAt);
      if (kobo > 0) setText(textOfKobo(kobo));
      else setProblem('Your balance does not cover the fees for a withdrawal.');
    } catch (error) {
      setProblem(isApiError(error) && error.message ? error.message : 'We couldn’t work out the most you can withdraw. Try again.');
    } finally {
      setMaxing(false);
    }
  };

  /** Withdraw: a request still out is not sent twice; a fresh quote is asked for; the PIN approves the total the Hub just gave. */
  const withdraw = async () => {
    if (tapping.current || !owner || !payout || !intentKey || quote === null || block !== null) return;
    tapping.current = true;
    setBusy(true);
    setProblem(null);
    setNotice(null);
    try {
      const stored = await rereadIntent(owner, intentKey, amount);
      if (stored?.phase === 'pending' && stored.transferId) {
        // The Hub already took this one and has not decided: W19 shows it, nothing is sent again.
        props.onStarted(stored.transferId);
        return;
      }
      if (stored?.phase === 'unknown') {
        // An earlier try got no answer: the same request goes again, with its own key and quote, so the Hub answers with the first one.
        setAttempt({ key: stored.key, quote: stored.quote, at: stored.at });
        setPinOpen(true);
        return;
      }
      let latest: FeeQuote;
      try {
        latest = await fetchFeeQuote(amount, 'bank_transfer');
      } catch (error) {
        setProblem(isApiError(error) && error.message ? error.message : 'We couldn’t work out the fees. Try again.');
        return;
      }
      if (latest.totalKobo !== quote.totalKobo) {
        setFresh(latest);
        setNotice('The fees changed. Check the new total before you withdraw.');
        return;
      }
      setFresh(latest);
      setAttempt({ key: newRequestKey(), quote: latest, at: Date.now() });
      setPinOpen(true);
    } finally {
      tapping.current = false;
      setBusy(false);
    }
  };

  const submitPin = async (pin: string): Promise<PinCheckResult> => {
    if (!owner || !payout || !intentKey || !attempt) return { code: 'unanswered' };
    const request = { key: attempt.key, payeeId: intentKey, amountKobo: amount, note: '', quote: attempt.quote, transferId: null, at: attempt.at } as const;
    // Written before it leaves the phone, so a screen that goes away mid-request still finds it (and never pays twice).
    const kept = await putIntent(owner, { ...request, phase: 'unknown' });
    if (!kept) {
      setPinOpen(false);
      setNotice(NOT_READY_LINE);
      return { code: 'approved' };
    }
    const outcome = await sendToBankAccount({
      bankCode: payout.bankCode,
      accountNumber: payout.accountNumber,
      amountKobo: amount,
      quote: attempt.quote,
      nameToken: null,
      note: '',
      key: attempt.key,
      pin,
    });
    // An answer that proves no money moved frees the key; the next tap is a new attempt.
    const nothingMoved = () => void dropIntent(owner, attempt.key);
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
      case 'done': {
        const transfer = outcome.transfer;
        void queryClient.invalidateQueries({ queryKey: ['money'], predicate: (q) => q.queryKey[1] !== 'fee-quote' });
        queryClient.setQueryData(transferQuery(owner, transfer.id).queryKey, transfer);
        if (transfer.status === 'pending') await putIntent(owner, { ...request, phase: 'pending', transferId: transfer.id });
        else nothingMoved();
        setPinOpen(false);
        if (transfer.status === 'failed' || transfer.status === 'reversed') props.onFailed(transfer.id);
        else props.onStarted(transfer.id);
        return { code: 'approved' };
      }
      case 'pin_not_set':
        nothingMoved();
        setPinOpen(false);
        props.onSetPin();
        return { code: 'approved' };
      case 'no_wallet':
        nothingMoved();
        setPinOpen(false);
        entry.open();
        return { code: 'approved' };
      case 'insufficient_funds':
        // The bank's own figures: what the wallet holds now, and the key is spent on nothing.
        nothingMoved();
        setPinOpen(false);
        setShortOf(outcome.balanceKobo);
        return { code: 'approved' };
      case 'quote_changed':
        nothingMoved();
        setPinOpen(false);
        setFresh(outcome.quote);
        setNotice('The fees changed. Check the new total before you withdraw.');
        return { code: 'approved' };
      case 'refused':
        nothingMoved();
        setPinOpen(false);
        setProblem(outcome.message);
        return { code: 'approved' };
    }
  };

  const line = block ? blockLine(block) : null;
  const over = block?.kind === 'over_balance' || block?.kind === 'short_with_fees';
  const rows = quote ? withdrawFeeRows(quote) : [];

  return (
    <AuthFrame
      testID="withdraw-screen"
      navTitle={WITHDRAW_TITLE}
      onBack={props.onBack}
      footer={
        <View style={styles.foot}>
          {quote ? (
            <Text variant="muted" testID="withdraw-gets" style={styles.centre}>
              {bankGetsLine(quote.amountKobo)}
            </Text>
          ) : null}
          <Button
            testID="withdraw-submit"
            label={withdrawLabel(quote ? quote.totalKobo : null)}
            full
            loading={busy}
            disabled={block !== null || quote === null || balance.data === undefined}
            onPress={() => void withdraw()}
          />
        </View>
      }
    >
      <View style={styles.body}>
        <Card testID="withdraw-available-card" padded style={styles.stack}>
          <Text variant="secondary" tone="textSecondary">
            {AVAILABLE_LABEL}
          </Text>
          {balance.data ? (
            <Money testID="withdraw-available" minorUnits={balance.data.availableKobo} size={LOOK.balance} weight={700} />
          ) : balance.isError ? (
            <Pressable testID="withdraw-balance-retry" accessibilityRole="button" accessibilityLabel="Try reading your balance again" onPress={() => void balance.refetch()}>
              <Text variant="secondary" tone="textMuted">
                We couldn’t read your balance. Tap to try again.
              </Text>
            </Pressable>
          ) : (
            <Money testID="withdraw-available-loading" minorUnits={0} loading size={LOOK.balance} />
          )}
        </Card>

        <View style={styles.group}>
          <Text variant="secondary" tone="textSecondary" style={font(600)}>
            {AMOUNT_LABEL}
          </Text>
          <View
            style={[
              styles.field,
              {
                backgroundColor: colors.surfaceCard,
                boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: focused || over ? LOOK.ring : StyleSheet.hairlineWidth, color: over ? colors.danger : focused ? colors.accent : colors.borderHairline, inset: true }],
              },
            ]}
          >
            <Text style={[font(700), styles.sign, { color: text === '' ? colors.textMuted : over ? colors.danger : colors.textPrimary }]}>{'₦'}</Text>
            <TextInput
              testID="withdraw-amount"
              value={groupedAmount(text)}
              onChangeText={change}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              keyboardType="decimal-pad"
              inputMode="decimal"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Amount to withdraw"
              selectionColor={colors.accent}
              cursorColor={colors.accent}
              style={[font(700), styles.input, Platform.OS === 'web' ? browserOutlineOff : null, { color: over ? colors.danger : colors.textPrimary }]}
            />
            <Pressable
              testID="withdraw-max"
              accessibilityRole="button"
              accessibilityLabel="Withdraw the most you can"
              disabled={balance.data === undefined || maxing}
              onPress={() => void fillMax()}
              hitSlop={space.md}
              {...ring.handlers}
              style={ring.style}
            >
              <Text variant="body" style={[font(700), styles.max, { color: balance.data === undefined || maxing ? colors.textMuted : colors.accent }]}>
                {MAX_LABEL}
              </Text>
            </Pressable>
          </View>
          {line ? (
            <Text variant="errorLine" testID="withdraw-block" accessibilityRole="alert" accessibilityLiveRegion="polite">
              {line}
            </Text>
          ) : null}
        </View>

        <View style={styles.group}>
          <View style={styles.toHead}>
            <Text variant="cardTitle" accessibilityRole="header">
              {TO_LABEL}
            </Text>
            {payout ? (
              <Pressable testID="withdraw-change" accessibilityRole="button" accessibilityLabel="Change the payout account" hitSlop={space.md} onPress={props.onChangeDestination}>
                <Text variant="body" style={[font(700), { color: colors.accent }]}>
                  {CHANGE_LABEL}
                </Text>
              </Pressable>
            ) : null}
          </View>
          <Destination payout={payout} loading={payoutRead.isPending} failed={payoutRead.isError} onRetry={() => void payoutRead.refetch()} onAdd={props.onChangeDestination} />
        </View>

        {rows.length > 0 ? (
          <GroupedList testID="withdraw-fees">
            {rows.map((row) => (
              <KeyValueRow key={row.key} testID={`withdraw-fee-${row.key === 'fees' ? 'total' : row.key === 'Bank charge' ? 'bank' : 'wawu'}`} label={row.label} value={<Money minorUnits={row.kobo} size={14.5} weight={600} />} />
            ))}
          </GroupedList>
        ) : settled > 0 && payout && amount === settled && quoted.isFetching ? (
          <Skeleton testID="withdraw-fees-loading" height={104} radius={radius.card} />
        ) : settled > 0 && payout && amount === settled && quoted.isError ? (
          <Pressable
            testID="withdraw-fees-retry"
            accessibilityRole="button"
            accessibilityLabel="Work out the fees again"
            onPress={() => setRound((r) => r + 1)}
          >
            <Text variant="secondary" tone="textMuted">
              We couldn’t work out the fees. Tap to try again.
            </Text>
          </Pressable>
        ) : null}

        {problem ? <Banner testID="withdraw-problem" tone="danger" title="This withdrawal was not taken" body={problem} /> : null}
      </View>
      {attempt ? (
        <PinSheet
          visible={pinOpen}
          onClose={() => setPinOpen(false)}
          approval={{ totalKobo: attempt.quote.totalKobo, payee: payout ? payout.accountName : 'your payout account' }}
          onSubmit={submitPin}
          onForgotPin={() => {
            setPinOpen(false);
            props.onForgotPin();
          }}
          lockedUntil={lockedUntil}
        />
      ) : null}
      {notice ? <Toast message={notice} tone="alert" placement="top" lines={2} onHide={() => setNotice(null)} testID="withdraw-notice" /> : null}
    </AuthFrame>
  );
}

type DestinationProps = { payout: PayoutAccount | null; loading: boolean; failed: boolean; onRetry: () => void; onAdd: () => void };

/** W17's "To" card: the saved payout account selected, or the way to save one, or the state its read is in. */
function Destination({ payout, loading, failed, onRetry, onAdd }: DestinationProps) {
  const { colors } = useWawu();
  if (payout) {
    return (
      <Card testID="withdraw-destination" padded>
        <View style={styles.dest}>
          <IconTile icon="Landmark" tone="neutral" size={LOOK.avatar} />
          <View style={styles.destText}>
            <Text variant="body" numberOfLines={1} style={font(700)} testID="withdraw-destination-line">
              {destinationLine(payout)}
            </Text>
            <Text variant="secondary" tone="textMuted" numberOfLines={1} testID="withdraw-destination-sub">
              {destinationSub(payout)}
            </Text>
          </View>
          <View accessible accessibilityRole="radio" accessibilityState={{ selected: true }} accessibilityLabel="Selected" style={[styles.radio, { backgroundColor: colors.accent }]}>
            <View style={[styles.radioDot, { backgroundColor: colors.textOnAccent }]} />
          </View>
        </View>
      </Card>
    );
  }
  if (loading) return <Skeleton testID="withdraw-destination-loading" height={78} radius={radius.card} />;
  if (failed) {
    return (
      <Card testID="withdraw-destination-error" padded style={styles.stack}>
        <Text variant="secondary" tone="textSecondary">
          We couldn’t load your payout account.
        </Text>
        <Button testID="withdraw-destination-retry" label="Try again" variant="secondary" icon="RotateCw" onPress={onRetry} />
      </Card>
    );
  }
  return (
    <Card testID="withdraw-no-account" padded style={styles.stack}>
      <Text variant="body" style={font(700)}>
        No payout account yet
      </Text>
      <Text variant="secondary" tone="textSecondary">
        Withdrawals go to a bank account in your name. Add yours to withdraw.
      </Text>
      <Button testID="withdraw-add-account" label="Add a payout account" icon="Landmark" onPress={onAdd} />
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg },
  group: { gap: space.sm },
  stack: { gap: space.sm, alignItems: 'flex-start' },
  field: { height: fieldMetrics.height, borderRadius: fieldMetrics.radius, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg },
  sign: { fontSize: LOOK.amount, lineHeight: canvasNormalLineHeight(LOOK.amount) },
  input: { flex: 1, minWidth: 0, fontSize: LOOK.amount, lineHeight: canvasNormalLineHeight(LOOK.amount), padding: 0 },
  max: { fontSize: LOOK.max },
  toHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dest: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  destText: { flex: 1, minWidth: 0, gap: space.xs / 2 },
  radio: { width: LOOK.radio, height: LOOK.radio, borderRadius: LOOK.radio / 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: LOOK.dot, height: LOOK.dot, borderRadius: LOOK.dot / 2 },
  foot: { gap: space.sm },
  centre: { textAlign: 'center' },
});
