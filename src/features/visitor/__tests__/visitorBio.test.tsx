/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

// The audio a screen plays: the test sees what it was asked to play, and drives the player's reports.
type SourceProps = { uri: string; playing: boolean; onTime: (position: number, length: number) => void; onEnded: () => void };
const mockSource = jest.fn();
jest.mock('@/features/feed/player', () => ({
  canPlay: true,
  AudioSource: (props: SourceProps) => {
    mockSource(props);
    return null;
  },
}));
const source = () => mockSource.mock.calls[mockSource.mock.calls.length - 1][0] as SourceProps;

type Answer = { status: number; body: unknown } | 'offline';
let answers: Record<string, Answer> = {};
let asked: string[] = [];

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  asked.push(`${request.method} ${url.pathname}${url.search}`);
  const answer = answers[`${request.method} ${url.pathname}${url.search}`] ?? answers[`${request.method} ${url.pathname}`];
  if (!answer) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const ok = (data: unknown, extra: Record<string, unknown> = {}) => ({ status: 200, body: { statusCode: 200, message: 'OK', data, ...extra } });

const { VisitorProfileScreen } = require('../VisitorProfileScreen') as typeof import('../VisitorProfileScreen');

// The person's id is a UUID on the Hub; the voice route takes it, never the handle the screen was opened with.
const PERSON = '3f2b1c8e-6d4a-4f7e-9a10-5c2d8e7b1a44';
const VISIT = '/api/hub/users/lennox/visitor-profile';
const GRID = `/api/hub/users/${PERSON}/content?page=1&perPage=18`;
const VOICE = `/api/hub/users/${PERSON}/voice-intro`;
const CLIP = 'https://files.test/voice/bio.mp3';

const view = (over: Record<string, unknown> = {}) => ({
  name: 'Lennox Emmanuel',
  own: false,
  following: false,
  profile: {
    wawuUserId: PERSON,
    handle: 'lennox',
    bio: 'Filmmaker and brand strategist. Teaching African creators.',
    avatarUrl: null,
    coverUrl: null,
    headline: 'Filmmaker and brand strategist',
    company: 'Lennox Films',
    instagramHandle: null,
    tiktokHandle: null,
    xHandle: null,
    youtubeUrl: null,
    facebookUrl: null,
    linkedinUrl: null,
    whatsappHandle: null,
    websiteUrl: null,
    interests: [],
    verification: { creator: { verified: true, expiresAt: '2027-01-01T00:00:00.000Z' }, professional: { verified: false, expiresAt: null } },
    experience: [],
    dmEnabled: true,
    dmPrice: 300,
    dmResponseHours: 24,
    evgScore: 0,
    contentCount: 48,
    followerCount: 12500,
    followingCount: 486,
    communityCount: 0,
  },
  fields: { wawuUserId: PERSON, location: 'Lagos, Nigeria', skills: [], openTo: [], threadsHandle: null, socialOrder: [], memberSince: '2025-03-10T09:00:00.000Z', badge: null },
  listings: [],
  ...over,
});

function page(extra: Record<string, Answer> = {}) {
  return {
    [`GET ${VISIT}`]: ok(view()),
    [`GET ${GRID}`]: ok([], { pagination: { currentPage: 1, nextPage: null } }),
    ...extra,
  } as Record<string, Answer>;
}

const frame = (children: React.ReactNode) => (
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } })}>{children}</QueryClientProvider>
  </SafeAreaProvider>
);

const boot = () =>
  render(frame(<VisitorProfileScreen wawuId="lennox" onBack={jest.fn()} onOwn={jest.fn()} onOpenAllWorks={jest.fn()} onOpenWork={jest.fn()} onOpenListing={jest.fn()} onBlocked={jest.fn()} />));

const settle = () =>
  act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

beforeEach(() => {
  mockSource.mockClear();
  answers = {};
  asked = [];
  jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('M5 · hearing someone\'s Voice Intro (FIX-103)', () => {
  it('a visitor can play a creator\'s Voice Intro from their profile: Bio and the AI voice tag, the Hub\'s audio, and Play, then Pause', async () => {
    answers = page({ [`GET ${VOICE}`]: ok({ voiceIntro: { url: CLIP, aiVoice: true } }) });
    await boot();
    expect(await screen.findByTestId('visitor-bio-player')).toBeTruthy();
    expect(screen.getByText('Bio')).toBeTruthy();
    expect(screen.getByText('AI voice')).toBeTruthy();
    expect(asked).toContain(`GET ${VOICE}`);
    expect(source().uri).toBe(CLIP);
    expect(source().playing).toBe(false);
    await act(async () => source().onTime(0, 22));
    await fireEvent.press(screen.getByTestId('visitor-bio-player-button'));
    expect(source().playing).toBe(true);
    expect(screen.getByLabelText('Pause Bio')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('visitor-bio-player-button'));
    expect(source().playing).toBe(false);
  });

  it('the player sits under the bio and above the counts and Follow', async () => {
    answers = page({ [`GET ${VOICE}`]: ok({ voiceIntro: { url: CLIP, aiVoice: true } }) });
    await boot();
    await screen.findByTestId('visitor-bio-player');
    const order = screen.toJSON() as unknown;
    const text = JSON.stringify(order);
    expect(text.indexOf('Teaching African creators.')).toBeGreaterThan(-1);
    expect(text.indexOf('visitor-bio-player')).toBeGreaterThan(text.indexOf('Teaching African creators.'));
    expect(text.indexOf('visitor-bio-player')).toBeLessThan(text.indexOf('followers'));
  });

  it('a creator with no Voice Intro shows no player, no Bio label and no dead Play button (R-47)', async () => {
    answers = page({ [`GET ${VOICE}`]: ok({ voiceIntro: null }) });
    await boot();
    await screen.findByTestId('me-name');
    await settle();
    expect(asked).toContain(`GET ${VOICE}`);
    expect(screen.queryByTestId('visitor-bio-player')).toBeNull();
    expect(screen.queryByText('Bio')).toBeNull();
    expect(screen.queryByLabelText(/Play Bio/)).toBeNull();
    expect(mockSource).not.toHaveBeenCalled();
  });

  it('a Voice Intro that did not load draws no player and leaves the rest of the profile alone', async () => {
    answers = page({ [`GET ${VOICE}`]: { status: 500, body: { statusCode: 500, message: 'Server error', data: null } } });
    await boot();
    expect(await screen.findByTestId('me-name')).toHaveTextContent('Lennox Emmanuel');
    await settle();
    expect(screen.queryByTestId('visitor-bio-player')).toBeNull();
    expect(screen.getByText('Follow')).toBeTruthy();
  });

  it('an answer that is not a Voice Intro view is refused, never drawn as a player', async () => {
    answers = page({ [`GET ${VOICE}`]: ok({ voiceIntro: { url: '' , aiVoice: true } }) });
    await boot();
    await screen.findByTestId('me-name');
    await settle();
    expect(screen.queryByTestId('visitor-bio-player')).toBeNull();
  });

  it('the Bio is not asked for a person the Hub hides, or for the visitor\'s own profile', async () => {
    answers = { [`GET ${VISIT}`]: { status: 404, body: { statusCode: 404, message: 'User not found', data: null } } };
    await boot();
    await screen.findByTestId('visitor-unavailable');
    expect(asked.filter((line) => line.includes('voice-intro'))).toEqual([]);
  });
});
