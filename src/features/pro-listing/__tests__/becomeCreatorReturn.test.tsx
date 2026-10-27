/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import type { ComponentType } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// SERVICES-FEEDBACK item 3: a person who is not a creator taps "Become a creator" on the listing gate (P10), finishes A11 (Set up your
// account) with Later, and comes back to the listing form (P5). The real router runs, with the two real route files and a stand-in Home.
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('@/api/session', () => ({
  ...jest.requireActual('@/api/session'),
  useSession: () => ({ status: 'signedIn', signIn: jest.fn(), signOut: jest.fn() }),
  getAccessToken: async () => 'access-1',
  refreshAccessToken: async () => null,
  isCurrentSessionToken: () => true,
}));

let account: 'user' | 'creator' = 'user';
const json = (data: unknown) => new Response(JSON.stringify({ statusCode: 200, message: 'OK', data }), { status: 200, headers: { 'content-type': 'application/json' } });
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const key = `${request.method} ${new URL(request.url).pathname.replace(/^\/api\/hub/, '')}`;
  if (key === 'GET /users/me') return json({ wawuUserId: 'u1', accountType: account });
  if (key === 'PUT /users/me/account-type') {
    account = 'creator';
    return json({ accountType: 'creator' });
  }
  if (key === 'GET /professionals/fields') return json([{ id: 'accounting_tax', label: 'Accounting & Tax', applyCategory: 'finance', categories: ['finance'], regulated: true }]);
  if (key === 'GET /professionals/applications/mine') return json([]);
  return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
}) as typeof fetch;

const ProfessionalApplyRoute = (require('@/app/professional-apply') as typeof import('@/app/professional-apply')).default;
const CreatorSetupRoute = (require('@/app/creator-setup') as typeof import('@/app/creator-setup')).default;

const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
/** The app's own cache and safe area around a route, as the root layout gives them. */
const inApp = (Route: ComponentType) =>
  function Wrapped() {
    return (
      <SafeAreaProvider initialMetrics={metrics}>
        <QueryClientProvider client={queryClient}>
          <Route />
        </QueryClientProvider>
      </SafeAreaProvider>
    );
  };

const routes = {
  index: () => <Text testID="home-stand-in">Home</Text>,
  'professional-apply': inApp(ProfessionalApplyRoute),
  'creator-setup': inApp(CreatorSetupRoute),
};

/** The router's own view of where it is. */
function where(): { pathname: string; params: Record<string, unknown> } {
  const { store } = jest.requireActual('expo-router/build/global-state/router-store') as {
    store: { getRouteInfo: () => { pathname: string; params: Record<string, unknown> } };
  };
  const info = store.getRouteInfo();
  return { pathname: info.pathname, params: info.params };
}

beforeEach(() => {
  account = 'user';
  queryClient.clear();
});

describe('SERVICES-FEEDBACK 3 · Become a creator, then back to the listing form', () => {
  it('a buyer taps Become a creator, finishes A11 with Later, and lands on the form to offer services', async () => {
    await renderRouter(routes, { initialUrl: '/professional-apply' });
    expect(await screen.findByTestId('pro-gate')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('pro-become-creator'));
    expect(await screen.findByTestId('creator-setup')).toBeTruthy();
    expect(where()).toEqual({ pathname: '/creator-setup', params: { next: 'professional-apply' } });

    await fireEvent.press(screen.getByTestId('setup-later'));
    await waitFor(() => expect(where().pathname).toBe('/professional-apply'));
    expect(await screen.findByTestId('pro-add-field')).toBeTruthy();
    expect(screen.queryByTestId('pro-gate')).toBeNull();
    expect(screen.queryByTestId('home-stand-in')).toBeNull();
  });

  it('with no history to go back to (a page opened again), Later still opens the listing form, not Home', async () => {
    account = 'creator';
    await renderRouter(routes, { initialUrl: '/creator-setup?next=professional-apply' });
    expect(await screen.findByTestId('creator-setup')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('setup-later'));
    await waitFor(() => expect(where().pathname).toBe('/professional-apply'));
    expect(await screen.findByTestId('pro-add-field')).toBeTruthy();
  });

  it('A11 opened any other way is unchanged: Later goes Home when there is nothing to go back to', async () => {
    account = 'creator';
    await renderRouter(routes, { initialUrl: '/creator-setup' });
    await fireEvent.press(await screen.findByTestId('setup-later'));
    expect(await screen.findByTestId('home-stand-in')).toBeTruthy();
  });

  it('a return A11 does not know is never followed: a path in the link goes Home like no return at all', async () => {
    account = 'creator';
    await renderRouter(routes, { initialUrl: '/creator-setup?next=%2Fwallet' });
    await fireEvent.press(await screen.findByTestId('setup-later'));
    expect(await screen.findByTestId('home-stand-in')).toBeTruthy();
  });
});
