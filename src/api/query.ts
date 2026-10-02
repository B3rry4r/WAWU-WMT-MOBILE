import { QueryClient } from '@tanstack/react-query';

import { isApiError } from './errors';

const STALE_MS = 30_000;
const RETRY_LIMIT = 2;

/**
 * Query defaults for the whole app. Retries only what can succeed on a second
 * try (no connection, server trouble); a 4xx answer is final. A signed-out
 * answer is never retried, because the session already tried to refresh.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_MS,
        retry: (failures, error) =>
          failures < RETRY_LIMIT && (!isApiError(error) || error.kind === 'network' || error.kind === 'server'),
      },
      mutations: { retry: false },
    },
  });
}

export const queryClient = createQueryClient();
