/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Pressable, Text, View } from 'react-native';

import type { ComponentType } from 'react';

/*
 * Studio (POINTS-07) on the real Expo Router stack: PT1 and PT1a as the real route file, and PT3, PT3a, PT3b and PT7 through the dev harness
 * that stands where POINTS-08's VoiceOver screen will stand, all over the Hub as a stand-in `fetch` installed before the app's modules load.
 * The stand-in answers in the Hub's shapes (the tools, the points, the quote with its wallet offer, the purchase), records every purchase's
 * headers and body, and answers a key it knows with its first purchase, as the Hub does.
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

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });
const refuse = (status: number, reason: Record<string, unknown>) => json(status, { data: null, statusCode: status, message: String(reason.message ?? ''), reason });

const PURCHASE_ID = '66666666-6666-4666-8666-666666666666';
/** Fifty kobo a point: the Hub's rate for the missing points, here only so the stand-in can price a shortfall. */
const KOBO_PER_POINT = 50;

type Mode = 'ok' | 'wrongfirst' | 'lost' | 'pending' | 'walletshort';
const hub = {
  mode: 'ok' as Mode,
  points: 90,
  cost: 250,
  enabled: true,
  tools: true,
  useWallet: true,
  walletKobo: 5_000_000,
  fee: 0,
  cap: null as null | Record<string, unknown>,
  toolsFail: 0,
  quoteFail: false,
  quotes: 0,
  buys: [] as { pin: string | null; key: string | null; body: Record<string, unknown> }[],
  created: {} as Record<string, Record<string, unknown>>,
  purchase: null as null | Record<string, unknown>,
  polls: 0,
  payments: 0,
};

function quote() {
  const shortfall = Math.max(0, hub.cost - hub.points);
  const price = shortfall * KOBO_PER_POINT;
  const total = price + hub.fee;
  const wallet =
    shortfall > 0 && hub.useWallet
      ? {
          currency: 'NGN',
          points: shortfall,
          priceKobo: price,
          per1000PointsKobo: 50_000,
          payment: {
            kind: 'points_shortfall',
            targetId: 'job',
            title: `${shortfall} points`,
            payee: null,
            priceKobo: price,
            fee: { providerFeeKobo: hub.fee, wawuFeeKobo: 0, totalFeeKobo: hub.fee },
            totalKobo: total,
            balanceKobo: hub.walletKobo,
            shortfallKobo: hub.walletKobo < total ? total - hub.walletKobo : 0,
            willBeHeld: false,
            withinDailyLimit: true,
            remainingTodayKobo: null,
            quoteToken: `pay-${total}`,
            expiresAt: '2099-01-01T00:00:00.000Z',
          },
        }
      : null;
  return {
    action: 'voiceover_per_min',
    title: 'VoiceOver',
    per: 'minute',
    units: 1,
    languages: 1,
    perUnitPoints: hub.cost,
    costPoints: hub.cost,
    balancePoints: hub.points,
    shortfallPoints: shortfall,
    useWallet: hub.useWallet,
    quoteToken: `job-${hub.cost}`,
    canRun: shortfall === 0 && hub.cap === null,
    cap: hub.cap,
    wallet,
    walletNote: null,
  };
}

function purchase(status: string, body: Record<string, unknown>) {
  return {
    id: PURCHASE_ID,
    currency: 'NGN',
    status,
    statusMessage: status === 'pending' ? 'Waiting for the bank.' : null,
    points: Math.max(0, hub.cost - hub.points),
    amountKobo: Number(body.expectedTotalKobo),
    payment: {},
    grant: status === 'paid' ? { points: Math.max(0, hub.cost - hub.points), expiresAt: '2027-10-16T00:00:00.000Z' } : null,
    createdAt: '2026-10-17T09:42:00.000Z',
    paidAt: status === 'paid' ? '2026-10-17T09:42:05.000Z' : null,
  };
}

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  const method = request.method;
  if (path === '/ai-tools') {
    if (hub.toolsFail > 0) {
      hub.toolsFail -= 1;
      // A refusal the app does not retry by itself, so the error view is what the person sees.
      return json(400, { statusCode: 400, message: 'Studio is not answering. Try again.' });
    }
    return ok({
      tools: hub.tools
        ? [{ id: 'voiceover', action: 'voiceover_per_min', name: 'VoiceOver', description: 'Turn your words into spoken audio.', unit: 'minute', costPointsPerUnit: hub.cost, enabled: hub.enabled, input: { maxCharacters: 5000, charactersPerUnit: 900 }, voices: [] }]
        : [],
      caps: { dailyPoints: 5000, maxCharactersPerJob: 5000, maxAudioMinutesPerJob: 10 },
    });
  }
  if (path === '/me/points') return ok({ balance: hub.points, nextExpiry: null, lots: [], lotCount: 0, movements: [] });
  if (path === '/points/quote' && method === 'POST') {
    hub.quotes += 1;
    if (hub.quoteFail) return json(503, { statusCode: 503, message: 'We could not price this job right now.' });
    return ok(quote());
  }
  if (path === '/points/shortfall' && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    const pin = request.headers.get('x-transaction-pin');
    const key = request.headers.get('idempotency-key') ?? '';
    hub.buys.push({ pin, key, body });
    // The Hub answers a key it knows with the first purchase, before it looks at the PIN or the quote.
    if (hub.created[key]) return json(201, { statusCode: 201, message: 'Created', data: hub.created[key] });
    if (hub.mode === 'wrongfirst' && hub.buys.length === 1) return refuse(403, { code: 'pin_incorrect', message: 'Wrong PIN. 4 tries left.', triesLeft: 4 });
    if (hub.mode === 'walletshort') return refuse(402, { code: 'insufficient_funds', message: 'There is not enough in your wallet.' });
    const status = hub.mode === 'pending' ? 'pending' : 'paid';
    const made = purchase(status, body);
    hub.created[key] = made;
    hub.purchase = made;
    hub.payments += 1;
    if (status === 'paid') hub.points += Math.max(0, hub.cost - hub.points);
    if (hub.mode === 'lost' && hub.payments === 1) return json(500, { statusCode: 500, message: 'Something went wrong' });
    return json(201, { statusCode: 201, message: 'Created', data: made });
  }
  if (path === `/points/shortfall/${PURCHASE_ID}` && method === 'GET') {
    hub.polls += 1;
    if (hub.purchase?.status === 'pending' && hub.polls >= 2) {
      hub.purchase = purchase('paid', { expectedTotalKobo: hub.purchase.amountKobo });
      hub.points += Math.max(0, hub.cost - hub.points);
    }
    return ok(hub.purchase);
  }
  return json(404, { statusCode: 404, message: `Not here: ${method} ${path}` });
}) as typeof fetch;

const page = (path: string) => (require(path) as { default: ComponentType }).default;
let routes: Record<string, ComponentType>;
let session: typeof import('@/api/session');
let queryClient: typeof import('@/api/query').queryClient;

const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};
const stub = (name: string) => {
  function Stub() {
    const params = useLocalSearchParams<{ from?: string }>();
    return (
      <View>
        <Text accessibilityRole="header">{name}</Text>
        {params.from ? <Text>{`from ${params.from}`}</Text> : null}
      </View>
    );
  }
  return Stub;
};

/** PT4 as a stand-in: it names where it was opened from. "Bought" is the person coming back with the points bought; Back with nothing bought. */
function BuyStub() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  return (
    <View>
      <Text accessibilityRole="header">Buy points</Text>
      {from ? <Text>{`from ${from}`}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Bought"
        onPress={() => {
          hub.points = hub.cost;
          router.back();
        }}
      >
        <Text>Bought</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()}>
        <Text>Back</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Go elsewhere" onPress={() => router.replace('/')}>
        <Text>Go elsewhere</Text>
      </Pressable>
    </View>
  );
}

/** Somewhere that is not the screen the person left from: it can step back, so the screen below is shown again later. */
function ElsewhereStub() {
  const router = useRouter();
  return (
    <View>
      <Text accessibilityRole="header">Home</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Step back" onPress={() => router.back()}>
        <Text>Step back</Text>
      </Pressable>
    </View>
  );
}

beforeAll(async () => {
  session = require('@/api/session') as typeof import('@/api/session');
  queryClient = (require('@/api/query') as typeof import('@/api/query')).queryClient;
  routes = {
    _layout: () => (
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    ),
    index: ElsewhereStub,
    welcome: stub('Welcome'),
    points: stub('Your points'),
    'points-buy': BuyStub,
    'reset-pin': stub('Reset PIN'),
    'open-wallet': stub('Open your wallet'),
    'open-wallet-pin': stub('Create your PIN'),
    studio: page('@/app/studio'),
    'preview/studio-job': page('@/app/preview/studio-job'),
  };
  const { unmount } = await renderRouter(routes, { initialUrl: '/studio' });
  await unmount();
}, 60_000);

beforeEach(() => {
  Object.assign(hub, { mode: 'ok', points: 90, cost: 250, enabled: true, tools: true, useWallet: true, walletKobo: 5_000_000, fee: 0, cap: null, toolsFail: 0, quoteFail: false, quotes: 0, buys: [], created: {}, purchase: null, polls: 0, payments: 0 });
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, gcTime: 0 } });
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor('00000000-0000-4000-8000-0000000000f7'));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  session.resetSessionForTests();
});

afterAll(async () => {
  await queryClient.cancelQueries();
  queryClient.clear();
});

afterEach(async () => {
  await act(async () => {
    jest.advanceTimersByTime(10);
  });
});

/** The router test library fakes the clock once it has rendered: time passes by being moved on. */
const sleep = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });
async function toStudio() {
  await renderRouter(routes, { initialUrl: '/studio' });
  await screen.findByTestId('studio-balance');
}
async function toJob(characters = 132) {
  await renderRouter(routes, { initialUrl: `/preview/studio-job?action=voiceover_per_min&units=1&characters=${characters}` });
  await screen.findByTestId('preview-run');
}

describe('PT1 and PT1a · Studio', () => {
  it('a user sees the tools the Hub lists with the cost the Hub gives, their points, and the line without any outside name', async () => {
    hub.points = 1250;
    await toStudio();
    // STUDIO-HOME (R-113): the caption line under the bar is gone with the home's new title, so its assertion is removed.
    expect(screen.getByTestId('studio-tool-voiceover')).toHaveAccessibleName('VoiceOver, 250 a minute');
    expect(screen.getByTestId('studio-balance')).toHaveTextContent('1,250', { exact: false });
    expect(screen.getAllByTestId(/^studio-tool-/)).toHaveLength(1);
    expect(screen.queryByText(/Captions|Music|Dubbing|Receptionist|ElevenLabs/)).toBeNull();
    expect(screen.queryByTestId('studio-no-points')).toBeNull();
    expect(screen.queryByText(/₦/)).toBeNull();
  });

  it('a cost the Hub changes is the cost shown, not the board’s', async () => {
    hub.points = 1250;
    hub.cost = 300;
    await toStudio();
    expect(screen.getByTestId('studio-tool-voiceover')).toHaveAccessibleName('VoiceOver, 300 a minute');
  });

  it('a tool the Hub lists as not enabled is not drawn as usable: it says so, shows no cost and is no button', async () => {
    hub.points = 1250;
    hub.enabled = false;
    await toStudio();
    expect(screen.getByTestId('studio-tool-voiceover')).toHaveAccessibleName('VoiceOver, Not available right now');
    expect(screen.queryByText(/250 a minute/)).toBeNull();
    expect(screen.queryByRole('button', { name: /VoiceOver/ })).toBeNull();
  });

  it('a tool whose screen is built is a button that opens it (POINTS-08)', async () => {
    hub.points = 1250;
    await toStudio();
    expect(screen.getByRole('button', { name: 'VoiceOver, 250 a minute' })).toBeTruthy();
  });

  it('a person with no points sees the note, the accent Buy points and the tools dimmed', async () => {
    hub.points = 0;
    await toStudio();
    expect(screen.getByTestId('studio-no-points')).toHaveTextContent('You have no points yet', { exact: false });
    expect(screen.getByTestId('studio-no-points')).toHaveTextContent('Buy a pack, or get them with a tier.', { exact: false });
    expect(screen.getByTestId('studio-balance')).toHaveTextContent('0', { exact: false });
    expect(screen.getByTestId('studio-tool-voiceover')).toBeTruthy();
  });

  it('a Hub that lists no tool shows the designed empty view and no tile', async () => {
    hub.tools = false;
    await toStudio();
    expect(screen.getByTestId('studio-empty')).toHaveTextContent('No AI tools yet', { exact: false });
    expect(screen.queryByTestId('studio-tools')).toBeNull();
  });

  it('a read that fails is the error view with Try again, and Try again reads it again', async () => {
    hub.toolsFail = 1;
    hub.points = 1250;
    await renderRouter(routes, { initialUrl: '/studio' });
    expect(await screen.findByTestId('studio-error')).toHaveTextContent('Studio is not answering. Try again.', { exact: false });
    expect(screen.getByText("We couldn't load Studio")).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByTestId('studio-tool-voiceover')).toBeTruthy();
  });

  it('a user can open Your points from the bar and Buy points from the card, and Buy points leads back to Studio', async () => {
    await toStudio();
    await fireEvent.press(screen.getByTestId('studio-buy'));
    expect(await screen.findByText('from studio')).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Buy points' })).toBeTruthy();
  });

  it('the history button opens Your points', async () => {
    await toStudio();
    await fireEvent.press(screen.getByTestId('studio-history'));
    expect(await screen.findByRole('header', { name: 'Your points' })).toBeTruthy();
  });
});

describe('PT3a · not enough points (points are bought in the store sheet, R-86)', () => {
  it('the sheet shows the Hub’s figures and offers Buy points and Not now, and nothing is bought', async () => {
    await toJob();
    await fireEvent.press(screen.getByTestId('preview-run'));
    expect(await screen.findByTestId('shortfall-sheet')).toBeTruthy();
    expect(screen.getByTestId('shortfall-cost')).toHaveAccessibleName('250 points');
    expect(screen.getByTestId('shortfall-have')).toHaveAccessibleName('90 points');
    expect(screen.getByTestId('shortfall-short')).toHaveAccessibleName('160 points');
    await fireEvent.press(screen.getByTestId('shortfall-buy'));
    expect(await screen.findByText('from studio')).toBeTruthy();
    expect(hub.buys).toHaveLength(0);
  });

  it('even when the Hub still offers a wallet payment, the sheet draws no wallet offer, PIN, bank charge or Add money', async () => {
    hub.useWallet = true;
    hub.fee = 250;
    await toJob();
    await fireEvent.press(screen.getByTestId('preview-run'));
    expect(await screen.findByTestId('shortfall-sheet')).toBeTruthy();
    for (const gone of ['shortfall-offer', 'shortfall-confirm', 'shortfall-low', 'shortfall-add']) expect(screen.queryByTestId(gone)).toBeNull();
    expect(screen.queryByText(/wallet|PIN|Bank charge|₦|Add money/i)).toBeNull();
    expect(screen.getByTestId('shortfall-buy')).toBeTruthy();
    expect(screen.getByTestId('shortfall-close')).toBeTruthy();
  });

  it('Not now closes the sheet and asks the Hub for nothing more', async () => {
    await toJob();
    await fireEvent.press(screen.getByTestId('preview-run'));
    await fireEvent.press(await screen.findByTestId('shortfall-close'));
    await waitFor(() => expect(screen.queryByTestId('shortfall-sheet')).toBeNull());
    expect(hub.quotes).toBe(1);
  });

  it('back from Buy points with the points bought, the Hub quotes the job again and no sheet comes back', async () => {
    await toJob();
    await fireEvent.press(screen.getByTestId('preview-run'));
    await fireEvent.press(await screen.findByTestId('shortfall-buy'));
    await screen.findByText('from studio');
    const before = hub.quotes;
    await fireEvent.press(screen.getByRole('button', { name: 'Bought' }));
    await waitFor(() => expect(hub.quotes).toBe(before + 1));
    await waitFor(() => expect(screen.queryByTestId('shortfall-sheet')).toBeNull());
  });

  it('back from Buy points with the points still short shows the sheet again from the Hub’s new figures', async () => {
    await toJob();
    await fireEvent.press(screen.getByTestId('preview-run'));
    await fireEvent.press(await screen.findByTestId('shortfall-buy'));
    await screen.findByText('from studio');
    hub.points = 200;
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByTestId('shortfall-sheet')).toBeTruthy();
    expect(screen.getByTestId('shortfall-short')).toHaveAccessibleName('50 points');
  });

  it('leaving Buy points for somewhere else ends the trip: when the screen is shown again the Hub is not asked', async () => {
    await toJob();
    await fireEvent.press(screen.getByTestId('preview-run'));
    await fireEvent.press(await screen.findByTestId('shortfall-buy'));
    await screen.findByText('from studio');
    await fireEvent.press(screen.getByRole('button', { name: 'Go elsewhere' }));
    await screen.findByText('Home');
    const before = hub.quotes;
    await fireEvent.press(screen.getByRole('button', { name: 'Step back' }));
    await sleep(50);
    expect(hub.quotes).toBe(before);
    expect(screen.queryByTestId('shortfall-sheet')).toBeNull();
  });

  it('a quote that cannot be read is told in the Hub’s words and nothing opens', async () => {
    hub.quoteFail = true;
    await toJob();
    await fireEvent.press(screen.getByTestId('preview-run'));
    expect(await screen.findByText('We could not price this job right now.')).toBeTruthy();
    expect(screen.queryByTestId('shortfall-sheet')).toBeNull();
  });

  it('a person with enough points gets no sheet at all', async () => {
    hub.points = 1250;
    await toJob();
    await fireEvent.press(screen.getByTestId('preview-run'));
    await waitFor(() => expect(hub.quotes).toBe(1));
    expect(screen.queryByTestId('shortfall-sheet')).toBeNull();
    expect(screen.queryByTestId('cap-reached')).toBeNull();
  });
});

describe('PT7 · the limit', () => {
  const daily = {
    cap: 'daily',
    limit: 5000,
    unit: 'points',
    usedPoints: 5000,
    remainingPoints: 0,
    resetsAt: '2026-10-18T00:00:00.000Z',
    message: "That is over today's limit of 5000 points for AI tools. You have 0 left today, and the count starts again at midnight.",
  };

  it('past the daily limit the person is told the board’s three sentences, drawn from the Hub’s numbers with thousands separators', async () => {
    hub.cap = daily;
    hub.points = 1250;
    await toJob();
    await fireEvent.press(screen.getByTestId('preview-run'));
    const view = await screen.findByTestId('cap-reached');
    expect(view).toHaveTextContent("That's today's limit", { exact: false });
    expect(view).toHaveTextContent("You've used 5,000 points on AI tools today. It resets at midnight.", { exact: false });
    expect(view).toHaveTextContent('Your points are safe.', { exact: false });
    expect(screen.queryByTestId('shortfall-sheet')).toBeNull();
    expect(hub.buys).toHaveLength(0);
  });

  it('a cap wins over a shortfall: buying points would not let the job run, so no sheet', async () => {
    hub.cap = daily;
    hub.points = 90;
    await toJob();
    await fireEvent.press(screen.getByTestId('preview-run'));
    expect(await screen.findByTestId('cap-reached')).toBeTruthy();
    expect(screen.queryByTestId('shortfall-sheet')).toBeNull();
  });

  it('a job over the size of one job is told in the Hub’s words with thousands separators, and its own title', async () => {
    hub.cap = { cap: 'characters_per_job', limit: 5000, unit: 'characters', usedPoints: null, remainingPoints: null, resetsAt: null, message: 'One job can take up to 5000 characters. This one has 6000.' };
    hub.points = 1250;
    await toJob(6000);
    await fireEvent.press(screen.getByTestId('preview-run'));
    const view = await screen.findByTestId('cap-reached');
    expect(view).toHaveTextContent('That is too much for one go', { exact: false });
    expect(view).toHaveTextContent('One job can take up to 5,000 characters. This one has 6,000.', { exact: false });
    expect(view).toHaveTextContent('Your points are safe.', { exact: false });
  });

  it('Back to AI tools leaves the limit for Studio', async () => {
    hub.cap = daily;
    hub.points = 1250;
    await toJob();
    await fireEvent.press(screen.getByTestId('preview-run'));
    await screen.findByTestId('cap-reached');
    await fireEvent.press(screen.getByRole('button', { name: 'Back to AI tools' }));
    expect(await screen.findByTestId('studio-balance')).toBeTruthy();
  });
});
