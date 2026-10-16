import { api, unwrap } from '@/api/client';
import type { components } from '@/api/schema.generated';

/**
 * INBOX-03's two Hub calls (backend `src/push/push-token.controller.ts`):
 * `POST /push-tokens` registers this phone for the signed-in person (idempotent,
 * so it is sent on every start), and `DELETE /push-tokens` removes it at sign-out.
 * The token travels in the body, never the URL. The Hub's success body is
 * `{ statusCode, message, data }` and the contract types only `data`
 * (SHARED-CHANGES.md row 11), so `registered` is read from either shape.
 */
export type RegisterPushToken = components['schemas']['RegisterPushTokenDto'];

function flagOf(body: unknown, key: 'registered' | 'removed'): boolean {
  if (typeof body !== 'object' || body === null) return false;
  const direct = (body as Record<string, unknown>)[key];
  if (typeof direct === 'boolean') return direct;
  const data = (body as { data?: unknown }).data;
  return typeof data === 'object' && data !== null && (data as Record<string, unknown>)[key] === true;
}

/** True when the Hub stored the phone. False when it did not (the account's deletion was asked for). */
export async function registerPushToken(body: RegisterPushToken): Promise<boolean> {
  return flagOf(await unwrap(api.POST('/api/hub/push-tokens', { body })), 'registered');
}

/** Removes this phone. Removing it twice is not an error. */
export async function removePushToken(expoPushToken: string): Promise<void> {
  await unwrap(api.DELETE('/api/hub/push-tokens', { body: { expoPushToken } }));
}
