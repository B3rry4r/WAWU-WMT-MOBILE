import { onSessionEnd, useSession } from '@/api/session';

/**
 * Counts the sessions that have ended on this phone. The app's own guard for a mutation (`src/api/query.ts`) works the
 * same way: whatever starts under one count and finishes under another belongs to an account that is gone, so its
 * answer is dropped and never written into the cache the next account reads.
 */
let ended = 0;
onSessionEnd(() => {
  ended += 1;
});

/**
 * Call when a save starts. The function it returns says whether the same session is still the one signed in: false
 * after a sign-out, a refused refresh, or another account signing in, however slowly the answer came.
 */
export function startedInThisSession(): () => boolean {
  const started = ended;
  return () => started === ended;
}

/**
 * Whether anyone is signed in, for `enabled` on every query a settings screen runs. A screen still on show when the
 * session ends (or one opened with no session at all) must not ask the Hub anything: the request would go out with
 * no token, answer 401, and a person who signs in next would join that dead request instead of making their own.
 */
export function useSignedIn(): boolean {
  return useSession().status === 'signedIn';
}
