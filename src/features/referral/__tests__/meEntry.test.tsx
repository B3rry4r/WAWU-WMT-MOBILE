import { fireEvent, render } from '@testing-library/react-native';
import { renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text, View } from 'react-native';

import RootLayout from '@/app/_layout';
import TabsLayout from '@/app/(tabs)/_layout';
import Home from '@/app/(tabs)/index';
import Explore from '@/app/(tabs)/explore';
import Inbox from '@/app/(tabs)/inbox';
import Wallet from '@/app/(tabs)/wallet';
import Me from '@/app/(tabs)/me';
import { resetSessionForTests } from '@/api/session';
import { ACCESS_KEY, REFRESH_KEY } from '@/api/tokenStore';
import { ProfileTop } from '@/features/me/ProfileHeader';

const mockVault = new Map<string, string>();
const mockFetch = jest.fn();
// The Hub client keeps the fetch it finds when it is made, so the stand-in goes in as its address is read, and that
// address is a closed port on this machine: nothing here can reach a real host.
jest.mock('@/api/env', () => {
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => mockFetch(input, init)) as typeof fetch;
  return { apiBaseUrl: 'http://127.0.0.1:9', identityBaseUrl: 'http://127.0.0.1:9' };
});
jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn(), hideAsync: jest.fn() }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));

/** A stand-in for RF1, so the entry is tested on its own: the router's own view of where it went is the proof. */
function InviteStandIn() {
  return (
    <View>
      <Text accessibilityRole="header">Invite and earn</Text>
    </View>
  );
}

const routes = {
  _layout: RootLayout,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': Home,
  '(tabs)/explore': Explore,
  '(tabs)/inbox': Inbox,
  '(tabs)/wallet': Wallet,
  '(tabs)/me': Me,
  invite: InviteStandIn,
};

function pathname(): string {
  const { store } = jest.requireActual('expo-router/build/global-state/router-store') as { store: { getRouteInfo: () => { pathname: string } } };
  return store.getRouteInfo().pathname;
}

beforeAll(async () => {
  const { unmount } = await renderRouter(routes);
  await unmount();
}, 60_000);

beforeEach(() => {
  mockVault.clear();
  resetSessionForTests();
  mockFetch.mockReset().mockImplementation(async () => {
    throw new TypeError('Network request failed');
  });
});

describe('REF-03: the way into Invite and earn (M1)', () => {
  it('a signed-in person on Me taps the gift button and lands on Invite and earn at /invite', async () => {
    mockVault.set(ACCESS_KEY, 'stored-access');
    mockVault.set(REFRESH_KEY, 'stored-refresh');
    await renderRouter(routes, { initialUrl: '/me' });
    const gift = await screen.findByTestId('me-invite');
    expect(gift.props.accessibilityLabel).toBe('Invite and earn');
    expect(pathname()).toBe('/me');

    await fireEvent.press(gift);
    await waitFor(() => expect(pathname()).toBe('/invite'));
    expect(await screen.findByRole('header', { name: 'Invite and earn' })).toBeTruthy();
  });

  it('draws the gift button before Share and Menu, and draws none where nothing opens', async () => {
    const noop = jest.fn();
    const withEntry = await render(<ProfileTop coverUrl={null} top={0} canShare onShare={noop} onOpenInvite={noop} onOpenMenu={noop} />);
    expect(screen.getAllByRole('button').map((b) => b.props.testID)).toEqual(['me-invite', 'me-share', 'me-menu-button']);
    await withEntry.unmount();

    await render(<ProfileTop coverUrl={null} top={0} canShare onShare={noop} onOpenMenu={noop} />);
    expect(screen.queryByTestId('me-invite')).toBeNull();
    expect(screen.getAllByRole('button').map((b) => b.props.testID)).toEqual(['me-share', 'me-menu-button']);
  });
});
