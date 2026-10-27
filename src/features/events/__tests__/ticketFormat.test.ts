import { checkedInLine, groupLine, holderLine, position, ticketHeadline, ticketPlace, ticketToOpen, ticketWhen, refundBannerBody } from '../ticketFormat';
import type { HeldEvent, HeldStub } from '../ticketsApi';

const stub = (id: string, status: HeldStub['status'], checkedInAt: string | null = null): HeldStub => ({ id, status, checkedInAt });
const lagos = { timezone: null, timeLabel: null };
const newYork = { timezone: 'America/New_York', timeLabel: '10:00 EDT' };
const NOW = Date.parse('2026-10-07T10:00:00Z');

describe('E6 rows', () => {
  it('writes the count and the tier', () => {
    expect(groupLine({ quantity: 1, tierName: 'Regular' })).toBe('1 × Regular');
    expect(groupLine({ quantity: 12, tierName: 'VIP' })).toBe('12 × VIP');
  });

  it('opens the first ticket that can still be scanned, else the first that is not void, else the first', () => {
    expect(ticketToOpen([stub('a', 'checked_in'), stub('b', 'valid'), stub('c', 'valid')])?.id).toBe('b');
    expect(ticketToOpen([stub('a', 'void'), stub('b', 'checked_in')])?.id).toBe('b');
    expect(ticketToOpen([stub('a', 'void'), stub('b', 'void')])?.id).toBe('a');
    expect(ticketToOpen([stub('a', 'valid')])?.id).toBe('a');
    expect(ticketToOpen([])).toBeNull();
  });
});

describe('E7 and E12 times', () => {
  it('a Lagos event reads its own date and clock with no zone label, as drawn', () => {
    expect(ticketWhen('2026-10-12T09:00:00Z', lagos, NOW)).toBe('Mon 12 Oct · 10:00');
    expect(ticketWhen('2026-10-12T09:00:00Z', { timezone: 'Africa/Lagos', timeLabel: null }, NOW)).toBe('Mon 12 Oct · 10:00');
  });

  it('the date is read in the event zone: 23:30 UTC on the 12th is already the 13th in Lagos', () => {
    expect(ticketWhen('2026-10-12T23:30:00Z', lagos, NOW)).toBe('Tue 13 Oct · 00:30');
  });

  it('shows the year only when it is not the current year', () => {
    expect(ticketWhen('2027-10-12T09:00:00Z', lagos, NOW)).toBe('Tue 12 Oct 2027 · 10:00');
    expect(ticketWhen('2026-12-31T09:00:00Z', lagos, NOW)).toBe('Thu 31 Dec · 10:00');
    expect(ticketWhen('2027-01-01T09:00:00Z', lagos, NOW)).toBe('Fri 1 Jan 2027 · 10:00');
  });

  it('an event in another zone shows the host label beside its own date, never a Lagos date beside a foreign clock', () => {
    // 03:00 UTC on the 15th is 23:00 on the 14th in New York.
    expect(ticketWhen('2026-10-15T03:00:00Z', newYork, NOW)).toBe('Wed 14 Oct · 10:00 EDT');
    expect(ticketWhen('2026-10-15T03:00:00Z', { timezone: 'America/New_York', timeLabel: null }, NOW)).toBe('Wed 14 Oct');
  });

  it('a zone the phone cannot resolve draws the Lagos date alone', () => {
    expect(ticketWhen('2026-10-12T09:00:00Z', { timezone: 'EDT', timeLabel: '10:00 EDT' }, NOW)).toBe('Mon 12 Oct');
  });

  it('the door time reads "Mon 12 Oct at 09:52" in Lagos, with the year only off-year', () => {
    expect(checkedInLine('2026-10-12T08:52:00Z', lagos, NOW)).toBe('Mon 12 Oct at 09:52');
    expect(checkedInLine('2027-10-12T08:52:00Z', lagos, NOW)).toBe('Tue 12 Oct 2027 at 09:52');
    expect(checkedInLine('2026-10-12T23:05:00Z', lagos, NOW)).toBe('Tue 13 Oct at 00:05');
  });

  it('the door time in another zone is that zone\'s clock, named', () => {
    expect(checkedInLine('2026-10-12T13:52:00Z', newYork, NOW)).toBe('Mon 12 Oct at 09:52 EDT');
    expect(checkedInLine('2026-01-12T14:52:00Z', newYork, NOW)).toBe('Mon 12 Jan at 09:52 EST');
  });

  it('the door time in a zone the phone cannot resolve is the Lagos clock with nothing claimed', () => {
    expect(checkedInLine('2026-10-12T08:52:00Z', { timezone: 'EDT', timeLabel: null }, NOW)).toBe('Mon 12 Oct at 09:52');
  });
});

describe('the card', () => {
  const event = (over: Partial<HeldEvent> = {}): HeldEvent => ({
    id: 'e',
    name: 'Summit',
    startsAt: '2026-10-12T09:00:00Z',
    endsAt: null,
    timezone: null,
    timeLabel: null,
    format: 'in_person',
    location: 'Lagos',
    venueName: 'Eko Convention Centre',
    bannerUrl: null,
    status: 'published',
    cancelledAt: null,
    ...over,
  });

  it('puts the date, the clock and the venue on one line', () => {
    expect(ticketHeadline(event(), NOW)).toBe('Mon 12 Oct · 10:00 · Eko Convention Centre');
  });

  it('names the place: the venue, else the location, else Online', () => {
    expect(ticketPlace(event())).toBe('Eko Convention Centre');
    expect(ticketPlace(event({ venueName: null }))).toBe('Lagos');
    expect(ticketPlace(event({ format: 'online', venueName: null, location: '' }))).toBe('Online');
    expect(ticketHeadline(event({ format: 'online', venueName: null, location: '' }), NOW)).toBe('Mon 12 Oct · 10:00 · Online');
  });

  it('writes the tier and the holder, leaving the name out when there is none', () => {
    expect(holderLine({ tierName: 'Regular', holderName: 'Chidi Umeh' })).toBe('Regular · Chidi Umeh');
    expect(holderLine({ tierName: 'Regular', holderName: null })).toBe('Regular');
    expect(holderLine({ tierName: 'Regular', holderName: '  ' })).toBe('Regular');
  });
});

describe('the tickets in one order and tier', () => {
  const siblings = [stub('a', 'valid'), stub('b', 'valid'), stub('c', 'checked_in')];
  it('says where this one sits and which are next to it', () => {
    expect(position({ id: 'a', siblings })).toEqual({ index: 1, count: 3, previous: null, next: 'b' });
    expect(position({ id: 'b', siblings })).toEqual({ index: 2, count: 3, previous: 'a', next: 'c' });
    expect(position({ id: 'c', siblings })).toEqual({ index: 3, count: 3, previous: 'b', next: null });
  });
  it('says nothing for a lone ticket, or one that is not among them', () => {
    expect(position({ id: 'a', siblings: [stub('a', 'valid')] })).toBeNull();
    expect(position({ id: 'zzz', siblings })).toBeNull();
  });
});

describe('PAY-FX (R-91): the refund line names the account the tickets were paid from', () => {
  const usd = { currency: 'USD', decimals: 2, totalMinor: 23, refundedMinor: 23 };
  const back = { free: false, ticketCount: 2, returned: { holdStatus: 'refunded', returned: true, returnedKobo: 500000 } } as unknown as Parameters<typeof refundBannerBody>[0];
  const moving = { free: false, ticketCount: 1, returned: { holdStatus: 'held', returned: false, returnedKobo: null } } as unknown as Parameters<typeof refundBannerBody>[0];

  it('says what went back to the USD account, in dollars', () => {
    expect(refundBannerBody(back, usd)).toBe('$0.23 for your 2 tickets is back in your USD account.');
    expect(refundBannerBody(moving, usd)).toBe('Your refund is on its way to your USD account.');
  });

  it('a naira order reads as it always did', () => {
    expect(refundBannerBody(back)).toBe('₦5,000 for your 2 tickets is back in your Naira wallet.');
    expect(refundBannerBody(moving)).toBe('Your refund is on its way to your Naira wallet.');
  });
});
