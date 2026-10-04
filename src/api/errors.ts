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
  | 'unknown';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** HTTP status, or 0 when the request never got an answer. */
  readonly status: number;
  /** Machine code from the server (for example EMAIL_NOT_VERIFIED, or a money route's `reason.code` such as provider_unreachable), when sent. */
  readonly code?: string;
  /** Seconds the server asks the caller to wait (WAWU ID sends it with every 429), when sent. */
  readonly retryAfterSeconds?: number;

  constructor(kind: ApiErrorKind, status: number, message: string, code?: string, retryAfterSeconds?: number) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

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

/**
 * Both backends answer errors as `{ statusCode, message, code? }`; the Hub adds
 * `data: null`, and validation failures send `message` as a list of sentences.
 * Money routes put their code in `reason.code` instead, which becomes `code`
 * here, so every screen branches on the one field. WAWU ID's 429s carry
 * `retryAfterSeconds`, kept as is so a screen counts down the server's figure.
 * `status` is the HTTP status of the response (it wins over `statusCode`, which
 * WAWU ID sets to 404 on a 401 for a missing account).
 */
export function toApiError(status: number, body: unknown): ApiError {
  const record = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const raw = record.message;
  const message = Array.isArray(raw)
    ? raw.filter((part) => typeof part === 'string').join('. ')
    : typeof raw === 'string'
      ? raw
      : '';
  const code = typeof record.code === 'string' ? record.code : reasonCode(record.reason);
  const wait = record.retryAfterSeconds;
  const retryAfterSeconds = typeof wait === 'number' && Number.isFinite(wait) && wait >= 0 ? wait : undefined;
  return new ApiError(kindOf(status), status, message || 'Something went wrong. Try again.', code, retryAfterSeconds);
}

/** The request never reached the server (offline, DNS, timeout). */
export function networkError(): ApiError {
  return new ApiError('network', 0, 'No connection. Check your internet and try again.');
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}
