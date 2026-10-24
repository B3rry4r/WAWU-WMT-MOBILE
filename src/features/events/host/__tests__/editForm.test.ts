import { draftFromEvent, eventChanged, patchBody, ticketDraftOf, ticketsChanged, tiersBody, whenWhereErrors, type HostDraft } from '../hostForm';

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

  it('a host who moves the end sends both the start and the end, in Lagos time', () => {
    const edited: HostDraft = { ...original, endTime: '04:00' };
    expect(patchBody(edited, original, null)).toEqual({ startsAt: '2027-01-12T23:30:00.000Z', endsAt: '2027-01-13T03:00:00.000Z' });
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
