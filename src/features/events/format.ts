import { formatMoney } from '@/components/Money';

import type { EventView, TicketType } from './api';

/** West Africa Time is UTC+1 all year (Nigeria keeps no daylight saving), so the offset is a constant. */
const WAT_OFFSET_MS = 60 * 60 * 1000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const KOBO_PER_NAIRA = 100;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

type Wat = { weekday: string; day: number; month: string; year: number; hour: string; minute: string };

/** An instant as the clock and calendar in Lagos show it. */
export function watOf(iso: string): Wat {
  const d = new Date(new Date(iso).getTime() + WAT_OFFSET_MS);
  return {
    weekday: WEEKDAYS[d.getUTCDay()],
    day: d.getUTCDate(),
    month: MONTHS[d.getUTCMonth()],
    year: d.getUTCFullYear(),
    hour: String(d.getUTCHours()).padStart(2, '0'),
    minute: String(d.getUTCMinutes()).padStart(2, '0'),
  };
}

/** The date badge's two lines: "OCT" over "12". */
export function badgeOf(iso: string): { month: string; day: string } {
  const w = watOf(iso);
  return { month: w.month.toUpperCase(), day: String(w.day) };
}

/** The event's own clock, Lagos time unless the Hub says the event keeps another zone. */
type Zoned = { timezone?: string | null; timeLabel?: string | null };
const LAGOS = 'Africa/Lagos';
const keepsLagosTime = (zone?: Zoned) => !zone?.timezone || zone.timezone === LAGOS;

/**
 * "Sun 12 Oct · 10:00 WAT" (E2). The year follows ("Sun 16 Mar 2031") only when the event is not in
 * the current year. An event in another zone shows the Hub's `timeLabel` where WAT would be: a
 * Lagos clock for it would be a wrong fact, so with no label only the date is drawn.
 */
export function whenLine(iso: string, zone?: Zoned, now: number = Date.now()): string {
  const w = watOf(iso);
  const date = `${w.weekday} ${w.day} ${w.month}${w.year === watOf(new Date(now).toISOString()).year ? '' : ` ${w.year}`}`;
  if (keepsLagosTime(zone)) return `${date} · ${w.hour}:${w.minute} WAT`;
  const label = zone?.timeLabel?.trim();
  return label ? `${date} · ${label}` : date;
}

/** "30 Sep". */
export function shortDate(iso: string): string {
  const w = watOf(iso);
  return `${w.day} ${w.month}`;
}

/** Naira from the API as kobo for `Money`: the Hub sends whole naira, the app draws kobo. */
export const toKobo = (naira: number) => Math.round(naira * KOBO_PER_NAIRA);

const naira = (value: number) => formatMoney(toKobo(value), { decimals: false });

/** An event is "this week" while it starts within seven days from now (a past start is never listed as upcoming). */
export const startsThisWeek = (event: Pick<EventView, 'startsAt'>, now: number) => new Date(event.startsAt).getTime() < now + WEEK_MS;

/** The price under a row: "From ₦5,000", "Free", or nothing when the event sells no tickets here. */
export function priceLine(event: Pick<EventView, 'ticketed' | 'priceFromNaira'>): string | null {
  if (!event.ticketed || event.priceFromNaira === null) return null;
  return event.priceFromNaira === 0 ? 'Free' : `From ${naira(event.priceFromNaira)}`;
}

/** The hero's "from ₦7,500" (lower case, after the place), or nothing. */
export function heroPrice(event: Pick<EventView, 'ticketed' | 'priceFromNaira'>): string | null {
  const line = priceLine(event);
  if (!line) return null;
  return line.replace(/^From/, 'from');
}

/** Where, on a row or the hero: "Online" for an online event, else the line the host gave. */
export function placeOf(event: Pick<EventView, 'format' | 'location' | 'venueName'>): string {
  if (event.format === 'online') return 'Online';
  return event.venueName?.trim() || event.location.trim();
}

/** Where, on the detail card: the venue and the place around it ("Eko Convention Centre, Victoria Island"). */
export function venueOf(event: Pick<EventView, 'format' | 'location' | 'venueName' | 'address'>): string {
  if (event.format === 'online') return 'Online';
  const parts = [event.venueName, event.address?.trim() || event.location].map((p) => p?.trim() ?? '').filter(Boolean);
  return parts.filter((p, i) => !parts.some((other, j) => j !== i && other.length > p.length && other.includes(p))).join(', ');
}

/** What a tier is doing right now, from the Hub's own flags and dates. */
export type TierStatus = {
  /** Can be bought: on sale and not sold out. */
  open: boolean;
  soldOut: boolean;
  /** Sales closed (the tier's end date, or the event's start when it has none: the Hub's own rule). */
  ended: boolean;
  /** Sales have not opened yet. */
  notYet: boolean;
  /** The line under the tier's name: what is left, or when sales opened or end; nothing once it has sold out (the pill says so). */
  line: string;
};

export function tierStatus(tier: TicketType, event: Pick<EventView, 'startsAt'>, now: number): TierStatus {
  const closesAt = tier.salesEndAt ?? event.startsAt;
  const ended = now >= new Date(closesAt).getTime();
  const notYet = tier.salesStartAt !== null && now < new Date(tier.salesStartAt).getTime();
  const soldOut = tier.soldOut || tier.remaining <= 0;
  const open = !ended && !notYet && !soldOut;
  const line = ended
    ? `Ended ${shortDate(closesAt)}`
    : notYet && tier.salesStartAt
      ? `Opens ${shortDate(tier.salesStartAt)}`
      : soldOut
        ? ''
        : `${tier.remaining} left`;
  return { open, soldOut, ended, notYet, line };
}

/** The Hub's cap on one order's tickets (`MAX_TICKETS_PER_ORDER`, event-ticketing.constants.ts). The contract does not serve it (BACKEND_GAPS.md). */
export const MAX_TICKETS_PER_ORDER = 50;

/** How many of a tier one person can take. */
export const maxQuantity = (tier: TicketType) => Math.max(0, Math.min(tier.remaining, MAX_TICKETS_PER_ORDER));

/** Tickets picked, by tier id. A tier not in it is none. */
export type Basket = Readonly<Record<string, number>>;

export const quantityOf = (basket: Basket, tierId: string) => basket[tierId] ?? 0;

/** Sets one tier's quantity, held between 0 and what can be taken; the others stay. */
export function withQuantity(basket: Basket, tier: TicketType, quantity: number): Basket {
  const next = Math.max(0, Math.min(quantity, maxQuantity(tier)));
  return { ...basket, [tier.id]: next };
}

export const basketCount = (basket: Basket) => Object.values(basket).reduce((sum, n) => sum + n, 0);

/** The running total in kobo: each picked tier's price times its quantity. */
export function basketTotal(tiers: readonly TicketType[], basket: Basket): number {
  return tiers.reduce((sum, t) => sum + toKobo(t.priceNaira) * quantityOf(basket, t.id), 0);
}

/** "1 ticket", "3 tickets", "No tickets". */
export function ticketCount(count: number): string {
  if (count === 0) return 'No tickets';
  return count === 1 ? '1 ticket' : `${count} tickets`;
}
