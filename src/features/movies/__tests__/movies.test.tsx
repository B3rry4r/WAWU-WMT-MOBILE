import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { ApiError } from '@/api/errors';
import { queryClient } from '@/api/query';

import type { MovieCard, MovieDetail } from '../api';
import { AllMoviesScreen } from '../AllMoviesScreen';
import { FlixRail, railMovies } from '../FlixRail';
import { MovieScreen } from '../MovieScreen';
import { MoviesScreen } from '../MoviesScreen';
import { SearchScreen } from '../SearchScreen';
import { WatchFlow, watchProblem } from '../WatchFlow';

jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);

const mockGet = jest.fn();
const mockPost = jest.fn();
jest.mock('@/api/client', () => ({ api: { GET: (...a: unknown[]) => mockGet(...a), POST: (...a: unknown[]) => mockPost(...a) }, unwrap: (p: Promise<{ data: unknown }>) => p.then((r) => r.data) }));

const card = (id: string, o: Partial<MovieCard> = {}): MovieCard => ({
  id,
  title: `Title ${id}`,
  genre: ['Drama'],
  language: 'English',
  year: 2024,
  runtimeMinutes: 100,
  ageRating: 'PG-13',
  posterImage: null,
  backdropImage: null,
  rating: 4.5,
  ratingCount: 12,
  views: 1830,
  premiering: false,
  premierDate: null,
  addedAt: '2026-10-01T00:00:00.000Z',
  ...o,
});
const detail = (id: string, o: Partial<MovieDetail> = {}): MovieDetail => ({
  ...card(id),
  originalTitle: null,
  synopsis: 'A synopsis.',
  tagline: null,
  countryOfOrigin: 'Nigeria',
  cast: [{ name: 'Ada Obi', character: 'Ifeoma' }],
  trailer: { kind: 'file', url: 'https://cdn.example.test/t.mp4' },
  mustAgreeTerms: false,
  ...o,
});
const page = (items: MovieCard[], total = items.length) => ({ response: { ok: true, status: 200, headers: new Headers() }, data: { statusCode: 200, message: 'OK', data: items, pagination: { currentPage: 1, nextPage: null, perPage: 20, total } } });
const ok = (data: unknown) => ({ response: { ok: true, status: 200, headers: new Headers() }, data: { statusCode: 200, message: 'OK', data } });
const home = (enabled: boolean, rails = [{ key: 'new', title: 'New on Flixora', movies: [card('m1'), card('m2')] }]) => ok({ enabled, hero: enabled ? card('m1') : null, rails: enabled ? rails : [] });

const wrap = (ui: React.ReactElement) => <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>;

beforeEach(() => {
  // The app retries a failed read; the failure cases here should settle at once.
  queryClient.setDefaultOptions({ queries: { retry: false, staleTime: 0 } });
  queryClient.clear();
  mockGet.mockReset();
  mockPost.mockReset();
});

describe('FLIX-03 · the Flix movies rail (R-27, R-47)', () => {
  it('draws nothing at all when the Hub answers enabled: false', async () => {
    mockGet.mockResolvedValue(home(false));
    await render(wrap(<FlixRail onSeeAll={jest.fn()} onOpenMovie={jest.fn()} />));
    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    expect(screen.queryByTestId('flix-rail')).toBeNull();
    expect(screen.queryByText('Flix movies')).toBeNull();
  });

  it('draws nothing when the Hub cannot be read (never an error or an empty frame)', async () => {
    mockGet.mockRejectedValue(new ApiError('server', 500, 'Down'));
    await render(wrap(<FlixRail onSeeAll={jest.fn()} onOpenMovie={jest.fn()} />));
    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    expect(screen.queryByTestId('flix-rail')).toBeNull();
  });

  it('shows the Hub titles; See all opens Flix movies and a card opens the movie', async () => {
    mockGet.mockResolvedValue(home(true));
    const onSeeAll = jest.fn();
    const onOpenMovie = jest.fn();
    await render(wrap(<FlixRail onSeeAll={onSeeAll} onOpenMovie={onOpenMovie} />));
    expect(await screen.findByText('Title m1')).toBeTruthy();
    expect(screen.getByText('Flix movies')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('flix-rail-see-all'));
    expect(onSeeAll).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByTestId('flix-rail-m2'));
    expect(onOpenMovie).toHaveBeenCalledWith('m2');
  });

  it('uses the new rail, else the first rail that holds titles', () => {
    expect(railMovies([{ key: 'top_rated', movies: [card('a')] }, { key: 'new', movies: [card('b')] }])?.[0].id).toBe('b');
    expect(railMovies([{ key: 'new', movies: [] }, { key: 'top_rated', movies: [card('a')] }])?.[0].id).toBe('a');
    expect(railMovies([{ key: 'new', movies: [] }])).toBeNull();
  });
});

describe('FLIX-03 · MV1, MV11, MV12', () => {
  const props = { onBack: jest.fn(), onSearch: jest.fn(), onOpenMovie: jest.fn(), onWatch: jest.fn(), onTrailer: jest.fn(), onBrowse: jest.fn(), onOpenTab: jest.fn() };

  it('MV11 while loading, then the Hub hero and rails; See all browses that rail', async () => {
    mockGet.mockImplementation((path: string) => Promise.resolve(path.endsWith('/filters') ? ok({ genres: ['Drama', 'Comedy'], languages: ['English'] }) : home(true, [{ key: 'top_rated', title: 'Top rated', movies: [card('m3')] }])));
    await render(wrap(<MoviesScreen {...props} />));
    expect(screen.getByTestId('movies-loading')).toBeTruthy();
    expect(await screen.findByTestId('flix-hero')).toBeTruthy();
    expect(screen.getByText('Drama · 2024 · 1h 40m · PG-13')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('movies-rail-top_rated-see-all'));
    expect(props.onBrowse).toHaveBeenCalledWith({ sort: 'rating' });
    await fireEvent.press(screen.getByTestId('flix-hero-watch'));
    expect(props.onWatch).toHaveBeenCalledWith('m1');
    await fireEvent.press(screen.getByTestId('flix-hero-trailer'));
    expect(props.onTrailer).toHaveBeenCalledWith('m1');
  });

  it('draws the app tab bar under MV1 and a tab leaves for that tab', async () => {
    mockGet.mockImplementation((path: string) => Promise.resolve(path.endsWith('/filters') ? ok({ genres: [], languages: [] }) : home(true)));
    await render(wrap(<MoviesScreen {...props} />));
    await screen.findByTestId('flix-hero');
    expect(screen.getByText('Explore')).toBeTruthy();
    await fireEvent.press(screen.getByText('Inbox'));
    expect(props.onOpenTab).toHaveBeenCalledWith('inbox');
  });

  it('MV1 draws nothing but the bar while movies are off (the gate is leaving)', async () => {
    mockGet.mockResolvedValue(home(false));
    await render(wrap(<MoviesScreen {...props} />));
    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByTestId('movies-loading')).toBeNull());
    expect(screen.queryByTestId('movies-error')).toBeNull();
    expect(screen.queryByTestId('flix-hero')).toBeNull();
  });

  it('MV12 when the Hub fails, with Try again', async () => {
    mockGet.mockRejectedValue(new ApiError('network', 0, 'No connection'));
    await render(wrap(<MoviesScreen {...props} />));
    expect(await screen.findByText("Couldn't load movies")).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });
});

describe('FLIX-03 · MV6, MV7, MV8, MV10', () => {
  it('MV6 shows the Hub total and the chosen sort', async () => {
    mockGet.mockImplementation((path: string) => Promise.resolve(path.endsWith('/filters') ? ok({ genres: ['Drama'], languages: ['English'] }) : page([card('a'), card('b')], 148)));
    await render(wrap(<AllMoviesScreen onBack={jest.fn()} onSearch={jest.fn()} onOpenMovie={jest.fn()} initial={{ sort: 'rating' }} />));
    expect(await screen.findByText('148 movies')).toBeTruthy();
    expect(screen.getByText('Top rated')).toBeTruthy();
    const call = mockGet.mock.calls.find((c) => String(c[0]).endsWith('/browse'));
    expect(call?.[1].params.query).toMatchObject({ sort: 'rating', page: 1 });
  });

  it('a filter that finds nothing shows the empty answer with Clear filters', async () => {
    mockGet.mockImplementation((path: string) => Promise.resolve(path.endsWith('/filters') ? ok({ genres: [], languages: [] }) : page([], 0)));
    await render(wrap(<AllMoviesScreen onBack={jest.fn()} onSearch={jest.fn()} onOpenMovie={jest.fn()} initial={{ genre: 'Horror' }} />));
    expect(await screen.findByTestId('movies-all-empty')).toBeTruthy();
    expect(screen.getByText('Clear filters')).toBeTruthy();
  });

  it('MV8 searches the Hub and shows the total; MV10 for nothing found', async () => {
    mockGet.mockImplementation((_path: string, o: { params: { query: { q: string } } }) => Promise.resolve(o.params.query.q === 'lagos' ? page([card('a', { title: 'The Lagos Line' })], 1) : page([], 0)));
    await render(wrap(<SearchScreen onBack={jest.fn()} onOpenMovie={jest.fn()} />));
    await fireEvent.changeText(screen.getByTestId('movies-search-field'), 'lagos');
    expect(await screen.findByText('The Lagos Line')).toBeTruthy();
    expect(screen.getByText('1 movie')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('movies-search-field'), 'zombie musical');
    expect(await screen.findByText('No movies for "zombie musical"')).toBeTruthy();
  });
});

describe('FLIX-03 · MV4 and MV5, the watch link (R-75, V5)', () => {
  let open: jest.SpyInstance;
  beforeEach(() => {
    open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });
  afterEach(() => open.mockRestore());
  const flow = (mustAgreeTerms: boolean) => render(wrap(<WatchFlow movieId="m1" title="Golden Sunset" mustAgreeTerms={mustAgreeTerms} visible onClose={jest.fn()} />));

  it('draws no consent box when the Hub says the person has agreed, and sends no agreement', async () => {
    mockPost.mockResolvedValue(ok({ url: 'https://flixora.example.test/login#token=one', expiresAt: '2026-10-22T12:00:00Z' }));
    await flow(false);
    expect(screen.queryByTestId('flix-consent')).toBeNull();
    await fireEvent.press(screen.getByTestId('flix-open'));
    await waitFor(() => expect(open).toHaveBeenCalledWith('https://flixora.example.test/login#token=one'));
    expect(mockPost.mock.calls[0][1].body).toEqual({});
  });

  it('with mustAgreeTerms the box is drawn, Open Flixora waits for the tick, and the tap sends agreeToTerms: true', async () => {
    mockPost.mockResolvedValue(ok({ url: 'https://flixora.example.test/login#token=two', expiresAt: '2026-10-22T12:00:00Z' }));
    await flow(true);
    expect(screen.getByTestId('flix-consent')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('flix-open'));
    expect(mockPost).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('flix-consent'));
    await fireEvent.press(screen.getByTestId('flix-open'));
    await waitFor(() => expect(open).toHaveBeenCalledTimes(1));
    expect(mockPost.mock.calls[0][1].body).toEqual({ agreeToTerms: true });
  });

  it('a second tap asks for a fresh link; the link is not drawn anywhere', async () => {
    mockPost.mockResolvedValueOnce(ok({ url: 'https://flixora.example.test/a#token=1', expiresAt: 'x' })).mockResolvedValueOnce(ok({ url: 'https://flixora.example.test/a#token=2', expiresAt: 'x' }));
    await flow(false);
    await fireEvent.press(screen.getByTestId('flix-open'));
    await waitFor(() => expect(open).toHaveBeenCalledTimes(1));
    await fireEvent.press(screen.getByTestId('flix-open'));
    await waitFor(() => expect(open).toHaveBeenCalledTimes(2));
    expect(open.mock.calls[0][0]).not.toBe(open.mock.calls[1][0]);
    expect(screen.queryByText(/token=/)).toBeNull();
  });

  it('a 409 and a 503 each say one plain sentence and open nothing', async () => {
    mockPost.mockRejectedValueOnce(new ApiError('conflict', 409, 'x', 'terms_not_agreed'));
    await flow(false);
    await fireEvent.press(screen.getByTestId('flix-open'));
    expect(await screen.findByText('Tick the box to agree to the terms, then try again.')).toBeTruthy();
    mockPost.mockRejectedValueOnce(new ApiError('server', 503, 'x', 'movies_unavailable'));
    await fireEvent.press(screen.getByTestId('flix-open'));
    expect(await screen.findByText('Flixora couldn’t be opened just now. Try again in a moment.')).toBeTruthy();
    expect(open).not.toHaveBeenCalled();
    expect(watchProblem(new Error('x'))).toBe('Flixora couldn’t be opened. Try again.');
  });
});

describe('FLIX-03 · MV2, MV9 and the trailer', () => {
  const NOW = new Date('2026-10-22T10:00:00Z');
  const base = { movieId: 'm1', onBack: jest.fn(), onTrailer: jest.fn(), now: NOW };

  it('MV2 shows the Hub movie; a file trailer opens MV3', async () => {
    mockGet.mockResolvedValue(ok(detail('m1')));
    const onTrailer = jest.fn();
    await render(wrap(<MovieScreen {...base} onTrailer={onTrailer} />));
    expect(await screen.findByText('Title m1')).toBeTruthy();
    expect(screen.getByText('4.5 (12 ratings)')).toBeTruthy();
    expect(screen.getByText('Plays on Flixora in Chrome or Edge on a computer')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('movie-trailer'));
    expect(onTrailer).toHaveBeenCalled();
  });

  it('a youtube trailer opens outside the app', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    mockGet.mockResolvedValue(ok(detail('m1', { trailer: { kind: 'youtube', url: 'https://www.youtube.com/watch?v=abc' } })));
    const onTrailer = jest.fn();
    await render(wrap(<MovieScreen {...base} onTrailer={onTrailer} />));
    await fireEvent.press(await screen.findByTestId('movie-trailer'));
    expect(open).toHaveBeenCalledWith('https://www.youtube.com/watch?v=abc');
    expect(onTrailer).not.toHaveBeenCalled();
    open.mockRestore();
  });

  it('MV9: before the premiere only the trailer is offered', async () => {
    mockGet.mockResolvedValue(ok(detail('m1', { premiering: true, premierDate: '2026-10-24T09:00:00Z', ratingCount: 0, rating: 0, views: 0 })));
    await render(wrap(<MovieScreen {...base} />));
    expect(await screen.findByText('Premieres Sat 24 Oct')).toBeTruthy();
    expect(screen.getByText('Only the trailer is out until the premiere')).toBeTruthy();
    expect(screen.queryByTestId('movie-watch')).toBeNull();
    expect(screen.getByTestId('movie-foot-trailer')).toBeTruthy();
  });

  it('after the premiere date the movie is watched on Flixora as any other', async () => {
    mockGet.mockResolvedValue(ok(detail('m1', { premiering: true, premierDate: '2026-10-20T09:00:00Z' })));
    await render(wrap(<MovieScreen {...base} />));
    expect(await screen.findByTestId('movie-watch')).toBeTruthy();
    expect(screen.queryByTestId('movie-foot-trailer')).toBeNull();
  });
});
