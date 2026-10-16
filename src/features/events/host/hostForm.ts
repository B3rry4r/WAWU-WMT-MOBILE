import { formatMoney } from '@/components/Money';

import type { EventCategory, EventKind, EventOptions, EventView } from '../api';
import { toKobo, watOf } from '../format';

/**
 * The host wizard's draft and its rules (E13 to E15), kept apart from the screens so every
 * boundary is tested on its own. Every limit is the Hub's (`GET /events/options`, `tickets`
 * and `fields`), never a copy of it.
 */
export type EventFormat = EventView['format'];
export type TicketRules = EventOptions['tickets'];
export type FieldLimits = EventOptions['fields'];

export type TicketDraft = { key: string; name: string; price: string; quantity: string };

export type HostDraft = {
  name: string;
  description: string;
  hostOrg: string;
  format: EventFormat;
  kind: EventKind | null;
  /** The start's day in Lagos, `YYYY-MM-DD`. */
  day: string | null;
  /** The start's clock time in Lagos, `HH:MM`. */
  startTime: string | null;
  /** The end's clock time on the same day, `HH:MM`. */
  endTime: string | null;
  address: string;
  category: EventCategory | null;
  tickets: TicketDraft[];
};

let ticketSeq = 0;
export const newTicket = (): TicketDraft => ({ key: `t${(ticketSeq += 1)}`, name: '', price: '', quantity: '' });

/** In person is the first format and the one E13 draws picked; every other field starts empty. */
export const emptyDraft = (): HostDraft => ({
  name: '',
  description: '',
  hostOrg: '',
  format: 'in_person',
  kind: null,
  day: null,
  startTime: null,
  endTime: null,
  address: '',
  category: null,
  tickets: [newTicket()],
});

export type Step = 0 | 1 | 2;
export const STEPS = ['Basics', 'When and where', 'Tickets'] as const;

export type Errors = Partial<Record<string, string>>;

const blank = (s: string) => s.trim().length === 0;

/** Nigeria keeps West Africa Time (UTC+1) all year, so a Lagos wall clock is this offset (format.ts reads it the same way). */
const LAGOS_OFFSET = '+01:00';

/** The instant a Lagos day and clock time name. */
export const lagosInstant = (day: string, time: string): string => new Date(`${day}T${time}:00${LAGOS_OFFSET}`).toISOString();

/** Today's date in Lagos, `YYYY-MM-DD`: the calendar day the Lagos clock shows now. */
export const lagosDay = (now: number): string => new Date(now + LAGOS_OFFSET_MS).toISOString().slice(0, 10);

const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const two = (n: number) => String(n).padStart(2, '0');
const isoDay = (year: number, month0: number, day: number) => `${year}-${two(month0 + 1)}-${two(day)}`;

/** The days a start can be picked from: today in Lagos and the `count - 1` after it. */
export function dayChoices(now: number, count: number): string[] {
  const [y, m, d] = lagosDay(now).split('-').map(Number);
  return Array.from({ length: count }, (_, i) => {
    const at = new Date(Date.UTC(y, m - 1, d + i));
    return isoDay(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate());
  });
}

/** Every clock time a picker offers, `step` minutes apart from 00:00. */
export function timeChoices(step: number): string[] {
  return Array.from({ length: Math.floor((24 * 60) / step) }, (_, i) => `${two(Math.floor((i * step) / 60))}:${two((i * step) % 60)}`);
}

/** "Sat 8 Nov", with the year only when it is not this year's (the event's own zone, Lagos). */
export function dayLabel(day: string, now: number): string {
  const w = watOf(lagosInstant(day, '12:00'));
  const thisYear = watOf(new Date(now).toISOString()).year;
  return `${w.weekday} ${w.day} ${w.month}${w.year === thisYear ? '' : ` ${w.year}`}`;
}

/** E14's "Sat 8 Nov, 14:00". */
export const startLabel = (day: string, time: string, now: number) => `${dayLabel(day, now)}, ${time}`;

/** What the host typed in a whole-number field, as digits only ("₦5,000" and "5000" are both 5000). */
export const digitsOf = (typed: string) => typed.replace(/\D/g, '');

/** "₦5,000" for a price field showing 5000, empty while nothing is typed. */
export const priceShown = (digits: string) => (digits === '' ? '' : formatMoney(toKobo(Number(digits)), { decimals: false }));

/** A whole naira figure for the note: "₦0". */
export const nairaText = (naira: number) => formatMoney(toKobo(naira), { decimals: false });

/** E15's note, from the Hub's share and lowest price. */
export const ticketNote = (rules: TicketRules) =>
  `You keep ${rules.hostSharePercent}% of every ticket. Set price to ${nairaText(rules.minPriceNaira)} for a free event.`;

const tooLong = (max: number) => `Keep it to ${max} characters.`;

/** Step 1 (E13): name, what happens, who runs it, the format and the kind. */
export function basicsErrors(d: HostDraft, f: FieldLimits): Errors {
  const e: Errors = {};
  if (blank(d.name)) e.name = 'Give the event a name.';
  else if (d.name.trim().length > f.nameMax) e.name = tooLong(f.nameMax);
  if (blank(d.description)) e.description = 'Say what happens at it.';
  else if (d.description.trim().length > f.descriptionMax) e.description = tooLong(f.descriptionMax);
  if (blank(d.hostOrg)) e.hostOrg = 'Say who is running it.';
  else if (d.hostOrg.trim().length > f.hostOrgMax) e.hostOrg = tooLong(f.hostOrgMax);
  if (!d.kind) e.kind = 'Pick the kind of event.';
  return e;
}

/** A street address is needed unless the event is online only. */
export const needsAddress = (format: EventFormat) => format !== 'online';

/** Step 2 (E14): when it starts and ends, where, and its category. */
export function whenWhereErrors(d: HostDraft, f: FieldLimits, now: number): Errors {
  const e: Errors = {};
  if (!d.day || !d.startTime) e.starts = 'Pick when it starts.';
  else if (new Date(lagosInstant(d.day, d.startTime)).getTime() <= now) e.starts = 'Pick a time that has not passed.';
  if (!d.endTime) e.ends = 'Pick when it ends.';
  else if (d.startTime && d.endTime <= d.startTime) e.ends = 'It has to end after it starts.';
  e.address = addressError(d.address, d.format, f);
  if (!e.address) delete e.address;
  if (!d.category) e.category = 'Pick a category.';
  return e;
}

export function addressError(address: string, format: EventFormat, f: FieldLimits): string | undefined {
  if (needsAddress(format) && blank(address)) return 'Add the street address.';
  if (address.trim().length > f.addressMax) return tooLong(f.addressMax);
  return undefined;
}

/** Step 3 (E15): each ticket type's name, price and how many, against the Hub's rules. Keys are `<ticket key>.<field>`. */
export function ticketErrors(tickets: readonly TicketDraft[], rules: TicketRules): Errors {
  const e: Errors = {};
  if (tickets.length === 0) e.tickets = 'Add a ticket type.';
  if (tickets.length > rules.maxTypes) e.tickets = `Up to ${rules.maxTypes} ticket types.`;
  const seen = new Set<string>();
  for (const t of tickets) {
    const name = t.name.trim();
    if (name.length < rules.nameMinLength) e[`${t.key}.name`] = `At least ${rules.nameMinLength} characters.`;
    else if (name.length > rules.nameMaxLength) e[`${t.key}.name`] = tooLong(rules.nameMaxLength);
    else if (seen.has(name.toLowerCase())) e[`${t.key}.name`] = 'Another ticket type has this name.';
    seen.add(name.toLowerCase());
    if (t.price === '') e[`${t.key}.price`] = 'Set a price.';
    else if (Number(t.price) < rules.minPriceNaira || Number(t.price) > rules.maxPriceNaira)
      e[`${t.key}.price`] = `From ${nairaText(rules.minPriceNaira)} to ${nairaText(rules.maxPriceNaira)}.`;
    if (t.quantity === '') e[`${t.key}.quantity`] = 'How many?';
    else if (Number(t.quantity) < rules.minQuantity || Number(t.quantity) > rules.maxQuantity)
      e[`${t.key}.quantity`] = `From ${rules.minQuantity} to ${rules.maxQuantity.toLocaleString('en-US')}.`;
  }
  return e;
}

export const stepErrors = (step: Step, d: HostDraft, opts: EventOptions, now: number): Errors =>
  step === 0 ? basicsErrors(d, opts.fields) : step === 1 ? whenWhereErrors(d, opts.fields, now) : ticketErrors(d.tickets, opts.tickets);

export const hasErrors = (e: Errors) => Object.keys(e).length > 0;

/** The body of `POST /events`: one submit carries the event and its ticket types (EVENTS-02). */
export function createBody(d: HostDraft, bannerUrl: string | null) {
  if (!d.kind || !d.day || !d.startTime || !d.endTime || !d.category) throw new Error('the draft is not complete');
  const address = d.address.trim();
  return {
    name: d.name.trim(),
    description: d.description.trim(),
    hostOrg: d.hostOrg.trim(),
    format: d.format,
    type: d.kind,
    startsAt: lagosInstant(d.day, d.startTime),
    endsAt: lagosInstant(d.day, d.endTime),
    ...(address ? { address } : {}),
    category: d.category,
    ...(bannerUrl ? { bannerUrl } : {}),
    ticketTypes: d.tickets.map((t) => ({ name: t.name.trim(), priceNaira: Number(t.price), quantity: Number(t.quantity) })),
  };
}
