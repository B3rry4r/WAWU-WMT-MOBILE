import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { queryClient } from '@/api/query';

import { accountsQuery, currenciesQuery, type FxAccount, type FxCurrencies } from './api';
import { tabsOf } from './model';
import { useOpening } from './opening';
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
 * naira wallet is open (nobody has a wallet until they open one, R-6); until then nothing is asked and no tab is drawn. The tabs are the
 * accounts the person has added and the ones being opened, never every currency the Hub serves (R-106); a read that fails draws no tab it
 * cannot back, and the tab that is open says why by cause.
 */
export function useFxHome(owner: string | null, enabled: boolean): FxHome {
  const currencies = useQuery(currenciesQuery(owner, enabled), queryClient);
  const accounts = useQuery(accountsQuery(owner, enabled), queryClient);
  // A currency picked in "+ Add" and still being opened counts as added: its tab is there from the pick (R-106).
  const opening = useOpening(owner);
  const tabs = useMemo(() => tabsOf(accounts.data ?? null, opening), [accounts.data, opening]);
  return {
    currencies: currencies.data ?? null,
    accounts: accounts.data ?? null,
    accountsError: accounts.error,
    accountsPending: accounts.isPending && accounts.isFetching,
    tabs,
  };
}
