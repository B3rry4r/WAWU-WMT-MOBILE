import { Slot } from 'expo-router';
import { Platform, View } from 'react-native';
import { act, renderRouter, screen, waitFor, fireEvent } from 'expo-router/testing-library';

import RootLayout from '@/app/_layout';
import ActivateRoute from '@/app/activate';
import ForgotPasswordRoute from '@/app/forgot-password';
import ResetPasswordRoute from '@/app/reset-password';
import SettingsPasswordRoute from '@/app/settings/password';
import SignInRoute from '@/app/sign-in';
import WelcomeRoute from '@/app/welcome';
import { resetSessionForTests } from '@/api/session';
import { queryClient } from '@/api/query';
import { ACCESS_KEY, REFRESH_KEY } from '@/api/tokenStore';

/**
 * APP-RESET (R-133 points 4 and 5, R-127): the four ways back into the account, through the real router, root layout, session and
 * sign-in, with WAWU ID as a stand-in that answers as its `forgotPassword`, `resetPassword`, `activate` and `changePassword` do.
 * Each runs as the Android phone and as the iPhone; the web app, which runs the same code (R-127), has its own file.
 *   1. a person whose email was never proven asks for a code to their phone and sets a new password;
 *   2. a person with an activation link sets their first password;
 *   3. a person with a reset link sets a new password (RESET-APP's own file proves the phones; this proves the web);
 *   4. a signed-in person changes their password in Settings.
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

const TOKEN = 'c'.repeat(64);
const EMAIL = 'ada@example.test';
const RESET_LINK = `https://usewmt.com/reset-password?token=${TOKEN}&email=${encodeURIComponent(EMAIL)}`;
const ACTIVATE_LINK = `https://usewmt.com/activate?token=${TOKEN}&email=${encodeURIComponent(EMAIL)}`;
/** The router's navigation reads the browser's DOM on web, which jest's renderer has none of: the web is proven in appResetWeb.test.tsx and on the real export. */
const PLATFORMS = ['android', 'ios'] as const;

const HomeStandIn = () => <View testID="home" />;
const TabsStandIn = () => <Slot />;
const SettingsStandIn = () => <View testID="settings-home" />;
const routes = {
  _layout: RootLayout,
  welcome: WelcomeRoute,
  'sign-in': SignInRoute,
  'forgot-password': ForgotPasswordRoute,
  'reset-password': ResetPasswordRoute,
  activate: ActivateRoute,
  'settings/index': SettingsStandIn,
  'settings/password': SettingsPasswordRoute,
  '(tabs)/_layout': TabsStandIn,
  '(tabs)/index': HomeStandIn,
};

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
type Seen = { method: string; path: string; body: unknown; authorization: string | null };
let seen: Seen[] = [];
/** What the stand-in WAWU ID does with each route: 'ok', or the refusal it answers. */
let answers: Record<string, 'ok' | 'spent' | 'already' | 'wrong-code' | 'offline' | 'too-soon' | 'current-wrong'> = {};

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
  answers = {};
  mockFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const path = new URL(request.url).pathname;
    const text = await request.clone().text();
    seen.push({ method: request.method, path, body: text ? JSON.parse(text) : undefined, authorization: request.headers.get('authorization') });
    const how = answers[path] ?? 'ok';
    if (request.method === 'POST' && path.startsWith('/auth/') && how === 'offline') throw new TypeError('Network request failed');
    if (request.method === 'POST' && path === '/auth/forgot-password') {
      if (how === 'too-soon') return json(429, { statusCode: 429, message: 'Too many requests', error: 'Too Many Requests', code: 'RATE_LIMITED', retryAfterSeconds: 45 });
      return json(200, { data: { message: 'If an account exists, a reset code has been sent.' } });
    }
    if (request.method === 'POST' && path === '/auth/reset-password') {
      if (how === 'wrong-code') return json(401, { statusCode: 401, message: 'Invalid or expired reset code', error: 'Unauthorized' });
      if (how === 'spent') return json(401, { statusCode: 401, message: 'Invalid or expired reset token', error: 'Unauthorized' });
      const sms = (JSON.parse(text) as { code?: string }).code !== undefined;
      return json(200, { data: sms ? { accessToken: 'sms-access', refreshToken: 'sms-refresh', user: {} } : { message: 'Password reset successfully' } });
    }
    if (request.method === 'POST' && path === '/auth/activate') {
      if (how === 'spent') return json(401, { statusCode: 401, message: 'Invalid or expired activation token', error: 'Unauthorized' });
      if (how === 'already') return json(400, { statusCode: 400, message: 'Account already activated', error: 'Bad Request' });
      return json(200, { data: { accessToken: 'act-access', refreshToken: 'act-refresh', user: {} } });
    }
    if (request.method === 'POST' && path === '/auth/change-password') {
      if (how === 'current-wrong') return json(400, { statusCode: 400, message: 'The current password is wrong.', error: 'Bad Request', code: 'CURRENT_PASSWORD_WRONG' });
      return json(200, { data: { accessToken: 'changed-access', refreshToken: 'changed-refresh' } });
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

function pathname(): string {
  const { store } = jest.requireActual('expo-router/build/global-state/router-store') as { store: { getRouteInfo: () => { pathname: string } } };
  return store.getRouteInfo().pathname;
}
function signIn() {
  mockVault.set(ACCESS_KEY, 'stored-access');
  mockVault.set(REFRESH_KEY, 'stored-refresh');
}
const open = (url: string) => renderRouter(routes, { initialUrl: url });
const type = (testID: string, value: string) => act(async () => fireEvent.changeText(screen.getByTestId(testID), value));
const press = (target: string | ReturnType<typeof screen.getByTestId>) =>
  act(async () => fireEvent.press(typeof target === 'string' ? screen.getByTestId(target) : target));
const calls = (path: string) => seen.filter((s) => s.path === path);
const onlyDigits = async (code: string) => {
  const input = await screen.findByTestId('reset-code-input');
  await act(async () => fireEvent.changeText(input, code));
};
async function setNewPassword(password: string, form = 'reset') {
  await screen.findByTestId(`${form}-password`);
  await type(`${form}-new`, password);
  await type(`${form}-confirm`, password);
  await press(`${form}-submit`);
}

describe.each(PLATFORMS)('APP-RESET · a code to the phone (%s)', (name) => {
  beforeEach(() => {
    os = jest.replaceProperty(Platform, 'OS', name);
  });

  const askForCode = async (typed: string) => {
    await open('/forgot-password');
    await screen.findByTestId('forgot-password');
    await press('forgot-switch');
    expect(screen.getByText('Email or phone number')).toBeTruthy();
    await type('forgot-email', typed);
    await press('forgot-submit');
  };

  it('the form offers the phone path under the email path, and the email path still mails a link (method email)', async () => {
    await open('/forgot-password');
    await screen.findByTestId('forgot-password');
    expect(screen.getByText('Send reset link')).toBeTruthy();
    expect(screen.getByText('Send a code to my phone')).toBeTruthy();
    await type('forgot-email', EMAIL);
    await press('forgot-submit');
    expect(await screen.findByTestId('check-email')).toBeTruthy();
    expect(calls('/auth/forgot-password')[0].body).toEqual({ identifier: EMAIL, method: 'email' });
  });

  it('a person whose email is not proven asks for a code by their email, enters it, sets a new password, and signs in with it', async () => {
    await askForCode(EMAIL);
    expect(await screen.findByTestId('reset-code')).toBeTruthy();
    expect(calls('/auth/forgot-password')[0].body).toEqual({ identifier: EMAIL, method: 'sms' });
    expect(screen.getByText('Enter the 6-digit code')).toBeTruthy();

    await onlyDigits('123456');
    expect(await screen.findByTestId('reset-password')).toBeTruthy();
    // The code is checked only when the password is sent, and no request is made for it before then.
    expect(calls('/auth/reset-password')).toHaveLength(0);
    expect(screen.getByTestId('reset-email').props.value).toBe(EMAIL);

    await setNewPassword('brand-new-pass-1');
    expect(await screen.findByTestId('reset-done')).toBeTruthy();
    expect(calls('/auth/reset-password')).toHaveLength(1);
    expect(calls('/auth/reset-password')[0].body).toEqual({ identifier: EMAIL, code: '123456', newPassword: 'brand-new-pass-1' });
    expect(calls('/auth/reset-password')[0].authorization).toBeNull();

    await press(screen.getByText('Sign in'));
    expect(await screen.findByTestId('sign-in')).toBeTruthy();
    expect(screen.getByTestId('sign-in-email').props.value).toBe(EMAIL);
    await type('sign-in-password', 'brand-new-pass-1');
    await press('sign-in-submit');
    await waitFor(() => expect(calls('/auth/login')).toHaveLength(1));
    expect(calls('/auth/login')[0].body).toEqual({ identifier: EMAIL, password: 'brand-new-pass-1' });
  });

  it('a Nigerian number typed the way it is dialled at home is sent as +234, and the code resets by that number', async () => {
    await askForCode('0801 234 5678');
    expect(await screen.findByTestId('reset-code')).toBeTruthy();
    expect(calls('/auth/forgot-password')[0].body).toEqual({ identifier: '+2348012345678', method: 'sms' });
    await onlyDigits('654321');
    await setNewPassword('brand-new-pass-2');
    expect(await screen.findByTestId('reset-done')).toBeTruthy();
    expect(calls('/auth/reset-password')[0].body).toEqual({ identifier: '+2348012345678', code: '654321', newPassword: 'brand-new-pass-2' });
  });

  it('something that is neither an email nor a number sends nothing and says what to type', async () => {
    await askForCode('not a number');
    expect(await screen.findByText(/Enter your email, or your phone number with its country code/)).toBeTruthy();
    expect(seen).toEqual([]);
  });

  it('a wrong or expired code (401) sends the person back to fresh boxes with "That code isn\'t right"; a right one then works', async () => {
    answers['/auth/reset-password'] = 'wrong-code';
    await askForCode(EMAIL);
    await onlyDigits('111111');
    await setNewPassword('brand-new-pass-3');
    expect(await screen.findByTestId('reset-code')).toBeTruthy();
    expect(await screen.findByText("That code isn't right")).toBeTruthy();
    expect(screen.queryByTestId('reset-done')).toBeNull();
    answers['/auth/reset-password'] = 'ok';
    await onlyDigits('222222');
    await setNewPassword('brand-new-pass-3');
    expect(await screen.findByTestId('reset-done')).toBeTruthy();
    expect(calls('/auth/reset-password').map((c) => (c.body as { code: string }).code)).toEqual(['111111', '222222']);
  });

  it('Resend asks for another code by the same way; a too-early ask shows the server\'s own wait', async () => {
    await askForCode(EMAIL);
    expect(await screen.findByTestId('reset-code')).toBeTruthy();
    await press(screen.getByText('Resend code'));
    await waitFor(() => expect(calls('/auth/forgot-password')).toHaveLength(2));
    expect(calls('/auth/forgot-password')[1].body).toEqual({ identifier: EMAIL, method: 'sms' });
    answers['/auth/forgot-password'] = 'too-soon';
    await press(await screen.findByText('Resend code'));
    expect(await screen.findByText('Resend in 0:45')).toBeTruthy();
  });

  it('a dead connection when asking keeps the form and what was typed, and says so', async () => {
    answers['/auth/forgot-password'] = 'offline';
    await askForCode(EMAIL);
    expect(await screen.findByTestId('forgot-banner')).toBeTruthy();
    expect(screen.getByText('No connection')).toBeTruthy();
    expect(screen.getByTestId('forgot-email').props.value).toBe(EMAIL);
    expect(screen.queryByTestId('reset-code')).toBeNull();
  });

  it('"Email me a link instead" goes back to the email way, and back from the boxes returns to the form', async () => {
    await open('/forgot-password');
    await screen.findByTestId('forgot-password');
    await press('forgot-switch');
    await press('forgot-switch');
    expect(screen.getByText('Send reset link')).toBeTruthy();
    await press('forgot-switch');
    await type('forgot-email', EMAIL);
    await press('forgot-submit');
    await screen.findByTestId('reset-code');
    await press(await screen.findByTestId('auth-back'));
    expect(await screen.findByTestId('forgot-password')).toBeTruthy();
  });
});

describe.each(PLATFORMS)('APP-RESET · the activation link (%s)', (name) => {
  beforeEach(() => {
    os = jest.replaceProperty(Platform, 'OS', name);
  });

  it('opens a form for the email in the link; Set password sends exactly the token, the email and the password; Sign in then uses the new password', async () => {
    await open(ACTIVATE_LINK);
    expect(await screen.findByTestId('reset-password')).toBeTruthy();
    expect(pathname()).toBe('/activate');
    expect(screen.getByTestId('reset-email').props.value).toBe(EMAIL);
    expect(screen.getByText('Set your password')).toBeTruthy();
    expect(screen.queryByTestId('sign-in')).toBeNull();

    await setNewPassword('first-password-1');
    expect(await screen.findByTestId('reset-done')).toBeTruthy();
    expect(screen.getByText('Password set')).toBeTruthy();
    expect(calls('/auth/activate')).toHaveLength(1);
    expect(calls('/auth/activate')[0].body).toEqual({ activationToken: TOKEN, email: EMAIL, password: 'first-password-1' });
    expect(calls('/auth/activate')[0].authorization).toBeNull();
    // The session WAWU ID hands back is not kept: nobody is signed in by it.
    expect(mockVault.has(ACCESS_KEY)).toBe(false);

    await press(screen.getByText('Sign in'));
    expect(await screen.findByTestId('sign-in')).toBeTruthy();
    expect(screen.getByTestId('sign-in-email').props.value).toBe(EMAIL);
  });

  it.each([
    ['an expired or used token (401)', 'spent'],
    ['an account that already has a password (400)', 'already'],
  ] as const)('%s: one plain sentence, and the button goes to Forgot password with the email filled in', async (_what, how) => {
    answers['/auth/activate'] = how;
    await open(ACTIVATE_LINK);
    await setNewPassword('first-password-2');
    expect(await screen.findByTestId('reset-invalid')).toBeTruthy();
    expect(screen.getByText('This link no longer works')).toBeTruthy();
    expect(screen.getByText('It has expired or was already used. Ask for a reset link instead.')).toBeTruthy();
    await press(screen.getByText('Back to Forgot password'));
    expect(await screen.findByTestId('forgot-password')).toBeTruthy();
    expect(screen.getByTestId('forgot-email').props.value).toBe(EMAIL);
  });

  it('a link with no token or no email is the same plain screen at once, and sends nothing', async () => {
    await open('https://usewmt.com/activate');
    expect(await screen.findByTestId('reset-invalid')).toBeTruthy();
    expect(seen).toEqual([]);
  });

  it('opened by someone signed in, it still sets the password and Sign in ends that session first', async () => {
    signIn();
    await open(ACTIVATE_LINK);
    await setNewPassword('first-password-3');
    expect(await screen.findByTestId('reset-done')).toBeTruthy();
    await press(screen.getByText('Sign in'));
    expect(await screen.findByTestId('sign-in')).toBeTruthy();
    expect(mockVault.has(ACCESS_KEY)).toBe(false);
  });

  it('a dead connection keeps the form and what was typed', async () => {
    answers['/auth/activate'] = 'offline';
    await open(ACTIVATE_LINK);
    await setNewPassword('first-password-4');
    expect(await screen.findByText('No connection')).toBeTruthy();
    expect(screen.getByTestId('reset-new').props.value).toBe('first-password-4');
  });
});

describe.each(PLATFORMS)('APP-RESET · the reset link (%s)', (name) => {
  beforeEach(() => {
    os = jest.replaceProperty(Platform, 'OS', name);
  });

  it('opens New password for the email in the link, saves with exactly the token, the email and the password, and Sign in follows', async () => {
    await open(RESET_LINK);
    expect(await screen.findByTestId('reset-password')).toBeTruthy();
    expect(screen.getAllByText('New password').length).toBeGreaterThan(0);
    await setNewPassword('brand-new-pass-9');
    expect(await screen.findByTestId('reset-done')).toBeTruthy();
    expect(calls('/auth/reset-password')[0].body).toEqual({ token: TOKEN, email: EMAIL, password: 'brand-new-pass-9' });
    await press(screen.getByText('Sign in'));
    expect(await screen.findByTestId('sign-in')).toBeTruthy();
    expect(screen.getByTestId('sign-in-email').props.value).toBe(EMAIL);
  });

  it('an expired link is one plain screen with the way to Forgot password', async () => {
    answers['/auth/reset-password'] = 'spent';
    await open(RESET_LINK);
    await setNewPassword('brand-new-pass-8');
    expect(await screen.findByTestId('reset-invalid')).toBeTruthy();
    await press(screen.getByText('Back to Forgot password'));
    expect(await screen.findByTestId('forgot-password')).toBeTruthy();
  });
});

describe.each(PLATFORMS)('APP-RESET · change password in Settings (%s)', (name) => {
  beforeEach(() => {
    os = jest.replaceProperty(Platform, 'OS', name);
    signIn();
  });

  it('sends the current and the new password with the signed-in token, keeps the new session, says so, and closes to Settings', async () => {
    await open('/settings/password');
    expect(await screen.findByTestId('password-screen')).toBeTruthy();
    await type('password-current', 'old-password-1');
    await type('password-new', 'new-password-1');
    await press('password-save');
    expect(await screen.findByText('Password changed')).toBeTruthy();
    expect(calls('/auth/change-password')).toHaveLength(1);
    expect(calls('/auth/change-password')[0].body).toEqual({ currentPassword: 'old-password-1', newPassword: 'new-password-1' });
    expect(calls('/auth/change-password')[0].authorization).toBe('Bearer stored-access');
    // The other devices were signed out; this one keeps the new pair WAWU ID issued.
    await waitFor(() => expect(mockVault.get(ACCESS_KEY)).toBe('changed-access'));
    expect(mockVault.get(REFRESH_KEY)).toBe('changed-refresh');
  });

  it('a wrong current password says so on that field and keeps what was typed and the old session', async () => {
    answers['/auth/change-password'] = 'current-wrong';
    await open('/settings/password');
    await screen.findByTestId('password-screen');
    await type('password-current', 'not-it');
    await type('password-new', 'new-password-1');
    await press('password-save');
    expect(await screen.findByText('That is not your current password.')).toBeTruthy();
    expect(screen.getByTestId('password-current').props.value).toBe('not-it');
    expect(mockVault.get(ACCESS_KEY)).toBe('stored-access');
  });
});
