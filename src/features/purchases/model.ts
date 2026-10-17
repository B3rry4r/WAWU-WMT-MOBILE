import type { components } from '@/api/schema.generated';
import { MONTHS, lagos, parseTime } from '@/features/wallet/history/lagosTime';

import { SEARCH_MAX, SEARCH_MIN, type PurchaseEntry } from './api';

type Kind = components['schemas']['PurchasedPieceView']['contentType'];

/** The type word on a row's second line (M29: "Video", "PDF", "Course", "Template"). */
export const TYPE_WORDS: Record<Kind, string> = { video: 'Video', course: 'Course', audio: 'Audio', pdf: 'PDF', image: 'Image', template: 'Template' };

/** "26 Sep", with the year when it is not this one, on the Lagos clock. Empty when the Hub's time cannot be read. */
export function boughtOn(iso: string, now: Date): string {
  const at = parseTime(iso);
  if (!at) return '';
  const local = lagos(at);
  const date = `${local.getUTCDate()} ${MONTHS[local.getUTCMonth()]}`;
  return local.getUTCFullYear() === lagos(now).getUTCFullYear() ? date : `${date} ${local.getUTCFullYear()}`;
}

/** The creator's name as the row shows it: the display name, else the handle. Empty when the Hub names neither. */
export function creatorName(entry: PurchaseEntry): string {
  const { displayName, handle } = entry.content.creator;
  return displayName?.trim() || (handle ? `@${handle.replace(/^@+/, '')}` : '');
}

/**
 * The line under a row's title (M29): "Chidi Eze · Video · 26 Sep". A course the person has lessons of says how far they are in
 * the date's place ("Tife Adeola · Course · 3 of 12 done"), from the Hub's own count (`lessons`); a course with no lessons
 * listed shows its date like any other piece.
 */
export function rowLine(entry: PurchaseEntry, now: Date): string {
  const parts = [creatorName(entry), TYPE_WORDS[entry.content.contentType] ?? ''];
  const lessons = entry.lessons;
  if (entry.content.contentType === 'course' && lessons && lessons.total > 0) parts.push(`${lessons.done} of ${lessons.total} done`);
  else parts.push(boughtOn(entry.purchasedAt, now));
  return parts.filter(Boolean).join(' · ');
}

/** What the search box sends: trimmed, cut at the Hub's longest, and nothing at all under its shortest. */
export function searchTerm(typed: string): string {
  const term = typed.trim().slice(0, SEARCH_MAX);
  return term.length >= SEARCH_MIN ? term : '';
}

export const EMPTY = {
  none: { title: 'Nothing bought yet', message: 'Pieces you unlock show up here.' },
  search: (term: string) => ({ title: 'No match', message: `Nothing you bought matches “${term}”.` }),
} as const;
