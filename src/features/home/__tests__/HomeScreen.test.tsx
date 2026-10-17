/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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

const account = { accountNumber: '1154079370', accountName: 'Ada Sandbox', bankName: 'Loma Bank' };
const walletOpen = ok({ state: 'open', account });

const T = {
  wallet: 'GET /money/wallet',
  balance: 'GET /money/wallet/balance',
  creators: 'GET /creators',
  me: 'GET /users/me',
};

function everyAnswer(): Record<string, Answer[]> {
  return {
    [T.wallet]: [walletOpen],
    [T.balance]: [ok({ availableKobo: 48525075, asOf: '2026-10-07T10:00:00Z' })],
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

  it('Today draws no TGIF card and asks for no TGIF: it is on Explore and in the morning notification (R-59, DV2-RM)', async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    await rtl.waitFor(() => expect(screen.getByTestId(`today-creator-${ADA}`)).toBeTruthy());
    expect(screen.queryByTestId('today-tgif')).toBeNull();
    expect(screen.queryByTestId('today-tgif-error')).toBeNull();
    expect(screen.queryByText(/TGIF/i)).toBeNull();
    expect(screen.queryByText(/SPONSORED/i)).toBeNull();
    expect(sent.filter((key) => /tgif/i.test(key))).toEqual([]);
  });

  it('a user sees creators to discover, never themselves, with the tick each has', async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId(`today-creator-${ADA}`)).toBeTruthy());
    // The viewer's own id comes from GET /users/me, a separate answer that can land after GET /creators: until it has,
    // the rail cannot tell who "themselves" is, so the "never themselves" line is read once every read has answered.
    await rtl.waitFor(() => expect(clients.every((c) => c.isFetching() === 0)).toBe(true));
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
    for (const label of ['Scan', 'Shop', 'See all']) {
      expect(screen.queryByText(label)).toBeNull();
    }
    expect(screen.queryByRole('button', { name: /search|notifications|create/i })).toBeNull();
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

  it('A30: a user with no wallet sees the "Complete your account" flag above the card, and tapping it opens A31', async () => {
    answers[T.wallet] = [ok({ state: 'not_open', account: null })];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-complete-account')).toBeTruthy());
    expect(screen.getByText('Complete your account')).toBeTruthy();
    expect(screen.getByText('Verify your identity to get your account number')).toBeTruthy();
    await rtl.fireEvent.press(screen.getByTestId('today-complete-account'));
    expect(mockPush).toHaveBeenCalledWith('/open-wallet');
  });

  it('A30: the flag stays while the account is still opening, and is gone once it is open', async () => {
    answers[T.wallet] = [ok({ state: 'opening', account: null }), walletOpen];
    answers[T.balance] = [ok({ availableKobo: 0, asOf: '2026-10-07T10:00:00Z' })];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance-opening')).toBeTruthy());
    expect(screen.getByTestId('today-complete-account')).toBeTruthy();
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'Check again' }));
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toHaveTextContent('₦0.00'));
    expect(screen.queryByTestId('today-complete-account')).toBeNull();
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
    await rtl.waitFor(() => expect(screen.getByTestId(`today-creator-${ADA}`)).toBeTruthy());
  });
});

describe('H1 · the balance card has no Bills button (R-52, DV2-RM)', () => {
  it('draws Send and Add among the card actions, and no Bills (bills are off) and no Scan (it has no screen yet)', async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    expect(screen.getAllByRole('button', { name: 'Send' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Add' })).toHaveLength(1);
    for (const id of ['today-action-send', 'today-action-add']) expect(screen.getByTestId(id)).toBeTruthy();
    expect(screen.queryByTestId('today-action-bills')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Bills' })).toBeNull();
    for (const label of ['Bills', 'Scan']) expect(screen.queryByText(label)).toBeNull();
  });

  it('a user can still tap Send on the balance card and land on Send money', async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    await rtl.fireEvent.press(screen.getByTestId('today-action-send'));
    expect(mockPush).toHaveBeenCalledWith('/send');
  });

  it('a user can tap Add on the balance card and reach Add money (WALLET-05, W15)', async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    await rtl.fireEvent.press(screen.getByTestId('today-action-add'));
    expect(mockPush).toHaveBeenCalledWith('/add-money');
  });
});

describe('H1 · no Events tile and no Pay bills tile (R-61, R-52, DV2-RM)', () => {
  it('a user sees "What would you like to do today?" with no Events tile and no Pay bills tile, and no Shop (R-2)', async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    expect(screen.getByRole('header', { name: 'What would you like to do today?' })).toBeTruthy();
    expect(screen.queryByTestId('today-service-events')).toBeNull();
    expect(screen.queryByTestId('today-service-bills')).toBeNull();
    for (const label of ['Events', 'Pay bills', 'Shop']) {
      expect(screen.queryByRole('button', { name: label })).toBeNull();
      expect(screen.queryByText(label)).toBeNull();
    }
  });
});

describe('H1 and H11 · the services row packs from the left (EVENTS-01 round 7, U-H1, D11; R-61, DV2-01, DV2-RM)', () => {
  it('a user sees Learn and Legal, packed from the left with no empty slot', async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    const column = screen.getByTestId('today-service-schools').parent!;
    const grid = column.parent!;
    expect(grid.children).toHaveLength(2);
    expect(grid.children[0]).toBe(column);
    expect(grid.children[1]).toBe(screen.getByTestId('today-service-legal').parent);
    // Monetize opens the Create hub, which is for creator accounts: this person is not one, so there is no tile to send them Home.
    expect(screen.queryByTestId('today-service-monetize')).toBeNull();
  });

  it('a user can tap Legal and land on the legal chat (S14, LEGAL-02)', async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'Legal' }));
    expect(mockPush).toHaveBeenCalledWith('/legal');
  });

  it('a user can tap Learn, the first tile (Schools, renamed by R-61), and land on the schools list (SC1, SCHOOLS-03)', async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    const grid = screen.getByTestId('today-service-legal').parent!.parent!;
    expect(grid.children[0]).toBe(screen.getByTestId('today-service-schools').parent);
    expect(screen.queryByText('Schools')).toBeNull();
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'Learn' }));
    expect(mockPush).toHaveBeenCalledWith('/schools');
  });

  it('the loading view draws one tile shape for each of the two tiles every account has, and no TGIF bar (H11)', async () => {
    const { TodayLoading } = require('../TodayLoading') as typeof import('../TodayLoading');
    await rtl.render(<TodayLoading />);
    const shapes = JSON.stringify(rtl.screen.toJSON()).match(/"height":60/g) ?? [];
    expect(shapes).toHaveLength(2);
  });
});

// DV2-01 (R-61, R-69): the drawn row is Studio, Learn, Monetize, Legal; Monetize opens the Create hub (M19), which is for
// creator accounts, and the rail is called "Who Made This?".
describe('H1 · Monetize, and the rail title (R-61, R-69)', () => {
  const asCreator = () => {
    answers[T.me] = [ok({ wawuUserId: ME, accountType: 'creator' })];
  };

  it('a creator sees Monetize between Learn and Legal and taps it to land on the Create hub (M19)', async () => {
    asCreator();
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-service-monetize')).toBeTruthy());
    const grid = screen.getByTestId('today-service-schools').parent!.parent!;
    const order = grid.children.map((column) => (column as { children: { props: { testID?: string } }[] }).children[0].props.testID);
    expect(order).toEqual(['today-service-schools', 'today-service-monetize', 'today-service-legal']);
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'Monetize' }));
    expect(mockPush).toHaveBeenCalledWith('/create');
  });

  it('a person whose account type is not creator has no Monetize tile, so no tap sends them back Home', async () => {
    answers[T.me] = [ok({ wawuUserId: ME, accountType: 'user' })];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-service-schools')).toBeTruthy());
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    expect(screen.queryByTestId('today-service-monetize')).toBeNull();
    expect(screen.queryByText('Monetize')).toBeNull();
  });

  it('a profile that cannot be read leaves Monetize out and Today still draws', async () => {
    answers[T.me] = ['offline'];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-service-schools')).toBeTruthy());
    expect(screen.queryByTestId('today-service-monetize')).toBeNull();
  });

  it('titles the creators rail "Who Made This?" and no longer "Creators to discover"', async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    expect(screen.getByText('Who Made This?')).toBeTruthy();
    expect(screen.queryByText('Creators to discover')).toBeNull();
  });
});
