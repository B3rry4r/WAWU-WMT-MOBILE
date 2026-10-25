/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

// The audio a screen plays: the test sees what it was asked to play, and whether it was asked to play it.
const mockAudio = jest.fn();
jest.mock('@/features/feed/player', () => ({
  canPlay: true,
  AudioSource: (props: { uri: string; playing: boolean }) => {
    mockAudio(props);
    return null;
  },
}));

type Answer = { status: number; body: unknown } | 'offline' | 'hang';
let answers: Record<string, Answer | Answer[]> = {};
let sent: { method: string; path: string; body: unknown }[] = [];

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const text = request.method === 'GET' ? '' : await request.clone().text();
  sent.push({ method: request.method, path: url.pathname, body: text ? JSON.parse(text) : null });
  const queued = answers[`${request.method} ${url.pathname}`];
  const answer = Array.isArray(queued) ? (queued.length > 1 ? queued.shift()! : queued[0]) : queued;
  if (!answer) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
  if (answer === 'offline') throw new TypeError('Network request failed');
  if (answer === 'hang') return new Promise<Response>(() => undefined);
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const ok = (data: unknown) => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const refusal = (status: number, message: string, code?: string) => ({
  status,
  body: { statusCode: status, message, data: null, ...(code ? { reason: { code, message } } : {}) },
});

const { HearNameScreen } = require('../HearNameScreen') as typeof import('../HearNameScreen');
const { VoiceIntroScreen } = require('../VoiceIntroScreen') as typeof import('../VoiceIntroScreen');

const ME = '/api/hub/users/me';
const VOICE = '/api/hub/me/voice';
const PREVIEW = '/api/hub/me/voice/name-preview';
const NAME = '/api/hub/me/voice/name';
const INTRO = '/api/hub/me/voice-intro';
const INTRO_TEXT = '/api/hub/me/voice-intro/text';

const profile = (over: Record<string, unknown> = {}) => ({
  wawuUserId: 'u1',
  sub: 'u1',
  firstName: 'Lennox',
  middleName: null,
  lastName: 'Emmanuel',
  accountType: 'creator',
  handle: 'lennox',
  ...over,
});
const voiceView = (over: Record<string, unknown> = {}) => ({ namePhonetic: null, nameSavedAt: null, available: true, ...over });
const introView = (over: Record<string, unknown> = {}) => ({
  aiVoice: true,
  text: null,
  textMaxChars: 321,
  consent: { line: 'I agree this is my own voice.', given: false },
  sample: { recorded: false },
  audioUrl: null,
  next: { free: true, costPoints: 0 },
  canGenerate: false,
  run: null,
  ...over,
});

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
function frame(children: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
  return (
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </SafeAreaProvider>
  );
}

const lastAudio = () => mockAudio.mock.calls[mockAudio.mock.calls.length - 1]?.[0] as { uri: string; playing: boolean } | undefined;
const posts = (path: string) => sent.filter((call) => call.method !== 'GET' && call.path === path);

beforeEach(() => {
  answers = {};
  sent = [];
  mockAudio.mockClear();
});

async function bootName(over: Record<string, Answer | Answer[]> = {}) {
  answers = {
    [`GET ${ME}`]: ok(profile()),
    [`GET ${VOICE}`]: ok(voiceView()),
    [`POST ${PREVIEW}`]: ok({ audioUrl: 'https://files.test/name-1.mp3', aiVoice: true }),
    ...over,
  };
  const onWriteIntro = jest.fn();
  await render(frame(<HearNameScreen onBack={jest.fn()} onWriteIntro={onWriteIntro} />));
  return { onWriteIntro };
}

describe('VF3 · Hear your name', () => {
  it('says the profile name in the studio voice as it opens: the preview is asked for that name alone, and plays', async () => {
    await bootName();
    expect(await screen.findByText('Lennox Emmanuel')).toBeTruthy();
    await waitFor(() => expect(lastAudio()).toEqual(expect.objectContaining({ uri: 'https://files.test/name-1.mp3', playing: true })));
    expect(posts(PREVIEW)).toEqual([expect.objectContaining({ body: { name: 'Lennox Emmanuel' } })]);
    expect(screen.getByText('Said in a studio voice. Free.')).toBeTruthy();
    expect(screen.getByTestId('hear-name-wave')).toBeTruthy();
    expect(screen.getByLabelText('Pause')).toBeTruthy();
  });

  it('says the name the way the person kept it: the saved spelling goes with the preview', async () => {
    await bootName({ [`GET ${VOICE}`]: ok(voiceView({ namePhonetic: 'Leh-nox Em-man-yoo-el', nameSavedAt: '2026-10-19T10:00:00.000Z' })) });
    await screen.findByText('Lennox Emmanuel');
    await waitFor(() => expect(posts(PREVIEW)).toHaveLength(1));
    expect(posts(PREVIEW)[0].body).toEqual({ name: 'Lennox Emmanuel', phonetic: 'Leh-nox Em-man-yoo-el' });
  });

  it('"Sounds right" shows VF3b (the Saved chip and "Write my Voice Intro") without saving anything, and the button goes on to the Voice Intro (R2-AUTHME3)', async () => {
    const { onWriteIntro } = await bootName();
    await fireEvent.press(await screen.findByTestId('hear-name-right'));
    expect(onWriteIntro).not.toHaveBeenCalled();
    expect(await screen.findByTestId('hear-name-saved')).toBeTruthy();
    expect(screen.queryByTestId('hear-name-right')).toBeNull();
    expect(posts(NAME)).toHaveLength(0);
    await fireEvent.press(screen.getByTestId('hear-name-write'));
    expect(onWriteIntro).toHaveBeenCalledTimes(1);
  });

  it('VF3a and VF3b: "Not quite right?" opens the spelling, Play again says it, Save keeps it and shows Saved', async () => {
    const { onWriteIntro } = await bootName({ [`PUT ${NAME}`]: ok(voiceView({ namePhonetic: 'Leh-nox Em-man-yoo-el', nameSavedAt: '2026-10-20T10:00:00.000Z' })) });
    await fireEvent.press(await screen.findByTestId('hear-name-wrong'));
    const field = await screen.findByTestId('hear-name-spelling');
    expect(screen.getByText('Spell it how it sounds')).toBeTruthy();
    expect(screen.getByText('Use hyphens between sounds')).toBeTruthy();
    // The field starts from the plain name, and the big name follows what is typed.
    expect(field.props.value).toBe('Lennox Emmanuel');
    await fireEvent.changeText(field, 'Leh-nox Em-man-yoo-el');
    expect(screen.getByTestId('hear-name-name').props.children).toBe('Leh-nox Em-man-yoo-el');

    answers[`POST ${PREVIEW}`] = ok({ audioUrl: 'https://files.test/name-2.mp3', aiVoice: true });
    await fireEvent.press(screen.getByTestId('hear-name-again'));
    await waitFor(() => expect(lastAudio()).toEqual(expect.objectContaining({ uri: 'https://files.test/name-2.mp3', playing: true })));
    expect(posts(PREVIEW)[1].body).toEqual({ name: 'Lennox Emmanuel', phonetic: 'Leh-nox Em-man-yoo-el' });

    await fireEvent.press(screen.getByTestId('hear-name-save'));
    expect(await screen.findByTestId('hear-name-saved')).toBeTruthy();
    expect(posts(NAME)).toEqual([expect.objectContaining({ body: { phonetic: 'Leh-nox Em-man-yoo-el' } })]);
    // VF3b draws the plain name, the Saved pill and the way on.
    expect(screen.getByTestId('hear-name-name').props.children).toBe('Lennox Emmanuel');
    await fireEvent.press(screen.getByTestId('hear-name-write'));
    expect(onWriteIntro).toHaveBeenCalledTimes(1);
  });

  it('Save is off while the spelling is empty, and a refused save says why under the field', async () => {
    await bootName({ [`PUT ${NAME}`]: refusal(500, 'Something broke.') });
    await fireEvent.press(await screen.findByTestId('hear-name-wrong'));
    const field = await screen.findByTestId('hear-name-spelling');
    await fireEvent.changeText(field, '   ');
    expect(screen.getByTestId('hear-name-save').props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(field, 'Len-nox');
    await fireEvent.press(screen.getByTestId('hear-name-save'));
    expect(await screen.findByText('Something went wrong. Try again.')).toBeTruthy();
    expect(screen.queryByTestId('hear-name-saved')).toBeNull();
  });

  it('the hourly limit on previews says so in the Hub\'s words and the disc tries again when pressed', async () => {
    const limit = 'You have heard your name a lot in the last hour. Try again a little later.';
    await bootName({ [`POST ${PREVIEW}`]: refusal(429, limit, 'voice_preview_limit') });
    expect(await screen.findByText(limit)).toBeTruthy();
    expect(screen.getByLabelText('Try again')).toBeTruthy();
    expect(screen.queryByTestId('hear-name-wave')).toBeNull();
    answers[`POST ${PREVIEW}`] = ok({ audioUrl: 'https://files.test/name-3.mp3', aiVoice: true });
    await fireEvent.press(screen.getByTestId('hear-name-disc'));
    await waitFor(() => expect(lastAudio()).toEqual(expect.objectContaining({ uri: 'https://files.test/name-3.mp3', playing: true })));
    expect(screen.queryByText(limit)).toBeNull();
  });

  it('the Hub\'s general throttle (a 429 with no voice code) says to wait a moment, not that something broke', async () => {
    await bootName({ [`POST ${PREVIEW}`]: refusal(429, 'ThrottlerException: Too Many Requests') });
    expect(await screen.findByText('Too many tries. Wait a moment and try again.')).toBeTruthy();
    expect(screen.getByLabelText('Try again')).toBeTruthy();
  });

  it('voices off on the Hub (available false, or a 503 on the preview) says so and draws no play button', async () => {
    await bootName({ [`GET ${VOICE}`]: ok(voiceView({ available: false })) });
    expect(await screen.findByText('Voices are not available right now')).toBeTruthy();
    expect(screen.queryByTestId('hear-name-disc')).toBeNull();
    expect(posts(PREVIEW)).toHaveLength(0);
  });

  it('a 503 voice_unavailable on the preview turns the screen to the same message', async () => {
    await bootName({ [`POST ${PREVIEW}`]: refusal(503, 'Voices are not available right now. No points were taken.', 'voice_unavailable') });
    expect(await screen.findByText('Voices are not available right now')).toBeTruthy();
    expect(screen.queryByTestId('hear-name-disc')).toBeNull();
  });

  it('a profile that does not load shows the error with Try again, and loads on the retry', async () => {
    await bootName({ [`GET ${ME}`]: [refusal(500, 'Down'), ok(profile())] });
    expect(await screen.findByTestId('hear-name-error')).toBeTruthy();
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByText('Lennox Emmanuel')).toBeTruthy();
  });

  it('while the profile and voice are on their way it shows the loading state and no play button', async () => {
    await bootName({ [`GET ${VOICE}`]: 'hang' });
    expect(await screen.findByTestId('hear-name-loading')).toBeTruthy();
    expect(screen.queryByTestId('hear-name-disc')).toBeNull();
  });
});

async function bootIntro(over: Record<string, Answer | Answer[]> = {}, onHear: () => Promise<void> = async () => undefined) {
  answers = { [`GET ${ME}`]: ok(profile()), [`GET ${INTRO}`]: ok(introView()), ...over };
  await render(frame(<VoiceIntroScreen onBack={jest.fn()} onHearInMyVoice={onHear} />));
}

describe('VF4 · Write your Voice Intro', () => {
  it('VF4a: empty, the button is off, the count and its limit are the Hub\'s, the placeholder uses the first name', async () => {
    await bootIntro();
    const box = await screen.findByTestId('voice-intro-text');
    expect(box.props.value).toBe('');
    expect(box.props.placeholder).toBe("Hi, I'm Lennox. I help…");
    expect(screen.getByTestId('voice-intro-count').props.children).toBe('0 / 321');
    expect(screen.getByTestId('voice-intro-hear').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText('A few lines about you or your service. Buyers hear it on your profile.')).toBeTruthy();
    // The board's "About 20 seconds when read" has nothing behind it, so it is not drawn.
    expect(screen.queryByText(/seconds when read/)).toBeNull();
  });

  it('shows the words the Hub already keeps, and goes on without sending them again', async () => {
    const hear = jest.fn(async () => undefined);
    await bootIntro({ [`GET ${INTRO}`]: ok(introView({ text: 'I shoot brand films.' })) }, hear);
    const box = await screen.findByTestId('voice-intro-text');
    expect(box.props.value).toBe('I shoot brand films.');
    expect(screen.getByTestId('voice-intro-count').props.children).toBe('20 / 321');
    await fireEvent.press(screen.getByTestId('voice-intro-hear'));
    await waitFor(() => expect(hear).toHaveBeenCalledTimes(1));
    expect(posts(INTRO_TEXT)).toHaveLength(0);
  });

  it('VF4: typing turns the button on; it keeps the words, then hands on', async () => {
    const hear = jest.fn(async () => undefined);
    await bootIntro({ [`PUT ${INTRO_TEXT}`]: ok(introView({ text: 'I teach pricing.' })) }, hear);
    const box = await screen.findByTestId('voice-intro-text');
    await fireEvent.changeText(box, 'I teach pricing.');
    expect(screen.getByTestId('voice-intro-count').props.children).toBe('16 / 321');
    expect(screen.getByTestId('voice-intro-hear').props.accessibilityState.disabled).toBe(false);
    await fireEvent.press(screen.getByTestId('voice-intro-hear'));
    await waitFor(() => expect(hear).toHaveBeenCalledTimes(1));
    expect(posts(INTRO_TEXT)).toEqual([expect.objectContaining({ body: { text: 'I teach pricing.' } })]);
  });

  it('VF4b: over the Hub\'s limit the line says to cut a sentence, the count is over, and the button stays off', async () => {
    const hear = jest.fn(async () => undefined);
    await bootIntro({}, hear);
    const box = await screen.findByTestId('voice-intro-text');
    await fireEvent.changeText(box, 'x'.repeat(322));
    expect(screen.getByText('Too long for a Voice Intro. Cut a sentence.')).toBeTruthy();
    expect(screen.getByTestId('voice-intro-count').props.children).toBe('322 / 321');
    expect(screen.getByTestId('voice-intro-hear').props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(screen.getByTestId('voice-intro-hear'));
    expect(hear).not.toHaveBeenCalled();
    expect(posts(INTRO_TEXT)).toHaveLength(0);
    // Exactly at the limit is fine.
    await fireEvent.changeText(box, 'x'.repeat(321));
    expect(screen.queryByText('Too long for a Voice Intro. Cut a sentence.')).toBeNull();
    expect(screen.getByTestId('voice-intro-hear').props.accessibilityState.disabled).toBe(false);
  });

  it('words that are only spaces count as nothing: the button stays off', async () => {
    await bootIntro();
    await fireEvent.changeText(await screen.findByTestId('voice-intro-text'), '     ');
    expect(screen.getByTestId('voice-intro-count').props.children).toBe('0 / 321');
    expect(screen.getByTestId('voice-intro-hear').props.accessibilityState.disabled).toBe(true);
  });

  it('the Hub refusing the words as too long (its limit moved) says so in its words and hands nowhere', async () => {
    const hear = jest.fn(async () => undefined);
    await bootIntro({ [`PUT ${INTRO_TEXT}`]: refusal(400, 'Your Voice Intro can have up to 300 characters.', 'voice_text_too_long') }, hear);
    await fireEvent.changeText(await screen.findByTestId('voice-intro-text'), 'A fine intro.');
    await fireEvent.press(screen.getByTestId('voice-intro-hear'));
    expect(await screen.findByText('Your Voice Intro can have up to 300 characters.')).toBeTruthy();
    expect(hear).not.toHaveBeenCalled();
  });

  it('a plan that cannot be read says so under the box, keeps the words and lets the person press again', async () => {
    const hear = jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
    await bootIntro({ [`PUT ${INTRO_TEXT}`]: ok(introView({ text: 'Hello there.' })) }, hear);
    await fireEvent.changeText(await screen.findByTestId('voice-intro-text'), 'Hello there.');
    await fireEvent.press(screen.getByTestId('voice-intro-hear'));
    expect(await screen.findByText('We could not check your plan. Try again.')).toBeTruthy();
    expect(screen.getByTestId('voice-intro-text').props.value).toBe('Hello there.');
    await fireEvent.press(screen.getByTestId('voice-intro-hear'));
    await waitFor(() => expect(hear).toHaveBeenCalledTimes(2));
  });

  it('an answer with no limit is refused: the screen shows the error, never a limit of its own', async () => {
    const view = introView();
    delete (view as Record<string, unknown>).textMaxChars;
    await bootIntro({ [`GET ${INTRO}`]: ok(view) });
    expect(await screen.findByTestId('voice-intro-error')).toBeTruthy();
    expect(screen.queryByTestId('voice-intro-count')).toBeNull();
  });

  it('a Voice Intro that does not load shows the error with Try again; it is the loading state until then', async () => {
    await bootIntro({ [`GET ${INTRO}`]: [refusal(500, 'Down'), ok(introView())] });
    expect(await screen.findByTestId('voice-intro-error')).toBeTruthy();
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByTestId('voice-intro-text')).toBeTruthy();
  });

  it('while it loads, the loading state draws and no button', async () => {
    await bootIntro({ [`GET ${INTRO}`]: 'hang' });
    expect(await screen.findByTestId('voice-intro-loading')).toBeTruthy();
    expect(screen.queryByTestId('voice-intro-hear')).toBeNull();
  });
});
