import { identityBaseUrl } from '@/api/env';
import { ApiError, networkError, toApiError } from '@/api/errors';
import type { operations } from '@/api/identity.generated';
import type { TokenPair } from '@/api/identity';
import { authed } from '@/features/auth/signupApi';

/**
 * SETTINGS-01's two WAWU ID calls (SETTINGS-03's routes, typed from `contract/identity/openapi.json`):
 * - `POST /auth/change-password`: the signed-in access token, `{ currentPassword, newPassword }`; the
 *   answer is a new token pair, and every other device's refresh token stops working;
 * - `POST /auth/logout`: `{ refreshToken }`; ends that refresh token on the server.
 * They sit here, in the data layer, because `src/api/identity.ts` is fenced (SHARED-CHANGES.md,
 * SETTINGS-01 #1 asks for them to move there).
 */
type ChangeBody = operations['changePassword']['requestBody']['content']['application/json'];
type LogoutBody = operations['logout']['requestBody']['content']['application/json'];

async function send(path: string, body: ChangeBody | LogoutBody, token?: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${identityBaseUrl}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw networkError();
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = toApiError(response.status, payload);
    // WAWU ID sends the wait in the standard header as well as in the body (SETTINGS-03).
    const header = Number(response.headers.get('retry-after'));
    if (error.kind === 'rate_limited' && error.retryAfterSeconds === undefined && Number.isFinite(header) && header > 0) {
      throw new ApiError(error.kind, error.status, error.message, error.code, header);
    }
    throw error;
  }
  return payload;
}

/** Changes the password. Resolves with the new token pair the caller must keep; rejects with an ApiError (`CURRENT_PASSWORD_WRONG`, `PASSWORD_UNCHANGED`, `RATE_LIMITED`, ...). */
export async function changePassword(currentPassword: string, newPassword: string): Promise<TokenPair> {
  const payload = (await authed((token) => send('/auth/change-password', { currentPassword, newPassword }, token))) as {
    data?: Partial<TokenPair>;
  } | null;
  const accessToken = payload?.data?.accessToken;
  const refreshToken = payload?.data?.refreshToken;
  if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
    throw new ApiError('unknown', 200, 'Your password was changed but the answer could not be read. Sign in again.');
  }
  return { accessToken, refreshToken };
}

/** Ends this device's refresh token on the server. The server answers the same for a live, dead or unknown token. */
export async function logoutRequest(refreshToken: string): Promise<void> {
  await send('/auth/logout', { refreshToken });
}
