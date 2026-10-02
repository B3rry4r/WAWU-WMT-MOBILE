import { identityBaseUrl } from './env';
import { ApiError, networkError, toApiError } from './errors';

/**
 * WAWU ID (the sign-in service) is a separate server from the Hub and publishes
 * no OpenAPI contract yet (BACKEND_GAPS.md G-5), so the two calls the session
 * needs are written here, in the data layer, and nowhere else. Each reads only
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
