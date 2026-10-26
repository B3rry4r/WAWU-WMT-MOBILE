import { drawable } from '../api';
import served from './fixtures/served-shapes.json';

/**
 * The ads reader a build already on phones carries: `drawable` copied word for word from the app at origin/main
 * `e816022d` (src/features/ads/api.ts, the last version before ADS-LINK), generated from that file, not written by hand.
 * It draws a card only when it has a button word, an event id and `ctaDestination === 'event'`; anything else is no card.
 * `MainCard` is main's `AdCardView` as the contract typed it then.
 */
export type MainCard = {
  id: string;
  advertiser: string;
  headline: string;
  subline: string | null;
  ctaLabel: string;
  ctaDestination: 'event';
  ctaDestinationId: string;
  artworkUrl: string;
};

const text = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

/**
 * A card the app can draw: the words it must show, a picture (an http or https address) and an event to open.
 * Anything else (a destination this build does not know, a card with no words, a card with no picture) is treated
 * as no card, never drawn half-built. A campaign needs artwork before it is saved (R-59), so a card without a
 * picture is not one the Hub serves; if one ever arrives it is dropped here as well.
 */
export function mainDrawable(value: unknown): MainCard | null {
  if (!value || typeof value !== 'object') return null;
  const card = value as Partial<MainCard>;
  if (!text(card.id) || !text(card.headline) || !text(card.ctaLabel) || !text(card.ctaDestinationId)) return null;
  if (card.ctaDestination !== 'event') return null;
  if (typeof card.artworkUrl !== 'string' || !/^https?:\/\//i.test(card.artworkUrl)) return null;
  return {
    id: card.id,
    // Carried, read by no screen: the chip on every sponsored card is the fixed word SPONSORED, as the canvases draw it, and
    // not "SPONSORED · <advertiser>" (the Hub's own comment in ads-text-limits.ts words it that way). A longer chip would
    // worsen the 320 px break of the Today slot's label. Ruled no (SWEEP-APP row 61, ADS-01 L4, FIX-63).
    advertiser: typeof card.advertiser === 'string' ? card.advertiser : '',
    headline: card.headline,
    subline: text(card.subline) ? card.subline : null,
    ctaLabel: card.ctaLabel,
    ctaDestination: 'event',
    ctaDestinationId: card.ctaDestinationId,
    artworkUrl: card.artworkUrl,
  };
}

/** `fetchAdList` of main, with the network call taken out: the same reading of `data`. */
export function mainReadList(data: unknown): MainCard[] {
  if (!Array.isArray(data)) return [];
  return data.map(mainDrawable).filter((card): card is MainCard => card !== null);
}

/**
 * ADS-LINK round 2 (R-92) · an ad has two shapes: a landscape picture for Explore and Today, a portrait one for TGIF.
 *
 * `fixtures/served-shapes.json` is what the Hub really answered on the local stack for `GET /ads` in the three places,
 * with the ads booked from the dashboard's own form (a landscape-only ad, a portrait-only ad, two ads with both shapes,
 * and an event ad with both), captured by the task's end-to-end run and not written by hand. The app changes nothing for
 * the two shapes: each place draws the picture the Hub serves for it, and a build already on phones, which carries
 * `mainDrawable` above, keeps drawing exactly what it drew.
 */
type Card = Record<string, unknown> & { id: string; artworkUrl: string; ctaDestination: string };
type Answer = { explore: Card[]; today: Card | null; tgif: Card | null };
const phases = served.phases as unknown as Record<string, Answer>;
const ids = served.ids;
const everyCard = (): { phase: string; place: string; card: Card }[] =>
  Object.entries(phases).flatMap(([phase, answer]) => [
    ...answer.explore.map((card) => ({ phase, place: 'explore_slider', card })),
    ...(answer.today ? [{ phase, place: 'today_slot', card: answer.today }] : []),
    ...(answer.tgif ? [{ phase, place: 'tgif_card', card: answer.tgif }] : []),
  ]);

/** The keys each kind of card has always carried: nothing was added to the wire for the two shapes. */
const KEYS: Record<string, string[]> = {
  event: ['advertiser', 'artworkUrl', 'ctaDestination', 'ctaDestinationId', 'ctaLabel', 'headline', 'id', 'subline'],
  link: ['advertiser', 'artworkUrl', 'ctaDestination', 'ctaLabel', 'ctaUrl', 'headline', 'id', 'subline'],
  none: ['advertiser', 'artworkUrl', 'ctaDestination', 'headline', 'id', 'subline'],
};

describe('the places serve the picture of their shape (real answers from the Hub)', () => {
  it('a landscape-only ad is in Explore and Today and not in TGIF; a portrait-only ad is in TGIF and not in Explore or Today', () => {
    const live = phases.allFourOnAir;
    expect(live.explore.map((c) => c.id)).toEqual([ids.landscapeOnly, ids.bothLink, ids.bothNone]);
    expect(live.today?.id).toBe(ids.landscapeOnly);
    expect(live.tgif?.id).toBe(ids.portraitOnly);
    expect(live.explore.some((c) => c.id === ids.portraitOnly)).toBe(false);
  });

  it('an ad with both shapes is in all three places, with a different picture for TGIF than for Explore and Today', () => {
    const both = phases.bothOnly;
    expect(both.explore.map((c) => c.id)).toEqual([ids.bothLink, ids.bothNone]);
    expect(both.today?.id).toBe(ids.bothLink);
    expect(both.tgif?.id).toBe(ids.bothLink);
    expect(both.explore[0].artworkUrl).toBe(both.today?.artworkUrl);
    expect(both.tgif?.artworkUrl).not.toBe(both.today?.artworkUrl);
    const none = phases.noLinkOnly;
    expect([none.explore[0]?.id, none.today?.id, none.tgif?.id]).toEqual([ids.bothNone, ids.bothNone, ids.bothNone]);
    expect(none.tgif?.artworkUrl).not.toBe(none.today?.artworkUrl);
  });

  it('every card of every place has exactly the keys its kind always had', () => {
    for (const { phase, place, card } of everyCard()) {
      expect([phase, place, Object.keys(card).sort()]).toEqual([phase, place, KEYS[card.ctaDestination]]);
    }
  });

  it('this build draws every one of them, with the address the Hub served as its picture', () => {
    const cards = everyCard();
    expect(cards.length).toBeGreaterThan(10);
    for (const { phase, place, card } of cards) {
      const drawn = drawable(card);
      expect([phase, place, drawn?.ctaDestination]).toEqual([phase, place, card.ctaDestination]);
      expect(drawn?.artworkUrl).toBe(card.artworkUrl);
    }
  });

  it('a link card carries its address and a card that does nothing carries no button, in every place', () => {
    for (const { card } of everyCard()) {
      const drawn = drawable(card);
      if (card.ctaDestination === 'link') expect(drawn).toMatchObject({ ctaDestination: 'link', ctaUrl: expect.stringMatching(/^https:\/\//) });
      if (card.ctaDestination === 'none') expect(drawn && 'ctaLabel' in drawn).toBe(false);
    }
  });
});

describe('a build already on phones (main\'s reader) meets the same answers', () => {
  it('draws the event ad of both shapes in every place, as it always drew an event ad, with the picture of its place', () => {
    const answer = phases.eventWithBothShapes;
    const eventCard = answer.explore.find((c) => c.ctaDestination === 'event') as Card;
    for (const [place, card] of [
      ['explore_slider', eventCard],
      ['today_slot', answer.today as Card],
      ['tgif_card', answer.tgif as Card],
    ] as const) {
      expect([place, mainDrawable(card)?.ctaDestinationId]).toEqual([place, eventCard.ctaDestinationId]);
      expect(mainDrawable(card)?.artworkUrl).toBe(card.artworkUrl);
    }
    expect(answer.today?.artworkUrl).not.toBe(answer.tgif?.artworkUrl);
  });

  it('draws no card for a link or a no-link ad, in any place, and never throws', () => {
    for (const { place, card } of everyCard()) {
      expect(() => mainDrawable(card)).not.toThrow();
      if (card.ctaDestination !== 'event') expect([place, mainDrawable(card)]).toEqual([place, null]);
    }
  });

  it('reads each Explore list as the event cards in it, and a list with none as an empty list', () => {
    for (const answer of Object.values(phases)) {
      expect(mainReadList(answer.explore).map((c) => c.id)).toEqual(
        answer.explore.filter((c) => c.ctaDestination === 'event').map((c) => c.id),
      );
    }
    expect(mainReadList(phases.noLinkOnly.explore)).toEqual([]);
  });
});
