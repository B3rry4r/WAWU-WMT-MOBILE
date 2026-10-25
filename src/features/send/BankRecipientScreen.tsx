import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { ListRow } from '@/components/ListRow';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { SkeletonRows } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { AuthField } from '@/features/auth/AuthField';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { isNoWallet, useOpenWalletEntry } from '@/features/open-wallet/entry';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { BankSheet } from '@/features/wallet/BankSheet';
import { banksQuery, failureMessage, isRefusedAccount, nameCheckQuery, nameCheckWait, payoutAccountQuery } from '@/features/wallet/api/payoutAccount';
import { nameLineHint } from '@/features/wallet/nameLine';
import { digitsOnly, isComplete, nameLine, type NameCheck, type PayoutForm } from '@/features/wallet/payoutForm';
import { space } from '@/theme';

import { beneficiariesQuery, savedBankRowFor, savedBankRows, type Beneficiary } from './api';
import { bankLine, bankPayeeOf, type BankPayee, type Payee } from './model';
import { useSendWays, type SendWay } from './parts';

export type BankRecipientScreenProps = {
  onBack: () => void;
  /** W7: the other tab. */
  onWawuUser: () => void;
  /** The Abroad tab (NUV-11), drawn only while the Hub says sending abroad is on. */
  onAbroad?: () => void;
  /** A bank account, ready for W9: its name is the bank's. */
  onPick: (payee: Payee) => void;
  /** A bank and number to start from (Try again after W14). */
  initial?: { bankCode: string; bankName: string; accountNumber: string };
};

/** W8's section label gap, as the board draws "Saved" over its card. */
const SECTION_GAP = 12;

/**
 * W8 · Send · to a bank account: choose the bank, type the ten digits, and the BANK says whose account it is before Continue opens
 * (`POST /money/banks/name-check`; the name is the bank's, never typed, and it comes with the `nameToken` the send carries). Below it,
 * the saved accounts (`GET /money/beneficiaries`, bank accounts only) and "My payout account" (`GET /money/payout-account`, with its
 * "withdraw" tag): tapping one goes straight to W9, because the Hub holds its name. The bank list is `GET /money/banks`.
 *
 * A check the bank refused says why on the number field, in the Hub's words (not a bank account, too many checks this hour with the
 * wait; the form opens again when it has passed); a check the bank did not answer is Try again. Nothing is sent from here and no
 * money moves.
 */
export function BankRecipientScreen({ onBack, onWawuUser, onAbroad, onPick, initial }: BankRecipientScreenProps) {
  const ways = useSendWays();
  const owner = useSessionAccount(undefined);
  const entry = useOpenWalletEntry();
  const [form, setForm] = useState<PayoutForm>(() => ({ bank: initial ? { code: initial.bankCode, name: initial.bankName } : null, accountNumber: initial?.accountNumber ?? '' }));
  const [picking, setPicking] = useState(false);

  const complete = isComplete(form) ? { bankCode: form.bank.code, accountNumber: form.accountNumber } : null;
  const check = useQuery({ ...nameCheckQuery(complete ?? { bankCode: '', accountNumber: '' }), enabled: complete !== null }, queryClient);
  const saved = useQuery(beneficiariesQuery(owner), queryClient);
  const payout = useQuery({ ...payoutAccountQuery, enabled: Boolean(owner) }, queryClient);
  // The bank list is read once the screen opens, so a bank's name shows beside its code before the sheet is ever opened.
  useQuery({ ...banksQuery, enabled: Boolean(owner) }, queryClient);

  // Nobody has a wallet until they open one (R-6): the saved accounts say so, and the way in opens, once.
  const led = useRef(false);
  const noWallet = isNoWallet(saved.error) || isNoWallet(payout.error);
  useEffect(() => {
    if (noWallet && !led.current) {
      led.current = true;
      entry.open();
    }
  }, [noWallet, entry]);

  // A refusal for the hour's name check limit ends: when the wait the Hub named has passed, the check is made again for the same number.
  const wait = check.isError ? nameCheckWait(check.error) : null;
  const refetchCheck = check.refetch;
  useEffect(() => {
    if (wait === null) return undefined;
    const timer = setTimeout(() => void refetchCheck(), wait * 1000);
    return () => clearTimeout(timer);
  }, [check.error, wait, refetchCheck]);

  const nameCheck: NameCheck =
    complete === null
      ? { status: 'idle' }
      : check.isSuccess
        ? { status: 'success', data: check.data }
        : check.isError
          ? { status: 'error', unconfirmed: isRefusedAccount(check.error), message: check.error.message }
          : { status: 'pending' };
  const line = nameLine(form, null, nameCheck);
  const hint = nameLineHint(line, 'send');
  const savedRows = useMemo(() => savedBankRows(saved.data ?? []), [saved.data]);
  const resolved = complete !== null && check.isSuccess ? check.data : null;

  const proceed = () => {
    if (!resolved) return;
    const known = saved.data ? savedBankRowFor(saved.data, resolved.bankCode, resolved.accountNumber) : undefined;
    onPick(bankPayeeOf(resolved.accountName, { bankCode: resolved.bankCode, bankName: resolved.bankName, accountNumber: resolved.accountNumber, nameToken: resolved.nameToken, saved: Boolean(known) }));
  };

  const pickSaved = (bank: Omit<BankPayee, 'nameToken' | 'saved'>, name: string) =>
    onPick(bankPayeeOf(name, { ...bank, nameToken: null, saved: true }));

  const scrollRef = useRef(null);
  return (
    <AuthFrame
      testID="send-bank-screen"
      navTitle="Send money"
      onBack={onBack}
      scrollRef={scrollRef}
      footer={<Button testID="send-bank-continue" label="Continue" full disabled={!resolved} onPress={proceed} />}
    >
      <View style={styles.body}>
        <SegmentedTabs<SendWay>
          testID="send-ways"
          label="Who to send to"
          items={ways}
          value="bank"
          onChange={(way) => {
            if (way === 'user') onWawuUser();
            if (way === 'abroad') onAbroad?.();
          }}
        />
        <TextField
          label="Bank"
          testID="send-bank-field"
          value={form.bank?.name ?? ''}
          placeholder="Choose the bank"
          leadingIcon="Landmark"
          trailingIcon="ChevronDown"
          onPress={() => setPicking(true)}
          accessibilityLabel={form.bank ? `Bank, ${form.bank.name}` : 'Bank, choose the bank'}
          accessibilityHint="Opens the list of banks"
        />
        <AuthField
          scrollRef={scrollRef}
          label="Account number"
          testID="send-bank-number"
          mono
          hint={hint?.hint}
          tone={hint?.tone}
          announce={hint?.announce}
          value={form.accountNumber}
          // No `maxLength` on the raw input: the platform would cut a pasted "0123 456 789" to ten characters before the spaces are
          // taken out. `digitsOnly` keeps the digits, then caps at ten.
          onChangeText={(typed) => setForm({ ...form, accountNumber: digitsOnly(typed) })}
          error={line.kind === 'unconfirmed' ? line.message : undefined}
          loading={line.kind === 'checking'}
          keyboardType="number-pad"
          inputMode="numeric"
          autoComplete="off"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={proceed}
        />
        {line.kind === 'unchecked' ? (
          <View style={styles.retry}>
            <Text variant="meta" tone="textMuted" testID="send-bank-unchecked" accessibilityLiveRegion="polite">
              {check.isError ? failureMessage(check.error) : 'We could not check this account.'}
            </Text>
            <Button testID="send-bank-retry" label="Try again" variant="secondary" size="sm" icon="RotateCw" onPress={() => void check.refetch()} />
          </View>
        ) : null}
        <Saved rows={savedRows} query={saved} payout={payout.data ?? null} onPickSaved={pickSaved} />
      </View>
      <BankSheet
        visible={picking}
        onClose={() => setPicking(false)}
        selectedCode={form.bank?.code ?? null}
        onPick={(bank) => {
          setPicking(false);
          setForm({ ...form, bank: { code: bank.code, name: bank.name } });
        }}
      />
    </AuthFrame>
  );
}

type SavedProps = {
  rows: readonly Beneficiary[];
  query: { isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown };
  payout: { bankCode: string; bankName: string; accountNumber: string; accountName: string } | null;
  onPickSaved: (bank: Omit<BankPayee, 'nameToken' | 'saved'>, name: string) => void;
};

/** W8's "Saved": My payout account first (tagged "withdraw"), then each saved bank account, newest first, as the Hub keeps them. */
function Saved({ rows, query, payout, onPickSaved }: SavedProps) {
  if (query.isPending) return <SkeletonRows count={2} testID="send-saved-loading" />;
  if (query.isError && !isNoWallet(query.error)) {
    return (
      <ErrorState
        testID="send-saved-error"
        icon={isApiError(query.error) && query.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
        title="We couldn't load your saved accounts"
        message={failureMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    );
  }
  if (!payout && rows.length === 0) return null;
  return (
    <View testID="send-saved" style={styles.section}>
      <Text variant="label" accessibilityRole="header">
        Saved
      </Text>
      <GroupedList>
        {payout ? (
          <ListRow
            testID="saved-payout"
            lead={<IconTile icon="Landmark" tone="accent" size={44} />}
            title="My payout account"
            subtitle={`${bankLine(payout)} · withdraw`}
            onPress={() => onPickSaved({ bankCode: payout.bankCode, bankName: payout.bankName, accountNumber: payout.accountNumber }, payout.accountName)}
          />
        ) : null}
        {rows.map((row) => {
          const account = row.bankAccount;
          if (!account) return null;
          return (
            <ListRow
              key={row.id}
              testID={`saved-${row.id}`}
              lead={<IconTile icon="Landmark" tone="neutral" size={44} />}
              title={account.accountName}
              subtitle={bankLine(account)}
              onPress={() => onPickSaved({ bankCode: account.bankCode, bankName: account.bankName, accountNumber: account.accountNumber }, account.accountName)}
            />
          );
        })}
      </GroupedList>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg },
  section: { gap: SECTION_GAP },
  retry: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
});
