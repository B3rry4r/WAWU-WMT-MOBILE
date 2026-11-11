import { Platform } from 'react-native';
import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { resetSessionForTests } from '@/api/session';
import { ACCESS_KEY, REFRESH_KEY } from '@/api/tokenStore';

/**
 * APP-RESET on the web (R-127: the web app is this code on `Platform.OS` 'web'). The router's own navigation reads the browser's DOM,
 * which jest's renderer has none of, so here the four route files run on 'web' with the router stood in (what a route does with it is
 * a push, a replace and the address's query), and everything under them is real: the screens, the identity calls, the session and the
 * token store. WAWU ID answers as `forgotPassword`, `resetPassword`, `activate` and `changePassword` do. appResetRoutes.test.tsx runs
 * the same paths through the real router on Android and iOS; the real web export is walked in the pictures.
 */
const mockVault = new Map<string, string>();
const mockFetch = jest.fn();
jest.mock('@/api/env', () => {
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => mockFetch(input, init)) as typeof fetch;
  return { apiBaseUrl: 'http://127.0.0.1:9', identityBaseUrl: 'http://127.0.0.1:9' };
});
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));
const mockRouter = { replace: jest.fn(), push: jest.fn(), back: jest.fn(), dismissTo: jest.fn(), canGoBack: jest.fn(() => false) };
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
  useNavigation: () => ({ dispatch: jest.fn() }),
  useRoute: () => ({ key: 'route-1' }),
}));

import ActivateRoute from '@/app/activate';
import ForgotPasswordRoute from '@/app/forgot-password';
import ResetPasswordRoute from '@/app/reset-password';
import SettingsPasswordRoute from '@/app/settings/password';

const TOKEN = 'd'.repeat(64);
const EMAIL = 'ada@example.test';
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
type Seen = { path: string; body: unknown; authorization: string | null };
let seen: Seen[] = [];
let refuse: Record<string, Response | undefined> = {};
const calls = (path: string) => seen.filter((s) => s.path === path);

let os: jest.ReplaceProperty<typeof Platform.OS>;
beforeEach(() => {
  os = jest.replaceProperty(Platform, 'OS', 'web');
  mockVault.clear();
  resetSessionForTests();
  seen = [];
  refuse = {};
  mockParams = {};
  Object.values(mockRouter).forEach((fn) => fn.mockClear());
  mockFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const path = new URL(request.url).pathname;
    const text = await request.clone().text();
    seen.push({ path, body: text ? JSON.parse(text) : undefined, authorization: request.headers.get('authorization') });
    if (refuse[path]) return refuse[path]!.clone();
    if (path === '/auth/change-password') return json(200, { data: { accessToken: 'changed-access', refreshToken: 'changed-refresh' } });
    return json(200, { data: { message: 'ok' } });
  });
});
afterEach(() => {
  os.restore();
  rtl.cleanup();
});

const draw = (node: React.ReactElement) =>
  rtl.render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{node}</SafeAreaProvider>,
  );
const type = (testID: string, value: string) => rtl.act(async () => rtl.fireEvent.changeText(rtl.screen.getByTestId(testID), value));
const press = (target: string | ReturnType<typeof rtl.screen.getByTestId>) =>
  rtl.act(async () => rtl.fireEvent.press(typeof target === 'string' ? rtl.screen.getByTestId(target) : target));

describe('APP-RESET on the web · a code to the phone', () => {
  it('asks for the code, takes it, sends it with the new password, and Sign in opens sign-in with the email', async () => {
    await draw(<ForgotPasswordRoute />);
    await press('forgot-switch');
    await type('forgot-email', '0801 234 5678');
    await press('forgot-submit');
    expect(await rtl.screen.findByTestId('reset-code')).toBeTruthy();
    expect(calls('/auth/forgot-password')[0].body).toEqual({ identifier: '+2348012345678', method: 'sms' });
    await rtl.act(async () => rtl.fireEvent.changeText(rtl.screen.getByTestId('reset-code-input'), '135790'));
    await type('reset-new', 'brand-new-pass-1');
    await type('reset-confirm', 'brand-new-pass-1');
    await press('reset-submit');
    expect(await rtl.screen.findByTestId('reset-done')).toBeTruthy();
    expect(calls('/auth/reset-password')[0].body).toEqual({ identifier: '+2348012345678', code: '135790', newPassword: 'brand-new-pass-1' });
    await press(rtl.screen.getByText('Sign in'));
    // Reset by a number: the app does not know the email, so sign-in opens empty.
    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/sign-in', params: {} });
  });

  it('a wrong code (401) returns to the boxes and says so', async () => {
    refuse['/auth/reset-password'] = json(401, { statusCode: 401, message: 'Invalid or expired reset code', error: 'Unauthorized' });
    await draw(<ForgotPasswordRoute />);
    await press('forgot-switch');
    await type('forgot-email', EMAIL);
    await press('forgot-submit');
    await rtl.act(async () => rtl.fireEvent.changeText(await rtl.screen.findByTestId('reset-code-input'), '111111'));
    await type('reset-new', 'brand-new-pass-2');
    await type('reset-confirm', 'brand-new-pass-2');
    await press('reset-submit');
    expect(await rtl.screen.findByText("That code isn't right")).toBeTruthy();
  });
});

describe('APP-RESET on the web · activation and reset links', () => {
  it('activate: spends the token with the first password', async () => {
    mockParams = { token: TOKEN, email: EMAIL };
    await draw(<ActivateRoute />);
    expect(rtl.screen.getByText('Set your password')).toBeTruthy();
    await type('reset-new', 'first-password-1');
    await type('reset-confirm', 'first-password-1');
    await press('reset-submit');
    expect(await rtl.screen.findByTestId('reset-done')).toBeTruthy();
    expect(calls('/auth/activate')[0].body).toEqual({ activationToken: TOKEN, email: EMAIL, password: 'first-password-1' });
    expect(mockVault.has(ACCESS_KEY)).toBe(false);
  });

  it('activate: an expired token is one plain sentence with the way to Forgot password', async () => {
    refuse['/auth/activate'] = json(401, { statusCode: 401, message: 'Invalid or expired activation token', error: 'Unauthorized' });
    mockParams = { token: TOKEN, email: EMAIL };
    await draw(<ActivateRoute />);
    await type('reset-new', 'first-password-2');
    await type('reset-confirm', 'first-password-2');
    await press('reset-submit');
    expect(await rtl.screen.findByTestId('reset-invalid')).toBeTruthy();
    await press(rtl.screen.getByText('Back to Forgot password'));
    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/forgot-password', params: { email: EMAIL } });
  });

  it('reset link: spends the token with the new password', async () => {
    mockParams = { token: TOKEN, email: EMAIL };
    await draw(<ResetPasswordRoute />);
    await type('reset-new', 'brand-new-pass-3');
    await type('reset-confirm', 'brand-new-pass-3');
    await press('reset-submit');
    expect(await rtl.screen.findByTestId('reset-done')).toBeTruthy();
    expect(calls('/auth/reset-password')[0].body).toEqual({ token: TOKEN, email: EMAIL, password: 'brand-new-pass-3' });
  });
});

describe('APP-RESET on the web · change password', () => {
  it('sends both passwords with the signed-in token and keeps the new session', async () => {
    mockVault.set(ACCESS_KEY, 'stored-access');
    mockVault.set(REFRESH_KEY, 'stored-refresh');
    await draw(<SettingsPasswordRoute />);
    await type('password-current', 'old-password-1');
    await type('password-new', 'new-password-1');
    await press('password-save');
    expect(await rtl.screen.findByText('Password changed')).toBeTruthy();
    expect(calls('/auth/change-password')[0].body).toEqual({ currentPassword: 'old-password-1', newPassword: 'new-password-1' });
    expect(calls('/auth/change-password')[0].authorization).toBe('Bearer stored-access');
    await rtl.waitFor(() => expect(mockVault.get(ACCESS_KEY)).toBe('changed-access'));
  });
});
