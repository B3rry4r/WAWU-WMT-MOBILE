import { nairaToKobo } from '@/api/kobo';
import { formatMoney } from '@/components/Money';
import type { IconName } from '@/components/icon';
import { labelOf, type FormatId } from '@/features/create/model';
import { MONTHS, lagos, lagosDay, parseTime } from '@/features/wallet/history/lagosTime';

import type { LibraryCounts, LibraryFilter, LibraryPiece } from './api';

/** The words each state wears on M28 (the board's pills), and the pill's tone and mark. M26's Rejected pill adds the X the board draws there. */
export const STATUS_PILL: Record<'live' | 'pending' | 'rejected', { label: string; tone: 'positive' | 'warning' | 'danger'; icon?: IconName }> = {
  live: { label: 'Live', tone: 'positive' },
  pending: { label: 'In review', tone: 'warning', icon: 'Clock' },
  rejected: { label: 'Rejected', tone: 'danger' },
};

/** A state the pill has no words for (the Hub also has `removed`, which the library never lists) draws nothing. */
export const pillOf = (status: LibraryPiece['status']) => (status === 'live' || status === 'pending' || status === 'rejected' ? STATUS_PILL[status] : null);

/** The chips, in the board's order. Only All carries its count there; a count the Hub did not send is left off. */
export function chipsOf(counts: LibraryCounts | undefined): { value: LibraryFilter; label: string }[] {
  return [
    { value: 'all', label: counts ? `All · ${counts.all}` : 'All' },
    { value: 'live', label: 'Live' },
    { value: 'pending', label: 'In review' },
    { value: 'rejected', label: 'Rejected' },
  ];
}

/** "Free" or "₦2,500": the price is whole naira, as the Hub keeps it (R-21). */
export const priceWords = (piece: Pick<LibraryPiece, 'accessType' | 'price'>): string =>
  piece.accessType === 'free' || piece.price <= 0 ? 'Free' : formatMoney(nairaToKobo(piece.price), { decimals: false });

/** "18 sales", "1 sale"; a piece nobody has bought draws no count. */
export const salesWords = (sales: number): string => (sales > 0 ? `${sales} ${sales === 1 ? 'sale' : 'sales'}` : '');

/** "today", "yesterday", then the date ("12 Sep", with the year when it is not this one), on the Lagos clock. */
export function sentWords(createdAt: string, now: Date): string {
  const at = parseTime(createdAt);
  if (!at) return '';
  const days = lagosDay(now) - lagosDay(at);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  const local = lagos(at);
  const date = `${local.getUTCDate()} ${MONTHS[local.getUTCMonth()]}`;
  return local.getUTCFullYear() === lagos(now).getUTCFullYear() ? date : `${date} ${local.getUTCFullYear()}`;
}

/**
 * The line under a row's title (M28): the kind, then what the state says. A live piece: the price and its sales ("Video \u00b7 \u20a62,500 \u00b7 18
 * sales"). A waiting piece: when it was sent, from the date it was made; a piece sent again after a rejection keeps that first date,
 * because the Hub serves no sending time (BACKEND_GAPS G-ME-07-5). A turned-down piece: "see why".
 */
export function rowLine(piece: LibraryPiece, now: Date): string {
  const kind = labelOf(piece.contentType as FormatId);
  const parts = [kind];
  if (piece.status === 'live') {
    parts.push(priceWords(piece));
    const sales = salesWords(piece.salesCount);
    if (sales) parts.push(sales);
  } else if (piece.status === 'pending') {
    const when = sentWords(piece.createdAt, now);
    if (when) parts.push(`sent ${when}`);
  } else if (piece.status === 'rejected') {
    parts.push('see why');
  }
  return parts.join(' · ');
}

/** What a filter with nothing in it says, in the person's words. */
export const EMPTY: Record<LibraryFilter, { title: string; message: string }> = {
  all: { title: 'Nothing made yet', message: 'The pieces you make show up here, with how they are doing.' },
  live: { title: 'Nothing is live yet', message: 'A piece goes live once it has been approved.' },
  pending: { title: 'Nothing is in review', message: 'A piece waits here until it has been looked at.' },
  rejected: { title: 'Nothing was turned down', message: 'A piece that is not approved shows up here with the reason.' },
};
