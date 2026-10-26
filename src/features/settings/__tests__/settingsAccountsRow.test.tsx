/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * FX-POLISH M1 (owner's choice, R-93 D3): "Accounts and currencies" is a row of the main Settings screen as well as of Wallet settings.
 * It is drawn only for a person who has a wallet, and it opens /accounts. This is the route file, as the Hub's own answer decides it.
 */
const mockVault = new Map<string, string>();
const mockPush = jest.fn();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));
jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn(), canGoBack: () => true }),
}));

const OWNER = '00000000-0000-4000-8000-0000000000f1';
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
let walletState = 'open';
let sent: string[] = [];

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  sent.push(`${request.method} ${path}`);
  if (path === '/money/wallet') {
    return json(200, {
      statusCode: 200,
      message: 'OK',
      data: {
        state: walletState,
        account: walletState === 'open' ? { accountNumber: '8100000417', accountName: 'Ada Eze', bankName: 'Ekiti Trial MFB', bankCode: '090620', licenceLine: null, depositInsuranceLine: null, openedAt: '2026-10-04T09:00:00.000Z' } : null,
        limits: null,
        pin: { isSet: true, changedAt: '2026-10-04T09:01:00.000Z', triesLeft: 5, lockedUntil: null },
        bankTransfers: { allowed: true, blockedBy: null },
        beneficiaryCount: 0,
      },
    });
  }
  return json(404, { statusCode: 404, message: 'Not Found', data: null });
}) as typeof fetch;

const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};

const clients: QueryClient[] = [];
async function boot() {
  const SettingsRoute = (require('@/app/settings/index') as typeof import('@/app/settings/index')).default;
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false }, mutations: { gcTime: Infinity, retry: false } } });
  clients.push(client);
  await rtl.render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>
        <SettingsRoute />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false, gcTime: 0 } });
  walletState = 'open';
  sent = [];
  mockPush.mockClear();
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
});

afterEach(async () => {
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  await rtl.cleanup();
  await queryClient.cancelQueries();
  queryClient.clear();
  clients.splice(0).forEach((c) => c.clear());
});

describe('Settings has an Accounts and currencies row for a person with a wallet (M1)', () => {
  it('draws it as its own row and opens /accounts', async () => {
    await boot();
    const row = await rtl.screen.findByTestId('settings-accounts');
    expect(rtl.within(row).getByText('Accounts and currencies')).toBeTruthy();
    await rtl.fireEvent.press(row);
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/accounts');
  });

  it('keeps the Wallet and PIN row beside it, opening Wallet settings', async () => {
    await boot();
    await rtl.screen.findByTestId('settings-accounts');
    await rtl.fireEvent.press(rtl.screen.getByTestId('settings-wallet'));
    expect(mockPush).toHaveBeenCalledWith('/wallet-settings');
  });

  it('draws no row for a person with no wallet, once the Hub has said so', async () => {
    walletState = 'not_open';
    await boot();
    await rtl.screen.findByTestId('settings-wallet');
    await rtl.waitFor(() => expect(sent).toContain('GET /money/wallet'));
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(rtl.screen.queryByTestId('settings-accounts')).toBeNull();
    expect(rtl.screen.queryByText('Accounts and currencies')).toBeNull();
  });

  it('draws no row while the wallet has not been read (nothing is drawn that is not known to lead somewhere)', async () => {
    await boot();
    expect(rtl.screen.queryByTestId('settings-accounts')).toBeNull();
    await rtl.screen.findByTestId('settings-accounts');
  });
});
