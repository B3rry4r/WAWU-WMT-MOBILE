import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { queryClient } from '@/api/query';

import { homeKey } from '../api';
import { FlixRail } from '../FlixRail';
import { isSoon, SOON_LINE, SOON_TITLE } from '../FlixSoon';
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

describe('FLIX-04 · Flix movies show "not live yet" (R-77)', () => {
  it('says the two lines, word for word', () => {
    expect(SOON_TITLE).toBe("Flix movies aren't switched on yet");
    expect(SOON_LINE).toBe("You'll be able to watch movies here soon.");
    expect(`${SOON_TITLE}${SOON_LINE}`).not.toMatch(/—/);
  });

  it('reads soon only from enabled: false with soon: true', () => {
    expect(isSoon({ enabled: false, soon: true })).toBe(true);
    expect(isSoon({ enabled: false })).toBe(false);
    expect(isSoon({ enabled: false, soon: false })).toBe(false);
    expect(isSoon({ enabled: true, soon: true })).toBe(false);
    expect(isSoon(undefined)).toBe(false);
  });

  describe('the rail on Home and Explore', () => {
    it('stays: its title and one card with the two lines, which opens Flix movies; no See all, no posters', async () => {
      mockGet.mockResolvedValue(soonHome());
      const onSeeAll = jest.fn();
      await render(wrap(<FlixRail onSeeAll={onSeeAll} onOpenMovie={jest.fn()} />));
      expect(await screen.findByTestId('flix-rail')).toBeTruthy();
      expect(screen.getByRole('header', { name: 'Flix movies' })).toBeTruthy();
      expect(screen.getByText(SOON_TITLE)).toBeTruthy();
      expect(screen.getByText(SOON_LINE)).toBeTruthy();
      expect(screen.queryByTestId('flix-rail-see-all')).toBeNull();
      expect(screen.queryByText('See all')).toBeNull();
      expect(screen.queryByTestId('flix-rail-list')).toBeNull();
      await fireEvent.press(screen.getByTestId('flix-rail-soon'));
      expect(onSeeAll).toHaveBeenCalledTimes(1);
    });

    it('stays hidden for enabled: false without soon', async () => {
      mockGet.mockResolvedValue(offHome());
      await render(wrap(<FlixRail onSeeAll={jest.fn()} onOpenMovie={jest.fn()} />));
      await waitFor(() => expect(mockGet).toHaveBeenCalled());
      expect(screen.queryByTestId('flix-rail')).toBeNull();
      expect(screen.queryByText(SOON_TITLE)).toBeNull();
      expect(screen.queryByText('Flix movies')).toBeNull();
    });
  });

  describe('the movies screen', () => {
    const props = { onBack: jest.fn(), onSearch: jest.fn(), onOpenMovie: jest.fn(), onWatch: jest.fn(), onTrailer: jest.fn(), onBrowse: jest.fn(), onOpenTab: jest.fn() };

    it('shows the two lines and no catalog, search, filters or watch button, and asks for no genres', async () => {
      mockGet.mockImplementation((path: string) => Promise.resolve(path === '/api/hub/movies' ? soonHome() : offHome()));
      // The rail on Home or Explore has read the answer already (held for a minute): this is how a person reaches the screen.
      queryClient.setQueryData(homeKey, { enabled: false, soon: true, hero: null, rails: [] });
      await render(wrap(<MoviesScreen {...props} />));
      expect(await screen.findByTestId('movies-soon')).toBeTruthy();
      expect(screen.getByRole('header', { name: 'Flix movies' })).toBeTruthy();
      expect(screen.getByText(SOON_TITLE)).toBeTruthy();
      expect(screen.getByText(SOON_LINE)).toBeTruthy();
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

    it('draws Flix movies itself on soon (allowSoon) and sends every other Flix screen out', async () => {
      mockGet.mockResolvedValue(soonHome());
      const onOffMain = jest.fn();
      await render(wrap(<MoviesGate onOff={onOffMain} allowSoon showWhilePending>{child}</MoviesGate>));
      expect(await screen.findByTestId('child')).toBeTruthy();
      await waitFor(() => expect(mockGet).toHaveBeenCalled());
      expect(onOffMain).not.toHaveBeenCalled();
      await screen.unmount();

      const onOffOther = jest.fn();
      await render(wrap(<MoviesGate onOff={onOffOther}>{child}</MoviesGate>));
      await waitFor(() => expect(onOffOther).toHaveBeenCalled());
      expect(screen.queryByTestId('child')).toBeNull();
    });

    it('still sends everything out, Flix movies too, for enabled: false without soon', async () => {
      mockGet.mockResolvedValue(offHome());
      const onOff = jest.fn();
      await render(wrap(<MoviesGate onOff={onOff} allowSoon showWhilePending>{child}</MoviesGate>));
      await waitFor(() => expect(onOff).toHaveBeenCalled());
      expect(screen.queryByTestId('child')).toBeNull();
    });
  });
});
