import { formatMoney } from '@/components/Money';
import { productsMeterCaption } from '@/components/ProductsMeter';
import { APP_NAME } from '@/components/BrandMark';
import { nairaToKobo } from '@/api/kobo';
import { compactCount } from '@/features/feed/model';
import { profileLink } from '@/lib/appLinks';
import { PLATFORMS, SOCIAL, bareHandle, handleOf, orderOf, type SocialHandles, type SocialPlatform } from '@/features/profile-edit/social';

import type { ContentPiece, Experience, Listing, MyProfile, MyTier, ProductDraft, ProfileFields, ServiceState } from './api';

/**
 * What the Me tab (M1, M2, M4, M10) decides from the Hub's data, kept apart from the drawing so each rule is
 * tested on its own. Every figure is read from a field the Hub serves; a missing field leaves its element out.
 */

/** The three tabs, as R-9 and the brief name them (no Shop tab). */
export const PROFILE_TABS = [
  { value: 'content', label: 'Content' },
  { value: 'services', label: 'Services' },
  { value: 'about', label: 'About' },
] as const;

export type ProfileTab = (typeof PROFILE_TABS)[number]['value'];

/** The person's name as one line: first, middle and last, whichever they have; the handle when the name is empty. */
export function nameOf(me: Pick<MyProfile, 'firstName' | 'middleName' | 'lastName' | 'handle'>): string {
  const name = [me.firstName, me.middleName, me.lastName]
    .map((part) => (part ?? '').trim())
    .filter(Boolean)
    .join(' ');
  return name || (me.handle ?? '');
}

/** The ticks beside the name: the creator tick (purple), then the professional tick (blue), only while each is live. */
export function ticksOf(me: Pick<MyProfile, 'verification'>): ('creator' | 'pro')[] {
  const out: ('creator' | 'pro')[] = [];
  if (me.verification?.creator?.verified) out.push('creator');
  if (me.verification?.professional?.verified) out.push('pro');
  return out;
}

/** One social chip above the counts: the platform, what is written on the chip, and where a tap goes. */
export type SocialLink = { platform: SocialPlatform; label: string; url: string };

/** Where each handle lives on the platform's own site. A stored full link is opened as it is. */
const PROFILE_URL: Record<SocialPlatform, (handle: string) => string> = {
  instagram: (h) => `https://instagram.com/${h}`,
  tiktok: (h) => `https://www.tiktok.com/@${h}`,
  youtube: (h) => `https://youtube.com/@${h}`,
  x: (h) => `https://x.com/${h}`,
  threads: (h) => `https://www.threads.net/@${h}`,
  linkedin: (h) => `https://linkedin.com/in/${h}`,
  facebook: (h) => `https://facebook.com/${h}`,
};

const WEB_LINK = /^https?:\/\//i;

/** A link written the way people read it: no scheme, no "www.", no slash at the end ("lennoxfilms.com"). */
export function readableLink(url: string): string {
  return url
    .trim()
    .replace(WEB_LINK, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '');
}

/** The address a tap opens: a link as stored, or a bare site given https. */
export function openableLink(url: string): string {
  const value = url.trim();
  return WEB_LINK.test(value) ? value : `https://${value}`;
}

/**
 * The social chips, in the order the person set on M9 (`socialOrder`, then any other filled one in the default
 * order), each with the handle as the chip shows it and the platform page a tap opens.
 */
export function socialLinksOf(me: MyProfile, fields: Pick<ProfileFields, 'threadsHandle' | 'socialOrder'>): SocialLink[] {
  const handles = {} as SocialHandles;
  const stored = {} as Record<SocialPlatform, string>;
  for (const platform of PLATFORMS) {
    const meta = SOCIAL[platform];
    const raw = (meta.field === 'threadsHandle' ? fields.threadsHandle : me[meta.field]) ?? '';
    stored[platform] = raw.trim();
    handles[platform] = bareHandle(handleOf(platform, raw));
  }
  return orderOf(handles, fields.socialOrder).map((platform) => {
    const handle = handles[platform];
    const pasted = WEB_LINK.test(handle);
    const url = pasted ? handle : WEB_LINK.test(stored[platform]) ? stored[platform] : PROFILE_URL[platform](handle);
    return { platform, label: pasted ? readableLink(handle) : handle, url };
  });
}

/** The three counts as the canvas writes them: 12.5K followers, 486 following, 48 pieces. */
export function countsOf(stats: { followerCount: number; followingCount: number; postCount: number }) {
  return [
    { key: 'followers', value: compactCount(stats.followerCount), label: stats.followerCount === 1 ? 'follower' : 'followers' },
    { key: 'following', value: compactCount(stats.followingCount), label: 'following' },
    { key: 'pieces', value: compactCount(stats.postCount), label: stats.postCount === 1 ? 'piece' : 'pieces' },
  ] as const;
}

/** What the share sheet carries: who this is and their profile link, `https://wawuafrica.com/u/<handle>` (LINKS-01, A2). */
export function profileShareText(name: string, handle: string | null | undefined): string {
  const who = name ? `${name} on ${APP_NAME}` : APP_NAME;
  const bare = (handle ?? '').trim().replace(/^@+/, '');
  return bare ? `${who}\n${profileLink(bare)}` : who;
}

/** One tile of the Content grid: a free piece shows its views, a paid one its price and a lock, as M1 draws them. */
export type GridTile = {
  id: string;
  title: string;
  /** A picture to fill the tile, when the piece's preview is one. Other files have no still (BACKEND_GAPS G-290). */
  still: string | null;
  kind: ContentPiece['contentType'];
  locked: boolean;
  /** "12K" for a free piece, "₦8,000" for a paid one. */
  caption: string;
  /** What a screen reader says for the tile. */
  spoken: string;
  /** A draft (DV2-03): it carries the Draft tag, has no file or views, and shows its title where a piece shows its figure. */
  draft?: boolean;
};

export function tileOf(piece: ContentPiece): GridTile {
  const paid = piece.accessType === 'paid';
  const caption = paid ? formatMoney(nairaToKobo(piece.price), { decimals: false }) : compactCount(piece.views);
  const views = `${piece.views} ${piece.views === 1 ? 'view' : 'views'}`;
  return {
    id: piece.id,
    title: piece.title,
    still: piece.contentType === 'image' && piece.previewAssetUrl ? piece.previewAssetUrl : null,
    kind: piece.contentType,
    locked: paid,
    caption,
    spoken: paid ? `${piece.title}, paid, ${caption}` : `${piece.title}, free, ${views}`,
  };
}

/**
 * A draft as a tile of the grid (M1 draws it first, tagged Draft). A draft has no file, so no picture and no views: the tile shows
 * the kind of file it will be (an image mark when none is chosen yet) and its title.
 */
export function draftTileOf(draft: ProductDraft): GridTile {
  return {
    id: draft.id,
    title: draft.title,
    still: null,
    kind: draft.contentType ?? 'image',
    locked: false,
    caption: draft.title,
    spoken: `${draft.title}, draft`,
    draft: true,
  };
}

/** The tile's mark for a piece with no still: what kind of file it is. */
export function kindIcon(kind: ContentPiece['contentType']) {
  switch (kind) {
    case 'video':
    case 'course':
      return 'Video' as const;
    case 'audio':
      return 'AudioLines' as const;
    case 'pdf':
      return 'FileText' as const;
    case 'template':
      return 'LayoutTemplate' as const;
    default:
      return 'Image' as const;
  }
}

/** M2's "Paid messages" row: on only when the creator has switched paid messages on and set a price. */
export type PaidMessages = { priceLine: string; replyLine: string | null };

const HOURS_PER_DAY = 24;

/** "replies within 24 hours", "replies within 2 days": the reply window the creator set (I21). */
export function replyWindow(hours: number | null | undefined): string | null {
  if (typeof hours !== 'number' || !Number.isFinite(hours) || hours <= 0) return null;
  if (hours > HOURS_PER_DAY && hours % HOURS_PER_DAY === 0) {
    const days = hours / HOURS_PER_DAY;
    return `replies within ${days} ${days === 1 ? 'day' : 'days'}`;
  }
  return `replies within ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
}

export function paidMessagesOf(state: Pick<ServiceState, 'dmEnabled' | 'dmPrice' | 'dmResponseHours'> | null | undefined): PaidMessages | null {
  if (!state || !state.dmEnabled || typeof state.dmPrice !== 'number' || state.dmPrice <= 0) return null;
  return {
    priceLine: `${formatMoney(nairaToKobo(state.dmPrice), { decimals: false })} a message`,
    replyLine: replyWindow(state.dmResponseHours),
  };
}

/** M2's professional rows: listings a reviewer approved and the person has not hidden (P8, P9). */
export function liveListings(listings: readonly Listing[]): Listing[] {
  return listings.filter((listing) => listing.status === 'approved' && listing.listed);
}

/** A listing's title: the person's own headline, else the field it is listed in. */
export function listingTitle(listing: Pick<Listing, 'headline' | 'category'>): string {
  return listing.headline.trim() || listing.category;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** Lagos is UTC+1 all year (no daylight saving), so a month is read an hour ahead of UTC (wawu-backend CONVENTIONS section 7). */
const LAGOS_OFFSET_MS = 60 * 60 * 1000;

/** "On Who Made This since March 2025" (M4, with the app's name, R-37), from the date the profile was made. */
export function memberSinceLine(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return null;
  const lagos = new Date(at + LAGOS_OFFSET_MS);
  return `On ${APP_NAME} since ${MONTHS[lagos.getUTCMonth()]} ${lagos.getUTCFullYear()}`;
}

/** The year a role started or ended: the Hub sends a month, `YYYY-MM`. */
function yearOf(month: string | null | undefined): number | null {
  const match = /^(\d{4})(?:-|$)/.exec((month ?? '').trim());
  return match ? Number(match[1]) : null;
}

/** "2021 to now", "2018 to 2021", "2020": the years a role covers. */
export function yearsOf(role: Pick<Experience, 'startedOn' | 'endedOn' | 'current'>): string | null {
  const from = yearOf(role.startedOn);
  const to = yearOf(role.endedOn);
  if (role.current) return from ? `${from} to now` : null;
  if (from && to) return from === to ? String(from) : `${from} to ${to}`;
  return from ? String(from) : to ? String(to) : null;
}

/** One line of the Experience list: the role, then where and when ("Noah Agency, Lagos · 2018 to 2021"). */
export type RoleLine = { id: string; title: string; detail: string | null };

export function roleLinesOf(experience: readonly Experience[]): RoleLine[] {
  return experience.map((role) => {
    const where = [role.company, role.location].map((part) => (part ?? '').trim()).filter(Boolean).join(', ');
    const parts = [where, yearsOf(role)].filter((part): part is string => Boolean(part));
    return { id: role.id, title: role.title, detail: parts.length ? parts.join(' · ') : null };
  });
}

/** A tier is running while it is `active` or `ending`; `none` and `ended` have nothing to show beside the name (the Hub's PersonBadgeView rule). */
function runningTier(tier: MyTier | null | undefined): MyTier | null {
  return tier && tier.tier && (tier.state === 'active' || tier.state === 'ending') ? tier : null;
}

/** The badge by the name (M1): the tier's name, and the number a numbered badge (Founding Maker) carries. */
export type HeaderBadge = { name: string; number: number | null };

/**
 * The pill beside the name for a person with a running tier, from `GET /me/tier`. A numbered badge's number is not on that answer: it
 * is on the profile details' `badge` (`GET /users/me/profile-fields`), which the screen already reads. A tier with no badge, or no name,
 * or no tier at all draws no pill.
 */
export function headerBadgeOf(tier: MyTier | null | undefined, personBadge: ProfileFields['badge'] | undefined): HeaderBadge | null {
  const held = runningTier(tier);
  const name = held?.tier?.name?.trim();
  const badge = held?.tier?.badge;
  if (!name || !badge) return null;
  const number = badge.numbered && personBadge?.numbered && typeof personBadge.number === 'number' ? personBadge.number : null;
  return { name, number };
}

/** The meter under the counts (M1): products used of what the tier allows, with "Verify · ends 26 Nov". Null with no running tier or no allowance. */
export type ProductsMeterView = { used: number; allowed: number; caption: string | undefined };

export function productsMeterOf(tier: MyTier | null | undefined): ProductsMeterView | null {
  const held = runningTier(tier);
  if (!held || !(held.productsAllowed > 0)) return null;
  return { used: held.productsUsed, allowed: held.productsAllowed, caption: productsMeterCaption(held.tier?.name, held.activeUntil) };
}
