import { Slot, router } from 'expo-router';
import { BackHandler, Platform, View } from 'react-native';
import { act, renderRouter, screen, waitFor, fireEvent } from 'expo-router/testing-library';

import RootLayout from '@/app/_layout';
import ForgotPasswordRoute from '@/app/forgot-password';
import ResetPasswordRoute from '@/app/reset-password';
import SignInRoute from '@/app/sign-in';
import WelcomeRoute from '@/app/welcome';
import { extractExpoPathFromURL } from 'expo-router/build/fork/extractPathFromURL';
import { resetSessionForTests } from '@/api/session';
import { queryClient } from '@/api/query';
import { ACCESS_KEY, REFRESH_KEY } from '@/api/tokenStore';

/**
 * RESET-APP (R-123): the link WAWU ID mails (`https://wawuafrica.com/reset-password?token=...&email=...`) opened in the installed app,
 * through the real router, root layout, session and sign-in, on the Android phone and on the iPhone. WAWU ID is a stand-in that
 * answers as its `resetPasswordByToken` does (message only, one 401 for a wrong, expired or used token).
 */
const mockVault = new Map<string, string>();
const mockFetch = jest.fn();
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

const TOKEN = 'b'.repeat(64);
const EMAIL = 'ada@example.test';
const LINK = `https://wawuafrica.com/reset-password?token=${TOKEN}&email=${encodeURIComponent(EMAIL)}`;
const OSES = ['android', 'ios'] as const;

function HomeStandIn() {
  return <View testID="home" />;
}
function TabsStandIn() {
  return <Slot />;
}
const routes = {
  _layout: RootLayout,
  welcome: WelcomeRoute,
  'sign-in': SignInRoute,
  'forgot-password': ForgotPasswordRoute,
  'reset-password': ResetPasswordRoute,
  '(tabs)/_layout': TabsStandIn,
  '(tabs)/index': HomeStandIn,
};

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
type Seen = { method: string; path: string; body: unknown; authorization: string | null };
let seen: Seen[] = [];
/** What the stand-in WAWU ID does with a reset: 'ok', or the refusal it answers. */
let resetAnswer: 'ok' | 'spent' | 'offline' = 'ok';

beforeAll(async () => {
  const { unmount } = await renderRouter(routes);
  await unmount();
}, 60_000);

let os: jest.ReplaceProperty<typeof Platform.OS> | undefined;
beforeEach(() => {
  mockVault.clear();
  resetSessionForTests();
  queryClient.clear();
  seen = [];
  resetAnswer = 'ok';
  mockFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const path = new URL(request.url).pathname;
    const text = await request.clone().text();
    seen.push({ method: request.method, path, body: text ? JSON.parse(text) : undefined, authorization: request.headers.get('authorization') });
    if (request.method === 'POST' && path === '/auth/reset-password') {
      if (resetAnswer === 'offline') throw new TypeError('Network request failed');
      if (resetAnswer === 'spent') return json(401, { statusCode: 401, message: 'Invalid or expired reset token', error: 'Unauthorized' });
      return json(200, { data: { message: 'Password reset successfully' } });
    }
    if (request.method === 'POST' && path === '/auth/login') return json(200, { data: { accessToken: 'new-access', refreshToken: 'new-refresh' } });
    if (request.method === 'POST' && path === '/auth/logout') return json(200, { data: {} });
    throw new TypeError('Network request failed');
  });
});
afterEach(() => {
  os?.restore();
  os = undefined;
  jest.restoreAllMocks();
});

function pathnameAndParams(): { pathname: string; params: Record<string, unknown> } {
  const { store } = jest.requireActual('expo-router/build/global-state/router-store') as {
    store: { getRouteInfo: () => { pathname: string; params: Record<string, unknown> } };
  };
  const info = store.getRouteInfo();
  return { pathname: info.pathname, params: info.params };
}
const pathname = () => pathnameAndParams().pathname;

function signIn() {
  mockVault.set(ACCESS_KEY, 'stored-access');
  mockVault.set(REFRESH_KEY, 'stored-refresh');
}
const open = (url: string) => renderRouter(routes, { initialUrl: url });
const type = (testID: string, value: string) => act(async () => fireEvent.changeText(screen.getByTestId(testID), value));
const press = (target: string | ReturnType<typeof screen.getByTestId>) =>
  act(async () => fireEvent.press(typeof target === 'string' ? screen.getByTestId(target) : target));
const resetCalls = () => seen.filter((s) => s.path === '/auth/reset-password');

async function setNewPassword(password: string) {
  await screen.findByTestId('reset-password');
  await type('reset-new', password);
  await type('reset-confirm', password);
  await press('reset-submit');
}

describe('RESET-APP · the address names the route', () => {
  it('https and wawu:// both give the route the router matches, with the query kept', () => {
    const pathOf = (url: string) => extractExpoPathFromURL([], url);
    expect(pathOf(LINK)).toBe(`reset-password?token=${TOKEN}&email=${encodeURIComponent(EMAIL)}`);
    // The scheme form reaches the same route and the same two values (the router may hand the at sign back decoded).
    expect(pathOf(`wawu://reset-password?token=${TOKEN}&email=${encodeURIComponent(EMAIL)}`)).toMatch(new RegExp(`^reset-password\\?token=${TOKEN}&email=ada(%40|@)example\\.test$`));
  });
});

describe.each(OSES)('RESET-APP · the mailed link opens the app (%s)', (name) => {
  beforeEach(() => {
    os = jest.replaceProperty(Platform, 'OS', name);
  });

  it('signed out: the link opens New password with the email shown, Save sends exactly the token, the email and the password, and Sign in opens sign-in with the email filled in', async () => {
    await open(LINK);
    expect(await screen.findByTestId('reset-password')).toBeTruthy();
    expect(pathname()).toBe('/reset-password');
    expect(screen.getByTestId('reset-email').props.value).toBe(EMAIL);
    expect(screen.queryByTestId('welcome')).toBeNull();

    await setNewPassword('brand-new-pass-1');
    expect(await screen.findByTestId('reset-done')).toBeTruthy();
    const calls = resetCalls();
    expect(calls).toHaveLength(1);
    expect(calls[0].body).toEqual({ token: TOKEN, email: EMAIL, password: 'brand-new-pass-1' });
    // No session goes with it: the token is the proof.
    expect(calls[0].authorization).toBeNull();

    await press(screen.getByText('Sign in'));
    expect(await screen.findByTestId('sign-in')).toBeTruthy();
    await waitFor(() => expect(pathname()).toBe('/sign-in'));
    expect(screen.getByTestId('sign-in-email').props.value).toBe(EMAIL);
    expect(screen.getByTestId('sign-in-password').props.value).toBe('');

    // And the new password signs in.
    await type('sign-in-password', 'brand-new-pass-1');
    await press('sign-in-submit');
    await waitFor(() => expect(seen.some((s) => s.path === '/auth/login')).toBe(true));
    expect(seen.find((s) => s.path === '/auth/login')?.body).toEqual({ identifier: EMAIL, password: 'brand-new-pass-1' });
  });

  it('signed in: the link still works (it is the person\'s own reset); Sign in ends this phone\'s session first and opens sign-in with the email filled in', async () => {
    signIn();
    await open(LINK);
    expect(await screen.findByTestId('reset-password')).toBeTruthy();
    expect(screen.queryByTestId('home')).toBeNull();
    await setNewPassword('brand-new-pass-2');
    expect(await screen.findByTestId('reset-done')).toBeTruthy();
    expect(resetCalls()[0].body).toEqual({ token: TOKEN, email: EMAIL, password: 'brand-new-pass-2' });
    await press(screen.getByText('Sign in'));
    expect(await screen.findByTestId('sign-in')).toBeTruthy();
    expect(mockVault.has(ACCESS_KEY)).toBe(false);
    expect(mockVault.has(REFRESH_KEY)).toBe(false);
    expect(screen.getByTestId('sign-in-email').props.value).toBe(EMAIL);
  });

  it('an expired or used link (401): one plain screen, and the button goes back to Forgot password with the email filled in', async () => {
    resetAnswer = 'spent';
    await open(LINK);
    await setNewPassword('brand-new-pass-3');
    expect(await screen.findByTestId('reset-invalid')).toBeTruthy();
    expect(screen.getByText('It has expired or was already used. Ask for a new one.')).toBeTruthy();
    await press(screen.getByText('Back to Forgot password'));
    expect(await screen.findByTestId('forgot-password')).toBeTruthy();
    await waitFor(() => expect(pathname()).toBe('/forgot-password'));
    expect(screen.getByTestId('forgot-email').props.value).toBe(EMAIL);
  });

  it('an expired link opened by someone signed in closes to Home (Forgot password is a signed-out screen) and keeps the session', async () => {
    signIn();
    resetAnswer = 'spent';
    await open(LINK);
    await setNewPassword('brand-new-pass-4');
    expect(await screen.findByTestId('reset-invalid')).toBeTruthy();
    await press(screen.getByText('Close'));
    expect(await screen.findByTestId('home')).toBeTruthy();
    expect(mockVault.get(ACCESS_KEY)).toBe('stored-access');
  });

  it('a link with no token or no email shows the spent-link screen at once and sends nothing', async () => {
    await open('https://wawuafrica.com/reset-password');
    expect(await screen.findByTestId('reset-invalid')).toBeTruthy();
    expect(screen.queryByTestId('reset-new')).toBeNull();
    expect(seen).toEqual([]);
  });

  it('a dead connection keeps the form and what was typed, says so, and the same Save works when it is back', async () => {
    resetAnswer = 'offline';
    await open(LINK);
    await setNewPassword('brand-new-pass-5');
    expect(await screen.findByTestId('reset-banner')).toBeTruthy();
    expect(screen.getByText('No connection')).toBeTruthy();
    expect(screen.getByTestId('reset-new').props.value).toBe('brand-new-pass-5');
    resetAnswer = 'ok';
    await press('reset-submit');
    expect(await screen.findByTestId('reset-done')).toBeTruthy();
  });

  it('the round back button on a link opened cold (no screen behind) goes to the welcome screen, and to Home when signed in', async () => {
    await open(LINK);
    await press(await screen.findByTestId('auth-back'));
    expect(await screen.findByTestId('welcome')).toBeTruthy();
    await waitFor(() => expect(pathname()).toBe('/welcome'));
  });

  it('the round back button on a link opened cold, signed in, goes to Home', async () => {
    signIn();
    await open(LINK);
    await press(await screen.findByTestId('auth-back'));
    expect(await screen.findByTestId('home')).toBeTruthy();
  });
});

describe('RESET-APP · Android\'s back button', () => {
  beforeEach(() => {
    os = jest.replaceProperty(Platform, 'OS', 'android');
  });

  it('with a screen behind the link (the link opened from inside the app), the phone\'s back button returns to it and the form is gone', async () => {
    const handlers: (() => boolean | null | undefined)[] = [];
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation(((event: string, handler: () => boolean | null | undefined) => {
      if (event === 'hardwareBackPress') handlers.push(handler);
      return { remove: () => handlers.splice(handlers.indexOf(handler), 1) };
    }) as never);
    await open('/welcome');
    expect(await screen.findByTestId('welcome')).toBeTruthy();
    await act(async () => router.push({ pathname: '/reset-password', params: { token: TOKEN, email: EMAIL } }));
    expect(await screen.findByTestId('reset-password')).toBeTruthy();
    // The phone offers the press to the last handler first; the navigator's takes it.
    let handled: boolean | null | undefined = false;
    await act(async () => {
      for (const handler of [...handlers].reverse()) {
        handled = handler();
        if (handled) break;
      }
    });
    expect(handled).toBe(true);
    await waitFor(() => expect(pathname()).toBe('/welcome'));
    expect(screen.queryByTestId('reset-password')).toBeNull();
  });

  it('with nothing behind the link, no handler holds the press, so the phone itself leaves the app (nothing traps the person on the form)', async () => {
    const handlers: (() => boolean | null | undefined)[] = [];
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation(((event: string, handler: () => boolean | null | undefined) => {
      if (event === 'hardwareBackPress') handlers.push(handler);
      return { remove: () => handlers.splice(handlers.indexOf(handler), 1) };
    }) as never);
    await open(LINK);
    expect(await screen.findByTestId('reset-password')).toBeTruthy();
    let held = false;
    await act(async () => {
      for (const handler of [...handlers].reverse()) held = Boolean(handler()) || held;
    });
    expect(held).toBe(false);
  });
});
