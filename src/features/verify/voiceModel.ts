import { ApiError } from '@/api/errors';

import type { MyTier } from '@/features/me/api';

/**
 * VF8's route (Your voice, your consent), where "Hear it in my voice" leads for a person with a running tier. VERIFY-03 builds the
 * screen and registers this route name; VERIFY-02 reaches it only by name, and merges into main together with VERIFY-03 so no tap
 * leads to a screen that is not there (owner rule, 9 Oct).
 */
export const VOICE_CONSENT_ROUTE = '/voice-consent';
/** VF5, Make it official. */
export const TIERS_ROUTE = '/tiers';
/** VF14, Your tier (where an ended tier is renewed). */
export const YOUR_TIER_ROUTE = '/your-tier';

/** Where "Hear it in my voice" goes: no tier to VF5, an ended one to Your tier (VF14b, as Publish does), a running one on to VF8. */
export function hearInMyVoiceRoute(tier: Pick<MyTier, 'state'>): string {
  if (tier.state === 'none') return TIERS_ROUTE;
  if (tier.state === 'ended') return YOUR_TIER_ROUTE;
  return VOICE_CONSENT_ROUTE;
}

/** How many characters the Hub counts in the words: what is left after trimming, one for each letter as a person sees it (the Hub's `Array.from`). */
export function introLength(text: string): number {
  return Array.from(text.trim()).length;
}

export type IntroState = {
  count: number;
  /** More than the Hub's limit: the words are red, the message says so and the button is off. */
  tooLong: boolean;
  /** Nothing written yet: the button is off. */
  empty: boolean;
  /** The words can be kept and sent on. */
  ready: boolean;
};

/** VF4, VF4a and VF4b from the words and the Hub's limit. */
export function introState(text: string, limit: number): IntroState {
  const count = introLength(text);
  const tooLong = count > limit;
  const empty = count === 0;
  return { count, tooLong, empty, ready: !empty && !tooLong };
}

/** The line VF4a draws in the empty box ("Hi, I'm Lennox. I help…"): the person's own first name, or none when the profile has none. */
export function introPlaceholder(firstName: string | null | undefined): string {
  const name = (firstName ?? '').trim();
  return name ? `Hi, I'm ${name}. I help…` : 'Hi, I help…';
}

/** What VF4 says under the box over the limit. The limit is the Hub's, shown in the counter beside it; no length in seconds is claimed. */
export const TOO_LONG_LINE = 'Too long for a Voice Intro. Cut a sentence.';

const GENERIC = 'Something went wrong. Try again.';

/**
 * A failed voice call in the words the person reads. The Hub's own voice refusals (`voice_*`) are plain sentences that name no provider
 * and take no points, so they are shown as sent; a lost connection and anything else get the app's own line.
 */
export function voiceFailure(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code?.startsWith('voice_') && error.message) return error.message;
    if (error.kind === 'network') return error.message;
    // The Hub's general throttle (not the hourly limit on previews, which has its own `voice_` answer): too many calls in a short time.
    if (error.kind === 'rate_limited') return 'Too many tries. Wait a moment and try again.';
  }
  return GENERIC;
}

/** Voices are off on the Hub (`503 voice_unavailable`, or `available: false`): the screen says so instead of offering a play button. */
export function voicesUnavailable(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'voice_unavailable';
}
