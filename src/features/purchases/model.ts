import type { components } from '@/api/schema.generated';
import { formatMoney } from '@/components/Money';
import type { IconName } from '@/components/icon';
import { MONTHS, lagos, parseTime } from '@/features/wallet/history/lagosTime';

import { SEARCH_MAX, SEARCH_MIN, type PurchaseEntry, type PurchaseKind } from './api';

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
  const creator = entry.content?.creator;
  if (!creator) return '';
  const { displayName, handle } = creator;
  return displayName?.trim() || (handle ? `@${handle.replace(/^@+/, '')}` : '');
}

/** What each kind of purchase is called on the second line (a piece says its own type instead: "Video", "PDF"). */
export const KIND_WORDS: Record<Exclude<PurchaseKind, 'content_unlock'>, string> = {
  event_ticket: 'Ticket',
  credit_pack: 'Credit pack',
  school_fee: 'School fee',
  community_pass: 'Community pass',
};

/** The picture's place for a purchase that has no picture of its own (a piece has its thumbnail). */
export const KIND_ICONS: Record<Exclude<PurchaseKind, 'content_unlock'>, IconName> = {
  event_ticket: 'Ticket',
  credit_pack: 'Coins',
  school_fee: 'GraduationCap',
  community_pass: 'Users',
};

/** What the person paid, in the Hub's own figure: what left the wallet when it was a wallet payment, else the charge. */
export function paidLine(entry: PurchaseEntry): string {
  const kobo = entry.totalKobo ?? entry.amountKobo;
  return formatMoney(kobo, { decimals: kobo % 100 !== 0 });
}

/**
 * The line under a row's title (M29). A piece: "Chidi Eze · Video · 26 Sep"; a course the person has lessons of says how far they are
 * in the date's place ("Tife Adeola · Course · 3 of 12 done"), from the Hub's own count (`lessons`). Every other kind says what it is,
 * the day and what was paid ("Ticket · 26 Sep · ₦5,065"). A purchase the Hub paid back ends "Refunded" and shows no figure of money
 * that is not the person's any more.
 */
export function rowLine(entry: PurchaseEntry, now: Date): string {
  const when = boughtOn(entry.purchasedAt, now);
  const refunded = entry.status === 'refunded' ? 'Refunded' : '';
  if (entry.kind !== 'content_unlock') return [KIND_WORDS[entry.kind], when, refunded || paidLine(entry)].filter(Boolean).join(' · ');
  const piece = entry.content;
  const parts = [creatorName(entry), piece ? (TYPE_WORDS[piece.contentType] ?? '') : ''];
  const lessons = entry.lessons;
  if (piece?.contentType === 'course' && lessons && lessons.total > 0 && !refunded) parts.push(`${lessons.done} of ${lessons.total} done`);
  else parts.push(when);
  parts.push(refunded);
  return parts.filter(Boolean).join(' · ');
}

/**
 * Where a purchase opens, where that screen exists. A refunded purchase opens nothing (nothing is held any more), nor does a credit pack.
 * A ticket opens its order (E5) only when the wallet paid for it: that page reads the wallet-order route, and an order the web paid by
 * card (`totalKobo` null) is not there. The row carries the order's id and not the event's, so a card-paid ticket opens nothing.
 */
export type PurchaseTarget =
  | { kind: 'piece'; id: string }
  | { kind: 'ticket'; orderId: string }
  | { kind: 'courses' }
  | { kind: 'room'; id: string };

export function targetOf(entry: PurchaseEntry): PurchaseTarget | null {
  if (entry.status === 'refunded') return null;
  switch (entry.kind) {
    case 'content_unlock': {
      const id = entry.openId ?? entry.content?.id;
      return id ? { kind: 'piece', id } : null;
    }
    case 'event_ticket':
      return entry.openId && entry.totalKobo !== null ? { kind: 'ticket', orderId: entry.openId } : null;
    case 'school_fee':
      return { kind: 'courses' };
    case 'community_pass':
      return entry.openId ? { kind: 'room', id: entry.openId } : null;
    default:
      return null;
  }
}

/** M29's button on a piece: Watch a video, Read a PDF, Resume a course. The board draws no other word for a piece, so no other piece has a button. */
export function actionOf(entry: PurchaseEntry): string | null {
  if (entry.kind !== 'content_unlock' || entry.status !== 'paid' || targetOf(entry)?.kind !== 'piece') return null;
  switch (entry.content?.contentType) {
    case 'video':
      return 'Watch';
    case 'pdf':
      return 'Read';
    case 'course':
      return 'Resume';
    default:
      return null;
  }
}

/** What the search box sends: trimmed, cut at the Hub's longest, and nothing at all under its shortest. */
export function searchTerm(typed: string): string {
  const term = typed.trim().slice(0, SEARCH_MAX);
  return term.length >= SEARCH_MIN ? term : '';
}

export const EMPTY = {
  none: { title: 'Nothing bought yet', message: 'What you pay for shows up here.' },
  search: (term: string) => ({ title: 'No match', message: `Nothing you bought matches “${term}”.` }),
} as const;
