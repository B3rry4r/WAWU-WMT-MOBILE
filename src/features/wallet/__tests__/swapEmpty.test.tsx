/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { fxFetch, hub, resetFxHub } from '../fx/testing/fxHub';

/*
 * R2-MONEY D-06: W20 (Swap) with nothing to swap between draws its empty state, not "couldn't load your accounts"; a read that really
 * fails still says so. (Scaffold of fxSwapFlow.test.tsx.) WALLET-21: W20 (Swap), W21 (its review) and W11 (the PIN sheet) against the Hub's stand-in `fetch`. A quote is asked for once typing
 * stops, its hold counts down from the quote's own `expiresAt`, and one Idempotency-Key per swap travels again, unchanged, on a wrong
 * PIN and on a request that got no answer, so the swap happens once.
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
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true }), useIsFocused: () => true }));

const OWNER = '00000000-0000-4000-8000-0000000000f1';
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  const fx = await fxFetch(request, path);
  if (fx) return fx;
  if (path === '/money/wallet/balance') return ok({ availableKobo: 48_525_075, asOf: '2026-10-07T09:00:00.000Z' });
  throw new Error(`no answer for ${request.method} ${path}`);
}) as typeof fetch;

const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};

const swapped = jest.fn();
const openAccounts = jest.fn();
async function boot(props: { from?: string; to?: string } = { from: 'NGN', to: 'USD' }) {
  const { SwapScreen } = require('../fx/swap/SwapScreen') as typeof import('../fx/swap/SwapScreen');
  await rtl.render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <SwapScreen {...props} onBack={jest.fn()} onOpenAccounts={openAccounts} onSwapped={swapped} onForgotPin={jest.fn()} onSetPin={jest.fn()} />
    </SafeAreaProvider>,
  );
}
const { fireEvent } = rtl;
const patient = { timeout: 4000 };
beforeEach(() => {
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false, gcTime: 0 } });
  Dimensions.set({ window: { width: 390, height: 844, scale: 2, fontScale: 1 } });
  resetFxHub();
  swapped.mockReset();
  openAccounts.mockReset();
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
  (require('@/features/money-attempt/attempts') as typeof import('@/features/money-attempt/attempts')).forgetAttempts();
});

describe('W20 with nothing to swap between (R2-MONEY D-06)', () => {
  it('a person with no foreign account sees what is missing and a way to the wallet, not a connection error', async () => {
    hub.accounts = [];
    await boot();
    expect(await rtl.screen.findByTestId('swap-empty', {}, patient)).toBeTruthy();
    expect(rtl.screen.getByText('You have no account to swap with')).toBeTruthy();
    expect(rtl.screen.queryByText(/couldn.t load/i)).toBeNull();
    expect(rtl.screen.queryByText('Try again')).toBeNull();
    await fireEvent.press(rtl.screen.getByRole('button', { name: 'Go to your wallet' }));
    expect(openAccounts).toHaveBeenCalledTimes(1);
  });

  it('a read that really failed still says it could not load, with Try again', async () => {
    hub.accountsFault = { status: 500, code: 'internal', message: 'Something went wrong' };
    await boot();
    expect(await rtl.screen.findByTestId('swap-error', {}, patient)).toBeTruthy();
    expect(rtl.screen.getByText('We couldn’t load your accounts')).toBeTruthy();
    expect(rtl.screen.queryByTestId('swap-empty')).toBeNull();
  });
});
