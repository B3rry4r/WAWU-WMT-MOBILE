import { useEffect } from 'react';

import { getAccessToken } from '@/api/session';
import { readLocal, writeLocal } from '@/features/claim/localStore';
import { readClaims } from '@/features/claim/tokenClaims';

import { acceptPolicies } from './api';

/**
 * What a person agreed to at sign-up (LEGAL-DOCS, owner, 26 Oct 2026). A3 will not Continue until the box is ticked, so
 * every account made through sign-up agreed to the owner's documents. Once the sign-up's first session is adopted the app
 * tells the Hub (`POST /policies/accept`), which keeps each published document's slug and effective date with the time.
 *
 *   - Sign-up marks the NEW account `pending` where its first session is issued (`markAcceptancePending`), then sends.
 *   - A send that fails (no connection, the Hub down) leaves the mark; the next start while signed in sends again
 *     (`useAcceptanceRetry`). A send that works settles the mark to `done`. The Hub treats a repeat as no change.
 *   - Nobody who signed up before this build, and nobody who only signs in, is marked, so nothing is sent for them.
 *   - It never blocks sign-up or the app: every read, write and call here is swallowed.
 */
export const acceptanceKey = (sub: string) => `wmt.legal.accept.${sub}`;

/** The send in progress, so a start that finds the mark while sign-up is still sending does not send twice. */
let sending: Promise<void> | null = null;

async function send(sub: string): Promise<void> {
  try {
    await acceptPolicies();
    await writeLocal(acceptanceKey(sub), 'done');
  } catch {
    // The mark stays `pending`: the next start sends again.
  }
}

function sendOnce(sub: string): Promise<void> {
  sending ??= send(sub).finally(() => {
    sending = null;
  });
  return sending;
}

/** The sign-up's first session was just issued for this account: remember that the Hub is still to be told. */
export async function markAcceptancePending(accessToken: string): Promise<void> {
  const sub = readClaims(accessToken)?.sub;
  if (sub) await writeLocal(acceptanceKey(sub), 'pending');
}

/** Signed in as the new account (session adopted): tells the Hub now. Never throws. */
export async function recordSignupAcceptance(accessToken: string): Promise<void> {
  const sub = readClaims(accessToken)?.sub;
  if (sub) await sendOnce(sub);
}

/** A cold start while signed in: a mark still saying `pending` sends again. Never throws. */
export async function retryPendingAcceptance(): Promise<void> {
  try {
    const sub = readClaims(await getAccessToken())?.sub;
    if (!sub || (await readLocal(acceptanceKey(sub))) !== 'pending') return;
    await sendOnce(sub);
  } catch {
    // Nothing is held against the person: the mark stays and the next start tries again.
  }
}

/** For the root layout: sends a pending agreement once the person is signed in. */
export function useAcceptanceRetry(signedIn: boolean): void {
  useEffect(() => {
    if (signedIn) void retryPendingAcceptance();
  }, [signedIn]);
}
