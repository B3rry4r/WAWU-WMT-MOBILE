import type { PillTone } from '@/components/StatusPill';
import type { IconName } from '@/components/icon';
import { dateWords } from '@/features/wallet/history/lagosTime';

import type { EventView } from '../api';
import { whenLine } from '../format';
import type { CancelAnswer } from './organiserApi';

/**
 * Words and rules for the host's own screens (E17, E18, E25), kept apart from the screens so each is tested alone.
 * Every figure comes from the Hub; a figure the Hub has not sent is left out, never drawn as 0.
 */

/**
 * The Hub's check on a reason (`CancelEventDto`: 10 to 500 characters, shown to every ticket holder).
 * PROVISIONAL(CANCEL-REASON, owner=EVENTS, why=GET /events/options serves no limit for a call-off reason; BACKEND_GAPS G-EVENTS-08-1)
 */
export const REASON = { min: 10, max: 500 } as const;

/**
 * The Hub's check on a shared link's name (`CreateReferralDto`: 2 to 60 characters).
 * PROVISIONAL(LINK-LABEL, owner=EVENTS, why=the Hub serves no limit for it; BACKEND_GAPS G-EVENTS-08-1)
 */
export const LABEL = { min: 2, max: 60 } as const;

export function labelError(label: string): string | undefined {
  const length = label.trim().length;
  if (length < LABEL.min) return `Name it in at least ${LABEL.min} characters.`;
  if (length > LABEL.max) return `Keep it to ${LABEL.max} characters.`;
  return undefined;
}

export type Pill = { label: string; tone: PillTone; icon?: IconName };

/** The status pill of a row on My events (E17): what the host's event is now. */
export function pillOf(event: Pick<EventView, 'status'>): Pill {
  switch (event.status) {
    case 'published':
      return { label: 'Live', tone: 'positive' };
    case 'pending':
      return { label: 'In review', tone: 'warning', icon: 'Clock' };
    case 'rejected':
      return { label: 'Sent back', tone: 'danger' };
    case 'cancelled':
      return { label: 'Called off', tone: 'danger' };
    default:
      return { label: 'Removed', tone: 'neutral' };
  }
}

/** Where a row of My events goes: a live event to its dashboard (E18), a sent-back one to E22. The others have no screen. */
export function opensOf(event: Pick<EventView, 'status'>): 'dashboard' | 'sent-back' | null {
  return event.status === 'published' ? 'dashboard' : event.status === 'rejected' ? 'sent-back' : null;
}

export const soldWord = (count: number) => `${count.toLocaleString('en-US')} sold`;

/** The line under a row's name: the date, then the sales while the event is live and the Hub has sent them. A removed event says so, with the day the Hub says it was taken down ("Taken down 20 Sep", the year when it is not this one). */
export function rowLine(event: EventView, sold: number | undefined, now: number, takenDownAt?: string): string {
  if (event.status === 'removed') {
    const at = takenDownAt ? new Date(takenDownAt) : null;
    return at && Number.isFinite(at.getTime()) ? `Taken down ${dateWords(at, new Date(now))}` : 'Taken down';
  }
  const date = whenLine(event.startsAt, event, now).split(' · ')[0];
  return event.status === 'published' && sold !== undefined ? `${date} · ${soldWord(sold)}` : date;
}

/** The dashboard's second title line: "Sun 12 Oct". */
export const dashboardDate = (event: Pick<EventView, 'startsAt' | 'timezone' | 'timeLabel'>, now: number) => whenLine(event.startsAt, event, now).split(' · ')[0];

export const plural = (count: number, one: string, many: string) => `${count.toLocaleString('en-US')} ${count === 1 ? one : many}`;

/** "3 links · 22 sales", or "No links yet": links and the tickets sold through them, both the Hub's. */
export function linksLine(links: readonly { ticketsSold: number }[]): string {
  if (links.length === 0) return 'No links yet';
  const sales = links.reduce((sum, l) => sum + l.ticketsSold, 0);
  return `${plural(links.length, 'link', 'links')} · ${plural(sales, 'sale', 'sales')}`;
}

/** "Regular, VIP": the names of the ticket types the Hub lists. */
export const tiersLine = (tiers: readonly { name: string }[]) => tiers.map((t) => t.name).join(', ');

/** E25's second line under "This refunds real money": how many people get their money back, from the Hub's dashboard. */
export function refundLine(buyers: number | null): string {
  // The Hub's count did not arrive: say it without a number, never with a made-up one.
  if (buyers === null) return 'Everyone who paid for a ticket gets their money back.';
  if (buyers === 0) return 'Nobody has paid for a ticket, so no money moves.';
  return buyers === 1 ? 'The 1 buyer gets their money back.' : `All ${buyers.toLocaleString('en-US')} buyers get their money back.`;
}

/** A reason is long enough and not too long, counting what the host typed without the spaces around it. */
export function reasonError(reason: string): string | undefined {
  const length = reason.trim().length;
  if (length < REASON.min) return `Give a reason of at least ${REASON.min} characters.`;
  if (length > REASON.max) return `Keep it to ${REASON.max} characters.`;
  return undefined;
}

/**
 * What calling it off did, in plain lines from the Hub's answer: refunds sent, refunds still going out on their own,
 * refunds a person has to settle. A line is drawn only for a count above zero.
 */
export function outcomeLines(answer: CancelAnswer): string[] {
  const lines: string[] = [];
  if (answer.ordersRefunded > 0) lines.push(`${plural(answer.ordersRefunded, 'refund', 'refunds')} sent.`);
  const waiting = answer.ordersLeftToSweep ?? 0;
  if (waiting > 0) lines.push(`${plural(waiting, 'refund is', 'refunds are')} still going out. They send on their own.`);
  if (answer.refundsNeedingAttention > 0) lines.push(`${plural(answer.refundsNeedingAttention, 'refund', 'refunds')} could not be sent automatically.`);
  if (lines.length === 0) lines.push('Nobody had paid, so no money moved.');
  return lines;
}
