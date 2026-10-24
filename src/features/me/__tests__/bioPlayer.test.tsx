/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

// The audio a screen plays: the test sees what it was asked to play, and drives the player's reports (length, position, the end).
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
const report = (position: number, length: number) => act(async () => source().onTime(position, length));

type Answer = { status: number; body: unknown } | 'offline';
let answers: Record<string, Answer | Answer[]> = {};
let asked: string[] = [];

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  asked.push(`${request.method} ${url.pathname}${url.search}`);
  const queued = answers[`${request.method} ${url.pathname}${url.search}`] ?? answers[`${request.method} ${url.pathname}`];
  const answer = Array.isArray(queued) ? (queued.length > 1 ? queued.shift()! : queued[0]) : queued;
  if (!answer) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const ok = (data: unknown, extra: Record<string, unknown> = {}) => ({ status: 200, body: { statusCode: 200, message: 'OK', data, ...extra } });

const { BioPlayer, BIO_LOAD_PATIENCE_MS } = require('../BioPlayer') as typeof import('../BioPlayer');
const { MeScreen } = require('../MeScreen') as typeof import('../MeScreen');

const ME = '/api/hub/users/me';
const FIELDS = '/api/hub/users/me/profile-fields';
const STATS = '/api/hub/users/me/profile-stats';
const GRID = '/api/hub/users/u1/content?page=1&perPage=18';
const INTRO = '/api/hub/me/voice-intro';
const CLIP = 'https://files.test/voice/bio.mp3';

beforeEach(() => {
  mockSource.mockClear();
  answers = {};
  asked = [];
  jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('The Bio player (M1, M5; FIX-103)', () => {
  it('a person sees the clip\'s length before they press anything, with Bio and the AI voice tag, and the clip is not playing', async () => {
    await render(<BioPlayer url={CLIP} aiVoice testID="bio" />);
    expect(source().uri).toBe(CLIP);
    expect(source().playing).toBe(false);
    await report(0, 22);
    expect(screen.getByLabelText('Play Bio, 0:22')).toBeTruthy();
    expect(screen.getByText('0:22')).toBeTruthy();
    expect(screen.getByText('Bio')).toBeTruthy();
    expect(screen.getByText('AI voice')).toBeTruthy();
  });

  it('a person can press Play and hear it, see it fill as it plays, pause where it is, and play on from there', async () => {
    await render(<BioPlayer url={CLIP} aiVoice testID="bio" />);
    await report(0, 22);
    await fireEvent.press(screen.getByTestId('bio-button'));
    expect(source().playing).toBe(true);
    expect(screen.getByLabelText('Pause Bio')).toBeTruthy();
    await report(11, 22);
    expect(screen.getByTestId('bio-wave').props.accessibilityValue.now).toBe(50);
    await fireEvent.press(screen.getByTestId('bio-button'));
    expect(source().playing).toBe(false);
    expect(screen.getByLabelText('Play Bio, 0:22')).toBeTruthy();
    expect(screen.getByTestId('bio-wave').props.accessibilityValue.now).toBe(50);
    await fireEvent.press(screen.getByTestId('bio-button'));
    expect(source().playing).toBe(true);
  });

  it('Play pressed before the clip is in shows the busy player, and it plays when the clip arrives', async () => {
    await render(<BioPlayer url={CLIP} aiVoice testID="bio" />);
    await fireEvent.press(screen.getByTestId('bio-button'));
    expect(screen.getByLabelText('Loading Bio')).toBeTruthy();
    expect(screen.getByTestId('bio-spinner')).toBeTruthy();
    await report(0, 22);
    expect(screen.getByLabelText('Pause Bio')).toBeTruthy();
    expect(source().playing).toBe(true);
  });

  it('a clip that never comes in says it could not play, and a tap asks for it again', async () => {
    await render(<BioPlayer url={CLIP} aiVoice testID="bio" />);
    await fireEvent.press(screen.getByTestId('bio-button'));
    await act(async () => {
      jest.advanceTimersByTime(BIO_LOAD_PATIENCE_MS + 1);
    });
    expect(screen.getByText("Couldn't play this. Tap to try again.")).toBeTruthy();
    expect(source().playing).toBe(false);
    const callsBefore = mockSource.mock.calls.length;
    await fireEvent.press(screen.getByTestId('bio-button'));
    expect(mockSource.mock.calls.length).toBeGreaterThan(callsBefore);
    expect(source().playing).toBe(true);
    expect(screen.getByLabelText('Loading Bio')).toBeTruthy();
    await report(0, 22);
    expect(screen.getByLabelText('Pause Bio')).toBeTruthy();
  });

  it('when the clip ends the player is back at the start with Play, and Play plays it again', async () => {
    await render(<BioPlayer url={CLIP} aiVoice testID="bio" />);
    await report(0, 22);
    await fireEvent.press(screen.getByTestId('bio-button'));
    await report(21, 22);
    await act(async () => source().onEnded());
    expect(screen.getByLabelText('Play Bio, 0:22')).toBeTruthy();
    expect(screen.getByTestId('bio-wave').props.accessibilityValue.now).toBe(0);
    await fireEvent.press(screen.getByTestId('bio-button'));
    expect(source().playing).toBe(true);
  });

  it('the clip stops when another tab or screen comes in front, and does not start again when this one returns', async () => {
    const { rerender } = await render(<BioPlayer url={CLIP} aiVoice active testID="bio" />);
    await report(0, 22);
    await fireEvent.press(screen.getByTestId('bio-button'));
    expect(source().playing).toBe(true);
    await rerender(<BioPlayer url={CLIP} aiVoice active={false} testID="bio" />);
    expect(source().playing).toBe(false);
    await rerender(<BioPlayer url={CLIP} aiVoice active testID="bio" />);
    expect(source().playing).toBe(false);
    expect(screen.getByLabelText(/^Play Bio/)).toBeTruthy();
  });

  it('the AI voice tag is drawn only while the Hub says the audio is an AI voice', async () => {
    await render(<BioPlayer url={CLIP} aiVoice={false} testID="bio" />);
    expect(screen.getByText('Bio')).toBeTruthy();
    expect(screen.queryByText('AI voice')).toBeNull();
  });
});

describe('M1 · my own Voice Intro (FIX-103)', () => {
  const profile = (over: Record<string, unknown> = {}) => ({
    wawuUserId: 'u1',
    sub: 'u1',
    firstName: 'Lennox',
    middleName: null,
    lastName: 'Emmanuel',
    accountType: 'creator',
    handle: 'lennox',
    bio: 'Filmmaker and brand strategist.',
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
    verification: { creator: { verified: true, expiresAt: '2027-01-01T00:00:00.000Z' }, professional: { verified: false, expiresAt: null } },
    ...over,
  });
  const intro = (over: Record<string, unknown> = {}) => ({
    aiVoice: true,
    text: 'I shoot brand films for African founders.',
    textMaxChars: 500,
    consent: { line: 'This is my own voice.', given: true },
    sample: { recorded: true, minSeconds: 20, maxSeconds: 30 },
    audioUrl: CLIP,
    next: { free: true, costPoints: 0 },
    canGenerate: false,
    run: null,
    ...over,
  });
  const base = (over: Record<string, Answer | Answer[]> = {}) =>
    ({
      [`GET ${ME}`]: ok(profile()),
      [`GET ${FIELDS}`]: ok({ wawuUserId: 'u1', location: null, skills: [], openTo: [], threadsHandle: null, socialOrder: [], memberSince: null, badge: null }),
      [`GET ${STATS}`]: ok({ wawuUserId: 'u1', followerCount: 12, followingCount: 3, postCount: 2 }),
      [`GET ${GRID}`]: ok([], { pagination: { currentPage: 1, nextPage: null } }),
      'GET /api/hub/me/tier': ok({ state: 'none', tier: null }),
      'GET /api/hub/product-drafts': ok([]),
      ...over,
    }) as Record<string, Answer | Answer[]>;
  let client: QueryClient;
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
  });
  const frame = (children: React.ReactNode) => (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </SafeAreaProvider>
  );
  const boot = (props: Record<string, unknown> = {}) => render(frame(<MeScreen onEditProfile={jest.fn()} onAddWork={jest.fn()} onOpenWork={jest.fn()} onOpenSettings={jest.fn()} {...props} />));

  it('a creator whose Voice Intro is made hears it from their profile: the Bio player is under the bio and plays the Hub\'s audio', async () => {
    answers = base({ [`GET ${INTRO}`]: ok(intro()) });
    await boot();
    expect(await screen.findByTestId('me-bio-player')).toBeTruthy();
    expect(screen.getByText('Bio')).toBeTruthy();
    expect(screen.getByText('AI voice')).toBeTruthy();
    expect(source().uri).toBe(CLIP);
    expect(source().playing).toBe(false);
    await report(0, 22);
    await fireEvent.press(screen.getByTestId('me-bio-player-button'));
    expect(source().playing).toBe(true);
    expect(screen.queryByTestId('me-voice-intro')).toBeNull();
  });

  it('a creator with no Voice Intro made sees no player, never a dead one (R-47), and the prompt to make one when the screen can open it', async () => {
    answers = base({ [`GET ${INTRO}`]: ok(intro({ audioUrl: null, sample: { recorded: false, minSeconds: 20, maxSeconds: 30 } })) });
    await boot({ onOpenVoiceIntro: jest.fn() });
    expect(await screen.findByTestId('me-voice-intro')).toBeTruthy();
    expect(screen.queryByTestId('me-bio-player')).toBeNull();
    expect(screen.queryByText('Bio')).toBeNull();
    expect(mockSource).not.toHaveBeenCalled();
  });

  it('a Voice Intro that did not load draws no player', async () => {
    answers = base({ [`GET ${INTRO}`]: { status: 500, body: { statusCode: 500, message: 'Server error', data: null } } });
    await boot();
    await screen.findByTestId('me-name');
    await act(async () => {
      await Promise.resolve();
    });
    expect(asked).toContain(`GET ${INTRO}`);
    expect(screen.queryByTestId('me-bio-player')).toBeNull();
  });

  it('a plain account never asks for a Voice Intro and draws no player', async () => {
    answers = base({ [`GET ${ME}`]: ok(profile({ accountType: 'buyer' })), [`GET ${INTRO}`]: ok(intro()) });
    await boot();
    await screen.findByTestId('me-name');
    expect(asked).not.toContain(`GET ${INTRO}`);
    expect(screen.queryByTestId('me-bio-player')).toBeNull();
  });

  it('the clip stops when the Me tab is not in front', async () => {
    answers = base({ [`GET ${INTRO}`]: ok(intro()) });
    const view = await boot({ focused: true });
    await screen.findByTestId('me-bio-player');
    await report(0, 22);
    await fireEvent.press(screen.getByTestId('me-bio-player-button'));
    expect(source().playing).toBe(true);
    await view.rerender(frame(<MeScreen onEditProfile={jest.fn()} onAddWork={jest.fn()} onOpenWork={jest.fn()} onOpenSettings={jest.fn()} focused={false} />));
    expect(source().playing).toBe(false);
  });
});
