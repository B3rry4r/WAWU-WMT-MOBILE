/**
 * Africa/Lagos time, the zone the history counts its days and months in (MONEY-15: the Hub's day groups, its
 * `month` and its summary are all Lagos time). Lagos is UTC+1 all year, with no daylight saving, so a fixed hour
 * shifts a UTC instant onto the Lagos clock and the UTC getters then read it. One home for these, so the Wallet
 * tab's row times (WALLET-01) and the history's day labels (WALLET-04) never disagree about what day it is.
 */
const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const twoDigits = (n: number) => String(n).padStart(2, '0');

/** The instant shifted so its UTC getters read the Lagos clock. */
export const lagos = (at: Date) => new Date(at.getTime() + LAGOS_OFFSET_MS);

/** Whole Lagos days since 1 Jan 1970: two instants on the same Lagos day have the same number. */
export const lagosDay = (at: Date) => Math.floor(lagos(at).getTime() / DAY_MS);

/** The ISO time as a date, or null when the server sent something that is not a time. */
export function parseTime(iso: string): Date | null {
  const at = new Date(iso);
  return Number.isNaN(at.getTime()) ? null : at;
}

/** "10:24", the Lagos clock. Empty when the time cannot be read. */
export function clockTime(iso: string): string {
  const at = parseTime(iso);
  if (!at) return '';
  const local = lagos(at);
  return `${twoDigits(local.getUTCHours())}:${twoDigits(local.getUTCMinutes())}`;
}

/** "2026-09-26": the Lagos day a time falls on, the key rows are grouped under. Empty when unreadable. */
export function dayKey(iso: string): string {
  const at = parseTime(iso);
  if (!at) return '';
  const local = lagos(at);
  return `${local.getUTCFullYear()}-${twoDigits(local.getUTCMonth() + 1)}-${twoDigits(local.getUTCDate())}`;
}

/**
 * "26 Nov" in Lagos time, with the year when the date is not in the current Lagos year ("26 Nov 2027"). The one rule every end date
 * of a tier, a pass or a lot of points is written by, so a date a year away never reads as one this year (FIX-78 F-3).
 */
export function dateWords(at: Date, now: Date): string {
  const local = lagos(at);
  const date = `${local.getUTCDate()} ${MONTHS[local.getUTCMonth()]}`;
  return local.getUTCFullYear() === lagos(now).getUTCFullYear() ? date : `${date} ${local.getUTCFullYear()}`;
}

/**
 * The label over a day's rows (W26): "Today", "Yesterday", then the weekday and date ("Mon, 22 Sep", with the year
 * when it is not this one). A day ahead of the phone's own clock (a clock that is off) reads as today.
 */
export function dayLabel(iso: string, now: Date): string {
  const at = parseTime(iso);
  if (!at) return '';
  const days = lagosDay(now) - lagosDay(at);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${WEEKDAYS[lagos(at).getUTCDay()]}, ${dateWords(at, now)}`;
}

/** "26 Sep 2026, 10:24": W27's Date row. */
export function longDateTime(iso: string): string {
  const at = parseTime(iso);
  if (!at) return '';
  const local = lagos(at);
  return `${local.getUTCDate()} ${MONTHS[local.getUTCMonth()]} ${local.getUTCFullYear()}, ${clockTime(iso)}`;
}

/** "2026-09": the Lagos month the summary and the filter's `month` count. */
export function monthKey(now: Date): string {
  const local = lagos(now);
  return `${local.getUTCFullYear()}-${twoDigits(local.getUTCMonth() + 1)}`;
}

/** "September": the month's name, for "In · September". */
export function monthName(now: Date): string {
  return MONTH_NAMES[lagos(now).getUTCMonth()];
}

/** How a row from a few days ago is dated on W1: the weekday within the last six days, then the date. */
export const WEEKDAY_DAYS = 6;

/**
 * When a row happened, as W1 writes it: "10:24" today, "Yesterday", "Mon" within the week, then "22 Sep" (with the
 * year when it is not this one). Lagos time. Default (agent), owner may override.
 */
export function rowTime(createdAt: string, now: Date): string {
  const at = parseTime(createdAt);
  if (!at) return '';
  const days = lagosDay(now) - lagosDay(at);
  if (days <= 0) return clockTime(createdAt);
  if (days === 1) return 'Yesterday';
  if (days <= WEEKDAY_DAYS) return WEEKDAYS[lagos(at).getUTCDay()];
  return dateWords(at, now);
}
