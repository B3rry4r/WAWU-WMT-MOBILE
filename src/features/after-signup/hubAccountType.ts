import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';

export type HubAccountType = 'user' | 'creator';

/**
 * `PUT /users/me/account-type` (AUTH-06): records the account type on the Hub's profile, with no wallet opened (R-6; `PATCH /users/me`
 * opens one for a creator, BACKEND_GAPS G-34). Idempotent. Resolves with the type the Hub now holds: a creator is never moved back to a
 * user, so it can differ from `type`. Used by the sign-up gate (the type picked at A2) and by "Become a creator" (P10).
 */
export async function setHubAccountType(type: HubAccountType): Promise<HubAccountType> {
  const body = await unwrap(api.PUT('/api/hub/users/me/account-type', { body: { accountType: type } }));
  const held = (body as { data?: { accountType?: unknown } | null } | null)?.data?.accountType;
  if (held !== 'user' && held !== 'creator') throw new ApiError('unknown', 200, 'The account type could not be read. Try again.');
  return held;
}

/**
 * The account type the Hub holds for this person (`GET /users/me`): null when it holds none yet. A read the Hub cannot answer throws, so the
 * caller sends nothing and looks again on the next start.
 */
export async function readHubAccountType(): Promise<HubAccountType | null> {
  const body = await unwrap(api.GET('/api/hub/users/me'));
  const held = (body as { data?: { accountType?: unknown } | null } | null)?.data?.accountType;
  if (held === null || held === undefined) return null;
  if (held !== 'user' && held !== 'creator') throw new ApiError('unknown', 200, 'The account type could not be read. Try again.');
  return held;
}

/**
 * Whether the Hub still needs `type` written. It does not when it holds that type already, or holds `creator`: a creator is never moved
 * back to a user, so writing `user` over one would change nothing (FIX-68 F-4).
 */
export function hubNeedsType(held: HubAccountType | null, type: HubAccountType): boolean {
  return held !== type && held !== 'creator';
}
