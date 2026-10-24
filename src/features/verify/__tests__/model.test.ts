import type { PlansView, ProductDraft } from '../api';
import { bonusRowsOf, changesOf, cleanPrice, createBodyOf, draftLine, emptyForm, formOf, pointsLine, shopReady, titleProblem } from '../model';

const draft = (over: Partial<ProductDraft> = {}): ProductDraft => ({
  id: 'd1',
  title: 'Brand deck template',
  contentType: null,
  description: null,
  category: null,
  specializations: [],
  tags: [],
  accessType: null,
  price: null,
  missing: [],
  createdAt: '2026-10-17T10:00:00.000Z',
  updatedAt: '2026-10-17T10:00:00.000Z',
  ...over,
});

const tier = (over: Record<string, unknown> = {}) => ({
  id: 'founding',
  name: 'Founding Maker',
  days: 365,
  products: 10,
  bonusPoints: 600,
  bonusPointsExpireDays: 365,
  priceMinor: 500000,
  eventPass: { id: 'maker_pass_priority', name: 'Maker Pass, priority', benefits: null, eventDate: null },
  badge: { id: 'founding', numbered: true },
  packBonusPercent: 10,
  firstVoiceIntroIncluded: true,
  preselected: true,
  ...over,
});

const plans = (tiers: unknown[], actions: unknown[] = []) => ({ currency: 'NGN', currencyFixed: false, tiers, actions }) as unknown as PlansView;

describe('VF1 rows come from the preselected tier', () => {
  it('draws the points, the Voice Intro and the event pass the Hub names', () => {
    const rows = bonusRowsOf(plans([tier({ id: 'verify', preselected: false, bonusPoints: 100 }), tier()]));
    expect(rows?.map((r) => r.title)).toEqual(['Up to 600 points', 'Your Voice Intro', 'Maker Pass, priority']);
  });

  it('leaves out a row the tier does not give, and draws nothing when no tier is preselected', () => {
    const rows = bonusRowsOf(plans([tier({ bonusPoints: 0, firstVoiceIntroIncluded: false, eventPass: null })]));
    expect(rows).toEqual([]);
    expect(bonusRowsOf(plans([tier({ preselected: false })]))).toBeNull();
  });

  it('names a tool only when the Hub prices it', () => {
    expect(pointsLine([])).toBe('For AI tools');
    expect(pointsLine([{ id: 'voiceover_per_min', points: 250, per: 'minute' }, { id: 'captions_per_min', points: 15, per: 'minute' }])).toBe('For AI tools like VoiceOver and Captions');
    expect(pointsLine([{ id: 'captions_per_min', points: 15, per: 'minute' }])).toBe('For AI tools like Captions');
  });
});

describe('VF2 shop ready and the draft line', () => {
  it('is 0 with no drafts and follows the most finished draft, never lowered by an empty one', () => {
    expect(shopReady([])).toBe(0);
    expect(shopReady([draft()])).toBe(25);
    const done = draft({ contentType: 'pdf', description: 'Slides', accessType: 'paid', price: 4500 });
    expect(shopReady([done])).toBe(100);
    expect(shopReady([done, draft()])).toBe(100);
    expect(shopReady([draft({ accessType: 'free', contentType: 'video' })])).toBe(75);
    expect(shopReady([draft({ accessType: 'paid', price: null })])).toBe(25);
  });

  it('says no file yet, with the price, "Free" or what is missing', () => {
    expect(draftLine(draft({ accessType: 'paid', price: 4500 }))).toBe('No file yet · ₦4,500');
    expect(draftLine(draft({ accessType: 'free', price: 0 }))).toBe('No file yet · Free');
    expect(draftLine(draft())).toBe('No file yet · No price yet');
  });
});

describe('the draft form', () => {
  it('needs only a title, and sends what was filled in', () => {
    expect(titleProblem('   ')).not.toBeNull();
    expect(createBodyOf({ ...emptyForm, title: '  Deck  ' })).toEqual({ title: 'Deck', accessType: 'paid' });
    expect(createBodyOf({ title: 'Deck', kind: 'pdf', description: ' Slides ', access: 'paid', price: '4500' })).toEqual({
      title: 'Deck',
      contentType: 'pdf',
      description: 'Slides',
      accessType: 'paid',
      price: 4500,
    });
    expect(createBodyOf({ ...emptyForm, title: 'Deck', access: 'free', price: '300' })).toEqual({ title: 'Deck', accessType: 'free', price: 0 });
  });

  it('sends only what changed, and nothing when nothing did', () => {
    const was = formOf(draft({ accessType: 'paid', price: 4500, contentType: 'pdf', description: 'Slides' }));
    expect(changesOf(was, was)).toBeNull();
    expect(changesOf({ ...was, title: 'New name' }, was)).toEqual({ title: 'New name' });
    expect(changesOf({ ...was, price: '5000' }, was)).toEqual({ accessType: 'paid', price: 5000 });
    expect(changesOf({ ...was, access: 'free' }, was)).toEqual({ accessType: 'free', price: 0 });
    expect(changesOf({ ...was, description: '' }, was)).toBeNull();
    expect(changesOf({ ...formOf(draft()) }, formOf(draft()))).toBeNull();
  });

  it('keeps the price to digits', () => {
    expect(cleanPrice('₦ 4,500.50')).toBe('450050');
    expect(cleanPrice('007')).toBe('7');
    expect(cleanPrice('123456789012')).toHaveLength(8);
  });
});
