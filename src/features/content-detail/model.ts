import type { IconName } from '@/components/icon';
import { nairaToKobo } from '@/api/kobo';
import type { FeedCreator, FeedItem } from '@/features/feed/api';
import { clock, compactCount, durationSeconds, durationText } from '@/features/feed/model';
import { LINK_ORIGIN, readableLink } from '@/lib/appLinks';

import type { Comment, Engagement, Maker, Piece, PieceDetail } from './api';

/**
 * What the piece's own page decides from the Hub's data (HOME-03, HOME-08), kept apart from the drawing so each rule is tested on
 * its own. Every figure is read from a field the Hub serves; a figure the Hub does not serve is left out, never made up.
 */
export type Kind = 'video' | 'audio' | 'pdf' | 'photos' | 'course' | 'template';

const KIND_BY_TYPE: Record<Piece['contentType'], Kind> = {
  video: 'video',
  audio: 'audio',
  pdf: 'pdf',
  image: 'photos',
  course: 'course',
  template: 'template',
};

export const kindOf = (piece: Pick<Piece, 'contentType'>): Kind => KIND_BY_TYPE[piece.contentType] ?? 'template';

/** The title of the bar: H19 "PDF", H24 "Video", H25 "Course". */
export const BAR_TITLE: Record<Kind, string> = { video: 'Video', audio: 'Audio', pdf: 'PDF', photos: 'Photos', course: 'Course', template: 'Template' };

/** Paid and not the viewer's yet: only the creator's public preview is open (H19, H25). */
export const isLocked = (piece: Pick<Piece, 'accessType' | 'fullAssetLocked'>): boolean => piece.accessType === 'paid' && piece.fullAssetLocked;

/** The three states the board draws (H19 locked, H20 unlocked, H24 free); a course is H25 in any of them. */
export type Layout = 'locked' | 'unlocked' | 'free';

export const layoutOf = (piece: Pick<Piece, 'accessType' | 'fullAssetLocked'>): Layout => (piece.accessType === 'free' ? 'free' : isLocked(piece) ? 'locked' : 'unlocked');

const COMPACT_FROM = 10000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/** A count of views or students: "2,140" below 10,000, "12.4K" from it (the two boards write them so). */
export function bigCount(count: number): string {
  const n = Math.max(0, Math.floor(count));
  return n >= COMPACT_FROM ? compactCount(n) : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export const plural = (n: number, one: string, many: string) => `${bigCount(n)} ${n === 1 ? one : many}`;

/** "Sep 2026": when the piece was last changed (H19). */
export function monthYear(iso: string): string | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "26 Sep": the day this viewer bought it (H20). */
export function dayMonth(iso: string): string | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;

/** "40m", "2h", "3d", then the date: how long ago a comment was written (H21). */
export function ago(iso: string, now: number = Date.now()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const s = Math.max(0, Math.floor((now - t) / 1000));
  if (s < MINUTE) return 'now';
  if (s < HOUR) return `${Math.floor(s / MINUTE)}m`;
  if (s < DAY) return `${Math.floor(s / HOUR)}h`;
  if (s < DAY * 7) return `${Math.floor(s / DAY)}d`;
  return dayMonth(iso) ?? '';
}

/** "3 days ago": how old the piece is, in words (H24's meta line). */
export function daysAgo(iso: string, now: number = Date.now()): string | null {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const days = Math.floor(Math.max(0, now - t) / (DAY * 1000));
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return monthYear(iso);
}

const join = (parts: (string | null | undefined | false)[]) => parts.filter(Boolean).join(' · ');

/** A piece's length for its tags and meta: the Hub's own label, "1:50" below ten minutes and "18 min" from it. */
export const lengthOf = (piece: Pick<Piece, 'durationLabel'>): string | null => durationText(piece.durationLabel);

/** A course's total, "2h 40m", when every lesson has a length the app can add up. */
export function courseLength(lessons: PieceDetail['lessons']): string | null {
  if (lessons.length === 0) return null;
  let total = 0;
  for (const lesson of lessons) {
    const seconds = durationSeconds(lesson.durationLabel) ?? minutesOnly(lesson.durationLabel);
    if (seconds === null) return null;
    total += seconds;
  }
  const minutes = Math.round(total / MINUTE);
  const h = Math.floor(minutes / MINUTE);
  const m = minutes % MINUTE;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

/** A lesson's length in the Hub's older free-text form ("9 min"). */
function minutesOnly(label: string | null | undefined): number | null {
  const match = /^(\d{1,3})\s*min/i.exec((label ?? '').trim());
  return match ? Number(match[1]) * MINUTE : null;
}

/** A lesson's length as the list draws it: "9 min". */
export const lessonLength = (label: string | null | undefined): string | null => durationText(label);

/** The line under the title: H19 "84 pages · 2,140 views · Updated Sep 2026", H20 "84 pages · Bought 26 Sep", H24, H25. */
export function metaLine(piece: Piece, detail: PieceDetail | undefined, now: number = Date.now()): string {
  const kind = kindOf(piece);
  const layout = layoutOf(piece);
  const pages = piece.pageCount ? plural(piece.pageCount, 'page', 'pages') : null;
  const bought = detail?.purchasedAt ? dayMonth(detail.purchasedAt) : null;
  if (kind === 'course') {
    const students = detail?.studentCount;
    return join(['Course', typeof students === 'number' && students > 0 ? plural(students, 'student', 'students') : null]);
  }
  if (layout === 'free') {
    return join([BAR_TITLE[kind], plural(piece.views, 'view', 'views'), daysAgo(piece.createdAt, now)]);
  }
  if (layout === 'unlocked' && bought) return join([kind === 'pdf' ? pages : lengthOf(piece), `Bought ${bought}`]);
  const updated = detail?.updatedAt ? monthYear(detail.updatedAt) : null;
  return join([kind === 'pdf' ? pages : lengthOf(piece), plural(piece.views, 'view', 'views'), updated ? `Updated ${updated}` : null]);
}

/** The tag over the picture's corner: "Preview · pages 1–4 of 84", "All 84 pages", "Free · 1:50", "12 lessons · 2h 40m". */
export function mediaTag(piece: Piece, detail: PieceDetail | undefined): { icon: IconName; text: string } {
  const kind = kindOf(piece);
  const layout = layoutOf(piece);
  const length = lengthOf(piece);
  if (kind === 'course') {
    const lessons = detail?.lessons ?? [];
    return { icon: 'GraduationCap', text: join([lessons.length > 0 ? plural(lessons.length, 'lesson', 'lessons') : null, detail ? courseLength(detail.lessons) : null]) };
  }
  if (kind === 'pdf') {
    if (layout !== 'locked') return { icon: 'BookOpen', text: piece.pageCount ? `All ${piece.pageCount} pages` : 'All pages' };
    const free = detail?.freePreview.pages;
    return { icon: 'Eye', text: free && piece.pageCount ? `Preview · pages 1–${free} of ${piece.pageCount}` : free ? `Preview · pages 1–${free}` : 'Preview' };
  }
  if (kind === 'photos') return { icon: 'Images', text: layout === 'locked' ? 'Preview' : 'Photo set' };
  if (kind === 'template') return { icon: 'FileText', text: layout === 'locked' ? 'Preview' : 'Template' };
  const icon: IconName = kind === 'audio' ? 'AudioLines' : 'Play';
  if (layout === 'free') return { icon, text: join(['Free', length]) };
  if (layout === 'locked') {
    const seconds = detail?.freePreview.seconds;
    return { icon: 'Eye', text: seconds ? `Preview · ${clock(seconds)}` : 'Preview' };
  }
  return { icon, text: join([kind === 'audio' ? 'Audio' : 'Video', length]) };
}

/** The line under the creator's name: "Business coach · 22K followers". Either part is left out when the Hub has none. */
export function makerLine(maker: Pick<Maker, 'headline' | 'followerCount'> | null | undefined): string {
  if (!maker) return '';
  return join([maker.headline?.trim() || null, maker.followerCount > 0 ? `${compactCount(maker.followerCount)} ${maker.followerCount === 1 ? 'follower' : 'followers'}` : null]);
}

/** "Tip Kemi": the first word of the name. */
export const firstName = (name: string | null | undefined): string => (name ?? '').trim().split(/\s+/)[0] ?? '';

/** The price card's label: what unlocking gives, in the piece's own words. */
export function unlockLabel(kind: Kind): string {
  switch (kind) {
    case 'video':
      return 'Unlock the full video';
    case 'audio':
      return 'Unlock the full audio';
    case 'pdf':
      return 'Unlock the full PDF';
    case 'photos':
      return 'Unlock the full set';
    case 'course':
      return 'Unlock the whole course';
    default:
      return 'Unlock the full template';
  }
}

export const priceKobo = (piece: Pick<Piece, 'price'>): number => nairaToKobo(piece.price);

/** Where a piece lives when it is shared: `https://wawuafrica.com/content/<id>`. The page's own path, so a link the Hub's website gains opens here (G-HOME-03-2). */
export const CONTENT_PATH_PREFIX = '/content/';

export const contentLink = (id: string): string => `${LINK_ORIGIN}${CONTENT_PATH_PREFIX}${encodeURIComponent(id)}`;

/** What goes out with a share: the title, who made it, and the link. */
export function shareText(title: string, by: string | null, link: string): string {
  return [by ? `${title} by ${by}` : title, link].join('\n');
}

/** WhatsApp's own link for a ready message: it opens the app when it is installed, and WhatsApp's page when it is not. */
export const whatsappUrl = (text: string): string => `https://wa.me/?text=${encodeURIComponent(text)}`;

/** The link as the sheet draws it: no scheme. */
export const linkLine = (id: string): string => readableLink(contentLink(id));

/** What a star count is called on H23 ("4 of 5 · Really good"). */
export const STAR_WORDS = ['Poor', 'Fair', 'Good', 'Really good', 'Excellent'] as const;
export const starLine = (stars: number): string => `${stars} of 5 · ${STAR_WORDS[stars - 1] ?? ''}`;

/**
 * The heart's label on H19, H20, H24 and H25: "96% liked", from the piece's rating as the Hub serves it (`ratingPct`, a whole percent).
 * A piece nobody has rated has no percentage, and nothing is made up for it: the label is the like count the Hub does serve.
 */
export const likeLabel = (ratingPct: number | null | undefined, likes: number): string =>
  typeof ratingPct === 'number' && Number.isFinite(ratingPct) && ratingPct >= 0 && ratingPct <= 100 ? `${Math.round(ratingPct)}% liked` : compactCount(likes);

/** The Rate button's label: "Rate", or "Rated 5" once the person has. */
export const rateLabel = (mine: number | null | undefined): string => (mine ? `Rated ${mine}` : 'Rate');

export const NOT_BOUGHT_LINE = 'Only people who bought this can rate it.';

export type Thread = { comment: Comment; replies: Comment[] };

/**
 * Comments in the board's order (H21): each top-level comment with its replies under it, indented one level. A reply to a reply
 * sits under the same comment (the board indents once), in the order they were written.
 */
export function threads(items: readonly Comment[]): Thread[] {
  const byId = new Map(items.map((c) => [c.id, c]));
  const rootOf = (c: Comment): string => {
    let cur = c;
    for (let hops = 0; cur.replyToId && byId.has(cur.replyToId) && hops < items.length; hops += 1) cur = byId.get(cur.replyToId) as Comment;
    return cur.id;
  };
  const out = new Map<string, Thread>();
  for (const c of items) if (!c.replyToId || !byId.has(c.replyToId)) out.set(c.id, { comment: c, replies: [] });
  const replies = items
    .filter((c) => c.replyToId && byId.has(c.replyToId))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  for (const c of replies) out.get(rootOf(c))?.replies.push(c);
  return [...out.values()];
}

/** A commenter's name: WAWU ID name, else the handle, else nothing the Hub gave. */
export const commenterName = (c: Pick<Comment, 'author'>): string => c.author?.name?.trim() || (c.author?.handle ? `@${c.author.handle}` : 'Someone');

/** "@Emeka ": what Reply puts in the box. */
export const mentionFor = (c: Pick<Comment, 'author'>): string => `@${firstName(commenterName(c).replace(/^@/, ''))} `;

export const COMMENT_MAX = 1000;

/** The piece as the unlock and tip sheets know it (a `FeedItem`), from what this page has read. */
export function asFeedItem(piece: Piece, detail: PieceDetail, engagement: Engagement, media: FeedItem['media']): FeedItem {
  const c = detail.creator;
  const creator: FeedCreator = { wawuId: c.wawuId, displayName: c.displayName, handle: c.handle, avatarUrl: c.avatarUrl, verification: c.verification };
  return {
    ...piece,
    likedByMe: engagement.likedByMe,
    savedByMe: engagement.savedByMe,
    followsCreator: engagement.followsCreator,
    shares: engagement.shares,
    creator,
    media,
  };
}
