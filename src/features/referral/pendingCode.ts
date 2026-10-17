import { useEffect, useRef } from 'react';

import { isApiError } from '@/api/client';
import { useSession } from '@/api/session';
import { readLocal, writeLocal } from '@/features/claim/localStore';

import { claimReferral } from './api';

/**
 * A `wawu/r/<code>` link opened in the installed app (G-812, V10). No board draws a place to type a code, so the link
 * is the only way in: the code is kept on the phone, and once the person is signed in it is sent to the Hub once
 * (`POST /me/referrals/claim`). Nothing is drawn for it, whatever the Hub answers: a person who is not new, or whose
 * first days are over, simply does not get the reward, and a refusal is final so the code is dropped.
 *
 * A signed-out visitor goes to the welcome screen; the sign-up that follows ends on Home, which calls
 * `useClaimPendingReferral`, so the claim is made right after sign-in. A claim that could not reach the Hub (offline,
 * a server error) keeps the code for the next time Home opens.
 */
export const PENDING_KEY = 'wmt.referral.pending';

let remembered: string | null = null;

/** Keeps the code from a link, in memory and on the phone (a sign-up can take the app closed and open again). */
export async function rememberCode(code: string): Promise<void> {
  remembered = code;
  await writeLocal(PENDING_KEY, code);
}

async function pendingCode(): Promise<string | null> {
  if (remembered) return remembered;
  const stored = await readLocal(PENDING_KEY);
  return stored ? stored : null;
}

async function forgetCode(): Promise<void> {
  remembered = null;
  await writeLocal(PENDING_KEY, '');
}

export type ClaimOutcome = 'none' | 'claimed' | 'refused' | 'later';

let inFlight: Promise<ClaimOutcome> | null = null;

/**
 * Sends the kept code, if there is one. `later` means the Hub could not be reached and the code is still kept. Two callers
 * at once (the link's screen and Home) share one claim, so a code is never sent twice.
 */
export function claimPendingReferral(): Promise<ClaimOutcome> {
  inFlight ??= sendPending().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function sendPending(): Promise<ClaimOutcome> {
  const code = await pendingCode();
  if (!code) return 'none';
  try {
    await claimReferral(code);
  } catch (error) {
    const retry = isApiError(error) && (error.kind === 'network' || error.kind === 'server' || error.kind === 'unauthorized' || error.kind === 'rate_limited');
    if (retry) return 'later';
    await forgetCode();
    return 'refused';
  }
  await forgetCode();
  return 'claimed';
}

/** Home calls this: once per time the tabs open, a code kept from a link is claimed. A person with no kept code costs one read of the phone's store. */
export function useClaimPendingReferral(): void {
  const { status } = useSession();
  const ran = useRef(false);
  useEffect(() => {
    if (status !== 'signedIn' || ran.current) return;
    ran.current = true;
    void claimPendingReferral();
  }, [status]);
}

/** Tests only. */
export function resetPendingCode(): void {
  remembered = null;
  inFlight = null;
}
