/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { userEvent } from '@testing-library/react-native';
import { BackHandler, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * CARD-BACK (R-124, owner, 2 Nov 2026): the virtual card is back on the Wallet (W1), in Wallet settings (W35) and at /cards, following the Hub's
 * `enabled`. These run the real screens and the real route files with the Hub as a stand-in `fetch`, on Android and on iOS: the card row and its
 * Cards row, the three routes live (not redirects), Details and Hide, Freeze, Android's back button from the card screen, and a phone with no
 * connection. There is no Copy control on the card screens (none was built, so none is drawn: R-47). Add money draws no card option: see
 * `addmoney/__tests__/otherWays.test.tsx` (a way the Hub does not offer is not drawn) and the last test here.
 */
const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));
const mockRouter = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) };
const mockParams: { id?: string } = {};
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useIsFocused: () => true,
  useLocalSearchParams: () => mockParams,
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require('react-native') as typeof import('react-native');
    return <Text testID="redirect">{href}</Text>;
  },
}));

const OWNER = '00000000-0000-4000-8000-0000000000c1';
const NUMBER = '4111111111111111';
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const card = (over: Record<string, unknown> = {}) => ({
  id: 'card-1',
  kind: 'virtual',
  status: 'active',
  name: 'Who Made This card',
  currency: 'USD',
  last4: '1234',
  statusMessage: null,
  frozenBySupport: false,
  createdAt: '2026-11-02T09:00:00.000Z',
  ...over,
});
const hub = {
  enabled: true,
  cards: [] as ReturnType<typeof card>[],
  calls: [] as string[],
  pins: [] as (string | null)[],
  offline: false,
  revealRefused: false,
};

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  hub.calls.push(`${request.method} ${path}`);
  if (hub.offline) throw new TypeError('Network request failed');
  if (path === '/money/cards' && request.method === 'GET') return json(200, { data: { enabled: hub.enabled, cards: hub.cards } });
  const one = path.match(/^\/money\/cards\/([^/]+)(?:\/(freeze|unfreeze|reveal|transactions))?$/);
  if (one) {
    const found = hub.cards.find((c) => c.id === one[1]);
    if (!found) return json(404, { data: null, statusCode: 404, message: 'No such card', reason: { code: 'card_not_found', message: 'No such card' } });
    if (!one[2]) return json(200, { data: found });
    if (one[2] === 'transactions') return json(200, { data: { items: [], nextCursor: null } });
    if (one[2] === 'freeze') {
      Object.assign(found, { status: 'frozen' });
      return json(200, { data: found });
    }
    if (one[2] === 'reveal') {
      hub.pins.push(request.headers.get('x-transaction-pin'));
      if (hub.revealRefused) return json(403, { data: null, statusCode: 403, message: 'That PIN is not right.', reason: { code: 'pin_incorrect', message: 'That PIN is not right.' } });
      return json(200, {
        data: { number: NUMBER, expiryMonth: '09', expiryYear: '28', cvv: '123', cardholderName: 'Test Person', billing: null },
      });
    }
  }
  throw new Error(`no answer for ${request.method} ${path}`);
}) as typeof fetch;

const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};

rtl.configure({ asyncUtilTimeout: 5000 });

beforeEach(() => {
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false, gcTime: 0 } });
  Object.assign(hub, { enabled: true, cards: [], calls: [], pins: [], offline: false, revealRefused: false });
  mockParams.id = 'card-1';
  Object.values(mockRouter).forEach((f) => (f as jest.Mock).mockClear());
  mockRouter.canGoBack.mockReturnValue(true);
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
});

const frame = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
async function show(node: React.ReactElement) {
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  await rtl.render(
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={frame}>{node}</SafeAreaProvider>
    </QueryClientProvider>,
  );
}
async function enterPin(pin: string) {
  const user = userEvent.setup();
  for (const d of pin) await user.press(await rtl.screen.findByRole('button', { name: d }));
}
/** The handlers the screen registered for the phone's back button, as Android offers a press (last first). */
function backHandlers() {
  const handlers: (() => boolean | null | undefined)[] = [];
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation(((event: string, handler: () => boolean | null | undefined) => {
    if (event === 'hardwareBackPress') handlers.push(handler);
    return { remove: () => handlers.splice(handlers.indexOf(handler), 1) };
  }) as never);
  return async () => {
    let handled: boolean | null | undefined = false;
    await rtl.act(async () => {
      for (const h of [...handlers].reverse()) {
        handled = h();
        if (handled) break;
      }
    });
    return handled;
  };
}

afterEach(() => jest.restoreAllMocks());

describe.each(['android', 'ios'] as const)('the virtual card is back, on %s', (os) => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', os);
  });

  describe('W1 · the WAWU card row', () => {
    const Row = () => (require('../CardRow') as typeof import('../CardRow')).CardRow();

    it('with the Hub saying cards are on and no card yet, the row leads to getting one and opens /cards', async () => {
      await show(<Row />);
      const row = await rtl.screen.findByTestId('wallet-card-row');
      expect(rtl.screen.getByText('Get your card')).toBeTruthy();
      rtl.fireEvent.press(row);
      expect(mockRouter.push).toHaveBeenCalledWith('/cards');
    });

    it('says which card and how it is: one active', async () => {
      hub.cards = [card()];
      await show(<Row />);
      expect(await rtl.screen.findByText(/••1234/)).toBeTruthy();
      expect(rtl.screen.getByText(/Active/)).toBeTruthy();
    });

    it('says which card and how it is: one frozen', async () => {
      hub.cards = [card({ status: 'frozen' })];
      await show(<Row />);
      expect(await rtl.screen.findByText(/Frozen/)).toBeTruthy();
    });

    it('is not drawn while the Hub says cards are off (nothing that does nothing, R-47)', async () => {
      hub.enabled = false;
      await show(<Row />);
      await rtl.waitFor(() => expect(hub.calls).toContain('GET /money/cards'));
      expect(rtl.screen.queryByTestId('wallet-card-row')).toBeNull();
    });

    it('is not drawn when the read failed (no connection)', async () => {
      hub.offline = true;
      await show(<Row />);
      await rtl.waitFor(() => expect(hub.calls).toContain('GET /money/cards'));
      expect(rtl.screen.queryByTestId('wallet-card-row')).toBeNull();
    });
  });

  describe('W35 · the Cards row in Wallet settings', () => {
    function Probe() {
      const { useCardsSummary } = require('../CardRow') as typeof import('../CardRow');
      const { Text } = require('react-native') as typeof import('react-native');
      const sum = useCardsSummary();
      return <Text testID="summary">{sum ? sum.subtitle : 'none'}</Text>;
    }

    it('the Cards row has its second line from GET /money/cards while cards are on', async () => {
      hub.cards = [card()];
      await show(<Probe />);
      expect(await rtl.screen.findByText(/••1234/)).toBeTruthy();
      expect(rtl.screen.getByTestId('summary').props.children).toMatch(/Virtual/);
    });

    it('there is no Cards row while the Hub says cards are off', async () => {
      hub.enabled = false;
      await show(<Probe />);
      await rtl.waitFor(() => expect(hub.calls).toContain('GET /money/cards'));
      expect(rtl.screen.getByTestId('summary').props.children).toBe('none');
    });
  });

  describe('/cards, /cards/new and /cards/<id> are live routes, not redirects', () => {
    it('/cards draws the cards list and does not redirect to the Wallet', async () => {
      hub.cards = [card()];
      const Cards = require('@/app/cards/index').default as () => React.ReactElement;
      await show(<Cards />);
      expect(await rtl.screen.findByText(/••1234/)).toBeTruthy();
      expect(rtl.screen.queryByTestId('redirect')).toBeNull();
    });

    it('/cards/<id> draws the card and does not redirect to the Wallet', async () => {
      hub.cards = [card()];
      const Detail = require('@/app/cards/[id]').default as () => React.ReactElement;
      await show(<Detail />);
      expect(await rtl.screen.findByTestId('card-art')).toBeTruthy();
      expect(rtl.screen.queryByTestId('redirect')).toBeNull();
    });

    it('/cards/new draws Get your card and does not redirect to the Wallet', async () => {
      const New = require('@/app/cards/new').default as () => React.ReactElement;
      await show(<New />);
      expect(await rtl.screen.findByText(/Get your/)).toBeTruthy();
      expect(rtl.screen.queryByTestId('redirect')).toBeNull();
    });
  });

  describe('the card screen on the phone', () => {
    const Detail = () => (require('@/app/cards/[id]') as typeof import('@/app/cards/[id]')).default();

    it('Details asks the PIN, shows the number and CVV, and Hide Details takes them off the screen again', async () => {
      hub.cards = [card()];
      await show(<Detail />);
      rtl.fireEvent.press(await rtl.screen.findByTestId('card-details'));
      await enterPin('4829');
      expect(await rtl.screen.findByText('4111 1111 1111 1111')).toBeTruthy();
      expect(String(rtl.screen.getByTestId('card-art-secrets').props.children)).toContain('123');
      expect(hub.pins).toEqual(['4829']);
      rtl.fireEvent.press(await rtl.screen.findByTestId('card-hide'));
      await rtl.waitFor(() => expect(rtl.screen.queryByText('4111 1111 1111 1111')).toBeNull());
      expect(rtl.screen.queryByTestId('card-art-secrets')).toBeNull();
      expect(rtl.screen.getByTestId('card-details')).toBeTruthy();
    });

    /**
     * Reveals the card with the PIN and returns the timer the screen set for the reveal (its callback and its id), caught as it is made. A plain
     * wrapper, not a jest spy: the testing library takes a mocked setTimeout for fake timers and stops waiting properly.
     */
    const realTimers = { set: global.setTimeout, clear: global.clearTimeout };
    afterEach(() => {
      global.setTimeout = realTimers.set;
      global.clearTimeout = realTimers.clear;
    });
    const cleared: unknown[] = [];
    async function reveal() {
      const made: { fn: () => void; ms: number; id: ReturnType<typeof setTimeout> }[] = [];
      cleared.length = 0;
      global.setTimeout = ((...args: [() => void, number?, ...unknown[]]) => {
        const id = (realTimers.set as unknown as (...a: unknown[]) => ReturnType<typeof setTimeout>).apply(global, args);
        if (args[1] === REVEAL_MS_NOW) made.push({ fn: args[0], ms: args[1], id });
        return id;
      }) as typeof setTimeout;
      global.clearTimeout = ((id?: Parameters<typeof clearTimeout>[0]) => {
        cleared.push(id);
        return (realTimers.clear as (i?: unknown) => void).call(global, id);
      }) as typeof clearTimeout;
      hub.cards = [card()];
      await show(<Detail />);
      rtl.fireEvent.press(await rtl.screen.findByTestId('card-details'));
      await enterPin('4829');
      expect(await rtl.screen.findByText('4111 1111 1111 1111')).toBeTruthy();
      return made;
    }
    const REVEAL_MS_NOW = (require('../model') as typeof import('../model')).REVEAL_MS;

    it('the revealed details go by themselves after 30 seconds', async () => {
      expect(REVEAL_MS_NOW).toBe(30_000);
      const made = await reveal();
      // The last 30 second timer made is the screen's own (the app's write timeout is 30 seconds too, and is made first).
      const timer = made[made.length - 1];
      expect(rtl.screen.getByTestId('card-art-secrets')).toBeTruthy();
      await rtl.act(async () => timer.fn());
      expect(rtl.screen.queryByText('4111 1111 1111 1111')).toBeNull();
      expect(rtl.screen.queryByTestId('card-art-secrets')).toBeNull();
      expect(rtl.screen.getByTestId('card-details')).toBeTruthy();
    });

    it('leaving the screen hides them: the timer is cleared and a fresh screen for the same card shows only dots', async () => {
      const made = await reveal();
      const timer = made[made.length - 1];
      cleared.length = 0;
      await rtl.cleanup();
      expect(cleared).toContain(timer.id);
      require('@/api/query').queryClient.clear();
      await show(<Detail />);
      await rtl.screen.findByTestId('card-art');
      expect(rtl.screen.queryByText('4111 1111 1111 1111')).toBeNull();
      expect(rtl.screen.queryByTestId('card-art-secrets')).toBeNull();
    });

    it('freezing the card hides the details at once', async () => {
      await reveal();
      rtl.fireEvent.press(await rtl.screen.findByTestId('card-freeze'));
      expect(await rtl.screen.findByTestId('card-frozen')).toBeTruthy();
      expect(rtl.screen.queryByText('4111 1111 1111 1111')).toBeNull();
      expect(rtl.screen.queryByTestId('card-art-secrets')).toBeNull();
    });

    it('a wrong PIN shows nothing of the card', async () => {
      hub.cards = [card()];
      hub.revealRefused = true;
      await show(<Detail />);
      rtl.fireEvent.press(await rtl.screen.findByTestId('card-details'));
      await enterPin('0000');
      await rtl.waitFor(() => expect(hub.pins).toEqual(['0000']));
      expect(rtl.screen.queryByText('4111 1111 1111 1111')).toBeNull();
    });

    it('Freeze stops the card at once, with no PIN, and the screen says it is frozen', async () => {
      hub.cards = [card()];
      await show(<Detail />);
      rtl.fireEvent.press(await rtl.screen.findByTestId('card-freeze'));
      expect(await rtl.screen.findByTestId('card-frozen')).toBeTruthy();
      expect(hub.calls).toContain('POST /money/cards/card-1/freeze');
      expect(hub.pins).toEqual([]);
      expect(rtl.screen.getByTestId('card-unfreeze')).toBeTruthy();
    });

    it('with no connection the card says it could not be loaded and offers Try again; the details are never asked', async () => {
      hub.cards = [card()];
      hub.offline = true;
      await show(<Detail />);
      expect(await rtl.screen.findByTestId('card-error')).toBeTruthy();
      expect(rtl.screen.getByText('We couldn’t load your card')).toBeTruthy();
      hub.offline = false;
      rtl.fireEvent.press(rtl.screen.getByText('Try again'));
      expect(await rtl.screen.findByTestId('card-art')).toBeTruthy();
    });

    it('with no connection when the PIN is given, Details says it was not answered and shows no card number', async () => {
      hub.cards = [card()];
      await show(<Detail />);
      rtl.fireEvent.press(await rtl.screen.findByTestId('card-details'));
      hub.offline = true;
      await enterPin('4829');
      await rtl.waitFor(() => expect(hub.calls.filter((c) => c.endsWith('/reveal')).length).toBeGreaterThan(0));
      expect(rtl.screen.queryByText('4111 1111 1111 1111')).toBeNull();
    });

    if (os === 'android') {
      it('the phone’s back button from the card screen goes back (and to the list when there is nothing behind it)', async () => {
        hub.cards = [card()];
        const press = backHandlers();
        await show(<Detail />);
        await rtl.screen.findByTestId('card-art');
        expect(await press()).toBe(true);
        expect(mockRouter.back).toHaveBeenCalledTimes(1);
        mockRouter.canGoBack.mockReturnValue(false);
        expect(await press()).toBe(true);
        expect(mockRouter.replace).toHaveBeenCalledWith('/cards');
      });
    } else {
      it('iOS draws the round back button, which goes back', async () => {
        hub.cards = [card()];
        await show(<Detail />);
        await rtl.screen.findByTestId('card-art');
        rtl.fireEvent.press(rtl.screen.getByTestId('card-back'));
        expect(mockRouter.back).toHaveBeenCalledTimes(1);
      });
    }
  });
});

describe('Add money draws no card option (money.add_money_card_on stays 0)', () => {
  it('with the Hub listing the card way as not available, the Add money list has no Debit card and no card entry; the issued card brings none', async () => {
    const ways = require('@/features/addmoney/ways') as typeof import('@/features/addmoney/ways');
    const rail = (r: 'card' | 'apple_pay' | 'ussd' | 'open_banking', available: boolean) => ({ rail: r, available, reason: available ? null : 'Not available.', hosted: r === 'apple_pay' || r === 'open_banking' });
    jest.spyOn(ways, 'fetchOptions').mockResolvedValue({
      currency: 'NGN',
      rails: [rail('card', false), rail('apple_pay', false), rail('ussd', false), rail('open_banking', false)],
      cardPublicKey: null,
      limits: { minKobo: null, maxKobo: null, dailyMaxKobo: null },
    } as never);
    const { OtherWays } = require('@/features/addmoney/OtherWays') as typeof import('@/features/addmoney/OtherWays');
    await show(<OtherWays onOpen={jest.fn()} />);
    await rtl.waitFor(() => expect(ways.fetchOptions).toHaveBeenCalled());
    expect(rtl.screen.queryByTestId('add-money-way-card')).toBeNull();
    expect(rtl.screen.queryByText('Debit card')).toBeNull();
    expect(rtl.screen.queryByText(/card/i)).toBeNull();
  });
});
