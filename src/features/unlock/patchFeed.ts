import type { QueryClient } from '@tanstack/react-query';

import type { FeedEntry, FeedItem } from '@/features/feed/api';

type Page = { entries: FeedEntry[]; nextPage: number | null };
type Feed = { pages: Page[]; pageParams: unknown[] };

const isFeed = (data: unknown): data is Feed =>
  typeof data === 'object' && data !== null && Array.isArray((data as { pages?: unknown }).pages);

/**
 * A piece the person just unlocked, in every feed the app holds: its full file is theirs now, so the post stops being locked and
 * plays or reads the whole thing in place (H16's Watch now). The Hub's own answer is the source (`fullAssetUrl` from the unlock,
 * `media` from `GET /content/{id}/media`), never anything made up here. `['feed', 'me']` and the like share the key's start and are
 * left alone: they are not pages.
 */
export function applyUnlock(client: QueryClient, id: string, change: { fullAssetUrl: string | null; media?: FeedItem['media'] | null }): void {
  client.setQueriesData<unknown>({ queryKey: ['feed'] }, (data: unknown) => {
    if (!isFeed(data)) return data;
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        entries: page.entries.map((entry) =>
          entry.kind === 'content' && entry.content.id === id
            ? {
                ...entry,
                content: {
                  ...entry.content,
                  fullAssetLocked: false,
                  fullAssetUrl: change.fullAssetUrl ?? entry.content.fullAssetUrl,
                  media: change.media ?? entry.content.media,
                },
              }
            : entry,
        ),
      })),
    };
  });
}
