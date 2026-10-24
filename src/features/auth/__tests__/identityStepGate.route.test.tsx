import type { ComponentType } from 'react';

import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text, View } from 'react-native';

import RootLayout from '@/app/_layout';
import YourDetails from '@/app/your-details';
import TabsLayout from '@/app/(tabs)/_layout';
import Home from '@/app/(tabs)/index';
import Explore from '@/app/(tabs)/explore';
import Inbox from '@/app/(tabs)/inbox';
import Wallet from '@/app/(tabs)/wallet';
import Me from '@/app/(tabs)/me';
import { resetSessionForTests } from '@/api/session';
import { ACCESS_KEY, REFRESH_KEY } from '@/api/tokenStore';
import * as identityApi from '@/features/auth/identityApi';
import { resetSignupGate } from '@/features/auth/signupGate';
import * as profileApi from '@/features/profile-edit/api';

/*
 * SIGNUP-NAMES (R-82): an account with no first name, last name or username is asked for them once, before any other signed-in
 * screen, a deep link included. The Hub's profile read and its two identity calls are answered at the modules that make them.
 */
const mockVault = new Map<string, string>();

jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn(), hideAsync: jest.fn() }));
jest.mock('@/api/env', () => ({ apiBaseUrl: 'http://127.0.0.1:9', identityBaseUrl: 'http://127.0.0.1:9' }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));
jest.mock('@/features/profile-edit/api', () => ({
  ...jest.requireActual('@/features/profile-edit/api'),
  readMine: jest.fn(),
}));
jest.mock('@/features/auth/identityApi', () => ({
  ...jest.requireActual('@/features/auth/identityApi'),
  askUsername: jest.fn(async (handle: string) => ({ handle, available: true, message: null })),
  putIdentity: jest.fn(),
}));

const stub = (name: string) =>
  function Stub() {
    return (
      <View>
        <Text accessibilityRole="header">{`route ${name}`}</Text>
      </View>
    );
  };

const routes: Record<string, ComponentType> = {
  _layout: RootLayout,
  'your-details': YourDetails,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': Home,
  '(tabs)/explore': Explore,
  '(tabs)/inbox': Inbox,
  '(tabs)/wallet': Wallet,
  '(tabs)/me': Me,
  'edit-profile': stub('edit-profile'),
  'settings/index': stub('settings'),
};

const profile = (over: Record<string, unknown>) => ({ wawuUserId: 'u1', accountType: 'user', firstName: 'Ada', lastName: 'Obi', handle: 'ada_o', ...over });
const readMine = jest.mocked(profileApi.readMine);

beforeAll(async () => {
  readMine.mockResolvedValue(profile({}) as never);
  const { unmount } = await renderRouter(routes, { initialUrl: '/settings' });
  await unmount();
}, 60_000);

beforeEach(() => {
  mockVault.clear();
  mockVault.set(ACCESS_KEY, 'stored-access');
  mockVault.set(REFRESH_KEY, 'stored-refresh');
  resetSessionForTests();
  resetSignupGate();
  readMine.mockReset();
  jest.mocked(identityApi.putIdentity).mockReset();
});

describe('the name and username step blocks every signed-in screen until it is done', () => {
  it.each(['/edit-profile', '/settings', '/explore'])('a deep link to %s shows the step, not the screen', async (url) => {
    readMine.mockResolvedValue(profile({ firstName: null, lastName: null, handle: null }) as never);
    await renderRouter(routes, { initialUrl: url });
    await waitFor(() => expect(screen.getByTestId('your-details')).toBeTruthy());
    expect(screen.queryByRole('header', { name: 'route edit-profile' })).toBeNull();
    expect(screen.queryByRole('header', { name: 'route settings' })).toBeNull();
    expect(screen.queryByRole('header', { name: 'Explore' })).toBeNull();
  });

  it('an account that has all three opens the deep link and is never shown the step', async () => {
    readMine.mockResolvedValue(profile({}) as never);
    await renderRouter(routes, { initialUrl: '/settings' });
    await waitFor(() => expect(screen.getByRole('header', { name: 'route settings' })).toBeTruthy());
    expect(screen.queryByTestId('your-details')).toBeNull();
  });

  it('an account that lacks only the username is asked only for it, and saving sends only the username', async () => {
    readMine.mockResolvedValue(profile({ handle: null }) as never);
    jest.mocked(identityApi.putIdentity).mockResolvedValue({ firstName: 'Ada', lastName: 'Obi', handle: 'ada_o' });
    await renderRouter(routes, { initialUrl: '/settings' });
    await waitFor(() => expect(screen.getByTestId('your-details')).toBeTruthy());
    expect(screen.queryByTestId('your-details-first-name')).toBeNull();
    expect(screen.queryByTestId('your-details-last-name')).toBeNull();
    await fireEvent.changeText(screen.getByTestId('your-details-username'), '@ada_o');
    await fireEvent.press(screen.getByTestId('your-details-submit'));
    await waitFor(() => expect(jest.mocked(identityApi.putIdentity)).toHaveBeenCalledTimes(1));
    expect(jest.mocked(identityApi.putIdentity).mock.calls[0][0]).toEqual({ handle: 'ada_o' });
    await waitFor(() => expect(screen.queryByTestId('your-details')).toBeNull());
  });

  it('a Hub that cannot be asked lets the person in; the next open asks again', async () => {
    readMine.mockRejectedValue(new Error('offline'));
    await renderRouter(routes, { initialUrl: '/settings' });
    await waitFor(() => expect(screen.getByRole('header', { name: 'route settings' })).toBeTruthy());
    expect(screen.queryByTestId('your-details')).toBeNull();
  });
});
