import { formatMoney } from '@/components/Money';
import { OFF_LIST_LINE } from '@/features/prices/model';

import type { EventCategory, EventKind, EventOptions, EventView, TicketType } from '../api';
import { toKobo, watOf } from '../format';

/**
 * The host wizard's draft and its rules (E13 to E15), kept apart from the screens so every
 * boundary is tested on its own. Every limit is the Hub's (`GET /events/options`, `tickets`
 * and `fields`), never a copy of it.
 */
export type EventFormat = EventView['format'];
export type TicketRules = EventOptions['tickets'];
export type FieldLimits = EventOptions['fields'];

/**
 * One ticket type in the draft. A type the Hub already holds (edit mode) also keeps its `tier` and sales window, so sending it back
 * unchanged is the same type to the Hub and nothing is rewritten.
 */
export type TicketDraft = {
  key: string;
  name: string;
  price: string;
  quantity: string;
  tier?: TicketType['tier'];
  salesStartAt?: string | null;
  salesEndAt?: string | null;
};

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
  /** The end's clock time in Lagos, `HH:MM`. Null while none is picked, and for an event the Hub holds with no end. */
  endTime: string | null;
  /**
   * Whole Lagos days from the start's day to the end's day. The wizard's events end on their start day, so it is absent (0).
   * Edit mode fills it from an event the Hub holds as multi-day, so the end stays on its own day when the start moves.
   */
  endDaysAfter?: number;
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
const DAY_MS = 24 * 60 * 60 * 1000;
const two = (n: number) => String(n).padStart(2, '0');
const isoDay = (year: number, month0: number, day: number) => `${year}-${two(month0 + 1)}-${two(day)}`;

/** The calendar day `n` days after `day` (`YYYY-MM-DD`). Nigeria has no daylight saving, so a day is always 24 hours. */
export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  const at = new Date(Date.UTC(y, m - 1, d + n));
  return isoDay(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate());
}

/** Whole days from one `YYYY-MM-DD` to another. */
export const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);

type EndParts = Pick<HostDraft, 'day' | 'endTime' | 'endDaysAfter'>;

/**
 * The Lagos day and clock time the draft ends at, or null when it has no end. The end keeps its clock time and how many days
 * after the start it falls, so moving the start day moves the end with it (a three-day event stays three days) and moving the
 * start time alone leaves the end where it was. A one-day event is the case where that gap is 0.
 */
export function endOf(d: EndParts): { day: string; time: string } | null {
  if (!d.day || !d.endTime) return null;
  return { day: addDays(d.day, d.endDaysAfter ?? 0), time: d.endTime };
}

const sameEnd = (a: ReturnType<typeof endOf>, b: ReturnType<typeof endOf>) => (a === null || b === null ? a === b : a.day === b.day && a.time === b.time);

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

/** The Ends field: the clock time E14 draws, and the end's day too when the event ends on a later day than it starts. */
export function endShown(d: HostDraft, now: number): string | null {
  const end = endOf(d);
  return end && (d.endDaysAfter ?? 0) > 0 ? startLabel(end.day, end.time, now) : d.endTime;
}

/** What the host typed in a whole-number field, as digits only ("₦5,000" and "5000" are both 5000). */
export const digitsOf = (typed: string) => typed.replace(/\D/g, '');

/** "₦5,000" for a price field showing 5000, empty while nothing is typed. */
export const priceShown = (digits: string) => (digits === '' ? '' : formatMoney(toKobo(Number(digits)), { decimals: false }));

/** A whole naira figure for the note: "₦0". */
export const nairaText = (naira: number) => formatMoney(toKobo(naira), { decimals: false });

/** E15's note, from the Hub's share. Free is its own switch, a ₦0 ticket (R-8). */
export const ticketNote = (rules: TicketRules) =>
  `You keep ${rules.hostSharePercent}% of every ticket. Pick Free for a free event.`;

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

/**
 * Step 2 (E14): when it starts and ends, where, and its category. On an edit, `original` is the event as the Hub holds it: a start
 * or an end left as it was is not asked for again (an event already under way can still be renamed, a multi-day event's end is
 * not read as a clock time on the start day, and an event with no end is not asked for one).
 */
export function whenWhereErrors(
  d: HostDraft,
  f: FieldLimits,
  now: number,
  original?: Pick<HostDraft, 'day' | 'startTime' | 'endTime' | 'endDaysAfter'>,
): Errors {
  const e: Errors = {};
  const startKept = original !== undefined && d.day === original.day && d.startTime === original.startTime;
  if (!d.day || !d.startTime) e.starts = 'Pick when it starts.';
  else if (!startKept && new Date(lagosInstant(d.day, d.startTime)).getTime() <= now) e.starts = 'Pick a time that has not passed.';
  if (!d.endTime) {
    if (original === undefined || original.endTime !== null) e.ends = 'Pick when it ends.';
  } else if (d.startTime) {
    const end = endOf({ ...d, day: d.day ?? '2000-01-01' });
    const endKept = original !== undefined && sameEnd(endOf(d), endOf(original));
    // The end is read as an instant on its own day, never as a clock time against the start's.
    if (end && !(startKept && endKept) && new Date(lagosInstant(end.day, end.time)).getTime() <= new Date(lagosInstant(d.day ?? '2000-01-01', d.startTime)).getTime())
      e.ends = 'It has to end after it starts.';
  }
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
export function ticketErrors(tickets: readonly TicketDraft[], rules: TicketRules, list: readonly number[] = []): Errors {
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
    // A paid ticket is a list price (PRICE-PICKER, R-101); ₦0 is a free ticket. Checked once the list has been read.
    else if (list.length > 0 && Number(t.price) !== 0 && !list.includes(Number(t.price))) e[`${t.key}.price`] = OFF_LIST_LINE;
    else if (Number(t.price) < rules.minPriceNaira || Number(t.price) > rules.maxPriceNaira)
      e[`${t.key}.price`] = `From ${nairaText(rules.minPriceNaira)} to ${nairaText(rules.maxPriceNaira)}.`;
    if (t.quantity === '') e[`${t.key}.quantity`] = 'How many?';
    else if (Number(t.quantity) < rules.minQuantity || Number(t.quantity) > rules.maxQuantity)
      e[`${t.key}.quantity`] = `From ${rules.minQuantity} to ${rules.maxQuantity.toLocaleString('en-US')}.`;
  }
  return e;
}

export const stepErrors = (
  step: Step,
  d: HostDraft,
  opts: EventOptions,
  now: number,
  original?: Pick<HostDraft, 'day' | 'startTime' | 'endTime' | 'endDaysAfter'>,
  list: readonly number[] = [],
): Errors =>
  step === 0 ? basicsErrors(d, opts.fields) : step === 1 ? whenWhereErrors(d, opts.fields, now, original) : ticketErrors(d.tickets, opts.tickets, list);

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

/** The Lagos day and clock time an instant falls on, as the wizard's pickers hold them. */
function lagosParts(iso: string): { day: string; time: string } {
  const shifted = new Date(new Date(iso).getTime() + LAGOS_OFFSET_MS).toISOString();
  return { day: shifted.slice(0, 10), time: shifted.slice(11, 16) };
}

/** A ticket type the Hub holds, as a draft row. */
export const ticketDraftOf = (t: Pick<TicketType, 'id' | 'tier' | 'name' | 'priceNaira' | 'quantity' | 'salesStartAt' | 'salesEndAt'>): TicketDraft => ({
  key: t.id,
  name: t.name,
  price: String(t.priceNaira),
  quantity: String(t.quantity),
  tier: t.tier,
  salesStartAt: t.salesStartAt ?? null,
  salesEndAt: t.salesEndAt ?? null,
});

/** The wizard's draft filled from an event the host already sent (edit mode), in the event's own Lagos day and clock times. */
export function draftFromEvent(event: EventView): HostDraft {
  const start = lagosParts(event.startsAt);
  const end = event.endsAt ? lagosParts(event.endsAt) : null;
  return {
    name: event.name,
    description: event.description,
    hostOrg: event.hostOrg,
    format: event.format,
    kind: event.type,
    day: start.day,
    startTime: start.time,
    endTime: end ? end.time : null,
    endDaysAfter: end ? Math.max(0, daysBetween(start.day, end.day)) : 0,
    address: event.address ?? '',
    category: event.category,
    tickets: [],
  };
}

/**
 * What an edit sends to `PATCH /events/{id}`: only the fields the host changed, so an edit that changes nothing sends nothing.
 * The start goes only when the host moved it and the end only when it moved (its own clock time, or its day because the start
 * day moved), so a rename alone sends neither and an event with no end is never given one.
 */
export function patchBody(d: HostDraft, original: HostDraft, bannerUrl: string | null) {
  const body: Record<string, string> = {};
  if (d.name.trim() !== original.name.trim()) body.name = d.name.trim();
  if (d.description.trim() !== original.description.trim()) body.description = d.description.trim();
  if (d.hostOrg.trim() !== original.hostOrg.trim()) body.hostOrg = d.hostOrg.trim();
  if (d.format !== original.format) body.format = d.format;
  if (d.kind && d.kind !== original.kind) body.type = d.kind;
  if (d.day && d.startTime && (d.day !== original.day || d.startTime !== original.startTime)) body.startsAt = lagosInstant(d.day, d.startTime);
  const end = endOf(d);
  if (end && !sameEnd(end, endOf(original))) body.endsAt = lagosInstant(end.day, end.time);
  if (d.address.trim() !== original.address.trim()) body.address = d.address.trim();
  if (d.category && d.category !== original.category) body.category = d.category;
  if (bannerUrl) body.bannerUrl = bannerUrl;
  return body;
}

/** The tier a row is sent as: a ₦0 price is `free`, a type the Hub holds keeps its own tier while it is paid, any other is `regular`. */
const tierOf = (t: TicketDraft): TicketType['tier'] => (Number(t.price) === 0 ? 'free' : t.tier && t.tier !== 'free' ? t.tier : 'regular');

/** The body of `PUT /events/{id}/tickets`: the whole list, each row with its tier and (kept as it was) its sales window. */
export const tiersBody = (tickets: readonly TicketDraft[]) =>
  tickets.map((t) => ({
    tier: tierOf(t),
    name: t.name.trim(),
    priceNaira: Number(t.price),
    quantity: Number(t.quantity),
    ...(t.salesStartAt ? { salesStartAt: t.salesStartAt } : {}),
    ...(t.salesEndAt ? { salesEndAt: t.salesEndAt } : {}),
  }));

const rowKey = (t: TicketDraft) => JSON.stringify([tierOf(t), t.name.trim(), Number(t.price), Number(t.quantity), t.salesStartAt ?? null, t.salesEndAt ?? null]);

/** Whether the rows differ from the types the Hub holds (the same rule the Hub uses: a type sent exactly as it is stays as it is). */
export function ticketsChanged(now: readonly TicketDraft[], original: readonly TicketDraft[]): boolean {
  const left = now.map(rowKey).sort();
  const right = original.map(rowKey).sort();
  return left.length !== right.length || left.some((k, i) => k !== right[i]);
}

/** Whether any field of an edit differs from the event as it was. */
export const eventChanged = (d: HostDraft, original: HostDraft, banner: boolean) => banner || Object.keys(patchBody(d, original, null)).length > 0;
