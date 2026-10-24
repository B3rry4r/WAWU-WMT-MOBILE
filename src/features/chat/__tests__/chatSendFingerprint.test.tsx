/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { View } from 'react-native';

import { checkApproval, deviceRoutes, newDeviceHub, refuse, type DeviceHub } from '@/features/device-approval/testing/deviceHub';
import { phone, vault } from '@/features/device-approval/testing/secureStore';

import { clearClients, CHAT, enterPin, hub, OTHER, renderWith, resetHub } from '../testing/hubDouble';

/*
 * Send money in a chat with the phone's fingerprint or face (FIX-108; I14 and the PIN sheet's key): the real chat send screen and PIN
 * sheet, the Hub as the chat's stand-in `fetch` with the device routes and the approval check beside it, and the phone's key in a vault.
 * A closed or refused fingerprint proves nothing about an earlier try under the same Idempotency-Key (a PIN whose answer was lost, and
 * the Hub took the payment): the key and the stored intent stay, so the PIN that follows is the SAME payment and the money moves once.
 */
jest.mock('expo-secure-store', () => require('@/features/device-approval/testing/secureStore').secureStoreMock);
jest.mock('expo-crypto', () => require('@/features/device-approval/testing/expoCrypto'));
jest.mock('@/features/open-wallet/sessionAccount', () => ({ ...jest.requireActual('@/features/open-wallet/sessionAccount'), useSessionAccount: () => 'owner-1' }));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useIsFocused: () => true, useRouter: () => ({ push: mockPush, dismissTo: jest.fn(), back: jest.fn(), canGoBack: () => true }) }));
jest.mock('@/features/inbox/live', () => ({ onLiveEvent: () => () => undefined, onLiveSynced: () => () => undefined, retainLive: () => () => undefined }));
jest.mock('@/features/inbox/unread', () => ({ refreshInbox: jest.fn(async () => undefined) }));

let device: DeviceHub;
/** Every send that carried an approval and not a PIN, as the stand-in saw it. */
const approvals: { key: string | null; verdict: 'approved' | 'refused' }[] = [];

const innerFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  if (path === '/money/transfers/wawu' && request.method === 'POST' && request.headers.get('x-device-approval') !== null) {
    const verdict = await checkApproval(device, request);
    approvals.push({ key: request.headers.get('idempotency-key'), verdict });
    if (verdict === 'refused') return refuse(403, { code: 'device_approval_refused', message: 'Your fingerprint or face could not approve this. Use your PIN.' });
  }
  const answer = await deviceRoutes(device, request);
  if (answer) return answer;
  return innerFetch(input as never, init);
}) as typeof fetch;

const { ChatSendScreen } = require('../ChatSendScreen') as typeof import('../ChatSendScreen');
const { forgetChatSendsInMemory } = require('../sends') as typeof import('../sends');
const { forgetAttempts } = require('@/features/money-attempt/attempts') as typeof import('@/features/money-attempt/attempts');
const { forgetIntentsInMemory, findIntent } = require('@/features/send/intent') as typeof import('@/features/send/intent');
const session = require('@/api/session') as typeof import('@/api/session');
void View;

const OWNER = 'owner-1';
const AMOUNT_KOBO = 2_500_000;
const LOST_LINE = "We didn't get an answer. Try again: it will only happen once.";

rtl.configure({ asyncUtilTimeout: 5000 });
beforeAll(async () => {
  const warm = await rtl.render(<View />);
  warm.unmount();
});
const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};
beforeEach(() => {
  resetHub();
  device = newDeviceHub('4829');
  approvals.length = 0;
  Object.assign(phone, { prompt: 'ok', biometric: true, prompts: [], writes: [] });
  vault.clear();
  vault.set('wawu.session.access', tokenFor(OWNER));
  vault.set('wawu.session.refresh', 'refresh-1');
  session.resetSessionForTests();
  mockPush.mockClear();
  forgetAttempts();
  forgetIntentsInMemory();
  forgetChatSendsInMemory();
});
afterEach(() => clearClients());

/** This phone already has the key and the Hub already lists it: a person who turned the switch on in Wallet settings. */
function seedRegistered(listedKeyIsAnotherPhones = false) {
  const { makeKeyPair } = require('@/features/device-approval/crypto') as typeof import('@/features/device-approval/crypto');
  const pair = makeKeyPair();
  const deviceId = '7c1d0e2f-3a4b-4c5d-8e6f-7a8b9c0d1e2f';
  device.device = { deviceId, publicKey: listedKeyIsAnotherPhones ? makeKeyPair().publicKey : pair.publicKey, biometric: 'fingerprint' };
  vault.set('wawu.approval.key', pair.secretKeyHex);
  vault.set('wawu.approval.device', JSON.stringify({ owner: OWNER, deviceId, biometric: 'fingerprint' }));
}

const payee = { wawuUserId: OTHER, name: 'Femi Bankole', handle: 'femib', avatarUrl: null, tick: null } as const;
const handlers = () => ({ onBack: jest.fn(), onDone: jest.fn(), onSetPin: jest.fn(), onForgotPin: jest.fn(), onAddMoney: jest.fn() });

async function reachPin() {
  const h = handlers();
  await renderWith(<ChatSendScreen chatId={CHAT} payee={payee} {...h} />);
  await rtl.screen.findByTestId('send-balance');
  for (const d of '25000') await rtl.fireEvent.press(rtl.screen.getByTestId(`amount-key-${d}`));
  await rtl.screen.findByTestId('chat-send-total');
  await rtl.fireEvent.press(rtl.screen.getByTestId('chat-send'));
  await rtl.screen.findByText(/^Approve /);
  return h;
}
const useFingerprint = async () => rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Use fingerprint' }));

describe('Send in a chat with a fingerprint (FIX-108)', () => {
  it('a fingerprint approves the send: the signed approval of exactly that request and no PIN, once, and the chat is told', async () => {
    seedRegistered();
    const h = await reachPin();
    await useFingerprint();
    await rtl.waitFor(() => expect(h.onDone).toHaveBeenCalledTimes(1));
    expect(approvals.map((a) => a.verdict)).toEqual(['approved']);
    expect(hub.pays).toHaveLength(1);
    expect(hub.pays[0]).toMatchObject({ pin: null, key: approvals[0].key });
    expect(hub.pays[0].body).toMatchObject({ amountKobo: AMOUNT_KOBO, recipientWawuUserId: OTHER });
    expect(hub.payments).toBe(1);
  });

  it('a PIN whose answer was lost, then a fingerprint the person closes, then the PIN: the SAME key, the stored intent kept, one payment', async () => {
    seedRegistered();
    hub.mode = 'lost_after';
    const h = await reachPin();
    await enterPin('4829');
    expect(await rtl.screen.findByText(LOST_LINE)).toBeTruthy();
    expect(hub.payments).toBe(1);
    const firstKey = hub.pays[0].key;

    phone.prompt = 'cancel';
    await useFingerprint();
    await rtl.waitFor(() => expect(phone.prompts).toHaveLength(1));
    // Nothing left the phone, nothing was said, and the earlier try is still remembered under its own key.
    expect(approvals).toHaveLength(0);
    expect(hub.pays).toHaveLength(1);
    expect(rtl.screen.queryByText(/ingerprint failed/)).toBeNull();
    expect(await findIntent(OWNER, OTHER, AMOUNT_KOBO)).toMatchObject({ key: firstKey, phase: 'unknown' });

    await enterPin('4829');
    await rtl.waitFor(() => expect(h.onDone).toHaveBeenCalledTimes(1));
    expect(hub.pays.map((p) => p.key)).toEqual([firstKey, firstKey]);
    expect(hub.payments).toBe(1);
  });

  it('a PIN whose answer was lost, then a fingerprint the Hub refuses, then the PIN: the SAME key, the stored intent kept, one payment', async () => {
    seedRegistered(true);
    hub.mode = 'lost_after';
    const h = await reachPin();
    await enterPin('4829');
    expect(await rtl.screen.findByText(LOST_LINE)).toBeTruthy();
    const firstKey = hub.pays[0].key;

    await useFingerprint();
    expect(await rtl.screen.findByText('Fingerprint failed. Use your PIN.')).toBeTruthy();
    expect(approvals).toEqual([{ key: firstKey, verdict: 'refused' }]);
    expect(await findIntent(OWNER, OTHER, AMOUNT_KOBO)).toMatchObject({ key: firstKey, phase: 'unknown' });

    await enterPin('4829');
    await rtl.waitFor(() => expect(h.onDone).toHaveBeenCalledTimes(1));
    expect(hub.pays.map((p) => p.key)).toEqual([firstKey, firstKey]);
    expect(hub.payments).toBe(1);
  });

  it('a PIN whose answer was lost, then a fingerprint that approves: the SAME key, the Hub answers with the first payment, one payment', async () => {
    seedRegistered();
    hub.mode = 'lost_after';
    const h = await reachPin();
    await enterPin('4829');
    expect(await rtl.screen.findByText(LOST_LINE)).toBeTruthy();
    const firstKey = hub.pays[0].key;

    await useFingerprint();
    await rtl.waitFor(() => expect(h.onDone).toHaveBeenCalledTimes(1));
    expect(approvals).toEqual([{ key: firstKey, verdict: 'approved' }]);
    expect(hub.pays.map((p) => p.key)).toEqual([firstKey, firstKey]);
    expect(hub.payments).toBe(1);
  });

  it('a first try with a fingerprint the Hub refuses says so, uses no PIN try, and the PIN then sends under the SAME key, once', async () => {
    seedRegistered(true);
    const h = await reachPin();
    await useFingerprint();
    expect(await rtl.screen.findByText('Fingerprint failed. Use your PIN.')).toBeTruthy();
    expect(rtl.screen.queryByText(/Wrong PIN/)).toBeNull();
    expect(approvals).toHaveLength(1);
    expect(hub.pays).toHaveLength(0);
    // Nothing exists under that key, so the record the try wrote is let go; the key itself is not rotated.
    expect(await findIntent(OWNER, OTHER, AMOUNT_KOBO)).toBeNull();

    await enterPin('4829');
    await rtl.waitFor(() => expect(h.onDone).toHaveBeenCalledTimes(1));
    expect(hub.pays).toHaveLength(1);
    expect(hub.pays[0]).toMatchObject({ pin: '4829', key: approvals[0].key });
    expect(hub.payments).toBe(1);
  });

  it('a first try with a fingerprint prompt the person closes sends nothing and says nothing; the PIN then sends once', async () => {
    seedRegistered();
    phone.prompt = 'cancel';
    const h = await reachPin();
    await useFingerprint();
    await rtl.waitFor(() => expect(phone.prompts).toHaveLength(1));
    expect(hub.pays).toHaveLength(0);
    expect(rtl.screen.queryByText(/ingerprint failed/)).toBeNull();
    expect(await findIntent(OWNER, OTHER, AMOUNT_KOBO)).toBeNull();

    await enterPin('4829');
    await rtl.waitFor(() => expect(h.onDone).toHaveBeenCalledTimes(1));
    expect(hub.pays).toHaveLength(1);
    expect(hub.pays[0].pin).toBe('4829');
    expect(hub.payments).toBe(1);
  });
});
