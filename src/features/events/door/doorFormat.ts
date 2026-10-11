import type { IconName } from '@/components/icon';

import { holderLine } from '../ticketFormat';

import type { CheckedInBy, DoorResult } from './doorApi';

/** What one verdict looks like on the door (E20, E23, E24): the colour, the icon, the headline and the lines under it. */
export type ResultView = {
  tone: 'positive' | 'warning' | 'danger';
  icon: IconName;
  title: string;
  line: string;
  /** "In the room 23" and "Still to arrive 41", the Hub's live counts. Null when the Hub was not asked (a reading the app answers itself), so no count is drawn. */
  totals: [string, string] | null;
  /** What a screen reader says when the result appears. */
  announce: string;
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const two = (n: number) => String(n).padStart(2, '0');

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * The time of E23's "Checked in at 09:52 by Door 1", on this phone's clock, which is the clock at the door. When the
 * ticket went in on another day the day comes first, as in Fri 9 Oct at 09:52, so an old check-in cannot pass for today's.
 */
export function checkedInWhen(iso: string, now: number = Date.now()): string {
  const at = new Date(iso);
  const today = new Date(now);
  const clock = `at ${two(at.getHours())}:${two(at.getMinutes())}`;
  if (sameDay(at, today)) return clock;
  const year = at.getFullYear() === today.getFullYear() ? '' : ` ${at.getFullYear()}`;
  return `${WEEKDAYS[at.getDay()]} ${at.getDate()} ${MONTHS[at.getMonth()]}${year} ${clock}`;
}

/** "by Door 1" (E23): the door the Hub names, or the organiser when they scanned it themselves; nothing when the scanner is no longer known. */
export function byLine(by: CheckedInBy | null | undefined): string {
  if (!by) return '';
  if (by.role === 'host') return ' by the organiser';
  const label = by.label?.trim();
  return label ? ` by ${label}` : '';
}

/** The sentence under ALREADY USED: "Checked in at 09:52 by Door 1". */
export const alreadyUsedLine = (iso: string, by: CheckedInBy | null | undefined, now: number = Date.now()): string =>
  `Checked in ${checkedInWhen(iso, now)}${byLine(by)}`;

export const NOT_VALID_LINE = "This code isn't for this event";
/** A ticket of this event that was voided because the event was called off: the Hub says so (`reason: 'cancelled'`). */
export const CANCELLED_LINE = 'This ticket was cancelled';

/**
 * E24 for a reading that cannot be a ticket (under 4 characters or over 500): the app answers it itself and
 * never sends it. The Hub's counts are not drawn: nobody was asked, and a count from an earlier answer would
 * pass for today's.
 */
export function localNotValidView(): ResultView {
  return { tone: 'danger', icon: 'X', title: 'NOT A VALID TICKET', line: NOT_VALID_LINE, totals: null, announce: `NOT A VALID TICKET. ${NOT_VALID_LINE}.` };
}

/** The three drawn results, from the Hub's answer. */
export function resultView(result: DoorResult, now: number = Date.now()): ResultView {
  const totals: [string, string] = [`In the room ${result.totals.checkedIn}`, `Still to arrive ${result.totals.stillToArrive}`];
  const ticket = result.ticket;
  const base = (view: Omit<ResultView, 'totals' | 'announce'>): ResultView => ({
    ...view,
    totals,
    announce: `${view.title}. ${view.line}. ${totals[0]}. ${totals[1]}.`,
  });
  if (result.outcome === 'valid' && ticket) {
    return base({ tone: 'positive', icon: 'Check', title: 'LET THEM IN', line: holderLine(ticket) });
  }
  if (result.outcome === 'already_used' && ticket && ticket.checkedInAt) {
    return base({ tone: 'warning', icon: 'Clock', title: 'ALREADY USED', line: alreadyUsedLine(ticket.checkedInAt, ticket.checkedInBy, now) });
  }
  return base({ tone: 'danger', icon: 'X', title: 'NOT A VALID TICKET', line: result.reason === 'cancelled' ? CANCELLED_LINE : NOT_VALID_LINE });
}
