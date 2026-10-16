/**
 * W38's days. A statement's period is two calendar days in Africa/Lagos time, both included, written
 * `YYYY-MM-DD` (backend CONVENTIONS section 12). Lagos is UTC+1 all year, so "today" there is the phone's clock
 * plus an hour read as UTC. Nothing here uses the phone's own time zone.
 */
export type Day = string;

const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MONTHS_BACK_FOR_THREE = 2;
const DAYS_IN_WEEK = 7;

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const LONG_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;

const DAY_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/** The year, month (1 to 12) and day of a `YYYY-MM-DD` that is a real day. */
export function partsOf(day: Day): { year: number; month: number; date: number } {
  const m = DAY_PATTERN.exec(day);
  if (!m) throw new Error(`Not a day: ${day}`);
  return { year: Number(m[1]), month: Number(m[2]), date: Number(m[3]) };
}

export function dayOf(year: number, month: number, date: number): Day {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Today in Lagos, from the phone's clock. */
export function lagosToday(now: Date): Day {
  return new Date(now.getTime() + LAGOS_OFFSET_MS).toISOString().slice(0, 10);
}

/** The first day of the month `monthsBack` months before the one `day` is in. */
function firstOfMonthBack(day: Day, monthsBack: number): Day {
  const { year, month } = partsOf(day);
  const index = year * 12 + (month - 1) - monthsBack;
  return dayOf(Math.floor(index / 12), (index % 12) + 1, 1);
}

function lastOfMonthBack(day: Day, monthsBack: number): Day {
  const first = partsOf(firstOfMonthBack(day, monthsBack));
  return dayOf(first.year, first.month, daysInMonth(first.year, first.month));
}

export type PresetId = 'this_month' | 'last_month' | 'three_months' | 'custom';

export const PRESETS: readonly { value: PresetId; label: string }[] = [
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'three_months', label: '3 months' },
  { value: 'custom', label: 'Custom' },
];

/**
 * The days a preset stands for, from Lagos's today. "3 months" is this month and the two before it, from the 1st of
 * the earlier one to today (on 26 Sep: 1 Jul to 26 Sep, as W38 draws it). `custom` has no days of its own.
 */
export function presetRange(id: Exclude<PresetId, 'custom'>, today: Day): { from: Day; to: Day } {
  if (id === 'this_month') return { from: firstOfMonthBack(today, 0), to: today };
  if (id === 'last_month') return { from: firstOfMonthBack(today, 1), to: lastOfMonthBack(today, 1) };
  return { from: firstOfMonthBack(today, MONTHS_BACK_FOR_THREE), to: today };
}

/** `1 Jul 2026`, as W38's date fields write a day. */
export function dayLabel(day: Day): string {
  const { year, month, date } = partsOf(day);
  return `${date} ${SHORT_MONTHS[month - 1]} ${year}`;
}

/** `September 2026`, the calendar's title. */
export function monthTitle(year: number, month: number): string {
  return `${LONG_MONTHS[month - 1]} ${year}`;
}

/** The month before or after (`step` -1 or 1). */
export function shiftMonth(year: number, month: number, step: -1 | 1): { year: number; month: number } {
  const index = year * 12 + (month - 1) + step;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** Days from `a` to `b` (negative when `b` is earlier). */
export function daysBetween(a: Day, b: Day): number {
  const pa = partsOf(a);
  const pb = partsOf(b);
  return Math.round((Date.UTC(pb.year, pb.month - 1, pb.date) - Date.UTC(pa.year, pa.month - 1, pa.date)) / MS_PER_DAY);
}

/**
 * A month as weeks, Monday first, each cell a day or null where the week runs into the next or the last month.
 * Always whole weeks of seven.
 */
export function monthWeeks(year: number, month: number): (Day | null)[][] {
  const lead = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + DAYS_IN_WEEK - 1) % DAYS_IN_WEEK;
  const cells: (Day | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= daysInMonth(year, month); d += 1) cells.push(dayOf(year, month, d));
  while (cells.length % DAYS_IN_WEEK !== 0) cells.push(null);
  const weeks: (Day | null)[][] = [];
  for (let i = 0; i < cells.length; i += DAYS_IN_WEEK) weeks.push(cells.slice(i, i + DAYS_IN_WEEK));
  return weeks;
}

/**
 * What is wrong with the two days the person picked, or null. Only what the phone can know: the order, and a day
 * that has not happened in Lagos yet. The length and the row count are the server's to judge, and its sentence is shown.
 */
export function periodProblem(from: Day, to: Day, today: Day): string | null {
  if (daysBetween(from, to) < 0) return 'The first day must be on or before the last day.';
  if (daysBetween(today, to) > 0) return 'The last day cannot be after today.';
  return null;
}
