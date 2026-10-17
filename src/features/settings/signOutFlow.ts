import { logoutRequest } from '@/api/identity';
import { signOut } from '@/api/session';
import { loadTokens } from '@/api/tokenStore';
import { forgetPush } from '@/features/push/registration';

/**
 * How long Sign out waits for WAWU ID before it signs the phone out anyway. WAWU ID answers a sign-out only after
 * it has done its constant-time work, which took 13 to 18 seconds on a loaded development machine; a person who
 * pressed Sign out is never kept waiting that long. The request is already on its way and carries on after the phone
 * has signed out. Default (agent), owner may override.
 */
export const SERVER_WAIT_MS = 3000;

/**
 * Signs this phone out, in this order, all inside one `SERVER_WAIT_MS` wait. First this phone is taken off the
 * person's push list (INBOX-21, `DELETE /push-tokens`) while the session still works, refreshing an access token
 * that has run out. Only then is the refresh token ended on the server (WAWU ID `POST /auth/logout`, G-6), so a copy
 * of it is worth nothing afterwards: ended first, it would leave the removal with no session to refresh, and the
 * phone would keep showing the person's pushes. Then the phone forgets its tokens, and the route graph returns the
 * person to sign-in. If the server cannot be reached, or the removal has not finished within `SERVER_WAIT_MS`, the
 * phone still signs out and the logout is still sent: the request carries on after the phone has signed out, and
 * the old token simply runs out on its own if it never lands (BACKEND_GAPS G-262).
 *
 * If the secure store refuses to delete the saved tokens, the app is still signed out in memory and its cache is
 * already emptied (the session module changes both before it touches the store), so the person is signed out for as
 * long as the app runs. `storeCleared` is then false, and the screen says so and offers Sign out again, which asks
 * the store a second time. A failure of anything else in the session's cleanup is not a store problem and is not
 * reported as one: the saved tokens are read back to tell the two apart.
 */
export async function signOutOfThisPhone(): Promise<{ serverEnded: boolean; storeCleared: boolean }> {
  const stored = await loadTokens();
  let serverEnded = false;
  if (stored) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const slow = new Promise<boolean>((resolve) => {
      timer = setTimeout(() => resolve(false), SERVER_WAIT_MS);
    });
    // The refresh token to end is the one the session holds now: a removal that refreshed an expired access
    // token was handed a new one, and ending the old one would leave the new one alive.
    let logout: Promise<boolean> | null = null;
    const endOnServer = () =>
      (logout ??= loadTokens().then((current) =>
        logoutRequest((current ?? stored).refreshToken).then(
          () => true,
          () => false,
        ),
      ));
    const asked = forgetPush(SERVER_WAIT_MS)
      .catch(() => undefined)
      .then(endOnServer);
    serverEnded = await Promise.race([asked, slow]);
    clearTimeout(timer);
    // The removal did not finish in time: the logout goes now, and the sign-out carries on without an answer.
    void endOnServer();
  }
  try {
    await signOut();
  } catch {
    if (!(await loadTokens())) return { serverEnded, storeCleared: true };
    return { serverEnded, storeCleared: false };
  }
  return { serverEnded, storeCleared: true };
}
