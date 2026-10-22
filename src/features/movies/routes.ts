import { useRouter } from 'expo-router';

import { useSystemBack } from '@/features/professionals/parts';

import type { BrowseFilter, MovieSort } from './api';

const SORTS: readonly MovieSort[] = ['newest', 'rating', 'views', 'title'];

/** A browse as route parameters (`/movies/all?sort=rating&genre=Drama`): only what is set. */
export function browseParams(filter: Partial<BrowseFilter>): Record<string, string> {
  const params: Record<string, string> = {};
  if (filter.sort) params.sort = filter.sort;
  if (filter.genre) params.genre = filter.genre;
  if (filter.language) params.language = filter.language;
  if (filter.premiering) params.premiering = '1';
  return params;
}

/** The browse a route's parameters name; anything unreadable is left out. */
export function filterFromParams(params: { sort?: string; genre?: string; language?: string; premiering?: string }): Partial<BrowseFilter> {
  const filter: Partial<BrowseFilter> = {};
  if (params.sort && (SORTS as readonly string[]).includes(params.sort)) filter.sort = params.sort as MovieSort;
  if (params.genre) filter.genre = params.genre;
  if (params.language) filter.language = params.language;
  if (params.premiering === '1') filter.premiering = true;
  return filter;
}

/** Back a step, or Home when this screen was opened on its own; the phone's back button does the same. */
export function useLeave(): () => void {
  const router = useRouter();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  useSystemBack(leave);
  return leave;
}
