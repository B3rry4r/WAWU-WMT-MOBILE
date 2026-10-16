/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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

const OWNER = '00000000-0000-4000-8000-0000000000b9';
const ACCOUNT = { accountNumber: '8100000417', accountName: 'Ada Eze', bankName: 'Ekiti Trial MFB', bankCode: '090620', licenceLine: null, depositInsuranceLine: null, openedAt: '2026-10-04T09:00:00.000Z' };

globalThis.fetch = jest.fn(async () => {
  const data = {
    state: 'open',
    account: ACCOUNT,
    limits: null,
    pin: { isSet: true, changedAt: '2026-07-01T09:00:00.000Z', triesLeft: 5, lockedUntil: null },
    bankTransfers: { allowed: true, blockedBy: null },
    beneficiaryCount: 2,
  };
  return new Response(JSON.stringify({ statusCode: 200, message: 'OK', data }), { status: 200, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

function tokenFor(sub: string) {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
}

async function boot(props: { onOpenStatements?: jest.Mock }) {
  const { WalletSettingsScreen } = require('../settings/WalletSettingsScreen') as typeof import('../settings/WalletSettingsScreen');
  await rtl.render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <WalletSettingsScreen onBack={jest.fn()} onOpenPin={jest.fn()} onCreatePin={jest.fn()} onOpenWallet={jest.fn()} {...props} />
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false, gcTime: 0 } });
  Dimensions.set({ window: { width: 390, height: 844, scale: 2, fontScale: 1 } });
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
  (require('../statements/notice') as typeof import('../statements/notice')).clearStatementSent();
});

afterEach(async () => {
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  await rtl.cleanup();
  await queryClient.cancelQueries();
  queryClient.clear();
});

describe('W35 · the Statements row and W38\'s toast', () => {
  it('a user taps Statements and is taken to W38; the row is first in the group with Account details', async () => {
    const onOpenStatements = jest.fn();
    await boot({ onOpenStatements });
    await rtl.fireEvent.press(await rtl.screen.findByTestId('wallet-settings-statements'));
    expect(onOpenStatements).toHaveBeenCalledTimes(1);
    expect(rtl.screen.getByText('Statements')).toBeTruthy();
    expect(rtl.screen.getByText('Account details')).toBeTruthy();
  });

  it('without a screen to open the row is not drawn (R-47)', async () => {
    await boot({});
    await rtl.screen.findByTestId('wallet-settings-pin');
    expect(rtl.screen.queryByText('Statements')).toBeNull();
    expect(rtl.screen.getByText('Account details')).toBeTruthy();
  });

  it('after W38 sends, W35 shows where the statement went, and the toast goes by itself', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
    try {
      await boot({ onOpenStatements: jest.fn() });
      await rtl.screen.findByTestId('wallet-settings-pin');
      expect(rtl.screen.queryByTestId('statement-sent')).toBeNull();
      const { postStatementSent, STATEMENT_SENT_MS } = require('../statements/notice') as typeof import('../statements/notice');
      await rtl.act(async () => postStatementSent('q***@mail.test'));
      expect(rtl.screen.getByText('Statement sent to q***@mail.test')).toBeTruthy();
      await rtl.act(async () => {
        jest.advanceTimersByTime(STATEMENT_SENT_MS + 10);
      });
      expect(rtl.screen.queryByText('Statement sent to q***@mail.test')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });
});
