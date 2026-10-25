import { ApiError } from '@/api/errors';
import { voiceClock } from '@/components/VoicePlayer';

import type { MyTier } from '@/features/me/api';
import type { VoiceIntro } from './voiceApi';

/**
 * VF8's route (Your voice, your consent), where "Hear it in my voice" leads for a person with a running tier. VERIFY-03 builds it:
 * the one route holds the whole recording flow (VF8 consent, VF9 record, VF10 making, VF11 hear yourself), one stage at a time.
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
    // A points refusal on a try (no points to spend, the day's cap): the Hub's own sentence, and nothing was taken.
    if ((error.code === 'insufficient_points' || error.code === 'points_cap_reached') && error.message) return error.message;
    if (error.code === 'upload_failed' && error.message) return error.message;
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

/** The shortest and longest recording, in seconds, as the Hub serves them (`sample.minSeconds`, `sample.maxSeconds`, two plan settings). */
export type TakeBounds = { min: number; max: number };

/**
 * What VF8 to VF9 need from the Hub's view: the consent line exactly as served and the recording's shortest and longest seconds. A view
 * without them (or with a shortest above the longest) is not drawn: no screen holds a consent text or a length of its own.
 */
export function recordingTerms(view: Pick<VoiceIntro, 'consent' | 'sample'>): { line: string; bounds: TakeBounds } | null {
  const line = view.consent?.line;
  const min = view.sample?.minSeconds;
  const max = view.sample?.maxSeconds;
  const positive = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;
  if (typeof line !== 'string' || line.trim() === '' || !positive(min) || !positive(max) || min > max) return null;
  return { line, bounds: { min, max } };
}

/** "0:14": the clock VF9 draws in the ring. */
export const takeClock = voiceClock;

/** How much of the ring a take fills, 0 to 1. */
export function takeShare(seconds: number, max: number): number {
  if (!Number.isFinite(seconds) || seconds <= 0 || max <= 0) return 0;
  return Math.min(1, seconds / max);
}

/** A take shorter than the Hub's shortest is refused with the reason (VF9b); any other is kept (VF9c). */
export function takeVerdict(seconds: number, min: number): 'short' | 'done' {
  return Math.floor(seconds) < min ? 'short' : 'done';
}

/** The file's kind from where the phone (or the browser) wrote it: the phone writes `.m4a`, the Hub takes `audio/mp4`. */
export function sampleFileOf(uri: string): { contentType: string; extension: string } {
  const ext = (/\.([a-z0-9]{1,5})(?:\?.*)?$/i.exec(uri)?.[1] ?? 'm4a').toLowerCase();
  if (ext === 'm4a' || ext === 'mp4') return { contentType: 'audio/mp4', extension: 'm4a' };
  if (ext === 'aac') return { contentType: 'audio/aac', extension: 'aac' };
  if (ext === 'mp3') return { contentType: 'audio/mpeg', extension: 'mp3' };
  if (ext === 'wav') return { contentType: 'audio/wav', extension: 'wav' };
  if (ext === 'webm') return { contentType: 'audio/webm', extension: 'webm' };
  return { contentType: 'audio/mp4', extension: 'm4a' };
}

/** VF9's script: the consent line exactly as the Hub served it (`consent.line`), then the Voice Intro's words, read aloud as one. */
export function scriptFor(consentLine: string, words: string | null | undefined): string {
  return [consentLine.trim(), (words ?? '').trim()].filter(Boolean).join(' ');
}

export type FlowStage = 'consent' | 'record' | 'making' | 'hear';

/** Where the flow opens: a try the Hub is still making goes straight to VF10; anything else starts at VF8. */
export function openingStage(intro: Pick<VoiceIntro, 'run'>): FlowStage {
  return intro.run?.state === 'working' ? 'making' : 'consent';
}

/** What the Hub's answer to a poll means for VF10: still making, made (with the audio to play), or failed (with its own words). */
export type MakingResult = { kind: 'working' } | { kind: 'done'; audioUrl: string } | { kind: 'failed'; message: string | null };

export function makingResult(intro: Pick<VoiceIntro, 'run' | 'audioUrl'>): MakingResult {
  const run = intro.run;
  if (!run || run.state === 'working') return { kind: 'working' };
  if (run.state === 'failed') return { kind: 'failed', message: run.message ?? null };
  return intro.audioUrl ? { kind: 'done', audioUrl: intro.audioUrl } : { kind: 'working' };
}

/** What VF10a says under its title when the Hub gave no words of its own (the Hub's try always carries them). */
export const FAILED_FALLBACK = 'Try again.';

/**
 * What VF10a says under its title: the Hub's own sentence without its opening "That didn't work." (the title, "We couldn't make your
 * intro", already says it; the board's line is "No points were taken. Try again."). Any other sentence is the Hub's and stays whole.
 */
export function failedLineOf(message: string | null | undefined): string {
  const kept = (message ?? '').trim().replace(/^that didn['\u2019]t work\.\s*/i, '').trim();
  return kept === '' ? FAILED_FALLBACK : kept;
}
