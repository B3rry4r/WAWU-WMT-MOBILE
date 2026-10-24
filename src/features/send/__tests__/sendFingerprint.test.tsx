/* eslint-disable @typescript-eslint/no-require-imports */
import { Stack } from 'expo-router';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text, View } from 'react-native';

import type { ComponentType } from 'react';

import { checkApproval, deviceRoutes, newDeviceHub, ok, refuse, type DeviceHub } from '@/features/device-approval/testing/deviceHub';
import { phone, vault } from '@/features/device-approval/testing/secureStore';

/*
 * W11 · approve a send with the phone's fingerprint or face (FIX-108; G-43, G-788): the real review route and PIN sheet, the Hub as a
 * stand-in `fetch` that checks the approval the way the Hub does (the registered key's signature over the exact method, path and body
 * bytes; `testing/deviceHub.ts`), the phone's key in a vault and its prompt as something the test sets. No device was available.
 */
jest.mock('expo-secure-store', () => require('@/features/device-approval/testing/secureStore').secureStoreMock);
jest.mock('expo-crypto', () => require('@/features/device-approval/testing/expoCrypto'));

const OWNER = '00000000-0000-4000-8000-0000000000f2';
const AMAKA = { wawuUserId: '11111111-1111-4111-8111-111111111111', displayName: 'Amaka Nwosu', handle: 'amaka', avatarUrl: null, tick: 'creator' };
const SEND_ID = '33333333-3333-4333-8333-333333333333';
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

let device: DeviceHub;
const hub = { sends: [] as { pin: string | null; approval: string | null; key: string | null; text: string }[], locked: false };

const quote = (amountKobo: number) => ({
  kind: 'wawu_transfer',
  billCategory: null,
  amountKobo,
  fee: { providerFeeKobo: 1575, wawuFeeKobo: 1000, totalFeeKobo: 2575 },
  parts: [
    { code: 'balance_transfer', source: 'provider', amountKobo: 1575 },
    { code: 'wawu_fee', source: 'wawu', amountKobo: 1000 },
  ],
  totalKobo: amountKobo + 2575,
  withinDailyLimit: true,
  remainingTodayKobo: null,
  quoteToken: `tok-${amountKobo}`,
  expiresAt: '2099-01-01T00:00:00.000Z',
});

const completed = (body: Record<string, unknown>) => ({
  id: SEND_ID,
  kind: 'wawu_user',
  status: 'completed',
  amountKobo: Number(body.amountKobo),
  fee: { providerFeeKobo: 1575, wawuFeeKobo: 1000, totalFeeKobo: 2575 },
  totalKobo: Number(body.expectedTotalKobo),
  note: null,
  reference: 'wawu-send-8f2k91qx',
  toWawuUser: AMAKA,
  toBankAccount: null,
  timeline: [],
  failureReason: null,
  reversal: null,
  statusMessage: null,
  transactionId: null,
  createdAt: '2026-10-24T09:42:00.000Z',
  completedAt: '2026-10-24T09:42:05.000Z',
});

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  if (path === '/money/wallet/balance') return ok({ availableKobo: 48_525_075, asOf: '2026-10-24T09:00:00.000Z' });
  if (path === '/money/fees/quote') return ok(quote(Number(url.searchParams.get('amountKobo'))));
  if (path === '/money/beneficiaries') return ok([]);
  if (path === '/money/transfers/wawu' && request.method === 'POST') {
    const text = await request.clone().text();
    const pin = request.headers.get('x-transaction-pin');
    const approval = request.headers.get('x-device-approval');
    hub.sends.push({ pin, approval, key: request.headers.get('idempotency-key'), text });
    if (approval !== null) {
      if (hub.locked) return refuse(423, { code: 'pin_locked', message: 'Too many wrong tries.', lockedUntil: new Date(Date.now() + 25 * 60_000).toISOString() });
      if ((await checkApproval(device, request)) === 'refused') return refuse(403, { code: 'device_approval_refused', message: 'Your fingerprint or face could not approve this. Use your PIN.' });
    } else if (pin !== device.pin) {
      return refuse(403, { code: 'pin_incorrect', message: 'Wrong PIN. 4 tries left.', triesLeft: 4 });
    }
    return json(201, { statusCode: 201, message: 'Created', data: completed(JSON.parse(text) as Record<string, unknown>) });
  }
  const answer = await deviceRoutes(device, request);
  if (answer) return answer;
  return json(404, { statusCode: 404, message: `Not here: ${request.method} ${path}` });
}) as typeof fetch;

const page = (path: string) => (require(path) as { default: ComponentType }).default;
let routes: Record<string, ComponentType>;
let session: typeof import('@/api/session');
let queryClient: typeof import('@/api/query').queryClient;
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
const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};

beforeAll(async () => {
  session = require('@/api/session') as typeof import('@/api/session');
  queryClient = (require('@/api/query') as typeof import('@/api/query')).queryClient;
  routes = {
    _layout: () => <Stack screenOptions={{ headerShown: false }} />,
    wallet: stub('Wallet tab'),
    welcome: stub('Welcome'),
    'reset-pin': stub('Reset PIN'),
    'open-wallet': stub('Open your wallet'),
    'open-wallet-pin': stub('Create your PIN'),
    'send/review': page('@/app/send/review'),
    'send/receipt': page('@/app/send/receipt'),
  };
  const { unmount } = await renderRouter(routes, { initialUrl: '/wallet' });
  await unmount();
}, 60_000);

/** This phone already has the key and the Hub already lists it: a person who turned the switch on at W35. */
function seedRegistered() {
  const { makeKeyPair } = require('@/features/device-approval/crypto') as typeof import('@/features/device-approval/crypto');
  const pair = makeKeyPair();
  const deviceId = '7c1d0e2f-3a4b-4c5d-8e6f-7a8b9c0d1e2f';
  device.device = { deviceId, publicKey: pair.publicKey, biometric: 'fingerprint' };
  vault.set('wawu.approval.key', pair.secretKeyHex);
  vault.set('wawu.approval.device', JSON.stringify({ owner: OWNER, deviceId, biometric: 'fingerprint' }));
  return pair;
}

beforeEach(() => {
  device = newDeviceHub('1234');
  Object.assign(hub, { sends: [], locked: false });
  Object.assign(phone, { prompt: 'ok', biometric: true, prompts: [], writes: [] });
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, gcTime: 0 } });
  vault.clear();
  vault.set('wawu.session.access', tokenFor(OWNER));
  vault.set('wawu.session.refresh', 'refresh-1');
  session.resetSessionForTests();
});

afterAll(async () => {
  await queryClient.cancelQueries();
  queryClient.clear();
});

const REVIEW_URL = `/send/review?id=${AMAKA.wawuUserId}&name=Amaka%20Nwosu&handle=amaka&tick=creator&amount=2500000`;
const tap = async (digits: string) => {
  for (const d of digits) await fireEvent.press(screen.getByRole('button', { name: d }));
};
async function openSheet() {
  await renderRouter(routes, { initialUrl: REVIEW_URL });
  await screen.findByTestId('send-review-screen');
  await fireEvent.press(await screen.findByRole('button', { name: /^Send ₦/ }));
  await screen.findByText(/^Approve ₦/);
}

describe('W11 · fingerprint or face on the PIN sheet', () => {
  it('a user taps the fingerprint key: the send carries a signed approval of exactly that request and no PIN, and ends on the receipt', async () => {
    seedRegistered();
    await openSheet();
    await fireEvent.press(await screen.findByRole('button', { name: 'Use fingerprint' }));
    await screen.findByText(/wawu-send-8f2k91qx/);

    expect(hub.sends).toHaveLength(1);
    expect(hub.sends[0].pin).toBeNull();
    expect(hub.sends[0].approval).toMatch(/^v1\.[0-9a-f-]{36}\.[A-Za-z0-9_-]+$/);
    expect(hub.sends[0].key).toBeTruthy();
    // The Hub's own check passed: the key's signature over the method, path and the exact body bytes that were sent.
    expect(device.checks).toEqual(['approved']);
    expect(JSON.parse(hub.sends[0].text)).toMatchObject({ amountKobo: 2_500_000, recipientWawuUserId: AMAKA.wawuUserId });
    // The prompt says what is being approved, with the total.
    expect(phone.prompts).toEqual(['Approve ₦25,025.75 to Amaka Nwosu']);
  });

  it('a refused approval says "Fingerprint failed. Use your PIN.", uses no PIN try, and the PIN then sends with the SAME Idempotency-Key', async () => {
    const pair = seedRegistered();
    // The Hub lists another key than this phone's: it refuses the signature.
    const { makeKeyPair } = require('@/features/device-approval/crypto') as typeof import('@/features/device-approval/crypto');
    if (device.device) device.device.publicKey = makeKeyPair().publicKey;
    expect(pair.publicKey).not.toBe(device.device?.publicKey);
    await openSheet();
    await fireEvent.press(await screen.findByRole('button', { name: 'Use fingerprint' }));
    expect(await screen.findByText('Fingerprint failed. Use your PIN.')).toBeTruthy();
    expect(screen.queryByText(/Wrong PIN/)).toBeNull();

    await tap('1234');
    await screen.findByText(/wawu-send-8f2k91qx/);
    expect(hub.sends).toHaveLength(2);
    expect(hub.sends[0].approval).not.toBeNull();
    expect(hub.sends[1]).toMatchObject({ pin: '1234', approval: null });
    expect(hub.sends[1].key).toBe(hub.sends[0].key);
    expect(hub.sends[1].text).toBe(hub.sends[0].text);
  });

  it('a prompt the user closes sends nothing and says nothing; the keypad is still there for the PIN', async () => {
    seedRegistered();
    phone.prompt = 'cancel';
    await openSheet();
    await fireEvent.press(await screen.findByRole('button', { name: 'Use fingerprint' }));
    await waitFor(() => expect(phone.prompts).toHaveLength(1));
    expect(hub.sends).toHaveLength(0);
    expect(screen.queryByText(/failed/)).toBeNull();
    await tap('1234');
    await screen.findByText(/wawu-send-8f2k91qx/);
    expect(hub.sends).toHaveLength(1);
    expect(hub.sends[0]).toMatchObject({ pin: '1234', approval: null });
  });

  it('a key the system has dropped (the phone’s biometrics changed) falls back to the PIN and turns the switch off at the Hub', async () => {
    seedRegistered();
    phone.prompt = 'dropped';
    await openSheet();
    await fireEvent.press(await screen.findByRole('button', { name: 'Use fingerprint' }));
    expect(await screen.findByText('Fingerprint failed. Use your PIN.')).toBeTruthy();
    await waitFor(() => expect(device.deletes).toBe(1));
    expect(hub.sends).toHaveLength(0);
    expect(vault.has('wawu.approval.device')).toBe(false);
  });

  it('a locked PIN refuses a passed approval too: the sheet shows the lock', async () => {
    seedRegistered();
    hub.locked = true;
    await openSheet();
    await fireEvent.press(await screen.findByRole('button', { name: 'Use fingerprint' }));
    expect(await screen.findByText('PIN locked')).toBeTruthy();
    expect(screen.queryByText(/failed/)).toBeNull();
  });

  it('offers no fingerprint key where the user has not turned it on, or the Hub no longer lists this phone', async () => {
    await openSheet();
    expect(screen.queryByRole('button', { name: 'Use fingerprint' })).toBeNull();
    await screen.unmount();

    seedRegistered();
    device.device = null;
    await openSheet();
    await waitFor(() => expect(vault.has('wawu.approval.device')).toBe(false));
    expect(screen.queryByRole('button', { name: 'Use fingerprint' })).toBeNull();
  });
});
