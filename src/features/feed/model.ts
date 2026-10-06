import { hues, type AvatarHue } from '@/components/Avatar';
import type { IconName } from '@/components/icon';

import type { ContentDetail, FeedCreator, FeedEntry, FeedItem } from './api';

/**
 * What the feed decides from the Hub's data, kept apart from the drawing so each rule is
 * tested on its own. Every figure here is read from a field the Hub serves; nothing is
 * made up when a field is missing (the element around it stays, the figure is left out).
 */

/** The four post layouts this task draws: H2 and H5 (video), H3, H4 and H6. */
export type PostKind = 'video' | 'photos' | 'pdf' | 'audio';

const kindByType: Partial<Record<FeedItem['contentType'], PostKind>> = {
  video: 'video',
  image: 'photos',
  pdf: 'pdf',
  audio: 'audio',
};

/**
 * The layout a piece takes, or null for one this task does not draw: a course (H7) or a
 * template (H8) post is HOME-07's, as are the creator (H9) and professional (H10) cards.
 */
export function postKind(item: Pick<FeedItem, 'contentType'>): PostKind | null {
  return kindByType[item.contentType] ?? null;
}

/** The posts of a page this task draws, in the Hub's order. */
export function drawablePosts(entries: readonly FeedEntry[]): FeedItem[] {
  const posts: FeedItem[] = [];
  for (const entry of entries) {
    if (entry.kind === 'content' && postKind(entry.content)) posts.push(entry.content);
  }
  return posts;
}

/** Paid and not yet bought (or not the viewer's own): the full file is held back. */
export function isLocked(item: Pick<FeedItem, 'accessType' | 'fullAssetLocked'>): boolean {
  return item.accessType === 'paid' && item.fullAssetLocked;
}

/** The file to play or read: the full one when the viewer may have it, else the public preview. */
export function playableUrl(item: Pick<FeedItem, 'fullAssetLocked' | 'fullAssetUrl' | 'previewAssetUrl'>): string {
  return !item.fullAssetLocked && item.fullAssetUrl ? item.fullAssetUrl : item.previewAssetUrl;
}

const THOUSAND = 1000;
const MILLION = 1000000;

function shortNumber(value: number, unit: number, suffix: string): string {
  const scaled = Math.floor((value / unit) * 10) / 10;
  return `${Number.isInteger(scaled) ? scaled.toFixed(0) : scaled.toFixed(1)}${suffix}`;
}

/** The rail's counts as the canvas writes them: 340, 1.1K, 12.4K, 21K, 1.2M (rounded down). */
export function compactCount(count: number): string {
  const n = Math.max(0, Math.floor(count));
  if (n >= MILLION) return shortNumber(n, MILLION, 'M');
  if (n >= THOUSAND) return shortNumber(n, THOUSAND, 'K');
  return String(n);
}

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

/** Seconds in a `4:12` or `1:20:05` label (HOME-05's format); null for anything else. */
export function durationSeconds(label: string | null | undefined): number | null {
  if (!label) return null;
  const match = /^(?:(\d+):)?(\d{1,2}):(\d{2})$/.exec(label.trim());
  if (!match) return null;
  const [, h, m, s] = match;
  return Number(h ?? 0) * SECONDS_PER_HOUR + Number(m) * SECONDS_PER_MINUTE + Number(s);
}

/** A player clock: 0:42, 1:50, 1:02:03. */
export function clock(seconds: number): string {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const h = Math.floor(total / SECONDS_PER_HOUR);
  const m = Math.floor((total % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const s = String(total % SECONDS_PER_MINUTE).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/**
 * Below this a length is written as a clock ("Video · 1:50", H2); from it, in whole
 * minutes ("Locked · 18 min", H5; "Audio · 12 min", H6). The canvas's three samples fit
 * this cut. Default (agent), owner may override.
 */
export const MINUTES_FROM_SECONDS = 600;

/** A piece's length for its pill and offer bar. A label in an older free-text form is shown as stored. */
export function durationText(label: string | null | undefined): string | null {
  if (!label) return null;
  const seconds = durationSeconds(label);
  if (seconds === null) return label.trim() || null;
  if (seconds < MINUTES_FROM_SECONDS) return clock(seconds);
  return `${Math.round(seconds / SECONDS_PER_MINUTE)} min`;
}

/** "18-minute", for H5's "The full 18-minute video is one tap away." Null when the length is unknown. */
export function minutesAdjective(label: string | null | undefined): string | null {
  const seconds = durationSeconds(label);
  if (seconds === null || seconds < SECONDS_PER_MINUTE) return null;
  return `${Math.round(seconds / SECONDS_PER_MINUTE)}-minute`;
}

/** The name on a post: the person's name from WAWU ID, else their handle. */
export function creatorName(creator: FeedCreator | null | undefined): string | null {
  if (!creator) return null;
  return creator.displayName?.trim() || creator.handle?.trim() || null;
}

/** Which tick follows the name: a creator tick (purple), else a professional tick (blue). */
export function tickKind(creator: FeedCreator | null | undefined): 'creator' | 'pro' | null {
  if (creator?.verification?.creator?.verified) return 'creator';
  if (creator?.verification?.professional?.verified) return 'pro';
  return null;
}

/** The words under the name: the creator's description of the post, or its title when there is none. */
export function caption(item: Pick<FeedItem, 'description' | 'title'>): string {
  return item.description.trim() || item.title.trim();
}

const join = (parts: (string | null | undefined)[]) => parts.filter(Boolean).join(' · ');

/** The pill above the name: what the post is and how long or how big it is. */
export function pillFor(item: FeedItem, kind: PostKind): { icon: IconName; text: string } {
  const length = durationText(item.media?.durationLabel ?? item.durationLabel);
  const pages = item.media?.pageCount ?? item.pageCount;
  const frames = item.media?.frameCount;
  switch (kind) {
    case 'video':
      return isLocked(item)
        ? { icon: 'Lock', text: join(['Locked', length]) }
        : { icon: 'Play', text: join(['Video', length]) };
    case 'audio':
      return isLocked(item)
        ? { icon: 'Lock', text: join(['Locked', length]) }
        : { icon: 'AudioLines', text: join(['Audio', length]) };
    case 'photos':
      return { icon: 'Images', text: join(['Photo set', frames ? String(frames) : null]) };
    case 'pdf':
      return { icon: 'BookOpen', text: join(['PDF', pages ? `${pages} pages` : null]) };
  }
}

export type Offer = { icon: IconName; title: string; subtitle: string };

/**
 * The offer bar under a locked post (H3, H4, H5): what unlocking gives and how it is paid
 * for. Only a locked piece has one. The price beside it is the piece's own price. The bar
 * offers the piece itself: a free post linked to a separate paid piece (H3's "Golden Hour
 * presets") is not served (BACKEND_GAPS G-204).
 */
export function offerFor(item: FeedItem, kind: PostKind): Offer | null {
  if (!isLocked(item)) return null;
  const length = durationText(item.media?.durationLabel ?? item.durationLabel);
  const pages = item.media?.pageCount ?? item.pageCount;
  const frames = item.media?.frameCount;
  const pay = 'Pay from wallet';
  switch (kind) {
    case 'video':
      return { icon: 'Lock', title: 'Unlock the full video', subtitle: join([length, pay]) };
    case 'audio':
      return { icon: 'Lock', title: 'Unlock the full audio', subtitle: join([length, pay]) };
    case 'pdf':
      return { icon: 'BookOpen', title: 'Read the full PDF', subtitle: join([pages ? `${pages} pages` : null, pay]) };
    case 'photos':
      return { icon: 'Images', title: 'Unlock the full set', subtitle: join([frames ? `${frames} photos` : null, pay]) };
  }
}

/**
 * H4's reading bar: how many pages are free (the creator's declared preview, HOME-06) and
 * the free stretch as a share of the whole PDF. Null when the creator declared none.
 */
export function freePages(
  detail: Pick<ContentDetail, 'freePreview'> | null | undefined,
  pageCount: number | null | undefined,
): { label: string; fraction: number | null } | null {
  const pages = detail?.freePreview?.pages;
  if (!pages || pages <= 0) return null;
  const label = `${pages} ${pages === 1 ? 'page' : 'pages'} free`;
  const fraction = pageCount && pageCount > 0 ? Math.min(1, pages / pageCount) : null;
  return { label, fraction };
}

/** Where a press on a track lands, as a share of its length (0 to 1). */
export function shareAt(x: number, width: number): number {
  if (!(width > 0)) return 0;
  return Math.min(1, Math.max(0, x / width));
}

/** The rewind and skip buttons beside H6's play button move this far. Default (agent), owner may override. */
export const SKIP_SECONDS = 15;

/** The bars of H6's waveform (the artboard draws 44). */
export const WAVEFORM_BARS = 44;

/**
 * Bar heights (0 to 1) from decoded samples: the loudness (root mean square) of each of
 * `bars` equal slices, scaled to the loudest slice. Silence gives all zeros.
 */
export function peaksFrom(samples: ArrayLike<number>, bars: number = WAVEFORM_BARS): number[] {
  const out = new Array<number>(bars).fill(0);
  if (samples.length === 0 || bars <= 0) return out;
  const slice = samples.length / bars;
  for (let b = 0; b < bars; b += 1) {
    const start = Math.floor(b * slice);
    const end = Math.min(samples.length, Math.max(start + 1, Math.floor((b + 1) * slice)));
    let sum = 0;
    for (let i = start; i < end; i += 1) sum += samples[i] * samples[i];
    out[b] = Math.sqrt(sum / Math.max(1, end - start));
  }
  const loudest = Math.max(...out);
  return loudest > 0 ? out.map((v) => v / loudest) : out;
}

/** A person's avatar colour when they have no photo: always the same one for the same person. */
export function hueFor(wawuId: string): AvatarHue {
  let sum = 0;
  for (let i = 0; i < wawuId.length; i += 1) sum = (sum * 31 + wawuId.charCodeAt(i)) % 9973;
  return hues[sum % hues.length];
}
