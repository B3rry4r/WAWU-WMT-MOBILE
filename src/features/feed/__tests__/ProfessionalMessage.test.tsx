/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * R2-SOCIAL3 (CHECK-3 social pass 3, defect 2): H10 draws "Message · ₦1,500" beside Profile, and it opens the same paid-ask sheet (I3) the
 * profile opens. The price is the Hub's (the card's own `dmPrice`), never the board's ₦1,500; the button is left out when the professional
 * has paid messages off (their switch or the Hub's pause), when the card is the viewer's own, and when the screen was not wired to open
 * the thread a paid question ends in (R-47).
 */
jest.mock('expo-router', () => ({ useIsFocused: () => true }));

type Answer = { status: number; body: unknown } | 'offline' | 'hold';
let answers: Record<string, Answer[]> = {};

const ok = (data: unknown, pagination?: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data, ...(pagination ? { pagination } : {}) } });
const page = (entries: unknown[]) => ok(entries, { currentPage: 1, nextPage: null, perPage: 10, total: entries.length });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  const key = `${request.method} ${path}`;
  const queue = answers[`${key}${url.search}`] ?? answers[key];
  const answer = queue?.[0];
  if (!answer) throw new Error(`no answer for ${key}${url.search}`);
  if (answer === 'hold') return new Promise<Response>(() => undefined);
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const ME = 'me-wawu-id';
const tick = (verified: boolean) => ({ verified, expiresAt: null });
const FOR_YOU = 'GET /feed/entries?scope=for_you&sort=trending&page=1&perPage=10';

const professionalCard = (over: Record<string, unknown> = {}) => ({
  kind: 'professional',
  professional: {
    id: 'l1',
    wawuId: 'p1',
    displayName: 'Funmi Adeyemi',
    handle: 'funmi',
    headline: 'Chartered accountant',
    avatarUrl: null,
    coverUrl: null,
    verification: { creator: tick(false), professional: tick(true) },
    badge: null,
    category: 'legal_services',
    services: ['Tax filing'],
    ratingAvg: 4.9,
    reviewCount: 212,
    dmPrice: 2500,
    dmResponseHours: 24,
    city: 'Ikeja',
    usualReplyMinutes: 180,
    ...over,
  },
});

const listing = (over: Record<string, unknown> = {}) => ({
  id: 'l1',
  wawuId: 'p1',
  name: 'Funmi Adeyemi',
  handle: 'funmi',
  category: 'legal_services',
  headline: 'Chartered accountant',
  services: ['Tax filing'],
  verification: { creator: tick(false), professional: tick(true) },
  avatarUrl: null,
  pieceCount: 0,
  dmEnabled: true,
  dmResponseHours: 24,
  ratingAvg: 4.9,
  reviewCount: 212,
  field: { id: 'accounting_tax', label: 'Accounting & Tax' },
  city: 'Ikeja',
  usualReplyMinutes: 180,
  answeredMessageCount: 0,
  messagePriceKobo: 250000,
  about: 'I help creators file taxes.',
  issuingBody: 'ICAN',
  credentialKind: 'licence',
  badge: null,
  ...over,
});

const clients: QueryClient[] = [];
const PAY = { onOpenWallet: jest.fn(), onSetPin: jest.fn(), onForgotPin: jest.fn(), onAddMoney: jest.fn() };

async function boot(props: Record<string, unknown> = {}) {
  const { FeedScreen } = require('../FeedScreen') as typeof import('../FeedScreen');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  const screen = await rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <FeedScreen {...props} />
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
  await rtl.act(async () => {
    rtl.fireEvent(screen.getByTestId('feed'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 754 } } });
  });
  return screen;
}

// The first render loads the feed's modules; pay for that once, under its own budget.
beforeAll(async () => {
  answers = { 'GET /users/me': ['hold'], [FOR_YOU]: ['hold'] };
  const screen = await boot();
  await screen.unmount();
}, 120_000);

beforeEach(() => {
  answers = {
    'GET /users/me': [ok({ wawuUserId: ME })],
    'GET /professionals/directory/l1': [ok(listing())],
    'GET /paid-dm/creators/p1/availability': [ok({ creatorWawuId: 'p1', paused: false, pausedUntil: null })],
  };
});

afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  clients.splice(0).forEach((c) => c.clear());
});

const wired = (extra: Record<string, unknown> = {}) => ({ pay: PAY, onOpenPaidThread: jest.fn(), onOpenProfessional: jest.fn(), ...extra });

describe('H10 · Message with its price opens the paid-ask sheet (I3)', () => {
  it('a user sees "Message · ₦2,500" with the price from the Hub, and tapping it opens the ask sheet for that professional', async () => {
    answers[FOR_YOU] = [page([professionalCard()])];
    const screen = await boot(wired());
    const message = await screen.findByTestId('card-message');
    expect(message.props.accessibilityLabel).toBe('Message · ₦2,500');
    expect(screen.getByTestId('card-profile')).toBeTruthy();
    expect(screen.queryByTestId('ask-sheet')).toBeNull();
    await rtl.act(async () => {
      rtl.fireEvent.press(message);
    });
    expect(screen.getByTestId('ask-sheet')).toBeTruthy();
    expect(screen.getByText('Funmi Adeyemi')).toBeTruthy();
  });

  it('draws the price the card carries, not the board figure', async () => {
    answers[FOR_YOU] = [page([professionalCard({ dmPrice: 4000 })])];
    const screen = await boot(wired());
    const message = await screen.findByTestId('card-message');
    expect(message.props.accessibilityLabel).toBe('Message · ₦4,000');
    expect(screen.queryByText(/1,500/)).toBeNull();
  });

  it('has no Message when the professional has paid messages switched off, and no refund promise either', async () => {
    answers[FOR_YOU] = [page([professionalCard()])];
    answers['GET /professionals/directory/l1'] = [ok(listing({ dmEnabled: false }))];
    const screen = await boot(wired());
    await screen.findByTestId('professional-card-l1');
    await rtl.waitFor(() => expect(screen.queryByTestId('card-note')).toBeNull());
    expect(screen.queryByTestId('card-message')).toBeNull();
    expect(screen.getByTestId('card-profile')).toBeTruthy();
  });

  it('has no Message while the Hub has the professional paused', async () => {
    answers[FOR_YOU] = [page([professionalCard()])];
    answers['GET /paid-dm/creators/p1/availability'] = [ok({ creatorWawuId: 'p1', paused: true, pausedUntil: '2026-11-01T00:00:00Z' })];
    const screen = await boot(wired());
    await screen.findByTestId('professional-card-l1');
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(screen.queryByTestId('card-message')).toBeNull();
  });

  it('has no Message on the viewer\'s own card', async () => {
    answers[FOR_YOU] = [page([professionalCard({ wawuId: ME })])];
    answers['GET /professionals/directory/l1'] = [ok(listing({ wawuId: ME }))];
    const screen = await boot(wired());
    await screen.findByTestId('professional-card-l1');
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(screen.queryByTestId('card-message')).toBeNull();
  });

  it('draws no Message when the screen was not wired to open the thread (R-47)', async () => {
    answers[FOR_YOU] = [page([professionalCard()])];
    const screen = await boot({ pay: PAY, onOpenProfessional: jest.fn() });
    await screen.findByTestId('professional-card-l1');
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(screen.queryByTestId('card-message')).toBeNull();
  });
});
