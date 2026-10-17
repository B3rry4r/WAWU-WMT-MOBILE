/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const mockVault = new Map<string, string>();
const mockPushed: string[] = [];

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
  const router = { push: (path: string) => mockPushed.push(path) };
  return { useRouter: () => router, useIsFocused: () => true };
});

type Reply = { status: number; body: unknown };
type Answer = Reply | 'offline' | 'hold';

const OWNER = '00000000-0000-4000-8000-0000000000e1';
/** Made-up names in the server's shape (TIER-06), none of them the board's, so a screen that drew the board's words would fail. */
const PASS = { id: 'maker_pass', name: 'Crew Pass' };
const TIER = { id: 'create', name: 'Create plan', badge: null };
const BOARD_WORDS = /Christmas|Maker Pass|Founding Maker|Example values|Entry to the event/;

let sent: { method: string; path: string }[] = [];
let routes: Record<string, Answer[]> = {};
let fallback: Record<string, Answer> = {};

const ok = (data: unknown): Reply => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const refusal = (status: number): Reply => ({ status, body: { statusCode: status, message: 'Something went wrong. Try again.', data: null } });
const tierView = (eventPass: unknown, tier: unknown = TIER) =>
  ok({
    state: eventPass ? 'active' : 'none',
    tier: eventPass ? tier : null,
    activeFrom: null,
    activeUntil: null,
    productsAllowed: 3,
    productsUsed: 0,
    extraProducts: 0,
    pointsIncluded: 0,
    firstVoiceIntroIncluded: false,
    eventPass,
  });
const wallet = ok({
  state: 'open',
  account: { accountNumber: '8100000417', accountName: 'Ada Eze', bankName: 'Ekiti Trial MFB', bankCode: '090620', licenceLine: null, depositInsuranceLine: null, openedAt: '2026-10-04T09:00:00.000Z' },
  limits: null,
  pin: { isSet: true, changedAt: '2026-10-04T09:01:00.000Z', triesLeft: 5, lockedUntil: null },
  bankTransfers: { allowed: true, blockedBy: null },
  beneficiaryCount: 0,
});

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  sent.push({ method: request.method, path: url.pathname });
  const key = `${request.method} ${url.pathname.replace(/^\/api\/hub/, '')}`;
  const answer = routes[key]?.shift() ?? fallback[key];
  if (!answer) throw new Error(`no answer for ${key}`);
  if (answer === 'offline') throw new TypeError('Network request failed');
  if (answer === 'hold')
    return new Promise<Response>((_resolve, reject) => {
      if (request.signal.aborted) reject(new DOMException('Aborted', 'AbortError'));
      request.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    });
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

function tokenFor(sub: string) {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
}

const frame = (child: React.ReactNode) => (
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{child}</SafeAreaProvider>
);
async function bootWallet() {
  const { WalletScreen } = require('../home/WalletScreen') as typeof import('../home/WalletScreen');
  await rtl.render(frame(<WalletScreen />));
  return rtl;
}
async function bootPass(onBack: () => void = () => undefined) {
  const { PassScreen } = require('../pass/PassScreen') as typeof import('../pass/PassScreen');
  await rtl.render(frame(<PassScreen onBack={onBack} />));
  return rtl;
}

/** Everything drawn, as text: the tree without its circular parts (the glow's SVG holds some). */
const allText = (app: typeof rtl) => {
  const seen = new WeakSet<object>();
  return JSON.stringify(app.screen.toJSON(), (_key, value: unknown) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return undefined;
      seen.add(value);
    }
    return value;
  });
};
const asked = (path: string) => sent.filter((s) => s.path === `/api/hub${path}`).length;

beforeEach(() => {
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false, gcTime: 0 } });
  sent = [];
  routes = {};
  mockPushed.length = 0;
  Dimensions.set({ window: { width: 390, height: 844, scale: 2, fontScale: 1 } });
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  fallback = {
    'GET /money/wallet': wallet,
    'GET /money/wallet/balance': ok({ availableKobo: 48_525_075, asOf: '2026-10-07T09:00:00.000Z' }),
    'GET /money/transactions': ok({ items: [], nextCursor: null }),
    'GET /me/tier': tierView(PASS),
  };
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

afterAll(() => {
  (require('@/api/query') as typeof import('@/api/query')).queryClient.clear();
});

describe('the day line', () => {
  const { eventLine } = require('../pass/model') as typeof import('../pass/model');
  const { readDay } = require('../api/pass') as typeof import('../api/pass');

  it('reads "Date to be announced" until the Hub sends a day, and the day as written once it does', () => {
    expect(eventLine(null)).toBe('Date to be announced');
    expect(eventLine('2026-12-20')).toBe('Sun 20 Dec 2026');
    expect(eventLine('2027-01-01')).toBe('Fri 1 Jan 2027');
  });

  it('takes only a real calendar day for a day', () => {
    expect(readDay('2026-12-20')).toBe('2026-12-20');
    for (const bad of ['2026-02-30', '2026-13-01', '20 Dec 2026', '2026-12-20T00:00:00Z', '', 20261220, null, undefined, {}]) expect(readDay(bad)).toBeNull();
  });
});

describe('W1 · the Passes card', () => {
  it('a person with a pass sees its name and when the event is, and tapping it opens their pass', async () => {
    const app = await bootWallet();
    expect(await app.screen.findByTestId('wallet-passes')).toBeTruthy();
    expect(app.screen.getByTestId('wallet-passes-name').props.children).toBe('Crew Pass');
    expect(app.screen.getByTestId('wallet-passes-when').props.children).toBe('Date to be announced');
    expect(app.screen.getByText('Passes')).toBeTruthy();
    expect(allText(app)).not.toMatch(BOARD_WORDS);
    await rtl.act(async () => {
      rtl.fireEvent.press(app.screen.getByTestId('wallet-passes'));
    });
    expect(mockPushed).toEqual(['/pass']);
  });

  it('shows the event day the Hub sends', async () => {
    fallback['GET /me/tier'] = tierView({ ...PASS, eventDate: '2026-12-20' });
    const app = await bootWallet();
    expect((await app.screen.findByTestId('wallet-passes-when')).props.children).toBe('Sun 20 Dec 2026');
  });

  it('a person without a tier sees no Passes card, and the rest of the tab is whole', async () => {
    fallback['GET /me/tier'] = tierView(null);
    const app = await bootWallet();
    expect(await app.screen.findByTestId('wallet-balance-card')).toBeTruthy();
    await rtl.waitFor(() => expect(asked('/me/tier')).toBeGreaterThan(0));
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(app.screen.queryByTestId('wallet-passes')).toBeNull();
    expect(app.screen.queryByText('Passes')).toBeNull();
  });

  it('draws no Passes card when the Hub cannot say, and the balance is still there', async () => {
    fallback['GET /me/tier'] = refusal(500);
    const app = await bootWallet();
    expect(await app.screen.findByTestId('wallet-balance-card')).toBeTruthy();
    await rtl.waitFor(() => expect(asked('/me/tier')).toBeGreaterThan(0));
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(app.screen.queryByTestId('wallet-passes')).toBeNull();
    expect(app.screen.queryByTestId('wallet-error')).toBeNull();
  });
});

describe('W44 · Your pass', () => {
  it('a person sees the Hub’s pass name, their tier, the day and each line the Hub sent, in its order', async () => {
    fallback['GET /me/tier'] = tierView({ ...PASS, eventDate: '2026-12-20', benefits: ['First line', 'Second line', 'Third line'] });
    const app = await bootPass();
    expect((await app.screen.findByTestId('pass-name')).props.children).toBe('Crew Pass');
    expect(app.screen.getByTestId('pass-tier').props.children).toBe('Create plan');
    expect(app.screen.getByTestId('pass-date').props.children).toBe('Sun 20 Dec 2026');
    expect(app.screen.getByText('What it gets you')).toBeTruthy();
    expect(app.screen.getAllByTestId('pass-benefit').map((row) => rtl.within(row).getByText(/line/).props.children)).toEqual(['First line', 'Second line', 'Third line']);
    expect(app.screen.getByText('Your pass')).toBeTruthy();
    const drawn = allText(app);
    expect(drawn).not.toMatch(BOARD_WORDS);
    expect(drawn).not.toMatch(/—|Date to be announced/);
  });

  it('with no lines and no day set, draws "Date to be announced" and no "What it gets you"', async () => {
    const app = await bootPass();
    expect(await app.screen.findByTestId('pass-card')).toBeTruthy();
    expect(app.screen.getByTestId('pass-date').props.children).toBe('Date to be announced');
    expect(app.screen.queryByText('What it gets you')).toBeNull();
    expect(app.screen.queryByTestId('pass-benefits')).toBeNull();
  });

  it('leaves a missing tier name, an empty list and a bad day unset, never filled in', async () => {
    fallback['GET /me/tier'] = tierView({ ...PASS, eventDate: '2026-02-30', benefits: ['', '   ', 7] }, { id: 'create', name: null, badge: null });
    const app = await bootPass();
    expect(await app.screen.findByTestId('pass-card')).toBeTruthy();
    expect(app.screen.queryByTestId('pass-tier')).toBeNull();
    expect(app.screen.getByTestId('pass-date').props.children).toBe('Date to be announced');
    expect(app.screen.queryByTestId('pass-benefits')).toBeNull();
  });

  it('shows the loading view while the Hub has not answered, then the pass', async () => {
    fallback['GET /me/tier'] = 'hold';
    const app = await bootPass();
    expect(await app.screen.findByTestId('pass-loading')).toBeTruthy();
    expect(app.screen.queryByTestId('pass-card')).toBeNull();
  });

  it('a person without a pass who opens it sees the empty state, not a card', async () => {
    fallback['GET /me/tier'] = tierView(null);
    const app = await bootPass();
    expect(await app.screen.findByTestId('pass-none')).toBeTruthy();
    expect(app.screen.getByText("You don't have a pass yet")).toBeTruthy();
    expect(app.screen.queryByTestId('pass-card')).toBeNull();
    expect(allText(app)).not.toMatch(/—/);
  });

  it('shows the error state when the read fails, and Try again asks the Hub again and recovers', async () => {
    routes['GET /me/tier'] = ['offline'];
    const app = await bootPass();
    expect(await app.screen.findByTestId('pass-error')).toBeTruthy();
    expect(app.screen.getByText("We couldn't load your pass")).toBeTruthy();
    expect(asked('/me/tier')).toBe(1);
    await rtl.act(async () => {
      rtl.fireEvent.press(app.screen.getByRole('button', { name: 'Try again' }));
    });
    expect(await app.screen.findByTestId('pass-card')).toBeTruthy();
    expect(asked('/me/tier')).toBe(2);
    expect(app.screen.queryByTestId('pass-error')).toBeNull();
  });

  it('refuses an answer that is not a tier view instead of reading it as "no pass"', async () => {
    fallback['GET /me/tier'] = { status: 200, body: { statusCode: 200, message: 'OK', data: { state: 'active' } } };
    const app = await bootPass();
    expect(await app.screen.findByTestId('pass-error')).toBeTruthy();
    expect(app.screen.queryByTestId('pass-none')).toBeNull();
  });

  it('Back leaves the screen', async () => {
    const back = jest.fn();
    const app = await bootPass(back);
    await app.screen.findByTestId('pass-card');
    await rtl.act(async () => {
      rtl.fireEvent.press(app.screen.getByRole('button', { name: 'Back' }));
    });
    expect(back).toHaveBeenCalledTimes(1);
  });
});
