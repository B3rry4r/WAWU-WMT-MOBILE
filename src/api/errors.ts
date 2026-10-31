/**
 * The one error every API call fails with. Screens branch on `kind` (and on
 * `code` where the backend sends one, such as EMAIL_NOT_VERIFIED), and show
 * `message`, which is the server's own sentence.
 */
export type ApiErrorKind =
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'validation'
  | 'rate_limited'
  | 'server'
  /** A throw on the phone itself, before any request left or after the answer came (a body that would not build, an answer that would not read). Never "No connection". */
  | 'client'
  | 'unknown';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** HTTP status, or 0 when the request never got an answer. */
  readonly status: number;
  /** Machine code from the server (for example EMAIL_NOT_VERIFIED, or a money route's `reason.code` such as provider_unreachable), when sent. */
  readonly code?: string;
  /**
   * Seconds the server asks the caller to wait, or null when the answer names none: the body's own figure (WAWU ID
   * sends it with every 429), else a money refusal's `reason.retryAfterSeconds`, else the longest `Retry-After` or
   * `Retry-After-<window>` header (the Hub's throttler sends `Retry-After-short` and `Retry-After-medium`).
   */
  readonly retryAfterSeconds: number | null;
  /** What a money refusal's `reason` said about trying again: matches left today and the wait, when it named them. */
  readonly detail?: ApiErrorDetail;

  constructor(
    kind: ApiErrorKind,
    status: number,
    message: string,
    code?: string,
    retryAfterSeconds?: number | null,
    detail?: ApiErrorDetail,
  ) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds ?? null;
    this.detail = detail;
  }
}

/** The figures a money refusal's `reason` carries (contract `MoneyErrorReason`), each present only when the server sent it. */
export type ApiErrorDetail = {
  checksLeft?: number;
  retryAfterSeconds?: number;
  /** A refused opening's `reason.fields` (WALLET-41): the names of the fields the provider pointed at, never a value. */
  fields?: string[];
};

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;
const HTTP_VALIDATION = [400, 422];
const HTTP_RATE_LIMITED = 429;
const HTTP_SERVER_MIN = 500;

function kindOf(status: number): ApiErrorKind {
  if (status === HTTP_UNAUTHORIZED) return 'unauthorized';
  if (status === HTTP_FORBIDDEN) return 'forbidden';
  if (status === HTTP_NOT_FOUND) return 'not_found';
  if (status === HTTP_CONFLICT) return 'conflict';
  if (HTTP_VALIDATION.includes(status)) return 'validation';
  if (status === HTTP_RATE_LIMITED) return 'rate_limited';
  if (status >= HTTP_SERVER_MIN) return 'server';
  return 'unknown';
}

/**
 * A money route's refusal carries its code in `reason.code` (wawu-backend
 * docs/contract/CONVENTIONS.md section 3: `wallet_not_open`,
 * `provider_unreachable`, `pin_incorrect` and the rest).
 */
function reasonCode(reason: unknown): string | undefined {
  if (typeof reason !== 'object' || reason === null) return undefined;
  const code = (reason as Record<string, unknown>).code;
  return typeof code === 'string' ? code : undefined;
}

function recordOf(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

/** A wait in whole seconds, rounded up; nothing for a value that is not a positive number. */
function positiveSeconds(value: unknown): number | undefined {
  const n = typeof value === 'string' ? Number(value.trim()) : value;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.ceil(n) : undefined;
}

/** The longest wait any `Retry-After` or `Retry-After-<window>` header names. */
function waitFromHeaders(headers: Headers | undefined): number | undefined {
  let longest: number | undefined;
  headers?.forEach((value, name) => {
    if (!name.toLowerCase().startsWith('retry-after')) return;
    const seconds = positiveSeconds(value);
    if (seconds !== undefined && (longest === undefined || seconds > longest)) longest = seconds;
  });
  return longest;
}

/** What `reason` said about trying again, or nothing when it said neither. */
function detailOf(reason: unknown): ApiErrorDetail | undefined {
  const record = recordOf(reason);
  const left = record.checksLeft;
  const wait = positiveSeconds(record.retryAfterSeconds);
  const named = Array.isArray(record.fields)
    ? record.fields.filter((f): f is string => typeof f === 'string' && /^[A-Za-z_][A-Za-z0-9_.[\]]{0,59}$/.test(f)).slice(0, 10)
    : [];
  const detail: ApiErrorDetail = {
    ...(typeof left === 'number' && Number.isSafeInteger(left) ? { checksLeft: left } : {}),
    ...(wait !== undefined ? { retryAfterSeconds: wait } : {}),
    ...(named.length > 0 ? { fields: named } : {}),
  };
  return Object.keys(detail).length > 0 ? detail : undefined;
}

/**
 * Both backends answer errors as `{ statusCode, message, code? }`; the Hub adds
 * `data: null`, and validation failures send `message` as a list of sentences.
 * Money routes put their code in `reason.code` instead, which becomes `code`
 * here, so every screen branches on the one field. WAWU ID's 429s carry
 * `retryAfterSeconds`, kept as is so a screen counts down the server's figure;
 * a money refusal's `reason` can carry `checksLeft` and `retryAfterSeconds`
 * (kept in `detail`), and when neither names a wait the response's
 * `Retry-After*` headers do (pass `headers`).
 * `status` is the HTTP status of the response (it wins over `statusCode`, which
 * WAWU ID sets to 404 on a 401 for a missing account).
 */
export function toApiError(status: number, body: unknown, headers?: Headers): ApiError {
  const record = recordOf(body);
  const raw = record.message;
  const message = Array.isArray(raw)
    ? raw.filter((part) => typeof part === 'string').join('. ')
    : typeof raw === 'string'
      ? raw
      : '';
  const code = typeof record.code === 'string' ? record.code : reasonCode(record.reason);
  const wait = record.retryAfterSeconds;
  const detail = detailOf(record.reason);
  const retryAfterSeconds =
    typeof wait === 'number' && Number.isFinite(wait) && wait >= 0 ? wait : (detail?.retryAfterSeconds ?? waitFromHeaders(headers));
  return new ApiError(kindOf(status), status, message || 'Something went wrong. Try again.', code, retryAfterSeconds, detail);
}

/** The request never reached the server (offline, DNS, timeout). */
export function networkError(): ApiError {
  return new ApiError('network', 0, 'No connection. Check your internet and try again.');
}

/** What a person reads when the phone itself threw (WALK-FIX H4): not the network, and not the Hub. */
export const CLIENT_TITLE = 'Something went wrong on this phone';
export const CLIENT_HELP = 'Try again, and if it keeps happening, tell us.';
export const CLIENT_LINE = `${CLIENT_TITLE}. ${CLIENT_HELP}`;
/** The `code` of the error `clientError` makes. */
export const CLIENT_CODE = 'client_error';

/**
 * Words a real network failure carries: React Native's fetch ("Network request failed", "Network request timed out"), the browsers'
 * ("Failed to fetch", "Load failed", "NetworkError when attempting to fetch resource"), Node's ("fetch failed") and the system's own
 * ("The Internet connection appears to be offline", "The network connection was lost").
 */
const NETWORK_WORDS =
  /network request (failed|timed out)|failed to fetch|fetch failed|load failed|networkerror when attempting to fetch|internet connection appears to be offline|network connection was lost|the request timed out|econnrefused|econnreset|enotfound|etimedout/i;

/**
 * True when the request could not reach the server: the fetch rejected the way a dead connection makes it reject, or it was aborted
 * or timed out. Any other throw (a body that would not serialize, a bad URL, a bug) is the phone's own and is not "No connection".
 */
export function isNetworkFailure(error: unknown): boolean {
  if (error instanceof ApiError) return error.kind === 'network';
  if (typeof error !== 'object' || error === null) return false;
  const { name, message } = error as { name?: unknown; message?: unknown };
  if (name === 'AbortError' || name === 'TimeoutError') return true;
  return typeof message === 'string' && NETWORK_WORDS.test(message);
}

/**
 * The phone's own throw as the one error screens read (`kind` 'client', the line above). The name and message go to the console so a
 * report can be traced; long digit runs are masked, and nothing else from the request is logged.
 */
export function clientError(error: unknown): ApiError {
  const { name, message } = (typeof error === 'object' && error !== null ? error : {}) as { name?: unknown; message?: unknown };
  const said = typeof message === 'string' ? message.replace(/\d{6,}/g, '#').slice(0, 160) : '';
  console.error('client error', typeof name === 'string' ? name : typeof error, said);
  return new ApiError('client', 0, CLIENT_LINE, CLIENT_CODE);
}

/**
 * Any failure as an ApiError: one already is, a real network failure is the "No connection" error, and anything else is the phone's
 * own throw (`clientError`). The one place that decides, for the client and for every screen's own wrapper.
 */
export function failureOf(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return isNetworkFailure(error) ? networkError() : clientError(error);
}

/** The `code` of the error `noAnswerError` makes: a screen that wants to tell "the Hub did not answer" from "no connection" reads it. */
export const NO_ANSWER_CODE = 'no_answer';
/**
 * What a person reads when our own wait for the answer to a write ended (WRITE_TIMEOUT_MS). It is the line the PIN sheets
 * already show (`PAYMENT_UNANSWERED_LINE`, which a test keeps equal to it). It does not say the phone is offline, because it
 * may not be, and it does not say what happened: the repeat, under the same key, is what finds out.
 */
export const NO_ANSWER_LINE = "We didn't get an answer. Try again: it will only happen once.";

/**
 * A write the Hub took and did not answer within our wait (FIX-87, SWEEP-MONEY-5b F2). Still the network failure to every
 * branch that reads `kind` and `status` (`network`, 0), so each screen that sends the same request again keeps doing so; only
 * the sentence differs from `networkError()`, which stays the line for an offline phone and for a read that timed out.
 */
export function noAnswerError(): ApiError {
  return new ApiError('network', 0, NO_ANSWER_LINE, NO_ANSWER_CODE);
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

/** The wait an error carried, in whole seconds, or null (for any other value too): a screen says "later" without a figure. */
export function retryAfterOf(error: unknown): number | null {
  const seconds = error instanceof ApiError ? error.retryAfterSeconds : null;
  return seconds !== null && seconds > 0 ? seconds : null;
}
