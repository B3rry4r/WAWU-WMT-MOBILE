import { drawable } from '../api';
import served from './fixtures/served-ads.json';

/**
 * ADS-LINK (R-92) · builds already on phones must not crash on the new kinds of card.
 *
 * `oldDrawable` and `oldFetchAdList` are the reader those builds carry, copied word for word from the app at origin/main
 * `e816022d` (src/features/ads/api.ts, before this task): a card is drawn only when it has a button word, an event id and
 * `ctaDestination === 'event'`; anything else is treated as no card. `fixtures/served-ads.json` is what the Hub really
 * answered on the local stack for `GET /ads` (one `event` card, one `link` card, one card that does nothing), captured by
 * the task's end-to-end run and not written by hand. The old reader drops the two new kinds and draws the event card
 * exactly as before, and never throws on any of the three.
 */
const text = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

type OldCard = {
  id: string;
  advertiser: string;
  headline: string;
  subline: string | null;
  ctaLabel: string;
  ctaDestination: 'event';
  ctaDestinationId: string;
  artworkUrl: string;
};

function oldDrawable(value: unknown): OldCard | null {
  if (!value || typeof value !== 'object') return null;
  const card = value as Partial<OldCard>;
  if (!text(card.id) || !text(card.headline) || !text(card.ctaLabel) || !text(card.ctaDestinationId)) return null;
  if (card.ctaDestination !== 'event') return null;
  if (typeof card.artworkUrl !== 'string' || !/^https?:\/\//i.test(card.artworkUrl)) return null;
  return {
    id: card.id,
    advertiser: typeof card.advertiser === 'string' ? card.advertiser : '',
    headline: card.headline,
    subline: text(card.subline) ? card.subline : null,
    ctaLabel: card.ctaLabel,
    ctaDestination: 'event',
    ctaDestinationId: card.ctaDestinationId,
    artworkUrl: card.artworkUrl,
  };
}

function oldFetchAdList(data: unknown): OldCard[] {
  if (!Array.isArray(data)) return [];
  return data.map(oldDrawable).filter((card): card is OldCard => card !== null);
}

const byKind = (kind: string) => served.cards.find((card) => card.ctaDestination === kind);

describe('the reader on phones today meets the Hub that serves link and none', () => {
  it('the fixture is a real answer: one card of each kind, each with the fields its kind carries', () => {
    expect(served.cards.map((card) => card.ctaDestination).sort()).toEqual(['event', 'link', 'none']);
    expect(Object.keys(byKind('event') ?? {}).sort()).toEqual(['advertiser', 'artworkUrl', 'ctaDestination', 'ctaDestinationId', 'ctaLabel', 'headline', 'id', 'subline']);
    expect(Object.keys(byKind('link') ?? {}).sort()).toEqual(['advertiser', 'artworkUrl', 'ctaDestination', 'ctaLabel', 'ctaUrl', 'headline', 'id', 'subline']);
    expect(Object.keys(byKind('none') ?? {}).sort()).toEqual(['advertiser', 'artworkUrl', 'ctaDestination', 'headline', 'id', 'subline']);
  });

  it('draws an event card exactly as before', () => {
    expect(oldDrawable(byKind('event'))).toEqual(byKind('event'));
  });

  it.each(['link', 'none'])('treats a %s card as no card, without throwing', (kind) => {
    expect(() => oldDrawable(byKind(kind))).not.toThrow();
    expect(oldDrawable(byKind(kind))).toBeNull();
  });

  it('the Explore list keeps only the event card; a list of only new kinds is an empty list, not an error', () => {
    expect(oldFetchAdList(served.cards).map((card) => card.id)).toEqual([byKind('event')?.id]);
    expect(oldFetchAdList(served.cards.filter((card) => card.ctaDestination !== 'event'))).toEqual([]);
    expect(oldFetchAdList(null)).toEqual([]);
  });

  it('a placement answered with a single new-kind card is no card', () => {
    expect(oldDrawable(served.single.link)).toBeNull();
    expect(oldDrawable(served.single.none)).toBeNull();
  });

  it('and the build with this task draws all three of the same real answers', () => {
    expect(served.cards.map((card) => drawable(card)?.ctaDestination)).toEqual(['link', 'none', 'event']);
    expect(drawable(served.single.link)?.ctaDestination).toBe('link');
    expect(drawable(served.single.none)?.ctaDestination).toBe('none');
  });
});
