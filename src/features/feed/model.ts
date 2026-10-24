import { hues, type AvatarHue } from '@/components/Avatar';
import type { IconName } from '@/components/icon';

import { nairaToKobo } from '@/api/kobo';
import { formatMoney } from '@/components/Money';

import type { CardWork, ContentDetail, CreatorCardData, FeedCreator, FeedEntry, FeedItem, ProfessionalCardData } from './api';

/**
 * What the feed decides from the Hub's data, kept apart from the drawing so each rule is
 * tested on its own. Every figure here is read from a field the Hub serves; nothing is
 * made up when a field is missing (the element around it stays, the figure is left out).
 */

/** The post layouts: H2 and H5 (video), H3, H4, H6, H7 (a course) and H8 (a template). */
export type PostKind = 'video' | 'photos' | 'pdf' | 'audio' | 'course' | 'template';

const kindByType: Partial<Record<FeedItem['contentType'], PostKind>> = {
  video: 'video',
  image: 'photos',
  pdf: 'pdf',
  audio: 'audio',
  course: 'course',
  template: 'template',
};

/** The layout a piece takes, or null for a kind the feed has no layout for. */
export function postKind(item: Pick<FeedItem, 'contentType'>): PostKind | null {
  return kindByType[item.contentType] ?? null;
}

/** The posts of a page the feed draws, in the Hub's order. */
export function drawablePosts(entries: readonly FeedEntry[]): FeedItem[] {
  const posts: FeedItem[] = [];
  for (const entry of entries) {
    if (entry.kind === 'content' && postKind(entry.content)) posts.push(entry.content);
  }
  return posts;
}

/** One screen of the feed: a post, or an interstitial card among them (H9 creator, H10 professional). */
export type FeedRow =
  | { kind: 'post'; key: string; item: FeedItem }
  | { kind: 'creator'; key: string; card: CreatorCardData }
  | { kind: 'professional'; key: string; card: ProfessionalCardData };

const named = (name: string | null | undefined) => Boolean(name?.trim());

/**
 * The screens of the pages read so far, in the Hub's order and with nothing twice (a page read
 * again can bring a piece or a card the list already has). A card with no name is left out:
 * nobody is offered as a bare id.
 */
export function feedRows(entries: readonly FeedEntry[]): FeedRow[] {
  const seen = new Set<string>();
  const rows: FeedRow[] = [];
  const add = (row: FeedRow) => {
    if (seen.has(row.key)) return;
    seen.add(row.key);
    rows.push(row);
  };
  for (const entry of entries) {
    if (entry.kind === 'content') {
      if (postKind(entry.content)) add({ kind: 'post', key: `post-${entry.content.id}`, item: entry.content });
    } else if (entry.kind === 'creator') {
      if (named(entry.creator.displayName)) add({ kind: 'creator', key: `creator-${entry.creator.wawuId}`, card: entry.creator });
    } else if (entry.kind === 'professional') {
      if (named(entry.professional.displayName)) add({ kind: 'professional', key: `professional-${entry.professional.id}`, card: entry.professional });
    }
  }
  return rows;
}

const PICTURE_FILE = /\.(?:jpe?g|png|webp|gif|avif|heic|bmp)$/i;

/** Whether an address is a still picture (by its file type, whatever signs it): else a video or a document. */
export function isPicture(url: string | null | undefined): boolean {
  if (!url) return false;
  let path = url;
  try {
    path = new URL(url).pathname;
  } catch {
    path = url.split('?')[0] ?? url;
  }
  return PICTURE_FILE.test(path);
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
export function creatorName(creator: Pick<FeedCreator, 'displayName' | 'handle'> | null | undefined): string | null {
  if (!creator) return null;
  return creator.displayName?.trim() || creator.handle?.trim() || null;
}

/** What a piece's page calls a creator who has neither a name nor a handle (every new creator starts with no name). */
export const UNNAMED_CREATOR = 'Someone';

/**
 * A person the Hub names with a plain name and handle (a chat's other person, a recipient): the name, else the handle, else
 * "Someone", as the feed and a piece's page name a creator. A person with no name is a valid person, never an unreadable one.
 */
export const nameOrSomeone = (name: string | null | undefined, handle: string | null | undefined): string =>
  creatorName({ displayName: name ?? null, handle: handle ?? null }) ?? UNNAMED_CREATOR;

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

/** What a course's post reads from its detail: how many lessons, and how many of them are free. */
export type CourseDetail = Pick<ContentDetail, 'lessons' | 'freePreview'>;

/** "lesson 1 free", "lessons 1–3 free": how much of a course is open before paying (what the creator declared). Null when none. */
export function freeLessonsText(detail: Pick<CourseDetail, 'freePreview'> | null | undefined): string | null {
  const n = detail?.freePreview?.lessons;
  if (!n || n <= 0) return null;
  return n === 1 ? 'lesson 1 free' : `lessons 1–${n} free`;
}

/** "12 lessons", from the lessons the Hub lists. Null until the detail is read, or when there are none. */
export function lessonCountText(detail: Pick<CourseDetail, 'lessons'> | null | undefined): string | null {
  const n = detail?.lessons?.length ?? 0;
  return n > 0 ? `${n} ${n === 1 ? 'lesson' : 'lessons'}` : null;
}

/** The pill above the name: what the post is and how long or how big it is. A course also reads its detail. */
export function pillFor(item: FeedItem, kind: PostKind, detail?: CourseDetail | null): { icon: IconName; text: string } {
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
    case 'course':
      return { icon: 'GraduationCap', text: join(['Course', isLocked(item) ? freeLessonsText(detail) : lessonCountText(detail)]) };
    case 'template':
      return { icon: 'LayoutTemplate', text: 'Template' };
  }
}

export type Offer = { icon: IconName; title: string; subtitle: string };

/**
 * The offer bar under a locked post (H3, H4, H5): what unlocking gives and how it is paid
 * for. Only a locked piece has one. The price beside it is the piece's own price. The bar
 * offers the piece itself: a free post linked to a separate paid piece (H3's "Golden Hour
 * presets") is not served (BACKEND_GAPS G-216).
 */
export function offerFor(item: FeedItem, kind: PostKind, detail?: CourseDetail | null): Offer | null {
  if (!isLocked(item)) return null;
  const length = durationText(item.media?.durationLabel ?? item.durationLabel);
  const pages = item.media?.pageCount ?? item.pageCount;
  const frames = item.media?.frameCount;
  // Non-breaking spaces: when the subtitle wraps it breaks before "Pay", never inside it (H4 draws it whole).
  const pay = 'Pay\u00a0from\u00a0wallet';
  switch (kind) {
    case 'video':
      return { icon: 'Lock', title: 'Unlock the full video', subtitle: join([length, pay]) };
    case 'audio':
      return { icon: 'Lock', title: 'Unlock the full audio', subtitle: join([length, pay]) };
    case 'pdf':
      return { icon: 'BookOpen', title: 'Read the full PDF', subtitle: join([pages ? `${pages} pages` : null, pay]) };
    case 'photos':
      return { icon: 'Images', title: 'Unlock the full set', subtitle: join([frames ? `${frames} photos` : null, pay]) };
    // H7 and H8 name the piece itself in the bar: "VFX for Beginners · 12 lessons", "Aba Collection · Template".
    case 'course':
      return { icon: 'GraduationCap', title: item.title, subtitle: join([lessonCountText(detail), pay]) };
    case 'template':
      return { icon: 'LayoutTemplate', title: item.title, subtitle: join(['Template', pay]) };
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

/**
 * Where H4's book goes. On a phone with room it sits where the canvas puts it (128 from the
 * top, full size). On a smaller screen it is scaled down, and slid into the room between the
 * tabs and the words, so it and its back page never reach the words or run under the rail.
 * `top` is where its (unscaled) box starts: a scale grows from the box's middle.
 */
export function bookPlacement(input: {
  width: number;
  /** The room between the tabs and the words, as `PostFrame` measures it. */
  areaTop: number;
  areaBottom: number;
  /** The canvas's own top for the book on this phone. */
  canvasTop: number;
  bookH: number;
  extentH: number;
  reachRight: number;
  railClear: number;
}): { top: number; scale: number } {
  const { width, areaTop, areaBottom, canvasTop, bookH, extentH, reachRight, railClear } = input;
  const widthScale = (width / 2 - railClear) / reachRight;
  return roomPlacement({ areaTop, areaBottom, canvasTop, boxH: bookH, extentH, maxScale: widthScale });
}

/**
 * Where a block drawn at a fixed place on the canvas goes on THIS phone: its canvas place
 * when it fits between the tabs and the words, else scaled down (never past `maxScale`, never
 * to more than the room) and slid into the room. `top` is where the unscaled `boxH` tall box
 * starts, because a scale grows from the box's middle; `extentH` is how tall the block looks
 * (a tilted back page makes the book taller than its box).
 */
export function roomPlacement(input: {
  areaTop: number;
  areaBottom: number;
  canvasTop: number;
  boxH: number;
  extentH: number;
  maxScale?: number;
}): { top: number; scale: number } {
  const { areaTop, areaBottom, canvasTop, boxH, extentH, maxScale = 1 } = input;
  const room = Math.max(0, areaBottom - areaTop);
  const scale = Math.max(0, Math.min(1, maxScale, room / extentH));
  const visualH = extentH * scale;
  const middle = Math.min(Math.max(canvasTop + boxH / 2, areaTop + visualH / 2), areaBottom - visualH / 2);
  return { top: middle - boxH / 2, scale };
}

/**
 * How wide H5's "Preview ended" words may be: the canvas's width, narrowed on a small phone so the
 * words (centred on the screen) stop short of the rail instead of running under it.
 */
export function endedBodyWidth(width: number, maxWidth: number, railClear: number): number {
  return Math.max(0, Math.min(maxWidth, width - 2 * railClear));
}

/**
 * H3's frame counter sits top right. On a short phone the rail (bottom-anchored) rises to meet
 * it; then it steps left of the rail. `railTop` is 0 until the rail is measured.
 */
export function counterRight(input: { side: number; railClearRight: number; counterBottom: number; railTop: number; gap: number }): number {
  const { side, railClearRight, counterBottom, railTop, gap } = input;
  return railTop > 0 && railTop < counterBottom + gap ? Math.max(side, railClearRight) : side;
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

// ---- The creator card (H9) and the professional card (H10) ----

/**
 * The words under the name: the person's headline, then where they work when the Hub knows
 * (a professional's own city; a creator has none, G-100). Either part is left out when the
 * Hub has none, never guessed.
 */
export function placeLine(headline: string | null | undefined, city?: string | null): string {
  return join([headline?.trim(), city?.trim()]);
}

/** Which tick follows a card's name: the one the card is about first (a professional card leads with the blue tick). */
export function cardTick(verification: FeedCreator['verification'] | null | undefined, lead: 'creator' | 'pro'): 'creator' | 'pro' | null {
  const creator = verification?.creator?.verified ? 'creator' : null;
  const pro = verification?.professional?.verified ? 'pro' : null;
  return lead === 'pro' ? (pro ?? creator) : (creator ?? pro);
}

const firstWord = (name: string | null | undefined): string | null => name?.trim().split(/\s+/)[0] || null;

export type TextPart = { text: string; bold?: boolean };

/**
 * H9's "Followed by Amaka and 12 people you know", from the Hub's `knownFollowers` (the count of
 * people the viewer follows who follow this creator, and up to three of them by name). Null when
 * nobody the viewer follows follows them: the line is not drawn.
 */
export function followedByParts(known: CreatorCardData['knownFollowers'] | null | undefined): TextPart[] | null {
  const count = known?.count ?? 0;
  if (!known || count <= 0) return null;
  const lead = firstWord(known.people[0]?.displayName);
  const people = (n: number) => `${n} ${n === 1 ? 'person' : 'people'} you know`;
  if (!lead) return [{ text: `Followed by ${people(count)}` }];
  if (count === 1) return [{ text: 'Followed by ' }, { text: lead, bold: true }];
  const second = count === 2 ? firstWord(known.people[1]?.displayName) : null;
  return [{ text: 'Followed by ' }, { text: lead, bold: true }, { text: second ? ` and ${second}` : ` and ${people(count - 1)}` }];
}

/** "~25m", "~3h", "~2d": how long they usually take to reply. Null when the Hub has no figure (too few answered messages). */
export function usualReply(minutes: number | null | undefined): string | null {
  if (typeof minutes !== 'number' || !(minutes > 0)) return null;
  if (minutes < 60) return `~${Math.round(minutes)}m`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `~${hours}h` : `~${Math.round(hours / 24)}d`;
}

/** "212 reviews", "1 review". */
export const reviewsText = (count: number): string => `${count} ${count === 1 ? 'review' : 'reviews'}`;

/** "₦1,500", with kobo only when the price has them. */
export const nairaText = (naira: number): string => formatMoney(nairaToKobo(naira), { decimals: !Number.isInteger(naira) });

/** H10's note: "No reply in 24 hours and your ₦1,500 comes back." The hours are the professional's own window, the price their own. */
export function refundNote(dmPrice: number, hours: number): string {
  return `No reply in ${hours} ${hours === 1 ? 'hour' : 'hours'} and your ${nairaText(dmPrice)} comes back.`;
}

/** The most service chips a professional card shows (H10 draws four); the rest are on their profile. Default (agent), owner may override. */
export const CARD_SERVICE_CHIPS = 4;

const workIcons: Record<string, IconName> = {
  video: 'Play',
  course: 'GraduationCap',
  pdf: 'BookOpen',
  image: 'Images',
  audio: 'AudioLines',
  template: 'LayoutTemplate',
};

const workNames: Record<string, string> = { video: 'Video', course: 'Course', pdf: 'PDF', image: 'Photos', audio: 'Audio', template: 'Template' };

/** What one piece of a creator card's strip draws (H9): its kind, a lock and the price when locked, else views and a length. */
export function workTile(work: CardWork): { icon: IconName; locked: boolean; left: string; right: string | null; label: string } {
  const icon = workIcons[work.contentType] ?? 'FileText';
  const name = workNames[work.contentType] ?? null;
  const locked = work.locked && work.accessType === 'paid';
  if (locked) return { icon, locked, left: nairaText(work.price), right: name, label: `${work.title}, locked, ${nairaText(work.price)}` };
  const views = `${compactCount(work.views)} ${work.views === 1 ? 'view' : 'views'}`;
  let right: string | null = name;
  if (work.contentType === 'video' || work.contentType === 'audio') right = durationText(work.durationLabel);
  else if (work.contentType === 'image') right = work.frameCount > 0 ? String(work.frameCount) : null;
  return { icon, locked, left: views, right, label: `${work.title}, ${views}` };
}
