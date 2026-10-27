import { formatMoney } from '@/components/Money';
import { formatPoints, formatPointsCount } from '@/components/PointsFigure';
import type { IconName } from '@/components/icon';
import type { IconTileTone } from '@/components/IconTile';
import { dateWords, lagosDay, parseTime } from '@/features/wallet/history/lagosTime';

import type { ConvertQuote, PointLot, PointMovement, MyPoints } from './api';

/** The copy of PT5 and PT6 that is the design's own words (no figure in any of it: every figure is the Hub's). */
export const WORDS = {
  yourPoints: 'Your points',
  whenTheyEnd: 'When they end',
  spentFirst: 'The soonest-ending points are spent first, then the ones you bought.',
  /** Said once on Convert: bought points are in the balance and never in what can be converted (R-101 point 7). */
  boughtNotCash: "Points you bought can't be turned into cash.",
  /** Under a lot of bought points on the board. */
  neverEnds: 'never expires',
  lastMovements: 'Last 20',
  emptyTitle: 'No points yet',
  emptyBody: 'Buy a pack, or get them with a tier or by inviting people.',
  pointsToConvert: 'Points to convert',
  rate: 'Rate',
  youGet: 'You get',
  convert: 'Convert',
  done: 'Done',
} as const;

/** "₦500": whole naira print without decimals, kobo print with them ("₦500.50"). Money is kobo on the wire, never a float. */
export function cashText(kobo: number): string {
  return formatMoney(kobo, { decimals: kobo % 100 !== 0 });
}

/** "1,000 points = ₦500", the rate as the Hub's quote carries it. */
export function rateText(rate: ConvertQuote['rate']): string {
  return `${formatPoints(rate.points)} = ${cashText(rate.kobo)}`;
}

/** The day a lot ends, in Lagos time: "12 Jan", with the year when it is not this one ("30 Sep 2027"). */
export function endsOn(iso: string, now: Date): string {
  const at = parseTime(iso);
  return at ? dateWords(at, now) : '';
}

/** "ends 12 Jan". */
export const endsLine = (iso: string | null, now: Date): string => (iso === null ? WORDS.neverEnds : `ends ${endsOn(iso, now)}`);

/** True for the lots that end at the Hub's `nextExpiry` (the soonest end): the board draws these in the warning tone. */
export function endsFirst(lot: Pick<PointLot, 'expiresAt'>, nextExpiry: MyPoints['nextExpiry']): boolean {
  if (!nextExpiry || lot.expiresAt === null) return false;
  const a = parseTime(lot.expiresAt);
  const b = parseTime(nextExpiry.expiresAt);
  return a !== null && b !== null && a.getTime() === b.getTime();
}

/** When a movement happened: "today", then the day ("2 Oct", with the year when it is not this one). Lagos time. */
export function movementWhen(iso: string, now: Date): string {
  const at = parseTime(iso);
  if (!at) return '';
  if (lagosDay(now) - lagosDay(at) <= 0) return 'today';
  return endsOn(iso, now);
}

/** The line under a movement's words: the day, and "Pending" while a hold's job has not ended. */
export function movementLine(row: Pick<PointMovement, 'createdAt' | 'pending'>, now: Date): string {
  const when = movementWhen(row.createdAt, now);
  return row.pending ? (when ? `Pending · ${when}` : 'Pending') : when;
}

/** "+600", "−250": the count with its sign, never a naira value (R-5). */
export function signedPoints(points: number): string {
  const amount = formatPointsCount(Math.abs(points));
  return points < 0 ? `−${amount}` : `+${amount}`;
}

/**
 * The mark and the tint of a movement row. The Hub names the reason a row moved points and nothing about what the points
 * paid for (BACKEND_GAPS G-835), so the mark follows the reason: points added are a gift on the "in" tint, points taken
 * (held for a job or a conversion) the sparkle on the neutral one, and points that ended a clock.
 */
export function movementLook(row: Pick<PointMovement, 'reason' | 'points'>): { icon: IconName; tone: IconTileTone } {
  if (row.reason === 'expire') return { icon: 'Clock', tone: 'neutral' };
  if (row.points > 0) return { icon: 'Gift', tone: 'in' };
  return { icon: 'Sparkles', tone: 'neutral' };
}

/** The digits in what was typed: commas, spaces and anything else are dropped, the Hub reads digits only. */
export const digitsOf = (typed: string): string => typed.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '').slice(0, 10);

/** "1,000": the digits with thousands commas, as the field shows them. */
export const pointsInput = (digits: string): string => (digits === '' ? '' : formatPointsCount(Number(digits)));

/** The points typed, or null when there are none to quote (empty, zero or past what the Hub reads). */
export function pointsOf(digits: string): number | null {
  if (digits === '') return null;
  const n = Number(digits);
  return Number.isSafeInteger(n) && n >= 1 && n <= 2147483647 ? n : null;
}

/** Under the field when it is empty: Convert is off because there is nothing to convert yet. */
export const NO_POINTS_LINE = 'Type the points to convert.';
/** Under the field when more points are typed than one conversion can be asked for at all (the Hub reads up to 2,147,483,647). */
export const TOO_MANY_POINTS_LINE = 'That is more than one conversion can carry.';

/**
 * Why Convert is off when what is typed cannot be quoted at all: nothing, zero, or past what the Hub reads (SWEEP-APP-3 row 123).
 * Zero says the minimum of the quote on screen (the Hub's own figure); with no quote yet it asks for at least one point.
 * Null when the points can be asked about: the Hub's quote then speaks for itself (`blockLine`).
 */
export function unquotableLine(digits: string, minimumPoints: number | null): { tone: 'hint' | 'error'; text: string } | null {
  if (pointsOf(digits) !== null) return null;
  if (digits === '') return { tone: 'hint', text: NO_POINTS_LINE };
  if (Number(digits) === 0) return { tone: 'error', text: minimumPoints !== null && minimumPoints > 1 ? `The minimum is ${formatPoints(minimumPoints)}.` : 'Type at least 1 point.' };
  return { tone: 'error', text: TOO_MANY_POINTS_LINE };
}

/** The sentence under the field when the Hub says the points cannot be converted as they are. Every figure is the quote's. */
export function blockLine(quote: Pick<ConvertQuote, 'blockedBy' | 'minimumPoints' | 'maximumPoints' | 'balancePoints' | 'cashablePoints'>): string | null {
  switch (quote.blockedBy) {
    case 'below_minimum':
      return `The minimum is ${formatPoints(quote.minimumPoints)}.`;
    case 'insufficient_points':
      return `You have ${formatPoints(quote.balancePoints)}.`;
    case 'not_cashable':
      return `You can convert ${formatPoints(quote.cashablePoints)}.`;
    case 'above_maximum':
      return quote.maximumPoints === null ? 'That is more than one conversion can carry.' : `The most you can convert at once is ${formatPoints(quote.maximumPoints)}.`;
    default:
      return null;
  }
}

/** True when the figures a person saw (rate, cash, minimum, maximum) are not the figures of the quote now. */
export function quoteMoved(shown: ConvertQuote, now: ConvertQuote): boolean {
  return (
    shown.points !== now.points ||
    shown.cashKobo !== now.cashKobo ||
    shown.rate.kobo !== now.rate.kobo ||
    shown.rate.points !== now.rate.points ||
    shown.minimumPoints !== now.minimumPoints ||
    shown.maximumPoints !== now.maximumPoints ||
    shown.feeKobo !== now.feeKobo
  );
}

/** What the PIN sheet's line says: the cash the person is about to get, then the points it is for. */
export const pinPurpose = (points: number): string => `converting ${formatPoints(points)} to cash`;

/** Shown when the phone could not keep the request it is about to send: nothing is sent, so nothing can be converted twice. */
export const NOT_READY_LINE = 'We could not get this ready. Nothing was converted. Try again.';
/** Shown when the figures changed while the person looked: the screen already shows the new ones. */
export const CHANGED_LINE = 'The cash for your points has changed. Check the new amount before you convert.';
/** Shown when the points ended between the look and the tap: the field already says what is left (SWEEP-APP-3 row 124). */
export const BALANCE_MOVED_LINE = 'Your points changed while you looked. Check your balance before you convert.';
export const QUOTE_ERROR_TITLE = "We couldn't check the cash for your points";
