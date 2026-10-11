/**
 * A signed-out visit to the claim screen (`/claim-code`) goes to sign-in, and a sign-in that follows comes back to the
 * claim (JOIN-03 round 3, N14). The visit is remembered here, in memory only, for a few minutes: long enough for a person
 * to sign in, short enough that a visit someone walked away from never sends a later sign-in to the claim screen.
 * Taking it clears it, so it sends one sign-in at most.
 */
export const CLAIM_RETURN_WINDOW_MS = 10 * 60 * 1000;

let visitedAt: number | null = null;

/** The claim screen was opened signed out (or the session ended while it was open). */
export function rememberClaimVisit(now: number = Date.now()): void {
  visitedAt = now;
}

/** A sign-in just succeeded: true once if a recent signed-out visit to the claim screen is waiting. */
export function takeClaimVisit(now: number = Date.now()): boolean {
  const waiting = visitedAt !== null && now - visitedAt <= CLAIM_RETURN_WINDOW_MS;
  visitedAt = null;
  return waiting;
}

/** Tests only. */
export function resetClaimVisit(): void {
  visitedAt = null;
}
