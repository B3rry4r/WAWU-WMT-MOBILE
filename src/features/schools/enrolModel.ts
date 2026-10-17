import type { IntakeView } from './api';
import type { Enrolment, EnrolmentRow } from './enrolApi';
import { dayLabel } from './model';

/** The words SC4 to SC7, SC8 and SC11 print. The Hub's own sentences (a refusal's `message`) are shown as the Hub wrote them. */
export const CONFIRMING_TITLE = 'Paid, still confirming';
export const CONFIRMING_LINE = "Don't pay again. Your place shows up in a minute.";
export const CLOSED_TITLE = 'This place was given back';
export const CLOSED_LINE = 'A place is held for a short time. This one went back to the class and nothing was taken. Pick the class again.';
export const REFUNDED_TITLE = 'The class filled up';
export const FAILED_LINE = 'The payment didn’t go through.';
export const MONEY_BACK_LINE = 'Your money is back in your wallet.';
export const NOT_HELD_LINE = 'Check your connection and try again.';
export const PRICE_UNREADABLE = 'The price could not be read. Try again.';

/** What the pay sheet says when a payment the Hub was still confirming then failed: the Hub's reason alone when it gave one (it already says what happened to the money); the app's own two lines only when it gave none. */
export function failedLine(reason: string | null | undefined): string {
  const why = reason?.trim() ?? '';
  if (why === '') return `${FAILED_LINE} ${MONEY_BACK_LINE}`;
  return /[.!?]$/.test(why) ? why : `${why}.`;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;

/** The month and day of a day the Hub wrote as YYYY-MM-DD, or null when it is not a real day. The day is the calendar day it names. */
function partsOf(day: string): { month: number; date: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!m || dayLabel(day) === null) return null;
  return { month: Number(m[2]), date: Number(m[3]) };
}

/** "3 Nov": SC7's "starts 3 Nov" and SC8's "starts 3 Nov". */
export function shortDay(day: string): string {
  const p = partsOf(day);
  return p ? `${p.date} ${MONTHS[p.month - 1].slice(0, 3)}` : '';
}

/** "12 January": SC11's "The next one starts 12 January". */
export function longDay(day: string): string {
  const p = partsOf(day);
  return p ? `${p.date} ${MONTHS[p.month - 1]}` : '';
}

/** "November": SC11's "The November class is full" and "Enroll for January". */
export function monthName(day: string): string {
  const p = partsOf(day);
  return p ? MONTHS[p.month - 1] : '';
}

/** "Starts 3 November": a class in SC4's list (the weekday SC3 draws is left off, as SC4 draws it). */
export function startsLine(intake: Pick<IntakeView, 'startDate'>): string {
  const p = partsOf(intake.startDate);
  return p ? `Starts ${p.date} ${MONTHS[p.month - 1]}` : 'Start date to be confirmed';
}

/** The line under a class in SC4: its days, then the seats left ("Weekend class · 8 seats left"), or "Full". */
export function classLine(intake: Pick<IntakeView, 'schedule' | 'location' | 'seatsLeft' | 'full'>): string {
  const days = intake.schedule.trim();
  const place = intake.location?.trim() ?? '';
  const seats = intake.full || intake.seatsLeft <= 0 ? 'Full' : `${intake.seatsLeft} ${intake.seatsLeft === 1 ? 'seat' : 'seats'} left`;
  return [days, place, seats].filter((part) => part !== '').join(' · ');
}

/** A class that can still be joined: it has not started and has a seat. The Hub decides at Continue; this is what the list offers. */
export const joinable = (intake: IntakeView, today: string): boolean => !intake.full && intake.seatsLeft > 0 && intake.startDate >= today;

/** The classes SC4 lists: those that have not started, soonest first as the Hub lists them. */
export const upcoming = (intakes: readonly IntakeView[], today: string): IntakeView[] => intakes.filter((intake) => intake.startDate >= today);

/** SC7's "Class" row: "Weekend · Yaba", the school's days then its place. */
export function classRow(intake: Pick<Enrolment['intake'], 'schedule' | 'location'>): string {
  return [intake.schedule.trim(), intake.location?.trim() ?? ''].filter((part) => part !== '').join(' · ');
}

/** SC7's line under the title: "Product Design Bootcamp · starts 3 Nov". */
export function enrolledLine(e: Pick<Enrolment, 'course' | 'intake'>): string {
  const when = shortDay(e.intake.startDate);
  return when === '' ? e.course.title : `${e.course.title} · starts ${when}`;
}

/** What the share sheet carries for SC7 (R-33): the text and the reference. */
export function shareText(e: Enrolment): string {
  const lines = [`I enrolled in ${e.course.title} at ${e.school.name}.`];
  const when = shortDay(e.intake.startDate);
  if (when !== '') lines.push(`Starts ${when}.`);
  lines.push(`Reference: ${e.reference}`);
  return lines.join(' ');
}

/** What a row of My courses says about where the enrolment stands (SC8), and in which tone. */
export type RowState = { label: string; tone: 'warning' | 'positive' | 'neutral'; icon?: 'Clock' };

/**
 * SC8's pill: a paid class that has not begun says the school will contact the student (the canvas's "School will contact you");
 * one that has begun and not ended is "In progress" (the canvas's "week 3 of 6" is left out until something writes progress); a
 * place held and not paid says so; the finished tab says "Finished" or "Refunded".
 */
export function rowState(row: Pick<EnrolmentRow, 'status' | 'tab' | 'intake'>, today: string): RowState {
  if (row.status === 'reserved') return { label: 'Not paid yet', tone: 'warning', icon: 'Clock' };
  if (row.status === 'refunded') return { label: 'Refunded', tone: 'neutral' };
  if (row.tab === 'finished') return { label: 'Finished', tone: 'neutral' };
  if (row.intake.startDate > today) return { label: 'School will contact you', tone: 'warning', icon: 'Clock' };
  return { label: 'In progress', tone: 'positive' };
}

/** SC8's line under the title: "Greenfield Tech Academy · starts 3 Nov", or "started 3 Nov" once it has begun. */
export function rowLine(row: Pick<EnrolmentRow, 'school' | 'intake'>, today: string): string {
  const when = shortDay(row.intake.startDate);
  if (when === '') return row.school.name;
  return `${row.school.name} · ${row.intake.startDate > today ? 'starts' : 'started'} ${when}`;
}
