import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { queryClient } from '@/api/query';
import { Banner } from '@/components/Banner';
import { ChoiceSheet } from '@/features/open-wallet/ChoiceField';

import type { FxCode } from './amount';
import { accountsQuery, currenciesQuery, openAccount, type FxAccount } from './api';
import { addOptions, sentenceOf, type AddOption } from './model';

export type AddCurrency = {
  /** The Hub lists a currency or coin this person can still add, and their accounts have been read: only then is any way in drawn (R-47). */
  available: boolean;
  /** The options, in the Hub's order. */
  options: readonly AddOption[];
  /** The person's accounts as the Hub lists them; null until read (or when they could not be). */
  accounts: readonly FxAccount[] | null;
  /** Opens the add-a-currency choice. */
  show: () => void;
  /** The choice itself: draw it once on the screen that has the way in. */
  sheet: ReactNode;
  /** Why the last one could not be opened, in words of ours, or null. Draw it near the way in. */
  notice: ReactNode;
};

/**
 * The add-a-currency choice (R-83, R-84, R-87), shared by every place that leads to it: the Wallet strip's "+ Add", the Home money card,
 * the note after a wallet opens, and Settings. The currencies and coins are what the Hub offers this person (`GET /money/fx/currencies`
 * and their accounts), never a fixed list. A currency opens an account in it at once (and `onOpened` says which); a coin goes to W22,
 * which picks its network and opens that account.
 */
export function useAddCurrency(owner: string | null, onOpened?: (code: FxCode) => void): AddCurrency {
  const router = useRouter();
  const currencies = useQuery(currenciesQuery(owner), queryClient);
  const accounts = useQuery(accountsQuery(owner), queryClient);
  const [open, setOpen] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const options = useMemo(
    () => (accounts.data ? addOptions(currencies.data ?? null, new Set(accounts.data.map((a) => a.currency))) : []),
    [currencies.data, accounts.data],
  );

  const pick = useCallback(
    async (code: FxCode) => {
      setOpen(false);
      const chosen = options.find((o) => o.value === code);
      if (!chosen) return;
      if (chosen.coin) {
        router.push({ pathname: '/crypto-receive', params: { coin: code } });
        return;
      }
      setProblem(null);
      try {
        await openAccount(code);
        await queryClient.invalidateQueries({ queryKey: ['money'] });
        onOpened?.(code);
      } catch (error) {
        setProblem(sentenceOf(error, 'We could not open that account. Try again.'));
      }
    },
    [options, router, onOpened],
  );

  return {
    available: options.length > 0,
    options,
    accounts: accounts.data ?? null,
    show: () => setOpen(true),
    sheet: <ChoiceSheet visible={open} onClose={() => setOpen(false)} title="Add a currency" options={options} selected={null} onPick={(code) => void pick(code)} testID="add-currency" />,
    notice: problem ? <Banner tone="danger" title="We could not open that account" body={problem} testID="add-currency-problem" /> : null,
  };
}
