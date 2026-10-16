import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { walletBalanceQuery, balanceProblem } from '@/api/money';
import { queryClient } from '@/api/query';
import { Avatar } from '@/components/Avatar';
import { AmountKeypad, deleteLast, koboOfText, pressKey, textOfKobo } from '@/components/amount-entry';
import { Button } from '@/components/Button';
import { browserOutlineOff } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Money } from '@/components/Money';
import { Text } from '@/components/Text';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { AmountPresets } from '@/features/bills/parts';
import { useOpenWalletEntry } from '@/features/open-wallet/entry';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { fieldMetrics } from '@/components/TextField';
import { canvasNormalLineHeight, space, useWawu } from '@/theme';

import { presetsQuery } from './api';
import { BALANCE_LABEL, hueOfPayee, payeeLine, type Payee } from './model';
import { PayeeTick, SEND } from './parts';

/** The note's length until the Hub's own figure arrives: `WawuTransferDto.note` takes 100 characters (the contract). */
const NOTE_FALLBACK = 100;
/** W9's amount is the figure of the screen: 52 as the canvas draws it (`type.size.display` is the review's). Balance line 14. */
const AMOUNT = { size: 52, balanceSize: 14, noteIcon: 18, noteText: 15, noteGap: 12 } as const;

export type AmountScreenProps = {
  payee: Payee;
  onBack: () => void;
  onContinue: (entry: { amountKobo: number; note: string }) => void;
  /** Coming back from W10 keeps what was typed. */
  initial?: { amountKobo: number; note: string };
};

/**
 * W9 · Send · amount: who it goes to, the amount typed on the keypad (kobo included, whole numbers only), the wallet's balance
 * beneath it (the bank's figure, never a sum), the Hub's quick amounts, an optional note, and Continue. Continue is off until
 * there is an amount; whether the wallet can cover it and what it costs are W10's (the fee quote), not guessed here.
 */
export function AmountScreen({ payee, onBack, onContinue, initial }: AmountScreenProps) {
  const owner = useSessionAccount(undefined);
  const { colors } = useWawu();
  const entry = useOpenWalletEntry();
  const [text, setText] = useState(() => textOfKobo(initial?.amountKobo ?? 0));
  const [note, setNote] = useState(initial?.note ?? '');
  const amountKobo = koboOfText(text);

  const balance = useQuery({ ...walletBalanceQuery, enabled: Boolean(owner) }, queryClient);
  const presets = useQuery(presetsQuery(owner), queryClient);
  const problem = balance.isError ? balanceProblem(balance.error) : null;

  const led = useRef(false);
  useEffect(() => {
    if (problem === 'no_wallet' && !led.current) {
      led.current = true;
      entry.open();
    }
  }, [problem, entry]);

  let balanceLine;
  if (balance.data) {
    balanceLine = (
      <Text variant="secondary" tone="textMuted" testID="send-balance" style={styles.balance}>
        {BALANCE_LABEL}{' '}
        <Money minorUnits={balance.data.availableKobo} size={AMOUNT.balanceSize} weight={600} tone="textSecondary" />
      </Text>
    );
  } else if (balance.isError) {
    balanceLine = (
      <Pressable testID="send-balance-retry" accessibilityRole="button" accessibilityLabel="Try reading your balance again" onPress={() => void balance.refetch()}>
        <Text variant="secondary" tone="textMuted" style={styles.balance}>
          We couldn’t read your balance. Tap to try again.
        </Text>
      </Pressable>
    );
  } else {
    balanceLine = <Money testID="send-balance-loading" minorUnits={0} loading size={AMOUNT.balanceSize} />;
  }

  return (
    <AuthFrame
      testID="send-amount-screen"
      navTitle="Send money"
      onBack={onBack}
      footer={
        <Button
          testID="send-continue"
          label="Continue"
          full
          disabled={amountKobo === 0}
          onPress={() => onContinue({ amountKobo, note: note.trim() })}
        />
      }
    >
      <View style={styles.body}>
        <View style={styles.head}>
          <Avatar name={payee.name} hue={hueOfPayee(payee)} size={SEND.headAvatar} source={payee.avatarUrl ?? undefined} decorative />
          <View style={styles.nameLine}>
            <Text variant="cardTitle" testID="send-payee-name">
              {payee.name}
            </Text>
            <PayeeTick payee={payee} />
          </View>
          {payeeLine(payee) ? (
            <Text variant="secondary" tone="textMuted">
              {payeeLine(payee)}
            </Text>
          ) : null}
        </View>

        <View style={styles.figure}>
          <Money
            testID="send-amount"
            minorUnits={amountKobo}
            size={AMOUNT.size}
            weight={700}
            decimals={text.includes('.')}
            tone={amountKobo === 0 ? 'textMuted' : 'textPrimary'}
          />
          {balanceLine}
        </View>

        <AmountPresets
          testID="send-presets"
          presetsKobo={presets.data?.quickAmounts.map((q) => q.amountKobo) ?? []}
          chosenKobo={amountKobo === 0 ? null : amountKobo}
          onPick={(kobo) => setText(textOfKobo(kobo))}
        />

        <View style={[styles.note, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]}>
          <Icon name="SquarePen" size={AMOUNT.noteIcon} color={colors.textMuted} />
          <TextInput
            testID="send-note"
            value={note}
            onChangeText={setNote}
            maxLength={presets.data?.noteMaxLength ?? NOTE_FALLBACK}
            placeholder="Add a note (optional)"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Note, optional"
            selectionColor={colors.accent}
            cursorColor={colors.accent}
            style={[styles.noteInput, Platform.OS === 'web' ? browserOutlineOff : null, { color: colors.textPrimary }]}
          />
        </View>

        <AmountKeypad
          onKey={(key) => setText((was) => pressKey(was, key))}
          onDelete={() => setText(deleteLast)}
          onClear={() => setText('')}
        />
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg },
  head: { alignItems: 'center', gap: space.xs },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  figure: { alignItems: 'center', gap: space.sm },
  balance: { textAlign: 'center' },
  note: {
    height: fieldMetrics.height,
    borderRadius: fieldMetrics.radius,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: AMOUNT.noteGap,
    paddingHorizontal: space.lg,
  },
  noteInput: { flex: 1, minWidth: 0, fontSize: AMOUNT.noteText, lineHeight: canvasNormalLineHeight(AMOUNT.noteText), padding: 0 },
});
