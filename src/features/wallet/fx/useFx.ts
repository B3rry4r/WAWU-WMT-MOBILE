import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { queryClient } from '@/api/query';

import { accountsQuery, currenciesQuery, type FxAccount, type FxCurrencies } from './api';
import { tabsOf } from './model';
import type { WalletTab } from './parts';

export type FxHome = {
  currencies: FxCurrencies | null;
  accounts: FxAccount[] | null;
  accountsError: unknown;
  accountsPending: boolean;
  tabs: WalletTab[];
};

/**
 * What the Hub says about the foreign accounts, for W1: the currencies it serves and the person's accounts. `enabled` is true once the
 * naira wallet is open (nobody has a wallet until they open one, R-6); until then nothing is asked and no tab is drawn. A read that fails
 * draws no tab it cannot back, and the tab that is open says why by cause.
 */
export function useFxHome(owner: string | null, enabled: boolean): FxHome {
  const currencies = useQuery(currenciesQuery(owner, enabled), queryClient);
  const accounts = useQuery(accountsQuery(owner, enabled), queryClient);
  const tabs = useMemo(() => tabsOf(currencies.data ?? null, accounts.data ?? null), [currencies.data, accounts.data]);
  return {
    currencies: currencies.data ?? null,
    accounts: accounts.data ?? null,
    accountsError: accounts.error,
    accountsPending: accounts.isPending && accounts.isFetching,
    tabs,
  };
}
