import type { Work, WorkDetail, Works, WorkMedia } from './api';

/**
 * What the works screens decide from the Hub's data, kept apart from the drawing so each rule is
 * tested on its own. Every figure is read from a field the Hub serves; a field that is empty
 * leaves its row out and never gets a stand-in.
 */

/** The chip that shows every work. A category chip's value is this prefix and the category, so a category named "all" is not mistaken for it. */
export const ALL_WORKS = 'all';
const CATEGORY_PREFIX = 'category:';

export type CategoryChip = { value: string; label: string };

/** M34's filters: All, then one per category the person used, as the Hub counts them. None when there is nothing to filter by. */
export function chipsFor(categories: Works['categories']): CategoryChip[] {
  if (categories.length === 0) return [];
  return [{ value: ALL_WORKS, label: 'All' }, ...categories.map((c) => ({ value: `${CATEGORY_PREFIX}${c.name}`, label: c.name }))];
}

/** The category a chip asks the Hub for, or null for All. */
export function categoryOfChip(value: string): string | null {
  return value.startsWith(CATEGORY_PREFIX) ? value.slice(CATEGORY_PREFIX.length) : null;
}

export function chipOfCategory(category: string | null): string {
  return category === null ? ALL_WORKS : `${CATEGORY_PREFIX}${category}`;
}

/** "Director · 2025", the line under a work's title. */
export function bylineOf(work: Pick<Work, 'role' | 'year'>): string {
  return `${work.role} · ${work.year}`;
}

/** M34's bar: "Lennox Emmanuel · 12". Without a name the count stands alone. */
export function headerSubtitle(name: string | null, count: number): string {
  return name ? `${name} · ${count}` : String(count);
}

export type Fact = { key: 'role' | 'client' | 'year' | 'link' | 'category'; label: string; value: string };

/** M35's rows: Role, Client, Year as drawn, then the link and category only when the person gave them. */
export function factsOf(work: Pick<WorkDetail, 'role' | 'client' | 'year' | 'link' | 'category'>): Fact[] {
  const rows: Fact[] = [{ key: 'role', label: 'Role', value: work.role }];
  if (work.client) rows.push({ key: 'client', label: 'Client', value: work.client });
  rows.push({ key: 'year', label: 'Year', value: String(work.year) });
  if (work.category) rows.push({ key: 'category', label: 'Category', value: work.category });
  if (work.link) rows.push({ key: 'link', label: 'Link', value: work.link });
  return rows;
}

/** A link a phone can open: http or https. A `wawu/...` link is a name inside the app, shown as words. */
export function isWebLink(link: string): boolean {
  return /^https?:\/\//i.test(link);
}

/** The first picture or video is the cover: what M35 puts at the top. */
export function coverOf(work: Pick<Work, 'media'>): WorkMedia | null {
  return work.media[0] ?? null;
}

/**
 * What a card in M34's grid shows: a video has no poster image (BACKEND_GAPS.md G-152), so the first photo of the
 * work stands in for it when there is one. With no photo, the cover is shown as it is (a video's first frame where
 * this build can play one, a quiet block where it cannot).
 */
export function stillOf(work: Pick<Work, 'media'>): WorkMedia | null {
  return work.media.find((media) => media.kind === 'image') ?? coverOf(work);
}

/** What the sharing sheet carries: the work, who made it, and its link when there is one. Nothing about the app is promised. */
export function shareText(work: Pick<WorkDetail, 'title' | 'link' | 'owner'>): string {
  const by = work.owner.displayName ? `${work.title}, by ${work.owner.displayName}` : work.title;
  return work.link ? `${by}\n${work.link}` : by;
}
