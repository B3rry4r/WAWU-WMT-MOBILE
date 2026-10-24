/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { createPublicKey } from 'node:crypto';
import { Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { deviceRoutes, newDeviceHub, ok, type DeviceHub } from '@/features/device-approval/testing/deviceHub';
import { phone, vault } from '@/features/device-approval/testing/secureStore';

/*
 * W35's "Fingerprint for payments" switch (FIX-108; R-26; SHARED-CHANGES WALLET-06 #1) on the real screen, with the Hub as a stand-in
 * `fetch` that checks the public key and the approval the way the Hub does (`testing/deviceHub.ts`), the secure store as a vault and
 * the phone's biometric as something the test sets. No device was available: the Keystore and the Keychain are NOT RUN here.
 */
jest.mock('expo-secure-store', () => require('@/features/device-approval/testing/secureStore').secureStoreMock);
jest.mock('expo-crypto', () => require('@/features/device-approval/testing/expoCrypto'));
const mockLocalAuth = { hardware: true, enrolled: true, types: [1] as number[] };
jest.mock('expo-local-authentication', () => ({
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
  hasHardwareAsync: async () => mockLocalAuth.hardware,
  isEnrolledAsync: async () => mockLocalAuth.enrolled,
  supportedAuthenticationTypesAsync: async () => mockLocalAuth.types,
}));
jest.mock('expo-router', () => ({
  ...jest.requireActual<typeof import('expo-router')>('expo-router'),
  router: { push: jest.fn() },
}));

const OWNER = '00000000-0000-4000-8000-0000000000a6';
const ACCOUNT = { accountNumber: '8100000417', accountName: 'Ada Eze', bankName: 'Ekiti Trial MFB', bankCode: '090620', licenceLine: null, depositInsuranceLine: null, openedAt: '2026-10-04T09:00:00.000Z' };
const wallet = () =>
  ok({ state: 'open', account: ACCOUNT, limits: null, pin: { isSet: true, changedAt: '2026-07-01T00:00:00.000Z', triesLeft: 5, lockedUntil: null }, bankTransfers: { allowed: true, blockedBy: null }, beneficiaryCount: 0 });

let hub: DeviceHub;
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  if (path === '/money/wallet' && request.method === 'GET') return wallet();
  const answer = await deviceRoutes(hub, request);
  if (answer) return answer;
  throw new Error(`no answer for ${request.method} ${path}`);
}) as typeof fetch;

const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};

async function boot() {
  const { WalletSettingsScreen } = require('../settings/WalletSettingsScreen') as typeof import('../settings/WalletSettingsScreen');
  const props = { onBack: jest.fn(), onOpenPin: jest.fn(), onCreatePin: jest.fn(), onOpenWallet: jest.fn() };
  await rtl.render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <WalletSettingsScreen {...props} />
    </SafeAreaProvider>,
  );
  return props;
}

/** This phone already has the key and the Hub already lists it: what a person who turned the switch on earlier has. */
function seedRegistered(biometric: 'fingerprint' | 'face' = 'fingerprint') {
  const { makeKeyPair } = require('@/features/device-approval/crypto') as typeof import('@/features/device-approval/crypto');
  const pair = makeKeyPair();
  const deviceId = '7c1d0e2f-3a4b-4c5d-8e6f-7a8b9c0d1e2f';
  hub.device = { deviceId, publicKey: pair.publicKey, biometric };
  vault.set('wawu.approval.key', pair.secretKeyHex);
  vault.set('wawu.approval.device', JSON.stringify({ owner: OWNER, deviceId, biometric }));
}

const row = () => rtl.screen.findByTestId('wallet-settings-biometric');
const tap = async (digits: string) => {
  for (const d of digits) await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: d }));
};

beforeEach(() => {
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false, gcTime: 0 } });
  Dimensions.set({ window: { width: 390, height: 844, scale: 2, fontScale: 1 } });
  hub = newDeviceHub('1234');
  Object.assign(phone, { prompt: 'ok', biometric: true, prompts: [], writes: [] });
  Object.assign(mockLocalAuth, { hardware: true, enrolled: true, types: [1] });
  vault.clear();
  vault.set('wawu.session.access', tokenFor(OWNER));
  vault.set('wawu.session.refresh', 'refresh-1');
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
});

describe('W35 · fingerprint or face for payments', () => {
  it('a user with a fingerprint reader sees the row off; turning it on asks the PIN with no amount, registers the phone’s key and shows it on', async () => {
    await boot();
    expect(await rtl.screen.findByLabelText('Fingerprint for payments, off')).toBeTruthy();
    await rtl.fireEvent.press(await row());

    // The PIN sheet says what the PIN is for, with no amount.
    expect(await rtl.screen.findByText('Turn on fingerprint for payments')).toBeTruthy();
    expect(rtl.screen.queryByText(/₦/)).toBeNull();
    await tap('1234');

    expect(await rtl.screen.findByLabelText('Fingerprint for payments, on')).toBeTruthy();
    // The Hub got the public half of a P-256 key, the kind, and the PIN in its header; the key was kept behind the biometric, not the PIN.
    expect(hub.puts).toHaveLength(1);
    expect(hub.puts[0].pin).toBe('1234');
    expect(hub.puts[0].body.biometric).toBe('fingerprint');
    const key = createPublicKey({ key: Buffer.from(hub.puts[0].body.publicKey ?? '', 'base64url'), format: 'der', type: 'spki' });
    expect(key.asymmetricKeyDetails?.namedCurve).toBe('prime256v1');
    expect(phone.writes).toEqual(['wawu.approval.key']);
    expect(vault.get('wawu.approval.key')).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.parse(vault.get('wawu.approval.device') ?? '{}')).toEqual({ owner: OWNER, deviceId: hub.device?.deviceId, biometric: 'fingerprint' });
    // It was checked once with a real approval that moves no money, and the fingerprint prompt was asked for it.
    expect(hub.verifies).toBe(1);
    expect(hub.checks).toEqual(['approved']);
    expect(phone.prompts).toHaveLength(1);
    expect(JSON.stringify(vault.get('wawu.approval.device'))).not.toContain('1234');
  });

  it('a wrong PIN says so, keeps no key and leaves the Hub with no phone', async () => {
    hub.pin = '9999';
    await boot();
    await rtl.fireEvent.press(await row());
    await rtl.screen.findByText('Turn on fingerprint for payments');
    await tap('1234');
    expect(await rtl.screen.findByText('Wrong PIN. 4 tries left.')).toBeTruthy();
    expect(hub.device).toBeNull();
    expect(vault.has('wawu.approval.key')).toBe(false);
    expect(vault.has('wawu.approval.device')).toBe(false);
    expect(hub.verifies).toBe(0);
    expect(rtl.screen.getByLabelText('Fingerprint for payments, off')).toBeTruthy();
  });

  it('a confirmation the person closes turns it off again at the Hub and keeps nothing on the phone', async () => {
    phone.prompt = 'cancel';
    await boot();
    await rtl.fireEvent.press(await row());
    await rtl.screen.findByText('Turn on fingerprint for payments');
    await tap('1234');
    expect(await rtl.screen.findByText("We couldn't turn it on. Try again.")).toBeTruthy();
    await rtl.waitFor(() => expect(hub.deletes).toBe(1));
    expect(hub.device).toBeNull();
    expect(vault.has('wawu.approval.key')).toBe(false);
    expect(vault.has('wawu.approval.device')).toBe(false);
  });

  it('a user turns it off: the Hub is told first, then the key is dropped, and the row shows off', async () => {
    seedRegistered();
    await boot();
    const on = await rtl.screen.findByLabelText('Fingerprint for payments, on');
    await rtl.fireEvent.press(on);
    expect(await rtl.screen.findByLabelText('Fingerprint for payments, off')).toBeTruthy();
    expect(hub.deletes).toBe(1);
    expect(hub.device).toBeNull();
    expect(vault.has('wawu.approval.key')).toBe(false);
    expect(vault.has('wawu.approval.device')).toBe(false);
  });

  it('a PIN reset turned it off at the Hub: the row shows off and the useless key is dropped from the phone', async () => {
    seedRegistered();
    hub.device = null;
    await boot();
    expect(await rtl.screen.findByLabelText('Fingerprint for payments, off')).toBeTruthy();
    expect(vault.has('wawu.approval.key')).toBe(false);
    expect(vault.has('wawu.approval.device')).toBe(false);
  });

  it('a phone with face recognition only names it so (Face ID on iOS), and draws no row where the phone has no biometric (R-47)', async () => {
    Object.assign(mockLocalAuth, { types: [2] });
    await boot();
    expect(await rtl.screen.findByLabelText('Face ID for payments, off')).toBeTruthy();
    await rtl.cleanup();

    Object.assign(mockLocalAuth, { enrolled: false });
    await boot();
    await rtl.screen.findByTestId('wallet-settings-pin');
    expect(rtl.screen.queryByTestId('wallet-settings-biometric')).toBeNull();
    await rtl.cleanup();

    Object.assign(mockLocalAuth, { enrolled: true });
    phone.biometric = false;
    await boot();
    await rtl.screen.findByTestId('wallet-settings-pin');
    expect(rtl.screen.queryByTestId('wallet-settings-biometric')).toBeNull();
  });
});
