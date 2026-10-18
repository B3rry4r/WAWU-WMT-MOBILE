/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * I27 (out of credits) in a community room, and the Buy button on I24's strip that opens I28 (INBOX-13). The room, the credits and the
 * packs come from the Hub as a stand-in `fetch`; the socket is a stand-in transport and nothing else is.
 */
const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => void mockVault.set(key, value)),
  deleteItemAsync: jest.fn(async (key: string) => void mockVault.delete(key)),
}));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useIsFocused: () => true, useRouter: () => ({ push: mockPush, dismissTo: jest.fn() }) }));

class FakeSocket {
  static all: FakeSocket[] = [];
  readyState = 0;
  onopen: ((e: unknown) => void) | null = null;
  onmessage: ((e: { data: unknown }) => void) | null = null;
  onclose: ((e: { code: number }) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  constructor(readonly url: string) {
    FakeSocket.all.push(this);
  }
  send() {}
  close() {
    this.readyState = 3;
  }
}
(globalThis as unknown as { WebSocket: unknown }).WebSocket = FakeSocket;

type Answer = { status: number; body: unknown };
let answers: Record<string, Answer[]> = {};
const ok = (data: unknown, extra: object = {}): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data, ...extra } });
const refuse = (status: number, message: string): Answer => ({ status, body: { statusCode: status, message, data: null } });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  const key = `${request.method} ${path}`;
  const queue = answers[`${key}${url.search}`] ?? answers[key];
  const answer = queue?.[0];
  if (queue && queue.length > 1) queue.shift();
  if (!answer) throw new Error(`no answer for ${key}${url.search}`);
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const { adoptSession, resetSessionForTests, signOut } = require('@/api/session') as typeof import('@/api/session');
const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { RoomScreen } = require('@/features/communities/RoomScreen') as typeof import('@/features/communities/RoomScreen');
const { CommunitiesView } = require('@/features/communities/CommunitiesView') as typeof import('@/features/communities/CommunitiesView');
const { forgetAttempts } = require('@/features/money-attempt/attempts') as typeof import('@/features/money-attempt/attempts');

const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
const token = `${b64({ alg: 'none' })}.${b64({ sub: 'me', exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
const ROOM = 'room-1';
const ME = 'user-me';
const HOST = 'user-host';
const verification = { creator: { verified: false, expiresAt: null }, professional: { verified: false, expiresAt: null } };
const room = (over: object = {}) => ({
  id: ROOM,
  name: 'Lagos Freelancers',
  description: 'Freelancers in Lagos.',
  kind: 'open',
  imageUrl: null,
  hostWawuId: HOST,
  memberCount: 1204,
  messagesToday: 3,
  slug: 'lagos-freelancers',
  link: 'wawu/c/lagos-freelancers',
  role: 'member',
  messageCostInCredits: 0,
  ...over,
});
const credits = (creditBalance: number) => ok({ userWawuId: ME, creditBalance, trialEndsAt: null });
const PACKS = ok({
  packs: [
    { pack: 'starter', credits: 50, priceKobo: 50_000, badge: null },
    { pack: 'popular', credits: 120, priceKobo: 100_000, badge: 'popular' },
    { pack: 'pro', credits: 300, priceKobo: 200_000, badge: 'best_value' },
  ],
});
const QUOTE = ok({
  pack: 'popular',
  credits: 120,
  priceKobo: 100_000,
  badge: 'popular',
  payment: {
    kind: 'credit_pack',
    targetId: 'popular',
    title: '120 credits',
    payee: null,
    priceKobo: 100_000,
    fee: { providerFeeKobo: 2325, wawuFeeKobo: 0, totalFeeKobo: 2325 },
    totalKobo: 102_325,
    balanceKobo: 48_525_075,
    shortfallKobo: null,
    willBeHeld: false,
    withinDailyLimit: true,
    remainingTodayKobo: null,
    quoteToken: 'tok',
    expiresAt: '2099-01-01T00:00:00.000Z',
  },
});

function serve(over: Record<string, Answer[]> = {}) {
  answers = {
    [`GET /communities/${ROOM}/room`]: [ok(room())],
    'GET /credits': [credits(48)],
    // R-62: text and emoji free, a photo 1, a video and a voice note 3.
    'GET /communities/message-cost': [ok({ creditsPerMessage: 0, creditsByKind: { text: 0, photo: 1, video: 3, voice: 3 } })],
    'GET /users/me': [ok({ wawuUserId: ME, firstName: 'Ada', lastName: 'Obi', handle: 'ada', avatarUrl: null, verification })],
    [`GET /communities/${ROOM}/messages?page=1&perPage=20`]: [ok([], { pagination: { currentPage: 1, nextPage: null, perPage: 20, total: 0 } })],
    [`POST /communities/${ROOM}/read`]: [ok({ communityId: ROOM, lastReadAt: new Date().toISOString() })],
    'GET /inbox/unread': [ok({ total: 0, chats: 0, paidDms: 0, communities: 0 })],
    'GET /live/catch-up': [ok({ events: [], cursor: 'c0', hasMore: false })],
    'GET /credits/packs': [PACKS],
    'GET /credits/purchase/wallet/quote?pack=popular': [QUOTE],
    'GET /money/wallet/balance': [ok({ availableKobo: 48_525_075, asOf: '2026-10-17T09:00:00.000Z' })],
    ...over,
  };
}

async function renderRoom() {
  await adoptSession({ accessToken: token, refreshToken: 'r' });
  return rtl.render(
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>
        <RoomScreen id={ROOM} onBack={jest.fn()} />
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  FakeSocket.all = [];
  mockPush.mockClear();
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { retry: false, gcTime: Infinity } });
  resetSessionForTests();
  mockVault.clear();
  forgetAttempts();
  serve();
});

afterEach(async () => {
  await queryClient.cancelQueries();
  await rtl.act(async () => {
    await signOut();
  });
  rtl.cleanup();
  queryClient.clear();
});

describe('I27: out of credits in a room', () => {
  it('a member with no credits sees the board\'s words, built from the Hub\'s costs by kind, and Buy credits opens the packs', async () => {
    serve({ 'GET /credits': [credits(0)] });
    await renderRoom();
    expect(await rtl.screen.findByText('You’re out of credits')).toBeTruthy();
    expect(rtl.screen.getByText('Text and emoji stay free. Buy credits to send photos, video and voice notes.')).toBeTruthy();
    expect(rtl.screen.getByText('0 credits')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('out-of-credits-buy'));
    expect(await rtl.screen.findByTestId('credits-sheet')).toBeTruthy();
    expect(await rtl.screen.findByTestId('credits-total')).toBeTruthy();
  });

  it('a member with credits sees no panel', async () => {
    await renderRoom();
    await rtl.screen.findByText('48 credits');
    expect(rtl.screen.queryByTestId('out-of-credits')).toBeNull();
  });

  it('the host, whose messages cost nothing, sees no panel at zero credits', async () => {
    serve({ 'GET /credits': [credits(0)], [`GET /communities/${ROOM}/room`]: [ok(room({ messageCostInCredits: 0, role: 'host' }))] });
    await renderRoom();
    await rtl.screen.findByText('0 credits');
    expect(rtl.screen.queryByTestId('out-of-credits')).toBeNull();
  });

  it('a message refused for credits turns the balance to zero and the panel appears', async () => {
    serve({
      'GET /credits': [credits(1), credits(0)],
      [`POST /communities/${ROOM}/messages`]: [refuse(402, 'You are out of credits.')],
    });
    await renderRoom();
    await rtl.screen.findByText('1 credit');
    await rtl.fireEvent.changeText(rtl.screen.getByTestId('composer-input'), 'hello');
    await rtl.fireEvent.press(rtl.screen.getByTestId('composer-send'));
    expect(await rtl.screen.findByText('You’re out of credits')).toBeTruthy();
  });
});

describe('I24: the Buy button on the credits strip', () => {
  it('a user taps Buy on the strip and the packs sheet opens', async () => {
    serve({
      'GET /communities/mine?page=1&perPage=20': [ok([], { pagination: { currentPage: 1, nextPage: null, perPage: 20, total: 0 } })],
      'GET /communities/message-cost': [ok({ creditsPerMessage: 1 })],
    });
    await adoptSession({ accessToken: token, refreshToken: 'r' });
    await rtl.render(
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>
          <CommunitiesView />
        </SafeAreaProvider>
      </QueryClientProvider>,
    );
    await rtl.fireEvent.press(await rtl.screen.findByTestId('credits-strip-buy'));
    expect(await rtl.screen.findByTestId('credits-sheet')).toBeTruthy();
  });
});
