/* eslint-disable @typescript-eslint/no-require-imports */
import { checkApproval, deviceRoutes, newDeviceHub, refuse, type DeviceHub } from '@/features/device-approval/testing/deviceHub';
import { phone, vault } from '@/features/device-approval/testing/secureStore';

/*
 * Every payment the app makes with a PIN can be approved by the phone instead (FIX-112; FIX-108 did the sends): the request of each
 * sheet is signed over its exact method, path and body bytes, the Hub (a stand-in that checks the signature with Node's `crypto`, as
 * the Hub does) accepts it, the same Idempotency-Key travels, a refused approval is followed by the PIN under the SAME key, and a
 * prompt the person closes sends nothing. One row per payment route the app calls; the real API function of each sheet. Credits, community passes, points packs and the missing
 * points are bought in the store sheet now (R-86, IAP-02): they have no wallet route here any more.
 */
jest.mock('expo-secure-store', () => require('@/features/device-approval/testing/secureStore').secureStoreMock);
jest.mock('expo-crypto', () => require('@/features/device-approval/testing/expoCrypto'));

const OWNER = '00000000-0000-4000-8000-0000000000f2';
const KEY = '5b1c3a52-9a0e-4f5d-8f6e-2f6f0f3f7a11';
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

let device: DeviceHub;
type Seen = { method: string; path: string; pin: string | null; approval: string | null; key: string | null; text: string };
let seen: Seen[] = [];

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const answer = await deviceRoutes(device, request);
  if (answer) return answer;
  const url = new URL(request.url);
  const row: Seen = {
    method: request.method,
    path: url.pathname.replace(/^\/api\/hub/, '/api/hub') + url.search,
    pin: request.headers.get('x-transaction-pin'),
    approval: request.headers.get('x-device-approval'),
    key: request.headers.get('idempotency-key'),
    text: await request.clone().text(),
  };
  seen.push(row);
  if (row.approval !== null) {
    if ((await checkApproval(device, request)) === 'refused') return refuse(403, { code: 'device_approval_refused', message: 'Your fingerprint or face could not approve this. Use your PIN.' });
    return json(201, { statusCode: 201, message: 'Created', data: {} });
  }
  return refuse(403, { code: 'pin_incorrect', message: 'Wrong PIN. 4 tries left.', triesLeft: 4 });
}) as typeof fetch;

type Cred = { pin: string; approve?: never } | { approve: (signed: { method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'; path: string; body?: unknown }) => Promise<unknown>; pin?: never };
type Call = (cred: Cred, key: string) => Promise<{ kind: string }>;

const TOTAL = 102_325;
const quoteFields = { expectedTotalKobo: TOTAL, quoteToken: 'tok-1' };
const payQuote = { totalKobo: TOTAL, quoteToken: 'tok-1', payment: { totalKobo: TOTAL, quoteToken: 'tok-1' } };

let rows: [string, string, Call][];
let session: typeof import('@/api/session');
let approveRequest: typeof import('@/features/device-approval/approve').approveRequest;
let makeKeyPair: typeof import('@/features/device-approval/crypto').makeKeyPair;

const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};

beforeAll(() => {
  session = require('@/api/session') as typeof import('@/api/session');
  approveRequest = (require('@/features/device-approval/approve') as typeof import('@/features/device-approval/approve')).approveRequest;
  makeKeyPair = (require('@/features/device-approval/crypto') as typeof import('@/features/device-approval/crypto')).makeKeyPair;
  const tips = require('@/features/tips/api') as typeof import('@/features/tips/api');
  const unlock = require('@/features/unlock/api') as typeof import('@/features/unlock/api');
  const ask = require('@/features/paid-ask/api') as typeof import('@/features/paid-ask/api');
  const request = require('@/features/chat/requestApi') as typeof import('@/features/chat/requestApi');
  const events = require('@/features/events/buyApi') as typeof import('@/features/events/buyApi');
  const legal = require('@/features/legal/pay/api') as typeof import('@/features/legal/pay/api');
  const schools = require('@/features/schools/enrolApi') as typeof import('@/features/schools/enrolApi');
  const convert = require('@/features/points/api') as typeof import('@/features/points/api');
  const plans = require('@/features/verify/purchaseApi') as typeof import('@/features/verify/purchaseApi');
  rows = [
    ['a tip', '/api/hub/tips/wallet', (c, key) => tips.sendTip({ creatorWawuId: 'creator-1', amountKobo: 100_000, note: ' thanks ', ...quoteFields, key, ...c } as never)],
    // An id with a space: the path is signed as it is sent, encoded.
    ['an unlock', '/api/hub/content/a%20b/unlock/wallet', (c, key) => unlock.sendUnlock({ contentId: 'a b', ...quoteFields, key, ...c } as never)],
    ['a paid ask', '/api/hub/dm/send/wallet/pay', (c, key) => ask.payQuestion({ questionId: 'q-1', ...quoteFields, key, ...c } as never)],
    ['a request pay', '/api/hub/chats/chat-1/money-requests/req-1/pay', (c, key) => request.payMoneyRequest({ chatId: 'chat-1', requestId: 'req-1', quote: payQuote, key, ...c } as never)],
    ['a ticket', '/api/hub/events/orders/wallet/pay', (c, key) => events.payOrder({ orderId: 'order-1', ...quoteFields, key, ...c } as never)],
    ['a legal fee', '/api/hub/legal/requests/lr-1/pay/wallet', (c, key) => legal.payFee({ requestId: 'lr-1', ...quoteFields, key, ...c } as never)],
    ['school fees', '/api/hub/money/payments', (c, key) => schools.payFee({ enrolmentId: 'en-1', ...quoteFields, key, ...c } as never)],
    ['a points conversion', '/api/hub/points/convert', (c, key) => convert.convertPoints({ points: 500, quoteToken: 'tok-1', key, ...c } as never)],
    ['a plan', '/api/hub/plans/purchases', (c, key) => plans.buy({ target: { kind: 'extra_products' }, method: 'wallet', ...quoteFields, key, ...c } as never)],
  ];
});

beforeEach(() => {
  device = newDeviceHub('1234');
  seen = [];
  Object.assign(phone, { prompt: 'ok', biometric: true, prompts: [], writes: [] });
  vault.clear();
  vault.set('wawu.session.access', tokenFor(OWNER));
  vault.set('wawu.session.refresh', 'refresh-1');
  session.resetSessionForTests();
  const pair = makeKeyPair();
  const deviceId = '7c1d0e2f-3a4b-4c5d-8e6f-7a8b9c0d1e2f';
  device.device = { deviceId, publicKey: pair.publicKey, biometric: 'fingerprint' };
  vault.set('wawu.approval.key', pair.secretKeyHex);
  vault.set('wawu.approval.device', JSON.stringify({ owner: OWNER, deviceId, biometric: 'fingerprint' }));
});

const approve = (): Cred => ({ approve: (signed) => approveRequest(signed, 'Approve this payment') });
const NAMES = (): [string, string][] => rows.map(([name, path]) => [name, path]);

describe('every payment route takes the phone’s approval in place of the PIN', () => {
  it('has a row for each of the 9 payment calls the sheets make', () => {
    expect(rows).toHaveLength(9);
  });

  it.each(Array.from({ length: 9 }, (_, i) => i))('row %i · the Hub accepts the signed request, with the same Idempotency-Key and no PIN', async (i) => {
    const [, path, call] = rows[i];
    const outcome = await call(approve(), KEY);
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({ method: 'POST', path, pin: null, key: KEY });
    expect(seen[0].approval).toMatch(/^v1\.[0-9a-f-]{36}\.[A-Za-z0-9_-]+$/);
    // The Hub's own check passed: the key's signature over the method, the path as sent and the exact body bytes that were sent.
    expect(device.checks).toEqual(['approved']);
    expect(outcome.kind).not.toMatch(/^approval_/);
    expect(seen[0].text).not.toMatch(/pin|approve/i);
  });

  it.each(Array.from({ length: 9 }, (_, i) => i))('row %i · a refused approval is followed by the PIN under the SAME key and body', async (i) => {
    const [, , call] = rows[i];
    if (device.device) device.device.publicKey = makeKeyPair().publicKey;
    const first = await call(approve(), KEY);
    expect(first).toEqual({ kind: 'approval_failed' });
    const second = await call({ pin: '1234' }, KEY);
    expect(second.kind).toBe('pin_incorrect');
    expect(seen).toHaveLength(2);
    expect(device.checks).toEqual(['refused']);
    expect(seen[1]).toMatchObject({ pin: '1234', approval: null, key: KEY });
    expect(seen[1].text).toBe(seen[0].text);
  });

  it.each(Array.from({ length: 9 }, (_, i) => i))('row %i · a prompt the person closes sends nothing, and the PIN then goes under the same key', async (i) => {
    const [, , call] = rows[i];
    phone.prompt = 'cancel';
    expect(await call(approve(), KEY)).toEqual({ kind: 'approval_cancelled' });
    expect(seen).toHaveLength(0);
    const after = await call({ pin: '1234' }, KEY);
    expect(after.kind).toBe('pin_incorrect');
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({ pin: '1234', approval: null, key: KEY });
  });

  it('names the 9 routes once each', () => {
    expect(NAMES().map(([name]) => name)).toEqual([
      'a tip', 'an unlock', 'a paid ask', 'a request pay', 'a ticket', 'a legal fee', 'school fees', 'a points conversion', 'a plan',
    ]);
  });
});
