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
/** Which task's inert handler was pressed: the real `unbuilt` hands out one no-op per task id, this one also writes the id down. */
const mockTaps: string[] = [];
jest.mock('@/lib/unbuilt', () => {
  const handlers = new Map<string, () => void>();
  return {
    unbuilt: (task: string) => {
      let handler = handlers.get(task);
      if (!handler) {
        handler = () => {
          mockTaps.push(task);
        };
        handlers.set(task, handler);
      }
      return handler;
    },
  };
});
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
  counts: 'GET /me/counts',
};

function everyAnswer(): Record<string, Answer[]> {
  return {
    [T.wallet]: [walletOpen],
    [T.balance]: [ok({ availableKobo: 48525075, asOf: '2026-10-07T10:00:00Z' })],
    [T.tgif]: [ok({ show: true })],
    [T.day]: [ok(day)],
    [T.stats]: [ok(stats(12400))],
    [T.creators]: [creatorsPage([creator(ME, 'Me Myself'), creator(ADA, 'Adaeze O.'), creator(FUNMI, 'Funmi A.', { field: 'Accountant', verification: { creator: tick(false), professional: tick(true) } })])],
    // `GET /users/me` answers two reads: who the viewer is (never offered to themselves) and the account type (Create).
    [T.me]: [ok({ wawuUserId: ME, accountType: 'user' })],
    [T.counts]: [ok({ purchases: 0, saved: 0, unreadNotifications: 2 })],
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
}, 120_000);

beforeEach(() => {
  answers = everyAnswer();
  sent = [];
  mockPush.mockClear();
  mockTaps.length = 0;
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
    // A string matcher is a whole-text match, so a regex is what says "none of the figure is on screen".
    expect(screen.getByTestId('today-balance')).not.toHaveTextContent(/485,250/);
    expect(screen.getByTestId('today-balance')).not.toHaveTextContent(/\d/);
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
});

describe('H36 · Today with TGIF off', () => {
  it("a user with TGIF off sees the sponsored card in TGIF's place, and the day is never asked for", async () => {
    answers[T.tgif] = [ok({ show: false })];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    expect(screen.queryByTestId('today-tgif')).toBeNull();
    expect(screen.getByTestId('today-sponsored')).toBeTruthy();
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
    expect(screen.getByTestId('today-balance-eye')).toBeTruthy();
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
    await rtl.fireEvent.press(rtl.within(screen.getByTestId('today-error')).getByRole('button', { name: 'Try again' }));
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toHaveTextContent('₦485,250.75'));
    await rtl.waitFor(() => expect(screen.getByTestId('today-tgif')).toBeTruthy());
    expect(screen.queryByTestId('today-error')).toBeNull();
  });
});

describe('H1 and H36 · the Events tile (EVENTS-01, R-41)', () => {
  it('a user can tap Events under "What would you like to do today?" and land on Events (E1)', async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    expect(screen.getByRole('header', { name: 'What would you like to do today?' })).toBeTruthy();
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'Events' }));
    expect(mockPush).toHaveBeenCalledWith('/events');
    expect(mockTaps).toEqual([]);
  });

  it('a user with TGIF off still has the Events tile (H36)', async () => {
    answers[T.tgif] = [ok({ show: false })];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    expect(screen.getByTestId('today-service-events')).toBeTruthy();
  });
});

// ---- COMPLETE-03: Today draws its whole artboard (R-46) ----

type Json = { props?: { testID?: string }; children?: (Json | string)[] | null };
/** Every testID on the page, in the order the tree draws them. */
function drawn(screen: { toJSON: () => unknown }): string[] {
  const out: string[] = [];
  const walk = (node: Json | string | null) => {
    if (!node || typeof node === 'string') return;
    if (node.props?.testID) out.push(node.props.testID);
    node.children?.forEach(walk);
  };
  const root = screen.toJSON() as Json | Json[] | null;
  (Array.isArray(root) ? root : [root]).forEach(walk);
  return out;
}
/** Every string drawn inside the element with this testID. */
function textIn(screen: { toJSON: () => unknown }, testID: string): string[] {
  const out: string[] = [];
  const collect = (node: Json | string | null) => {
    if (node === null) return;
    if (typeof node === 'string') {
      out.push(node);
      return;
    }
    node.children?.forEach(collect);
  };
  const find = (node: Json | string | null): Json | null => {
    if (!node || typeof node === 'string') return null;
    if (node.props?.testID === testID) return node;
    for (const child of node.children ?? []) {
      const hit = find(child);
      if (hit) return hit;
    }
    return null;
  };
  const root = screen.toJSON() as Json | Json[] | null;
  const hit = (Array.isArray(root) ? root : [root]).map(find).find(Boolean) ?? null;
  collect(hit);
  return out;
}
const accountAs = (accountType: string | null) => [ok({ wawuUserId: ME, accountType })];
const settled = async (screen: Awaited<ReturnType<typeof rtl.render>>) => {
  await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
  await rtl.waitFor(() => expect(screen.getByTestId(`today-creator-${ADA}`)).toBeTruthy());
};
const flat = (node: { props: { style?: unknown } }) => StyleSheet.flatten(node.props.style as object) as Record<string, unknown>;

describe('H1 · every element the artboard draws is on Today', () => {
  it('a user sees the tabs, search, the bell, the money card, TGIF, the services and the creators, each in the artboard order', async () => {
    const screen = await boot();
    await settled(screen);
    const ids = drawn(screen);
    const inOrder = [
      'feed-tab-today',
      'feed-tab-following',
      'feed-tab-for_you',
      'today-search',
      'today-bell',
      'today-balance-card',
      'today-currency',
      'today-balance-eye',
      'today-balance',
      'today-action-send',
      'today-action-add',
      'today-action-bills',
      'today-action-scan',
      'today-tgif',
      'today-services',
      'today-service-pay-bills',
      'today-service-events',
      'today-service-legal',
      'today-service-schools',
      'today-creators-see-all',
      `today-creator-${ADA}`,
      `today-creator-${FUNMI}`,
    ];
    const at = inOrder.map((id) => ids.indexOf(id));
    expect(at.filter((i) => i < 0)).toEqual([]);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(JSON.stringify(screen.toJSON())).not.toContain(String.fromCharCode(0x2014));
  });

  it("the money card's four actions read Send, Add, Bills and Scan, left to right", async () => {
    const screen = await boot();
    await settled(screen);
    const row = screen.getByTestId('today-actions');
    const labels = ['send', 'add', 'bills', 'scan'].map((k) => rtl.within(screen.getByTestId(`today-action-${k}`)).getByText(/\w/).props.children);
    expect(labels).toEqual(['Send', 'Add', 'Bills', 'Scan']);
    expect(row.children).toHaveLength(4);
    expect(row.children.map((c) => (c as unknown as { props: { testID: string } }).props.testID)).toEqual(['today-action-send', 'today-action-add', 'today-action-bills', 'today-action-scan']);
  });

  it('the services row reads Pay bills, Events, Legal and Schools, with no Shop', async () => {
    const screen = await boot();
    await settled(screen);
    const grid = screen.getByTestId('today-service-events').parent!.parent!;
    expect(grid.children).toHaveLength(4);
    const keys = grid.children.map((column) => (column as unknown as { children: { props: { testID: string } }[] }).children[0].props.testID);
    expect(keys).toEqual(['today-service-pay-bills', 'today-service-events', 'today-service-legal', 'today-service-schools']);
    expect(screen.queryByText('Shop')).toBeNull();
    for (const label of ['Pay bills', 'Events', 'Legal', 'Schools']) expect(screen.getByRole('button', { name: label })).toBeTruthy();
  });

  it('the tab row reads Today, Following and For you, with Today selected', async () => {
    const screen = await boot();
    await settled(screen);
    const tabs = ['today', 'following', 'for_you'].map((v) => screen.getByTestId(`feed-tab-${v}`));
    expect(tabs.map((t) => t.props.accessibilityState)).toEqual([{ selected: true }, { selected: false }, { selected: false }]);
  });
});

describe('H1 · an entry whose screen is not built opens nothing (R-46)', () => {
  const inert: [string, string, string][] = [
    ['search', 'today-search', 'EXPLORE-02'],
    ['the bell', 'today-bell', 'ME-14'],
    ['the currency chip', 'today-currency', 'WALLET-21'],
    ['Send', 'today-action-send', 'WALLET-02'],
    ['Add', 'today-action-add', 'WALLET-05'],
    ['Bills', 'today-action-bills', 'BILLS-01'],
    ['Scan', 'today-action-scan', 'WALLET-20'],
    ['the Pay bills tile', 'today-service-pay-bills', 'BILLS-01'],
    ['the Legal tile', 'today-service-legal', 'LEGAL-02'],
    ['the Schools tile', 'today-service-schools', 'SCHOOLS-03'],
    ["Creators to discover's See all", 'today-creators-see-all', 'EXPLORE-02'],
    ['a creator card', `today-creator-${ADA}`, 'ME-02'],
  ];

  it.each(inert)('a user who taps %s opens nothing, changes nothing and sends nothing, and the entry names %s', async (_name, testID, task) => {
    const screen = await boot();
    await settled(screen);
    const before = JSON.stringify(screen.toJSON());
    const asked = sent.length;
    await rtl.fireEvent.press(screen.getByTestId(testID));
    expect(mockTaps).toEqual([task]);
    expect(mockPush).not.toHaveBeenCalled();
    expect(sent).toHaveLength(asked);
    expect(JSON.stringify(screen.toJSON())).toBe(before);
  });

  it('a creator card opens nothing, and Follow on the same card still works', async () => {
    answers[`POST /creators/${ADA}/follow`] = [ok({ following: true })];
    const screen = await boot();
    await settled(screen);
    await rtl.fireEvent.press(screen.getByTestId(`today-follow-${ADA}`));
    await rtl.waitFor(() => expect(screen.getByTestId(`today-follow-${ADA}`)).toHaveTextContent('Following'));
    expect(mockTaps).not.toContain('ME-02');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('the built entries open their screens: the TGIF card and the Events tile', async () => {
    const screen = await boot();
    await settled(screen);
    await rtl.fireEvent.press(screen.getByTestId('today-tgif'));
    await rtl.fireEvent.press(screen.getByTestId('today-service-events'));
    expect(mockPush.mock.calls.map((c) => c[0])).toEqual(['/tgif', '/events']);
    expect(mockTaps).toEqual([]);
  });
});

describe('H1 · the bar and the bell', () => {
  it("a user sees the bell's dot when something is unread, and the bell says how many", async () => {
    const screen = await boot();
    await settled(screen);
    expect(screen.getByTestId('today-bell-dot')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Notifications, 2 unread' })).toBeTruthy();
  });

  it('with nothing unread the bell has no dot', async () => {
    answers[T.counts] = [ok({ purchases: 0, saved: 0, unreadNotifications: 0 })];
    const screen = await boot();
    await settled(screen);
    expect(screen.queryByTestId('today-bell-dot')).toBeNull();
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeTruthy();
  });

  it('when the count cannot be read the bell stays, with no dot, and Today is not held up', async () => {
    answers[T.counts] = ['offline'];
    const screen = await boot();
    await settled(screen);
    expect(screen.queryByTestId('today-bell-dot')).toBeNull();
    expect(screen.getByTestId('today-bell')).toBeTruthy();
    expect(screen.getByTestId('today-search')).toBeTruthy();
  });

  it('search and the bell are drawn while Today loads (H11), the bell with the count the Hub gave', async () => {
    answers[T.balance] = ['hold'];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-loading')).toBeTruthy());
    await rtl.waitFor(() => expect(screen.getByTestId('today-bell-dot')).toBeTruthy());
    expect(screen.getByTestId('today-search')).toBeTruthy();
    expect(screen.getByTestId('feed-tab-today')).toBeTruthy();
  });
});

describe('H1 · the money card in every state keeps its chip, its eye and its four actions', () => {
  const actions = ['send', 'add', 'bills', 'scan'];
  const keepsEverything = (screen: Awaited<ReturnType<typeof rtl.render>>) => {
    expect(screen.getByTestId('today-currency')).toBeTruthy();
    expect(screen.getByTestId('today-balance-eye')).toBeTruthy();
    for (const k of actions) expect(screen.getByTestId(`today-action-${k}`)).toBeTruthy();
  };

  it('with no wallet', async () => {
    answers[T.wallet] = [ok({ state: 'not_open', account: null })];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance-no_wallet')).toBeTruthy());
    keepsEverything(screen);
    expect(screen.getByTestId('today-open-wallet')).toBeTruthy();
  });

  it('with the bank unreachable', async () => {
    answers[T.balance] = [refuse(503, 'provider_unreachable', 'We could not reach your account. Try again in a moment.')];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance-unreachable')).toBeTruthy());
    keepsEverything(screen);
  });

  it('while the balance is on its way', async () => {
    answers[T.balance] = ['hold'];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-loading')).toBeTruthy());
    // The page is the loading shapes (H11) until every read answers: the card's own loading state is the shape's.
    expect(screen.queryByTestId('today-balance')).toBeNull();
  });

  it('the eye still hides the figure once there is one, set while there was none', async () => {
    answers[T.wallet] = [ok({ state: 'opening', account: null }), walletOpen];
    answers[T.balance] = [ok({ availableKobo: 4250, asOf: '2026-10-07T10:00:00Z' })];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance-opening')).toBeTruthy());
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'Hide balance' }));
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'Check again' }));
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    expect(screen.getByTestId('today-balance')).not.toHaveTextContent(/\d/);
  });
});

describe('H1 · Creators to discover is always drawn', () => {
  it('the heading and See all are drawn with the cards, and See all is a button of its own', async () => {
    const screen = await boot();
    await settled(screen);
    expect(screen.getByRole('header', { name: 'Creators to discover' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'See all creators' })).toBeTruthy();
  });

  it('with nobody to suggest, a user sees the heading, See all and three neutral cards with no name', async () => {
    answers[T.creators] = [creatorsPage([creator(ME, 'Me Myself')])];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-creators-empty')).toBeTruthy());
    expect(screen.getByRole('header', { name: 'Creators to discover' })).toBeTruthy();
    expect(screen.getByTestId('today-creators-see-all')).toBeTruthy();
    const frames = rtl.within(screen.getByTestId('today-creators-empty')).getAllByTestId('icon-UserRound', { hidden: true });
    expect(frames).toHaveLength(3);
    expect(screen.queryByText('Me Myself')).toBeNull();
    expect(screen.queryByText(/no creators/i)).toBeNull();
    // A neutral card is not an entry: the empty section has no button of its own but See all.
    expect(rtl.within(screen.getByTestId('today-creators-empty')).queryAllByRole('button')).toHaveLength(0);
  });

  it('with no creators at all the neutral cards are the size of the real ones, so the section keeps its height', async () => {
    answers[T.creators] = [creatorsPage([])];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-creators-empty')).toBeTruthy());
    const frame = rtl.within(screen.getByTestId('today-creators-empty')).getAllByTestId('icon-UserRound', { hidden: true })[0].parent!.parent!;
    expect(flat(frame as never)).toMatchObject({ width: 146, height: 196 });
  });

  it('when the creators cannot be read the heading and See all stay, with Try again in place', async () => {
    answers[T.creators] = ['offline'];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-creators-error')).toBeTruthy());
    expect(screen.getByRole('header', { name: 'Creators to discover' })).toBeTruthy();
    expect(screen.getByTestId('today-creators-see-all')).toBeTruthy();
  });
});

describe('H36 · Today with TGIF off draws the sponsored card in its place', () => {
  const off = () => {
    answers[T.tgif] = [ok({ show: false })];
  };

  it('a user sees the card between the money card and the services, and no TGIF card', async () => {
    off();
    const screen = await boot();
    await settled(screen);
    const ids = drawn(screen);
    expect(ids.indexOf('today-balance-card')).toBeLessThan(ids.indexOf('today-sponsored'));
    expect(ids.indexOf('today-sponsored')).toBeLessThan(ids.indexOf('today-services'));
    expect(screen.queryByTestId('today-tgif')).toBeNull();
  });

  it('with no campaign served the card is a neutral picture and SPONSORED, with no advertiser, headline, line or button', async () => {
    off();
    const screen = await boot();
    await settled(screen);
    const card = screen.getByTestId('today-sponsored');
    expect(rtl.within(card).getByTestId('icon-Image', { hidden: true })).toBeTruthy();
    expect(textIn(screen, 'today-sponsored')).toEqual(['SPONSORED']);
    expect(screen.queryByText('Tickets')).toBeNull();
    expect(screen.queryByText(/Gospel/)).toBeNull();
  });

  it('tapping the card opens nothing: serving a campaign into it is ADS-01', async () => {
    off();
    const screen = await boot();
    await settled(screen);
    const before = JSON.stringify(screen.toJSON());
    await rtl.fireEvent.press(screen.getByTestId('today-sponsored'));
    expect(mockTaps).toEqual(['ADS-01']);
    expect(mockPush).not.toHaveBeenCalled();
    expect(JSON.stringify(screen.toJSON())).toBe(before);
  });

  it('a user with TGIF on never sees the sponsored card', async () => {
    const screen = await boot();
    await settled(screen);
    expect(screen.queryByTestId('today-sponsored')).toBeNull();
  });

  it('draws the whole of Today around it: the bar, the money card with its actions, the services and the creators', async () => {
    off();
    const screen = await boot();
    await settled(screen);
    for (const id of ['today-search', 'today-bell', 'today-currency', 'today-action-send', 'today-action-scan', 'today-service-schools', 'today-creators-see-all']) {
      expect(screen.getByTestId(id)).toBeTruthy();
    }
  });

  it('the card never flashes in before the switch is read, and never when the switch cannot be read (TGIF stays on)', async () => {
    answers[T.tgif] = ['hold'];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-loading')).toBeTruthy());
    expect(screen.queryByTestId('today-sponsored')).toBeNull();
    expect(screen.queryByTestId('today-tgif')).toBeNull();
  });
});

describe('H1 and H36 · Create (ME-04), for creator accounts only', () => {
  it('a creator sees Create over Today, and tapping it opens nothing (the screen is ME-04)', async () => {
    answers[T.me] = accountAs('creator');
    const screen = await boot();
    await settled(screen);
    await rtl.waitFor(() => expect(screen.getByRole('button', { name: 'Create' })).toBeTruthy());
    const before = JSON.stringify(screen.toJSON());
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'Create' }));
    expect(mockTaps).toEqual(['ME-04']);
    expect(mockPush).not.toHaveBeenCalled();
    expect(JSON.stringify(screen.toJSON())).toBe(before);
  });

  it.each([['a user', 'user'], ['a professional', 'professional'], ['someone with no account type', null]])('%s sees no Create button', async (_who, type) => {
    answers[T.me] = accountAs(type);
    const screen = await boot();
    await settled(screen);
    expect(screen.queryByRole('button', { name: 'Create' })).toBeNull();
  });

  it('while the account type is held, and when it cannot be read, no Create button is drawn', async () => {
    answers[T.me] = ['hold'];
    const held = await boot();
    // The viewer's own id is the same read: held, the page waits for the creators it filters, so nothing else is asked.
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(held.queryByRole('button', { name: 'Create' })).toBeNull();
    await held.unmount();
    answers = everyAnswer();
    answers[T.me] = ['offline'];
    const failed = await boot();
    await rtl.waitFor(() => expect(failed.getByTestId('today-balance')).toBeTruthy());
    expect(failed.queryByRole('button', { name: 'Create' })).toBeNull();
  });

  it('a creator sees Create while Today loads (H11) too', async () => {
    answers[T.me] = accountAs('creator');
    answers[T.balance] = ['hold'];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-loading')).toBeTruthy());
    await rtl.waitFor(() => expect(screen.getByRole('button', { name: 'Create' })).toBeTruthy());
  });

  it('a creator whose account read failed once gets Create back when Try again reads it again', async () => {
    const fresh = everyAnswer();
    answers = Object.fromEntries(Object.entries(fresh).map(([k, v]) => [k, k === T.balance ? v : ['offline' as const, ...v]]));
    // Two reads ask `GET /users/me` (who the viewer is, and the account type): both fail, then both are answered.
    answers[T.me] = ['offline', 'offline', ...accountAs('creator')];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-error')).toBeTruthy());
    expect(screen.queryByRole('button', { name: 'Create' })).toBeNull();
    await rtl.fireEvent.press(rtl.within(screen.getByTestId('today-error')).getByRole('button', { name: 'Try again' }));
    await rtl.waitFor(() => expect(screen.getByRole('button', { name: 'Create' })).toBeTruthy());
  });

  it("the last row ends above Create for a creator, and keeps Today's own padding for everyone else", async () => {
    const { todayMetrics } = require('../look') as typeof import('../look');
    const { todayBodyBottomCreate } = require('../TodayScreen') as typeof import('../TodayScreen');
    answers[T.me] = accountAs('creator');
    const creatorScreen = await boot();
    await settled(creatorScreen);
    await rtl.waitFor(() => expect(creatorScreen.getByRole('button', { name: 'Create' })).toBeTruthy());
    expect(flat({ props: { style: creatorScreen.getByTestId('today-scroll').props.contentContainerStyle } }).paddingBottom).toBe(todayBodyBottomCreate);
    expect(todayBodyBottomCreate).toBe(90);
    await creatorScreen.unmount();
    answers = everyAnswer();
    const userScreen = await boot();
    await settled(userScreen);
    expect(flat({ props: { style: userScreen.getByTestId('today-scroll').props.contentContainerStyle } }).paddingBottom).toBe(todayMetrics.bodyBottom);
  });
});

describe('H1 · a failed read never collapses Today', () => {
  const allOffline = () => {
    const fresh = everyAnswer();
    // The balance is asked for only once the wallet is known to be open, so it is never asked while offline.
    answers = Object.fromEntries(Object.entries(fresh).map(([k, v]) => [k, k === T.balance ? v : ['offline' as const, ...v]]));
  };
  const sections = (screen: Awaited<ReturnType<typeof rtl.render>>) => {
    for (const id of ['today-search', 'today-bell', 'today-balance-card', 'today-currency', 'today-action-send', 'today-action-scan', 'today-services', 'today-service-events', 'today-service-schools', 'today-creators-see-all']) {
      expect(screen.getByTestId(id)).toBeTruthy();
    }
    expect(screen.getByRole('header', { name: 'Creators to discover' })).toBeTruthy();
    expect(screen.getByRole('header', { name: 'What would you like to do today?' })).toBeTruthy();
  };

  it('with no connection a user still sees every section, under one banner with Try again on top', async () => {
    allOffline();
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-error')).toBeTruthy());
    sections(screen);
    expect(screen.getByText("Today didn't load")).toBeTruthy();
    expect(screen.getByText('Check your connection, then try again.')).toBeTruthy();
    // The banner is the first thing under the bar.
    const ids = drawn(screen);
    expect(ids.indexOf('today-error')).toBeLessThan(ids.indexOf('today-balance-card'));
    expect(screen.queryByTestId('today-loading')).toBeNull();
    // TGIF stays as itself (on, its day unread): never the sponsored card, which is TGIF off.
    expect(screen.queryByTestId('today-sponsored')).toBeNull();
    expect(screen.getByTestId('today-tgif-error')).toBeTruthy();
  });

  it('with every read failed the page has one Try again, the banner\'s; each section says what failed and has no button of its own', async () => {
    allOffline();
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-error')).toBeTruthy());
    expect(screen.getAllByRole('button', { name: 'Try again' })).toHaveLength(1);
    expect(screen.getByText("We couldn't load your wallet")).toBeTruthy();
    expect(screen.getByText("Today's TGIF didn't load.")).toBeTruthy();
    expect(screen.getByText(/The creators didn't load/)).toBeTruthy();
    expect(screen.queryByTestId('today-balance-retry')).toBeNull();
    expect(screen.queryByTestId('today-tgif-retry')).toBeNull();
  });

  it('when one section fails alone its own Try again is there, and no banner', async () => {
    answers[T.day] = [{ status: 500, body: { statusCode: 500, message: 'Server error', data: null } }];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-tgif-error')).toBeTruthy());
    expect(screen.queryByTestId('today-error')).toBeNull();
    expect(screen.getByTestId('today-tgif-retry')).toBeTruthy();
  });

  it('Try again keeps every section drawn while it reads, never the loading shapes, and never the sponsored card', async () => {
    answers = Object.fromEntries(Object.keys(everyAnswer()).map((k) => [k, ['offline' as const, 'hold' as const]]));
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-error')).toBeTruthy());
    await rtl.fireEvent.press(rtl.within(screen.getByTestId('today-error')).getByRole('button', { name: 'Try again' }));
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(screen.queryByTestId('today-loading')).toBeNull();
    expect(screen.queryByTestId('today-sponsored')).toBeNull();
    sections(screen);
    // The banner is still there and its button is on its spinner, so it cannot be sent twice.
    expect(rtl.within(screen.getByTestId('today-error')).getByRole('button', { name: 'Try again' }).props.accessibilityState).toMatchObject({ busy: true });
  });

  it('after Try again the banner goes and the sections fill in', async () => {
    allOffline();
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-error')).toBeTruthy());
    await rtl.fireEvent.press(rtl.within(screen.getByTestId('today-error')).getByRole('button', { name: 'Try again' }));
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toHaveTextContent('₦485,250.75'));
    await rtl.waitFor(() => expect(screen.getByTestId(`today-creator-${ADA}`)).toBeTruthy());
    expect(screen.queryByTestId('today-error')).toBeNull();
    sections(screen);
  });

  it('when only the creators fail there is no banner: the section says so in place, and Try again keeps it drawn while it reads', async () => {
    answers[T.creators] = ['offline', 'hold'];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-creators-error')).toBeTruthy());
    expect(screen.queryByTestId('today-error')).toBeNull();
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(screen.queryByTestId('today-loading')).toBeNull();
    expect(screen.getByTestId('today-creators-error')).toBeTruthy();
    expect(screen.getByTestId('today-balance-card')).toBeTruthy();
  });

  it('no section flashes in before its read settles: with the creators held, Today stays the loading shapes', async () => {
    answers[T.creators] = ['hold'];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-loading')).toBeTruthy());
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    for (const id of ['today-balance-card', 'today-tgif', 'today-sponsored', 'today-services', 'today-creators-empty', 'today-creators-error']) {
      expect(screen.queryByTestId(id)).toBeNull();
    }
    // The bar is not a section of the body: it is drawn at once.
    expect(screen.getByTestId('today-search')).toBeTruthy();
  });
});

describe('H11 · Today while it loads draws the shape of the whole page', () => {
  it('draws the money card with its actions, the slot under it, the heading, four tile shapes and three cards', async () => {
    const { TodayLoading } = require('../TodayLoading') as typeof import('../TodayLoading');
    const { todayMetrics } = require('../look') as typeof import('../look');
    await rtl.render(<TodayLoading />);
    const json = JSON.stringify(rtl.screen.toJSON());
    expect(json.match(/"height":60/g) ?? []).toHaveLength(4);
    expect(json.match(/"height":196/g) ?? []).toHaveLength(3);
    expect(json).toContain(`"height":${todayMetrics.skeletonMoney}`);
    expect(json).toContain(`"height":${todayMetrics.tgifHeight}`);
  });
});
