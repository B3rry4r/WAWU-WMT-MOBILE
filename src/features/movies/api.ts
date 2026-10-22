import { useInfiniteQuery, useQuery, type QueryClient } from '@tanstack/react-query';

import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import type { components } from '@/api/schema.generated';

/**
 * Flix movies' own calls (FLIX-03, R-74, R-75), as the Hub's contract types them (`/api/hub/movies`, FLIX-01). The app
 * reads only the Hub: it never calls Flixora and holds no Flixora key. The Hub's success body is
 * `{ statusCode, message, data }` and a paged answer lifts its list into `data` with `pagination` beside it (the contract
 * types `data` only, SHARED-CHANGES.md row 11), so each call reads the envelope itself.
 */
export type MovieCard = components['schemas']['MovieCardView'];
export type MovieDetail = components['schemas']['MovieDetailView'];
export type MovieRail = components['schemas']['MovieRailView'];
export type MoviesHome = components['schemas']['MoviesHomeView'];
export type MovieFilters = components['schemas']['MovieFiltersView'];
export type MovieTrailer = components['schemas']['MovieTrailerView'];
export type MovieWatch = components['schemas']['MovieWatchView'];

export type MovieSort = 'newest' | 'rating' | 'views' | 'title';
export type BrowseFilter = { sort: MovieSort; genre: string | null; language: string | null; premiering: boolean };
export const noFilter: BrowseFilter = { sort: 'newest', genre: null, language: null, premiering: false };

type Envelope<T> = { statusCode?: number; message?: string; data?: T | null };
type PageEnvelope<T> = Envelope<T[]> & { pagination?: { nextPage?: number | null; total?: number } };
export type MoviePage = { items: MovieCard[]; total: number; nextPage: number | null };

/** How many titles a page holds. */
export const PAGE_SIZE = 20;

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

export const homeKey = ['movies', 'home'] as const;
export const filtersKey = ['movies', 'filters'] as const;
export const detailKey = (id: string) => ['movies', 'detail', id] as const;
export const browseKey = (filter: BrowseFilter) => ['movies', 'browse', filter] as const;
export const searchKey = (q: string) => ['movies', 'search', q] as const;

/** `GET /movies`: whether movies are on, the hero and the rails. Off is `{ enabled: false, hero: null, rails: [] }`. */
export async function fetchHome(): Promise<MoviesHome> {
  const body = (await unwrap(api.GET('/api/hub/movies'))) as unknown as Envelope<MoviesHome>;
  const home = body?.data;
  if (!home || typeof home.enabled !== 'boolean' || !Array.isArray(home.rails)) throw unreadable('movies');
  return home;
}

/** `GET /movies/filters`: the genres and languages the catalog holds now. */
export async function fetchFilters(): Promise<MovieFilters> {
  const body = (await unwrap(api.GET('/api/hub/movies/filters'))) as unknown as Envelope<MovieFilters>;
  const filters = body?.data;
  if (!filters || !Array.isArray(filters.genres) || !Array.isArray(filters.languages)) throw unreadable('filters');
  return filters;
}

function pageOf(body: PageEnvelope<MovieCard> | undefined, what: string): MoviePage {
  const items = body?.data;
  if (!Array.isArray(items)) throw unreadable(what);
  return { items, total: typeof body?.pagination?.total === 'number' ? body.pagination.total : items.length, nextPage: body?.pagination?.nextPage ?? null };
}

/** `GET /movies/browse`: "See all", a page at a time with a total. */
export async function fetchBrowse(filter: BrowseFilter, page: number, perPage: number = PAGE_SIZE): Promise<MoviePage> {
  const query = {
    sort: filter.sort,
    ...(filter.genre ? { genre: filter.genre } : {}),
    ...(filter.language ? { language: filter.language } : {}),
    ...(filter.premiering ? { premiering: true } : {}),
    page,
    perPage,
  };
  const body = (await unwrap(api.GET('/api/hub/movies/browse', { params: { query } }))) as unknown as PageEnvelope<MovieCard>;
  return pageOf(body, 'movies');
}

/** `GET /movies/search`: titles whose name or tagline holds the text, a page at a time with a total. */
export async function fetchSearch(q: string, page: number): Promise<MoviePage> {
  const body = (await unwrap(api.GET('/api/hub/movies/search', { params: { query: { q, page, perPage: PAGE_SIZE } } }))) as unknown as PageEnvelope<MovieCard>;
  return pageOf(body, 'results');
}

/** `GET /movies/{movieId}`: one title with its trailer and whether this person must agree to the terms first. */
export async function fetchDetail(movieId: string): Promise<MovieDetail> {
  const body = (await unwrap(api.GET('/api/hub/movies/{movieId}', { params: { path: { movieId } } }))) as unknown as Envelope<MovieDetail>;
  const movie = body?.data;
  if (!movie || typeof movie.id !== 'string') throw unreadable('movie');
  return movie;
}

/**
 * `POST /movies/{movieId}/watch`: a fresh signed-in link for this tap. The link carries a one-time token (V5): it is returned to
 * the caller that opens it and is never shown, stored or logged here. `agreeToTerms` is sent only when the person ticked the box.
 */
export async function watchMovie(movieId: string, agreeToTerms: boolean): Promise<string> {
  const body = (await unwrap(
    api.POST('/api/hub/movies/{movieId}/watch', { params: { path: { movieId } }, body: agreeToTerms ? { agreeToTerms: true } : {} }),
  )) as unknown as Envelope<MovieWatch>;
  const url = body?.data?.url;
  if (typeof url !== 'string' || url === '') throw unreadable('link');
  return url;
}

/** The home answer (hero and rails). Held for a short while so the rails on Home and Explore and the screen share one read. */
export function useMoviesHome(client: QueryClient = queryClient, enabled = true) {
  return useQuery({ queryKey: homeKey, queryFn: fetchHome, enabled, staleTime: 60_000 }, client);
}

/** A page at a time of the catalog under a filter. */
export function useBrowse(filter: BrowseFilter, client: QueryClient = queryClient, enabled = true) {
  return useInfiniteQuery(
    {
      queryKey: browseKey(filter),
      queryFn: ({ pageParam }) => fetchBrowse(filter, pageParam),
      initialPageParam: 1,
      getNextPageParam: (last) => last.nextPage ?? undefined,
      enabled,
    },
    client,
  );
}

/** A page at a time of what a search finds. */
export function useSearch(q: string, client: QueryClient = queryClient) {
  return useInfiniteQuery(
    {
      queryKey: searchKey(q),
      queryFn: ({ pageParam }) => fetchSearch(q, pageParam),
      initialPageParam: 1,
      getNextPageParam: (last) => last.nextPage ?? undefined,
      enabled: q.length > 0,
    },
    client,
  );
}
