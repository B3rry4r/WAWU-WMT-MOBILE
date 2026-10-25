/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

// Routes as a creator opens them: signed in, a creator account, a router that records where it was sent.
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn(), canGoBack: () => false }),
  Redirect: () => null,
  useIsFocused: () => true,
}));
jest.mock('@/api/session', () => ({
  ...jest.requireActual('@/api/session'),
  useSession: () => ({ status: 'signedIn', signIn: jest.fn(), signOut: jest.fn() }),
}));
jest.mock('@/features/create/CreateEntry', () => ({
  ...jest.requireActual('@/features/create/CreateEntry'),
  useCreatorGate: () => 'creator',
}));
jest.mock('@/features/feed/player', () => ({ canPlay: true, AudioSource: () => null }));

type Answer = { status: number; body: unknown } | 'offline' | 'hang';
let answers: Record<string, Answer | Answer[]> = {};
let asked: string[] = [];

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  asked.push(`${request.method} ${url.pathname}`);
  const queued = answers[`${request.method} ${url.pathname}`] ?? answers[`${request.method} ${url.pathname}${url.search}`];
  const answer = Array.isArray(queued) ? (queued.length > 1 ? queued.shift()! : queued[0]) : queued;
  if (!answer) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
  if (answer === 'offline') throw new TypeError('Network request failed');
  if (answer === 'hang') return new Promise<Response>(() => undefined);
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const ok = (data: unknown, extra: Record<string, unknown> = {}) => ({ status: 200, body: { statusCode: 200, message: 'OK', data, ...extra } });
const refusal = (status: number, message: string) => ({ status, body: { statusCode: status, message, data: null } });

const { MeScreen } = require('@/features/me/MeScreen') as typeof import('@/features/me/MeScreen');
const { ShopScreen } = require('../ShopScreen') as typeof import('../ShopScreen');
const VoiceIntroRoute = (require('@/app/voice-intro') as typeof import('@/app/voice-intro')).default;
const HearNameRoute = (require('@/app/hear-name') as typeof import('@/app/hear-name')).default;
const ShopRoute = (require('@/app/shop') as typeof import('@/app/shop')).default;
const MeTab = (require('@/app/(tabs)/me') as typeof import('@/app/(tabs)/me')).default;

const ME = '/api/hub/users/me';
const INTRO = '/api/hub/me/voice-intro';
const INTRO_TEXT = '/api/hub/me/voice-intro/text';
const TIER = '/api/hub/me/tier';
const DRAFTS = '/api/hub/product-drafts';

const profile = (over: Record<string, unknown> = {}) => ({
  wawuUserId: 'u1',
  sub: 'u1',
  firstName: 'Lennox',
  middleName: null,
  lastName: 'Emmanuel',
  accountType: 'creator',
  handle: 'lennox',
  bio: null,
  avatarUrl: null,
  coverUrl: null,
  instagramHandle: null,
  tiktokHandle: null,
  xHandle: null,
  youtubeUrl: null,
  facebookUrl: null,
  linkedinUrl: null,
  websiteUrl: null,
  createdAt: '2025-03-10T09:00:00.000Z',
  experience: [],
  verification: { creator: { verified: false, expiresAt: null }, professional: { verified: false, expiresAt: null } },
  ...over,
});
const introView = (over: Record<string, unknown> = {}) => ({
  aiVoice: true,
  text: null,
  textMaxChars: 500,
  consent: { line: 'I agree.', given: false },
  sample: { recorded: false },
  audioUrl: null,
  next: { free: true, costPoints: 0 },
  canGenerate: false,
  run: null,
  ...over,
});
const tierView = (state: string) => ({
  state,
  tier: state === 'none' ? null : { id: 'verify', name: 'Verify', badge: { id: 'verified', numbered: false } },
  activeFrom: state === 'none' ? null : '2026-10-01T00:00:00.000Z',
  activeUntil: state === 'none' ? null : '2026-11-26T10:00:00.000Z',
  productsAllowed: state === 'none' ? 0 : 3,
  productsUsed: 0,
  extraProducts: 0,
  pointsIncluded: 0,
  firstVoiceIntroIncluded: true,
  eventPass: null,
});
const draft = (id: string) => ({
  id,
  title: `Draft ${id}`,
  contentType: 'video',
  description: null,
  category: null,
  specializations: [],
  tags: [],
  accessType: 'paid',
  price: 4500,
  missing: ['file'],
  createdAt: '2026-10-10T09:00:00.000Z',
  updatedAt: '2026-10-10T09:00:00.000Z',
});

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const frame = (children: React.ReactNode) => (
  <SafeAreaProvider initialMetrics={metrics}>
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } })}>{children}</QueryClientProvider>
  </SafeAreaProvider>
);

beforeEach(() => {
  answers = {};
  asked = [];
  mockPush.mockClear();
});

async function typeAndHear(over: Record<string, Answer | Answer[]> = {}) {
  answers = { [`GET ${ME}`]: ok(profile()), [`GET ${INTRO}`]: ok(introView()), [`PUT ${INTRO_TEXT}`]: ok(introView({ text: 'I teach pricing.' })), ...over };
  await render(frame(<VoiceIntroRoute />));
  await fireEvent.changeText(await screen.findByTestId('voice-intro-text'), 'I teach pricing.');
  await fireEvent.press(screen.getByTestId('voice-intro-hear'));
}

describe('"Hear it in my voice" (VF4) goes where the person\'s tier sends it', () => {
  it('no tier: Make it official (VF5, /tiers), after the words are kept', async () => {
    await typeAndHear({ [`GET ${TIER}`]: ok(tierView('none')) });
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/tiers'));
    expect(asked).toContain(`PUT ${INTRO_TEXT}`);
  });

  it('a tier that ended: Your tier (VF14b, /your-tier), where it is renewed', async () => {
    await typeAndHear({ [`GET ${TIER}`]: ok(tierView('ended')) });
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/your-tier'));
  });

  it.each(['active', 'ending'])('a running tier (%s): VF8, Your voice and your consent (/voice-consent, registered by VERIFY-03)', async (state) => {
    await typeAndHear({ [`GET ${TIER}`]: ok(tierView(state)) });
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/voice-consent'));
  });

  it('a tier that cannot be read goes nowhere: the words stay and the screen says so', async () => {
    await typeAndHear({ [`GET ${TIER}`]: refusal(500, 'Down') });
    expect(await screen.findByText('We could not check your plan. Try again.')).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByTestId('voice-intro-text').props.value).toBe('I teach pricing.');
  });
});

describe('the entries VERIFY-02 adds', () => {
  it('VF3 opens VF4: "Sounds right" and "Write my Voice Intro" push /voice-intro', async () => {
    answers = {
      [`GET ${ME}`]: ok(profile()),
      'GET /api/hub/me/voice': ok({ namePhonetic: null, nameSavedAt: null, available: true }),
      'POST /api/hub/me/voice/name-preview': ok({ audioUrl: 'https://files.test/n.mp3', aiVoice: true }),
    };
    await render(frame(<HearNameRoute />));
    await fireEvent.press(await screen.findByTestId('hear-name-right'));
    // R2-AUTHME3: "Sounds right" shows VF3b first; "Write my Voice Intro" is the button that opens VF4.
    expect(mockPush).not.toHaveBeenCalled();
    await fireEvent.press(await screen.findByTestId('hear-name-write'));
    expect(mockPush).toHaveBeenCalledWith('/voice-intro');
  });

  it('VF2b: with a draft, the "Hear your name" row opens VF3; VF2a, with none, draws no row', async () => {
    answers = { [`GET ${DRAFTS}`]: ok([draft('a')]) };
    await render(frame(<ShopRoute />));
    expect(await screen.findByText('Free · how buyers will hear it')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('shop-hear-name'));
    expect(mockPush).toHaveBeenCalledWith('/hear-name');
  });

  it('VF2a: no drafts, no row', async () => {
    answers = { [`GET ${DRAFTS}`]: ok([]) };
    await render(frame(<ShopScreen onBack={jest.fn()} onAdd={jest.fn()} onOpenDraft={jest.fn()} onHearName={jest.fn()} />));
    expect(await screen.findByTestId('shop-empty')).toBeTruthy();
    expect(screen.queryByTestId('shop-hear-name')).toBeNull();
  });

  it('VF2b: without the entry the row is not drawn', async () => {
    answers = { [`GET ${DRAFTS}`]: ok([draft('a')]) };
    await render(frame(<ShopScreen onBack={jest.fn()} onAdd={jest.fn()} onOpenDraft={jest.fn()} />));
    expect(await screen.findByTestId('shop-drafts')).toBeTruthy();
    expect(screen.queryByTestId('shop-hear-name')).toBeNull();
  });
});

describe('Me · the Voice Intro prompt', () => {
  const meAnswers = (over: Record<string, Answer | Answer[]> = {}) => ({
    [`GET ${ME}`]: ok(profile()),
    'GET /api/hub/users/me/profile-fields': ok({ wawuUserId: 'u1', location: null, skills: [], openTo: [], threadsHandle: null, socialOrder: [], memberSince: null, badge: null }),
    'GET /api/hub/users/me/profile-stats': ok({ wawuUserId: 'u1', followerCount: 0, followingCount: 0, postCount: 0 }),
    [`GET ${TIER}`]: ok(tierView('none')),
    [`GET ${DRAFTS}`]: ok([]),
    [`GET ${INTRO}`]: ok(introView()),
    ...over,
  });
  const boot = async (props: { onOpenVoiceIntro?: () => void } = {}) =>
    render(frame(<MeScreen onEditProfile={jest.fn()} onAddWork={jest.fn()} onOpenWork={jest.fn()} onOpenSettings={jest.fn()} {...props} />));

  it('a creator with no Voice Intro made yet sees the prompt under the name, and it opens VF4', async () => {
    answers = meAnswers();
    const open = jest.fn();
    await boot({ onOpenVoiceIntro: open });
    const row = await screen.findByTestId('me-voice-intro');
    expect(screen.getByText('Write it, hear it in your voice')).toBeTruthy();
    await fireEvent.press(row);
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('the Me tab route opens /voice-intro from it', async () => {
    answers = meAnswers();
    await render(frame(<MeTab />));
    await fireEvent.press(await screen.findByTestId('me-voice-intro'));
    expect(mockPush).toHaveBeenCalledWith('/voice-intro');
  });

  it('a creator who has a Voice Intro made sees no prompt (the player is VERIFY-03\'s)', async () => {
    answers = meAnswers({ [`GET ${INTRO}`]: ok(introView({ audioUrl: 'https://files.test/intro.mp3' })) });
    await boot({ onOpenVoiceIntro: jest.fn() });
    await screen.findByText('Lennox Emmanuel');
    await waitFor(() => expect(asked).toContain(`GET ${INTRO}`));
    expect(screen.queryByTestId('me-voice-intro')).toBeNull();
  });

  it('a read that fails draws no prompt, and a plain account is not even asked', async () => {
    answers = meAnswers({ [`GET ${INTRO}`]: refusal(500, 'Down') });
    await boot({ onOpenVoiceIntro: jest.fn() });
    await screen.findByText('Lennox Emmanuel');
    await waitFor(() => expect(asked).toContain(`GET ${INTRO}`));
    expect(screen.queryByTestId('me-voice-intro')).toBeNull();
  });

  it('a user account is not asked and draws no prompt; nor does a screen given no entry', async () => {
    answers = meAnswers({ [`GET ${ME}`]: ok(profile({ accountType: 'user' })) });
    await boot({ onOpenVoiceIntro: jest.fn() });
    await screen.findByText('Lennox Emmanuel');
    expect(asked).not.toContain(`GET ${INTRO}`);
    expect(screen.queryByTestId('me-voice-intro')).toBeNull();
  });
});
