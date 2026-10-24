import { formatMoney } from '@/components/Money';

import type { EventView, TicketType } from './api';

/** West Africa Time is UTC+1 all year (Nigeria keeps no daylight saving), so the offset is a constant. */
const WAT_OFFSET_MS = 60 * 60 * 1000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const KOBO_PER_NAIRA = 100;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

type Wat = { weekday: string; day: number; month: string; year: number; hour: string; minute: string };

type Zoned = { timezone?: string | null; timeLabel?: string | null; endsAt?: string | null };
const LAGOS = 'Africa/Lagos';
const keepsLagosTime = (zone?: Zoned) => !zone?.timezone || zone.timezone === LAGOS;

/** The IANA zone whose calendar the event's date is read in: Lagos unless the Hub names another zone the runtime knows. */
function calendarZone(zone?: Zoned): string {
  if (keepsLagosTime(zone)) return LAGOS;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone?.timezone ?? LAGOS });
    return zone?.timezone ?? LAGOS;
  } catch {
    return LAGOS;
  }
}

/** True when the Hub names a zone the runtime cannot resolve ("WAT", "EDT"): its clock and date cannot be trusted. */
const zoneUnresolved = (zone?: Zoned) => !keepsLagosTime(zone) && calendarZone(zone) === LAGOS;

/** An instant as the clock and calendar in the event's zone show it (Lagos by default). */
export function watOf(iso: string, zone?: Zoned): Wat {
  const tz = calendarZone(zone);
  if (tz === LAGOS) {
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
  const parts: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
  }).formatToParts(new Date(iso))) {
    parts[p.type] = p.value;
  }
  const month = Number(parts.month) - 1;
  const day = Number(parts.day);
  const year = Number(parts.year);
  return {
    weekday: WEEKDAYS[new Date(Date.UTC(year, month, day)).getUTCDay()],
    day,
    month: MONTHS[month],
    year,
    hour: parts.hour.padStart(2, '0'),
    minute: parts.minute.padStart(2, '0'),
  };
}

/** The date badge's two lines: "OCT" over "12", the day always two digits as the canvas draws it ("OCT 09"). */
export function badgeOf(iso: string, zone?: Zoned): { month: string; day: string } {
  const w = watOf(iso, zone);
  return { month: w.month.toUpperCase(), day: String(w.day).padStart(2, '0') };
}

/**
 * "Sun 12 Oct · 10:00 WAT" (E2). The date is read in the event's own zone, so it always sits beside
 * that zone's clock. The year follows ("Sun 16 Mar 2031") only when the event is not in the current
 * year. An event that ends on a later day in its own zone names both days ("Sat 8 Nov to Mon 10 Nov · 14:00 WAT"). An event in another zone shows the Hub's `timeLabel` where WAT would be (no label: date
 * only). A zone the runtime cannot resolve draws the Lagos date alone: no clock, no zone claim.
 */
export function whenLine(iso: string, zone?: Zoned, now: number = Date.now()): string {
  const w = watOf(iso, zone);
  const thisYear = watOf(new Date(now).toISOString(), zone).year;
  const dayOf = (x: Wat) => `${x.weekday} ${x.day} ${x.month}${x.year === thisYear ? '' : ` ${x.year}`}`;
  // A multi-day event (FIX-110, G-443) names both days ("Sat 8 Nov to Mon 10 Nov"); one that ends on its start day reads as before.
  const end = zone?.endsAt && Number.isFinite(Date.parse(zone.endsAt)) ? watOf(zone.endsAt, zone) : null;
  const endsLater = end !== null && (end.year !== w.year || end.month !== w.month || end.day !== w.day) && Date.parse(zone!.endsAt!) > Date.parse(iso);
  const date = endsLater ? `${dayOf(w)} to ${dayOf(end)}` : dayOf(w);
  if (keepsLagosTime(zone)) return `${date} · ${w.hour}:${w.minute} WAT`;
  if (zoneUnresolved(zone)) return date;
  const label = zone?.timeLabel?.trim();
  return label ? `${date} · ${label}` : date;
}

/** "30 Sep". */
export function shortDate(iso: string, zone?: Zoned): string {
  const w = watOf(iso, zone);
  return `${w.day} ${w.month}`;
}

/** "16 Mar", or "16 Mar 2027" when the event is not in the current year (Explore's hero line and cards, as E1 and E2 do). */
export function dateLine(iso: string, zone?: Zoned, now: number = Date.now()): string {
  const w = watOf(iso, zone);
  const thisYear = watOf(new Date(now).toISOString(), zone).year;
  return `${w.day} ${w.month}${w.year === thisYear ? '' : ` ${w.year}`}`;
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

/** The tier's "Ended" and "Opens" dates are read in the event's own zone, as every other date on E2 is. */
export function tierStatus(
  tier: TicketType,
  event: Pick<EventView, 'startsAt'> & Zoned,
  now: number,
): TierStatus {
  const closesAt = tier.salesEndAt ?? event.startsAt;
  const ended = now >= new Date(closesAt).getTime();
  const notYet = tier.salesStartAt !== null && now < new Date(tier.salesStartAt).getTime();
  const soldOut = tier.soldOut || tier.remaining <= 0;
  const open = !ended && !notYet && !soldOut;
  const line = ended
    ? `Ended ${shortDate(closesAt, event)}`
    : notYet && tier.salesStartAt
      ? `Opens ${shortDate(tier.salesStartAt, event)}`
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
