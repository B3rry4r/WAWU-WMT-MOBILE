import type { components } from '@/api/schema.generated';
import type { IconName } from '@/components/icon';

import { limits } from './limits';

/** The seven platforms M9 lists, as the Hub's `socialOrder` names them. */
export type SocialPlatform = NonNullable<components['schemas']['UpdateProfileFieldsDto']['socialOrder']>[number];

/** The default order, which is the contract's: M9 draws Instagram, TikTok, YouTube, X, Threads, LinkedIn, Facebook. */
export const PLATFORMS: readonly SocialPlatform[] = ['instagram', 'tiktok', 'youtube', 'x', 'threads', 'linkedin', 'facebook'];

type ProfileKey = 'instagramHandle' | 'tiktokHandle' | 'xHandle' | 'youtubeUrl' | 'facebookUrl' | 'linkedinUrl';

type Meta = {
  label: string;
  /** The brand mark in `@/components/icon`, where it has one. */
  mark: IconName | null;
  /** Where the Hub keeps it: a field of `PATCH /users/me`, or the Threads handle of `PATCH /users/me/profile-fields`. */
  field: ProfileKey | 'threadsHandle';
  /** A handle the Hub keeps bare, or a link it builds from one (wawu-backend `social-handles.ts`). */
  kind: 'handle' | 'link';
  /** The link the Hub builds from a handle, so the form can show the handle back. */
  base?: string;
  max: number;
};

export const SOCIAL: Record<SocialPlatform, Meta> = {
  instagram: { label: 'Instagram', mark: 'Instagram', field: 'instagramHandle', kind: 'handle', max: limits.socialHandle },
  tiktok: { label: 'TikTok', mark: 'TikTok', field: 'tiktokHandle', kind: 'handle', max: limits.socialHandle },
  youtube: { label: 'YouTube', mark: 'YouTube', field: 'youtubeUrl', kind: 'link', base: 'https://youtube.com/@', max: limits.socialUrl },
  x: { label: 'X', mark: 'XTwitter', field: 'xHandle', kind: 'handle', max: limits.socialHandle },
  threads: { label: 'Threads', mark: 'Threads', field: 'threadsHandle', kind: 'handle', max: limits.socialHandle },
  linkedin: { label: 'LinkedIn', mark: null, field: 'linkedinUrl', kind: 'link', base: 'https://linkedin.com/in/', max: limits.socialUrl },
  facebook: { label: 'Facebook', mark: 'Facebook', field: 'facebookUrl', kind: 'link', base: 'https://facebook.com/', max: limits.socialUrl },
};

export type SocialHandles = Record<SocialPlatform, string>;

export const emptyHandles = (): SocialHandles => ({ instagram: '', tiktok: '', youtube: '', x: '', threads: '', linkedin: '', facebook: '' });

/** What the person typed, as a bare handle: no "@" in front, no spaces round it. A pasted link is kept whole. */
export function bareHandle(typed: string): string {
  return typed.trim().replace(/^@+/, '');
}

/** A stored link back to the handle it was built from (the Hub's `toHandle`); a link that is not ours stays a link. */
export function handleOf(platform: SocialPlatform, stored: string | null | undefined): string {
  const value = (stored ?? '').trim();
  if (!value) return '';
  const base = SOCIAL[platform].base;
  return base && value.startsWith(base) ? value.slice(base.length) : value;
}

/**
 * The platforms with something typed, in the order the person set: the Hub's
 * `socialOrder` first (the ones that are filled), then any other filled one in
 * the default order. An empty `socialOrder` is the default order.
 */
export function orderOf(handles: SocialHandles, saved: readonly string[]): SocialPlatform[] {
  const filled = (p: SocialPlatform) => handles[p] !== '';
  const first = saved.filter((key): key is SocialPlatform => (PLATFORMS as readonly string[]).includes(key)).filter(filled);
  return [...first, ...PLATFORMS.filter((p) => filled(p) && !first.includes(p))];
}

/** The platforms not yet added, in the default order: M9's "Add" rows. */
export function unaddedOf(order: readonly SocialPlatform[]): SocialPlatform[] {
  return PLATFORMS.filter((p) => !order.includes(p));
}

/** A row moved from one place in the list to another. */
export function moved<T>(list: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return [...list];
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** The sentence for a handle that cannot be saved, or null. */
export function socialProblem(platform: SocialPlatform, handle: string): string | null {
  if (/\s/.test(handle)) return `${SOCIAL[platform].label}: no spaces.`;
  if (handle.length > SOCIAL[platform].max) return `${SOCIAL[platform].label}: at most ${SOCIAL[platform].max} characters.`;
  return null;
}
