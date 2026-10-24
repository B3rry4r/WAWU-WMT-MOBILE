import { useEffect, useState } from 'react';

import { getAccessToken, useSession } from '@/api/session';
import { readLocal, writeLocal } from '@/features/claim/localStore';
import { readClaims } from '@/features/claim/tokenClaims';

/**
 * R-17: signing in during the 30 days cancels a scheduled deletion (WAWU ID does it, SETTINGS-08), and says nothing about it. So this
 * phone remembers, for the account that scheduled the deletion here, that one is waiting (`markDeletionScheduled`, when the Hub answered
 * Z7 with the date). The next sign-in of that account on this phone reads the mark once, clears it, and Home shows a plain notice that
 * the deletion is cancelled (`useDeletionCancelledNotice`). Nothing here is sent anywhere. A person who signs in on another phone sees no
 * notice: the Hub does not say that a deletion was cancelled (BACKEND_GAPS G-SWEEP-FLOWS-1).
 * Every read and write is bounded and swallowed (`@/features/claim/localStore`): a store that fails means no notice, never a failure.
 */
export const DELETION_CANCELLED_NOTICE = 'Your account deletion is cancelled. Welcome back.';

const markKey = (sub: string) => `wmt.deletion.waiting.${sub}`;

/** Z7 was answered with a date: the account that asked is the one in the current session. */
export async function markDeletionScheduled(): Promise<void> {
  const sub = readClaims(await getAccessToken())?.sub;
  if (sub) await writeLocal(markKey(sub), 'scheduled');
}

/**
 * Z8's Done is about to sign this phone out: the deletion is waiting and the next sign-in of this account is the one that cancels it.
 * Only a mark that reached this point counts, so an app closed on Z8 while still signed in never claims a cancellation it did not see.
 */
export async function markLeavingForDeletion(): Promise<void> {
  const sub = readClaims(await getAccessToken())?.sub;
  if (sub && (await readLocal(markKey(sub))) === 'scheduled') await writeLocal(markKey(sub), 'signed-out');
}

/** The account just signed in: true once if this phone signed it out with a deletion waiting, and the mark is cleared. */
export async function takeDeletionMark(): Promise<boolean> {
  const sub = readClaims(await getAccessToken())?.sub;
  if (!sub) return false;
  if ((await readLocal(markKey(sub))) !== 'signed-out') return false;
  await writeLocal(markKey(sub), 'done');
  return true;
}

/** For Home: the notice to show, or null. Reads the mark once per signed-in session. */
export function useDeletionCancelledNotice(): { message: string | null; clear: () => void } {
  const { status } = useSession();
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (status !== 'signedIn') return undefined;
    let live = true;
    void takeDeletionMark().then((cancelled) => {
      if (live && cancelled) setMessage(DELETION_CANCELLED_NOTICE);
    });
    return () => {
      live = false;
    };
  }, [status]);
  return { message, clear: () => setMessage(null) };
}
