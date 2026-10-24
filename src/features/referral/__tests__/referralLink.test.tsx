import { act, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import RootLayout from '@/app/_layout';
import WelcomeRoute from '@/app/welcome';
import ReferralLinkRoute from '@/app/r/[code]';
import TabsLayout from '@/app/(tabs)/_layout';
import Home from '@/app/(tabs)/index';
import Explore from '@/app/(tabs)/explore';
import Inbox from '@/app/(tabs)/inbox';
import Wallet from '@/app/(tabs)/wallet';
import Me from '@/app/(tabs)/me';
import { resetSessionForTests } from '@/api/session';
import { ACCESS_KEY, REFRESH_KEY } from '@/api/tokenStore';

import { PENDING_KEY, resetPendingCode } from '../pendingCode';

/**
 * V10, G-812: a `wawu/r/<code>` link opened in the installed app claims the code after sign-in, and draws nothing of
 * its own. A signed-out visitor goes to the welcome screen and the code waits; a signed-in person's claim is made now.
 */
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

const routes = {
  _layout: RootLayout,
  welcome: WelcomeRoute,
  'r/[code]': ReferralLinkRoute,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': Home,
  '(tabs)/explore': Explore,
  '(tabs)/inbox': Inbox,
  '(tabs)/wallet': Wallet,
  '(tabs)/me': Me,
};

type Answer = { status: number; body: unknown } | 'offline';
let claimAnswers: Answer[] = [];
let claims: unknown[] = [];

beforeAll(async () => {
  const { unmount } = await renderRouter(routes);
  await unmount();
}, 60_000);

beforeEach(() => {
  mockVault.clear();
  resetSessionForTests();
  resetPendingCode();
  claimAnswers = [];
  claims = [];
  // Every Hub call but the claim is unreachable; the claim is answered as each test sets it.
  mockFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    if (new URL(request.url).pathname !== '/api/hub/me/referrals/claim') throw new TypeError('Network request failed');
    claims.push(JSON.parse(await request.text()));
    const answer = claimAnswers.length > 1 ? claimAnswers.shift()! : claimAnswers[0];
    if (!answer || answer === 'offline') throw new TypeError('Network request failed');
    return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
  });
});

const signIn = () => {
  mockVault.set(ACCESS_KEY, 'stored-access');
  mockVault.set(REFRESH_KEY, 'stored-refresh');
};
const claimed = (code = 'LENNOX'): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data: { code, claimedAt: '2026-10-17T09:00:00.000Z' } } });
const refused = (status: number, reason: string): Answer => ({ status, body: { statusCode: status, message: 'No', data: null, reason: { code: reason, message: 'No' } } });

function pathname(): string {
  const { store } = jest.requireActual('expo-router/build/global-state/router-store') as { store: { getRouteInfo: () => { pathname: string } } };
  return store.getRouteInfo().pathname;
}

describe('REF-03: opening a wawu/r/<code> link in the app', () => {
  it('a signed-out visitor goes to the welcome screen, nothing is claimed yet, and the code waits on the phone', async () => {
    await renderRouter(routes, { initialUrl: '/r/lennox' });
    expect(await screen.findByTestId('welcome')).toBeTruthy();
    expect(claims).toEqual([]);
    expect(mockVault.get(PENDING_KEY)).toBe('lennox');
  });

  it('after sign-in the person lands on Home and the kept code is claimed once, with nothing drawn for it', async () => {
    const first = await renderRouter(routes, { initialUrl: '/r/lennox' });
    await screen.findByTestId('welcome');
    await first.unmount();
    // The person signs up or in, and the app opens on Home.
    signIn();
    resetSessionForTests();
    claimAnswers = [claimed()];
    await renderRouter(routes, { initialUrl: '/' });
    await waitFor(() => expect(claims).toEqual([{ code: 'lennox' }]));
    await waitFor(() => expect(mockVault.get(PENDING_KEY)).toBe(''));
    expect(screen.queryByText(/referral|invite|claimed/i)).toBeNull();
    expect(pathname()).toBe('/');
  });

  it('a signed-in person opening the link has it claimed at once and is sent Home', async () => {
    signIn();
    claimAnswers = [claimed('AMAKA')];
    await renderRouter(routes, { initialUrl: '/r/amaka' });
    await waitFor(() => expect(claims).toEqual([{ code: 'amaka' }]));
    await waitFor(() => expect(pathname()).toBe('/'));
    expect(mockVault.get(PENDING_KEY)).toBe('');
  });

  it('a refusal is final: the code is dropped, nothing is told, and it is not tried again on the next Home', async () => {
    signIn();
    claimAnswers = [refused(409, 'referral_not_new')];
    await renderRouter(routes, { initialUrl: '/r/lennox' });
    await waitFor(() => expect(pathname()).toBe('/'));
    expect(claims).toHaveLength(1);
    expect(mockVault.get(PENDING_KEY)).toBe('');
    expect(screen.queryByText(/refused|not new|could not/i)).toBeNull();
  });

  it('a claim that could not reach the Hub keeps the code for the next time Home opens', async () => {
    signIn();
    claimAnswers = ['offline'];
    await renderRouter(routes, { initialUrl: '/r/lennox' });
    await waitFor(() => expect(pathname()).toBe('/'));
    await waitFor(() => expect(claims.length).toBeGreaterThanOrEqual(1));
    expect(mockVault.get(PENDING_KEY)).toBe('lennox');
    const before = claims.length;

    resetSessionForTests();
    claimAnswers = [claimed()];
    await renderRouter(routes, { initialUrl: '/' });
    await waitFor(() => expect(claims.length).toBe(before + 1));
    await waitFor(() => expect(mockVault.get(PENDING_KEY)).toBe(''));
  });

  it('a link with no usable code just opens the app', async () => {
    signIn();
    await renderRouter(routes, { initialUrl: '/r/not%20a%20code' });
    await waitFor(() => expect(pathname()).toBe('/'));
    expect(claims).toEqual([]);
    expect(mockVault.has(PENDING_KEY)).toBe(false);
  });

  it('a person who opened no link costs no claim', async () => {
    signIn();
    await renderRouter(routes, { initialUrl: '/' });
    await waitFor(() => expect(pathname()).toBe('/'));
    await act(async () => {});
    expect(claims).toEqual([]);
  });
});

describe('LINKS-01: the shared invite, https://wawuafrica.com/r/<code>, opened in the app', () => {
  it('a signed-out visitor goes to the welcome screen and the code waits on the phone', async () => {
    await renderRouter(routes, { initialUrl: 'https://wawuafrica.com/r/lennox' });
    expect(await screen.findByTestId('welcome')).toBeTruthy();
    expect(claims).toEqual([]);
    expect(mockVault.get(PENDING_KEY)).toBe('lennox');
  });

  it('a signed-in person has it claimed at once and is sent Home', async () => {
    signIn();
    claimAnswers = [claimed('AMAKA')];
    await renderRouter(routes, { initialUrl: 'https://wawuafrica.com/r/amaka' });
    await waitFor(() => expect(claims).toEqual([{ code: 'amaka' }]));
    await waitFor(() => expect(pathname()).toBe('/'));
    expect(mockVault.get(PENDING_KEY)).toBe('');
  });
});
