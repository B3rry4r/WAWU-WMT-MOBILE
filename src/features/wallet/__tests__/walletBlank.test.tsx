/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Component, type ReactNode } from 'react';
import { Dimensions, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { fxFetch, hub, resetFxHub } from '../fx/testing/fxHub';

/*
 * WALLET-BLANK: the owner's Wallet tab went plain grey on an Android phone (a render error with no boundary above it unmounts the app).
 * This drives W1 on the native platform with the owner's shapes (a wallet just opened: one Naira account, balance 0, PIN set, no foreign
 * account opened) and does what he did: touches the pills while the page moves, pulls to refresh, taps while reads are out, lets the reads
 * come back in other orders, and changes what the Hub lists under the strip. Any error React catches is recorded; none may be.
 */
const mockVault = new Map<string, string>();
let mockFocused = true;
const mockPushed: unknown[] = [];
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));
jest.mock('expo-router', () => {
  const React = require('react');
  const router = { push: (path: unknown) => mockPushed.push(path) };
  const listeners = new Set<() => void>();
  (globalThis as { __focusListeners?: Set<() => void> }).__focusListeners = listeners;
  return {
    useRouter: () => router,
    useIsFocused: () =>
      React.useSyncExternalStore(
        (l: () => void) => {
          listeners.add(l);
          return () => listeners.delete(l);
        },
        () => mockFocused,
      ),
  };
});
jest.mock('@/features/open-wallet/copy', () => ({ copyText: jest.fn(async () => true) }));

const OWNER = '00000000-0000-4000-8000-0000000000f1';
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });
const ACCOUNT = { accountNumber: '8100000417', accountName: 'Ada Eze', bankName: 'Mock Bank', bankCode: '006', licenceLine: null, depositInsuranceLine: null, openedAt: '2026-10-30T09:00:00.000Z' };

/** What the Hub is told to do to a read: hold it until released, fail it, or answer after a delay. */
type Fault = { hold?: Promise<void>; status?: number; offline?: boolean };
let faults: Record<string, Fault> = {};
let counts: Record<string, number> = {};

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  counts[path] = (counts[path] ?? 0) + 1;
  const fault = faults[path];
  if (fault?.hold) await fault.hold;
  if (fault?.offline) throw new TypeError('Network request failed');
  if (fault?.status) return json(fault.status, { statusCode: fault.status, message: 'Something went wrong', data: null, reason: { code: 'internal', message: 'Something went wrong' } });
  const fx = await fxFetch(request, path);
  if (fx) return fx;
  if (path === '/money/wallet') {
    return ok({ state: 'open', account: ACCOUNT, limits: null, pin: { isSet: true, changedAt: '2026-10-30T09:01:00.000Z', triesLeft: 5, lockedUntil: null }, bankTransfers: { allowed: true, blockedBy: null }, beneficiaryCount: 0 });
  }
  if (path === '/money/wallet/balance') return ok({ availableKobo: 0, asOf: '2026-10-30T09:00:00.000Z' });
  if (path === '/money/transactions') return ok({ items: [], nextCursor: null });
  if (path === '/me/points') return ok({ balance: 0, cashablePoints: 0, nextExpiry: null, lots: [], lotCount: 0, movements: [] });
  if (path === '/me/tier') return ok({ tier: null, eventPass: null });
  if (path === '/capital/availability') return ok({ available: false, holding: false });
  if (path === '/money/cards') return ok({ enabled: false, cards: [] });
  if (path === '/about') return ok({ bankName: 'Nuvion', licenceLine: null, supportEmail: null });
  throw new Error(`no answer for ${request.method} ${path}`);
}) as typeof fetch;

const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};

/** Records every error React hands to a boundary, which is what a person sees as a grey screen. */
const caught: unknown[] = [];
class Catch extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    caught.push(error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

async function boot() {
  const { WalletScreen } = require('../home/WalletScreen') as typeof import('../home/WalletScreen');
  await rtl.render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <Catch>
        <WalletScreen />
      </Catch>
    </SafeAreaProvider>,
  );
  await rtl.screen.findByTestId('wallet-balance-card');
}
const settle = (ms = 30) =>
  rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
const hold = () => {
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { gate, release };
};
const pulse = () => rtl.act(async () => (globalThis as { __focusListeners?: Set<() => void> }).__focusListeners?.forEach((l) => l()));
const pull = () => rtl.act(async () => void (rtl.screen.getByTestId('wallet-scroll').props.refreshControl.props.onRefresh() as Promise<void>));
const strip = () => rtl.screen.queryByTestId('wallet-tabs-scroll');
const tabNames = () => rtl.screen.queryAllByRole('tab').map((t) => t.props.accessibilityLabel as string);
const press = async (name: string) => {
  const tab = rtl.screen.queryByRole('tab', { name });
  if (tab) await rtl.fireEvent.press(tab);
};
/** The strip is moved sideways the way a finger moves it: its size, its content's size, its offset, and each pill's place. */
const swipeStrip = async (x: number) => {
  const scroller = strip();
  if (!scroller) return;
  await rtl.fireEvent(scroller, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 350, height: 42 } } });
  await rtl.fireEvent(scroller, 'contentSizeChange', 820, 42);
  let at = 0;
  for (const tab of rtl.screen.queryAllByRole('tab')) {
    await rtl.fireEvent(tab, 'layout', { nativeEvent: { layout: { x: at, y: 0, width: 96, height: 38 } } });
    at += 100;
  }
  await rtl.fireEvent.scroll(scroller, { nativeEvent: { contentOffset: { x, y: 0 }, contentSize: { width: 820, height: 42 }, layoutMeasurement: { width: 350, height: 42 } } });
};
const thrown = () => caught.map((e) => (e instanceof Error ? `${e.name}: ${e.message.split('\n')[0]}` : String(e)));

const realOS = Platform.OS;
beforeAll(() => {
  Platform.OS = 'android';
});
afterAll(() => {
  Platform.OS = realOS;
  (require('@/api/query') as typeof import('@/api/query')).queryClient.clear();
});

beforeEach(() => {
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false, gcTime: 0 } });
  Dimensions.set({ window: { width: 390, height: 844, scale: 2, fontScale: 1 } });
  resetFxHub();
  // The owner's wallet: just opened, no foreign account opened yet.
  hub.accounts = [];
  faults = {};
  counts = {};
  caught.length = 0;
  mockFocused = true;
  mockPushed.length = 0;
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
  (require('../fx/opening') as typeof import('../fx/opening')).resetOpening();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(async () => {
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  await settle(10);
  await rtl.cleanup();
  await queryClient.cancelQueries();
  queryClient.clear();
  jest.restoreAllMocks();
});

/**
 * What React Native does to the event a handler is given: the handler runs, then the event goes back to the pool and its `nativeEvent` is
 * nulled (`executeDispatchesAndReleaseTopLevel`, `SyntheticEvent.destructor` in the renderer). A state update made with an updater function
 * that reads the event runs later, at render, when the update could not be run on the spot.
 */
const dispatchPooled = (handler: (event: unknown) => void, nativeEvent: object) => {
  const event: { nativeEvent: object | null } = { nativeEvent };
  handler(event);
  event.nativeEvent = null;
};

describe('W1 on a phone: touching the currency pills while the page moves never takes the screen down (WALLET-BLANK)', () => {
  it('the strip reads its size and its offset when the events arrive, however many arrive before React renders (the cause of the blank)', async () => {
    await boot();
    await settle();
    const scroller = rtl.screen.getByTestId('wallet-tabs-scroll');
    const { onLayout, onScroll, onContentSizeChange } = scroller.props as {
      onLayout: (e: unknown) => void;
      onScroll: (e: unknown) => void;
      onContentSizeChange: (w: number, h: number) => void;
    };
    const scrolled = (x: number) => ({ contentOffset: { x, y: 0 }, contentSize: { width: 820, height: 42 }, layoutMeasurement: { width: 350, height: 42 } });
    // Android hands the strip's content size, its size and the first scroll events to the app in one go, and a finger on the strip sends
    // a scroll event every frame: they all reach React before it renders.
    await rtl.act(async () => {
      onContentSizeChange(820, 42);
      dispatchPooled(onLayout, { layout: { x: 0, y: 0, width: 350, height: 42 } });
      dispatchPooled(onScroll, scrolled(12));
      dispatchPooled(onScroll, scrolled(31));
      dispatchPooled(onScroll, scrolled(64));
    });
    await settle();
    expect(thrown()).toEqual([]);
    expect(rtl.screen.getByTestId('wallet-screen')).toBeTruthy();
    // And the strip still knows where it is: a fade stands over the edge that has more past it.
    expect(rtl.screen.queryByTestId('wallet-tabs-fade-left')).toBeTruthy();
  });

  it('draws, and a finger on the pill strip (size, content, offsets) throws nothing', async () => {
    await boot();
    await settle();
    await swipeStrip(0);
    await swipeStrip(140);
    await swipeStrip(0);
    expect(thrown()).toEqual([]);
    expect(rtl.screen.getByTestId('wallet-screen')).toBeTruthy();
  });

  it('pulling to refresh and touching each pill while the reads are out throws nothing, in whatever order they come back', async () => {
    await boot();
    await settle();
    const accounts = hold();
    const currencies = hold();
    const balance = hold();
    faults['/money/fx/accounts'] = { hold: accounts.gate };
    faults['/money/fx/currencies'] = { hold: currencies.gate };
    faults['/money/wallet/balance'] = { hold: balance.gate };
    await pull();
    for (const name of tabNames()) {
      await swipeStrip(60);
      await press(name);
    }
    await press('Naira');
    await rtl.act(async () => balance.release());
    await rtl.act(async () => currencies.release());
    for (const name of tabNames()) await press(name);
    await rtl.act(async () => accounts.release());
    await settle();
    expect(thrown()).toEqual([]);
    expect(rtl.screen.getByTestId('wallet-screen')).toBeTruthy();
  });

  it('a tab in front that the Hub stops listing (a currency switched off, an account gone) falls back to Naira and throws nothing', async () => {
    hub.accounts = [];
    await boot();
    await settle();
    await press('Dollar');
    await settle();
    hub.currencies = { ...hub.currencies, currencies: hub.currencies.currencies.map((c) => (c.code === 'USD' ? { ...c, enabled: false } : c)) };
    hub.accounts = [];
    const gate = hold();
    faults['/money/fx/accounts'] = { hold: gate.gate };
    await pull();
    await press('Dollar');
    await rtl.act(async () => gate.release());
    await settle();
    await pull();
    await settle();
    expect(thrown()).toEqual([]);
    expect(rtl.screen.getByTestId('wallet-balance-card')).toBeTruthy();
  });

  it('reads that fail or come back empty while a pill is in front throw nothing', async () => {
    await boot();
    await settle();
    await press('Euro');
    await settle();
    for (const status of [500, 401, 503]) {
      faults['/money/fx/accounts'] = { status };
      faults['/money/fx/currencies'] = { status };
      faults['/money/wallet'] = { status };
      faults['/money/wallet/balance'] = { status };
      await pull();
      await settle();
      await press('Dollar');
      await press('Crypto');
      await press('Naira');
    }
    faults = { '/money/fx/accounts': { offline: true }, '/money/wallet': { offline: true } };
    await pull();
    await settle();
    faults = {};
    await pull();
    await settle();
    expect(thrown()).toEqual([]);
  });

  it('leaving the tab and coming back while a pill is in front and a read is out throws nothing', async () => {
    await boot();
    await settle();
    await press('Pound');
    const gate = hold();
    faults['/money/fx/accounts'] = { hold: gate.gate };
    mockFocused = false;
    await pulse();
    mockFocused = true;
    await pulse();
    await press('Cedi');
    await rtl.act(async () => gate.release());
    await settle();
    expect(thrown()).toEqual([]);
  });

  it('opening a currency from + Add while the strip moves and a refresh is out throws nothing, and the pill goes from opening to opened', async () => {
    await boot();
    await settle();
    await swipeStrip(80);
    const add = rtl.screen.queryByTestId('wallet-tab-add');
    expect(add).toBeTruthy();
    await rtl.fireEvent.press(add as never);
    const picked = await rtl.screen.findByTestId('add-currency-GBP');
    const gate = hold();
    faults['/money/fx/accounts'] = { hold: gate.gate };
    await rtl.fireEvent.press(picked);
    await pull();
    await swipeStrip(0);
    await rtl.act(async () => gate.release());
    await settle(80);
    await press('Naira');
    await press('Pound');
    await settle();
    expect(thrown()).toEqual([]);
  });
});
