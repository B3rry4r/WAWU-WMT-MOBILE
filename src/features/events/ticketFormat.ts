import { formatMoney } from '@/components/Money';

import type { EventView } from './api';
import { placeOf, watOf, whenLine } from './format';
import type { HeldEvent, HeldGroup, HeldStub, HeldTicket, WalletOrder } from './ticketsApi';

/** "1 × Regular", "2 × VIP" (E6): how many tickets one order holds of one tier. */
export const groupLine = (group: Pick<HeldGroup, 'quantity' | 'tierName'>) => `${group.quantity} × ${group.tierName}`;

/** The ticket a row opens: the first one that can still be scanned, else the first one that is not void, else the first. */
export function ticketToOpen(tickets: readonly HeldStub[]): HeldStub | null {
  return tickets.find((t) => t.status === 'valid') ?? tickets.find((t) => t.status !== 'void') ?? tickets[0] ?? null;
}

type Zone = Pick<HeldEvent, 'timezone' | 'timeLabel'>;

/**
 * "Sun 12 Oct · 10:00" (E7): the event's own date and clock. A Lagos event carries no zone label (as drawn, the
 * clock is Lagos time); an event in another zone carries the Hub's label for it, never a Lagos date beside a foreign clock.
 */
export function ticketWhen(iso: string, zone: Zone, now: number = Date.now()): string {
  return whenLine(iso, zone, now).replace(/ WAT$/, '');
}

/** "Sun 12 Oct at 09:52" (E12): when the door scanned it, on the event's own calendar and clock. Another zone names itself. */
export function checkedInLine(iso: string, zone: Zone, now: number = Date.now()): string {
  const at = watOf(iso, zone);
  const here = watOf(new Date(now).toISOString(), zone);
  const date = `${at.weekday} ${at.day} ${at.month}${at.year === here.year ? '' : ` ${at.year}`}`;
  const line = `${date} at ${at.hour}:${at.minute}`;
  const label = zone.timezone && zone.timezone !== 'Africa/Lagos' ? zoneName(iso, zone.timezone) : '';
  return label ? `${line} ${label}` : line;
}

/** The short name of a zone at an instant ("EDT"), or nothing when the runtime does not know the zone. */
function zoneName(iso: string, timezone: string): string {
  try {
    const part = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'short' })
      .formatToParts(new Date(iso))
      .find((p) => p.type === 'timeZoneName');
    return part?.value ?? '';
  } catch {
    return '';
  }
}

/** Where, under the event's name on the ticket: "Online", or the venue, or the place the host gave. */
export const ticketPlace = (event: Pick<HeldEvent, 'format' | 'location' | 'venueName'>) =>
  placeOf({ format: event.format as EventView['format'], location: event.location, venueName: event.venueName });

/** The line under the event's name on the card: "Sun 12 Oct · 10:00 · Eko Convention Centre". */
export const ticketHeadline = (event: HeldEvent, now: number = Date.now()) =>
  [ticketWhen(event.startsAt, event, now), ticketPlace(event)].filter(Boolean).join(' · ');

/** "Regular · Lennox Emmanuel": the tier and the person it is for; the name is left out when the Hub has none. */
export const holderLine = (ticket: Pick<HeldTicket, 'tierName' | 'holderName'>) =>
  [ticket.tierName, ticket.holderName?.trim()].filter(Boolean).join(' · ');

/** Where this ticket sits among the ones in its order and tier: "Ticket 2 of 3", or null when it is the only one. */
export function position(ticket: Pick<HeldTicket, 'id' | 'siblings'>): { index: number; count: number; previous: string | null; next: string | null } | null {
  const count = ticket.siblings.length;
  const index = ticket.siblings.findIndex((s) => s.id === ticket.id);
  if (count < 2 || index < 0) return null;
  return {
    index: index + 1,
    count,
    previous: index > 0 ? ticket.siblings[index - 1].id : null,
    next: index < count - 1 ? ticket.siblings[index + 1].id : null,
  };
}

/** E11's banner title, on the ticket page and on the order page of the same purchase. */
export const CALLED_OFF_TITLE = 'This event was called off';

type RefundOrder = Pick<WalletOrder, 'free' | 'ticketCount' | 'returned'>;

/**
 * E11's second line, from the Hub's order: what came back to the buyer's Naira wallet, or that it is on its way, or that it could not be sent by itself.
 * A free order has no money to return, so it has no line (and no banner: the plain "not valid" note stands).
 */
export function refundBannerBody(order: RefundOrder): string | null {
  if (order.free) return null;
  const { returned } = order;
  if (returned.returned && returned.returnedKobo !== null) {
    const sum = formatMoney(returned.returnedKobo, { decimals: false });
    return order.ticketCount > 1 ? `${sum} for your ${order.ticketCount} tickets is back in your Naira wallet.` : `${sum} is back in your Naira wallet.`;
  }
  return returned.holdStatus === 'released' ? 'Your refund could not be sent automatically.' : 'Your refund is on its way to your Naira wallet.';
}
