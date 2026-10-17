import { api, unwrap } from '@/api/client';
import type { components } from '@/api/schema.generated';

/**
 * The sponsored card's two calls (ADS-04 and ADS-05), as the Hub's contract types them:
 * - `GET /ads?placement=`: the one live card for a place, or `data: null` when nothing is on
 *   (the app then draws nothing, not an empty frame); the Explore slider's place answers a list (`fetchAdList`);
 * - `POST /ads/{id}/events`: this person viewed, tapped or skipped the card. The Hub counts each
 *   kind once per person, campaign and UTC day, so a repeat is safe and changes nothing.
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data`
 * (SHARED-CHANGES.md row 11), so each call reads `data` itself.
 */
export type AdPlacement = 'tgif_card' | 'today_slot';
/** The place that serves a list of cards, not one (ADS-07). */
export type AdListPlacement = 'explore_slider';
export type AdEventKind = 'view' | 'tap' | 'skip';

/** What `GET /ads` serves for a card, once it has been checked to be drawable. */
export type AdCard = components['schemas']['AdCardView'];

type Envelope<T> = { statusCode?: number; message?: string; data?: T | null };

export const adKey = (placement: AdPlacement) => ['ads', placement] as const;

const text = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

/**
 * A card the app can draw: the words it must show, a picture (an http or https address) and an event to open.
 * Anything else (a destination this build does not know, a card with no words, a card with no picture) is treated
 * as no card, never drawn half-built. A campaign needs artwork before it is saved (R-59), so a card without a
 * picture is not one the Hub serves; if one ever arrives it is dropped here as well.
 */
export function drawable(value: unknown): AdCard | null {
  if (!value || typeof value !== 'object') return null;
  const card = value as Partial<AdCard>;
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

/** The live card for a place; `null` when there is none (a 200 with `data: null`) or it cannot be drawn. */
export async function fetchAd(placement: AdPlacement): Promise<AdCard | null> {
  const body = (await unwrap(api.GET('/api/hub/ads', { params: { query: { placement } } }))) as unknown as Envelope<AdCard>;
  return drawable(body?.data);
}

/**
 * The Explore slider's adverts (ADS-07): `GET /ads?placement=explore_slider` answers a list, heaviest first, `[]` when none
 * is on. Every entry is checked the same way a single card is; one that cannot be drawn is dropped, never half drawn.
 */
export const adListKey = (placement: AdListPlacement) => ['ads', placement, 'list'] as const;

export async function fetchAdList(placement: AdListPlacement): Promise<AdCard[]> {
  const body = (await unwrap(api.GET('/api/hub/ads', { params: { query: { placement } } }))) as unknown as Envelope<unknown>;
  if (!Array.isArray(body?.data)) return [];
  return body.data.map(drawable).filter((card): card is AdCard => card !== null);
}

/** Tells the Hub this person viewed, tapped or skipped the card. */
export async function reportAd(id: string, type: AdEventKind): Promise<void> {
  await unwrap(api.POST('/api/hub/ads/{id}/events', { params: { path: { id } }, body: { type } }));
}
