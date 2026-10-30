/* eslint-disable @typescript-eslint/no-require-imports */
import { StyleSheet } from 'react-native';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import RootLayout from '@/app/_layout';
import ForgotPasswordRoute from '@/app/forgot-password';
import SignInRoute from '@/app/sign-in';
import WelcomeRoute from '@/app/welcome';
import AccountTypeRoute from '@/app/account-type';
import TabsLayout from '@/app/(tabs)/_layout';
import Home from '@/app/(tabs)/index';
import Explore from '@/app/(tabs)/explore';
import Inbox from '@/app/(tabs)/inbox';
import Wallet from '@/app/(tabs)/wallet';
import Me from '@/app/(tabs)/me';
import { ACCESS_KEY, REFRESH_KEY } from '@/api/tokenStore';
import { resetSessionForTests, signOut } from '@/api/session';
import { lightColors } from '@/theme/tokens.generated';

const mockVault = new Map<string, string>();

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
  'account-type': AccountTypeRoute,
  'sign-in': SignInRoute,
  'forgot-password': ForgotPasswordRoute,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': Home,
  '(tabs)/explore': Explore,
  '(tabs)/inbox': Inbox,
  '(tabs)/wallet': Wallet,
  '(tabs)/me': Me,
};

type Sent = { path: string; body: Record<string, unknown> };
type Answer = { status: number; body: unknown } | 'offline' | 'hold';

let sent: Sent[] = [];
let answers: Record<string, Answer> = {};
let release: (() => void) | null = null;

const tokens = { data: { accessToken: 'access-1', refreshToken: 'refresh-1' } };
const linkSent = { data: { message: 'If an account exists, a reset code has been sent.', expiresInSeconds: 3600 } };

function installServer() {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input instanceof Request ? input.url : input));
    const path = url.pathname;
    sent.push({ path, body: init?.body ? JSON.parse(String(init.body)) : {} });
    const answer = answers[path] ?? { status: 500, body: { message: 'unexpected call' } };
    if (answer === 'offline') throw new TypeError('Network request failed');
    if (answer === 'hold') await new Promise<void>((resolve) => (release = resolve));
    const final = answers[path] === 'hold' ? { status: 200, body: tokens } : (answer as { status: number; body: unknown });
    return new Response(JSON.stringify(final.body), { status: final.status, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}

const wrongPassword = { status: 401, body: { statusCode: 401, message: 'Invalid credentials' } };
const unknownEmail = { status: 404, body: { statusCode: 404, code: 'USER_NOT_IN_WAWUID', message: 'No account found with this email or phone number.' } };

const loginCalls = () => sent.filter((c) => c.path === '/auth/login');
const resetCalls = () => sent.filter((c) => c.path === '/auth/forgot-password');

async function signInWith(email: string, password: string) {
  await fireEvent.changeText(screen.getByTestId('sign-in-email'), email);
  await fireEvent.changeText(screen.getByTestId('sign-in-password'), password);
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
}

const A25_TITLE = "That email and password don't match";
const A25_BODY = 'Check them, or reset your password.';

beforeAll(async () => {
  installServer();
  const { unmount } = await renderRouter(routes);
  await unmount();
}, 60_000);

beforeEach(() => {
  mockVault.clear();
  sent = [];
  answers = { '/auth/login': { status: 200, body: tokens }, '/auth/forgot-password': { status: 200, body: linkSent } };
  release = null;
  resetSessionForTests();
  installServer();
});

describe('signed out, cold start', () => {
  it('a user who is not signed in lands on the welcome screen, never on Home or sign in', async () => {
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText('The creators and professionals ecosystem.')).toBeTruthy());
    expect(screen.queryByText('Welcome back')).toBeNull();
    expect(screen.queryByRole('header', { name: 'Home' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'Home' })).toBeNull();
  });

  it('a user who signed in before lands on Home with no sign in screen', async () => {
    mockVault.set(ACCESS_KEY, 'stored-access');
    mockVault.set(REFRESH_KEY, 'stored-refresh');
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(screen.queryByText('Welcome back')).toBeNull();
  });

  it('a user who signs out is taken to the welcome screen', async () => {
    mockVault.set(ACCESS_KEY, 'stored-access');
    mockVault.set(REFRESH_KEY, 'stored-refresh');
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    await act(async () => {
      await signOut();
    });
    await waitFor(() => expect(screen.getByText('The creators and professionals ecosystem.')).toBeTruthy());
    expect(screen.queryByRole('tab', { name: 'Home' })).toBeNull();
  });

  it('has a Back button on sign in when there is no screen behind it, and it goes to the welcome screen (RELEASE-02, CHECK-3 L-8; this one assertion pinned "no Back button")', async () => {
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(screen.getByText('The creators and professionals ecosystem.')).toBeTruthy());
    expect(screen.queryByText('Welcome back')).toBeNull();
  });
});

describe('A22: sign in', () => {
  it('a user can enter email and password, sign in, and land on Home', async () => {
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await signInWith('  lennox@wawu.africa ', 'a-long-password');
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(loginCalls()).toHaveLength(1);
    expect(loginCalls()[0].body).toEqual({ identifier: 'lennox@wawu.africa', password: 'a-long-password' });
    expect(mockVault.get(ACCESS_KEY)).toBe('access-1');
    expect(screen.queryByText('Welcome back')).toBeNull();
  });

  it('a user can sign in by pressing enter on the password', async () => {
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await fireEvent.changeText(screen.getByTestId('sign-in-email'), 'lennox@wawu.africa');
    await fireEvent.changeText(screen.getByTestId('sign-in-password'), 'a-long-password');
    await fireEvent(screen.getByTestId('sign-in-password'), 'submitEditing');
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(loginCalls()).toHaveLength(1);
  });

  it('a user can sign in with the phone number they signed up with, sent exactly as typed', async () => {
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await signInWith('08031234412', 'a-long-password');
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(loginCalls()[0].body.identifier).toBe('08031234412');
  });

  it('a user can tap Forgot password? and reach A23, with the email already typed', async () => {
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await fireEvent.changeText(screen.getByTestId('sign-in-email'), 'lennox@wawu.africa');
    await fireEvent.press(screen.getByRole('link', { name: 'Forgot password?' }));
    await waitFor(() => expect(screen.getByText('Forgot your password?')).toBeTruthy());
    expect(screen.getByTestId('forgot-email').props.value).toBe('lennox@wawu.africa');
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
  });

  it('a user who leaves a field empty is told which, and nothing is sent', async () => {
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByText('Enter your email.')).toBeTruthy();
    expect(screen.getByText('Enter your password.')).toBeTruthy();
    expect(sent).toHaveLength(0);
  });

  it('a user who taps Sign in twice sends one request', async () => {
    answers['/auth/login'] = 'hold';
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await fireEvent.changeText(screen.getByTestId('sign-in-email'), 'lennox@wawu.africa');
    await fireEvent.changeText(screen.getByTestId('sign-in-password'), 'a-long-password');
    const button = screen.getByRole('button', { name: 'Sign in' });
    await fireEvent.press(button);
    await fireEvent.press(button);
    await fireEvent(screen.getByTestId('sign-in-password'), 'submitEditing');
    expect(screen.getByRole('button', { name: 'Sign in' }).props.accessibilityState.busy).toBe(true);
    await act(async () => release?.());
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(loginCalls()).toHaveLength(1);
  });
});

describe('A25: sign in refused', () => {
  it('a user with a wrong password sees A25, keeps what they typed, and stays signed out', async () => {
    answers['/auth/login'] = wrongPassword;
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await signInWith('lennox@wawu.africa', 'not-the-password');
    await waitFor(() => expect(screen.getByText(A25_TITLE)).toBeTruthy());
    expect(screen.getByText(A25_BODY)).toBeTruthy();
    expect(screen.getByTestId('sign-in-email').props.value).toBe('lennox@wawu.africa');
    expect(screen.getByTestId('sign-in-password').props.value).toBe('not-the-password');
    expect(StyleSheet.flatten(screen.getByTestId('sign-in-password-box').props.style)).toEqual(
      expect.objectContaining({ borderWidth: 1.5, borderColor: lightColors.danger }),
    );
    expect(StyleSheet.flatten(screen.getByTestId('sign-in-email-box').props.style).borderColor).not.toBe(lightColors.danger);
    expect(screen.queryByRole('header', { name: 'Home' })).toBeNull();
    expect(mockVault.size).toBe(0);
    expect(screen.getByRole('button', { name: 'Sign in' }).props.accessibilityState.busy).toBe(false);
  });

  it('a user with an email nobody has gets the same message as a wrong password', async () => {
    answers['/auth/login'] = unknownEmail;
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await signInWith('nobody@wawu.africa', 'whatever-it-is');
    await waitFor(() => expect(screen.getByText(A25_TITLE)).toBeTruthy());
    expect(screen.getByText(A25_BODY)).toBeTruthy();
    expect(screen.queryByText(/No account found/)).toBeNull();
  });

  it('a user can retry from A25 and get in', async () => {
    answers['/auth/login'] = wrongPassword;
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await signInWith('lennox@wawu.africa', 'typo-password');
    await waitFor(() => expect(screen.getByText(A25_TITLE)).toBeTruthy());
    await fireEvent.changeText(screen.getByTestId('sign-in-password'), 'a-long-password');
    expect(screen.queryByText(A25_TITLE)).toBeNull();
    answers['/auth/login'] = { status: 200, body: tokens };
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(loginCalls()).toHaveLength(2);
  });

  it('a user can reach reset from A25 and the address they typed comes with them', async () => {
    answers['/auth/login'] = wrongPassword;
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await signInWith('lennox@wawu.africa', 'typo-password');
    await waitFor(() => expect(screen.getByText(A25_TITLE)).toBeTruthy());
    await fireEvent.press(screen.getByRole('link', { name: 'Forgot password?' }));
    await waitFor(() => expect(screen.getByText('Forgot your password?')).toBeTruthy());
    expect(screen.getByTestId('forgot-email').props.value).toBe('lennox@wawu.africa');
  });
});

describe('sign in refused for other real causes', () => {
  const cases: [string, Answer, string, string][] = [
    ['an account that was never confirmed', { status: 403, body: { statusCode: 403, code: 'EMAIL_NOT_VERIFIED', message: 'Verify your email address before signing in.' } }, "Your account isn't confirmed yet", 'Finish confirming it, then sign in. If you were signing up here, create your account again to get a new code.'],
    ['a sign-up whose phone was never confirmed', { status: 403, body: { statusCode: 403, code: 'PHONE_NOT_CONFIRMED', message: 'Confirm your phone number to finish signing up.' } }, "Your phone isn't confirmed yet", 'Create your account again to get a new code.'],
    ['too many tries', { status: 429, body: { statusCode: 429, message: 'Too many requests' } }, 'Too many tries', 'Wait a moment, then try again.'],
    ['no connection', 'offline', 'No connection', 'Check your internet and try again.'],
    ['a server error', { status: 500, body: { statusCode: 500, message: 'Internal server error' } }, 'Something went wrong on our side', 'Try again in a moment.'],
  ];

  it.each(cases)('a user is told the real cause: %s, never A25', async (_name, answer, title, body) => {
    answers['/auth/login'] = answer;
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await signInWith('lennox@wawu.africa', 'a-long-password');
    await waitFor(() => expect(screen.getByText(title)).toBeTruthy());
    expect(screen.getByText(body)).toBeTruthy();
    expect(screen.queryByText(A25_TITLE)).toBeNull();
    expect(screen.queryByRole('header', { name: 'Home' })).toBeNull();
    expect(mockVault.size).toBe(0);
  });
});

describe('A23 and A24: reset link', () => {
  async function openForgot(typed = '') {
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    if (typed) await fireEvent.changeText(screen.getByTestId('sign-in-email'), typed);
    await fireEvent.press(screen.getByRole('link', { name: 'Forgot password?' }));
    await waitFor(() => expect(screen.getByText('Forgot your password?')).toBeTruthy());
  }

  it('a user can enter an email, send the reset link by email, and see A24 with that address and the real expiry', async () => {
    await openForgot();
    await fireEvent.changeText(screen.getByTestId('forgot-email'), ' lennox@wawu.africa ');
    await fireEvent.press(screen.getByRole('button', { name: 'Send reset link' }));
    await waitFor(() => expect(screen.getByText('Check your email')).toBeTruthy());
    expect(resetCalls()).toHaveLength(1);
    expect(resetCalls()[0].body).toEqual({ identifier: 'lennox@wawu.africa', method: 'email' });
    expect(screen.getByText('We sent a link to lennox@wawu.africa')).toBeTruthy();
    expect(screen.getByText('It expires in 1 hour.')).toBeTruthy();
    expect(screen.queryByText(/30 minutes/)).toBeNull();
  });

  it.each([
    [1800, 'It expires in 30 minutes.'],
    [5400, 'It expires in 90 minutes.'],
    [7200, 'It expires in 2 hours.'],
  ])('A24 shows the lifetime the server reported (%s seconds)', async (seconds, line) => {
    answers['/auth/forgot-password'] = { status: 200, body: { data: { message: 'ok', expiresInSeconds: seconds } } };
    await openForgot('lennox@wawu.africa');
    await fireEvent.press(screen.getByRole('button', { name: 'Send reset link' }));
    await waitFor(() => expect(screen.getByText(line)).toBeTruthy());
  });

  it('A24 leaves the expiry out when the server does not say how long the link lasts', async () => {
    answers['/auth/forgot-password'] = { status: 200, body: { data: { message: 'ok' } } };
    await openForgot('lennox@wawu.africa');
    await fireEvent.press(screen.getByRole('button', { name: 'Send reset link' }));
    await waitFor(() => expect(screen.getByText('Check your email')).toBeTruthy());
    expect(screen.queryByText(/expires/)).toBeNull();
  });

  it('a user can go back to sign in from A24', async () => {
    await openForgot('lennox@wawu.africa');
    await fireEvent.press(screen.getByRole('button', { name: 'Send reset link' }));
    await waitFor(() => expect(screen.getByText('Check your email')).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: 'Back to sign in' }));
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    expect(screen.queryByText('Check your email')).toBeNull();
  });

  it('a user can go back to sign in from A23 without sending anything', async () => {
    await openForgot();
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    expect(resetCalls()).toHaveLength(0);
  });

  it('a user who types something that is not an email is told, and nothing is sent', async () => {
    await openForgot();
    await fireEvent.press(screen.getByRole('button', { name: 'Send reset link' }));
    expect(screen.getByText('Enter your email.')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('forgot-email'), 'lennox');
    await fireEvent.press(screen.getByRole('button', { name: 'Send reset link' }));
    expect(screen.getByText(/Enter the email you signed up with/)).toBeTruthy();
    expect(resetCalls()).toHaveLength(0);
  });

  it('a user who taps Send reset link twice sends one request', async () => {
    let finish: () => void = () => undefined;
    const pending = new Promise<void>((resolve) => (finish = resolve));
    const original = globalThis.fetch;
    globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith('/auth/forgot-password')) {
        sent.push({ path: '/auth/forgot-password', body: JSON.parse(String(init?.body)) });
        await pending;
        return new Response(JSON.stringify(linkSent), { status: 200 });
      }
      return original(input, init);
    }) as typeof fetch;
    await openForgot('lennox@wawu.africa');
    const button = screen.getByRole('button', { name: 'Send reset link' });
    await fireEvent.press(button);
    await fireEvent.press(button);
    await fireEvent(screen.getByTestId('forgot-email'), 'submitEditing');
    await act(async () => finish());
    await waitFor(() => expect(screen.getByText('Check your email')).toBeTruthy());
    expect(resetCalls()).toHaveLength(1);
  });

  it.each([
    ['no connection', 'offline' as Answer, 'No connection'],
    ['too many tries', { status: 429, body: { message: 'Too many requests' } } as Answer, 'Too many tries'],
    ['a server error', { status: 500, body: { message: 'boom' } } as Answer, 'Something went wrong on our side'],
  ])('a user is told when the link could not be sent (%s) and stays on A23 with the address kept', async (_n, answer, title) => {
    answers['/auth/forgot-password'] = answer;
    await openForgot('lennox@wawu.africa');
    await fireEvent.press(screen.getByRole('button', { name: 'Send reset link' }));
    await waitFor(() => expect(screen.getByText(title)).toBeTruthy());
    expect(screen.queryByText('Check your email')).toBeNull();
    expect(screen.getByTestId('forgot-email').props.value).toBe('lennox@wawu.africa');
  });
});

describe('A24: the expiry in words', () => {
  const { describeExpiry } = require('@/features/auth/expiry') as typeof import('@/features/auth/expiry');

  it.each([
    [3600, '1 hour'],
    [7200, '2 hours'],
    [1800, '30 minutes'],
    [60, '1 minute'],
    [90, '1 minute'],
    [5400, '90 minutes'],
  ])('%s seconds reads "%s"', (seconds, words) => {
    expect(describeExpiry(seconds)).toBe(words);
  });

  it.each([null, 0, -5, Number.NaN])('says nothing for %s', (seconds) => {
    expect(describeExpiry(seconds)).toBeNull();
  });
});
