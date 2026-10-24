import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { getAccessToken, refreshAccessToken } from '@/api/session';
import { meKey } from '@/features/profile-edit/api';

import { identityOf, putIdentity, type SavedIdentity } from './identityApi';

/**
 * The name and username step (SIGNUP-NAMES, R-82). Sign-up asks for a first name, a last name and a username. An account
 * that has none of them, or only some (everyone who signed up before this task, and a sign-up whose username was taken
 * in the minutes before its code was confirmed), is asked for the missing ones once, on the next open, before the tabs.
 * The step has no way out: it ends when the Hub has them.
 */
export type IdentityNeed = {
  firstName: boolean;
  lastName: boolean;
  handle: boolean;
  /** What the Hub said when the sign-up's own try at the username was refused (taken in the meantime): shown under the field. */
  notice: string | null;
  /** What the account already has, so a name given in two parts is saved as a pair. */
  saved: SavedIdentity;
};

/** Which parts the account lacks; null when it has all three. */
export function needOf(saved: SavedIdentity, notice: string | null = null): IdentityNeed | null {
  const need = { firstName: saved.firstName === null, lastName: saved.lastName === null, handle: saved.handle === null };
  return need.firstName || need.lastName || need.handle ? { ...need, notice, saved } : null;
}

/** The sign-up's own try at the username, still on its way (or just finished) when the gate first reads the account. */
let claiming: Promise<void> | null = null;
/** The Hub's refusal of that try, for the step to show; cleared once read. */
let claimNotice: string | null = null;

/**
 * Sign-up, after the code is right: adopts the session, then asks the Hub for the username chosen on the form. The gate
 * waits for this before it reads the account, so a username that went through never sends the person to the step. Never
 * throws: a refused or failed try leaves the username missing, and the step asks for it.
 */
export function claimSignupUsername(adopt: () => Promise<void>, username: string | null): Promise<void> {
  const run = (async () => {
    await adopt();
    if (!username) return;
    try {
      await putIdentity({ handle: username });
    } catch (error) {
      claimNotice = isApiError(error) && error.status === 409 ? error.message : null;
    }
  })();
  claiming = run;
  const clear = () => {
    if (claiming === run) claiming = null;
  };
  run.then(clear, clear);
  return run;
}

/** Resolves once the sign-up's own try at the username is over (at once when there is none); the profile is read after it. */
export async function claimSettled(): Promise<void> {
  try {
    await claiming;
  } catch {
    // A failed try leaves the username missing; the step asks for it.
  }
}

/**
 * What the account lacks, from the profile read the gate shares with the account type check (one `GET /users/me` per start):
 * null when it has everything, and also when the Hub could not be asked (the person is let in, and the next open asks again).
 */
export async function readIdentityNeed(read: () => Promise<{ firstName?: unknown; lastName?: unknown; handle?: unknown }>): Promise<IdentityNeed | null> {
  try {
    const saved = identityOf(await read());
    const notice = claimNotice;
    claimNotice = null;
    return needOf(saved, notice);
  } catch {
    return null;
  }
}

/** Forgets the sign-up's pending try (a sign-out, tests). */
export function resetIdentityStep(): void {
  claiming = null;
  claimNotice = null;
}

export type IdentityValues = { firstName: string; lastName: string; username: string };

/**
 * Saves what the step asked for. The name goes as a pair (the Hub keeps both together), so a part the account already
 * has is sent back with the one it lacks. Then the access token is renewed, so the claims the Hub reads the name from
 * carry it at once; a renewal that fails only leaves the old name until the next refresh.
 */
export async function saveIdentity(need: IdentityNeed, typed: IdentityValues): Promise<void> {
  const parts: { firstName?: string; lastName?: string; handle?: string } = {};
  if (need.firstName || need.lastName) {
    parts.firstName = need.firstName ? typed.firstName.trim() : (need.saved.firstName ?? '');
    parts.lastName = need.lastName ? typed.lastName.trim() : (need.saved.lastName ?? '');
  }
  if (need.handle) parts.handle = typed.username;
  await putIdentity(parts);
  // The profile the rest of the app holds (Home, Edit profile) is the one without the name and username: ask for it again.
  void queryClient.invalidateQueries({ queryKey: meKey });
  try {
    const token = await getAccessToken();
    if (token) await refreshAccessToken(token);
  } catch {
    // The name shows from the old token until the next refresh.
  }
}
