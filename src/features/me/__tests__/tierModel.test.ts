import { productsMeterRenewal } from '@/components/ProductsMeter';

import type { MyTier, ProductDraft } from '../api';
import { draftTileOf, headerBadgeOf, productsMeterOf } from '../model';

const tier = (over: Partial<MyTier> = {}): MyTier => ({
  state: 'active',
  tier: { id: 'verify', name: 'Verify', badge: { id: 'verify', numbered: false } },
  activeFrom: '2026-10-01T00:00:00.000Z',
  activeUntil: '2026-11-26T10:00:00.000Z',
  productsAllowed: 3,
  productsUsed: 2,
  extraProducts: 0,
  pointsIncluded: 0,
  firstVoiceIntroIncluded: false,
  eventPass: null,
  ...over,
});

describe('headerBadgeOf', () => {
  it('names the tier for a person whose tier is running, with no number on a plain badge', () => {
    expect(headerBadgeOf(tier(), null)).toEqual({ name: 'Verify', number: null });
    expect(headerBadgeOf(tier({ state: 'ending' }), null)).toEqual({ name: 'Verify', number: null });
  });

  it('draws nothing without a running tier, a tier name or a badge', () => {
    expect(headerBadgeOf(undefined, null)).toBeNull();
    expect(headerBadgeOf(tier({ state: 'none', tier: null }), null)).toBeNull();
    expect(headerBadgeOf(tier({ state: 'ended' }), null)).toBeNull();
    expect(headerBadgeOf(tier({ tier: { id: 'verify', name: null, badge: { id: 'verify', numbered: false } } }), null)).toBeNull();
    expect(headerBadgeOf(tier({ tier: { id: 'verify', name: '  ', badge: { id: 'verify', numbered: false } } }), null)).toBeNull();
    expect(headerBadgeOf(tier({ tier: { id: 'verify', name: 'Verify', badge: null } }), null)).toBeNull();
  });

  it('adds the number of a numbered badge only when the profile details carry one', () => {
    const numbered = tier({ tier: { id: 'fm', name: 'Founding Maker', badge: { id: 'fm', numbered: true } } });
    expect(headerBadgeOf(numbered, { id: 'fm', numbered: true, name: 'Founding Maker', number: 128 })).toEqual({ name: 'Founding Maker', number: 128 });
    expect(headerBadgeOf(numbered, { id: 'fm', numbered: true, name: 'Founding Maker', number: null })).toEqual({ name: 'Founding Maker', number: null });
    expect(headerBadgeOf(numbered, null)).toEqual({ name: 'Founding Maker', number: null });
    // A plain tier never borrows a number from the details.
    expect(headerBadgeOf(tier(), { id: 'fm', numbered: true, name: 'Founding Maker', number: 128 })).toEqual({ name: 'Verify', number: null });
  });
});

describe('productsMeterOf', () => {
  /** The day these are written on: an end date is read against it, so none of them changes with the calendar. */
  const NOW = new Date('2026-10-18T09:00:00Z');

  it('reads the figures and the tier (name, state, end) from the Hub, the end day in Lagos time', () => {
    expect(productsMeterOf(tier())).toEqual({ used: 2, allowed: 3, tier: { name: 'Verify', state: 'active', endsAt: '2026-11-26T10:00:00.000Z' } });
    // 23:30 UTC on the 25th is 00:30 on the 26th in Lagos.
    const lagos = productsMeterOf(tier({ activeUntil: '2026-11-25T23:30:00.000Z' }));
    expect(productsMeterRenewal(lagos?.tier, NOW)).toBe('Renews 26 Nov');
  });

  it('says Renews while the tier is active and Ends once it is ending (the Hub\'s state decides)', () => {
    expect(productsMeterRenewal(productsMeterOf(tier({ state: 'active' }))?.tier, NOW)).toBe('Renews 26 Nov');
    expect(productsMeterRenewal(productsMeterOf(tier({ state: 'ending' }))?.tier, NOW)).toBe('Ends 26 Nov');
  });

  it('carries the year for a 12-month tier, whose end is next year (FIX-78 F-3)', () => {
    const founding = tier({ tier: { id: 'founding', name: 'Founding Maker', badge: null }, activeFrom: '2026-10-18T09:00:00.000Z', activeUntil: '2027-10-18T09:00:00.000Z' });
    expect(productsMeterRenewal(productsMeterOf(founding)?.tier, NOW)).toBe('Renews 18 Oct 2027');
  });

  it('is null with no running tier or no allowance', () => {
    expect(productsMeterOf(undefined)).toBeNull();
    expect(productsMeterOf(tier({ state: 'none', tier: null, productsAllowed: 0, productsUsed: 0 }))).toBeNull();
    expect(productsMeterOf(tier({ state: 'ended' }))).toBeNull();
    expect(productsMeterOf(tier({ productsAllowed: 0 }))).toBeNull();
  });
});

describe('draftTileOf', () => {
  const draft = (over: Partial<ProductDraft> = {}): ProductDraft => ({
    id: 'd1',
    title: 'Colour LUT pack',
    contentType: 'video',
    description: null,
    category: null,
    specializations: [],
    tags: [],
    accessType: 'paid',
    price: 4500,
    missing: ['file'],
    mediaJobId: null,
    createdAt: '2026-10-10T09:00:00.000Z',
    updatedAt: '2026-10-10T09:00:00.000Z',
    ...over,
  });

  it('is a tile with no picture, never locked, marked as a draft and spoken as one', () => {
    expect(draftTileOf(draft())).toEqual({
      id: 'd1',
      title: 'Colour LUT pack',
      still: null,
      kind: 'video',
      locked: false,
      caption: 'Colour LUT pack',
      spoken: 'Colour LUT pack, draft',
      draft: true,
    });
  });

  it('shows an image mark while the kind of file is not chosen yet', () => {
    expect(draftTileOf(draft({ contentType: null })).kind).toBe('image');
  });
});
