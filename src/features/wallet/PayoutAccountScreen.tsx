import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Icon } from '@/components/icon';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { TextField, fieldMetrics } from '@/components/TextField';
import { AuthField } from '@/features/auth/AuthField';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { space, useWawu } from '@/theme';

import {
  failureMessage,
  isRefusedAccount,
  nameCheckQuery,
  nameCheckWait,
  payoutAccountQuery,
  payoutProblem,
  savePayoutAccount,
  type PayoutAccount,
} from './api/payoutAccount';
import { BankSheet } from './BankSheet';
import { nameLineHint } from './nameLine';
import { canSave, digitsOnly, formFrom, isComplete, nameLine, shouldCheckName, type NameCheck, type NameLine, type PayoutForm } from './payoutForm';

/** design/_gen/auth.js line 50: A21's body stacks its parts 16 apart. */
const BODY_GAP = space.lg;
/** The skeleton's label line, as high as the field label (13 px type). */
const LABEL_SKELETON_H = 14;
const LABEL_SKELETON_W = '30%';
/** The footer's error line: a 15 px CircleAlert at 2.2 beside 13 px words (kit.js, auth.js line 14). */
const footErrorMetrics = { icon: 15, stroke: 2.2, iconGap: 6 } as const;

const NAV_TITLE = 'Where you get paid';

export type PayoutAccountScreenProps = {
  /** The round back button. */
  onBack: () => void;
  /** Called with the server's answer after a save. The route decides where to go. */
  onSaved?: (account: PayoutAccount) => void;
};

/**
 * A21 · Payout bank: where a creator's earnings are paid out. The user chooses
 * a bank, types the account number, sees whose account it is from the bank
 * and whether that is the name on their BVN, and saves it.
 *
 * The screen first reads the saved account (`GET /money/payout-account`):
 * loading, no wallet yet, wallet still opening and error each have their own
 * state; with nothing saved the form starts empty, otherwise it starts filled.
 */
export function PayoutAccountScreen({ onBack, onSaved }: PayoutAccountScreenProps) {
  const saved = useQuery(payoutAccountQuery);

  if (saved.isPending) {
    return (
      <AuthFrame navTitle={NAV_TITLE} onBack={onBack} testID="payout-loading">
        <LoadingView label="Loading your payout account">
          <View style={styles.body}>
            {[0, 1].map((i) => (
              <View key={i} style={styles.skeletonField}>
                <Skeleton width={LABEL_SKELETON_W} height={LABEL_SKELETON_H} />
                <Skeleton height={fieldMetrics.height} radius={fieldMetrics.radius} />
              </View>
            ))}
          </View>
        </LoadingView>
      </AuthFrame>
    );
  }

  if (saved.isError) {
    const problem = payoutProblem(saved.error);
    return (
      <AuthFrame navTitle={NAV_TITLE} onBack={onBack} testID="payout-problem">
        {problem === 'no_wallet' ? (
          <EmptyState
            testID="payout-no-wallet"
            icon="Wallet"
            title="Open your wallet first"
            message="Your payout account is kept with your Naira wallet. Once your wallet is open, you can add it here."
          />
        ) : problem === 'opening' ? (
          <EmptyState
            testID="payout-opening"
            icon="Clock"
            title="Your wallet is still opening"
            message="You can add your payout account as soon as it is open."
            action={{ label: 'Check again', onPress: () => void saved.refetch() }}
          />
        ) : (
          <ErrorState
            testID="payout-error"
            title="Your payout account did not load"
            message={failureMessage(saved.error)}
            onRetry={() => void saved.refetch()}
          />
        )}
      </AuthFrame>
    );
  }

  return <PayoutAccountForm saved={saved.data} onBack={onBack} onSaved={onSaved} />;
}

type FormProps = PayoutAccountScreenProps & { saved: PayoutAccount | null };

function PayoutAccountForm({ saved, onBack, onSaved }: FormProps) {
  const { colors } = useWawu();
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);
  const [form, setForm] = useState<PayoutForm>(() => formFrom(saved));
  const [picking, setPicking] = useState(false);

  const complete = isComplete(form) ? { bankCode: form.bank.code, accountNumber: form.accountNumber } : null;
  const check = useQuery({
    ...nameCheckQuery(complete ?? { bankCode: '', accountNumber: '' }),
    enabled: complete !== null && shouldCheckName(form, saved),
  });

  const save = useMutation({
    mutationFn: savePayoutAccount,
    onSuccess: (account) => {
      queryClient.setQueryData(payoutAccountQuery.queryKey, account);
      AccessibilityInfo.announceForAccessibility('Payout account saved');
      onSaved?.(account);
    },
    onError: (error) => {
      // The wallet went away or is not open: read the account again, which shows why.
      if (payoutProblem(error) !== 'other') void queryClient.invalidateQueries({ queryKey: payoutAccountQuery.queryKey });
    },
  });

  // A refusal for the hour's name check limit ends (R-51): when the wait the Hub named has passed, a refused check
  // is made again for the same number, and a refused save is cleared so Save opens; the person edits nothing.
  const checkWait = check.isError ? nameCheckWait(check.error) : null;
  const refetchCheck = check.refetch;
  useEffect(() => {
    if (checkWait === null) return;
    const timer = setTimeout(() => void refetchCheck(), checkWait * 1000);
    return () => clearTimeout(timer);
  }, [check.error, checkWait, refetchCheck]);
  const saveWait = save.isError ? nameCheckWait(save.error) : null;
  const resetSave = save.reset;
  useEffect(() => {
    if (saveWait === null) return;
    const timer = setTimeout(() => resetSave(), saveWait * 1000);
    return () => clearTimeout(timer);
  }, [save.error, saveWait, resetSave]);

  const nameCheck: NameCheck = !shouldCheckName(form, saved)
    ? { status: 'idle' }
    : check.isSuccess
      ? { status: 'success', data: check.data }
      : check.isError
        ? { status: 'error', unconfirmed: isRefusedAccount(check.error), message: check.error.message }
        : { status: 'pending' };

  // A save the bank refused, or one refused because the account is not in the person's own name (R-51), says so
  // on the field, exactly as a refused name check does; changing the bank or the number clears it.
  const refusedOnSave = save.isError && isRefusedAccount(save.error);
  const line: NameLine = refusedOnSave ? { kind: 'unconfirmed', message: save.error.message } : nameLine(form, saved, nameCheck);
  const nameHint = nameLineHint(line);
  const footError = save.isError && !refusedOnSave ? failureMessage(save.error) : null;

  const edit = (next: PayoutForm) => {
    setForm(next);
    save.reset();
  };

  const submit = () => {
    if (!complete || !canSave(form, saved, line, save.isPending)) return;
    save.mutate(complete);
  };

  return (
    <AuthFrame
      testID="payout-form"
      navTitle={NAV_TITLE}
      onBack={onBack}
      scrollRef={scrollRef}
      footer={
        <>
          {footError ? (
            <View style={styles.footError} accessibilityRole="alert" accessibilityLiveRegion="polite" testID="payout-save-error">
              <Icon name="CircleAlert" size={footErrorMetrics.icon} color={colors.danger} strokeWidth={footErrorMetrics.stroke} />
              <Text variant="errorLine" tone="danger" style={styles.footErrorText}>
                {footError}
              </Text>
            </View>
          ) : null}
          <Button
            label="Save payout account"
            full
            loading={save.isPending}
            disabled={!canSave(form, saved, line, save.isPending)}
            onPress={submit}
            testID="payout-save"
          />
        </>
      }
    >
      <View style={styles.body}>
        <TextField
          label="Bank"
          testID="payout-bank"
          value={form.bank?.name ?? ''}
          placeholder="Choose your bank"
          leadingIcon="Landmark"
          trailingIcon="ChevronDown"
          onPress={() => setPicking(true)}
          disabled={save.isPending}
          accessibilityLabel={form.bank ? `Bank, ${form.bank.name}` : 'Bank, choose your bank'}
          accessibilityHint="Opens the list of banks"
        />
        <View>
          <AuthField
            scrollRef={scrollRef}
            label="Account number"
            testID="payout-number"
            mono
            hint={nameHint?.hint}
            tone={nameHint?.tone}
            value={form.accountNumber}
            // No `maxLength` on the raw input: the platform would cut a pasted "0987 654 321" to ten
            // characters before the spaces are taken out. `digitsOnly` keeps the digits, then caps at ten.
            onChangeText={(typed) => edit({ ...form, accountNumber: digitsOnly(typed) })}
            error={line.kind === 'unconfirmed' ? line.message : undefined}
            loading={line.kind === 'checking'}
            disabled={save.isPending}
            keyboardType="number-pad"
            inputMode="numeric"
            autoComplete="off"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={submit}
          />
        </View>
      </View>
      <BankSheet
        visible={picking}
        onClose={() => setPicking(false)}
        selectedCode={form.bank?.code ?? null}
        onPick={(bank) => {
          setPicking(false);
          edit({ ...form, bank: { code: bank.code, name: bank.name } });
        }}
      />
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: BODY_GAP },
  skeletonField: { gap: space.sm },
  footError: { flexDirection: 'row', alignItems: 'center', gap: footErrorMetrics.iconGap },
  footErrorText: { flexShrink: 1 },
});
