import createClient, { type Middleware } from 'openapi-fetch';

import { apiBaseUrl } from './env';
import { ApiError, failureOf, networkError, NO_ANSWER_CODE, noAnswerError, toApiError } from './errors';
import { carriesPaySource, paySourceCode } from './paySource';
import { refusalOf, reportSuspendedRefusal } from './suspension';
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
 *   - a read (GET) the Hub does not answer within READ_TIMEOUT_MS ends as the
 *     "No connection" error, so the screen shows its own error and Try again
 *     and not a loading bar for good (FIX-79 L3);
 *   - a write is never aborted, with one exception decided per request (FIX-87,
 *     SHARED-CHANGES WALLET-06 #5): a write that carries an Idempotency-Key AND
 *     is sent with `fetch: resendsUnderKey` by a screen that sends it again
 *     under that same key when no answer came ends the same way after
 *     WRITE_TIMEOUT_MS, as the network failure whose line is "We didn't get an
 *     answer" and not "No connection" (`noAnswerError`; an offline phone still
 *     reads as offline). The Hub may still do the work, so the repeat under the
 *     same key is what finds out. A write without a key is never aborted (it
 *     could move money twice), and neither is a keyed write whose screen does
 *     not re-send under the key (a new key per tap would repeat the work);
 *   - `unwrap` turns any failure into one ApiError (see errors.ts).
 */
/** How long a read may wait for the Hub's answer to start. Named so one place says it. */
export const READ_TIMEOUT_MS = 30_000;
/** How long a keyed write that its screen re-sends under the same key may wait for the answer to start. */
export const WRITE_TIMEOUT_MS = 30_000;

const IDEMPOTENCY_KEY = 'idempotency-key';

/**
 * How long this request may wait for the Hub's answer to start, or null for never. The one place that decides, per
 * request: every GET; a write only when its caller said it re-sends under the same key (`resends`) AND it carries a
 * non-empty Idempotency-Key. Any other write (no key, or a key its screen does not re-send) is never aborted.
 */
function timeoutOf(request: Request, resends: boolean): number | null {
  if (request.method === 'GET') return READ_TIMEOUT_MS;
  if (resends && (request.headers.get(IDEMPOTENCY_KEY) ?? '').length > 0) return WRITE_TIMEOUT_MS;
  return null;
}

/**
 * `send` with the timeout `timeoutOf` gives the request. A request with a timeout gets its own abort signal (the caller's,
 * if it sent one, still aborts it too); any other request goes to `send` exactly as it came. Our own timeout surfaces as
 * `networkError()`: the failure every money screen already reads as "no answer".
 */
function withTimeouts(send: typeof fetch, resends: boolean): typeof fetch {
  return async (input, init) => {
    const wait = input instanceof Request ? timeoutOf(input, resends) : null;
    if (!(input instanceof Request) || wait === null) return send(input, init);
    const controller = new AbortController();
    const forward = () => controller.abort();
    if (input.signal.aborted) forward();
    else input.signal.addEventListener('abort', forward);
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, wait);
    try {
      return await send(new Request(input, { signal: controller.signal }), init);
    } catch (error) {
      // A read that timed out is "No connection", as before. A write is told apart: it is not known that the phone is offline (F2).
      throw timedOut ? (input.method === 'GET' ? networkError() : noAnswerError()) : error;
    } finally {
      clearTimeout(timer);
      input.signal.removeEventListener('abort', forward);
    }
  };
}

/**
 * The opt-in a call passes as its `fetch` option: this write carries an Idempotency-Key and its screen sends it again
 * under that same key when no answer came (so the repeat finds out what the first did). It then ends as the network
 * failure after WRITE_TIMEOUT_MS. A call whose screen makes a new key for each try must not pass it.
 */
export const resendsUnderKey: typeof fetch = withTimeouts((input, init) => globalThis.fetch(input, init), true);

const client = createClient<paths>({ baseUrl: apiBaseUrl, fetch: withTimeouts(globalThis.fetch, false) });

/**
 * WALK-FIX H4 (walk L11): openapi-fetch builds the body, the URL and the request before it calls `fetch`, and reads the answer after, and
 * a throw in any of those never reaches the middleware's `onError`; it came out of `api.POST(...)` as a raw TypeError. Every call ends
 * as an ApiError: a real network failure as "No connection", anything else as the phone's own error (`failureOf`).
 */
function guarded<F extends (...args: never[]) => Promise<unknown>>(call: F): F {
  return (async (...args: Parameters<F>) => {
    try {
      return await call(...args);
    } catch (error) {
      throw failureOf(error);
    }
  }) as F;
}

export const api: typeof client = {
  ...client,
  request: guarded(client.request),
  GET: guarded(client.GET),
  PUT: guarded(client.PUT),
  POST: guarded(client.POST),
  DELETE: guarded(client.DELETE),
  OPTIONS: guarded(client.OPTIONS),
  HEAD: guarded(client.HEAD),
  PATCH: guarded(client.PATCH),
  TRACE: guarded(client.TRACE),
};

const sentWith = new Map<string, { token: string; copy: Request; resends: boolean }>();

const auth: Middleware = {
  async onRequest({ request, id, options }) {
    const token = await getAccessToken();
    if (!token) return undefined;
    request.headers.set('authorization', `Bearer ${token}`);
    sentWith.set(id, { token, copy: request.clone(), resends: options.fetch === resendsUnderKey });
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
    // The repeat after a refresh ends the way the first would have.
    return withTimeouts(fetch, sent.resends)(sent.copy);
  },
  onError({ id, error }) {
    sentWith.delete(id);
    // Our own end of a write's wait keeps its sentence; a failure to get an answer is "No connection"; any other throw (WALK-FIX H4)
    // is the phone's own and says so.
    return error instanceof ApiError && error.code === NO_ANSWER_CODE ? error : failureOf(error);
  },
};

/**
 * PAY-FX (R-91): the account that pays a wallet payment rides on one header every paying route reads; none is the naira wallet. It is
 * sent on the quote and the payment only (`carriesPaySource`), never on another Hub call.
 */
const paySource: Middleware = {
  onRequest({ request }) {
    const code = paySourceCode();
    if (!code || !carriesPaySource(request.method, new URL(request.url).pathname)) return undefined;
    request.headers.set('x-pay-source-currency', code);
    return request;
  },
};

/**
 * PRICE-LIST (R-101, lead ruling 27 Oct 2026, option A): every Hub request says it is the app's. Some routes the app uses are routes
 * the website also calls (a piece, a draft publish, an event and its ticket types), and the Hub holds a price to the owner's price
 * list on them only when it sees this header. Set first, so the copy kept for a repeat after a token refresh carries it too.
 */
export const APP_CLIENT_HEADER = 'x-wawu-client';
export const APP_CLIENT_VALUE = 'app';
const appClient: Middleware = {
  onRequest({ request }) {
    request.headers.set(APP_CLIENT_HEADER, APP_CLIENT_VALUE);
    return request;
  },
};

/**
 * USER-SUSPEND (R-121): a 403 the Hub sends a suspended person for a write is reported once (`./suspension`), whichever screen sent
 * it, so the app can open its one calm screen. The answer itself goes on to the caller unchanged. Read from a copy; any other 403
 * (and any answer that is not JSON) is left alone.
 */
const suspension: Middleware = {
  async onResponse({ response }) {
    if (response.status !== 403) return undefined;
    try {
      const refusal = refusalOf(await response.clone().json());
      if (refusal) reportSuspendedRefusal(refusal);
    } catch {
      // Not JSON: not ours.
    }
    return undefined;
  },
};

api.use(appClient);
api.use(paySource);
api.use(auth);
api.use(suspension);

type Result<T, E> = { data?: T; error?: E; response: Response };

/**
 * Resolves with the data, or rejects with an ApiError. TanStack Query's
 * `queryFn` and `mutationFn` return this, so every screen shows one error shape.
 *
 *   const me = await unwrap(api.GET('/api/hub/users/me'));
 */
export async function unwrap<T, E>(request: Promise<Result<T, E>>): Promise<T> {
  const { data, error, response } = await request;
  if (!response.ok) throw toApiError(response.status, error, response.headers);
  return data as T;
}
