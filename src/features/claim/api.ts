import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

import { refreshIfBehindProof, retryAfterRefresh } from './freshToken';

/**
 * JOIN-03's one Hub call, as the Hub's contract types it: `POST /waitlist/claims`
 * with `{ code }`. The Hub's success body is `{ statusCode, message, data }` and the contract types only
 * `data` (SHARED-CHANGES.md row 11), so the call reads `data` itself.
 */
export type ClaimResult = components['schemas']['WaitlistClaimView'];

type Envelope<T> = { statusCode: number; message: string; data: T | null };

/** The answer was a success the app could not read: the claim may have gone through, so it says to look, not to try again. */
function unreadable(): ApiError {
  return new ApiError('unknown', 200, 'Your code was accepted, but the answer could not be read. Open your account again to see your plan.');
}

async function send(code: string): Promise<ClaimResult> {
  const body = (await unwrap(api.POST('/api/hub/waitlist/claims', { body: { code } }))) as unknown as Envelope<ClaimResult>;
  const result = body?.data;
  if (!result || typeof result !== 'object' || typeof result.tier !== 'object' || result.tier === null) throw unreadable();
  // The words of a repeat are told from when the code was claimed (round 3, D4): an answer without a readable time is not one the screen can tell truthfully.
  if (typeof result.claimedAt !== 'string' || Number.isNaN(Date.parse(result.claimedAt))) throw unreadable();
  return result;
}

/**
 * Claims a code. The token goes first to be renewed when it is older than a contact the person has proven since
 * (freshToken.ts rule 1); if the Hub still says no contact is confirmed, the token is renewed once and the claim is
 * sent once more (rule 2). Nothing else is repeated: a code is never sent a third time.
 */
export async function claimCode(code: string): Promise<ClaimResult> {
  await refreshIfBehindProof();
  try {
    return await send(code);
  } catch (failure) {
    return retryAfterRefresh(failure, () => send(code));
  }
}
