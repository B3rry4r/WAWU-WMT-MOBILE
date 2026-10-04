import { ApiError, isApiError } from '@/api/errors';
import { getAccessToken, refreshAccessToken } from '@/api/session';

/**
 * Runs a WAWU ID call that needs the signed-in access token. A 401 refreshes the
 * token once and repeats the call, as the Hub client does (`src/api/client.ts`);
 * a refresh the server refuses has already signed the user out.
 */
export async function authed<T>(run: (token: string) => Promise<T>): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new ApiError('unauthorized', 401, 'Sign in to continue.', 'SESSION_INVALID');
  try {
    return await run(token);
  } catch (error) {
    if (isApiError(error) && error.kind === 'unauthorized') {
      const next = await refreshAccessToken(token);
      if (next) return run(next);
    }
    throw error;
  }
}
