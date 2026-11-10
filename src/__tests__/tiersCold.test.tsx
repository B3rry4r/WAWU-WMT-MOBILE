import { router } from 'expo-router';
import { Platform, View } from 'react-native';
import { renderRouter, screen, waitFor, fireEvent, act } from 'expo-router/testing-library';

import TiersRoute from '@/app/tiers';
import { StartHrefProvider } from '@/features/shell/startHref';

/**
 * WEBAPP-09 W2: /tiers opened cold on the web (a refresh, a typed address) has nothing under it, so the step the person would be on is put
 * there first and Close leads back to it. Opened from inside the app nothing is added.
 */
jest.mock('@/api/session', () => ({ useSession: () => ({ status: 'signedIn' }) }));
jest.mock('@/features/verify/TiersScreen', () => {
  const rn = jest.requireActual('react-native') as typeof import('react-native');
  const react = jest.requireActual('react') as typeof import('react');
  return {
    TiersScreen: ({ onClose }: { onClose: () => void }) =>
      react.createElement(rn.View, { testID: 'sheet' }, react.createElement(rn.Pressable, { testID: 'close', onPress: onClose }, react.createElement(rn.Text, null, 'Close'))),
  };
});

const Home = () => <View testID="home" />;
const Offer = () => <View testID="offer" />;
const open = (url: string, start = '/') =>
  renderRouter(
    {
      _layout: () => {
        const { Slot } = require('expo-router') as typeof import('expo-router');
        return (
          <StartHrefProvider value={start}>
            <Slot />
          </StartHrefProvider>
        );
      },
      index: Home,
      'tier-offer': Offer,
      tiers: TiersRoute,
    },
    { initialUrl: url },
  );

function pathname(): string {
  const { store } = jest.requireActual('expo-router/build/global-state/router-store') as { store: { getRouteInfo: () => { pathname: string } } };
  return store.getRouteInfo().pathname;
}

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'web');
});

describe('WEBAPP-09 W2: /tiers opened cold', () => {
  it('puts Home under the sheet, and Close leads back to it', async () => {
    await open('/tiers');
    expect(await screen.findByTestId('sheet')).toBeTruthy();
    await waitFor(() => expect(router.canGoBack()).toBe(true));
    expect(pathname()).toBe('/tiers');
    await act(async () => fireEvent.press(screen.getByTestId('close')));
    await waitFor(() => expect(pathname()).toBe('/'));
    expect(screen.getByTestId('home')).toBeTruthy();
  });

  it('with the tier offer still to come, Close leads to the offer, not to nothing', async () => {
    await open('/tiers', '/tier-offer');
    expect(await screen.findByTestId('sheet')).toBeTruthy();
    await act(async () => fireEvent.press(screen.getByTestId('close')));
    await waitFor(() => expect(pathname()).toBe('/tier-offer'));
  });

  it('opened from inside the app adds nothing under it: Close goes back to where it was', async () => {
    await open('/');
    await act(async () => router.push('/tiers'));
    expect(await screen.findByTestId('sheet')).toBeTruthy();
    expect(pathname()).toBe('/tiers');
    await act(async () => fireEvent.press(screen.getByTestId('close')));
    await waitFor(() => expect(pathname()).toBe('/'));
  });

  it('a phone is untouched: opened first it does not move', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    await open('/tiers');
    expect(await screen.findByTestId('sheet')).toBeTruthy();
    expect(router.canGoBack()).toBe(false);
  });
});
