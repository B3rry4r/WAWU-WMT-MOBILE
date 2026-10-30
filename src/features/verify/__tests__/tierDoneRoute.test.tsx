/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { act, renderRouter, screen } from 'expo-router/testing-library';
import { Text, View } from 'react-native';

import { hub, installHub } from '@/features/store/testing/fakeHub';

import type { ComponentType } from 'react';

/*
 * VF7 on the real route file (`/tier-done?tier=<id>`), after a tier bought in the store sheet (IAP-02, R-86). Carried over from main's
 * RELEASE-02 CHECK-3 D-2 cases, which ran on the wallet checkout that this branch replaces: money is never taken and then led to a screen
 * that bounces, so "Record my voice" is drawn for a creator account only and any other account ends on Done.
 */
const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => void mockVault.set(key, value)),
  deleteItemAsync: jest.fn(async (key: string) => void mockVault.delete(key)),
}));

const tier = (id: string, name: string, over: object = {}) => ({
  id,
  name,
  days: 365,
  products: 10,
  bonusPoints: 600,
  bonusPointsExpireDays: 365,
  priceMinor: 500_000,
  eventPass: { id: 'ep', name: 'Maker Pass' },
  badge: { numbered: false },
  packBonusPercent: 0,
  firstVoiceIntroIncluded: true,
  preselected: false,
  ...over,
});

// Installed before any app module loads, as the other route suites do: the API client keeps the `fetch` it finds when it is first used.
installHub();

function serve(accountType: 'creator' | 'user') {
  hub.reset();
  hub.routes['GET /users/me'] = { wawuUserId: '00000000-0000-4000-8000-0000000000a7', accountType };
  hub.routes['GET /plans'] = { currency: 'NGN', tiers: [tier('plus', 'Verify Plus')], extraProducts: { count: 5, priceMinor: 150_000 }, checkoutBump: { points: 1000, priceMinor: 80_000 } };
}

const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};
const stub = (name: string) => {
  function Stub() {
    return (
      <View>
        <Text accessibilityRole="header">{name}</Text>
      </View>
    );
  }
  return Stub;
};

let routes: Record<string, ComponentType>;
let session: typeof import('@/api/session');
let queryClient: typeof import('@/api/query').queryClient;

beforeAll(() => {
  session = require('@/api/session') as typeof import('@/api/session');
  queryClient = (require('@/api/query') as typeof import('@/api/query')).queryClient;
  routes = {
    _layout: () => (
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    ),
    index: stub('Home'),
    welcome: stub('Welcome'),
    'tier-done': (require('@/app/tier-done') as { default: ComponentType }).default,
  };
});

beforeEach(() => {
  queryClient.clear();
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor('00000000-0000-4000-8000-0000000000a7'));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  session.resetSessionForTests();
});

afterEach(async () => {
  await act(async () => {
    jest.advanceTimersByTime(10);
  });
});

describe('VF7 · /tier-done after a store purchase (RELEASE-02 CHECK-3 D-2, carried over)', () => {
  it('a creator who bought a tier is offered "Record my voice"', async () => {
    serve('creator');
    await renderRouter(routes, { initialUrl: '/tier-done?tier=plus' });
    await screen.findByTestId('official-title');
    expect(await screen.findByTestId('official-voice')).toBeTruthy();
  });

  it('a fan who bought a tier (a user account) ends on Done: "Record my voice" is not drawn, because the voice screens would send them Home', async () => {
    serve('user');
    await renderRouter(routes, { initialUrl: '/tier-done?tier=plus' });
    await screen.findByTestId('official-title');
    expect(await screen.findByTestId('official-done')).toBeTruthy();
    expect(screen.queryByTestId('official-voice')).toBeNull();
  });
});
