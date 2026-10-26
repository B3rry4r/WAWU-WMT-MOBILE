import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { queryClient } from '@/api/query';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { ListRow } from '@/components/ListRow';
import { ScreenFrame } from '@/components/ScreenFrame';
import { LoadingView, SkeletonRows } from '@/components/Skeleton';
import { EmptyState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { groupedAccountNumber } from '@/features/open-wallet/pin';
import { space } from '@/theme';

import { homeBalanceQuery, walletHomeQuery } from '../api/home';
import { useAddCurrency } from '../fx/AddCurrency';
import { chainName, formatMinor, NAIRA_DECIMALS, SHORT_NAME, type FxChain, type FxCode, type QuoteCode } from '../fx/amount';
import type { FxAccount } from '../fx/api';
import { isCoinCode } from '../fx/model';
import { FxFlag } from '../fx/parts';

/** A currency picked and not yet answered: the Hub has no row for it yet, and the screen draws the one it will have. */
type Row = Pick<FxAccount, 'id' | 'currency' | 'status' | 'chain' | 'balance' | 'decimals'>;
const openingRow = (code: FxCode): Row => ({ id: `opening-${code}`, currency: code, status: 'opening', chain: null, balance: null, decimals: 2 });

const STATUS: Record<FxAccount['status'], string> = { open: 'Open', opening: 'Opening', frozen: 'Frozen' };

/** A coin's account is one network's wallet: "USDT on Ethereum". */
const titleOf = (a: Row): string => {
  const code = a.currency as QuoteCode;
  const chain = a.chain as FxChain | null;
  return isCoinCode(code) && chain ? `${code} on ${chainName(chain)}` : `${SHORT_NAME[code]} account`;
};

export type AccountsScreenProps = { onBack: () => void };

/**
 * Accounts and currencies (D3, owner, 26 Oct 2026): the accounts the person holds, each as the Hub lists it with the provider's own figure,
 * and "Add a currency" while the Hub offers one. Opened from Wallet settings and from Settings, which draw the row only with a wallet open. The Naira wallet shows the bank's own figure
 * like the others; a currency just picked is a row saying Opening until the Hub has answered. Nothing here
 * adds one account's money to another's.
 */
export function AccountsScreen({ onBack }: AccountsScreenProps) {
  const owner = useSessionAccount(undefined);
  const wallet = useQuery({ ...walletHomeQuery(owner), enabled: Boolean(owner) }, queryClient);
  const adder = useAddCurrency(owner);
  const naira = wallet.data?.account ?? null;
  // The Naira wallet's own figure, as the bank gives it. A bank that does not answer leaves the row without one, never a 0 (the other rows do the same).
  const nairaBalance = useQuery(homeBalanceQuery(owner, Boolean(naira)), queryClient);
  const held = adder.accounts;
  const rows: readonly Row[] | null = held === null ? null : [...held, ...[...adder.opening].filter((code) => !held.some((a) => a.currency === code)).map(openingRow)];
  return (
    <ScreenFrame idPrefix="accounts" title="Accounts and currencies" onBack={onBack} gap={space.lg} testID="accounts-screen">
      {rows === null ? (
        <LoadingView testID="accounts-loading">
          <SkeletonRows count={3} />
        </LoadingView>
      ) : naira || rows.length > 0 ? (
        <GroupedList testID="accounts-list">
          {naira ? (
            <ListRow
              testID="accounts-naira"
              lead={<FxFlag currency="NGN" size={40} />}
              title="Naira wallet"
              subtitle={`${naira.bankName} · ${groupedAccountNumber(naira.accountNumber)}`}
              trailing={
                nairaBalance.data ? (
                  <Text variant="body" testID="accounts-naira-balance">
                    {formatMinor(nairaBalance.data.availableKobo, 'NGN', NAIRA_DECIMALS)}
                  </Text>
                ) : undefined
              }
            />
          ) : null}
          {rows.map((a) => (
            <ListRow
              key={a.id}
              testID={`accounts-${a.id}`}
              lead={<FxFlag currency={a.currency as QuoteCode} size={40} />}
              title={titleOf(a)}
              subtitle={STATUS[a.status]}
              trailing={
                a.balance ? (
                  <Text variant="body" testID={`accounts-${a.id}-balance`}>
                    {formatMinor(a.balance.availableMinor, a.currency as QuoteCode, a.decimals)}
                  </Text>
                ) : undefined
              }
            />
          ))}
        </GroupedList>
      ) : (
        <EmptyState testID="accounts-empty" icon="Wallet" title="No accounts yet" message="Add a currency to hold money in more than one." />
      )}
      {adder.notice}
      {adder.available ? (
        <View style={styles.add}>
          <Button testID="accounts-add" label="Add a currency" icon="Plus" full onPress={adder.show} />
        </View>
      ) : null}
      {adder.sheet}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  add: { marginTop: space.xs },
});
