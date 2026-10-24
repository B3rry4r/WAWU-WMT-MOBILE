import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { queryClient } from '@/api/query';

import { homeKey } from '../api';
import { FlixRail } from '../FlixRail';
import { MoviesGate } from '../MoviesGate';
import { MoviesScreen } from '../MoviesScreen';

jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);

const mockGet = jest.fn();
jest.mock('@/api/client', () => ({ api: { GET: (...a: unknown[]) => mockGet(...a), POST: jest.fn() }, unwrap: (p: Promise<{ data: unknown }>) => p.then((r) => r.data) }));

const answer = (data: unknown) => ({ response: { ok: true, status: 200, headers: new Headers() }, data: { statusCode: 200, message: 'OK', data } });
const soonHome = () => answer({ enabled: false, soon: true, hero: null, rails: [] });
const offHome = () => answer({ enabled: false, hero: null, rails: [] });
const wrap = (ui: React.ReactElement) => <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>;

beforeEach(() => {
  queryClient.setDefaultOptions({ queries: { retry: false, staleTime: 0 } });
  queryClient.clear();
  mockGet.mockReset();
});

describe('FIX-106 · a soon answer draws nothing for Flix, exactly like off (R-80)', () => {
  const NOT_LIVE_TEXT = /switched on yet|movies here soon|not live yet/i;

  describe('the rail on Home and Explore', () => {
    it.each([
      ['soon', soonHome],
      ['off', offHome],
    ])('draws nothing for %s: no rail, no title, no card, no See all', async (_name, answerOf) => {
      mockGet.mockResolvedValue(answerOf());
      await render(wrap(<FlixRail onSeeAll={jest.fn()} onOpenMovie={jest.fn()} />));
      await waitFor(() => expect(mockGet).toHaveBeenCalled());
      await waitFor(() => expect(queryClient.getQueryData(homeKey)).toBeTruthy());
      expect(screen.queryByTestId('flix-rail')).toBeNull();
      expect(screen.queryByTestId('flix-rail-soon')).toBeNull();
      expect(screen.queryByTestId('flix-rail-see-all')).toBeNull();
      expect(screen.queryByTestId('flix-rail-list')).toBeNull();
      expect(screen.queryByText('Flix movies')).toBeNull();
      expect(screen.queryByText(NOT_LIVE_TEXT)).toBeNull();
    });
  });

  describe('the movies screen', () => {
    const props = { onBack: jest.fn(), onSearch: jest.fn(), onOpenMovie: jest.fn(), onWatch: jest.fn(), onTrailer: jest.fn(), onBrowse: jest.fn(), onOpenTab: jest.fn() };

    it('draws no note, catalog, search, filters or watch button for soon, and asks for no genres', async () => {
      mockGet.mockImplementation((path: string) => Promise.resolve(path === '/api/hub/movies' ? soonHome() : offHome()));
      // The rail on Home or Explore has read the answer already (held for a minute): this is how a person reaches the screen.
      queryClient.setQueryData(homeKey, { enabled: false, soon: true, hero: null, rails: [] });
      await render(wrap(<MoviesScreen {...props} />));
      expect(screen.queryByTestId('movies-soon')).toBeNull();
      expect(screen.queryByText(NOT_LIVE_TEXT)).toBeNull();
      expect(screen.queryByTestId('movies-search')).toBeNull();
      expect(screen.queryByTestId('flix-hero')).toBeNull();
      expect(screen.queryByTestId('movies-genre')).toBeNull();
      expect(screen.queryByText('Watch on Flixora')).toBeNull();
      expect(screen.queryByText('See all')).toBeNull();
      expect(screen.queryByTestId('movies-loading')).toBeNull();
      expect(screen.queryByTestId('movies-error')).toBeNull();
      expect(mockGet).not.toHaveBeenCalled();
    });
  });

  describe('the gate', () => {
    const child = <Text testID="child">drawn</Text>;

    it.each([
      ['soon', soonHome],
      ['off', offHome],
    ])('sends every Flix screen out on %s, Flix movies itself included, and draws none of them', async (_name, answerOf) => {
      mockGet.mockResolvedValue(answerOf());
      const onOffMain = jest.fn();
      await render(wrap(<MoviesGate onOff={onOffMain} showWhilePending>{child}</MoviesGate>));
      await waitFor(() => expect(onOffMain).toHaveBeenCalled());
      expect(screen.queryByTestId('child')).toBeNull();
      await screen.unmount();

      const onOffOther = jest.fn();
      await render(wrap(<MoviesGate onOff={onOffOther}>{child}</MoviesGate>));
      await waitFor(() => expect(onOffOther).toHaveBeenCalled());
      expect(screen.queryByTestId('child')).toBeNull();
    });

    it('draws the screen when the Hub answers enabled: true', async () => {
      mockGet.mockResolvedValue(answer({ enabled: true, hero: null, rails: [] }));
      const onOff = jest.fn();
      await render(wrap(<MoviesGate onOff={onOff} showWhilePending>{child}</MoviesGate>));
      expect(await screen.findByTestId('child')).toBeTruthy();
      await waitFor(() => expect(queryClient.getQueryData(homeKey)).toBeTruthy());
      expect(onOff).not.toHaveBeenCalled();
    });
  });
});
