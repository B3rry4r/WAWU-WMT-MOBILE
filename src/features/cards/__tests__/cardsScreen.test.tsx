/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * R2-MONEY D-06: /cards for a person with no wallet yet (R-6) says so and leads to Open your wallet, with no "couldn't load" and no Try
 * again (retry cannot help); a read that really failed still says it could not load.
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

const OWNER = '00000000-0000-4000-8000-0000000000c1';
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const hub = { mode: 'no_wallet' as 'no_wallet' | 'broken' };

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  if (path === '/money/cards') {
    return hub.mode === 'no_wallet'
      ? json(409, { data: null, statusCode: 409, message: 'You need a wallet first.', reason: { code: 'wallet_not_open', message: 'You need a wallet first.' } })
      : json(500, { data: null, statusCode: 500, message: 'Something went wrong', reason: { code: 'internal', message: 'Something went wrong' } });
  }
  throw new Error(`no answer for ${request.method} ${path}`);
}) as typeof fetch;

const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};

const openWallet = jest.fn();
async function boot() {
  const { CardsScreen } = require('../CardsScreen') as typeof import('../CardsScreen');
  await rtl.render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <CardsScreen onBack={jest.fn()} onDone={jest.fn()} onOpenCard={jest.fn()} onGetCard={jest.fn()} onOpenWallet={openWallet} onSetPin={jest.fn()} onForgotPin={jest.fn()} />
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false, gcTime: 0 } });
  openWallet.mockReset();
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
});

describe('Cards for a person with no wallet, and for a read that failed', () => {
  it('a person with no wallet is told so and led to Open your wallet, with no connection error and no retry', async () => {
    hub.mode = 'no_wallet';
    await boot();
    expect(await rtl.screen.findByTestId('cards-no-wallet')).toBeTruthy();
    expect(rtl.screen.getByText("You don't have a wallet yet")).toBeTruthy();
    expect(rtl.screen.queryByText(/couldn.t load/i)).toBeNull();
    expect(rtl.screen.queryByText('Try again')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Open your wallet' }));
    expect(openWallet).toHaveBeenCalledTimes(1);
  });

  it('a read that really failed still says it could not load the cards, with Try again', async () => {
    hub.mode = 'broken';
    await boot();
    expect(await rtl.screen.findByTestId('cards-error')).toBeTruthy();
    expect(rtl.screen.getByText('We couldn’t load your cards')).toBeTruthy();
    expect(rtl.screen.queryByTestId('cards-no-wallet')).toBeNull();
  });
});
