import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';

/**
 * The Hub's two calls for a person's name and username (SIGNUP-NAMES, R-82). The username is the profile's handle.
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data`, so each call reads `data`.
 */
export type UsernameAnswer = { handle: string; available: boolean; message: string | null };
export type SavedIdentity = { firstName: string | null; lastName: string | null; handle: string | null };

function dataOf<T>(body: unknown, what: string): T {
  const data = (body as { data?: T | null } | null)?.data;
  if (!data || typeof data !== 'object') throw new ApiError('unknown', 200, `Your ${what} could not be read. Try again.`);
  return data;
}

/** `GET /users/handle-available` (closes G-111): free or not, in the Hub's words. Signed out is fine: sign-up asks it. */
export async function askUsername(handle: string): Promise<UsernameAnswer> {
  const body = await unwrap(api.GET('/api/hub/users/handle-available', { params: { query: { handle } } }));
  const said = dataOf<UsernameAnswer>(body, 'answer');
  if (typeof said.available !== 'boolean') throw new ApiError('unknown', 200, 'The answer could not be read. Try again.');
  return said;
}

/** `PUT /users/me/identity`: saves the parts sent. A taken name is a 409 with the Hub's sentence as the error's message. */
export async function putIdentity(parts: { firstName?: string; lastName?: string; handle?: string }): Promise<SavedIdentity> {
  return dataOf<SavedIdentity>(await unwrap(api.PUT('/api/hub/users/me/identity', { body: parts })), 'details');
}

/** `GET /users/me`: the name (from the token WAWU ID issued) and the handle the profile holds. */
export async function readIdentity(): Promise<SavedIdentity> {
  const body = await unwrap(api.GET('/api/hub/users/me'));
  const me = dataOf<{ firstName?: unknown; lastName?: unknown; handle?: unknown }>(body, 'profile');
  const text = (value: unknown) => (typeof value === 'string' && value.trim() !== '' ? value.trim() : null);
  return { firstName: text(me.firstName), lastName: text(me.lastName), handle: text(me.handle) };
}
