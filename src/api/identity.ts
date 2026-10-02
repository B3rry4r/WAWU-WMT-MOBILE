import { identityBaseUrl } from './env';
import { ApiError, networkError, toApiError } from './errors';

/**
 * WAWU ID (the sign-in service) is a separate server from the Hub and publishes
 * no OpenAPI contract yet (BACKEND_GAPS.md G-5), so the calls the session
 * needs (sign in, refresh) and the password reset request are written here, in the data layer, and nowhere else. Each reads only
 * the fields it uses and refuses an answer that lacks them.
 */
export type TokenPair = { accessToken: string; refreshToken: string };

async function post(path: string, body: Record<string, string>): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${identityBaseUrl}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw networkError();
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw toApiError(response.status, payload);
  return payload;
}

function readTokenPair(payload: unknown): TokenPair {
  const data = (payload as { data?: Record<string, unknown> } | null)?.data;
  const accessToken = data?.accessToken;
  const refreshToken = data?.refreshToken;
  if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
    throw new ApiError('unknown', 0, 'Sign-in gave an unexpected answer. Try again.');
  }
  return { accessToken, refreshToken };
}

/** Email or phone, plus password. Rejects with an ApiError (unauthorized, EMAIL_NOT_VERIFIED, ...). */
export async function loginRequest(identifier: string, password: string): Promise<TokenPair> {
  return readTokenPair(await post('/auth/login', { identifier, password }));
}

/** Trades the refresh token for a new pair. WAWU ID rotates it, so the old one stops working. */
export async function refreshRequest(refreshToken: string): Promise<TokenPair> {
  return readTokenPair(await post('/auth/refresh', { refreshToken }));
}

/** What the reset-link request answers: how long the emailed link lasts, or null when the server does not say. */
export type ResetLinkAnswer = { expiresInSeconds: number | null };

/**
 * Asks WAWU ID to email a reset link (`method: 'email'`; without it the server
 * sends a WhatsApp code instead). It answers the same whether or not an account
 * exists. The link opens WAWU ID's own web reset page: the app has no New
 * password screen. `expiresInSeconds` is the link's real lifetime; a server that
 * does not send it (BACKEND_GAPS.md G-25) gives null and the screen leaves the
 * figure out.
 */
export async function forgotPasswordRequest(identifier: string): Promise<ResetLinkAnswer> {
  const payload = await post('/auth/forgot-password', { identifier, method: 'email' });
  const seconds = (payload as { data?: { expiresInSeconds?: unknown } } | null)?.data?.expiresInSeconds;
  return { expiresInSeconds: typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0 ? seconds : null };
}
