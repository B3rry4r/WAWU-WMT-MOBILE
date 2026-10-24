/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text, View } from 'react-native';

import type { ComponentType } from 'react';

import { checkApproval, deviceRoutes, newDeviceHub, ok, refuse, type DeviceHub } from '@/features/device-approval/testing/deviceHub';
import { phone, vault } from '@/features/device-approval/testing/secureStore';

/*
 * Withdraw with the phone's fingerprint or face (FIX-108; W17 and the PIN sheet's key): the real Withdraw screen and PIN sheet on the
 * Expo Router stack, the Hub as a stand-in `fetch` that answers a key it knows with its first withdrawal and checks an approval the
 * way the Hub does (`testing/deviceHub.ts`). A closed or refused fingerprint proves nothing about an earlier try under the same
 * Idempotency-Key (a PIN whose answer was lost, and the Hub took the withdrawal): the key and the stored intent stay, so the PIN that
 * follows is the SAME withdrawal and the money moves once.
 */
jest.mock('expo-secure-store', () => require('@/features/device-approval/testing/secureStore').secureStoreMock);
jest.mock('expo-crypto', () => require('@/features/device-approval/testing/expoCrypto'));

const OWNER = '00000000-0000-4000-8000-0000000000f6';
const PAYOUT = { bankCode: '044', bankName: 'Access Bank', accountNumber: '0987654321', accountName: 'Lennox Emmanuel', matchesBvnName: true, updatedAt: '2026-10-01T09:00:00.000Z' };
const TRANSFER_ID = '55555555-5555-4555-8555-555555555555';
const AMOUNT_KOBO = 5_000_000;
const INTENT_KEY = 'withdraw:044:0987654321';
const LOST_LINE = "We didn't get an answer. Try again: it will only happen once.";
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

let device: DeviceHub;
const hub = {
  lose: false,
  /** The Hub looks at the approval before it looks at a key it knows (the app must not depend on which it does first). */
  approvalFirst: false,
  sends: [] as { pin: string | null; approval: string | null; key: string }[],
  created: {} as Record<string, unknown>,
  debits: 0,
};

const quote = (amountKobo: number) => ({
  kind: 'bank_transfer',
  billCategory: null,
  amountKobo,
  fee: { providerFeeKobo: 4000, wawuFeeKobo: 2500, totalFeeKobo: 6500 },
  parts: [
    { code: 'bank_transfer', source: 'provider', amountKobo: 4000 },
    { code: 'wawu_fee', source: 'wawu', amountKobo: 2500 },
  ],
  totalKobo: amountKobo + 6500,
  withinDailyLimit: true,
  remainingTodayKobo: null,
  quoteToken: `tok-${amountKobo}`,
  expiresAt: '2099-01-01T00:00:00.000Z',
});

const transfer = (amountKobo: number, total: number) => ({
  id: TRANSFER_ID,
  kind: 'bank_account',
  status: 'pending',
  amountKobo,
  fee: { providerFeeKobo: 4000, wawuFeeKobo: 2500, totalFeeKobo: 6500 },
  totalKobo: total,
  note: null,
  reference: 'wawu-bank-7c1d4a90',
  toWawuUser: null,
  toBankAccount: { bankCode: PAYOUT.bankCode, bankName: PAYOUT.bankName, accountNumber: PAYOUT.accountNumber, accountName: PAYOUT.accountName },
  timeline: [{ step: 'requested', at: '2026-10-16T09:42:00.000Z' }],
  failureReason: null,
  reversal: null,
  statusMessage: 'Waiting for the bank.',
  transactionId: null,
  createdAt: '2026-10-16T09:42:00.000Z',
  completedAt: null,
});

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  if (path === '/money/wallet/balance') return ok({ availableKobo: 48_525_075, asOf: '2026-10-16T09:00:00.000Z' });
  if (path === '/money/payout-account') return ok(PAYOUT);
  if (path === '/money/fees/quote') return ok(quote(Number(url.searchParams.get('amountKobo'))));
  if (path === '/money/transfers/bank' && request.method === 'POST') {
    const body = (await request.clone().json()) as Record<string, number>;
    const key = request.headers.get('idempotency-key') ?? '';
    const approval = request.headers.get('x-device-approval');
    hub.sends.push({ pin: request.headers.get('x-transaction-pin'), approval, key });
    const refusedApproval = async () => approval !== null && (await checkApproval(device, request)) === 'refused';
    const refusal = () => refuse(403, { code: 'device_approval_refused', message: 'Your fingerprint or face could not approve this. Use your PIN.' });
    if (hub.approvalFirst && (await refusedApproval())) return refusal();
    // A key the Hub knows is answered with its first withdrawal, before it looks at the PIN.
    if (hub.created[key]) return json(201, { statusCode: 201, message: 'Created', data: hub.created[key] });
    if (!hub.approvalFirst && (await refusedApproval())) return refusal();
    if (approval === null && request.headers.get('x-transaction-pin') !== device.pin) return refuse(403, { code: 'pin_incorrect', message: 'Wrong PIN. 4 tries left.', triesLeft: 4 });
    hub.created[key] = transfer(body.amountKobo, body.expectedTotalKobo);
    hub.debits += 1;
    if (hub.lose && hub.debits === 1) return json(500, { statusCode: 500, message: 'Something went wrong' });
    return json(201, { statusCode: 201, message: 'Created', data: hub.created[key] });
  }
  if (path === `/money/transfers/${TRANSFER_ID}` && request.method === 'GET') return ok(transfer(AMOUNT_KOBO, AMOUNT_KOBO + 6500));
  const answer = await deviceRoutes(device, request);
  if (answer) return answer;
  return json(404, { statusCode: 404, message: `Not here: ${request.method} ${path}` });
}) as typeof fetch;

const page = (path: string) => (require(path) as { default: ComponentType }).default;
let routes: Record<string, ComponentType>;
let session: typeof import('@/api/session');
let queryClient: typeof import('@/api/query').queryClient;
const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};
const stub = (name: string) => {
  function Stub() {
    return (
      <View>
        <Text accessibilityRole="header">{name}</Text>
      </View>
    );
  }
  return Stub;
};

beforeAll(async () => {
  session = require('@/api/session') as typeof import('@/api/session');
  queryClient = (require('@/api/query') as typeof import('@/api/query')).queryClient;
  routes = {
    _layout: () => (
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    ),
    wallet: stub('Wallet tab'),
    welcome: stub('Welcome'),
    'reset-pin': stub('Reset PIN'),
    'open-wallet': stub('Open your wallet'),
    'open-wallet-pin': stub('Create your PIN'),
    'payout-account': stub('Payout bank'),
    'withdraw/index': page('@/app/withdraw/index'),
    'withdraw/receipt': page('@/app/withdraw/receipt'),
    'withdraw/failed': page('@/app/withdraw/failed'),
    'send/receipt': stub('Send receipt'),
  };
  const { unmount } = await renderRouter(routes, { initialUrl: '/wallet' });
  await unmount();
}, 60_000);

/** This phone already has the key and the Hub already lists it: a person who turned the switch on in Wallet settings. */
function seedRegistered(listedKeyIsAnotherPhones = false) {
  const { makeKeyPair } = require('@/features/device-approval/crypto') as typeof import('@/features/device-approval/crypto');
  const pair = makeKeyPair();
  const deviceId = '7c1d0e2f-3a4b-4c5d-8e6f-7a8b9c0d1e2f';
  device.device = { deviceId, publicKey: listedKeyIsAnotherPhones ? makeKeyPair().publicKey : pair.publicKey, biometric: 'fingerprint' };
  vault.set('wawu.approval.key', pair.secretKeyHex);
  vault.set('wawu.approval.device', JSON.stringify({ owner: OWNER, deviceId, biometric: 'fingerprint' }));
}

beforeEach(() => {
  device = newDeviceHub('1234');
  Object.assign(hub, { lose: false, approvalFirst: false, sends: [], created: {}, debits: 0 });
  Object.assign(phone, { prompt: 'ok', biometric: true, prompts: [], writes: [] });
  (require('@/features/send/intent') as { forgetIntentsInMemory: () => void }).forgetIntentsInMemory();
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, gcTime: 0, retry: false } });
  vault.clear();
  vault.set('wawu.session.access', tokenFor(OWNER));
  vault.set('wawu.session.refresh', 'refresh-1');
  session.resetSessionForTests();
});
afterAll(async () => {
  await queryClient.cancelQueries();
  queryClient.clear();
});

const tap = async (digits: string) => {
  for (const d of digits) await fireEvent.press(screen.getByRole('button', { name: d }));
};
const storedIntent = async () => (require('@/features/send/intent') as typeof import('@/features/send/intent')).findIntent(OWNER, INTENT_KEY, AMOUNT_KOBO);

/** Withdraw, ₦50,000 typed, the PIN sheet open. */
async function reachPin() {
  await renderRouter(routes, { initialUrl: '/withdraw' });
  await screen.findByTestId('withdraw-destination');
  await fireEvent.changeText(screen.getByTestId('withdraw-amount'), '50000');
  await screen.findByTestId('withdraw-fees');
  await fireEvent.press(screen.getByTestId('withdraw-submit'));
  await screen.findByText(/^Approve ₦/);
}
const useFingerprint = async () => fireEvent.press(await screen.findByRole('button', { name: 'Use fingerprint' }));

describe('Withdraw with a fingerprint (FIX-108)', () => {
  it('a fingerprint approves the withdrawal: the signed approval of exactly that request and no PIN, once, and W19 opens', async () => {
    seedRegistered();
    await reachPin();
    await useFingerprint();
    await screen.findByTestId('withdraw-receipt-screen');
    expect(hub.sends).toHaveLength(1);
    expect(hub.sends[0]!.pin).toBeNull();
    expect(hub.sends[0]!.approval).toMatch(/^v1\./);
    expect(device.checks).toEqual(['approved']);
    expect(hub.debits).toBe(1);
  });

  it('a PIN whose answer was lost, then a fingerprint the person closes, then the PIN: the SAME key, the stored intent kept, one withdrawal', async () => {
    seedRegistered();
    hub.lose = true;
    await reachPin();
    await tap('1234');
    expect(await screen.findByText(LOST_LINE)).toBeTruthy();
    expect(hub.debits).toBe(1);
    const firstKey = hub.sends[0]!.key;

    phone.prompt = 'cancel';
    await useFingerprint();
    await waitFor(() => expect(phone.prompts).toHaveLength(1));
    // Nothing left the phone, nothing was said, and the earlier try is still remembered under its own key.
    expect(hub.sends).toHaveLength(1);
    expect(screen.queryByText(/ingerprint failed/)).toBeNull();
    expect(await storedIntent()).toMatchObject({ key: firstKey, phase: 'unknown' });

    await tap('1234');
    await screen.findByTestId('withdraw-receipt-screen');
    expect(hub.sends.map((s) => s.key)).toEqual([firstKey, firstKey]);
    expect(hub.debits).toBe(1);
  });

  it('a PIN whose answer was lost, then a fingerprint the Hub refuses, then the PIN: the SAME key, the stored intent kept, one withdrawal', async () => {
    seedRegistered(true);
    hub.lose = true;
    await reachPin();
    await tap('1234');
    expect(await screen.findByText(LOST_LINE)).toBeTruthy();
    const firstKey = hub.sends[0]!.key;

    hub.approvalFirst = true;
    await useFingerprint();
    expect(await screen.findByText('Fingerprint failed. Use your PIN.')).toBeTruthy();
    expect(hub.sends).toHaveLength(2);
    expect(hub.sends[1]).toMatchObject({ pin: null, key: firstKey });
    expect(await storedIntent()).toMatchObject({ key: firstKey, phase: 'unknown' });

    await tap('1234');
    await screen.findByTestId('withdraw-receipt-screen');
    expect(hub.sends.map((s) => s.key)).toEqual([firstKey, firstKey, firstKey]);
    expect(hub.sends[2]).toMatchObject({ pin: '1234', approval: null });
    expect(hub.debits).toBe(1);
  });

  it('a PIN whose answer was lost, then a fingerprint that approves: the SAME key, the Hub answers with the first withdrawal, one withdrawal', async () => {
    seedRegistered();
    hub.lose = true;
    await reachPin();
    await tap('1234');
    expect(await screen.findByText(LOST_LINE)).toBeTruthy();
    const firstKey = hub.sends[0]!.key;

    await useFingerprint();
    await screen.findByTestId('withdraw-receipt-screen');
    expect(hub.sends.map((s) => s.key)).toEqual([firstKey, firstKey]);
    expect(hub.sends[1]!.approval).not.toBeNull();
    expect(hub.debits).toBe(1);
  });

  it('a first try with a fingerprint the Hub refuses says so, uses no PIN try, and the PIN then sends under the SAME key, once', async () => {
    seedRegistered(true);
    await reachPin();
    await useFingerprint();
    expect(await screen.findByText('Fingerprint failed. Use your PIN.')).toBeTruthy();
    expect(screen.queryByText(/Wrong PIN/)).toBeNull();
    expect(hub.sends).toHaveLength(1);
    // Nothing exists under that key, so the record the try wrote is let go; the key itself is not rotated.
    expect(await storedIntent()).toBeNull();

    await tap('1234');
    await screen.findByTestId('withdraw-receipt-screen');
    expect(hub.sends).toHaveLength(2);
    expect(hub.sends[1]).toMatchObject({ pin: '1234', approval: null, key: hub.sends[0]!.key });
    expect(hub.debits).toBe(1);
  });

  it('a first try with a fingerprint prompt the person closes sends nothing and says nothing; the PIN then sends once', async () => {
    seedRegistered();
    phone.prompt = 'cancel';
    await reachPin();
    await useFingerprint();
    await waitFor(() => expect(phone.prompts).toHaveLength(1));
    expect(hub.sends).toHaveLength(0);
    expect(screen.queryByText(/ingerprint failed/)).toBeNull();
    expect(await storedIntent()).toBeNull();

    await tap('1234');
    await screen.findByTestId('withdraw-receipt-screen');
    expect(hub.sends).toHaveLength(1);
    expect(hub.sends[0]).toMatchObject({ pin: '1234', approval: null });
    expect(hub.debits).toBe(1);
  });
});
