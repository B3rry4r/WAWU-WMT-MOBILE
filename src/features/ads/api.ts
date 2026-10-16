import { api, unwrap } from '@/api/client';
import type { components } from '@/api/schema.generated';

/**
 * The sponsored card's two calls (ADS-04 and ADS-05), as the Hub's contract types them:
 * - `GET /ads?placement=`: the one live card for a place, or `data: null` when nothing is on
 *   (the app then draws nothing, not an empty frame);
 * - `POST /ads/{id}/events`: this person viewed, tapped or skipped the card. The Hub counts each
 *   kind once per person, campaign and UTC day, so a repeat is safe and changes nothing.
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data`
 * (SHARED-CHANGES.md row 11), so each call reads `data` itself.
 */
export type AdPlacement = 'tgif_card' | 'today_slot';
export type AdEventKind = 'view' | 'tap' | 'skip';

/** What `GET /ads` serves for a card, once it has been checked to be drawable. */
export type AdCard = components['schemas']['AdCardView'];

type Envelope<T> = { statusCode?: number; message?: string; data?: T | null };

export const adKey = (placement: AdPlacement) => ['ads', placement] as const;

const text = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

/**
 * A card the app can draw: the words it must show and an event to open. Anything else (a destination this
 * build does not know, a card with no words) is treated as no card, never drawn half-built.
 */
export function drawable(value: unknown): AdCard | null {
  if (!value || typeof value !== 'object') return null;
  const card = value as Partial<AdCard>;
  if (!text(card.id) || !text(card.headline) || !text(card.ctaLabel) || !text(card.ctaDestinationId)) return null;
  if (card.ctaDestination !== 'event') return null;
  return {
    id: card.id,
    advertiser: typeof card.advertiser === 'string' ? card.advertiser : '',
    headline: card.headline,
    subline: text(card.subline) ? card.subline : null,
    ctaLabel: card.ctaLabel,
    ctaDestination: 'event',
    ctaDestinationId: card.ctaDestinationId,
    artworkUrl: typeof card.artworkUrl === 'string' && /^https?:\/\//i.test(card.artworkUrl) ? card.artworkUrl : null,
  };
}

/** The live card for a place; `null` when there is none (a 200 with `data: null`) or it cannot be drawn. */
export async function fetchAd(placement: AdPlacement): Promise<AdCard | null> {
  const body = (await unwrap(api.GET('/api/hub/ads', { params: { query: { placement } } }))) as unknown as Envelope<AdCard>;
  return drawable(body?.data);
}

/** Tells the Hub this person viewed, tapped or skipped the card. */
export async function reportAd(id: string, type: AdEventKind): Promise<void> {
  await unwrap(api.POST('/api/hub/ads/{id}/events', { params: { path: { id } }, body: { type } }));
}
