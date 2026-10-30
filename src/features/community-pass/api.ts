import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';
import { filled, isKobo } from '@/features/money-attempt/refusal';

/**
 * The reads behind a private community's pass (INBOX-14: I30, I31), as the Hub's contract types them (INBOX-24, R-63). The pass is bought in
 * the store sheet (R-86, `@/features/store`); these two only say where the person stands with it:
 * - `GET /communities/{id}/pass`: the host's rule, when the person's pass ends, whether they can buy or renew.
 * - `GET /users/{wawuId}/public-profile`: the host's handle (the room carries only the host's id).
 */
export type PassView = components['schemas']['CommunityPassView'];

type Envelope<T> = { data?: T | null };

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

export const passKey = (id: string) => ['community', id, 'pass'] as const;
export const hostKey = (wawuId: string) => ['community', 'host', wawuId] as const;

/** GET /communities/{id}/pass. A body without the price rule, the end date rule or the flags is refused, never drawn half empty. */
export async function fetchPass(id: string): Promise<PassView> {
  const body = (await unwrap(api.GET('/api/hub/communities/{id}/pass', { params: { path: { id } } }))) as unknown as Envelope<PassView>;
  const v = body?.data;
  const ok =
    v &&
    typeof v === 'object' &&
    typeof v.sellsPass === 'boolean' &&
    typeof v.active === 'boolean' &&
    typeof v.canRenew === 'boolean' &&
    typeof v.canBuy === 'boolean' &&
    typeof v.isHost === 'boolean' &&
    (v.priceKobo === null || isKobo(v.priceKobo)) &&
    (v.passUntil === null || filled(v.passUntil));
  if (!ok) throw unreadable('pass');
  return v as PassView;
}

/** The host's handle for the line "hosted by", from their public profile. Null when it cannot be read: the line is then left out. */
export async function fetchHostHandle(wawuId: string): Promise<string | null> {
  const body = (await unwrap(api.GET('/api/hub/users/{wawuId}/public-profile', { params: { path: { wawuId } } }))) as unknown as Envelope<{
    handle?: unknown;
  }>;
  const handle = body?.data?.handle;
  return filled(handle) ? handle.replace(/^@/, '') : null;
}
