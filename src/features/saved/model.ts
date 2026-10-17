import { formatMoney } from '@/components/Money';
import { WEEKDAYS, MONTHS, lagos, parseTime } from '@/features/wallet/history/lagosTime';

import type { SavedEntry, SavedTab } from './api';

/** The chips, in the board's order. */
export const TABS: { value: SavedTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'content', label: 'Content' },
  { value: 'events', label: 'Events' },
  { value: 'creators', label: 'Creators' },
];

/** The title under a tile: a piece's title, an event's name, a creator's name (else their handle). */
export function titleOf(entry: SavedEntry): string {
  if (entry.kind === 'content') return entry.content?.title ?? '';
  if (entry.kind === 'event') return entry.event?.name ?? '';
  const { displayName, handle } = entry.creator ?? { displayName: null, handle: null };
  return displayName?.trim() || (handle ? `@${handle.replace(/^@+/, '')}` : '');
}

/** "Sat 4 Oct", with the year when it is not this one, on the Lagos clock (an event's own zone is not in the saved list). */
export function eventDay(iso: string, now: Date): string {
  const at = parseTime(iso);
  if (!at) return '';
  const local = lagos(at);
  const date = `${WEEKDAYS[local.getUTCDay()]} ${local.getUTCDate()} ${MONTHS[local.getUTCMonth()]}`;
  return local.getUTCFullYear() === lagos(now).getUTCFullYear() ? date : `${date} ${local.getUTCFullYear()}`;
}

/**
 * The muted line under a tile's title (M30): a piece the person already bought says "Bought", a free one "Free", a paid one its
 * price (the Hub's, in kobo); an event says its day, or that it was called off; a creator their handle.
 */
export function metaOf(entry: SavedEntry, now: Date): string {
  if (entry.kind === 'content' && entry.content) {
    const piece = entry.content;
    if (piece.bought) return 'Bought';
    if (piece.accessType === 'free' || !piece.priceKobo || piece.priceKobo <= 0) return 'Free';
    return formatMoney(piece.priceKobo, { decimals: piece.priceKobo % 100 !== 0 });
  }
  if (entry.kind === 'event' && entry.event) return entry.event.status === 'cancelled' ? 'Called off' : eventDay(entry.event.startsAt, now);
  const handle = entry.creator?.handle;
  return handle ? `@${handle.replace(/^@+/, '')}` : '';
}

/** The empty state of each tab (M30 draws none; these say what the tab holds). */
export const EMPTY: Record<SavedTab, { title: string; message: string }> = {
  all: { title: 'Nothing saved yet', message: 'Content, events and creators you save show up here.' },
  content: { title: 'No saved content', message: 'Content you save shows up here.' },
  events: { title: 'No saved events', message: 'Events you save show up here.' },
  creators: { title: 'No saved creators', message: 'Creators you save show up here.' },
};
