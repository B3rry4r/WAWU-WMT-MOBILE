/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
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

type Reply = { status: number; body: unknown };

const OWNER = '00000000-0000-4000-8000-0000000000a9';
const ACCOUNT = { accountNumber: '8100000417', accountName: 'Ada Eze', bankName: 'Ekiti Trial MFB', bankCode: '090620', licenceLine: null, depositInsuranceLine: null, openedAt: '2026-10-04T09:00:00.000Z' };
const ok = (data: unknown, status = 200): Reply => ({ status, body: { statusCode: status, message: 'OK', data } });
const refusal = (status: number, code: string, message: string): Reply => ({ status, body: { statusCode: status, message, data: null, reason: { code, message } } });
let fallback: Record<string, Reply> = {};

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const key = `${request.method} ${new URL(request.url).pathname.replace(/^\/api\/hub/, '')}`;
  const answer = fallback[key];
  if (!answer) throw new Error(`no answer for ${key}`);
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

function tokenFor(sub: string) {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
}

const clients: QueryClient[] = [];

/** A10's end that says the account already has a PIN, reached the way a person reaches it: a set the server refuses. */
async function atAlreadySet(onForgotPin?: () => void, afterReset = false) {
  const { CreatePinScreen } = require('../CreatePinScreen') as typeof import('../CreatePinScreen');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  const props = { onBack: jest.fn(), onDone: jest.fn(), onNotOpen: jest.fn(), onLeave: jest.fn() };
  await rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <CreatePinScreen {...props} onForgotPin={onForgotPin} afterReset={afterReset} />
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
  await rtl.waitFor(() => expect(rtl.screen.getByRole('button', { name: '1' }).props.accessibilityState?.disabled).toBeFalsy());
  for (const pin of ['2749', '2749']) for (const d of pin) await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: d }));
  expect(await rtl.screen.findByTestId('open-wallet-pin-already-set')).toBeTruthy();
  return props;
}

beforeEach(() => {
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  fallback = {
    'GET /money/wallet': ok({ state: 'open', account: ACCOUNT, limits: null, pin: { isSet: false, changedAt: null, triesLeft: 5, lockedUntil: null }, bankTransfers: { allowed: true, blockedBy: null }, beneficiaryCount: 0 }),
    'POST /money/pin': refusal(409, 'pin_already_set', 'You already have a transaction PIN.'),
  };
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
});

afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  await rtl.cleanup();
  clients.splice(0).forEach((client) => client.clear());
});

describe('A10 · a PIN the server already holds, and W37 (BACKEND_GAPS G-116)', () => {
  it('a user who does not know the earlier PIN can tap Forgot PIN? and is taken to the reset', async () => {
    const onForgotPin = jest.fn();
    const props = await atAlreadySet(onForgotPin);
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Forgot PIN?' }));
    expect(onForgotPin).toHaveBeenCalledTimes(1);
    expect(props.onDone).not.toHaveBeenCalled();
    // Done is still the first way on.
    await rtl.fireEvent.press(rtl.screen.getByText('Done'));
    expect(props.onDone).toHaveBeenCalledTimes(1);
  });

  it('with nowhere to open the reset, the end shows no Forgot PIN? (no dead button)', async () => {
    await atAlreadySet(undefined);
    expect(rtl.screen.queryByRole('button', { name: 'Forgot PIN?' })).toBeNull();
  });

  it('the end says that an earlier PIN still approves payments, as it cannot tell which PIN the account holds', async () => {
    await atAlreadySet(jest.fn());
    expect(rtl.screen.getByText(/If you set one before, that earlier PIN still approves payments/)).toBeTruthy();
  });

  it('after a reset made from it the end names the new PIN and no longer mentions an earlier one (D5)', async () => {
    await atAlreadySet(jest.fn(), true);
    expect(rtl.screen.getByText('Your PIN was reset. The new PIN you just chose is the one that approves payments.')).toBeTruthy();
    expect(rtl.screen.queryByText(/earlier PIN/)).toBeNull();
    expect(rtl.screen.getByText('You already have a transaction PIN')).toBeTruthy();
  });
});
