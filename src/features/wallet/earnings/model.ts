import type { IconName } from '@/components/icon';
import { monthName } from '../history/lagosTime';
import type { EarningStream } from './api';

/**
 * What W39 says, from what the Hub sent. The names of the streams and the nouns for a sale are the app's words; every figure
 * is the Hub's, in kobo, and none is added up here.
 */

/** The three streams the board names (W39), always drawn, in this order; a stream the Hub lists none of has earned nothing. */
export const NAMED_STREAMS = ['content_unlock', 'tip', 'paid_dm'] as const;

const STREAM_NAME: Record<string, string> = {
  content_unlock: 'Unlocks',
  tip: 'Tips',
  paid_dm: 'Paid DMs',
  legal_fee: 'Legal fees',
  school_fee: 'Course fees',
  event_ticket: 'Tickets',
};

const SALE_NOUN: Record<string, [one: string, many: string]> = {
  content_unlock: ['unlock', 'unlocks'],
  tip: ['tip', 'tips'],
  paid_dm: ['paid DM', 'paid DMs'],
  legal_fee: ['legal fee', 'legal fees'],
  school_fee: ['course fee', 'course fees'],
  event_ticket: ['ticket', 'tickets'],
};

const PIECE_ICON: Record<string, IconName> = {
  content_unlock: 'LockOpen',
  tip: 'HandCoins',
  paid_dm: 'MessageCircle',
  legal_fee: 'Scale',
  school_fee: 'GraduationCap',
  event_ticket: 'Ticket',
};

const spaced = (kind: string) => {
  const words = kind.replace(/_/g, ' ').trim();
  return words ? words[0].toUpperCase() + words.slice(1) : 'Other';
};

/** "Unlocks", "Tips", "Paid DMs"; a kind this version has no name for reads as its own words. */
export const streamName = (kind: string): string => STREAM_NAME[kind] ?? spaced(kind);

/** "18 unlocks", "1 tip", "6 sales" for a kind with no noun of its own. */
export function salesWords(kind: string, sales: number): string {
  const noun = SALE_NOUN[kind] ?? ['sale', 'sales'];
  return `${sales} ${sales === 1 ? noun[0] : noun[1]}`;
}

export const pieceIcon = (kind: string): IconName => PIECE_ICON[kind] ?? 'Banknote';

export type Tile = { kind: string; name: string; earnedKobo: number };

/** The period's tiles: Unlocks, Tips and Paid DMs, then any other stream the Hub lists, in its order (largest first). */
export function tilesOf(streams: EarningStream[]): Tile[] {
  const known = NAMED_STREAMS.map((kind) => ({ kind, name: streamName(kind), earnedKobo: streams.find((s) => s.kind === kind)?.earnedKobo ?? 0 }));
  const others = streams
    .filter((s) => !(NAMED_STREAMS as readonly string[]).includes(s.kind))
    .map((s) => ({ kind: s.kind, name: streamName(s.kind), earnedKobo: s.earnedKobo }));
  return [...known, ...others];
}

/** Tiles three to a row, as the board lays them out; a short last row keeps the tiles' width. */
export function rowsOfTiles(tiles: Tile[], perRow = 3): Tile[][] {
  const rows: Tile[][] = [];
  for (let i = 0; i < tiles.length; i += perRow) rows.push(tiles.slice(i, i + perRow));
  return rows;
}

/** "October": the name of the Hub's month ("2026-10"). Empty when it is not one. */
export function monthWords(month: string): string {
  const m = /^([0-9]{4})-(0[1-9]|1[0-2])$/.exec(month);
  if (!m) return '';
  // The 15th at noon UTC is the 15th in Lagos too, so the name never slips a month.
  return monthName(new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 15, 12)));
}

/** A figure with its kobo only when it has some: ₦42,000 and ₦42,000.85, as the Hub sent them. */
export const showsKobo = (kobo: number): boolean => kobo % 100 !== 0;

export type WaitingWords = { title: string; body: string; action: boolean };

/**
 * The note under the hero when some earnings have not reached the wallet. With no wallet the money waits for one and lands the
 * moment it is opened (R-11), so the note leads to Open your wallet. With a wallet they reach it once a day (R-55). Nothing is
 * said when nothing waits.
 */
export function waitingWords(walletOpen: boolean, waitingKobo: number, format: (kobo: number) => string): WaitingWords | null {
  if (waitingKobo <= 0) return null;
  if (!walletOpen) {
    return { title: `${format(waitingKobo)} is waiting for you`, body: 'It lands in your wallet the moment you open one.', action: true };
  }
  return { title: `${format(waitingKobo)} is on its way to your wallet`, body: 'Earnings reach your wallet once a day.', action: false };
}
