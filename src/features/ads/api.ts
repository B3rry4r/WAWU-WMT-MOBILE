import * as Linking from 'expo-linking';

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

/**
 * What a tap on a card does (R-92: an ad opens the advertiser's web link, or does nothing; ads are not tied to events):
 * - `link`: the card, or its button, opens the address in the phone's browser;
 * - `none`: the card is only shown. Nothing on it is pressable and no button is drawn;
 * - `event`: opens that event. Campaigns saved before R-92 still use it, so it keeps working exactly as it did.
 */
type Wire = components['schemas']['AdCardView'];
/** The words every card has, once `drawable` has checked them. The subline is a string or null, never blank. */
type AdBase = Pick<Wire, 'id' | 'advertiser' | 'headline' | 'artworkUrl'> & { subline: string | null };
/** Each kind with the fields it needs, narrowed from the contract's kinds so a kind the Hub drops from the contract fails to compile here. */
export type AdCard =
  | (AdBase & { ctaDestination: Extract<Wire['ctaDestination'], 'event'>; ctaLabel: string; ctaDestinationId: string })
  | (AdBase & { ctaDestination: Extract<Wire['ctaDestination'], 'link'>; ctaLabel: string; ctaUrl: string })
  | (AdBase & { ctaDestination: Extract<Wire['ctaDestination'], 'none'> });

type Envelope<T> = { statusCode?: number; message?: string; data?: T | null };

export const adKey = (placement: AdPlacement) => ['ads', placement] as const;

const text = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

/** An address the phone's browser may be sent to: https, and a real address (the Hub checks the same, so this is a second lock). */
const webAddress = (value: unknown): value is string => {
  if (!text(value) || !/^https:\/\//i.test(value)) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * A card the app can draw: the words it must show, a picture (an http or https address) and what a tap does, with what that
 * needs (an event to open, an address to open, or nothing at all). Anything else (a destination this build does not know, a
 * link that is not https, a button with no words, a card with no words, a card with no picture) is treated as no card, never
 * drawn half-built. A campaign needs artwork before it is saved (R-59), so a card without a picture is not one the Hub serves;
 * if one ever arrives it is dropped here as well.
 */
export function drawable(value: unknown): AdCard | null {
  if (!value || typeof value !== 'object') return null;
  const card = value as Record<string, unknown>;
  if (!text(card.id) || !text(card.headline)) return null;
  if (typeof card.artworkUrl !== 'string' || !/^https?:\/\//i.test(card.artworkUrl)) return null;
  const base: AdBase = {
    id: card.id,
    // Carried, read by no screen: the chip on every sponsored card is the fixed word SPONSORED, as the canvases draw it, and
    // not "SPONSORED · <advertiser>" (the Hub's own comment in ads-text-limits.ts words it that way). A longer chip would
    // worsen the 320 px break of the Today slot's label. Ruled no (SWEEP-APP row 61, ADS-01 L4, FIX-63).
    advertiser: typeof card.advertiser === 'string' ? card.advertiser : '',
    headline: card.headline,
    subline: text(card.subline) ? card.subline : null,
    artworkUrl: card.artworkUrl,
  };
  if (card.ctaDestination === 'event') {
    if (!text(card.ctaLabel) || !text(card.ctaDestinationId)) return null;
    return { ...base, ctaDestination: 'event', ctaLabel: card.ctaLabel, ctaDestinationId: card.ctaDestinationId };
  }
  if (card.ctaDestination === 'link') {
    if (!text(card.ctaLabel) || !webAddress(card.ctaUrl)) return null;
    return { ...base, ctaDestination: 'link', ctaLabel: card.ctaLabel, ctaUrl: card.ctaUrl };
  }
  if (card.ctaDestination === 'none') return { ...base, ctaDestination: 'none' };
  return null;
}

/** Whether a tap on the card does anything. A card that does nothing is drawn with no button and nothing pressable. */
export const adOpensSomething = (ad: AdCard): boolean => ad.ctaDestination !== 'none';

/**
 * What a tap on the card does: `link` sends the phone's browser to the address (expo-linking; a browser that cannot be reached
 * is a tap that does nothing, never an error on screen), `event` hands the event's id to the screen's own way of opening one,
 * and `none` does nothing at all.
 */
export function openAd(ad: AdCard, openEvent: (eventId: string) => void): void {
  if (ad.ctaDestination === 'event') openEvent(ad.ctaDestinationId);
  else if (ad.ctaDestination === 'link') void Linking.openURL(ad.ctaUrl).catch(() => undefined);
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
