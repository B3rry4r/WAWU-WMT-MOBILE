import { useSyncExternalStore } from 'react';

/**
 * The Inbox tab's unread count. The inbox feature writes it (setInboxUnread)
 * whenever it learns the count from the API; the tab bar only reads it. It
 * starts at zero, so the badge stays hidden until real data arrives.
 */
let unread = 0;
const listeners = new Set<() => void>();

export function setInboxUnread(count: number) {
  const next = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  if (next === unread) return;
  unread = next;
  listeners.forEach((notify) => notify());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useInboxUnread(): number {
  return useSyncExternalStore(subscribe, () => unread, () => 0);
}
