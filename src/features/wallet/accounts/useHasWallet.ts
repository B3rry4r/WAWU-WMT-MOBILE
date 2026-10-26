import { useQuery } from '@tanstack/react-query';

import { queryClient } from '@/api/query';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';

import { walletHomeQuery } from '../api/home';

/**
 * Whether the Hub says this person has a wallet (open or frozen). Nobody has one until they open it (R-6), and a read that is out, failed
 * or still on its way says no: whatever is drawn only for a person with a wallet is not drawn then (R-47). Read through the same key the
 * Wallet tab uses, so it costs nothing when that has just been read.
 */
export function useHasWallet(): boolean {
  const owner = useSessionAccount(undefined);
  const wallet = useQuery(walletHomeQuery(owner), queryClient);
  return wallet.data?.state === 'open' || wallet.data?.state === 'frozen';
}
