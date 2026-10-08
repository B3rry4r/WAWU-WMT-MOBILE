import { QueryClientContext, type QueryClient } from '@tanstack/react-query';
import { useContext } from 'react';

import { queryClient } from '@/api/query';

/**
 * The query cache Today reads through: the provider's when there is one (the app's root gives it), else the
 * app's own `queryClient`, as the Wallet tab passes it (WALLET-01), so Home also draws under a router with no
 * provider of its own.
 */
export function useTodayClient(): QueryClient {
  return useContext(QueryClientContext) ?? queryClient;
}
