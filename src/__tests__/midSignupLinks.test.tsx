import { Slot } from 'expo-router';
import { View } from 'react-native';
import { renderRouter, screen, waitFor } from 'expo-router/testing-library';

import RootLayout from '@/app/_layout';
import NotFound from '@/app/+not-found';
import ReferralLinkRoute from '@/app/r/[code]';
import WelcomeRoute from '@/app/welcome';
import { resetSessionForTests } from '@/api/session';
import { resetSignupGate } from '@/features/auth/signupGate';
import { queryClient } from '@/api/query';
import { ACCESS_KEY, REFRESH_KEY } from '@/api/tokenStore';
import { withBillsGuard } from '@/features/bills/webGuard';
import { startHref } from '@/features/shell/startHref';

/**
 * WEBAPP-09 W1: a signed-in person who has not finished signing up and opens an invite link, a bills link or a wrong address is led on to the
 * step they have not finished, never left on a blank page (Home sits behind the sign-up steps). A finished account still lands on Home, a guest
 * on the welcome screen.
 */
const mockVault = new Map<string, string>();
const mockFetch = jest.fn();
jest.mock('@/api/env', () => {
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => mockFetch(input, init)) as typeof fetch;
  return { apiBaseUrl: 'http://127.0.0.1:9', identityBaseUrl: 'http://127.0.0.1:9' };
});
jest.mock('@/features/bills/offered', () => ({ billsOffered: () => false }));
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

const stand = (testID: string) => () => <View testID={testID} />;
const BillsPage = withBillsGuard(stand('bills-page'));
const routes = {
  _layout: RootLayout,
  welcome: WelcomeRoute,
  'r/[code]': ReferralLinkRoute,
  '+not-found': NotFound,
  'bills/index': BillsPage,
  interests: stand('interests'),
  'people-to-follow': stand('follows'),
  '(tabs)/_layout': () => <Slot />,
  '(tabs)/index': stand('home'),
};

let step: 'interests' | 'follows' | 'done' = 'interests';
const ok = (data: unknown) => new Response(JSON.stringify({ statusCode: 200, message: 'OK', data }), { status: 200, headers: { 'content-type': 'application/json' } });

beforeAll(async () => {
  const { unmount } = await renderRouter(routes);
  await unmount();
}, 60_000);

beforeEach(() => {
  mockVault.clear();
  resetSessionForTests();
  resetSignupGate();
  queryClient.clear();
  step = 'interests';
  mockFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const path = new URL(request.url).pathname;
    if (request.method === 'GET' && path.endsWith('/auth/signup/progress')) {
      return ok({ step, inSequence: step !== 'done', accountType: 'user', steps: ['interests', 'follows'], emailProven: true });
    }
    if (request.method === 'GET' && path === '/api/hub/users/me') {
      return ok({ wawuUserId: 'u1', sub: 'u1', firstName: 'Ada', lastName: 'Obi', accountType: 'user', handle: 'ada' });
    }
    throw new TypeError('Network request failed');
  });
});

function signIn() {
  mockVault.set(ACCESS_KEY, 'stored-access');
  mockVault.set(REFRESH_KEY, 'stored-refresh');
}
const open = (url: string) => renderRouter(routes, { initialUrl: url });

describe('startHref: the step a signed-in person has not finished', () => {
  const done = { needsEmail: false, needsIdentity: false, claimOffer: false, tierOffer: false, bonus: false, setupStep: null } as const;
  it('names each step in the order the root layout opens them, and Home when none is left', () => {
    expect(startHref(done)).toBe('/');
    expect(startHref({ ...done, needsEmail: true, tierOffer: true })).toBe('/email-code');
    expect(startHref({ ...done, needsIdentity: true, setupStep: 'interests' })).toBe('/your-details');
    expect(startHref({ ...done, claimOffer: true, tierOffer: true })).toBe('/claim-offer');
    expect(startHref({ ...done, tierOffer: true, setupStep: 'interests' })).toBe('/tier-offer');
    expect(startHref({ ...done, bonus: true })).toBe('/verify-bonus');
    expect(startHref({ ...done, bonus: true, setupStep: 'interests' })).toBe('/interests');
    expect(startHref({ ...done, setupStep: 'follows' })).toBe('/people-to-follow');
    expect(startHref({ ...done, setupStep: 'creator_setup' })).toBe('/creator-setup');
  });
});

describe.each([
  ['an invite link', '/r/ADA'],
  ['a bills link', '/bills'],
  ['a wrong address', '/join'],
])('WEBAPP-09 W1: %s opened part way through sign-up', (_name, url) => {
  it('leads on to the interests step, never a blank page', async () => {
    signIn();
    await open(url);
    expect(await screen.findByTestId('interests')).toBeTruthy();
    expect(screen.queryByTestId('home')).toBeNull();
  });

  it('leads on to the people step when that is the one left', async () => {
    signIn();
    step = 'follows';
    await open(url);
    expect(await screen.findByTestId('follows')).toBeTruthy();
  });

  it('a finished account goes Home, as before', async () => {
    signIn();
    step = 'done';
    await open(url);
    await waitFor(() => expect(screen.queryByTestId('home')).toBeTruthy());
    expect(screen.queryByTestId('interests')).toBeNull();
  });
});

describe('WEBAPP-09 W1: a guest', () => {
  it.each(['/r/ADA', '/join'])('%s goes to the welcome screen', async (url) => {
    await open(url);
    expect(await screen.findByTestId('welcome')).toBeTruthy();
  });
});

describe('WEBAPP-09 W1: an invite link keeps its code for a person part way through sign-up', () => {
  it('claims the code with the Hub while leading the person on', async () => {
    signIn();
    await open('/r/ADA');
    await screen.findByTestId('interests');
    await waitFor(() => expect(mockFetch.mock.calls.some(([input]) => String((input as Request).url ?? input).includes('/referrals'))).toBe(true));
  });
});
