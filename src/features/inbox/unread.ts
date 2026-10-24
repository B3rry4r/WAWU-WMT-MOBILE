import { useEffect, useSyncExternalStore } from 'react';

import { queryClient } from '@/api/query';
import { onSessionEnd, useSession } from '@/api/session';

import { fetchInboxUnread, inboxKey, inboxUnreadKey } from './api';
import { onLiveEvent, onLiveSynced, retainLive } from './live';
import { drawnUnread } from './rows';

/**
 * The Inbox tab's unread count (G-4). It is the server's `GET /inbox/unread` count for the kinds of row
 * the Inbox draws (`drawnUnread`), so the badge never counts a row nobody can see (R-47). It starts at
 * zero, so the badge stays hidden until real data arrives, and it is zero again when the session ends.
 */
let unread = 0;
const listeners = new Set<() => void>();

export function setInboxUnread(count: number) {
  const next = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  if (next === unread) return;
  unread = next;
  listeners.forEach((notify) => notify());
}

onSessionEnd(() => setInboxUnread(0));

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Live updates carry no counts (a read mark has no unread number, and a block changes what a room
 * counts), so a live event does not patch the badge or a row: it marks the inbox stale and the
 * server's answer replaces it. Events that arrive together (a catch-up) share one read.
 */
const COALESCE_MS = 300;
let pending: ReturnType<typeof setTimeout> | null = null;

/** Reads the count again and refetches every inbox list that is on screen. */
export async function refreshInbox() {
  try {
    const unread = await queryClient.fetchQuery({ queryKey: inboxUnreadKey, queryFn: fetchInboxUnread, staleTime: 0 });
    setInboxUnread(drawnUnread(unread));
  } catch {
    // The badge keeps its last number; the next event or return to the foreground reads it again.
  }
  await queryClient.invalidateQueries({ queryKey: inboxKey, predicate: (query) => query.queryKey[1] !== 'unread' });
}

function refreshSoon() {
  if (pending) return;
  pending = setTimeout(() => {
    pending = null;
    void refreshInbox();
  }, COALESCE_MS);
}

/**
 * Keeps the inbox live while a person is signed in: holds the socket, reads the count when the
 * connection is up (and again after every reconnect and catch-up), and refreshes on every event.
 */
function useInboxLive() {
  const { status } = useSession();
  const signedIn = status === 'signedIn';
  useEffect(() => {
    if (!signedIn) return undefined;
    const release = retainLive();
    const offEvent = onLiveEvent(refreshSoon);
    const offSynced = onLiveSynced(refreshSoon);
    void refreshInbox();
    return () => {
      offEvent();
      offSynced();
      release();
      if (pending) clearTimeout(pending);
      pending = null;
    };
  }, [signedIn]);
}

/** For the tab bar: the count, kept fresh. Mounting it is what starts the live connection. */
export function useInboxUnread(): number {
  useInboxLive();
  return useSyncExternalStore(subscribe, () => unread, () => 0);
}
