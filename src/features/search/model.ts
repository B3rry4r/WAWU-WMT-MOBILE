import { membersFull } from '@/features/communities/format';
import { nairaToKobo } from '@/features/feed/api';

import { MAX_PEOPLE, type SearchAnswer, type SearchCommunity, type SearchContent, type SearchCreator, type SearchPerson } from './api';

export type SearchTab = 'all' | 'content' | 'creators' | 'communities';

export const TAB_LABELS: Record<SearchTab, string> = { all: 'All', content: 'Content', creators: 'Creators', communities: 'Communities' };
export const TAB_ORDER: readonly SearchTab[] = ['all', 'content', 'creators', 'communities'];

/** How many rows of each kind the All tab shows before "See all" (X6 draws 3, 2 and 1). */
export const PREVIEW = { content: 3, creators: 2, communities: 1 } as const;

const typeLabels: Record<string, string> = { video: 'Video', course: 'Course', audio: 'Audio', pdf: 'PDF', image: 'Image', template: 'Template' };

/** "PDF", "Video": the kind of a piece, as X6 and X7 write it. A kind the app does not know yet reads as its own word. */
export function typeLabel(contentType: string): string {
  return typeLabels[contentType] ?? contentType.charAt(0).toUpperCase() + contentType.slice(1);
}

export type ContentRowModel = {
  id: string;
  title: string;
  /** "Kemi Okafor · PDF", or just "PDF" when the Hub did not name the creator. */
  byline: string;
  thumb: string | null;
  /** Paid and not bought: the picture is blurred and carries a lock. */
  locked: boolean;
  /** The price in kobo for a paid piece; null for a free one (the row says Free). */
  priceKobo: number | null;
};

export function contentRows(items: readonly SearchContent[], people: ReadonlyMap<string, SearchPerson>): ContentRowModel[] {
  return items.map((piece) => {
    const who = people.get(piece.creatorWawuId)?.name;
    const kind = typeLabel(piece.contentType);
    return {
      id: piece.id,
      title: piece.title,
      byline: who ? `${who} · ${kind}` : kind,
      thumb: piece.previewAssetUrl ? piece.previewAssetUrl : null,
      locked: piece.fullAssetLocked,
      priceKobo: piece.accessType === 'paid' ? nairaToKobo(piece.price) : null,
    };
  });
}

/** The creators of a result the Hub named, in the order of the result. Someone it will not name (off member lists, blocked) has no row. */
export function namedCreators(creators: readonly SearchCreator[], people: ReadonlyMap<string, SearchPerson>): SearchPerson[] {
  const rows: SearchPerson[] = [];
  for (const c of creators) {
    const person = people.get(c.wawuUserId);
    if (person) rows.push(person);
  }
  return rows;
}

export function peopleMap(list: readonly SearchPerson[] | undefined): Map<string, SearchPerson> {
  return new Map((list ?? []).map((p) => [p.wawuId, p]));
}

/** The ids whose names a result needs: its creators, then the makers of its content, each once, at most one call's worth. */
export function personIds(creators: readonly SearchCreator[], content: readonly SearchContent[]): string[] {
  const ids = new Set<string>();
  for (const c of creators) ids.add(c.wawuUserId);
  for (const piece of content) ids.add(piece.creatorWawuId);
  return [...ids].slice(0, MAX_PEOPLE);
}

export type Counts = Record<SearchTab, number>;

export function countsOf(answer: SearchAnswer | undefined, creators: readonly SearchPerson[]): Counts {
  const content = answer?.content.length ?? 0;
  const communities = answer?.communities.length ?? 0;
  return { all: content + creators.length + communities, content, creators: creators.length, communities };
}

/** "380 members · private", "1 member · open". */
export function communityLine(room: Pick<SearchCommunity, 'memberCount' | 'kind'>): string {
  return `${membersFull(room.memberCount)} · ${room.kind}`;
}

/** The text of a search as the Hub takes it: trimmed, and no longer than it allows. */
export function cleanQuery(text: string, max: number): string {
  return text.trim().slice(0, max);
}
