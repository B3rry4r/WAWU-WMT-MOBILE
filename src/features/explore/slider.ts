import type { AdCard } from '@/features/ads/api';
import type { EventView } from '@/features/events/api';

/**
 * One slide of the Explore slider (X1, X16, X17): an advert or a featured event.
 * The key is stable across reads so a slide that is still there keeps its place.
 */
export type Slide = { kind: 'ad'; key: string; ad: AdCard } | { kind: 'event'; key: string; event: EventView };

/**
 * The slides in the order a person meets them (R-59, "take turns"): an advert first, then an event, then an advert, and so
 * on, each list in the order the Hub served it. When one list runs out the other carries on alone, so with no event running
 * the slider is adverts only (X17), with no advert it is events only, and with neither there is no slide and no slider.
 */
export function sliderSlides(ads: readonly AdCard[], events: readonly EventView[]): Slide[] {
  const slides: Slide[] = [];
  const turns = Math.max(ads.length, events.length);
  for (let i = 0; i < turns; i += 1) {
    const ad = ads[i];
    if (ad) slides.push({ kind: 'ad', key: `ad-${ad.id}`, ad });
    const event = events[i];
    if (event) slides.push({ kind: 'event', key: `event-${event.id}`, event });
  }
  return slides;
}
