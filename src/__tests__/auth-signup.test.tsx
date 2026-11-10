import { ActivityIndicator, Animated, Image, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text as NativeText, TextInput, View } from 'react-native';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import RootLayout from '@/app/_layout';
import AccountTypeRoute from '@/app/account-type';
import EmailCodeRoute from '@/app/email-code';
import AuthPreview from '@/app/preview/auth';
import ForgotPasswordRoute from '@/app/forgot-password';
import PhoneCodeRoute from '@/app/phone-code';
import SignInRoute from '@/app/sign-in';
import SignUpRoute from '@/app/sign-up';
import WelcomeRoute from '@/app/welcome';
import TabsLayout from '@/app/(tabs)/_layout';
import Home from '@/app/(tabs)/index';
import Explore from '@/app/(tabs)/explore';
import Inbox from '@/app/(tabs)/inbox';
import Wallet from '@/app/(tabs)/wallet';
import Me from '@/app/(tabs)/me';
import { apiBaseUrl } from '@/api/env';
import { queryClient } from '@/api/query';
import { resetSessionForTests } from '@/api/session';
import { ACCESS_KEY, REFRESH_KEY } from '@/api/tokenStore';
import { retryPendingAcceptance } from '@/features/about/acceptance';
import { clearAccountType } from '@/features/auth/accountType';
import * as aboutApi from '@/features/about/api';
import * as identityApi from '@/features/auth/identityApi';
import * as geoApi from '@/features/geo/geoApi';
import { forgetSignupChannel, knownSignupChannel, signupChannel } from '@/features/auth/signupFlow';
import { resetSignupGate } from '@/features/auth/signupGate';
import { clearSignup, SIGNUP_ATTEMPT_KEY, SIGNUP_PHONE_KEY } from '@/features/auth/signupStore';

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

/*
 * SIGNUP-NAMES (R-82): A3 asks the Hub whether the username is free, and the code step claims it once the session is adopted.
 * The Hub's client keeps the fetch it found when it was first loaded, so this suite answers those two calls at the module that
 * makes them: the name is free, and the claim goes through. They are recorded apart from `calls`, which is only WAWU ID's.
 */
jest.mock('@/features/auth/identityApi', () => ({
  ...jest.requireActual('@/features/auth/identityApi'),
  askUsername: jest.fn(async (handle: string) => ({ handle, available: true, message: null })),
  putIdentity: jest.fn(async (parts: { firstName?: string; lastName?: string; handle?: string }) => ({ firstName: parts.firstName ?? null, lastName: parts.lastName ?? null, handle: parts.handle ?? null })),
}));

/*
 * GEO-03 (R-85): A3 reads the Hub's list of countries for the phone field and the country of residence. For the same reason as above
 * this suite answers the list at the module that makes the call. By default no list arrives, as before the task; a case that wants
 * one calls `serveCountries()`.
 */
// LEGAL-DOCS: the Hub's side of the sign-up agreement. The Hub client binds `fetch` when it loads, so this file's fetch stand-in cannot answer it.
jest.mock('@/features/about/api', () => ({ ...jest.requireActual('@/features/about/api'), acceptPolicies: jest.fn() }));
jest.mock('@/features/geo/geoApi', () => ({
  ...jest.requireActual('@/features/geo/geoApi'),
  fetchCountries: jest.fn(),
}));

const routes = {
  _layout: RootLayout,
  welcome: WelcomeRoute,
  'account-type': AccountTypeRoute,
  'sign-up': SignUpRoute,
  'phone-code': PhoneCodeRoute,
  'email-code': EmailCodeRoute,
  'sign-in': SignInRoute,
  'forgot-password': ForgotPasswordRoute,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': Home,
  '(tabs)/explore': Explore,
  '(tabs)/inbox': Inbox,
  '(tabs)/wallet': Wallet,
  '(tabs)/me': Me,
  // DV2-05: the consent line's two words open these (public screens; their own tests live with the About feature).
  terms: () => <NativeText>Terms page</NativeText>,
  'privacy-policy': () => <NativeText>Privacy policy page</NativeText>,
  // LEGAL-DOCS: A3's "Read them" opens the Legal list.
  'legal-documents/index': () => <NativeText>Legal list page</NativeText>,
};

type Call = { method: string; path: string; url: string; body: Record<string, unknown>; auth: string | null };
type Answer = { status: number; body: unknown } | ((call: Call) => { status: number; body: unknown });

let calls: Call[] = [];
let answers: Record<string, Answer> = {};

const ok = (data: unknown, status = 200) => ({ status, body: { data } });
const refuse = (status: number, code: string, extra: Record<string, unknown> = {}) => ({
  status,
  body: { statusCode: status, code, message: `refused ${code}`, ...extra },
});
/**
 * A texted sign-up: what WAWU ID answers while SIGNUP_VERIFY_CHANNEL is `phone`, its default until the release steps
 * switch it to `email` (no channel field). The app draws it as it always did (the suites below up to "AUTH-07");
 * a mailed sign-up is `mailed()`.
 */
const started = (over: Record<string, unknown> = {}) =>
  ok({ phone: '+2348031234412', expiresIn: 600, resendIn: 7, attempt: 'secret-attempt-1', emailCodeRequired: false, ...over }, 201);
/** A mailed sign-up (SIGNUP_VERIFY_CHANNEL=email, R-39): the answer names the channel and the masked address. */
const mailed = (over: Record<string, unknown> = {}) =>
  started({ channel: 'email', maskedEmail: 'l•••@wawu.africa', expiresIn: 600, ...over });
const session = ok({ accessToken: 'access-new', refreshToken: 'refresh-new', user: { id: 'u1' } });
const progress = (step: string, over: Record<string, unknown> = {}) =>
  ok({ step, inSequence: true, accountType: 'user', steps: ['email'], emailProven: false, ...over });

function installServer() {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : null;
    const url = new URL(String(request ? request.url : input));
    const headers = new Headers(init?.headers ?? request?.headers);
    const call: Call = {
      method: init?.method ?? request?.method ?? 'GET',
      path: url.pathname,
      url: url.toString(),
      body: init?.body ? JSON.parse(String(init.body)) : {},
      auth: headers.get('authorization'),
    };
    calls.push(call);
    const rule = answers[`${call.method} ${call.path}`];
    if (!rule) throw new TypeError('Network request failed');
    const out = typeof rule === 'function' ? rule(call) : rule;
    return new Response(JSON.stringify(out.body), { status: out.status, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}

const callsTo = (path: string) => calls.filter((c) => c.path === path);
/**
 * The app's own ask for the sign-up channel, awaited the way the screens wait: on the test's clock. `renderRouter` puts the
 * clock on fake timers, so an answer that arrives a turn late only lands while `waitFor` moves it; a bare `await` would wait forever.
 */
async function askChannel() {
  const got: { answered: boolean; channel: Awaited<ReturnType<typeof signupChannel>> } = { answered: false, channel: null };
  void signupChannel().then((channel) => {
    got.answered = true;
    got.channel = channel;
  });
  await waitFor(() => expect(got.answered).toBe(true));
  return got.channel;
}
/**
 * Holds back the answer to the next ask for the sign-up channel (the Hub has answered; it reaches the app only when the
 * test lets it go), so an answer to an earlier visit can land after a later visit's. Returns the way to let it go.
 */
function holdNextChannelAnswer() {
  const real = globalThis.fetch;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let held = false;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const mine = !held && String(input instanceof Request ? input.url : input).includes('/auth/signup/channel');
    if (mine) held = true;
    const response = await real(input, init);
    if (mine) await gate;
    return response;
  }) as typeof fetch;
  return release;
}
/** Waits until every request the app has sent so far has been answered or has failed (an answer lands a turn after its call is made). */
async function requestsAnswered() {
  const sent = (globalThis.fetch as jest.Mock).mock.results.map((result) => result.value as Promise<unknown>);
  // nothing sent yet would pass at once, before the ask this waits for: fail loudly instead (FIX-31 3)
  expect(sent.length).toBeGreaterThan(0);
  let open = sent.length;
  for (const request of sent) {
    request.then(
      () => {
        open -= 1;
      },
      () => {
        open -= 1;
      },
    );
  }
  await waitFor(() => expect(open).toBe(0));
}
/** What the app has sent to start or finish a sign-up: A3 also reads which way the code will travel (a GET that sends nothing about the person). */
const sentCalls = () => calls.filter((c) => c.path !== '/auth/signup/channel');

/** The Hub's list in its own shape (`GET /geo/countries`), cut to the three countries these cases use. */
const country = (code: string, name: string, dialCode: string, flag: string, exampleNational: string) => ({ code, name, dialCode, flag, exampleNumber: null, exampleNational, hasRegions: true });
function serveCountries() {
  jest.mocked(geoApi.fetchCountries).mockResolvedValue([
    country('GH', 'Ghana', '+233', '🇬🇭', '024 123 4567'),
    country('NG', 'Nigeria', '+234', '🇳🇬', '0802 123 4567'),
    country('GB', 'United Kingdom', '+44', '🇬🇧', '07400 123456'),
  ]);
}

/*
 * The first test to draw each screen used to pay for React Native's components (loaded on first use, by
 * babel-preset-expo's lazy imports, so touched here at file load) and for the screen's own first render: the sign-in
 * tests (F12) ran out of the one second a `waitFor` allows on a cold transform cache. The hook draws the welcome,
 * account type and sign-in screens once, with a budget of its own, so no test times that.
 */
void [ActivityIndicator, Animated, Image, KeyboardAvoidingView, Pressable, ScrollView, NativeText, TextInput, View];

beforeAll(async () => {
  for (const initialUrl of ['/', '/account-type', '/sign-in']) {
    const { unmount } = await renderRouter(routes, { initialUrl });
    await unmount();
  }
}, 60_000);

beforeEach(async () => {
  mockVault.clear();
  resetSessionForTests();
  resetSignupGate();
  clearAccountType();
  await clearSignup();
  forgetSignupChannel();
  calls = [];
  jest.mocked(identityApi.askUsername).mockClear();
  jest.mocked(identityApi.putIdentity).mockClear();
  jest.mocked(aboutApi.acceptPolicies).mockReset().mockResolvedValue({ items: [] });
  // No country list unless a case serves one, and none kept from an earlier case (the list is cached for the run).
  jest.mocked(geoApi.fetchCountries).mockReset().mockRejectedValue(new TypeError('Network request failed'));
  queryClient.clear();
  answers = {
    // What WAWU ID answers while SIGNUP_VERIFY_CHANNEL is unset or `phone`: the texted sign-up the suites below up to "AUTH-07" run.
    'GET /auth/signup/channel': ok({ channel: 'phone' }),
    'POST /auth/signup': started(),
    'POST /auth/phone/verify/confirm': session,
    'GET /auth/signup/progress': progress('done'),
  };
  installServer();
});

afterEach(() => {
  jest.useRealTimers();
});

const press = (name: string, role: 'button' | 'link' = 'button') => fireEvent.press(screen.getByRole(role, { name }));
const typeDigits = async (digits: string) => {
  for (const digit of digits) await fireEvent.press(screen.getByRole('button', { name: digit }));
};
/**
 * Four wrong codes in a row. The keys are not read while a check is on its way, so each code waits until the screen has
 * taken the Hub's answer (it says the code is wrong, or after the fourth that the sign-up has ended) before the next.
 */
async function fourWrongCodes() {
  for (let round = 0; round < 4; round += 1) {
    await typeDigits(round === 0 ? '481902' : '222222');
    await waitFor(() => expect(callsTo('/auth/phone/verify/confirm').length).toBe(round + 1));
    if (round < 3) await waitFor(() => expect(screen.getByText("That code isn't right")).toBeTruthy());
  }
}

/** A3's three name fields (SIGNUP-NAMES, R-82): first name, last name and username, as a person types them. */
async function fillNames(first = 'Lennox', last = 'Emmanuel', username = 'lennox_e') {
  await fireEvent.changeText(screen.getByTestId('sign-up-first-name'), first);
  await fireEvent.changeText(screen.getByTestId('sign-up-last-name'), last);
  await fireEvent.changeText(screen.getByTestId('sign-up-username'), `@${username}`);
}

async function fillAndContinue(email = 'lennox@wawu.africa', phone = '0803 123 4412', password = 'hunter2hunter2') {
  await fillNames();
  await fireEvent.changeText(screen.getByTestId('sign-up-email'), email);
  await fireEvent.changeText(screen.getByTestId('sign-up-phone'), phone);
  await fireEvent.changeText(screen.getByTestId('sign-up-password'), password);
  // DV2-05: A3 draws "I agree to the terms and privacy policy" (R-67), which must be ticked.
  await fireEvent.press(screen.getByTestId('sign-up-consent'));
  await press('Continue');
}

async function toA3(pick: 'discover' | 'earn' | null = 'earn') {
  await renderRouter(routes, { initialUrl: '/account-type' });
  await waitFor(() => expect(screen.getByText('What brings you to Who Made This?')).toBeTruthy());
  if (pick) await fireEvent.press(screen.getByRole('radio', { name: pick === 'earn' ? /want to earn/ : /here to discover/ }));
  await press('Continue');
  await waitFor(() => expect(screen.getByTestId('sign-up-email')).toBeTruthy());
}

async function toA4(over: Record<string, unknown> = {}) {
  answers['POST /auth/signup'] = started(over);
  await toA3();
  await fillAndContinue();
  await waitFor(() => expect(screen.getByText(/Sent by SMS to/)).toBeTruthy());
}

describe('A2 to A3', () => {
  it('a user who picks one card and taps Continue reaches A3, with no BVN field and no NIBSS line', async () => {
    await toA3();
    // DV2-05 (A3's 16 Oct board): the bar and the heading both read "Create your account", with "Free. Takes a minute." under it.
    expect(screen.getAllByText('Create your account')).toHaveLength(2);
    expect(screen.getByText('Free. Takes a minute.')).toBeTruthy();
    for (const label of ['Email', 'Phone number', 'Password']) expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByText('At least 8 characters')).toBeTruthy();
    expect(screen.queryByText(/BVN/)).toBeNull();
    expect(screen.queryByText(/NIBSS/)).toBeNull();
    expect(screen.queryByText(/wawu/i)).toBeNull();
    expect(sentCalls()).toEqual([]);
  });

  it('Continue on A2 waits for a pick', async () => {
    await renderRouter(routes, { initialUrl: '/account-type' });
    await waitFor(() => expect(screen.getByText('What brings you to Who Made This?')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Continue' }).props.accessibilityState.disabled).toBe(true);
  });

  it('a signed-in visitor to /sign-up and /phone-code lands on Home', async () => {
    mockVault.set(ACCESS_KEY, 'a');
    mockVault.set(REFRESH_KEY, 'r');
    await renderRouter(routes, { initialUrl: '/sign-up' });
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(screen.queryByTestId('sign-up-email')).toBeNull();
  });
});

describe('A3: email, phone and password', () => {
  it('a user who picks Ghana in the phone field sends the number with +233 and Ghana as the country, from the list the Hub served', async () => {
    serveCountries();
    await toA3();
    await waitFor(() => expect(screen.getByTestId('sign-up-country')).toHaveTextContent(/Nigeria/));
    await fireEvent.press(screen.getByTestId('sign-up-phone-country'));
    await fireEvent.press(await screen.findByTestId('sign-up-phone-sheet-row-GH'));
    await fillNames();
    await fireEvent.changeText(screen.getByTestId('sign-up-email'), 'ama@wawu.africa');
    await fireEvent.changeText(screen.getByTestId('sign-up-phone'), '024 123 4567');
    await fireEvent.changeText(screen.getByTestId('sign-up-password'), 'hunter2hunter2');
    await fireEvent.press(screen.getByTestId('sign-up-consent'));
    await press('Continue');
    await waitFor(() => expect(callsTo('/auth/signup').length).toBe(1));
    expect(callsTo('/auth/signup')[0].body).toEqual({
      firstName: 'Lennox',
      lastName: 'Emmanuel',
      email: 'ama@wawu.africa',
      phone: '+233241234567',
      countryCode: 'GH',
      password: 'hunter2hunter2',
      accountType: 'creator',
    });
  });

  it('a user in Nigeria who types 0803... sends +234 with Nigeria as the country when the Hub served the list', async () => {
    serveCountries();
    await toA3();
    await waitFor(() => expect(screen.getByTestId('sign-up-country')).toHaveTextContent(/Nigeria/));
    await fillAndContinue();
    await waitFor(() => expect(callsTo('/auth/signup').length).toBe(1));
    expect(callsTo('/auth/signup')[0].body).toMatchObject({ phone: '+2348031234412', countryCode: 'NG' });
  });

  it('a user who taps Continue with the fields empty or short is told what to fix, and nothing is sent', async () => {
    await toA3();
    await press('Continue');
    expect(screen.getByText('Enter your email.')).toBeTruthy();
    expect(screen.getByText('Enter your phone number.')).toBeTruthy();
    expect(screen.getByText('Use at least 8 characters.')).toBeTruthy();
    expect(sentCalls()).toEqual([]);
  });

  it('a user can enter email, phone and password and tap Continue to reach A4; the earn pick is sent to WAWU ID as creator', async () => {
    await toA4();
    const sent = callsTo('/auth/signup')[0];
    expect(sent.body).toEqual({ firstName: 'Lennox', lastName: 'Emmanuel', email: 'lennox@wawu.africa', phone: '+2348031234412', password: 'hunter2hunter2', accountType: 'creator' });
    expect(screen.getByText('Verify your phone')).toBeTruthy();
    expect(screen.getByText('Enter the 6-digit code')).toBeTruthy();
    expect(screen.getByText('Sent by SMS to 0803 ••• 4412.')).toBeTruthy();
    expect(screen.queryByText(/BVN/)).toBeNull();
  });

  it('the discover pick is sent as user', async () => {
    await toA3('discover');
    await fillAndContinue();
    await waitFor(() => expect(screen.getByText(/Sent by SMS to/)).toBeTruthy());
    expect(callsTo('/auth/signup')[0].body.accountType).toBe('user');
  });

  it('a sign-up with no pick sends no account type', async () => {
    await renderRouter(routes, { initialUrl: '/sign-up' });
    await waitFor(() => expect(screen.getByTestId('sign-up-email')).toBeTruthy());
    await fillAndContinue();
    await waitFor(() => expect(callsTo('/auth/signup').length).toBe(1));
    expect('accountType' in callsTo('/auth/signup')[0].body).toBe(false);
  });

  it('nothing at sign-up goes to the Hub', async () => {
    await toA4();
    await typeDigits('481902');
    await waitFor(() => expect(callsTo('/auth/phone/verify/confirm').length).toBe(1));
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(calls.filter((c) => c.url.startsWith(apiBaseUrl))).toEqual([]);
  });

  it.each([
    ['an email or phone already in use', refuse(409, 'ANY'), 'That email or phone number is already in use'],
    ['a number that is not Nigerian', refuse(400, 'PHONE_NOT_SUPPORTED'), "We can't use that number yet"],
    ['a number that is not a number', refuse(400, 'PHONE_INVALID'), 'That phone number is not valid'],
    ['a text that could not be sent', refuse(503, 'SMS_SEND_FAILED'), "We couldn't send the code"],
    ['too many tries', refuse(429, 'RATE_LIMITED', { retryAfterSeconds: 90 }), 'Too many tries'],
  ])('a user is told, with what they typed kept, when sign-up is refused for %s', async (_name, refusal, title) => {
    answers['POST /auth/signup'] = refusal;
    await toA3();
    await fillAndContinue();
    await waitFor(() => expect(screen.getByText(title)).toBeTruthy());
    expect(screen.getByTestId('sign-up-email').props.value).toBe('lennox@wawu.africa');
    expect(screen.getByTestId('sign-up-phone').props.value).toBe('0803 123 4412');
        expect(screen.queryByText(/Sent by SMS/)).toBeNull();
    expect(mockVault.has(SIGNUP_ATTEMPT_KEY)).toBe(false);
  });

  it('says when the 429 names a wait, in the server\'s own figure', async () => {
    answers['POST /auth/signup'] = refuse(429, 'RATE_LIMITED', { retryAfterSeconds: 90 });
    await toA3();
    await fillAndContinue();
    await waitFor(() => expect(screen.getByText(/Try again in 1:30/)).toBeTruthy());
  });

  it('a user with no connection is told so and can tap Continue again', async () => {
    delete answers['POST /auth/signup'];
    await toA3();
    await fillAndContinue();
    await waitFor(() => expect(screen.getByText('No connection')).toBeTruthy());
    answers['POST /auth/signup'] = started();
    await press('Continue');
    await waitFor(() => expect(screen.getByText(/Sent by SMS to/)).toBeTruthy());
  });

  it('keeps the sign-up secret in the secure store only: not in any address, and gone when the sign-up ends', async () => {
    await toA4();
    expect(mockVault.get(SIGNUP_ATTEMPT_KEY)).toBe('secret-attempt-1');
    expect(mockVault.get(SIGNUP_PHONE_KEY)).toBe('+2348031234412');
    expect(calls.some((c) => c.url.includes('secret-attempt-1'))).toBe(false);
    await typeDigits('481902');
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(mockVault.has(SIGNUP_ATTEMPT_KEY)).toBe(false);
    expect(mockVault.has(SIGNUP_PHONE_KEY)).toBe(false);
  });

  it('a new sign-up replaces the secret of the one before it', async () => {
    await toA4();
    answers['POST /auth/signup'] = started({ attempt: 'secret-attempt-2' });
    await press('Back');
    await waitFor(() => expect(screen.getByTestId('sign-up-email')).toBeTruthy());
    await press('Continue');
    await waitFor(() => expect(mockVault.get(SIGNUP_ATTEMPT_KEY)).toBe('secret-attempt-2'));
  });
});

describe('A4: the phone code', () => {
  it('a user who enters the 6 digits is signed in with the session the server issued, and lands on Home', async () => {
    await toA4();
    await typeDigits('481902');
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    const confirm = callsTo('/auth/phone/verify/confirm')[0];
    expect(confirm.body).toEqual({ phone: '+2348031234412', attempt: 'secret-attempt-1', code: '481902' });
    expect(mockVault.get(ACCESS_KEY)).toBe('access-new');
    expect(mockVault.get(REFRESH_KEY)).toBe('refresh-new');
    expect(callsTo('/auth/signup/progress')[0].auth).toBe('Bearer access-new');
  });

  /** An access token that carries who the account is, as the Hub's own tokens do; the other cases use a plain word. */
  const tokenFor = (sub: string) => `h.${Buffer.from(JSON.stringify({ sub })).toString('base64url')}.s`;

  it('LEGAL-DOCS: once the new account has its session, the app tells the Hub what A3\'s box agreed to, and remembers it was done', async () => {
    answers['POST /auth/phone/verify/confirm'] = ok({ accessToken: tokenFor('u-new'), refreshToken: 'refresh-new', user: { id: 'u-new' } });
    await toA4();
    await typeDigits('481902');
    await waitFor(() => expect(aboutApi.acceptPolicies).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockVault.get('wmt.legal.accept.u-new')).toBe('done'));
  });

  it('LEGAL-DOCS: a sign-up that goes through the plain-token cases sends nothing (an account the app cannot name has no mark)', async () => {
    await toA4();
    await typeDigits('481902');
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(aboutApi.acceptPolicies).not.toHaveBeenCalled();
    expect([...mockVault.keys()].filter((key) => key.startsWith('wmt.legal.accept.'))).toEqual([]);
  });

  it('LEGAL-DOCS: when the Hub cannot be reached the person is still signed in, the agreement waits, and the next start sends it again', async () => {
    answers['POST /auth/phone/verify/confirm'] = ok({ accessToken: tokenFor('u-wait'), refreshToken: 'refresh-new', user: { id: 'u-wait' } });
    jest.mocked(aboutApi.acceptPolicies).mockRejectedValue(new TypeError('Network request failed'));
    await toA4();
    await typeDigits('481902');
    await waitFor(() => expect(aboutApi.acceptPolicies).toHaveBeenCalled());
    // Signed in all the same: the session is kept, only the agreement waits.
    await waitFor(() => expect(mockVault.get(ACCESS_KEY)).toBe(tokenFor('u-wait')));
    expect(mockVault.get('wmt.legal.accept.u-wait')).toBe('pending');
    const before = jest.mocked(aboutApi.acceptPolicies).mock.calls.length;
    jest.mocked(aboutApi.acceptPolicies).mockResolvedValue({ items: [] });
    await act(async () => {
      await retryPendingAcceptance();
    });
    expect(jest.mocked(aboutApi.acceptPolicies).mock.calls.length).toBe(before + 1);
    expect(mockVault.get('wmt.legal.accept.u-wait')).toBe('done');
    // Settled: another start sends nothing more.
    await act(async () => {
      await retryPendingAcceptance();
    });
    expect(jest.mocked(aboutApi.acceptPolicies).mock.calls.length).toBe(before + 1);
  });

  it('shows the resend countdown from the server\'s resendIn and a Resend code button when it reaches zero', async () => {
    jest.useFakeTimers();
    await toA4();
    expect(screen.getByText('Resend in 0:07')).toBeTruthy();
    expect(screen.queryByText(/0:42/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Resend code' })).toBeNull();
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    expect(screen.getByText('Resend in 0:04')).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(4000);
    });
    expect(screen.getByRole('button', { name: 'Resend code' })).toBeTruthy();
    expect(screen.queryByText(/Resend in/)).toBeNull();
  });

  it('a user can resend after the countdown, and the new countdown is the server\'s new figure', async () => {
    jest.useFakeTimers();
    await toA4();
    await act(async () => {
      jest.advanceTimersByTime(7000);
    });
    answers['POST /auth/phone/verify/start'] = ok({ phone: '+2348031234412', expiresIn: 600, resendIn: 31 });
    await press('Resend code');
    await waitFor(() => expect(screen.getByText('Resend in 0:31')).toBeTruthy());
    expect(callsTo('/auth/phone/verify/start')[0].body).toEqual({ phone: '+2348031234412', attempt: 'secret-attempt-1' });
    expect(screen.getByText('We sent a new code.')).toBeTruthy();
  });

  it('a resend that comes too soon shows the wait the server names', async () => {
    jest.useFakeTimers();
    await toA4();
    await act(async () => {
      jest.advanceTimersByTime(7000);
    });
    answers['POST /auth/phone/verify/start'] = refuse(429, 'PHONE_CODE_RESEND_TOO_SOON', { retryAfterSeconds: 25 });
    await press('Resend code');
    await waitFor(() => expect(screen.getByText('Resend in 0:25')).toBeTruthy());
  });

  it('the email code field shows, and is sent with the phone code, when sign-up says emailCodeRequired', async () => {
    await toA4({ emailCodeRequired: true });
    expect(screen.getByText('Code from your email')).toBeTruthy();
    await typeDigits('481902');
    await act(async () => undefined);
    expect(callsTo('/auth/phone/verify/confirm')).toEqual([]);
    expect(screen.getByRole('button', { name: 'Continue' }).props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByTestId('phone-code-extra'), '123456');
    await press('Continue');
    await waitFor(() => expect(callsTo('/auth/phone/verify/confirm').length).toBe(1));
    expect(callsTo('/auth/phone/verify/confirm')[0].body.emailCode).toBe('123456');
  });
});

describe('A15: a wrong code', () => {
  it('a user who enters a wrong code sees "That code isn\'t right" with the digits kept, and can delete and re-enter', async () => {
    await toA4();
    answers['POST /auth/phone/verify/confirm'] = refuse(400, 'PHONE_CODE_INVALID');
    await typeDigits('481902');
    await waitFor(() => expect(screen.getByText("That code isn't right")).toBeTruthy());
    expect(screen.getByLabelText('Code, 6 of 6 digits entered')).toBeTruthy();
    expect(callsTo('/auth/phone/verify/confirm').length).toBe(1);
    await press('Delete');
    expect(screen.queryByText("That code isn't right")).toBeNull();
    expect(screen.getByLabelText('Code, 5 of 6 digits entered')).toBeTruthy();
    answers['POST /auth/phone/verify/confirm'] = session;
    await typeDigits('3');
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(callsTo('/auth/phone/verify/confirm')[1].body.code).toBe('481903');
  });

  it('a user who taps a digit after a wrong code starts a fresh code', async () => {
    await toA4();
    answers['POST /auth/phone/verify/confirm'] = refuse(400, 'PHONE_CODE_INVALID');
    await typeDigits('481902');
    await waitFor(() => expect(screen.getByText("That code isn't right")).toBeTruthy());
    await typeDigits('7');
    expect(screen.queryByText("That code isn't right")).toBeNull();
    expect(screen.getByLabelText('Code, 1 of 6 digits entered')).toBeTruthy();
  });

  it('the fourth wrong code in a row means the sign-up is gone: the user can only start again, and the secret is cleared', async () => {
    await toA4();
    answers['POST /auth/phone/verify/confirm'] = refuse(400, 'PHONE_CODE_INVALID');
    await fourWrongCodes();
    await waitFor(() => expect(screen.getByText('This sign-up has ended')).toBeTruthy());
    await press('Start again');
    await waitFor(() => expect(screen.getByTestId('sign-up-email')).toBeTruthy());
    expect(mockVault.has(SIGNUP_ATTEMPT_KEY)).toBe(false);
    expect(screen.queryByRole('link', { name: 'Enter the code we sent' })).toBeNull();
  });

  it('a locked number shows the wait the server names, ticking down, keys off until it ends', async () => {
    jest.useFakeTimers();
    await toA4();
    answers['POST /auth/phone/verify/confirm'] = refuse(429, 'PHONE_CODE_LOCKED', { retryAfterSeconds: 900 });
    await typeDigits('481902');
    await waitFor(() => expect(screen.getByText('Too many tries. Try again in 15:00.')).toBeTruthy());
    await act(async () => {
      jest.advanceTimersByTime(60_000);
    });
    expect(screen.getByText('Too many tries. Try again in 14:00.')).toBeTruthy();
    await typeDigits('1');
    expect(screen.getByLabelText('Code, 0 of 6 digits entered')).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(840_000);
    });
    expect(screen.queryByText(/Too many tries/)).toBeNull();
    await typeDigits('1');
    expect(screen.getByLabelText('Code, 1 of 6 digits entered')).toBeTruthy();
  });

  it.each([
    ['no connection', null, 'No connection'],
    ['the text service down', refuse(503, 'SMS_NOT_CONFIGURED'), null],
    ['a server fault', refuse(500, 'X'), 'Something went wrong on our side'],
    ['already confirmed', refuse(409, 'PHONE_ALREADY_CONFIRMED'), 'This sign-up is already confirmed'],
  ])('a refused check for %s is said in words, and the digits can be tried again', async (_name, refusal, title) => {
    await toA4();
    if (refusal) answers['POST /auth/phone/verify/confirm'] = refusal;
    else delete answers['POST /auth/phone/verify/confirm'];
    await typeDigits('481902');
    await waitFor(() => expect(screen.getByTestId('phone-code-banner')).toBeTruthy());
    if (title) expect(screen.getByText(title)).toBeTruthy();
    expect(screen.queryByText("That code isn't right")).toBeNull();
  });
});

describe('resume after quitting', () => {
  const hold = () => {
    mockVault.set(SIGNUP_PHONE_KEY, '+2348031234412');
    mockVault.set(SIGNUP_ATTEMPT_KEY, 'secret-attempt-1');
  };

  it('a user who quit after A3 and opens the app finds A4 again, with the time that is left on the resend', async () => {
    hold();
    answers['POST /auth/signup/resume'] = ok({ step: 'phone', phone: '+2348031234412', expiresIn: 500, resendIn: 12, emailCodeRequired: false, accountType: 'creator' });
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText('Sent by SMS to 0803 ••• 4412.')).toBeTruthy());
    expect(screen.getByText('Resend in 0:12')).toBeTruthy();
    expect(callsTo('/auth/signup/resume')[0].body).toEqual({ phone: '+2348031234412', attempt: 'secret-attempt-1' });
    expect(callsTo('/auth/phone/verify/start')).toEqual([]);
    await typeDigits('481902');
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
  });

  it('a browser reloaded on the code address finds the same code screen, not a blank page', async () => {
    hold();
    answers['POST /auth/signup/resume'] = ok({ step: 'phone', phone: '+2348031234412', expiresIn: 500, resendIn: 12, emailCodeRequired: false });
    await renderRouter(routes, { initialUrl: '/phone-code' });
    await waitFor(() => expect(screen.getByText('Sent by SMS to 0803 ••• 4412.')).toBeTruthy());
  });

  it('a browser reloaded on the code address has a Back button that opens A3, where the sent code can still be entered', async () => {
    hold();
    answers['POST /auth/signup/resume'] = ok({ step: 'phone', phone: '+2348031234412', expiresIn: 500, resendIn: 12, emailCodeRequired: false });
    await renderRouter(routes, { initialUrl: '/phone-code' });
    await waitFor(() => expect(screen.getByText('Sent by SMS to 0803 ••• 4412.')).toBeTruthy());
    await press('Back');
    await waitFor(() => expect(screen.getByTestId('sign-up-email')).toBeTruthy());
    expect(screen.getByRole('link', { name: 'Enter the code we sent' })).toBeTruthy();
  });

  it('the code address with no sign-up left sends the user to A3', async () => {
    await renderRouter(routes, { initialUrl: '/phone-code' });
    await waitFor(() => expect(screen.getByTestId('sign-up-email')).toBeTruthy());
  });

  it('a sign-up the server no longer holds is forgotten and the app opens on the welcome screen', async () => {
    hold();
    answers['POST /auth/signup/resume'] = ok({ step: 'details' });
    await renderRouter(routes);
    await waitFor(() => expect(mockVault.has(SIGNUP_ATTEMPT_KEY)).toBe(false));
    expect(screen.getByText('Create. Sell. Get paid. Connect. Grow.')).toBeTruthy();
    expect(screen.queryByText(/Sent by SMS/)).toBeNull();
  });

  it('an app opened with no connection keeps the held sign-up and shows the welcome screen', async () => {
    hold();
    await renderRouter(routes);
    await waitFor(() => expect(callsTo('/auth/signup/resume').length).toBe(1));
    expect(screen.getByText('Create. Sell. Get paid. Connect. Grow.')).toBeTruthy();
    expect(mockVault.get(SIGNUP_ATTEMPT_KEY)).toBe('secret-attempt-1');
  });

  it('a sign-in refused as not confirmed, with a sign-up held, opens A4', async () => {
    hold();
    answers['POST /auth/signup/resume'] = ok({ step: 'details' });
    answers['POST /auth/login'] = refuse(403, 'PHONE_NOT_CONFIRMED');
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await waitFor(() => expect(callsTo('/auth/signup/resume').length).toBe(0));
    mockVault.set(SIGNUP_PHONE_KEY, '+2348031234412');
    mockVault.set(SIGNUP_ATTEMPT_KEY, 'secret-attempt-1');
    answers['POST /auth/signup/resume'] = ok({ step: 'phone', phone: '+2348031234412', expiresIn: 300, resendIn: 5, emailCodeRequired: false });
    await fireEvent.changeText(screen.getByTestId('sign-in-email'), 'lennox@wawu.africa');
    await fireEvent.changeText(screen.getByTestId('sign-in-password'), 'hunter2hunter2');
    await press('Sign in');
    await waitFor(() => expect(screen.getByText(/Sent by SMS to/)).toBeTruthy());
  });
});

describe('the email step', () => {
  const signedIn = () => {
    mockVault.set(ACCESS_KEY, 'access-new');
    mockVault.set(REFRESH_KEY, 'refresh-new');
  };

  it('a user who proved the phone is taken to the email step before Home, with the code mailed to their address', async () => {
    await toA4();
    answers['GET /auth/signup/progress'] = progress('email');
    answers['POST /auth/signup/email/start'] = ok({ email: 'lennox@wawu.africa', expiresIn: 600, resendIn: 9 });
    await typeDigits('481902');
    await waitFor(() => expect(screen.getByText('Check your email')).toBeTruthy());
    await waitFor(() => expect(screen.getByText('Sent to lennox@wawu.africa')).toBeTruthy());
    expect(screen.getByText('Resend in 0:09')).toBeTruthy();
    expect(screen.queryByRole('header', { name: 'Home' })).toBeNull();
    expect(callsTo('/auth/signup/email/start')[0].auth).toBe('Bearer access-new');
  });

  it('a user can prove the email with the 6-digit code and reach Home', async () => {
    signedIn();
    answers['GET /auth/signup/progress'] = progress('email');
    answers['POST /auth/signup/email/start'] = ok({ email: 'lennox@wawu.africa', expiresIn: 600, resendIn: 9 });
    answers['POST /auth/signup/email/confirm'] = progress('done', { emailProven: true });
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText('Sent to lennox@wawu.africa')).toBeTruthy());
    await typeDigits('123456');
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(callsTo('/auth/signup/email/confirm')[0].body).toEqual({ code: '123456' });
  });

  it('a wrong email code says so, and a locked one shows the server\'s wait', async () => {
    signedIn();
    answers['GET /auth/signup/progress'] = progress('email');
    answers['POST /auth/signup/email/start'] = ok({ email: 'lennox@wawu.africa', expiresIn: 600, resendIn: 9 });
    answers['POST /auth/signup/email/confirm'] = refuse(400, 'EMAIL_CODE_INVALID');
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText('Sent to lennox@wawu.africa')).toBeTruthy());
    await typeDigits('123456');
    await waitFor(() => expect(screen.getByText("That code isn't right")).toBeTruthy());
    await press('Delete');
    answers['POST /auth/signup/email/confirm'] = refuse(429, 'EMAIL_CODE_LOCKED', { retryAfterSeconds: 600 });
    await typeDigits('6');
    await waitFor(() => expect(screen.getByText('Too many tries. Try again in 10:00.')).toBeTruthy());
  });

  it('a user can put the email off with Later and reach Home', async () => {
    signedIn();
    answers['GET /auth/signup/progress'] = progress('email');
    answers['POST /auth/signup/email/start'] = ok({ email: 'lennox@wawu.africa', expiresIn: 600, resendIn: 9 });
    answers['POST /auth/signup/progress'] = progress('done');
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText('Sent to lennox@wawu.africa')).toBeTruthy());
    await press('Later');
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(callsTo('/auth/signup/progress').find((c) => c.method === 'POST')?.body).toEqual({ step: 'email' });
  });

  it('a user who quit on the email step finds it again on the next start', async () => {
    signedIn();
    answers['GET /auth/signup/progress'] = progress('email');
    answers['POST /auth/signup/email/start'] = refuse(429, 'EMAIL_CODE_RESEND_TOO_SOON', { retryAfterSeconds: 33 });
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText('Check your email')).toBeTruthy());
    await waitFor(() => expect(screen.getByText('Resend in 0:33')).toBeTruthy());
  });

  it('a mail that could not be started offers Try again', async () => {
    signedIn();
    answers['GET /auth/signup/progress'] = progress('email');
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByTestId('email-code-failed')).toBeTruthy());
    answers['POST /auth/signup/email/start'] = ok({ email: 'lennox@wawu.africa', expiresIn: 600, resendIn: 9 });
    await press('Try again');
    await waitFor(() => expect(screen.getByText('Sent to lennox@wawu.africa')).toBeTruthy());
  });

  it('an account outside the sign-up sequence (a web account) goes straight to Home and never sees the email step', async () => {
    signedIn();
    answers['GET /auth/signup/progress'] = progress('done', { inSequence: false });
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(callsTo('/auth/signup/email/start')).toEqual([]);
  });

  it('a signed-out visitor to /email-code lands on the welcome screen', async () => {
    await renderRouter(routes, { initialUrl: '/email-code' });
    await waitFor(() => expect(screen.getByText('Create. Sell. Get paid. Connect. Grow.')).toBeTruthy());
  });
});

describe('fix round 1', () => {
  const globals = globalThis as unknown as { __DEV__: boolean };

  it('F1: a sign-up that has ended offers Start again and no Resend, so nothing false is said about a text', async () => {
    await toA4();
    answers['POST /auth/phone/verify/confirm'] = refuse(400, 'PHONE_CODE_INVALID');
    await fourWrongCodes();
    await waitFor(() => expect(screen.getByText('This sign-up has ended')).toBeTruthy());
    expect(screen.queryByRole('button', { name: 'Resend code' })).toBeNull();
    expect(screen.queryByText(/Resend in/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Start again' })).toBeTruthy();
    expect(callsTo('/auth/phone/verify/start')).toEqual([]);
  });

  it.each([
    ['too soon after the first text', refuse(429, 'PHONE_CODE_RESEND_TOO_SOON', { retryAfterSeconds: 13 }), 'A code was just sent'],
    ['an hourly limit', refuse(429, 'RATE_LIMITED', { retryAfterSeconds: 3600 }), 'Too many tries'],
    ['a server fault', refuse(500, 'X'), 'Something went wrong on our side'],
    ['no connection', null, 'No connection'],
  ])('F2: a Continue on A3 refused for %s keeps the sign-up already waiting for its code, and the user can still enter it', async (_name, refusal, title) => {
    await toA4();
    await press('Back');
    await waitFor(() => expect(screen.getByTestId('sign-up-email')).toBeTruthy());
    if (refusal) answers['POST /auth/signup'] = refusal;
    else delete answers['POST /auth/signup'];
    await press('Continue');
    await waitFor(() => expect(screen.getByText(title)).toBeTruthy());
    expect(mockVault.get(SIGNUP_ATTEMPT_KEY)).toBe('secret-attempt-1');
    expect(mockVault.get(SIGNUP_PHONE_KEY)).toBe('+2348031234412');
    await press('Enter the code we sent', 'link');
    await waitFor(() => expect(screen.getByText('Sent by SMS to 0803 ••• 4412.')).toBeTruthy());
    await typeDigits('481902');
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(callsTo('/auth/phone/verify/confirm')[0].body.attempt).toBe('secret-attempt-1');
  });

  it('F2: A3 offers the sent code only while a sign-up is held: it appears on coming back from A4 and goes after Start again', async () => {
    await toA4();
    answers['POST /auth/phone/verify/confirm'] = refuse(400, 'PHONE_CODE_INVALID');
    await press('Back');
    await waitFor(() => expect(screen.getByRole('link', { name: 'Enter the code we sent' })).toBeTruthy());
    await press('Enter the code we sent', 'link');
    await waitFor(() => expect(screen.getByText(/Sent by SMS to/)).toBeTruthy());
    await fourWrongCodes();
    await waitFor(() => expect(screen.getByText('This sign-up has ended')).toBeTruthy());
    await press('Start again');
    await waitFor(() => expect(screen.getByTestId('sign-up-email')).toBeTruthy());
    expect(screen.queryByRole('link', { name: 'Enter the code we sent' })).toBeNull();
  });

  it('F2: the too-soon answer names the wait in the server\'s figure', async () => {
    await toA4();
    await press('Back');
    answers['POST /auth/signup'] = refuse(429, 'PHONE_CODE_RESEND_TOO_SOON', { retryAfterSeconds: 13 });
    await press('Continue');
    await waitFor(() => expect(screen.getByText(/Wait 0:13 before sending another/)).toBeTruthy());
  });

  it('F3: the six boxes shrink to fit a narrow phone instead of running off both edges', async () => {
    await toA4();
    const row = StyleSheet.flatten(screen.getByTestId('phone-code-boxes').props.style);
    expect(row.alignSelf).toBe('stretch');
    const box = screen.getByTestId('phone-code-boxes').children[0] as unknown as { props: { style: object } };
    expect((StyleSheet.flatten(box.props.style) as { flexShrink?: number }).flexShrink).toBe(1);
  });

  it('F4: in a release build a signed-in user on the email step who opens a development route lands on the email step, not a blank page', async () => {
    mockVault.set(ACCESS_KEY, 'access-new');
    mockVault.set(REFRESH_KEY, 'refresh-new');
    answers['GET /auth/signup/progress'] = progress('email');
    answers['POST /auth/signup/email/start'] = ok({ email: 'lennox@wawu.africa', expiresIn: 600, resendIn: 9 });
    globals.__DEV__ = false;
    try {
      await renderRouter({ ...routes, 'preview/auth': AuthPreview }, { initialUrl: '/preview/auth' });
      await waitFor(() => expect(screen.getByText('Sent to lennox@wawu.africa')).toBeTruthy());
    } finally {
      globals.__DEV__ = true;
    }
  });

  it.each([
    ['a server fault', refuse(500, 'X'), 'Something went wrong on our side'],
    ['no connection', null, 'No connection'],
  ])('F5: after %s on the sixth digit the user is told, can tap Try again, and the keypad still works', async (_name, refusal, title) => {
    await toA4();
    if (refusal) answers['POST /auth/phone/verify/confirm'] = refusal;
    else delete answers['POST /auth/phone/verify/confirm'];
    await typeDigits('481902');
    await waitFor(() => expect(screen.getByText(title)).toBeTruthy());
    answers['POST /auth/phone/verify/confirm'] = session;
    await press('Try again');
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(callsTo('/auth/phone/verify/confirm').length).toBe(2);
    expect(callsTo('/auth/phone/verify/confirm')[1].body.code).toBe('481902');
  });

  it('F5: after a failed check a tapped digit starts a fresh code', async () => {
    await toA4();
    delete answers['POST /auth/phone/verify/confirm'];
    await typeDigits('481902');
    await waitFor(() => expect(screen.getByText('No connection')).toBeTruthy());
    await typeDigits('7');
    expect(screen.getByLabelText('Code, 1 of 6 digits entered')).toBeTruthy();
    expect(screen.queryByText('No connection')).toBeNull();
  });

  it('F9: two quick taps on A3 Continue send one sign-up', async () => {
    await toA3();
    await fillNames();
    await fireEvent.changeText(screen.getByTestId('sign-up-email'), 'lennox@wawu.africa');
    await fireEvent.changeText(screen.getByTestId('sign-up-phone'), '0803 123 4412');
    await fireEvent.changeText(screen.getByTestId('sign-up-password'), 'hunter2hunter2');
    await fireEvent.press(screen.getByTestId('sign-up-consent'));
    const button = screen.getByRole('button', { name: 'Continue' });
    await act(async () => {
      fireEvent.press(button);
      fireEvent.press(button);
    });
    await waitFor(() => expect(screen.getByText(/Sent by SMS to/)).toBeTruthy());
    expect(callsTo('/auth/signup').length).toBe(1);
  });

  it('F9: two quick taps on Continue of the code screen send one check', async () => {
    await toA4({ emailCodeRequired: true });
    await typeDigits('481902');
    await fireEvent.changeText(screen.getByTestId('phone-code-extra'), '123456');
    const button = screen.getByRole('button', { name: 'Continue' });
    await act(async () => {
      fireEvent.press(button);
      fireEvent.press(button);
    });
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(callsTo('/auth/phone/verify/confirm').length).toBe(1);
  });

  it('F12: a sign-in by email of a sign-up never confirmed (the server answers EMAIL_NOT_VERIFIED), with nothing held here, says how to get a new code', async () => {
    answers['POST /auth/login'] = refuse(403, 'EMAIL_NOT_VERIFIED');
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await fireEvent.changeText(screen.getByTestId('sign-in-email'), 'lennox@wawu.africa');
    await fireEvent.changeText(screen.getByTestId('sign-in-password'), 'hunter2hunter2');
    await press('Sign in');
    await waitFor(() => expect(screen.getByText("Your account isn't confirmed yet")).toBeTruthy());
    expect(screen.getByText(/create your account again to get a new code/)).toBeTruthy();
  });

  it('F12: a sign-in refused as phone not confirmed, with no sign-up held here, says how to get a new code', async () => {
    answers['POST /auth/login'] = refuse(403, 'PHONE_NOT_CONFIRMED');
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await fireEvent.changeText(screen.getByTestId('sign-in-email'), 'lennox@wawu.africa');
    await fireEvent.changeText(screen.getByTestId('sign-in-password'), 'hunter2hunter2');
    await press('Sign in');
    await waitFor(() => expect(screen.getByText("Your phone isn't confirmed yet")).toBeTruthy());
    expect(screen.getByText('Create your account again to get a new code.')).toBeTruthy();
  });
});

describe('AUTH-07: the sign-up code is mailed (R-39, SIGNUP_VERIFY_CHANNEL=email)', () => {
  const MASKED = 'l•••@wawu.africa';
  const confirm = () => callsTo('/auth/signup/email-code/confirm');

  beforeEach(() => {
    answers['GET /auth/signup/channel'] = ok({ channel: 'email' });
  });

  async function toMailedA4(over: Record<string, unknown> = {}) {
    answers['POST /auth/signup'] = mailed(over);
    answers['POST /auth/signup/email-code/confirm'] = session;
    await toA3();
    await fillAndContinue();
    await waitFor(() => expect(screen.getByText(`Sent to ${MASKED}`)).toBeTruthy());
  }

  it('A3 says the code is emailed, and a user who taps Continue reaches A4 as "Verify your email" with the masked address', async () => {
    await toA3();
    await waitFor(() => expect(screen.getByText("We'll email you a code to confirm your address.")).toBeTruthy());
    expect(screen.queryByText(/text/i)).toBeNull();
    answers['POST /auth/signup'] = mailed();
    await fillAndContinue();
    await waitFor(() => expect(screen.getByText(`Sent to ${MASKED}`)).toBeTruthy());
    expect(screen.getByText('Verify your email')).toBeTruthy();
    expect(screen.getByText('Enter the 6-digit code')).toBeTruthy();
    expect(screen.getByText('Resend in 0:07')).toBeTruthy();
    expect(screen.queryByText(/SMS/)).toBeNull();
    expect(screen.queryByText(/phone/i)).toBeNull();
    expect(screen.queryByText('Code from your email')).toBeNull();
    // the address on screen is the server's mask: the typed address is not drawn
    expect(screen.queryByText(/lennox/)).toBeNull();
  });

  it('a user who enters the 6 digits is signed in through the email-code route, never the phone one, and lands on Home', async () => {
    await toMailedA4();
    await typeDigits('481902');
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(confirm()[0].body).toEqual({ phone: '+2348031234412', attempt: 'secret-attempt-1', code: '481902' });
    expect(callsTo('/auth/phone/verify/confirm')).toEqual([]);
    expect(mockVault.get(ACCESS_KEY)).toBe('access-new');
    expect(mockVault.has(SIGNUP_ATTEMPT_KEY)).toBe(false);
  });

  it('after the code there is no email step: the progress says the next step and the user reaches Home', async () => {
    answers['GET /auth/signup/progress'] = progress('interests', { steps: ['email', 'interests', 'follows'], emailProven: true });
    await toMailedA4();
    await typeDigits('481902');
    await waitFor(() => expect(callsTo('/auth/signup/progress').length).toBeGreaterThan(0));
    expect(screen.queryByText('Check your email')).toBeNull();
    expect(callsTo('/auth/signup/email/start')).toEqual([]);
  });

  it('a user can resend after the countdown, through the email-code route, and sees the server\'s new countdown', async () => {
    jest.useFakeTimers();
    await toMailedA4();
    await act(async () => {
      jest.advanceTimersByTime(7000);
    });
    answers['POST /auth/signup/email-code/start'] = ok({ phone: '+2348031234412', expiresIn: 600, resendIn: 31, channel: 'email' });
    await press('Resend code');
    await waitFor(() => expect(screen.getByText('Resend in 0:31')).toBeTruthy());
    expect(callsTo('/auth/signup/email-code/start')[0].body).toEqual({ phone: '+2348031234412', attempt: 'secret-attempt-1' });
    expect(callsTo('/auth/phone/verify/start')).toEqual([]);
    expect(screen.getByText('We sent a new code.')).toBeTruthy();
  });

  it('a resend that comes too soon shows the wait the server names', async () => {
    jest.useFakeTimers();
    await toMailedA4();
    await act(async () => {
      jest.advanceTimersByTime(7000);
    });
    answers['POST /auth/signup/email-code/start'] = refuse(429, 'EMAIL_CODE_RESEND_TOO_SOON', { retryAfterSeconds: 25 });
    await press('Resend code');
    await waitFor(() => expect(screen.getByText('Resend in 0:25')).toBeTruthy());
  });

  it('a resend that Resend refuses (503 EMAIL_SEND_FAILED) is not reported as sent: the banner says so, the Resend code button stays, and the code that was live still signs in', async () => {
    jest.useFakeTimers();
    await toMailedA4();
    await act(async () => {
      jest.advanceTimersByTime(7000);
    });
    answers['POST /auth/signup/email-code/start'] = refuse(503, 'EMAIL_SEND_FAILED', {
      message: 'We could not send the code. Try again in a moment.',
    });
    await press('Resend code');
    await waitFor(() => expect(screen.getByText("We couldn't send the code")).toBeTruthy());
    expect(screen.queryByText('We sent a new code.')).toBeNull();
    // the server gave the wait back: the person may ask again at once
    expect(screen.queryByText(/Resend in/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Resend code' })).toBeTruthy();
    // ... and the code that was live still works
    await typeDigits('481902');
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(confirm()[0].body).toEqual({ phone: '+2348031234412', attempt: 'secret-attempt-1', code: '481902' });
  });

  it('asking again at once after a refused resend works and shows the server\'s new countdown', async () => {
    jest.useFakeTimers();
    await toMailedA4();
    await act(async () => {
      jest.advanceTimersByTime(7000);
    });
    answers['POST /auth/signup/email-code/start'] = refuse(503, 'EMAIL_SEND_FAILED');
    await press('Resend code');
    await waitFor(() => expect(screen.getByText("We couldn't send the code")).toBeTruthy());
    answers['POST /auth/signup/email-code/start'] = ok({ phone: '+2348031234412', expiresIn: 600, resendIn: 60, channel: 'email' });
    await press('Resend code');
    await waitFor(() => expect(screen.getByText('Resend in 1:00')).toBeTruthy());
    expect(screen.getByText('We sent a new code.')).toBeTruthy();
    expect(callsTo('/auth/signup/email-code/start')).toHaveLength(2);
  });

  it('A15: a wrong code shows "That code isn\'t right" with the digits kept, and the fourth wrong 400 in a row ends the sign-up', async () => {
    await toMailedA4();
    answers['POST /auth/signup/email-code/confirm'] = refuse(400, 'EMAIL_CODE_INVALID', { message: "That code isn't right" });
    await typeDigits('111111');
    await waitFor(() => expect(screen.getByText("That code isn't right")).toBeTruthy());
    expect(screen.getByLabelText('Code, 6 of 6 digits entered')).toBeTruthy();
    for (let round = 0; round < 3; round++) {
      await typeDigits('1');
      await typeDigits('11111');
      await waitFor(() => expect(confirm().length).toBe(round + 2));
      // The keys are not read while a check is on its way: the next code waits until the screen has taken the Hub's answer.
      if (round < 2) await waitFor(() => expect(screen.getByText("That code isn't right")).toBeTruthy());
    }
    await waitFor(() => expect(screen.getByText('This sign-up has ended')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Start again' })).toBeTruthy();
  });

  it('a locked sign-up shows the wait the server names and turns the keys off', async () => {
    jest.useFakeTimers();
    await toMailedA4();
    answers['POST /auth/signup/email-code/confirm'] = refuse(429, 'EMAIL_CODE_LOCKED', { retryAfterSeconds: 900 });
    await typeDigits('481902');
    await waitFor(() => expect(screen.getByText('Too many tries. Try again in 15:00.')).toBeTruthy());
    await typeDigits('1');
    expect(screen.getByLabelText('Code, 0 of 6 digits entered')).toBeTruthy();
  });

  it.each([
    ['no connection', null, 'No connection'],
    ['the mail service down', refuse(503, 'EMAIL_NOT_CONFIGURED'), "We couldn't send the code"],
    ['a server fault', refuse(500, 'X'), 'Something went wrong on our side'],
    ['already confirmed', refuse(409, 'EMAIL_ALREADY_CONFIRMED'), 'This sign-up is already confirmed'],
    ['the channel switched while waiting', refuse(409, 'SIGNUP_CHANNEL_DISABLED'), 'This sign-up needs to start again'],
  ])('a refused check for %s is said in words', async (_name, refusal, title) => {
    await toMailedA4();
    if (refusal) answers['POST /auth/signup/email-code/confirm'] = refusal;
    else delete answers['POST /auth/signup/email-code/confirm'];
    await typeDigits('481902');
    await waitFor(() => expect(screen.getByTestId('phone-code-banner')).toBeTruthy());
    expect(screen.getByText(title)).toBeTruthy();
    expect(screen.queryByText("That code isn't right")).toBeNull();
  });

  it.each([
    ['mail that could not be sent', refuse(503, 'EMAIL_SEND_FAILED'), "We couldn't send the code"],
    ['mail not set up', refuse(503, 'EMAIL_NOT_CONFIGURED'), "We couldn't send the code"],
    ['a resend asked for too soon', refuse(429, 'EMAIL_CODE_RESEND_TOO_SOON', { retryAfterSeconds: 40 }), 'A code was just sent'],
    ['a number that is not Nigerian', refuse(400, 'PHONE_NOT_SUPPORTED'), "We can't use that number yet"],
  ])('A3 tells a user, with what they typed kept, when sign-up is refused for %s', async (_name, refusal, title) => {
    answers['POST /auth/signup'] = refusal;
    await toA3();
    await fillAndContinue();
    await waitFor(() => expect(screen.getByText(title)).toBeTruthy());
    expect(screen.getByTestId('sign-up-email').props.value).toBe('lennox@wawu.africa');
    expect(mockVault.has(SIGNUP_ATTEMPT_KEY)).toBe(false);
  });

  it('a user who quit after A3 and opens the app finds A4 again, with the masked address and the time that is left', async () => {
    mockVault.set(SIGNUP_PHONE_KEY, '+2348031234412');
    mockVault.set(SIGNUP_ATTEMPT_KEY, 'secret-attempt-1');
    answers['POST /auth/signup/resume'] = ok({
      step: 'phone',
      phone: '+2348031234412',
      expiresIn: 500,
      resendIn: 12,
      emailCodeRequired: false,
      accountType: 'creator',
      channel: 'email',
      maskedEmail: MASKED,
    });
    answers['POST /auth/signup/email-code/confirm'] = session;
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(`Sent to ${MASKED}`)).toBeTruthy());
    expect(screen.getByText('Verify your email')).toBeTruthy();
    expect(screen.getByText('Resend in 0:12')).toBeTruthy();
    await typeDigits('481902');
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(confirm().length).toBe(1);
    expect(callsTo('/auth/phone/verify/confirm')).toEqual([]);
  });

  it('a sign-in refused as email not verified, with a mailed sign-up held, opens A4 as the email screen', async () => {
    answers['POST /auth/signup/resume'] = ok({ step: 'details' });
    answers['POST /auth/login'] = refuse(403, 'EMAIL_NOT_VERIFIED');
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    mockVault.set(SIGNUP_PHONE_KEY, '+2348031234412');
    mockVault.set(SIGNUP_ATTEMPT_KEY, 'secret-attempt-1');
    answers['POST /auth/signup/resume'] = ok({ step: 'phone', phone: '+2348031234412', expiresIn: 300, resendIn: 5, emailCodeRequired: false, channel: 'email', maskedEmail: MASKED });
    await fireEvent.changeText(screen.getByTestId('sign-in-email'), 'lennox@wawu.africa');
    await fireEvent.changeText(screen.getByTestId('sign-in-password'), 'hunter2hunter2');
    await press('Sign in');
    await waitFor(() => expect(screen.getByText(`Sent to ${MASKED}`)).toBeTruthy());
  });

  it('with no masked address in the answer the screen still says the code was emailed', async () => {
    answers['POST /auth/signup'] = mailed({ maskedEmail: undefined });
    await toA3();
    await fillAndContinue();
    await waitFor(() => expect(screen.getByText('Sent to your email address')).toBeTruthy());
  });

  it('nothing in the mailed sign-up asks WAWU ID for a text', async () => {
    await toMailedA4();
    await typeDigits('481902');
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(calls.filter((c) => c.path.includes('/phone/verify'))).toEqual([]);
    expect(calls.filter((c) => c.url.startsWith(apiBaseUrl))).toEqual([]);
  });
});

describe('AUTH-07 round 3: A3 names the channel A4 will name (F-D), and A4 says when the number was not added (F-A)', () => {
  const EMAIL_LINE = "We'll email you a code to confirm your address.";
  const TEXT_LINE = "We'll text a code to your phone.";
  const MASKED = 'l•••@wawu.africa';
  const NOTE_TITLE = "We couldn't add your phone number";
  const NOTE_BODY = 'Another account already has that number. You can add a phone number later.';

  it('with the setting unset or phone, A3 says the code is texted and A4 then says so: the same channel', async () => {
    await toA3();
    await waitFor(() => expect(screen.getByText(TEXT_LINE)).toBeTruthy());
    expect(screen.queryByText(EMAIL_LINE)).toBeNull();
    answers['POST /auth/signup'] = started();
    await fillAndContinue();
    await waitFor(() => expect(screen.getByText(/Sent by SMS to/)).toBeTruthy());
    expect(screen.getByText('Verify your phone')).toBeTruthy();
  });

  it('with the setting email, A3 says the code is emailed and A4 then says so: the same channel', async () => {
    answers['GET /auth/signup/channel'] = ok({ channel: 'email' });
    await toA3();
    await waitFor(() => expect(screen.getByText(EMAIL_LINE)).toBeTruthy());
    expect(screen.queryByText(TEXT_LINE)).toBeNull();
    answers['POST /auth/signup'] = mailed();
    await fillAndContinue();
    await waitFor(() => expect(screen.getByText(`Sent to ${MASKED}`)).toBeTruthy());
    expect(screen.getByText('Verify your email')).toBeTruthy();
  });

  it('asks WAWU ID each time, sends nothing about the person, and needs no sign-in', async () => {
    await toA3();
    await waitFor(() => expect(screen.getByText(TEXT_LINE)).toBeTruthy());
    expect(callsTo('/auth/signup/channel')).toHaveLength(1);
    await askChannel();
    const asked = callsTo('/auth/signup/channel');
    expect(asked).toHaveLength(2);
    for (const call of asked) expect(call).toMatchObject({ method: 'GET', body: {}, auth: null });
  });

  it('F-G: asks again each time A3 comes into focus, so A3 and A4 agree when the setting is switched between two visits', async () => {
    // visit 1: the code is texted
    await toA3();
    await waitFor(() => expect(screen.getByText(TEXT_LINE)).toBeTruthy());
    expect(callsTo('/auth/signup/channel')).toHaveLength(1);
    answers['POST /auth/signup'] = started();
    await fillAndContinue();
    await waitFor(() => expect(screen.getByText('Verify your phone')).toBeTruthy());

    // WAWU ID's setting is switched to email while the app stays open; the person goes back to A3: visit 2
    answers['GET /auth/signup/channel'] = ok({ channel: 'email' });
    await press('Back');
    await waitFor(() => expect(screen.getByText(EMAIL_LINE)).toBeTruthy());
    expect(screen.queryByText(TEXT_LINE)).toBeNull();
    expect(callsTo('/auth/signup/channel')).toHaveLength(2);
    // ... and A4 then names the channel A3 named
    answers['POST /auth/signup'] = mailed();
    await press('Continue');
    await waitFor(() => expect(screen.getByText(`Sent to ${MASKED}`)).toBeTruthy());
    expect(screen.getByText('Verify your email')).toBeTruthy();

    // switched back: visit 3 names the text again, and A4 follows
    answers['GET /auth/signup/channel'] = ok({ channel: 'phone' });
    await press('Back');
    await waitFor(() => expect(screen.getByText(TEXT_LINE)).toBeTruthy());
    expect(screen.queryByText(EMAIL_LINE)).toBeNull();
    expect(callsTo('/auth/signup/channel')).toHaveLength(3);
    answers['POST /auth/signup'] = started();
    await press('Continue');
    await waitFor(() => expect(screen.getByText(/Sent by SMS to/)).toBeTruthy());
    expect(screen.getByText('Verify your phone')).toBeTruthy();
  });

  it('D5: a failed ask on a later visit clears the line the earlier visit drew, and the next good ask draws it again', async () => {
    await toA3();
    await waitFor(() => expect(screen.getByText(TEXT_LINE)).toBeTruthy());
    await fillAndContinue();
    await waitFor(() => expect(screen.getByText(/Sent by SMS to/)).toBeTruthy());

    // WAWU ID cannot be asked on the way back: the old answer is not kept, so A3 names nothing rather than a channel it no longer knows
    delete answers['GET /auth/signup/channel'];
    await press('Back');
    await waitFor(() => expect(callsTo('/auth/signup/channel')).toHaveLength(2));
    await waitFor(() => expect(screen.queryByText(TEXT_LINE)).toBeNull());
    expect(screen.queryByText(EMAIL_LINE)).toBeNull();
    expect(knownSignupChannel()).toBeNull();

    // ... and the next visit that can ask draws the line again, and A4 names the same channel
    answers['GET /auth/signup/channel'] = ok({ channel: 'email' });
    answers['POST /auth/signup'] = mailed();
    await press('Continue');
    await waitFor(() => expect(screen.getByText('Verify your email')).toBeTruthy());
    await press('Back');
    await waitFor(() => expect(screen.getByText(EMAIL_LINE)).toBeTruthy());
    expect(screen.queryByText(TEXT_LINE)).toBeNull();
  });

  it('N-1: an answer to an earlier visit that lands after a later visit has drawn its own is not drawn over it', async () => {
    const release = holdNextChannelAnswer(); // visit 1 is answered "phone", but the answer reaches the app late
    await toA3();
    expect(screen.queryByText(TEXT_LINE)).toBeNull();
    await fillAndContinue();
    await waitFor(() => expect(screen.getByText(/Sent by SMS to/)).toBeTruthy());

    // the setting is switched, and the person goes back to A3: visit 2 is answered "email" at once
    answers['GET /auth/signup/channel'] = ok({ channel: 'email' });
    await press('Back');
    await waitFor(() => expect(screen.getByText(EMAIL_LINE)).toBeTruthy());

    // visit 1's answer now lands; it is not kept as what the flow last learned (SWEEP-AUTH N-2: only the latest ask sets it) and A3 still says email
    await act(async () => {
      release();
    });
    // the answer takes a few real turns to reach the app's code; fake timers do not move these
    const realImmediate = (jest.requireActual('timers') as typeof import('timers')).setImmediate;
    for (let turn = 0; turn < 5; turn += 1) {
      await act(async () => {
        await new Promise<void>((resolve) => realImmediate(resolve));
      });
    }
    expect(knownSignupChannel()).toBe('email');
    expect(screen.getByText(EMAIL_LINE)).toBeTruthy();
    expect(screen.queryByText(TEXT_LINE)).toBeNull();
  });

  it('asks again on a later visit when the first ask failed, and draws the line once it knows', async () => {
    delete answers['GET /auth/signup/channel'];
    await toA3();
    // "No line" only means the ask failed once the ask has been answered: until then there is nothing to draw either way.
    await requestsAnswered();
    expect(screen.queryByText(TEXT_LINE)).toBeNull();
    expect(screen.queryByText(EMAIL_LINE)).toBeNull();
    answers['GET /auth/signup/channel'] = ok({ channel: 'email' });
    expect(await askChannel()).toBe('email');
    expect(callsTo('/auth/signup/channel')).toHaveLength(2);
  });

  it('when WAWU ID cannot be asked, A3 draws no line and does not guess, and Continue still works', async () => {
    delete answers['GET /auth/signup/channel'];
    await toA3();
    expect(screen.queryByText(EMAIL_LINE)).toBeNull();
    expect(screen.queryByText(TEXT_LINE)).toBeNull();
    answers['POST /auth/signup'] = started();
    await fillAndContinue();
    await waitFor(() => expect(screen.getByText(/Sent by SMS to/)).toBeTruthy());
  });

  it('draws no line for a channel it does not know', async () => {
    answers['GET /auth/signup/channel'] = ok({ channel: 'carrier-pigeon' });
    await toA3();
    await waitFor(() => expect(callsTo('/auth/signup/channel').length).toBeGreaterThan(0));
    expect(screen.queryByText(EMAIL_LINE)).toBeNull();
    expect(screen.queryByText(TEXT_LINE)).toBeNull();
  });

  async function toMailedA4(over: Record<string, unknown> = {}) {
    answers['GET /auth/signup/channel'] = ok({ channel: 'email' });
    answers['POST /auth/signup'] = mailed(over);
    await toA3();
    await fillAndContinue();
    await waitFor(() => expect(screen.getByText(`Sent to ${MASKED}`)).toBeTruthy());
  }

  it('A4 says the number was not added, in plain words, when the mailed sign-up was made without it', async () => {
    await toMailedA4({ phoneNotSaved: true });
    expect(screen.getByText(NOTE_TITLE)).toBeTruthy();
    expect(screen.getByText(NOTE_BODY)).toBeTruthy();
    expect(screen.getByTestId('phone-code-aside')).toBeTruthy();
    expect(screen.getByText('Verify your email')).toBeTruthy();
    expect(screen.getByText('Enter the 6-digit code')).toBeTruthy();
    expect(JSON.stringify(screen.toJSON())).not.toContain('\u2014');
  });

  it('A4 says nothing about a number when it was added', async () => {
    await toMailedA4();
    expect(screen.queryByText(NOTE_TITLE)).toBeNull();
    expect(screen.queryByTestId('phone-code-aside')).toBeNull();
  });

  it('A4 says it again when the app was closed on A4 and comes back', async () => {
    mockVault.set(SIGNUP_PHONE_KEY, '+2348031234412');
    mockVault.set(SIGNUP_ATTEMPT_KEY, 'secret-attempt-1');
    answers['POST /auth/signup/resume'] = ok({
      step: 'phone',
      phone: '+2348031234412',
      expiresIn: 500,
      resendIn: 12,
      emailCodeRequired: false,
      accountType: 'creator',
      channel: 'email',
      maskedEmail: MASKED,
      phoneNotSaved: true,
    });
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(`Sent to ${MASKED}`)).toBeTruthy());
    expect(screen.getByText(NOTE_TITLE)).toBeTruthy();
  });

  it('a texted A4 never says it', async () => {
    answers['POST /auth/signup'] = started({ phoneNotSaved: true });
    await toA3();
    await fillAndContinue();
    await waitFor(() => expect(screen.getByText(/Sent by SMS to/)).toBeTruthy());
    expect(screen.queryByText(NOTE_TITLE)).toBeNull();
  });

  it('the right code still signs the person in when the number was not added', async () => {
    answers['POST /auth/signup/email-code/confirm'] = session;
    await toMailedA4({ phoneNotSaved: true });
    await typeDigits('481902');
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(callsTo('/auth/signup/email-code/confirm')[0].body).toEqual({ phone: '+2348031234412', attempt: 'secret-attempt-1', code: '481902' });
  });
});

describe('DV2-05: A3 follows the 16 Oct board (email, phone, password and the terms line)', () => {
  it('a new person is asked for email, phone, password and the terms line, and never for a BVN', async () => {
    await toA3();
    // LEGAL-DOCS (owner, 26 Oct 2026): one box for all of the owner's documents; the label was "I agree to the terms and privacy policy".
    expect(screen.getByLabelText('I agree to the Terms of Service, Privacy Policy and our other policies')).toBeTruthy();
    expect(screen.queryByText(/BVN|NIN|selfie/i)).toBeNull();
    expect(screen.getByTestId('sign-up-consent').props.accessibilityState).toMatchObject({ checked: false });
  });

  it('Continue with the terms line unticked sends nothing and says to tick it; ticking it clears the line and the sign-up goes ahead', async () => {
    await toA3();
    await fillNames();
    await fireEvent.changeText(screen.getByTestId('sign-up-email'), 'lennox@wawu.africa');
    await fireEvent.changeText(screen.getByTestId('sign-up-phone'), '0803 123 4412');
    await fireEvent.changeText(screen.getByTestId('sign-up-password'), 'hunter2hunter2');
    await press('Continue');
    expect(screen.getByText('Tick the box to agree before you continue.')).toBeTruthy();
    expect(sentCalls()).toEqual([]);
    await fireEvent.press(screen.getByTestId('sign-up-consent'));
    expect(screen.queryByText('Tick the box to agree before you continue.')).toBeNull();
    expect(screen.getByTestId('sign-up-consent').props.accessibilityState).toMatchObject({ checked: true });
    await press('Continue');
    await waitFor(() => expect(callsTo('/auth/signup').length).toBe(1));
    // Nothing about the terms goes to WAWU ID: the line is consent to read, not a field.
    expect(Object.keys(callsTo('/auth/signup')[0].body).sort()).toEqual(['accountType', 'email', 'firstName', 'lastName', 'password', 'phone']);
  });

  it('"Read them" opens the Legal list, and what was typed stays', async () => {
    await toA3();
    await fireEvent.changeText(screen.getByTestId('sign-up-email'), 'lennox@wawu.africa');
    await fireEvent.press(screen.getByTestId('sign-up-consent-read'));
    await waitFor(() => expect(screen.getByText('Legal list page')).toBeTruthy());
    expect(sentCalls()).toEqual([]);
  });

  it('the line has no separate terms or privacy policy word any more: one box, one "Read them"', async () => {
    await toA3();
    expect(screen.queryByTestId('sign-up-consent-terms')).toBeNull();
    expect(screen.queryByTestId('sign-up-consent-privacy')).toBeNull();
    expect(screen.getByText(/I agree to the Terms of Service, Privacy Policy and our other policies\./)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Read them' })).toBeTruthy();
  });
});

describe('SIGNUP-NAMES (R-82): A3 asks for a first name, a last name and a username', () => {
  const asked = () => jest.mocked(identityApi.askUsername).mock.calls.map(([name]) => name);

  it('draws First name, Last name and Username before Email, and sends the two names to WAWU ID', async () => {
    await toA3();
    const labels = ['First name', 'Last name', 'Username', 'Email', 'Phone number', 'Password'];
    for (const label of labels) expect(screen.getByText(label)).toBeTruthy();
    const order = labels.map((label) => screen.toJSON() && JSON.stringify(screen.toJSON()).indexOf(`"${label}"`));
    expect([...order].sort((a, b) => (a as number) - (b as number))).toEqual(order);
    await fillAndContinue();
    await waitFor(() => expect(callsTo('/auth/signup').length).toBe(1));
    expect(callsTo('/auth/signup')[0].body).toMatchObject({ firstName: 'Lennox', lastName: 'Emmanuel' });
    // The username is the Hub's handle, not WAWU ID's: it is asked of the Hub, never sent to WAWU ID.
    expect(JSON.stringify(callsTo('/auth/signup')[0].body)).not.toContain('lennox_e');
  });

  it('Continue with the three names empty says what to fill and sends nothing', async () => {
    await toA3();
    await fireEvent.changeText(screen.getByTestId('sign-up-email'), 'lennox@wawu.africa');
    await fireEvent.changeText(screen.getByTestId('sign-up-phone'), '0803 123 4412');
    await fireEvent.changeText(screen.getByTestId('sign-up-password'), 'hunter2hunter2');
    await fireEvent.press(screen.getByTestId('sign-up-consent'));
    await press('Continue');
    for (const line of ['Enter your first name.', 'Enter your last name.', 'Choose a username.']) expect(screen.getByText(line)).toBeTruthy();
    expect(sentCalls()).toEqual([]);
    expect(asked()).toEqual([]);
  });

  it('a username with a space or a symbol is refused on the spot, in the Hub\'s words, without asking the Hub', async () => {
    await toA3();
    await fireEvent.changeText(screen.getByTestId('sign-up-username'), '@len nox!');
    expect(screen.getByText('Use letters, numbers, dots and underscores.')).toBeTruthy();
    expect(asked()).toEqual([]);
  });

  it('a username taken is refused under the field while typing, then free again when changed (case ignored by the Hub)', async () => {
    jest.mocked(identityApi.askUsername).mockImplementation(async (handle: string) =>
      handle.toLowerCase() === 'lennox_e' ? { handle, available: false, message: 'That username is taken. Try another.' } : { handle, available: true, message: null },
    );
    await toA3();
    await fireEvent.changeText(screen.getByTestId('sign-up-username'), '@Lennox_E');
    await act(async () => {
      jest.advanceTimersByTime(600);
    });
    await waitFor(() => expect(screen.getByText('That username is taken. Try another.')).toBeTruthy());
    await fireEvent.changeText(screen.getByTestId('sign-up-username'), '@lennox_free');
    await act(async () => {
      jest.advanceTimersByTime(600);
    });
    await waitFor(() => expect(screen.getByText('That username is free.')).toBeTruthy());
    expect(screen.queryByText('That username is taken. Try another.')).toBeNull();
    jest.mocked(identityApi.askUsername).mockImplementation(async (handle: string) => ({ handle, available: true, message: null }));
  });

  it('Continue asks the Hub once more: a name taken meanwhile is refused under the field and no sign-up is started', async () => {
    jest.mocked(identityApi.askUsername).mockImplementation(async (handle: string) => ({ handle, available: false, message: 'That username is taken. Try another.' }));
    await toA3();
    await fillAndContinue();
    await waitFor(() => expect(screen.getByText('That username is taken. Try another.')).toBeTruthy());
    expect(callsTo('/auth/signup')).toEqual([]);
    expect(screen.getByTestId('sign-up-email').props.value).toBe('lennox@wawu.africa');
    jest.mocked(identityApi.askUsername).mockImplementation(async (handle: string) => ({ handle, available: true, message: null }));
  });

  it('once the code is right the username is claimed on the Hub, and Home opens', async () => {
    await toA4();
    await typeDigits('481902');
    await waitFor(() => expect(callsTo('/auth/phone/verify/confirm').length).toBe(1));
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(jest.mocked(identityApi.putIdentity).mock.calls).toEqual([[{ handle: 'lennox_e' }]]);
  });
});
