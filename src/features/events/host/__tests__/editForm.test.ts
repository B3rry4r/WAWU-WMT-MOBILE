import { draftFromEvent, endShown, eventChanged, patchBody, ticketDraftOf, ticketsChanged, tiersBody, whenWhereErrors, type HostDraft } from '../hostForm';

// The edit helpers of the host wizard (EVENTS-14): the draft an event fills, what an edit sends, and what counts as a change.
const event = {
  name: 'Creators Summit',
  description: 'Two days of talks.',
  hostOrg: 'Adeyemi & Co',
  format: 'in_person',
  type: 'conference',
  startsAt: '2027-01-12T23:30:00.000Z',
  endsAt: '2027-01-13T02:00:00.000Z',
  address: null,
  category: 'business',
} as unknown as Parameters<typeof draftFromEvent>[0];

const limits = { nameMax: 160, descriptionMax: 5000, hostOrgMax: 160, addressMax: 300 };

describe('draftFromEvent', () => {
  it('a host sees the event in Lagos time: 23:30 UTC is half past midnight the next day', () => {
    const draft = draftFromEvent(event);
    expect(draft.day).toBe('2027-01-13');
    expect(draft.startTime).toBe('00:30');
    expect(draft.endTime).toBe('03:00');
    expect(draft.address).toBe('');
    expect(draft.kind).toBe('conference');
  });
});

describe('patchBody', () => {
  const original = draftFromEvent(event);

  it('a host who changes nothing sends nothing', () => {
    expect(patchBody({ ...original }, original, null)).toEqual({});
    expect(eventChanged({ ...original }, original, false)).toBe(false);
  });

  it('a host who changes the name and the address sends those two, trimmed, and nothing else', () => {
    const edited: HostDraft = { ...original, name: '  Creators Summit 2027 ', address: ' 5 Marina ' };
    expect(patchBody(edited, original, null)).toEqual({ name: 'Creators Summit 2027', address: '5 Marina' });
    expect(eventChanged(edited, original, false)).toBe(true);
  });

  it('a host who moves the end sends the end alone, in Lagos time (the start did not move)', () => {
    const edited: HostDraft = { ...original, endTime: '04:00' };
    expect(patchBody(edited, original, null)).toEqual({ endsAt: '2027-01-13T03:00:00.000Z' });
  });

  it('a host who moves the start day of a one-day event sends the start and the end, the end still on the start day', () => {
    const edited: HostDraft = { ...original, day: '2027-01-14' };
    expect(patchBody(edited, original, null)).toEqual({ startsAt: '2027-01-13T23:30:00.000Z', endsAt: '2027-01-14T02:00:00.000Z' });
  });

  it('a new banner is a change on its own, and its link is sent', () => {
    expect(eventChanged({ ...original }, original, true)).toBe(true);
    expect(patchBody({ ...original }, original, 'https://files.example/banner.png')).toEqual({ bannerUrl: 'https://files.example/banner.png' });
  });
});

describe('whenWhereErrors on an edit', () => {
  const original = draftFromEvent(event);
  const after = new Date('2027-01-14T09:00:00Z').getTime();

  it('a start left as it was is not asked to be in the future, a moved one is', () => {
    expect(whenWhereErrors({ ...original, address: '5 Marina' }, limits, after, original).starts).toBeUndefined();
    expect(whenWhereErrors({ ...original, startTime: '01:00', address: '5 Marina' }, limits, after, original).starts).toBe('Pick a time that has not passed.');
    // A new event has no original: the check is the wizard's own.
    expect(whenWhereErrors({ ...original, address: '5 Marina' }, limits, after).starts).toBe('Pick a time that has not passed.');
  });
});

describe('ticket types', () => {
  const regular = { id: 't1', tier: 'regular', name: 'Regular', priceNaira: 5000, quantity: 100, salesStartAt: null, salesEndAt: '2027-01-10T10:00:00.000Z' } as const;

  it('a type the Hub holds is sent back exactly as it is, sales window and tier kept, so it counts as no change', () => {
    const draft = ticketDraftOf(regular);
    expect(tiersBody([draft])).toEqual([{ tier: 'regular', name: 'Regular', priceNaira: 5000, quantity: 100, salesEndAt: '2027-01-10T10:00:00.000Z' }]);
    expect(ticketsChanged([draft], [ticketDraftOf(regular)])).toBe(false);
  });

  it('a price, a place count, an added or a removed type is a change', () => {
    const draft = ticketDraftOf(regular);
    expect(ticketsChanged([{ ...draft, price: '6000' }], [draft])).toBe(true);
    expect(ticketsChanged([{ ...draft, quantity: '90' }], [draft])).toBe(true);
    expect(ticketsChanged([draft, { key: 'n', name: 'VIP', price: '9000', quantity: '10' }], [draft])).toBe(true);
    expect(ticketsChanged([], [draft])).toBe(true);
  });

  it('a paid type keeps its tier, a zero price is the free tier, and a type with no tier is regular', () => {
    expect(tiersBody([{ ...ticketDraftOf({ ...regular, tier: 'vip' }), price: '9000' }])[0].tier).toBe('vip');
    expect(tiersBody([{ ...ticketDraftOf({ ...regular, tier: 'vip' }), price: '0' }])[0].tier).toBe('free');
    expect(tiersBody([{ ...ticketDraftOf({ ...regular, tier: 'free', priceNaira: 0 }), price: '1000' }])[0].tier).toBe('regular');
    expect(tiersBody([{ key: 'n', name: 'Door', price: '2000', quantity: '5' }])[0].tier).toBe('regular');
  });
});

// The Hub holds an event as one day, as several days, or with no end (EVENTS-14 round 2). Lagos is UTC+1.
describe('an event that does not end on its start day or has no end', () => {
  // Wed 3 Nov 2027 09:00 to Fri 5 Nov 16:00 in Lagos: three days.
  const threeDay = { ...event, startsAt: '2027-11-03T08:00:00.000Z', endsAt: '2027-11-05T15:00:00.000Z' } as typeof event;
  // The same three days, ending at 07:00 on the third: an end whose clock time is earlier than the start's.
  const earlyEnd = { ...event, startsAt: '2027-11-03T08:00:00.000Z', endsAt: '2027-11-05T06:00:00.000Z' } as typeof event;
  const noEnd = { ...event, startsAt: '2027-11-03T08:00:00.000Z', endsAt: null } as unknown as typeof event;
  const now = new Date('2027-10-01T09:00:00Z').getTime();

  it('a host sees the three-day event with its end on its own day, and its end day shown beside the time', () => {
    const draft = draftFromEvent(threeDay);
    expect(draft).toMatchObject({ day: '2027-11-03', startTime: '09:00', endTime: '16:00', endDaysAfter: 2 });
    expect(endShown(draft, now)).toBe('Fri 5 Nov, 16:00');
    // A one-day event shows the clock time E14 draws.
    expect(endShown(draftFromEvent(event), now)).toBe('03:00');
  });

  it('a host can rename a three-day event: only the name is sent and no end is asked for or rewritten', () => {
    const original = draftFromEvent(threeDay);
    const edited: HostDraft = { ...original, name: 'Creators Summit 2027' };
    expect(patchBody(edited, original, null)).toEqual({ name: 'Creators Summit 2027' });
    expect(whenWhereErrors({ ...edited, address: '5 Marina' }, limits, now, original).ends).toBeUndefined();
  });

  it('a host can move the start time of a three-day event: only the start is sent, the end stays on day three', () => {
    const original = draftFromEvent(threeDay);
    const edited: HostDraft = { ...original, startTime: '10:00' };
    expect(patchBody(edited, original, null)).toEqual({ startsAt: '2027-11-03T09:00:00.000Z' });
    expect(whenWhereErrors({ ...edited, address: '5 Marina' }, limits, now, original).ends).toBeUndefined();
  });

  it('a host who moves the start day of a three-day event moves its end with it: still three days, same clock time', () => {
    const original = draftFromEvent(threeDay);
    const edited: HostDraft = { ...original, day: '2027-11-10' };
    expect(patchBody(edited, original, null)).toEqual({ startsAt: '2027-11-10T08:00:00.000Z', endsAt: '2027-11-12T15:00:00.000Z' });
  });

  it('a host who moves the end time of a three-day event sends the end alone, on day three', () => {
    const original = draftFromEvent(threeDay);
    expect(patchBody({ ...original, endTime: '18:00' }, original, null)).toEqual({ endsAt: '2027-11-05T17:00:00.000Z' });
  });

  it('a host can save a multi-day event whose end is a later day at an earlier clock time, a rename or a move of the start', () => {
    const original = draftFromEvent(earlyEnd);
    expect(original).toMatchObject({ startTime: '09:00', endTime: '07:00', endDaysAfter: 2 });
    const renamed: HostDraft = { ...original, name: 'Creators Summit 2027', address: '5 Marina' };
    expect(whenWhereErrors(renamed, limits, now, original).ends).toBeUndefined();
    expect(patchBody(renamed, original, null)).toEqual({ name: 'Creators Summit 2027', address: '5 Marina' });
    const moved: HostDraft = { ...renamed, startTime: '10:30' };
    expect(whenWhereErrors(moved, limits, now, original).ends).toBeUndefined();
    expect(patchBody(moved, original, null)).toEqual({ name: 'Creators Summit 2027', address: '5 Marina', startsAt: '2027-11-03T09:30:00.000Z' });
  });

  it('a host is still told when an end falls on or before its start, on a one-day and on a multi-day event', () => {
    const one = draftFromEvent(event);
    expect(whenWhereErrors({ ...one, address: 'x', endTime: '00:30' }, limits, now, one).ends).toBe('It has to end after it starts.');
    const original = draftFromEvent(threeDay);
    // Day one at 09:00 start, end on day three: the end is only before the start if the end moves onto it.
    expect(whenWhereErrors({ ...original, address: 'x', endDaysAfter: 0, endTime: '08:00' }, limits, now, original).ends).toBe('It has to end after it starts.');
  });

  it('a host can rename an event with no end: nothing is sent for the end and none is asked for', () => {
    const original = draftFromEvent(noEnd);
    expect(original).toMatchObject({ endTime: null, endDaysAfter: 0 });
    const edited: HostDraft = { ...original, name: 'Creators Summit 2027', address: '5 Marina' };
    expect(patchBody(edited, original, null)).toEqual({ name: 'Creators Summit 2027', address: '5 Marina' });
    expect(whenWhereErrors(edited, limits, now, original).ends).toBeUndefined();
    expect(endShown(original, now)).toBeNull();
    // A new event is still asked for an end: only an event the Hub holds with none is let off.
    expect(whenWhereErrors(edited, limits, now).ends).toBe('Pick when it ends.');
  });

  it('a host who moves the start of an event with no end sends the start alone, and one who picks an end sends it on the start day', () => {
    const original = draftFromEvent(noEnd);
    expect(patchBody({ ...original, day: '2027-11-10', startTime: '11:00' }, original, null)).toEqual({ startsAt: '2027-11-10T10:00:00.000Z' });
    const withEnd: HostDraft = { ...original, endTime: '17:00' };
    expect(patchBody(withEnd, original, null)).toEqual({ endsAt: '2027-11-03T16:00:00.000Z' });
    expect(whenWhereErrors({ ...withEnd, address: 'x' }, limits, now, original).ends).toBeUndefined();
    // An end picked at or before the start is refused, as on a new event.
    expect(whenWhereErrors({ ...withEnd, address: 'x', endTime: '08:30' }, limits, now, original).ends).toBe('It has to end after it starts.');
  });
});
