import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * The tier offer's two calls (TIER-OFFER, R-94), as the Hub's contract types them:
 * - `GET /me/tier-offer`: whether the full-screen offer is to be drawn for this person now (any account type holding no running tier;
 *   every start while the admin setting `tier_offer.every_start_on` is on, once per person when off, R-105), and whether it has the close X
 *   (`closeButton`) or a "Not now" button, which is an admin setting;
 * - `POST /me/tier-offer/seen`: the offer was drawn; with the every-start setting off the Hub does not offer it again, on any phone.
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data` (SHARED-CHANGES.md row 11).
 */
export type TierOffer = components['schemas']['TierOfferView'];

type Envelope<T> = { data?: T | null };

export async function fetchTierOffer(): Promise<TierOffer> {
  const body = (await unwrap(api.GET('/api/hub/me/tier-offer'))) as unknown as Envelope<TierOffer>;
  const offer = body?.data;
  if (!offer || typeof offer.show !== 'boolean' || typeof offer.closeButton !== 'boolean') {
    throw new ApiError('unknown', 200, 'The tier offer could not be read.');
  }
  return offer;
}

export async function markTierOfferSeen(): Promise<void> {
  await unwrap(api.POST('/api/hub/me/tier-offer/seen'));
}
