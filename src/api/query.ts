import { MutationCache, QueryClient } from '@tanstack/react-query';

import { ApiError, isApiError } from './errors';
import { onSessionEnd } from './session';

const STALE_MS = 30_000;
const RETRY_LIMIT = 2;

/** Counts ended sessions. A mutation remembers the count it started under. */
let endedSessions = 0;
onSessionEnd(() => {
  endedSessions += 1;
});

const startedUnder = new WeakMap<object, number>();

/**
 * Query defaults for the whole app. Retries only what can succeed on a second
 * try (no connection, server trouble); a 4xx answer is final. A signed-out
 * answer is never retried, because the session already tried to refresh.
 *
 * The cache belongs to one signed-in account. When the session ends (sign-out,
 * a refused refresh, a sign-in that replaces a session), every query in flight
 * is cancelled, so a late answer is dropped, and the cache is emptied before
 * the new status is drawn, so the next account's first frame is a loading
 * state, never the last account's answer. A mutation still in flight then
 * cannot write its answer into the next account's cache either: its success
 * is turned into a signed-out failure before the screen's own `onSuccess` runs.
 */
export function createQueryClient(): QueryClient {
  const client = new QueryClient({
    mutationCache: new MutationCache({
      onMutate: (_variables, mutation) => {
        startedUnder.set(mutation, endedSessions);
      },
      onSuccess: (_data, _variables, _context, mutation) => {
        const started = startedUnder.get(mutation);
        if (started !== undefined && started !== endedSessions) {
          throw new ApiError('unauthorized', 401, 'You were signed out. Sign in again.');
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: STALE_MS,
        retry: (failures, error) =>
          failures < RETRY_LIMIT && (!isApiError(error) || error.kind === 'network' || error.kind === 'server'),
      },
      mutations: { retry: false },
    },
  });
  onSessionEnd(() => {
    // Reset first: it cancels each fetch in flight (its answer is then ignored)
    // and tells any screen still drawn that its data is gone, so it reads again
    // as the new account instead of keeping the old answer on screen.
    client.getQueryCache().getAll().forEach((query) => query.reset());
    client.clear();
  });
  return client;
}

/** The app's one cache (`src/app/_layout.tsx`). */
export const queryClient = createQueryClient();
