/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * A8's Copy on the phone build (SHARED-04): the real `copy.ts` over `expo-clipboard`, which is replaced
 * here so no test reaches the phone's clipboard. `WalletOpenScreen.test.tsx` covers the screen with the
 * copy stood in; this file proves the phone's own copy call.
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
jest.mock('expo-router', () => ({ useIsFocused: () => true }));

/** What the phone's clipboard answers to each copy: `true` (on it), `false` (refused) or `throw`. */
let mockClipboardAnswer: boolean | 'throw' = true;
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(async () => {
    if (mockClipboardAnswer === 'throw') throw new Error('clipboard unavailable');
    return mockClipboardAnswer;
  }),
}));

const Clipboard = jest.mocked(require('expo-clipboard') as typeof import('expo-clipboard'));
const { copyText } = require('../copy') as typeof import('../copy');

const OWNER = '00000000-0000-4000-8000-0000000000e4';
/** Made-up account details in the shape the server answers (MONEY-12). Never a real account. */
const ACCOUNT = { accountNumber: '8123456789', accountName: 'Ada Eze', bankName: 'Loma Bank', bankCode: '090620', licenceLine: null, depositInsuranceLine: null, openedAt: '2026-10-08T09:00:00.000Z' };
const wallet = {
  state: 'open',
  account: ACCOUNT,
  limits: null,
  pin: { isSet: false, changedAt: null, triesLeft: 5, lockedUntil: null },
  bankTransfers: { allowed: true, blockedBy: null },
  beneficiaryCount: 0,
};

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  if (request.method === 'GET' && path === '/money/wallet') {
    return new Response(JSON.stringify({ statusCode: 200, message: 'OK', data: wallet }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  throw new Error(`no answer for ${request.method} ${path}`);
}) as typeof fetch;

function tokenFor(sub: string) {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
}

const clients: QueryClient[] = [];

async function boot() {
  const { WalletOpenScreen } = require('../WalletOpenScreen') as typeof import('../WalletOpenScreen');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  await rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <WalletOpenScreen onCreatePin={jest.fn()} onDone={jest.fn()} onNoWallet={jest.fn()} />
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockClipboardAnswer = true;
  Clipboard.setStringAsync.mockClear();
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
});

afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  await rtl.cleanup();
  clients.splice(0).forEach((client) => client.clear());
});

describe('A8 · Copy on the phone (expo-clipboard)', () => {
  it('a user can copy the account number: its digits as the server sent them go on the phone’s clipboard, and the button says Copied', async () => {
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('open-wallet-account-copy'));
    expect(Clipboard.setStringAsync).toHaveBeenCalledTimes(1);
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('8123456789');
    expect(await rtl.screen.findByText('Copied')).toBeTruthy();
  });

  it('a copy the phone refuses, or a clipboard that fails, never says Copied', async () => {
    mockClipboardAnswer = false;
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('open-wallet-account-copy'));
    expect(Clipboard.setStringAsync).toHaveBeenCalledTimes(1);
    expect(rtl.screen.queryByText('Copied')).toBeNull();
    expect(rtl.screen.getByText('Copy')).toBeTruthy();

    mockClipboardAnswer = 'throw';
    await rtl.fireEvent.press(rtl.screen.getByTestId('open-wallet-account-copy'));
    expect(Clipboard.setStringAsync).toHaveBeenCalledTimes(2);
    expect(rtl.screen.queryByText('Copied')).toBeNull();
  });

  it('copyText answers what the clipboard did', async () => {
    await expect(copyText('0123')).resolves.toBe(true);
    mockClipboardAnswer = false;
    await expect(copyText('0123')).resolves.toBe(false);
    mockClipboardAnswer = 'throw';
    await expect(copyText('0123')).resolves.toBe(false);
  });
});
