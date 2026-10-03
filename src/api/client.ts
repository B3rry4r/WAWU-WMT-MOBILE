import createClient, { type Middleware } from 'openapi-fetch';

import { apiBaseUrl } from './env';
import { networkError, toApiError } from './errors';
import { getAccessToken, isCurrentSessionToken, refreshAccessToken } from './session';
import type { paths } from './schema.generated';

export { apiBaseUrl } from './env';
export { ApiError, isApiError } from './errors';

/**
 * The typed Hub API client. Every request and response type comes from
 * schema.generated.ts, which is generated from the backend contract
 * (`npm run api`). Never hand-write a response shape: if the contract does not
 * describe what a screen needs, that is a backend task (BACKEND_GAPS.md).
 *
 * Every screen calls it the same way:
 *   - the signed-in token goes on each request;
 *   - a 401 refreshes the token once, silently, and repeats the request, but
 *     only within the session the request was sent in: a request from a
 *     session that has since ended (sign-out, another account) ends as
 *     signed out and is never sent again with the new session's token;
 *   - `unwrap` turns any failure into one ApiError (see errors.ts).
 */
export const api = createClient<paths>({ baseUrl: apiBaseUrl });

const sentWith = new Map<string, { token: string; copy: Request }>();

const auth: Middleware = {
  async onRequest({ request, id }) {
    const token = await getAccessToken();
    if (!token) return undefined;
    request.headers.set('authorization', `Bearer ${token}`);
    sentWith.set(id, { token, copy: request.clone() });
    return request;
  },
  async onResponse({ response, id }) {
    const sent = sentWith.get(id);
    sentWith.delete(id);
    if (!sent || response.status !== 401) return undefined;
    const token = await refreshAccessToken(sent.token);
    // Checked again now, just before sending: the session may have changed while the refresh ran.
    if (!token || !isCurrentSessionToken(sent.token) || !isCurrentSessionToken(token)) return undefined;
    sent.copy.headers.set('authorization', `Bearer ${token}`);
    return fetch(sent.copy);
  },
  onError({ id }) {
    sentWith.delete(id);
    return networkError();
  },
};

api.use(auth);

type Result<T, E> = { data?: T; error?: E; response: Response };

/**
 * Resolves with the data, or rejects with an ApiError. TanStack Query's
 * `queryFn` and `mutationFn` return this, so every screen shows one error shape.
 *
 *   const me = await unwrap(api.GET('/api/hub/users/me'));
 */
export async function unwrap<T, E>(request: Promise<Result<T, E>>): Promise<T> {
  const { data, error, response } = await request;
  if (!response.ok) throw toApiError(response.status, error);
  return data as T;
}
