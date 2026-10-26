import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { queryClient } from '@/api/query';
import { Banner } from '@/components/Banner';
import { ChoiceSheet } from '@/features/open-wallet/ChoiceField';

import type { FxCode } from './amount';
import { accountsQuery, currenciesQuery, openAccount, type FxAccount } from './api';
import { addOptions, sentenceOf, type AddOption } from './model';
import { beginOpening, endOpening, useOpening } from './opening';

export type AddCurrency = {
  /** The Hub lists a currency or coin this person can still add, and their accounts have been read: only then is any way in drawn (R-47). */
  available: boolean;
  /** The options, in the Hub's order. */
  options: readonly AddOption[];
  /** The person's accounts as the Hub lists them; null until read (or when they could not be). */
  accounts: readonly FxAccount[] | null;
  /** The currencies picked and still being opened (the call takes seconds): whatever draws them says "Opening", and none is offered again. */
  opening: ReadonlySet<FxCode>;
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
 *
 * Opening a currency takes several seconds. From the pick it is "opening" (`opening`, and `onOpening` says which, at once): it is not offered
 * again, a second pick of it is refused, and the screens draw it as Opening until the Hub has answered and the accounts are read again.
 */
export function useAddCurrency(owner: string | null, onOpened?: (code: FxCode) => void, onOpening?: (code: FxCode) => void): AddCurrency {
  const router = useRouter();
  const currencies = useQuery(currenciesQuery(owner), queryClient);
  const accounts = useQuery(accountsQuery(owner), queryClient);
  const [open, setOpen] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const opening = useOpening(owner);
  const options = useMemo(
    () => (accounts.data ? addOptions(currencies.data ?? null, new Set(accounts.data.map((a) => a.currency))).filter((o) => !opening.has(o.value)) : []),
    [currencies.data, accounts.data, opening],
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
      // Checked now, not after a redraw: a second tap on the same row before the sheet has gone reaches here too.
      if (!owner || !beginOpening(owner, code)) return;
      setProblem(null);
      onOpening?.(code);
      try {
        await openAccount(code);
        await queryClient.invalidateQueries({ queryKey: ['money'] });
        onOpened?.(code);
      } catch (error) {
        setProblem(sentenceOf(error, 'We could not open that account. Try again.'));
      } finally {
        endOpening(owner, code);
      }
    },
    [options, router, owner, onOpened, onOpening],
  );

  return {
    available: options.length > 0,
    options,
    accounts: accounts.data ?? null,
    opening,
    show: () => setOpen(true),
    sheet: <ChoiceSheet visible={open} onClose={() => setOpen(false)} title="Add a currency" options={options} selected={null} onPick={(code) => void pick(code)} testID="add-currency" />,
    notice: problem ? <Banner tone="danger" title="We could not open that account" body={problem} testID="add-currency-problem" /> : null,
  };
}
