import { signOut } from '@/api/session';
import { loadTokens } from '@/api/tokenStore';

import { logoutRequest } from './api/identity';

/**
 * How long Sign out waits for WAWU ID before it signs the phone out anyway. WAWU ID answers a sign-out only after
 * it has done its constant-time work, which took 13 to 18 seconds on a loaded development machine; a person who
 * pressed Sign out is never kept waiting that long. The request is already on its way and carries on after the phone
 * has signed out. Default (agent), owner may override.
 */
export const SERVER_WAIT_MS = 3000;

/**
 * Signs this phone out. The refresh token is ended on the server first (WAWU ID `POST /auth/logout`, G-6), so a copy
 * of it is worth nothing afterwards; then the phone forgets its tokens, and the route graph returns the person to
 * sign-in. If the server cannot be reached, or has not answered within `SERVER_WAIT_MS`, the phone still signs out:
 * the old token simply runs out on its own if the request never lands (BACKEND_GAPS G-262).
 */
export async function signOutOfThisPhone(): Promise<{ serverEnded: boolean }> {
  const stored = await loadTokens();
  let serverEnded = false;
  if (stored) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const slow = new Promise<boolean>((resolve) => {
      timer = setTimeout(() => resolve(false), SERVER_WAIT_MS);
    });
    const asked = logoutRequest(stored.refreshToken).then(
      () => true,
      () => false,
    );
    serverEnded = await Promise.race([asked, slow]);
    clearTimeout(timer);
  }
  await signOut();
  return { serverEnded };
}
