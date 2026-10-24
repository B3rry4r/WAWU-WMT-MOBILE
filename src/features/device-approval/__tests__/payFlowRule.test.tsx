/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactNode } from 'react';

import type { Credential } from '@/features/device-approval';
import type { Engine, PaymentViewLike, QuoteLike, usePaymentFlow as UsePaymentFlow } from '@/features/feedpay/usePaymentFlow';
import { deviceRoutes, newDeviceHub, type DeviceHub } from '@/features/device-approval/testing/deviceHub';
import { phone, vault } from '@/features/device-approval/testing/secureStore';

/*
 * FIX-112, THE RULE (FIX-108 verifier, high finding), on the flow that tips, unlocks and paid asks share, and on the sheet every
 * payment shares: a closed or refused fingerprint step never rotates the Idempotency-Key and never drops what an earlier try left;
 * only a Hub answer that says nothing moved may. The PIN that follows a lost answer, a closed prompt and a refused approval is the
 * SAME request: the same key, the same quote.
 */
jest.mock('expo-secure-store', () => require('@/features/device-approval/testing/secureStore').secureStoreMock);
jest.mock('expo-crypto', () => require('@/features/device-approval/testing/expoCrypto'));
jest.mock('expo-local-authentication', () => ({
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
  hasHardwareAsync: jest.fn(async () => true),
  isEnrolledAsync: jest.fn(async () => true),
  supportedAuthenticationTypesAsync: jest.fn(async () => [1]),
}));

const OWNER = '00000000-0000-4000-8000-0000000000f2';
let device: DeviceHub;
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const answer = await deviceRoutes(device, request);
  return answer ?? new Response('{}', { status: 404 });
}) as typeof fetch;

const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};
const handlers = { onOpenWallet: jest.fn(), onSetPin: jest.fn(), onForgotPin: jest.fn(), onAddMoney: jest.fn() };
const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrap = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;

// Loaded after the Hub's `fetch` is in place (the API client takes `fetch` when it is first loaded).
const usePaymentFlow = ((...args: Parameters<typeof UsePaymentFlow>) => (require('@/features/feedpay/usePaymentFlow') as typeof import('@/features/feedpay/usePaymentFlow')).usePaymentFlow(...args)) as typeof UsePaymentFlow;

type Step = { kind: 'unanswered' } | { kind: 'approval_cancelled' } | { kind: 'approval_failed' } | { kind: 'pin_incorrect'; triesLeft: number };
type Quote = QuoteLike & { token: string };

function setup(script: Step[]) {
  const asked: number[] = [];
  const sends: { key: string; token: string; how: 'pin' | 'approval' }[] = [];
  const engine: Engine<Quote, PaymentViewLike> = {
    scope: 'tip:ada:2000',
    ask: async () => {
      asked.push(asked.length);
      return { token: `quote-${asked.length}`, payment: { totalKobo: 202_500 } } as never;
    },
    send: async (quote, key, credential) => {
      sends.push({ key, token: quote.token, how: credential.pin !== undefined ? 'pin' : 'approval' });
      return (script.shift() ?? { kind: 'unanswered' }) as never;
    },
    read: async () => {
      throw new Error('not read');
    },
    readKey: (id) => ['tip', id],
    shortLine: 'short',
  };
  return { engine, asked, sends };
}

async function open(engine: Engine<Quote, PaymentViewLike>) {
  let flow: ReturnType<typeof usePaymentFlow<Quote, PaymentViewLike>> | null = null;
  function Probe() {
    flow = usePaymentFlow(engine, handlers);
    return null;
  }
  await rtl.render(<Probe />, { wrapper: wrap });
  await rtl.act(async () => {
    await flow!.open();
  });
  await rtl.act(async () => {
    await flow!.pay();
  });
  return {
    run: async (credential: Credential) => {
      let result: unknown;
      await rtl.act(async () => {
        result = await flow!.run(credential);
      });
      return result;
    },
  };
}
const approval: Credential = { approve: async () => ({ kind: 'cancelled' }) };
const pin: Credential = { pin: '1234' };

afterEach(() => rtl.cleanup());
afterAll(() => client.clear());

describe('tips, unlocks and paid asks (the shared payment flow)', () => {
  it('a lost PIN answer, then a closed fingerprint prompt, then the PIN: the same key and the same quote all three times', async () => {
    const { engine, sends, asked } = setup([{ kind: 'unanswered' }, { kind: 'approval_cancelled' }, { kind: 'unanswered' }]);
    const flow = await open(engine);
    expect(await flow.run(pin)).toEqual({ code: 'unanswered' });
    expect(await flow.run(approval)).toEqual({ code: 'cancelled' });
    expect(await flow.run(pin)).toEqual({ code: 'unanswered' });
    expect(sends.map((s) => s.how)).toEqual(['pin', 'approval', 'pin']);
    expect(new Set(sends.map((s) => s.key)).size).toBe(1);
    // One quote, asked for at Pay, and no new one after the lost answer or the closed prompt.
    expect(new Set(sends.map((s) => s.token)).size).toBe(1);
    expect(asked).toHaveLength(2);
  });

  it('a lost PIN answer, then a refused fingerprint, then the PIN: still the same key', async () => {
    const { engine, sends } = setup([{ kind: 'unanswered' }, { kind: 'approval_failed' }, { kind: 'unanswered' }]);
    const flow = await open(engine);
    await flow.run(pin);
    expect(await flow.run(approval)).toEqual({ code: 'failed' });
    await flow.run(pin);
    expect(new Set(sends.map((s) => s.key)).size).toBe(1);
  });

  it('a first try that is closed or refused keeps its key too: the PIN that follows is the same request', async () => {
    const { engine, sends } = setup([{ kind: 'approval_cancelled' }, { kind: 'approval_failed' }, { kind: 'pin_incorrect', triesLeft: 3 }]);
    const flow = await open(engine);
    expect(await flow.run(approval)).toEqual({ code: 'cancelled' });
    expect(await flow.run(approval)).toEqual({ code: 'failed' });
    expect(await flow.run(pin)).toEqual({ code: 'pin_incorrect', triesLeft: 3 });
    expect(new Set(sends.map((s) => s.key)).size).toBe(1);
  });
});

describe('PayPinSheet · the sheet every payment shares', () => {
  const { PayPinSheet } = require('@/features/device-approval') as typeof import('@/features/device-approval');
  const { approvalLine } = require('@/components/pin-sheet/format') as typeof import('@/components/pin-sheet/format');
  let session: typeof import('@/api/session');

  beforeEach(() => {
    device = newDeviceHub('1234');
    Object.assign(phone, { prompt: 'ok', biometric: true, prompts: [], writes: [] });
    vault.clear();
    vault.set('wawu.session.access', tokenFor(OWNER));
    vault.set('wawu.session.refresh', 'refresh-1');
    session = require('@/api/session') as typeof import('@/api/session');
    session.resetSessionForTests();
  });

  function seedKey() {
    const { makeKeyPair } = require('@/features/device-approval/crypto') as typeof import('@/features/device-approval/crypto');
    const pair = makeKeyPair();
    const deviceId = '7c1d0e2f-3a4b-4c5d-8e6f-7a8b9c0d1e2f';
    device.device = { deviceId, publicKey: pair.publicKey, biometric: 'fingerprint' };
    vault.set('wawu.approval.key', pair.secretKeyHex);
    vault.set('wawu.approval.device', JSON.stringify({ owner: OWNER, deviceId, biometric: 'fingerprint' }));
  }
  const sheet = (run: jest.Mock) =>
    rtl.render(<PayPinSheet visible onClose={jest.fn()} approval={{ totalKobo: 202_500, payee: 'Ada' }} run={run} />, { wrapper: wrap });
  const press = async (name: string) => {
    await rtl.act(async () => {
      rtl.fireEvent.press(rtl.screen.getByRole('button', { name }));
    });
  };

  it('draws the fingerprint key only where this account has turned it on, and the PIN keypad sends the PIN as a credential', async () => {
    const run = jest.fn(async () => ({ code: 'approved' as const }));
    await sheet(run);
    await rtl.act(async () => undefined);
    expect(rtl.screen.queryByRole('button', { name: 'Use fingerprint' })).toBeNull();
    for (const d of '1234') await press(d);
    await rtl.waitFor(() => expect(run).toHaveBeenCalledWith({ pin: '1234' }));
  });

  it('a tap on the key hands the screen an approval credential; the prompt reads the sheet’s own line; a refusal says "Use your PIN"', async () => {
    seedKey();
    const run = jest.fn(async (credential: Credential) => {
      if (credential.approve) {
        await credential.approve({ method: 'POST', path: '/api/hub/tips/wallet', body: { a: 1 } });
        return { code: 'failed' as const };
      }
      return { code: 'approved' as const };
    });
    await sheet(run);
    await press('Use fingerprint');
    expect(await rtl.screen.findByText('Fingerprint failed. Use your PIN.')).toBeTruthy();
    expect(phone.prompts).toEqual([approvalLine({ totalKobo: 202_500, payee: 'Ada' })]);
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0][0].pin).toBeUndefined();
  });

  it('a prompt the person closes says nothing and the keypad stays', async () => {
    seedKey();
    phone.prompt = 'cancel';
    const run = jest.fn(async (credential: Credential) => {
      const attempt = await credential.approve?.({ method: 'POST', path: '/api/hub/tips/wallet' });
      return attempt && (attempt as { kind: string }).kind === 'cancelled' ? { code: 'cancelled' as const } : { code: 'approved' as const };
    });
    await sheet(run);
    await press('Use fingerprint');
    await rtl.waitFor(() => expect(run).toHaveBeenCalledTimes(1));
    expect(rtl.screen.queryByText(/failed/)).toBeNull();
    expect(rtl.screen.getByRole('button', { name: '1' })).toBeTruthy();
  });
});
