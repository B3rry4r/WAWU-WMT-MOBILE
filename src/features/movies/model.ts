import type { AvatarHue } from '@/components/Avatar';
import { dateWords } from '@/features/wallet/history/lagosTime';

import type { MovieCard, MovieDetail, MovieSort } from './api';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const LAGOS_OFFSET_MS = 60 * 60 * 1000;

/** The cast's circles take these hues in turn (MV2). */
const CAST_HUES: readonly AvatarHue[] = ['pink', 'sky', 'lemon', 'green', 'coral', 'lilac'];
export const castHue = (index: number): AvatarHue => CAST_HUES[index % CAST_HUES.length];

/** "1h 40m", "52m", "2h": the length of a film, or null when the Hub has none. */
export function runtimeText(minutes: number | null | undefined): string | null {
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) return null;
  const whole = Math.round(minutes);
  const h = Math.floor(whole / 60);
  const m = whole % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * The genres a person can choose from, one chip each. Flixora writes some titles' genres as one compound word ("Comedy | Thriller"),
 * and the Hub serves them as written (R-74), so each is split at "|", trimmed and made unique, in the Hub's own order (plain
 * alphabetical), and an empty piece is dropped. "Comedy" and "Comedy | Thriller" give "Comedy" and "Thriller", once each.
 */
export function genreChoices(genres: readonly string[] | null | undefined): string[] {
  const seen = new Set<string>();
  for (const g of genres ?? []) {
    for (const part of g.split('|')) {
      const name = part.trim();
      if (name !== '') seen.add(name);
    }
  }
  return [...seen].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/** The one genre a line names: the first, with a compound one cut at its first "|" ("Comedy | Thriller" is "Comedy"). */
const firstGenre = (genre: readonly string[]): string | undefined => genre[0]?.split('|')[0]?.trim() || undefined;

const joined = (parts: (string | number | null | undefined)[]) => parts.filter((p) => p !== null && p !== undefined && p !== '').join(' · ');

/** A card's line under the title: "Drama · 2024" (the first genre, then the year). */
export function cardLine(movie: Pick<MovieCard, 'genre' | 'year'>): string {
  return joined([firstGenre(movie.genre), movie.year]);
}

/** The hero's line: "Drama · 2024 · 1h 40m · PG-13". */
export function heroLine(movie: MovieCard): string {
  return joined([firstGenre(movie.genre), movie.year, runtimeText(movie.runtimeMinutes), movie.ageRating]);
}

/** The movie page's line under the title: "Drama · 2024 · 1h 40m". */
export function pageLine(movie: Pick<MovieCard, 'genre' | 'year' | 'runtimeMinutes'>): string {
  return joined([firstGenre(movie.genre), movie.year, runtimeText(movie.runtimeMinutes)]);
}

/** "4.5", one decimal, as the poster's badge draws it. */
export const ratingText = (rating: number): string => (Math.round(rating * 10) / 10).toFixed(1);

/** "1,830": a count with thousands commas (the digits are grouped by hand, so every phone writes them alike). */
export const countText = (n: number): string => String(Math.max(0, Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** A title nobody has rated yet shows "New" in the rating's place (MV9). */
export const isRated = (movie: Pick<MovieCard, 'rating' | 'ratingCount'>): boolean => movie.ratingCount > 0 && movie.rating > 0;

/** The line under the stars on the movie page: "4.5 (12 ratings)" and "1,830 views". */
export function ratingWords(movie: Pick<MovieCard, 'rating' | 'ratingCount'>): string {
  const count = movie.ratingCount;
  return `${ratingText(movie.rating)} (${countText(count)} ${count === 1 ? 'rating' : 'ratings'})`;
}

const parse = (iso: string | null | undefined): Date | null => {
  if (!iso) return null;
  const at = new Date(iso);
  return Number.isNaN(at.getTime()) ? null : at;
};

/** True while the premiere date is still ahead: only the trailer is out until then (MV9). */
export function premiereAhead(movie: Pick<MovieCard, 'premiering' | 'premierDate'>, now: Date): boolean {
  if (!movie.premiering) return false;
  const at = parse(movie.premierDate);
  return at !== null && at.getTime() > now.getTime();
}

/** "Premieres Fri 24 Oct": the premiere's day in Lagos, with the year when it is not this one. */
export function premiereText(premierDate: string | null, now: Date): string | null {
  const at = parse(premierDate);
  if (!at) return null;
  const weekday = WEEKDAYS[new Date(at.getTime() + LAGOS_OFFSET_MS).getUTCDay()];
  return `Premieres ${weekday} ${dateWords(at, now)}`;
}

/** The tags under a movie's title: age rating, language, country, each only when the Hub has it. */
export function tagsOf(movie: Pick<MovieDetail, 'ageRating' | 'language' | 'countryOfOrigin'>): string[] {
  return [movie.ageRating, movie.language, movie.countryOfOrigin].filter((t): t is string => typeof t === 'string' && t !== '');
}

/** MV7's sort control, in the board's order. */
export const SORTS: readonly { value: MovieSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Top rated' },
  { value: 'views', label: 'Most watched' },
  { value: 'title', label: 'A–Z' },
];

/** "148 movies", "1 movie". */
export const totalText = (n: number): string => `${countText(n)} ${n === 1 ? 'movie' : 'movies'}`;

/** How many filters are set on top of the sort: the genre, the language and premiering only. */
export const activeFilters = (f: { genre: string | null; language: string | null; premiering: boolean }): number =>
  (f.genre ? 1 : 0) + (f.language ? 1 : 0) + (f.premiering ? 1 : 0);

/** Opens a movie's page. */
export const moviePath = (id: string) => ({ pathname: '/movies/[id]' as const, params: { id } });
