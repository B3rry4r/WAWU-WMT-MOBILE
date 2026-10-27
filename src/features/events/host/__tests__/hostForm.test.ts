import type { EventOptions } from '../../api';
import {
  addressError,
  basicsErrors,
  createBody,
  dayChoices,
  dayLabel,
  digitsOf,
  emptyDraft,
  lagosInstant,
  newTicket,
  priceShown,
  startLabel,
  stepErrors,
  ticketErrors,
  ticketNote,
  timeChoices,
  whenWhereErrors,
  type HostDraft,
} from '../hostForm';

const rules: EventOptions['tickets'] = {
  hostSharePercent: 85,
  minPriceNaira: 0,
  maxPriceNaira: 10_000_000,
  minQuantity: 1,
  maxQuantity: 1_000_000,
  nameMinLength: 2,
  nameMaxLength: 60,
  maxTypes: 20,
};
const fields: EventOptions['fields'] = { nameMax: 160, descriptionMax: 5000, hostOrgMax: 160, addressMax: 300 };
const options = { categories: [], formats: [], types: [], tickets: rules, fields } as unknown as EventOptions;

// 1 Jan 2027 10:00 in Lagos.
const NOW = new Date('2027-01-01T09:00:00Z').getTime();

const ticket = (over: Partial<ReturnType<typeof newTicket>> = {}) => ({ ...newTicket(), name: 'Regular', price: '5000', quantity: '100', ...over });
const draft = (over: Partial<HostDraft> = {}): HostDraft => ({
  ...emptyDraft(),
  name: 'Pricing your work',
  description: 'Three hours.',
  hostOrg: 'Adeyemi & Co',
  kind: 'workshop',
  day: '2027-01-02',
  startTime: '14:00',
  endTime: '17:00',
  address: '5 Marina',
  category: 'business',
  tickets: [ticket()],
  ...over,
});

describe('basics (E13)', () => {
  it('passes a complete step', () => expect(basicsErrors(draft(), fields)).toEqual({}));
  it.each(['name', 'description', 'hostOrg'] as const)('asks for %s when it is blank or spaces', (key) => {
    expect(basicsErrors(draft({ [key]: '' }), fields)[key]).toBeTruthy();
    expect(basicsErrors(draft({ [key]: '   ' }), fields)[key]).toBeTruthy();
  });
  it('holds each text to the Hub length, at the limit and one past', () => {
    expect(basicsErrors(draft({ name: 'a'.repeat(160) }), fields).name).toBeUndefined();
    expect(basicsErrors(draft({ name: 'a'.repeat(161) }), fields).name).toBe('Keep it to 160 characters.');
    expect(basicsErrors(draft({ description: 'a'.repeat(5000) }), fields).description).toBeUndefined();
    expect(basicsErrors(draft({ description: 'a'.repeat(5001) }), fields).description).toBeTruthy();
    expect(basicsErrors(draft({ hostOrg: 'a'.repeat(160) }), fields).hostOrg).toBeUndefined();
    expect(basicsErrors(draft({ hostOrg: 'a'.repeat(161) }), fields).hostOrg).toBeTruthy();
  });
  it('counts the trimmed length, so spaces around the text are not charged', () => {
    expect(basicsErrors(draft({ name: ` ${'a'.repeat(160)} ` }), fields).name).toBeUndefined();
  });
  it('needs a kind', () => expect(basicsErrors(draft({ kind: null }), fields).kind).toBeTruthy());
});

describe('when and where (E14)', () => {
  it('passes a complete step', () => expect(whenWhereErrors(draft(), fields, NOW)).toEqual({}));
  it('needs a start day and time', () => {
    expect(whenWhereErrors(draft({ day: null }), fields, NOW).starts).toBeTruthy();
    expect(whenWhereErrors(draft({ startTime: null }), fields, NOW).starts).toBeTruthy();
  });
  it('refuses a start that has passed, accepts one a minute ahead (Lagos time)', () => {
    // NOW is 10:00 in Lagos on 1 Jan.
    expect(whenWhereErrors(draft({ day: '2027-01-01', startTime: '10:00', endTime: '12:00' }), fields, NOW).starts).toBeTruthy();
    expect(whenWhereErrors(draft({ day: '2027-01-01', startTime: '10:30', endTime: '12:00' }), fields, NOW).starts).toBeUndefined();
    expect(whenWhereErrors(draft({ day: '2027-01-01', startTime: '09:30', endTime: '12:00' }), fields, NOW).starts).toBeTruthy();
  });
  it('needs an end that is after the start', () => {
    expect(whenWhereErrors(draft({ endTime: null }), fields, NOW).ends).toBeTruthy();
    expect(whenWhereErrors(draft({ startTime: '14:00', endTime: '14:00' }), fields, NOW).ends).toBeTruthy();
    expect(whenWhereErrors(draft({ startTime: '14:00', endTime: '13:30' }), fields, NOW).ends).toBeTruthy();
    expect(whenWhereErrors(draft({ startTime: '14:00', endTime: '14:30' }), fields, NOW).ends).toBeUndefined();
  });
  it('needs a category', () => expect(whenWhereErrors(draft({ category: null }), fields, NOW).category).toBeTruthy());
  it('needs a street address unless the event is online only', () => {
    expect(addressError('', 'in_person', fields)).toBe('Add the street address.');
    expect(addressError('  ', 'hybrid', fields)).toBeTruthy();
    expect(addressError('', 'online', fields)).toBeUndefined();
    expect(addressError('x', 'in_person', fields)).toBeUndefined();
  });
  it('holds the address to the Hub length, at the limit and one past', () => {
    expect(addressError('a'.repeat(300), 'in_person', fields)).toBeUndefined();
    expect(addressError('a'.repeat(301), 'in_person', fields)).toBe('Keep it to 300 characters.');
    expect(addressError('a'.repeat(301), 'online', fields)).toBeTruthy();
  });
});

describe('tickets (E15)', () => {
  it('passes a paid and a free type', () => {
    expect(ticketErrors([ticket(), ticket({ name: 'Free pass', price: '0' })], rules)).toEqual({});
  });
  it('allows a free event (R-8): a price of 0 is not an error', () => {
    expect(ticketErrors([ticket({ price: '0' })], rules)).toEqual({});
  });
  it('needs a type, and no more than the Hub allows', () => {
    expect(ticketErrors([], rules).tickets).toBeTruthy();
    const twenty = Array.from({ length: 20 }, (_, i) => ticket({ name: `Tier ${i}` }));
    expect(ticketErrors(twenty, rules).tickets).toBeUndefined();
    expect(ticketErrors([...twenty, ticket({ name: 'One more' })], rules).tickets).toBe('Up to 20 ticket types.');
  });
  it('holds a name to its length, trimmed, at each edge', () => {
    const t = ticket();
    expect(ticketErrors([{ ...t, name: 'a' }], rules)[`${t.key}.name`]).toBeTruthy();
    expect(ticketErrors([{ ...t, name: ' a ' }], rules)[`${t.key}.name`]).toBeTruthy();
    expect(ticketErrors([{ ...t, name: 'ab' }], rules)[`${t.key}.name`]).toBeUndefined();
    expect(ticketErrors([{ ...t, name: 'a'.repeat(60) }], rules)[`${t.key}.name`]).toBeUndefined();
    expect(ticketErrors([{ ...t, name: 'a'.repeat(61) }], rules)[`${t.key}.name`]).toBeTruthy();
  });
  it('names the second of two types with the same name and leaves the first alone', () => {
    const a = ticket({ name: 'VIP' });
    const b = ticket({ name: 'vip ' });
    const found = ticketErrors([a, b], rules);
    expect(found[`${a.key}.name`]).toBeUndefined();
    expect(found[`${b.key}.name`]).toBe('Another ticket type has this name.');
  });
  it('checks the price against the Hub bounds, at each edge', () => {
    const t = ticket();
    const at = (price: string) => ticketErrors([{ ...t, price }], rules)[`${t.key}.price`];
    expect(at('')).toBe('Set a price.');
    expect(at('0')).toBeUndefined();
    expect(at('10000000')).toBeUndefined();
    expect(at('10000001')).toBe('From ₦0 to ₦10,000,000.');
  });
  it('checks the quantity against the Hub bounds, at each edge', () => {
    const t = ticket();
    const at = (quantity: string) => ticketErrors([{ ...t, quantity }], rules)[`${t.key}.quantity`];
    expect(at('')).toBe('How many?');
    expect(at('0')).toBe('From 1 to 1,000,000.');
    expect(at('1')).toBeUndefined();
    expect(at('1000000')).toBeUndefined();
    expect(at('1000001')).toBeTruthy();
  });
  it('flags one type without touching the others', () => {
    const good = ticket();
    const bad = ticket({ name: 'VIP', quantity: '' });
    const found = ticketErrors([good, bad], rules);
    expect(Object.keys(found)).toEqual([`${bad.key}.quantity`]);
  });
  it('refuses a paid price that is not on the list, once the list is known, and lets ₦0 through as a free ticket (PRICE-PICKER)', () => {
    const t = ticket();
    const at = (price: string, list: readonly number[]) => ticketErrors([{ ...t, name: 'Regular', quantity: '10', price }], rules, list)[`${t.key}.price`];
    const list = [500, 1000, 2500];
    expect(at('1200', list)).toBe('Pick a price from the list.');
    expect(at('1000', list)).toBeUndefined();
    expect(at('0', list)).toBeUndefined();
    // Before the list has been read nothing is judged here (the picker shows no price until it has).
    expect(at('1200', [])).toBeUndefined();
  });
  it('writes the note from the Hub share', () => {
    expect(ticketNote(rules)).toBe('You keep 85% of every ticket. Pick Free for a free event.');
    expect(ticketNote({ ...rules, hostSharePercent: 80 })).toContain('You keep 80%');
  });
});

describe('stepErrors', () => {
  it('runs the step it is given', () => {
    const d = draft({ name: '', address: '', tickets: [ticket({ price: '' })] });
    expect(Object.keys(stepErrors(0, d, options, NOW))).toEqual(['name']);
    expect(Object.keys(stepErrors(1, d, options, NOW))).toEqual(['address']);
    expect(Object.keys(stepErrors(2, d, options, NOW))).toHaveLength(1);
  });
});

describe('typed numbers and dates', () => {
  it('reads digits out of what was typed', () => {
    expect(digitsOf('₦5,000')).toBe('5000');
    expect(digitsOf('abc')).toBe('');
  });
  it('shows a price with the naira sign, and nothing while empty', () => {
    expect(priceShown('')).toBe('');
    expect(priceShown('5000')).toBe('₦5,000');
    expect(priceShown('0')).toBe('₦0');
  });
  it('names a Lagos wall clock as the instant it is', () => {
    expect(lagosInstant('2027-01-02', '14:00')).toBe('2027-01-02T13:00:00.000Z');
    expect(lagosInstant('2027-01-02', '00:30')).toBe('2027-01-01T23:30:00.000Z');
  });
  it('offers days from today in Lagos, even when UTC is still yesterday', () => {
    const justAfterMidnightLagos = new Date('2027-01-01T23:30:00Z').getTime(); // 00:30 on 2 Jan in Lagos
    expect(dayChoices(justAfterMidnightLagos, 3)).toEqual(['2027-01-02', '2027-01-03', '2027-01-04']);
  });
  it('steps through the clock', () => {
    const times = timeChoices(30);
    expect(times).toHaveLength(48);
    expect(times[0]).toBe('00:00');
    expect(times[1]).toBe('00:30');
    expect(times[47]).toBe('23:30');
  });
  it('writes a day without a year in this year and with one in another', () => {
    expect(dayLabel('2027-01-02', NOW)).toBe('Sat 2 Jan');
    expect(dayLabel('2028-01-02', NOW)).toBe('Sun 2 Jan 2028');
    expect(startLabel('2027-01-02', '14:00', NOW)).toBe('Sat 2 Jan, 14:00');
  });
});

describe('createBody', () => {
  it('sends the event and its types in one body, trimmed, with numbers', () => {
    const body = createBody(draft({ name: ' Pricing ', tickets: [ticket({ name: ' VIP ', price: '12000', quantity: '20' })] }), 'https://cdn/x.png');
    expect(body).toMatchObject({
      name: 'Pricing',
      hostOrg: 'Adeyemi & Co',
      format: 'in_person',
      type: 'workshop',
      category: 'business',
      address: '5 Marina',
      startsAt: '2027-01-02T13:00:00.000Z',
      endsAt: '2027-01-02T16:00:00.000Z',
      bannerUrl: 'https://cdn/x.png',
      ticketTypes: [{ name: 'VIP', priceNaira: 12000, quantity: 20 }],
    });
  });
  it('leaves out the banner and a blank address, and keeps a free price as 0', () => {
    const body = createBody(draft({ address: '  ', tickets: [ticket({ price: '0' })] }), null);
    expect(body).not.toHaveProperty('bannerUrl');
    expect(body).not.toHaveProperty('address');
    expect(body.ticketTypes[0].priceNaira).toBe(0);
  });
  it('refuses an incomplete draft', () => {
    expect(() => createBody(draft({ kind: null }), null)).toThrow();
  });
});
