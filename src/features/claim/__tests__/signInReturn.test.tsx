import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen, waitFor as waitForRaw } from 'expo-router/testing-library';

import RootLayout from '@/app/_layout';
import TabsLayout from '@/app/(tabs)/_layout';
import Home from '@/app/(tabs)/index';
import Explore from '@/app/(tabs)/explore';
import Inbox from '@/app/(tabs)/inbox';
import Wallet from '@/app/(tabs)/wallet';
import Me from '@/app/(tabs)/me';
import ClaimCodeRoute from '@/app/claim-code';
import SignInRoute from '@/app/sign-in';
import WelcomeRoute from '@/app/welcome';
import { resetSessionForTests, signOut } from '@/api/session';
import { ACCESS_KEY, REFRESH_KEY } from '@/api/tokenStore';
import { resetOfferStep } from '../offerStep';
import { resetSignupGate } from '@/features/auth/signupGate';
import { CLAIM_RETURN_WINDOW_MS, rememberClaimVisit, resetClaimVisit, takeClaimVisit } from '../signInReturn';

/** The machine that runs these is often loaded: wait up to 15 s for a screen, never less than the default. */
const waitFor = (check: () => void) => waitForRaw(check, { timeout: 15_000 });

jest.setTimeout(60_000);

const mockVault = new Map<string, string>();
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

const routes = {
  _layout: RootLayout,
  welcome: WelcomeRoute,
  'sign-in': SignInRoute,
  'claim-code': ClaimCodeRoute,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': Home,
  '(tabs)/explore': Explore,
  '(tabs)/inbox': Inbox,
  '(tabs)/wallet': Wallet,
  '(tabs)/me': Me,
};

const b64 = (value: unknown) => btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const tokenFor = (sub: string) => `${b64({ alg: 'RS256' })}.${b64({ sub, iat: 1000, exp: 4_000_000_000 })}.sig`;

let loginAnswer: { status: number; body: unknown };

beforeAll(async () => {
  const { unmount } = await renderRouter(routes);
  await unmount();
}, 60_000);

beforeEach(() => {
  mockVault.clear();
  resetSessionForTests();
  resetOfferStep();
  resetSignupGate();
  resetClaimVisit();
  loginAnswer = { status: 200, body: { data: { accessToken: tokenFor('account-ada'), refreshToken: 'refresh-ada' } } };
  // WAWU ID answers a sign-in; the Hub cannot be reached (every other call fails as if the phone were offline).
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input instanceof Request ? input.url : input));
    if (url.pathname === '/auth/login') {
      return new Response(JSON.stringify(loginAnswer.body), { status: loginAnswer.status, headers: { 'content-type': 'application/json' } });
    }
    throw new TypeError('Network request failed');
  }) as typeof fetch;
});

const home = () => screen.getByRole('header', { name: 'Home' });

async function signInAsAda() {
  await fireEvent.changeText(screen.getByTestId('sign-in-email'), 'ada@example.test');
  await fireEvent.changeText(screen.getByTestId('sign-in-password'), 'Passw0rd-spec');
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
}

/** JOIN-03 round 3, N14: a signed-out visit to the claim screen goes to sign-in, then back to the claim. */
describe('a signed-out visit to /claim-code (JOIN-03 round 3, N14)', () => {
  it('goes to sign-in, and a sign-in lands on the claim screen, never on Home', async () => {
    await renderRouter(routes, { initialUrl: '/claim-code' });
    await waitFor(() => expect(screen.getByTestId('sign-in')).toBeTruthy());
    // The claim screen is never drawn signed out, and nothing was asked of the Hub.
    expect(screen.queryByTestId('claim-screen')).toBeNull();
    expect(screen.queryByRole('header', { name: 'Home' })).toBeNull();

    await signInAsAda();
    await waitFor(() => expect(screen.getByTestId('claim-screen')).toBeTruthy());
    expect(screen.queryByTestId('sign-in')).toBeNull();
    expect(screen.queryByRole('header', { name: 'Home' })).toBeNull();
  });

  it('a sign-in that nobody asked the claim screen for lands on Home, as before', async () => {
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await waitFor(() => expect(screen.getByTestId('sign-in')).toBeTruthy());
    await signInAsAda();
    await waitFor(() => expect(home()).toBeTruthy());
    expect(screen.queryByTestId('claim-screen')).toBeNull();
  });

  it('a wrong password stays on sign-in, and the right one after it still goes to the claim screen', async () => {
    loginAnswer = { status: 401, body: { statusCode: 401, message: 'Invalid credentials' } };
    await renderRouter(routes, { initialUrl: '/claim-code' });
    await waitFor(() => expect(screen.getByTestId('sign-in')).toBeTruthy());
    await signInAsAda();
    await waitFor(() => expect(screen.getByTestId('sign-in-banner')).toBeTruthy());
    expect(screen.queryByTestId('claim-screen')).toBeNull();

    loginAnswer = { status: 200, body: { data: { accessToken: tokenFor('account-ada'), refreshToken: 'refresh-ada' } } };
    await signInAsAda();
    await waitFor(() => expect(screen.getByTestId('claim-screen')).toBeTruthy());
  });

  it('a session that ends while the claim screen is open goes to sign-in, and signing in comes back to it', async () => {
    mockVault.set(ACCESS_KEY, tokenFor('account-ada'));
    mockVault.set(REFRESH_KEY, 'stored-refresh');
    await renderRouter(routes, { initialUrl: '/claim-code' });
    await waitFor(() => expect(screen.getByTestId('claim-screen')).toBeTruthy());
    await act(async () => {
      await signOut();
    });
    await waitFor(() => expect(screen.getByTestId('sign-in')).toBeTruthy());
    expect(screen.queryByTestId('claim-screen')).toBeNull();
    await signInAsAda();
    await waitFor(() => expect(screen.getByTestId('claim-screen')).toBeTruthy());
  });

  it('a signed-in visit draws the claim screen and remembers nothing', async () => {
    mockVault.set(ACCESS_KEY, tokenFor('account-ada'));
    mockVault.set(REFRESH_KEY, 'stored-refresh');
    await renderRouter(routes, { initialUrl: '/claim-code' });
    await waitFor(() => expect(screen.getByTestId('claim-screen')).toBeTruthy());
    expect(takeClaimVisit()).toBe(false);
  });
});

describe('the remembered visit', () => {
  it('is taken once, and only while it is recent', () => {
    expect(takeClaimVisit(1_000)).toBe(false);
    rememberClaimVisit(1_000);
    expect(takeClaimVisit(1_000 + CLAIM_RETURN_WINDOW_MS)).toBe(true);
    expect(takeClaimVisit(1_000 + CLAIM_RETURN_WINDOW_MS)).toBe(false);
    rememberClaimVisit(1_000);
    expect(takeClaimVisit(1_001 + CLAIM_RETURN_WINDOW_MS)).toBe(false);
    // A visit someone walked away from is forgotten the moment it is looked for.
    expect(takeClaimVisit(1_002 + CLAIM_RETURN_WINDOW_MS)).toBe(false);
  });
});
