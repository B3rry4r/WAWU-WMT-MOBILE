import type { EventView, TicketType } from '../api';
import {
  badgeOf,
  basketCount,
  basketTotal,
  heroPrice,
  maxQuantity,
  placeOf,
  priceLine,
  shortDate,
  startsThisWeek,
  ticketCount,
  tierStatus,
  venueOf,
  whenLine,
  withQuantity,
} from '../format';

const tier = (over: Partial<TicketType> = {}): TicketType => ({
  id: 't1',
  tier: 'regular',
  name: 'Regular',
  priceNaira: 7500,
  quantity: 100,
  sold: 10,
  remaining: 90,
  soldOut: false,
  salesStartAt: null,
  salesEndAt: null,
  ...over,
});

describe('dates are read in Lagos time (WAT, UTC+1)', () => {
  it('draws a start as the weekday, date and the Lagos clock', () => {
    expect(whenLine('2026-10-12T09:00:00.000Z')).toBe('Mon 12 Oct · 10:00 WAT');
    expect(badgeOf('2026-10-12T09:00:00.000Z')).toEqual({ month: 'OCT', day: '12' });
  });

  it('rolls over to the next Lagos day when the UTC time is late in the evening', () => {
    expect(whenLine('2026-10-11T23:30:00.000Z')).toBe('Mon 12 Oct · 00:30 WAT');
    expect(shortDate('2026-09-30T23:59:00.000Z')).toBe('1 Oct');
  });
});

describe('what a row says about price and place', () => {
  const sells = { ticketed: true, priceFromNaira: 5000 };

  it('says "From" the cheapest tier, "Free" at 0 and nothing when no tickets are sold here', () => {
    expect(priceLine(sells)).toBe('From ₦5,000');
    expect(priceLine({ ticketed: true, priceFromNaira: 0 })).toBe('Free');
    expect(priceLine({ ticketed: false, priceFromNaira: null })).toBeNull();
    expect(priceLine({ ticketed: true, priceFromNaira: null })).toBeNull();
    expect(heroPrice(sells)).toBe('from ₦5,000');
  });

  it('puts an online event at "Online" and otherwise the venue or the line the host gave', () => {
    const base = { format: 'in_person', location: 'Abuja', venueName: null } as Pick<EventView, 'format' | 'location' | 'venueName'>;
    expect(placeOf(base)).toBe('Abuja');
    expect(placeOf({ ...base, venueName: 'Eko Convention Centre' })).toBe('Eko Convention Centre');
    expect(placeOf({ ...base, format: 'online', location: '' })).toBe('Online');
  });

  it('joins the venue and the place around it once, never twice', () => {
    const e = { format: 'in_person', location: 'Lagos', venueName: 'Eko Convention Centre', address: 'Victoria Island' } as const;
    expect(venueOf(e)).toBe('Eko Convention Centre, Victoria Island');
    expect(venueOf({ ...e, address: null })).toBe('Eko Convention Centre, Lagos');
    expect(venueOf({ ...e, venueName: 'Victoria Island', address: 'Victoria Island, Lagos' })).toBe('Victoria Island, Lagos');
  });
});

describe('this week', () => {
  const now = Date.parse('2026-10-07T10:00:00.000Z');
  it('is anything starting within seven days, and anything already running', () => {
    expect(startsThisWeek({ startsAt: '2026-10-12T09:00:00.000Z' }, now)).toBe(true);
    expect(startsThisWeek({ startsAt: '2026-10-06T09:00:00.000Z' }, now)).toBe(true);
    expect(startsThisWeek({ startsAt: '2026-10-14T10:00:00.001Z' }, now)).toBe(false);
  });
});

describe('a tier', () => {
  const event = { startsAt: '2026-10-12T09:00:00.000Z' };
  const before = Date.parse('2026-10-01T09:00:00.000Z');

  it('can be bought while it is on sale and has tickets left, and says how many are left', () => {
    const s = tierStatus(tier(), event, before);
    expect(s).toMatchObject({ open: true, soldOut: false, ended: false, notYet: false, line: '90 left' });
  });

  it('is sold out when the Hub says so, or nothing is left', () => {
    expect(tierStatus(tier({ soldOut: true, remaining: 0 }), event, before).open).toBe(false);
    expect(tierStatus(tier({ remaining: 0 }), event, before).soldOut).toBe(true);
    expect(tierStatus(tier({ soldOut: true, remaining: 0 }), event, before).line).toBe('');
  });

  it('has ended on its own end date, with the day it ended, even if it also sold out', () => {
    const s = tierStatus(tier({ salesEndAt: '2026-09-30T10:00:00.000Z', soldOut: true, remaining: 0 }), event, before);
    expect(s).toMatchObject({ open: false, ended: true, soldOut: true, line: 'Ended 30 Sep' });
  });

  it('closes at the event start when it has no end date of its own (the Hub refuses the sale then too)', () => {
    expect(tierStatus(tier(), event, Date.parse('2026-10-12T09:00:00.000Z')).ended).toBe(true);
  });

  it('has not opened before its start date', () => {
    const s = tierStatus(tier({ salesStartAt: '2026-10-05T09:00:00.000Z' }), event, before);
    expect(s).toMatchObject({ open: false, notYet: true, line: 'Opens 5 Oct' });
  });
});

describe('the basket', () => {
  const regular = tier();
  const vip = tier({ id: 't2', name: 'VIP', priceNaira: 12000, remaining: 3 });

  it('totals each picked tier at its price, in kobo, across tiers', () => {
    let basket = withQuantity({}, regular, 1);
    basket = withQuantity(basket, vip, 2);
    expect(basketCount(basket)).toBe(3);
    expect(basketTotal([regular, vip], basket)).toBe(750000 + 2400000);
  });

  it('never takes more than is left, or fewer than none', () => {
    expect(maxQuantity(vip)).toBe(3);
    expect(withQuantity({}, vip, 9)).toEqual({ t2: 3 });
    expect(withQuantity({ t2: 1 }, vip, -4)).toEqual({ t2: 0 });
  });

  it('holds one order to the Hub cap of 50 tickets a tier', () => {
    expect(maxQuantity(tier({ remaining: 400 }))).toBe(50);
  });

  it('counts tickets in words', () => {
    expect([0, 1, 4].map(ticketCount)).toEqual(['No tickets', '1 ticket', '4 tickets']);
  });
});
