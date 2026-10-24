import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * Search's calls (X5 to X12, EXPLORE-02 on EXPLORE-05's routes), as the Hub's contract types them:
 * - `GET /search`: content, creators and communities for a text. The app sends `include=communities`, because the
 *   route is protected and the website, which never sends `include`, gets `communities` empty;
 * - `GET /search/suggestions`: the person's recent searches (the app sends `include=recent`; without it
 *   `recentSearches` is empty, as it is for the website) and the creators to know;
 * - `GET /search/popular`: what many different people searched lately (empty until three people searched the same
 *   thing), never read from `popularSearches` of the suggestions;
 * - `POST` and `DELETE /search/recent`: remember a search the person submitted; Clear;
 * - `GET /search/closest`: the nearest content when nothing matched (X10);
 * - `GET /search/people`: the names, field, ticks and follow state of the people a result names (this task).
 */
export type SearchContent = components['schemas']['ContentPieceResponse'];
export type SearchCreator = components['schemas']['CreatorProfile'];
export type SearchCommunity = components['schemas']['CommunityResponse'];
export type SearchPerson = components['schemas']['SearchPerson'];
export type SearchSuggestions = components['schemas']['SearchSuggestions'];

export type SearchAnswer = { content: SearchContent[]; creators: SearchCreator[]; communities: SearchCommunity[] };

/** The Hub's own cap on each list of a search ("search is discovery, not pagination"), written down so the counts say what is shown. */
export const MAX_RESULTS = 20;
/** The most people one `GET /search/people` call describes. */
export const MAX_PEOPLE = 50;
/** The longest search the Hub takes. */
export const MAX_QUERY = 100;

type Envelope<T> = { data?: T | null };

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

function dataOf<T>(body: unknown, what: string): T {
  const data = (body as Envelope<T> | null)?.data;
  if (!data || typeof data !== 'object') throw unreadable(what);
  return data;
}

function listOf<T>(value: unknown, what: string): T[] {
  if (!Array.isArray(value)) throw unreadable(what);
  return value as T[];
}

export const searchKey = ['search'] as const;
export const resultsKey = (q: string) => ['search', 'results', q] as const;
export const closestKey = (q: string) => ['search', 'closest', q] as const;
export const suggestionsKey = ['search', 'suggestions'] as const;
export const popularKey = ['search', 'popular'] as const;
/** Under the Explore key, so a Follow on any list turns the same person's button here too (`useFollow`). */
export const peopleKey = (ids: readonly string[]) => ['explore', 'search-people', ids.join(',')] as const;

/** Everything a text finds: content, creators and the communities whose name matches. */
export async function fetchSearch(q: string): Promise<SearchAnswer> {
  const data = dataOf<Partial<SearchAnswer>>(
    await unwrap(api.GET('/api/hub/search', { params: { query: { q, tab: 'all', include: 'communities' } } })),
    'results',
  );
  return {
    content: listOf<SearchContent>(data.content, 'results').slice(0, MAX_RESULTS),
    creators: listOf<SearchCreator>(data.creators, 'results').slice(0, MAX_RESULTS),
    communities: listOf<SearchCommunity>(data.communities, 'results').slice(0, MAX_RESULTS),
  };
}

/** The nearest content when a text matched nothing. */
export async function fetchClosest(q: string): Promise<SearchContent[]> {
  const data = dataOf<{ items?: unknown }>(await unwrap(api.GET('/api/hub/search/closest', { params: { query: { q } } })), 'closest results');
  return listOf<SearchContent>(data.items, 'closest results');
}

/** The person's recent searches (newest first) and the creators to know. */
export async function fetchSuggestions(): Promise<SearchSuggestions> {
  const data = dataOf<Partial<SearchSuggestions>>(
    await unwrap(api.GET('/api/hub/search/suggestions', { params: { query: { include: 'recent' } } })),
    'suggestions',
  );
  return {
    recentSearches: listOf<string>(data.recentSearches, 'suggestions'),
    popularSearches: [],
    suggestedCreators: listOf<SearchCreator>(data.suggestedCreators, 'suggestions'),
  };
}

/** What many people searched lately. May be empty. */
export async function fetchPopular(): Promise<string[]> {
  const data = dataOf<{ items?: unknown }>(await unwrap(api.GET('/api/hub/search/popular')), 'popular searches');
  return listOf<string>(data.items, 'popular searches');
}

/** Remembers a search the person submitted (not every key they type). */
export async function recordRecent(q: string): Promise<void> {
  await unwrap(api.POST('/api/hub/search/recent', { body: { q } }));
}

/** Clear: forgets every recent search of the person's. */
export async function clearRecent(): Promise<void> {
  await unwrap(api.DELETE('/api/hub/search/recent'));
}

/** The people a result names, in the order asked. A person the Hub may not show is left out. */
export async function fetchPeople(ids: readonly string[]): Promise<SearchPerson[]> {
  const data = dataOf<{ items?: unknown }>(
    await unwrap(api.GET('/api/hub/search/people', { params: { query: { ids: ids.slice(0, MAX_PEOPLE).join(',') } } })),
    'people',
  );
  return listOf<SearchPerson>(data.items, 'people');
}
