/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const mockVault = new Map<string, string>();
const mockStored: string[] = [];
const mockCopied: string[] = [];
let mockCopyWorks = true;

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStored.push(`${key}=${value}`);
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));
// A8 stays mounted under A9 and A10; the navigator says whether it is the screen in front. A test moves that by hand.
let mockFocused = true;
const mockFocusListeners = new Set<() => void>();
const setFocused = (value: boolean) => {
  mockFocused = value;
  mockFocusListeners.forEach((listener) => listener());
};
jest.mock('expo-router', () => {
  const { useSyncExternalStore } = jest.requireActual('react') as typeof import('react');
  return {
    useIsFocused: () =>
      useSyncExternalStore(
        (listener: () => void) => {
          mockFocusListeners.add(listener);
          return () => mockFocusListeners.delete(listener);
        },
        () => mockFocused,
      ),
  };
});
jest.mock('../copy', () => ({
  copyText: jest.fn(async (value: string) => {
    if (!mockCopyWorks) return false;
    mockCopied.push(value);
    return true;
  }),
}));

type Reply = { status: number; body: unknown };
type Answer = Reply | 'offline' | 'hold' | { gate: Promise<void>; then: Reply };

const OWNER = '00000000-0000-4000-8000-0000000000e1';
/** Made-up account details, in the shape the server answers (MONEY-12). Never a real account. */
const ACCOUNT = { accountNumber: '8123456789', accountName: 'Ada Eze', bankName: 'Loma Bank', bankCode: '090620', licenceLine: null, depositInsuranceLine: null, openedAt: '2026-10-04T09:00:00.000Z' };
const LONG_BANK = 'Iyin Ekiti Microfinance Bank Limited (Loma Bank)';
const pinState = (isSet: boolean) => ({ isSet, changedAt: isSet ? '2026-10-04T09:01:00.000Z' : null, triesLeft: 5, lockedUntil: null });

let sent: { method: string; path: string }[] = [];
let routes: Record<string, Answer[]> = {};
let fallback: Record<string, Answer> = {};

const ok = (data: unknown): Reply => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const view = (over: Record<string, unknown> = {}) =>
  ok({ state: 'open', account: ACCOUNT, limits: null, pin: pinState(false), bankTransfers: { allowed: true, blockedBy: null }, beneficiaryCount: 0, ...over });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname;
  sent.push({ method: request.method, path });
  const key = `${request.method} ${path.replace(/^\/api\/hub/, '')}`;
  let answer = routes[key]?.shift() ?? fallback[key];
  if (!answer) throw new Error(`no answer for ${key}`);
  if (typeof answer === 'object' && 'gate' in answer) {
    await answer.gate;
    answer = answer.then;
  }
  if (answer === 'offline') throw new TypeError('Network request failed');
  if (answer === 'hold') return new Promise<Response>(() => undefined);
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

function tokenFor(sub: string) {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
}

const clients: QueryClient[] = [];

async function boot() {
  const { WalletOpenScreen } = require('../WalletOpenScreen') as typeof import('../WalletOpenScreen');
  const props = { onCreatePin: jest.fn(), onDone: jest.fn(), onNoWallet: jest.fn() };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  await rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <WalletOpenScreen {...props} />
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
  return { ...rtl, ...props };
}

const allText = (app: Awaited<ReturnType<typeof boot>>) => JSON.stringify(app.screen.toJSON());

beforeEach(() => {
  mockFocused = true;
  sent = [];
  routes = {};
  mockStored.length = 0;
  mockCopied.length = 0;
  mockCopyWorks = true;
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  fallback = { 'GET /money/wallet': view() };
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
});

afterEach(async () => {
  jest.useRealTimers();
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  await rtl.cleanup();
  clients.splice(0).forEach((client) => client.clear());
});

describe('A8 · Wallet open', () => {
  it('a user sees the account the server opened: the bank name from the API, the account name and number, no tier and no limits link', async () => {
    const app = await boot();
    expect(await app.screen.findByTestId('open-wallet-account')).toBeTruthy();
    expect(app.screen.getByText('Your wallet is open')).toBeTruthy();
    // The bank name is the server's, in the subtitle and the Bank row (BRIEF A8).
    expect(app.screen.getAllByText('Loma Bank')).toHaveLength(2);
    expect(app.screen.getByText('Ada Eze')).toBeTruthy();
    expect(app.screen.getByText('812 345 6789')).toBeTruthy();
    const text = allText(app);
    expect(text).not.toMatch(/Tier|Raise your limits|Fintava MFB|balance/);
    expect(text).not.toContain('—');
    // No limit from the server, no Limit row.
    expect(app.screen.queryByTestId('open-wallet-account-limit')).toBeNull();
    expect(app.screen.queryByText('Limit')).toBeNull();
    expect(sent.filter((s) => s.method !== 'GET')).toEqual([]);
  });

  it('a user can tap Create your transaction PIN (A9)', async () => {
    const app = await boot();
    expect(await app.screen.findByText('Create your transaction PIN')).toBeTruthy();
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-end-action'));
    expect(app.onCreatePin).toHaveBeenCalledTimes(1);
    expect(app.onDone).not.toHaveBeenCalled();
  });

  it('a user can copy the account number: its digits as sent go on the clipboard, and the button says so for a moment', async () => {
    const app = await boot();
    await app.fireEvent.press(await app.screen.findByTestId('open-wallet-account-copy'));
    expect(mockCopied).toEqual(['8123456789']);
    expect(await app.screen.findByText('Copied')).toBeTruthy();
    await app.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2100));
    });
    expect(app.screen.getByText('Copy')).toBeTruthy();
  });

  it('a copy the phone refuses never says Copied', async () => {
    mockCopyWorks = false;
    const app = await boot();
    await app.fireEvent.press(await app.screen.findByTestId('open-wallet-account-copy'));
    expect(app.screen.queryByText('Copied')).toBeNull();
    expect(app.screen.getByText('Copy')).toBeTruthy();
  });

  it('the Limit row shows only when the server sends a limit, with its figure', async () => {
    fallback['GET /money/wallet'] = view({ limits: { tier: null, dailyLimitKobo: 30_000_000, usedTodayKobo: 0, remainingTodayKobo: 30_000_000, resetsAt: '2026-10-05T00:00:00.000Z' } });
    const app = await boot();
    expect(await app.screen.findByTestId('open-wallet-account-limit')).toBeTruthy();
    expect(app.screen.getByText('Limit')).toBeTruthy();
    expect(app.screen.getByText('₦300,000 a day')).toBeTruthy();
  });

  it('a limit of 0 (or one that is not whole kobo) is no limit: no Limit row, never "₦0 a day"', async () => {
    fallback['GET /money/wallet'] = view({ limits: { tier: null, dailyLimitKobo: 0, usedTodayKobo: 0, remainingTodayKobo: 0, resetsAt: '2026-10-05T00:00:00.000Z' } });
    let app = await boot();
    expect(await app.screen.findByTestId('open-wallet-account')).toBeTruthy();
    expect(app.screen.queryByTestId('open-wallet-account-limit')).toBeNull();
    expect(allText(app)).not.toContain('₦0');
    await app.screen.unmount();
    fallback['GET /money/wallet'] = view({ limits: { tier: null, dailyLimitKobo: 12.5, usedTodayKobo: 0, remainingTodayKobo: 0, resetsAt: '2026-10-05T00:00:00.000Z' } });
    app = await boot();
    expect(await app.screen.findByTestId('open-wallet-account')).toBeTruthy();
    expect(app.screen.queryByTestId('open-wallet-account-limit')).toBeNull();
  });

  it('the long legal bank name wraps in the Bank row instead of pushing the label out', async () => {
    fallback['GET /money/wallet'] = view({ account: { ...ACCOUNT, bankName: LONG_BANK } });
    const app = await boot();
    expect(await app.screen.findByTestId('open-wallet-account')).toBeTruthy();
    const [subtitle, row] = app.screen.getAllByText(LONG_BANK);
    expect(subtitle).toBeTruthy();
    expect(row.props.numberOfLines).toBe(2);
    expect(app.screen.getByText('Bank')).toBeTruthy();
  });

  it('a user who already set a PIN (BACKEND_GAPS G-41) has nothing to create: Done ends Open your wallet', async () => {
    fallback['GET /money/wallet'] = view({ pin: pinState(true) });
    const app = await boot();
    expect(await app.screen.findByTestId('open-wallet-account')).toBeTruthy();
    expect(app.screen.queryByText('Create your transaction PIN')).toBeNull();
    await app.fireEvent.press(app.screen.getByText('Done'));
    expect(app.onDone).toHaveBeenCalledTimes(1);
    expect(app.onCreatePin).not.toHaveBeenCalled();
  });

  it('a user waits on a loading view until the account is read', async () => {
    routes['GET /money/wallet'] = ['hold'];
    const app = await boot();
    expect(await app.screen.findByTestId('open-wallet-account-loading')).toBeTruthy();
    expect(app.screen.queryByText('Your wallet is open')).toBeNull();
  });

  it('a read that never answered shows why, and Try again reads it again', async () => {
    routes['GET /money/wallet'] = ['offline'];
    const app = await boot();
    expect(await app.screen.findByTestId('open-wallet-account-error')).toBeTruthy();
    expect(app.screen.getByText("We couldn't show your account")).toBeTruthy();
    expect(app.screen.getByText('No connection. Check your internet and try again.')).toBeTruthy();
    await app.fireEvent.press(app.screen.getByText('Try again'));
    expect(await app.screen.findByTestId('open-wallet-account')).toBeTruthy();
  });

  it('an open wallet answered without its account details is never drawn half empty', async () => {
    fallback['GET /money/wallet'] = view({ account: null });
    const app = await boot();
    expect(await app.screen.findByTestId('open-wallet-account-error')).toBeTruthy();
    expect(app.screen.getByText('Your account details could not be read. Try again.')).toBeTruthy();
  });

  it('with no wallet (a link, a reload), Open your wallet starts at A26; while opening, the user is told and can leave', async () => {
    fallback['GET /money/wallet'] = view({ state: 'not_open', account: null });
    let app = await boot();
    await app.waitFor(() => expect(app.onNoWallet).toHaveBeenCalledTimes(1));
    await app.screen.unmount();

    fallback['GET /money/wallet'] = view({ state: 'opening', account: null });
    app = await boot();
    expect(await app.screen.findByTestId('open-wallet-account-opening')).toBeTruthy();
    expect(app.screen.getByText('Your account is opening')).toBeTruthy();
    await app.fireEvent.press(app.screen.getByText('Done'));
    expect(app.onDone).toHaveBeenCalledTimes(1);
  });

  const walletGets = () => sent.filter((x) => x.method === 'GET' && x.path.endsWith('/money/wallet')).length;
  const goAway = async (app: Awaited<ReturnType<typeof boot>>) => {
    await app.act(async () => setFocused(false));
  };
  const comeBack = async (app: Awaited<ReturnType<typeof boot>>) => {
    await app.act(async () => setFocused(true));
  };

  it('Finding 2: coming back (Back from A10’s unknown state) reads the wallet again, and shows the loading view, never the cached offer, until it answers', async () => {
    // A9 and A10 were up: the PIN was set meanwhile (the lost request landed), so the second read says so.
    let release!: () => void;
    routes['GET /money/wallet'] = [view(), { gate: new Promise<void>((resolve) => (release = resolve)), then: view({ pin: pinState(true) }) }];
    fallback = {};
    const app = await boot();
    expect(await app.screen.findByText('Create your transaction PIN')).toBeTruthy();
    expect(walletGets()).toBe(1);
    await goAway(app);
    // Still the account while it is behind A9: nothing flashes under the slide.
    expect(app.screen.getByText('Create your transaction PIN')).toBeTruthy();
    await comeBack(app);
    await app.waitFor(() => expect(walletGets()).toBe(2));
    expect(app.screen.getByTestId('open-wallet-account-loading')).toBeTruthy();
    expect(app.screen.queryByText('Create your transaction PIN')).toBeNull();
    await app.act(async () => release());
    // The read says a PIN is set: Done, as on arrival (round 1).
    expect(await app.screen.findByText('Done')).toBeTruthy();
    expect(app.screen.queryByText('Create your transaction PIN')).toBeNull();
    expect(app.screen.queryByTestId('open-wallet-account-loading')).toBeNull();
    await app.fireEvent.press(app.screen.getByText('Done'));
    expect(app.onDone).toHaveBeenCalledTimes(1);
    expect(app.onCreatePin).not.toHaveBeenCalled();
  });

  it('Finding 2: a return whose read says no PIN yet offers Create your transaction PIN again, and a return whose read fails offers nothing stale', async () => {
    routes['GET /money/wallet'] = [view(), view(), 'offline'];
    fallback = {};
    const app = await boot();
    expect(await app.screen.findByText('Create your transaction PIN')).toBeTruthy();
    await goAway(app);
    await comeBack(app);
    await app.waitFor(() => expect(walletGets()).toBe(2));
    expect(await app.screen.findByText('Create your transaction PIN')).toBeTruthy();
    await goAway(app);
    await comeBack(app);
    // The re-read got no answer: A8 does not offer a PIN it cannot vouch for.
    expect(await app.screen.findByTestId('open-wallet-account-error')).toBeTruthy();
    expect(app.screen.queryByText('Create your transaction PIN')).toBeNull();
    expect(app.screen.getByText('No connection. Check your internet and try again.')).toBeTruthy();
  });

  it('Finding 2: the first time A8 is drawn it reads once, and being in front again without having been away reads nothing more', async () => {
    const app = await boot();
    expect(await app.screen.findByText('Create your transaction PIN')).toBeTruthy();
    await comeBack(app);
    await app.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(walletGets()).toBe(1);
  });

  it('the Copy button is the kit’s: sunken pill, 32 high', async () => {
    const app = await boot();
    const copy = await app.screen.findByTestId('open-wallet-account-copy');
    const style = StyleSheet.flatten(typeof copy.props.style === 'function' ? copy.props.style({ pressed: false }) : copy.props.style);
    expect(style.height).toBe(32);
    expect(mockStored).toEqual([]);
  });
});
