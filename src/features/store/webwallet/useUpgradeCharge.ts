import { useQuery } from '@tanstack/react-query';
import { Platform } from 'react-native';

import { queryClient } from '@/api/query';
import { formatNaira } from '@/components/pay-sheet';

import { askWebQuote } from './api';

/**
 * WEBAPP-08: what an upgrade will really charge on the web (the difference, with the bank's charge), read from the Hub's quote and never worked
 * out here. Null on a phone, for a first purchase, or until the quote has come: the button then says no amount.
 */
export function useUpgradeCharge(tierId: string | null | undefined, on: boolean): string | null {
  const enabled = Platform.OS === 'web' && on && Boolean(tierId);
  const quote = useQuery(
    { queryKey: ['web-upgrade-quote', tierId ?? ''], queryFn: () => askWebQuote({ kind: 'upgrade', tierId: tierId as string }, ''), enabled, staleTime: 0, retry: false },
    queryClient,
  );
  return enabled && quote.data ? formatNaira(quote.data.payment.totalKobo) : null;
}
