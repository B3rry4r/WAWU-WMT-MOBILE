/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import * as rtl from '@testing-library/react-native';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { QueryClient } from '@tanstack/react-query';
import type { ComponentType } from 'react';

/*
 * W1 to W35 to W36 and W37, and Z2 to W35, on the real Expo Router stack with the real route files. The Hub answers
 * through a stand-in `fetch`, installed before the app's modules load. Open your wallet's steps are stand-ins, as in
 * walletTabFlow.test.tsx.
 */
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

const ACCOUNT = { accountNumber: '8100000528', accountName: 'Ada Eze', bankName: 'Ekiti Trial MFB', bankCode: '090620', licenceLine: null, depositInsuranceLine: null, openedAt: '2026-10-07T09:00:00.000Z' };
const ME = {
  wawuUserId: 'u1',
  firstName: 'Lennox',
  lastName: 'Emmanuel',
  email: 'lennox@example.test',
  phone: '+2348031234412',
  avatarUrl: null,
  verification: { creator: { verified: false, expiresAt: null }, professional: { verified: false, expiresAt: null } },
};
const RESET_ID = '5f1c1c1e-6a1d-4d4e-9a53-0d6b0b0c0b01';
let pinSetAt = '2026-07-10T09:00:00.000Z';
let walletState: 'open' | 'not_open' = 'open';
/** Whether the wallet read says a PIN is set. A10 is reached with it false while the Hub already holds one (a set on another phone). */
let walletKnowsPin = true;
const calls: { method: string; path: string; pin: string | null; body: unknown }[] = [];
const ok = (data: unknown) => new Response(JSON.stringify({ statusCode: 200, message: 'OK', data }), { status: 200, headers: { 'content-type': 'application/json' } });
const pinState = () => ({ isSet: true, changedAt: pinSetAt, triesLeft: 5, lockedUntil: null });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  const text = await request.clone().text();
  calls.push({ method: request.method, path, pin: request.headers.get('x-transaction-pin'), body: text ? JSON.parse(text) : null });
  const key = `${request.method} ${path}`;
  switch (key) {
    case 'GET /money/wallet':
      return ok({
        state: walletState,
        account: walletState === 'open' ? ACCOUNT : null,
        limits: null,
        pin: walletState === 'open' && walletKnowsPin ? pinState() : { isSet: false, changedAt: null, triesLeft: 5, lockedUntil: null },
        bankTransfers: { allowed: true, blockedBy: null },
        beneficiaryCount: 3,
      });
    case 'GET /money/beneficiaries':
      return ok([
        { id: 'b-1', kind: 'bank_account', wawuUser: null, bankAccount: { bankCode: '058', bankName: 'GTBank', accountNumber: '0112233445', accountName: 'Femi Bankole' }, createdAt: '2026-10-12T09:00:00.000Z' },
        { id: 'b-2', kind: 'wawu_user', wawuUser: { wawuUserId: 'u-9', displayName: 'Ada Seeded', handle: 'ada', avatarUrl: null, tick: null }, bankAccount: null, createdAt: '2026-10-13T09:00:00.000Z' },
      ]);
    case 'GET /money/wallet/balance':
      return ok({ availableKobo: 0, asOf: '2026-10-07T09:00:00.000Z' });
    case 'GET /money/transactions':
      return ok({ items: [], nextCursor: null });
    case 'GET /money/pin':
      return ok(pinState());
    case 'POST /money/pin':
      return new Response(JSON.stringify({ statusCode: 409, message: 'You already have a transaction PIN.', data: null, reason: { code: 'pin_already_set', message: 'You already have a transaction PIN.' } }), { status: 409, headers: { 'content-type': 'application/json' } });
    case 'POST /money/pin/verify':
      return request.headers.get('x-transaction-pin') === '1234'
        ? ok(pinState())
        : new Response(JSON.stringify({ statusCode: 403, message: 'Wrong PIN. 4 tries left.', data: null, reason: { code: 'pin_incorrect', message: 'Wrong PIN. 4 tries left.', triesLeft: 4 } }), { status: 403, headers: { 'content-type': 'application/json' } });
    case 'PUT /money/pin':
      pinSetAt = new Date().toISOString();
      return ok(pinState());
    case 'POST /money/pin/reset':
      return ok({ resetId: RESET_ID, sentTo: '+234 *** *** 4412', resendAvailableAt: new Date(Date.now() + 60_000).toISOString(), resendInSeconds: 60, expiresAt: new Date(Date.now() + 300_000).toISOString() });
    case 'POST /money/pin/reset/confirm':
      pinSetAt = new Date().toISOString();
      return ok(pinState());
    case 'GET /users/me':
      return ok(ME);
    case 'GET /settings/tgif':
      return ok({ userWawuId: 'u1', show: true });
    default:
      return new Response(JSON.stringify({ statusCode: 404, message: 'Not here' }), { status: 404 });
  }
}) as typeof fetch;

type Loaded = { queryClient: QueryClient };
let app: Loaded;
const page = (path: string) => (require(path) as { default: ComponentType }).default;

function A26() {
  const router = useRouter();
  return (
    <View>
      <Text accessibilityRole="header">A26</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="A26 Back" onPress={() => router.back()}>
        <Text>Back</Text>
      </Pressable>
    </View>
  );
}

let routes: Record<string, ComponentType>;

function pathname(): string {
  const { store } = jest.requireActual('expo-router/build/global-state/router-store') as { store: { getRouteInfo: () => { pathname: string } } };
  return store.getRouteInfo().pathname;
}
function tokenFor(sub: string) {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
}
async function type(digits: string) {
  for (const digit of digits) await fireEvent.press(screen.getByRole('button', { name: digit }));
}

beforeAll(async () => {
  app = { queryClient: (require('@/api/query') as typeof import('@/api/query')).queryClient };
  routes = {
    _layout: () => <Stack screenOptions={{ headerShown: false }} />,
    '(tabs)/_layout': page('@/app/(tabs)/_layout'),
    '(tabs)/index': page('@/app/(tabs)/index'),
    '(tabs)/explore': page('@/app/(tabs)/explore'),
    '(tabs)/inbox': page('@/app/(tabs)/inbox'),
    '(tabs)/wallet': page('@/app/(tabs)/wallet'),
    '(tabs)/me': page('@/app/(tabs)/me'),
    // The root layout gives the app one cache; the route is drawn inside it here too.
    'settings/index': () => {
      const Settings = page('@/app/settings/index');
      return (
        <QueryClientProvider client={app.queryClient}>
          <Settings />
        </QueryClientProvider>
      );
    },
    // A10 draws from the app's one cache, as the root layout gives it.
    'open-wallet-pin': () => {
      const A10Route = page('@/app/open-wallet-pin');
      return (
        <QueryClientProvider client={app.queryClient}>
          <A10Route />
        </QueryClientProvider>
      );
    },
    'wallet-settings': page('@/app/wallet-settings'),
    'change-pin': page('@/app/change-pin'),
    'reset-pin': page('@/app/reset-pin'),
    'open-wallet': A26,
  };
  const { unmount } = await renderRouter(routes);
  await unmount();
}, 60_000);

beforeEach(() => {
  pinSetAt = '2026-07-10T09:00:00.000Z';
  walletState = 'open';
  walletKnowsPin = true;
  calls.length = 0;
  app.queryClient.clear();
  app.queryClient.setDefaultOptions({ queries: { ...app.queryClient.getDefaultOptions().queries, gcTime: 0, retry: false } });
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor('00000000-0000-4000-8000-0000000000b1'));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
});

afterAll(async () => {
  await app.queryClient.cancelQueries();
  app.queryClient.clear();
});

describe('from the Wallet tab to Wallet settings', () => {
  it('a user on the Wallet tab taps the settings icon and lands on W35, with the PIN, Beneficiaries (1 saved bank account, R2-MONEY D-05) and the account from the Hub', async () => {
    await renderRouter(routes);
    await fireEvent.press(screen.getByRole('tab', { name: 'Wallet' }));
    expect(await screen.findByText('No transactions yet')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Wallet settings' }));
    expect(await screen.findByTestId('wallet-settings-screen')).toBeTruthy();
    expect(pathname()).toBe('/wallet-settings');
    expect(await screen.findByText('Changed 3 months ago')).toBeTruthy();
    expect(screen.getByText('Beneficiaries')).toBeTruthy();
    // The Hub's count is 3 (a saved WAWU user is counted); W8's list draws the one bank account, so the row says 1.
    expect(await screen.findByText('1 saved')).toBeTruthy();
    expect(screen.queryByText('3 saved')).toBeNull();
    expect(screen.getByText('Ekiti Trial MFB · 810 000 0528')).toBeTruthy();
    // Back returns to the tab.
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(pathname()).toBe('/wallet'));
  });

  it('a user with no wallet who opens W35 sees the way into Open your wallet, and it opens A26', async () => {
    walletState = 'not_open';
    await renderRouter(routes, { initialUrl: '/wallet-settings' });
    expect(await screen.findByText("You don't have a wallet yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Open your wallet' }));
    expect(await screen.findByRole('header', { name: 'A26' })).toBeTruthy();
    expect(pathname()).toBe('/open-wallet');
  });
});

describe('from Settings to Wallet settings', () => {
  it('a user taps Wallet and PIN in Settings (Z2) and reaches W35', async () => {
    await renderRouter(routes, { initialUrl: '/settings' });
    await fireEvent.press(await screen.findByRole('button', { name: 'Wallet and PIN, PIN and account details' }));
    expect(await screen.findByTestId('wallet-settings-screen')).toBeTruthy();
    expect(pathname()).toBe('/wallet-settings');
    // No tier is written anywhere on the way.
    expect(screen.queryByText(/Tier/)).toBeNull();
  });
});

describe('changing the PIN from Wallet settings', () => {
  it('a user opens Transaction PIN, checks the current PIN, enters a new one twice and is back on W35 reading "Changed just now"', async () => {
    await renderRouter(routes, { initialUrl: '/wallet-settings' });
    await fireEvent.press(await screen.findByRole('button', { name: 'Transaction PIN, Changed 3 months ago' }));
    expect(await screen.findByTestId('change-pin-current')).toBeTruthy();
    expect(pathname()).toBe('/change-pin');
    await type('1234');
    expect(await screen.findByText('Step 1 of 2')).toBeTruthy();
    await type('4821');
    expect(await screen.findByText('Step 2 of 2')).toBeTruthy();
    await type('4821');
    await waitFor(() => expect(pathname()).toBe('/wallet-settings'));
    expect(await screen.findByText('Changed just now', undefined, { timeout: 3_000 })).toBeTruthy();
    expect(calls.find((c) => c.method === 'PUT' && c.path === '/money/pin')?.pin).toBe('1234');
  });

  it('a user who forgot the PIN taps Forgot PIN?, gets a code, resets with it, and is back on W35', async () => {
    await renderRouter(routes, { initialUrl: '/wallet-settings' });
    await fireEvent.press(await screen.findByRole('button', { name: 'Transaction PIN, Changed 3 months ago' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Forgot PIN?' }));
    expect(await screen.findByTestId('reset-pin-code')).toBeTruthy();
    expect(pathname()).toBe('/reset-pin');
    expect(await screen.findByText('To +234 *** *** 4412')).toBeTruthy();
    await type('481902');
    await type('4821');
    await type('4821');
    await waitFor(() => expect(pathname()).toBe('/wallet-settings'));
    expect(await screen.findByText('Changed just now', undefined, { timeout: 3_000 })).toBeTruthy();
    expect(calls.find((c) => c.path === '/money/pin/reset/confirm')?.body).toEqual({ resetId: RESET_ID, code: '481902', newPin: '4821', newPinConfirmation: '4821' });
  });

  it('Back from the reset returns to W35, not to the PIN step that was replaced', async () => {
    await renderRouter(routes, { initialUrl: '/wallet-settings' });
    await fireEvent.press(await screen.findByRole('button', { name: 'Transaction PIN, Changed 3 months ago' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Forgot PIN?' }));
    expect(await screen.findByTestId('reset-pin-code')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(pathname()).toBe('/wallet-settings'));
  });
});

describe('Forgot PIN? on A10, the end that says the account already has a PIN (BACKEND_GAPS G-116)', () => {
  /** A10 as a person reaches it: a PIN typed twice that the Hub refuses because it already holds one. */
  async function atAlreadySet() {
    walletKnowsPin = false;
    await renderRouter(routes, { initialUrl: '/open-wallet-pin' });
    await waitFor(() => expect(screen.getByRole('button', { name: '1' }).props.accessibilityState?.disabled).toBeFalsy());
    await type('27492749');
    expect(await screen.findByTestId('open-wallet-pin-already-set')).toBeTruthy();
    expect(pathname()).toBe('/open-wallet-pin');
  }

  it('Forgot PIN? opens the reset (W37, /reset-pin), not the PIN change (kills: the button routed to /change-pin)', async () => {
    await atAlreadySet();
    await fireEvent.press(screen.getByRole('button', { name: 'Forgot PIN?' }));
    expect(await screen.findByTestId('reset-pin-code')).toBeTruthy();
    expect(pathname()).toBe('/reset-pin');
    expect(screen.queryByTestId('change-pin-current')).toBeNull();
    // A code was asked for: this is the reset, and a change would have asked for nothing.
    await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.path === '/money/pin/reset')).toBe(true));
    expect(calls.some((c) => c.path === '/money/pin/verify')).toBe(false);
  });

  it('Back from the reset returns to the end it was opened from', async () => {
    await atAlreadySet();
    await fireEvent.press(screen.getByRole('button', { name: 'Forgot PIN?' }));
    expect(await screen.findByTestId('reset-pin-code')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(pathname()).toBe('/open-wallet-pin'));
    expect(await screen.findByTestId('open-wallet-pin-already-set')).toBeTruthy();
    // Nothing was reset, so the words are the ones that say what is true either way.
    expect(screen.getByText(/that earlier PIN still approves payments/)).toBeTruthy();
  });

  it('after a reset made from it, the end names the new PIN and no longer says an earlier PIN still approves payments (D5)', async () => {
    await atAlreadySet();
    expect(screen.getByText(/If you set one before, that earlier PIN still approves payments/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Forgot PIN?' }));
    expect(await screen.findByTestId('reset-pin-code')).toBeTruthy();
    await type('481902');
    await type('4821');
    await type('4821');
    await waitFor(() => expect(pathname()).toBe('/open-wallet-pin'));
    expect(await screen.findByTestId('open-wallet-pin-already-set')).toBeTruthy();
    expect(screen.getByText('Your PIN was reset. The new PIN you just chose is the one that approves payments.')).toBeTruthy();
    expect(screen.queryByText(/earlier PIN still approves/)).toBeNull();
    // Done is still the way on, and the reset sent what it should.
    expect(calls.find((c) => c.path === '/money/pin/reset/confirm')?.body).toEqual({ resetId: RESET_ID, code: '481902', newPin: '4821', newPinConfirmation: '4821' });
  });
});

describe('Settings (Z2) draws Wallet and PIN only where it can open it', () => {
  const renderSettings = async (extra: Record<string, unknown>) => {
    const { SettingsScreen } = require('@/features/settings/SettingsScreen') as typeof import('@/features/settings/SettingsScreen');
    const handlers = { onBack: jest.fn(), onOpenProfile: jest.fn(), onOpenNotifications: jest.fn(), onOpenPrivacy: jest.fn(), onOpenPassword: jest.fn(), onOpenAbout: jest.fn(), onOpenTerms: jest.fn(), onOpenPolicy: jest.fn(), onSignedOut: jest.fn() };
    await rtl.render(
      <QueryClientProvider client={app.queryClient}>
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
          <SettingsScreen {...handlers} {...extra} />
        </SafeAreaProvider>
      </QueryClientProvider>,
    );
    await rtl.screen.findByTestId('settings-password');
  };

  it('a screen given nowhere to open it draws no Wallet and PIN row (no dead row)', async () => {
    await renderSettings({});
    expect(rtl.screen.queryByTestId('settings-wallet')).toBeNull();
    expect(rtl.screen.queryByText('Wallet and PIN')).toBeNull();
  });

  it('given a handler it draws the row after Password, with no tier, and pressing it calls the handler', async () => {
    const onOpenWallet = jest.fn();
    await renderSettings({ onOpenWallet });
    expect(rtl.screen.getByText('Wallet and PIN')).toBeTruthy();
    expect(rtl.screen.getByText('PIN and account details')).toBeTruthy();
    expect(rtl.screen.queryByText(/Tier|W35/)).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Wallet and PIN, PIN and account details' }));
    expect(onOpenWallet).toHaveBeenCalledTimes(1);
  });
});
