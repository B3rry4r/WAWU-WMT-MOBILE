import { useState } from 'react';

import { AdSlide } from '@/features/explore/AdSlide';

import type { AdCard } from './api';

export type SponsoredSlotProps = {
  ad: AdCard;
  /** The whole card opens what it is for (its web link, or its event). Never called for a card that does nothing. */
  onOpen: () => void;
  /** The picture is on screen: Today tells the Hub the card was viewed only from here, never for a card whose picture failed (SWEEP-APP row 62/106). */
  onPictureLoad?: () => void;
};

/**
 * H1 and H36 · The ad card on Today, always in TGIF's old place when the Hub serves a campaign (R-59). Since R-92 (owner,
 * 26 Oct 2026: "the home today's strip should be increased to the explore card size") it is the Explore slider's advert slide
 * (`AdSlide`): the same 196 high card at corner 24, the picture under the same fade, the SPONSORED chip top left, the
 * headline and the line under it at the bottom left. The one difference is the campaign's button word on a white pill at the
 * bottom right, which the slider's slide does not draw. The card is dark in both themes (a picture under a shade, white
 * words). Every word but SPONSORED is the advertiser's, from `GET /ads`.
 *
 * What a tap does is the Hub's `ctaDestination` (R-92): a `link` card is one button, the card and its pill alike, which opens
 * the address in the phone's browser; an `event` card opens its event as before; a card that does nothing (`none`) is the same
 * card with no pill and nothing pressable, read by a screen reader as an ad and not as a button. A picture that will not
 * load draws nothing at all, as a campaign without artwork does (SWEEP-APP rows ADS-01 L5, DV2-01 L5), never a card with a
 * bare ground. The board's three dots mean a rotation of adverts; the Hub serves one card for the place, so no dots are drawn (R-47).
 */
export function SponsoredSlot({ ad, onOpen, onPictureLoad }: SponsoredSlotProps) {
  // The address that failed, so a new campaign with a new picture is tried again.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (failedUrl === ad.artworkUrl) return null;
  return <AdSlide testID="today-sponsored" ad={ad} button onOpen={onOpen} onPictureLoad={onPictureLoad} onPictureError={() => setFailedUrl(ad.artworkUrl)} />;
}
