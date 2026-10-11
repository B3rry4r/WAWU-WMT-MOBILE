/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { localDay } from '@/features/tgif/model';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useIsFocused: () => true, useRouter: () => ({ push: mockPush }) }));
jest.mock('@/features/open-wallet/sessionAccount', () => ({ useSessionAccount: () => '00000000-0000-4000-8000-0000000000aa' }));
jest.mock('@/api/session', () => ({
  ...jest.requireActual('@/api/session'),
  useSession: () => ({ status: 'signedIn' }),
}));
// The feed is HOME-02's and has its own tests; here it only has to show which tab it opened on and lead back to Today.
jest.mock('@/features/feed/FeedScreen', () => {
  const { Pressable: P, Text: T } = require('react-native');
  return {
    FeedScreen: ({ initialScope, onToday }: { initialScope: string; onToday: () => void }) => (
      <P testID="feed-stub" onPress={onToday}>
        <T>{`feed ${initialScope}`}</T>
      </P>
    ),
  };
});

type Answer = { status: number; body: unknown } | 'offline' | 'hold';
let answers: Record<string, Answer[]> = {};
let sent: string[] = [];

const ok = (data: unknown, pagination?: unknown): Answer => ({
  status: 200,
  body: { statusCode: 200, message: 'OK', data, ...(pagination ? { pagination } : {}) },
});
const refuse = (status: number, code: string, message: string): Answer => ({
  status,
  body: { statusCode: status, message, data: null, reason: { code } },
});

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  const key = `${request.method} ${path}`;
  sent.push(key);
  const queue = answers[key];
  const answer = queue?.[0];
  if (queue && queue.length > 1) queue.shift();
  if (!answer) throw new Error(`no answer for ${key}`);
  if (answer === 'hold') return new Promise<Response>(() => undefined);
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const ME = '00000000-0000-4000-8000-0000000000aa';
const ADA = '00000000-0000-4000-8000-0000000000a1';
const FUNMI = '00000000-0000-4000-8000-0000000000a2';
const tick = (verified: boolean) => ({ verified, expiresAt: null });
const DATE = localDay();

function creator(wawuId: string, name: string, over: Record<string, unknown> = {}) {
  return {
    wawuId,
    name,
    handle: null,
    avatarUrl: null,
    field: 'Business strategist',
    pieceCount: 3,
    verification: { creator: tick(true), professional: tick(false) },
    following: false,
    ...over,
  };
}
const creatorsPage = (items: unknown[]) => ok(items, { currentPage: 1, nextPage: null, perPage: 12, total: items.length });

const day = {
  date: '2026-09-25',
  series: 'Sons, not slaves',
  seriesTheme: 'Identity',
  verse: 'The verse',
  verseReference: 'Galatians 4:7',
  reality: 'The reality',
  remember: 'Remember this',
  prayer: 'A prayer',
  takeaway: 'The takeaway',
  shareLink: null,
};
const stats = (readers: number) => ({ date: DATE, cards: [], readers, shares: 0, readByMe: false, sharedByMe: false });

const account = { accountNumber: '1154079370', accountName: 'Ada Sandbox', bankName: 'Loma Bank' };
const walletOpen = ok({ state: 'open', account });

const T = {
  wallet: 'GET /money/wallet',
  balance: 'GET /money/wallet/balance',
  tgif: 'GET /settings/tgif',
  day: `GET /tgif/${DATE}`,
  stats: `GET /tgif/${DATE}/stats`,
  creators: 'GET /creators',
  me: 'GET /users/me',
};

function everyAnswer(): Record<string, Answer[]> {
  return {
    [T.wallet]: [walletOpen],
    [T.balance]: [ok({ availableKobo: 48525075, asOf: '2026-10-07T10:00:00Z' })],
    [T.tgif]: [ok({ show: true })],
    [T.day]: [ok(day)],
    [T.stats]: [ok(stats(12400))],
    [T.creators]: [creatorsPage([creator(ME, 'Me Myself'), creator(ADA, 'Adaeze O.'), creator(FUNMI, 'Funmi A.', { field: 'Accountant', verification: { creator: tick(false), professional: tick(true) } })])],
    [T.me]: [ok({ wawuUserId: ME })],
  };
}

const clients: QueryClient[] = [];

async function boot() {
  const { HomeScreen } = require('../HomeScreen') as typeof import('../HomeScreen');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  return rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <HomeScreen />
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
}

beforeAll(async () => {
  answers = Object.fromEntries(Object.values(T).map((k) => [k, ['hold' as const]]));
  const screen = await boot();
  await screen.unmount();
  // The first screen drawn from answers also pays for parsing them and for drawing the balance, the rail and the verse
  // for the first time: on a cold transform cache that took longer than the one second a `waitFor` allows, so it is
  // drawn once here, until Today has left its loading view, under the hook's own budget.
  answers = everyAnswer();
  const loaded = await boot();
  while (loaded.queryByTestId('today-loading')) {
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  }
  await loaded.unmount();
}, 120_000);

beforeEach(() => {
  answers = everyAnswer();
  sent = [];
  mockPush.mockClear();
});

afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  clients.splice(0).forEach((c) => c.clear());
});

describe('H11 · Today while it loads', () => {
  it('a user sees the shapes of Today, under the tabs, while the reads are on their way, and the screen is called Home', async () => {
    answers = Object.fromEntries(Object.values(T).map((k) => [k, ['hold' as const]]));
    const screen = await boot();
    expect(screen.getByTestId('today-loading')).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy();
    expect(screen.getByTestId('feed-tab-today').props.accessibilityState).toEqual({ selected: true });
    expect(screen.queryByTestId('today-balance-card')).toBeNull();
  });
});

describe('H1 · Today', () => {
  it("a user sees Fintava's balance, hides and shows it with the eye", async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    expect(screen.getByTestId('today-balance')).toHaveTextContent('₦485,250.75');
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'Hide balance' }));
    expect(screen.getByTestId('today-balance')).not.toHaveTextContent('485,250');
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'Show balance' }));
    expect(screen.getByTestId('today-balance')).toHaveTextContent('₦485,250.75');
  });

  it('the eye is painted white at 70%, as H1 draws it', async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance-eye')).toBeTruthy());
    type Node = { props?: { testID?: string; style?: unknown }; children?: (Node | string)[] | null };
    const all = (node: Node | string | null, out: Node[] = []): Node[] => {
      if (!node || typeof node === 'string') return out;
      out.push(node);
      node.children?.forEach((child) => all(child, out));
      return out;
    };
    const eye = all(screen.toJSON() as Node).find((n) => n.props?.testID === 'today-balance-eye') ?? null;
    const faded = all(eye).filter((n) => (StyleSheet.flatten(n.props?.style as object) as { opacity?: number } | undefined)?.opacity === 0.7);
    expect(faded.length).toBeGreaterThan(0);
  });

  it("draws Home's figure at H1's 38, not the Wallet tab's 42", async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    const style = StyleSheet.flatten(screen.getByTestId('today-balance').props.style) as { fontSize?: number };
    expect(style.fontSize).toBe(38);
  });

  it("gives Home's money glow its own gradient id, so it never takes the Wallet tab's on the web", async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    type Node = { type?: string; props?: { name?: string; fill?: unknown }; children?: (Node | string)[] | null };
    const all = (node: Node | string | null, out: Node[] = []): Node[] => {
      if (!node || typeof node === 'string') return out;
      out.push(node);
      node.children?.forEach((child) => all(child, out));
      return out;
    };
    const card = all(screen.toJSON() as Node).find((n) => (n.props as { testID?: string } | undefined)?.testID === 'today-balance-card') ?? null;
    const gradients = all(card).filter((n) => n.type === 'RNSVGRadialGradient').map((n) => n.props?.name);
    expect(gradients).toEqual(['today-balance-glow']);
  });

  it("a user sees today's TGIF from the Hub and opens the reader from it", async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-tgif')).toBeTruthy());
    expect(screen.getByText('TGIF · FRIDAY 25 SEP')).toBeTruthy();
    expect(screen.getByText('Sons, not slaves')).toBeTruthy();
    await rtl.waitFor(() => expect(screen.getByTestId('today-tgif-meta')).toHaveTextContent('5 cards · 12.4K reading today'));
    await rtl.fireEvent.press(screen.getByTestId('today-tgif'));
    expect(mockPush).toHaveBeenCalledWith('/tgif');
  });

  it('a user sees creators to discover, never themselves, with the tick each has', async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId(`today-creator-${ADA}`)).toBeTruthy());
    expect(screen.queryByTestId(`today-creator-${ME}`)).toBeNull();
    expect(screen.getByText('Funmi A.')).toBeTruthy();
    expect(screen.getByText('Accountant')).toBeTruthy();
    expect(rtl.within(screen.getByTestId(`today-creator-${FUNMI}`)).getByTestId('tick-pro')).toBeTruthy();
    expect(rtl.within(screen.getByTestId(`today-creator-${ADA}`)).getByTestId('tick-creator')).toBeTruthy();
  });

  it('a user follows a creator in place, and unfollows again', async () => {
    answers[`POST /creators/${ADA}/follow`] = [ok({ following: true })];
    answers[`DELETE /creators/${ADA}/follow`] = [ok({ following: false })];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId(`today-follow-${ADA}`)).toBeTruthy());
    await rtl.fireEvent.press(screen.getByTestId(`today-follow-${ADA}`));
    await rtl.waitFor(() => expect(screen.getByTestId(`today-follow-${ADA}`)).toHaveTextContent('Following'));
    expect(sent).toContain(`POST /creators/${ADA}/follow`);
    // The button turns at once and is busy, ignoring presses, until the Hub has answered: Unfollow is for after that.
    await rtl.waitFor(() => expect(screen.getByTestId(`today-follow-${ADA}`).props.accessibilityState).toMatchObject({ busy: false }));
    await rtl.fireEvent.press(screen.getByTestId(`today-follow-${ADA}`));
    await rtl.waitFor(() => expect(sent).toContain(`DELETE /creators/${ADA}/follow`));
    await rtl.waitFor(() => expect(screen.getByTestId(`today-follow-${ADA}`)).toHaveTextContent('Follow'));
  });

  it('draws a creator already followed as Following on white at 20%, not on the accent (T3: `on` reaches the button)', async () => {
    const { darkColors, lightColors } = require('@/theme/tokens.generated') as typeof import('@/theme/tokens.generated');
    answers[T.creators] = [creatorsPage([creator(ADA, 'Adaeze O.', { following: true }), creator(FUNMI, 'Funmi A.')])];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId(`today-follow-${ADA}`)).toHaveTextContent('Following'));
    const flat = (id: string) => StyleSheet.flatten(screen.getByTestId(id).props.style);
    const accents = [darkColors.accent, lightColors.accent];
    expect(accents).not.toContain(flat(`today-follow-${ADA}`).backgroundColor);
    expect(flat(`today-follow-${ADA}-veil`)).toMatchObject({ backgroundColor: '#FFFFFF', opacity: 0.2 });
    // Beside it, a creator not followed keeps Follow on the accent, with no veil.
    expect(accents).toContain(flat(`today-follow-${FUNMI}`).backgroundColor);
    expect(screen.queryByTestId(`today-follow-${FUNMI}-veil`)).toBeNull();
  });

  it('shows the spinner on Follow while the follow is on its way, and only on that card (T4: `loading` reaches the button)', async () => {
    answers[`POST /creators/${ADA}/follow`] = ['hold'];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId(`today-follow-${ADA}`)).toBeTruthy());
    expect(screen.queryByTestId('button-spinner')).toBeNull();
    await rtl.fireEvent.press(screen.getByTestId(`today-follow-${ADA}`));
    await rtl.waitFor(() => expect(rtl.within(screen.getByTestId(`today-follow-${ADA}`)).getByTestId('button-spinner')).toBeTruthy());
    expect(screen.getByTestId(`today-follow-${ADA}`).props.accessibilityState).toMatchObject({ busy: true });
    expect(rtl.within(screen.getByTestId(`today-follow-${FUNMI}`)).queryByTestId('button-spinner')).toBeNull();
    expect(screen.getByTestId(`today-follow-${FUNMI}`).props.accessibilityState).toMatchObject({ busy: false });
  });

  it('a refused follow goes back and says so', async () => {
    answers[`POST /creators/${ADA}/follow`] = [{ status: 500, body: { statusCode: 500, message: 'Server error', data: null } }];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId(`today-follow-${ADA}`)).toBeTruthy());
    await rtl.fireEvent.press(screen.getByTestId(`today-follow-${ADA}`));
    await rtl.waitFor(() => expect(screen.getByTestId('today-follow-failed')).toHaveTextContent("Adaeze O. wasn't followed. Try again."));
    expect(screen.getByTestId(`today-follow-${ADA}`)).toHaveTextContent('Follow');
    expect(screen.getByTestId(`today-follow-${ADA}`)).not.toHaveTextContent('Following');
  });

  it('a user switches to Following and For you, and comes back to Today', async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    await rtl.fireEvent.press(screen.getByTestId('feed-tab-following'));
    expect(screen.getByText('feed following')).toBeTruthy();
    await rtl.fireEvent.press(screen.getByTestId('feed-stub'));
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    await rtl.fireEvent.press(screen.getByTestId('feed-tab-for_you'));
    expect(screen.getByText('feed for_you')).toBeTruthy();
  });

  it('draws no entry that leads to a screen not built yet', async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    for (const label of ['Send', 'Add', 'Scan', 'Shop', 'See all']) {
      expect(screen.queryByText(label)).toBeNull();
    }
    expect(screen.queryByRole('button', { name: /search|notifications|create/i })).toBeNull();
  });
});

describe('H36 · Today with TGIF off', () => {
  it('a user with TGIF off sees Today without the TGIF card, and the day is never asked for', async () => {
    answers[T.tgif] = [ok({ show: false })];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    expect(screen.queryByTestId('today-tgif')).toBeNull();
    expect(screen.queryByText(/SPONSORED/i)).toBeNull();
    expect(sent).not.toContain(T.day);
    expect(screen.getByTestId(`today-creator-${ADA}`)).toBeTruthy();
  });

  it('a TGIF switch that cannot be read leaves TGIF on, as the Hub does for nobody who turned it off', async () => {
    answers[T.tgif] = ['offline'];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-tgif')).toBeTruthy());
  });
});

describe('the balance card without a balance', () => {
  it('a user with no wallet is led to Open your wallet (A26), in the Wallet tab\'s words', async () => {
    answers[T.wallet] = [ok({ state: 'not_open', account: null })];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance-no_wallet')).toBeTruthy());
    expect(screen.getByText("You don't have a wallet yet")).toBeTruthy();
    expect(screen.getByText('Open your wallet to continue.')).toBeTruthy();
    expect(screen.queryByTestId('today-balance-eye')).toBeNull();
    expect(sent).not.toContain(T.balance);
    await rtl.fireEvent.press(screen.getByTestId('today-open-wallet'));
    expect(mockPush).toHaveBeenCalledWith('/open-wallet');
  });

  it('a wallet still opening says so, and Check again asks about the wallet again', async () => {
    answers[T.wallet] = [ok({ state: 'opening', account: null }), walletOpen];
    answers[T.balance] = [ok({ availableKobo: 0, asOf: '2026-10-07T10:00:00Z' })];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance-opening')).toBeTruthy());
    expect(screen.getByText('Your account is opening')).toBeTruthy();
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'Check again' }));
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toHaveTextContent('₦0.00'));
  });

  it("an unreachable bank shows W6's title and the Hub's own sentence, never a figure, and Try again asks again", async () => {
    answers[T.balance] = [refuse(503, 'provider_unreachable', 'We could not reach your account. Try again in a moment.'), ok({ availableKobo: 100, asOf: '2026-10-07T10:00:00Z' })];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance-unreachable')).toBeTruthy());
    expect(screen.getByText("We couldn't reach your account")).toBeTruthy();
    expect(screen.getByText('We could not reach your account. Try again in a moment.')).toBeTruthy();
    expect(screen.queryByText(/money is safe/)).toBeNull();
    expect(screen.queryByTestId('today-balance')).toBeNull();
    await rtl.fireEvent.press(screen.getByTestId('today-balance-retry'));
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toHaveTextContent('₦1.00'));
  });
});

describe("today's TGIF that cannot be read", () => {
  it('says so in its own card with Try again, and is not taken for TGIF switched off', async () => {
    answers[T.day] = [{ status: 500, body: { statusCode: 500, message: 'Server error', data: null } }, ok(day)];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-tgif-error')).toBeTruthy());
    expect(screen.getByText("Today's TGIF didn't load.")).toBeTruthy();
    expect(screen.queryByTestId('today-tgif')).toBeNull();
    expect(screen.getByTestId('today-balance')).toBeTruthy();
    await rtl.fireEvent.press(screen.getByTestId('today-tgif-retry'));
    await rtl.waitFor(() => expect(screen.getByTestId('today-tgif')).toBeTruthy());
    expect(screen.queryByTestId('today-tgif-error')).toBeNull();
  });

  it('with TGIF off, neither the card nor its error shows', async () => {
    answers[T.tgif] = [ok({ show: false })];
    answers[T.day] = [{ status: 500, body: { statusCode: 500, message: 'Server error', data: null } }];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    expect(screen.queryByTestId('today-tgif-error')).toBeNull();
    expect(screen.queryByTestId('today-tgif')).toBeNull();
  });
});

describe('Today empty and in error', () => {
  it('with no creators to suggest, a user is told so', async () => {
    answers[T.creators] = [creatorsPage([creator(ME, 'Me Myself')])];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-creators-empty')).toBeTruthy());
  });

  it('creators that fail to load say so in place, and Try again brings them', async () => {
    answers[T.creators] = ['offline', creatorsPage([creator(ADA, 'Adaeze O.')])];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-creators-error')).toBeTruthy());
    expect(screen.getByTestId('today-balance')).toBeTruthy();
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    await rtl.waitFor(() => expect(screen.getByTestId(`today-creator-${ADA}`)).toBeTruthy());
  });

  it('with no connection at all, Today says it did not load, and Try again recovers', async () => {
    const fresh = everyAnswer();
    // The balance is asked for only once the wallet is known to be open, so it is never asked while offline.
    answers = Object.fromEntries(Object.entries(fresh).map(([k, v]) => [k, k === T.balance ? v : ['offline' as const, ...v]]));
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-error')).toBeTruthy());
    expect(sent).not.toContain(T.balance);
    expect(screen.getByText("Today didn't load")).toBeTruthy();
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toHaveTextContent('₦485,250.75'));
    await rtl.waitFor(() => expect(screen.getByTestId('today-tgif')).toBeTruthy());
  });
});

describe('H1 · the Bills action on the balance card (BILLS-01, R-41)', () => {
  it('a user can tap Bills on the balance card and land on Pay a bill (S2)', async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    expect(screen.getByText('Bills')).toBeTruthy();
    await rtl.fireEvent.press(screen.getByTestId('today-action-bills'));
    expect(mockPush).toHaveBeenCalledWith('/bills');
  });

  it('draws Bills and only Bills among the card actions: Send, Add and Scan have no screen yet', async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    expect(screen.getAllByRole('button', { name: 'Bills' })).toHaveLength(1);
    for (const label of ['Send', 'Add', 'Scan']) expect(screen.queryByText(label)).toBeNull();
  });
});

describe('H1 and H36 · the Events tile (EVENTS-01, R-41)', () => {
  it('a user can tap Events under "What would you like to do today?" and land on Events (E1)', async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    expect(screen.getByRole('header', { name: 'What would you like to do today?' })).toBeTruthy();
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'Events' }));
    expect(mockPush).toHaveBeenCalledWith('/events');
    // The canvas's fourth, Shop, is retired (R-2): Schools takes its place and nothing else is drawn.
    expect(screen.queryByText('Shop')).toBeNull();
  });

  it('a user with TGIF off still has the Events tile (H36)', async () => {
    answers[T.tgif] = [ok({ show: false })];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    expect(screen.getByTestId('today-service-events')).toBeTruthy();
  });
});

describe('H1 and H11 · the services row packs from the left (EVENTS-01 round 7, U-H1, D11)', () => {
  it('a user sees Pay bills first in the row, then Events, Legal and Schools, with no empty slot (BILLS-01)', async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    const column = screen.getByTestId('today-service-bills').parent!;
    const grid = column.parent!;
    expect(grid.children).toHaveLength(4);
    expect(grid.children[0]).toBe(column);
    expect(grid.children[1]).toBe(screen.getByTestId('today-service-events').parent);
  });

  it('a user can tap Pay bills, the first tile, and land on Pay a bill (S2, BILLS-01)', async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'Pay bills' }));
    expect(mockPush).toHaveBeenCalledWith('/bills');
  });

  it('a user with TGIF off still has the Pay bills tile (H36)', async () => {
    answers[T.tgif] = [ok({ show: false })];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    expect(screen.getByTestId('today-service-bills')).toBeTruthy();
  });

  it('a user can tap Legal, the third tile, and land on the legal chat (S14, LEGAL-02)', async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'Legal' }));
    expect(mockPush).toHaveBeenCalledWith('/legal');
  });

  it('a user can tap Schools, the fourth tile, and land on the schools list (SC1, SCHOOLS-03)', async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    const grid = screen.getByTestId('today-service-events').parent!.parent!;
    expect(grid.children[3]).toBe(screen.getByTestId('today-service-schools').parent);
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'Schools' }));
    expect(mockPush).toHaveBeenCalledWith('/schools');
  });

  it('a user with TGIF off still has the Schools tile (H36)', async () => {
    answers[T.tgif] = [ok({ show: false })];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    expect(screen.getByTestId('today-service-schools')).toBeTruthy();
  });

  it('the loading view draws one tile shape for each of the four tiles present (H11)', async () => {
    const { TodayLoading } = require('../TodayLoading') as typeof import('../TodayLoading');
    await rtl.render(<TodayLoading withTgif />);
    const shapes = JSON.stringify(rtl.screen.toJSON()).match(/"height":60/g) ?? [];
    expect(shapes).toHaveLength(4);
  });
});
