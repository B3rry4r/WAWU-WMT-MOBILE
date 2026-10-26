/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

// The audio a screen plays: the test sees what it was asked to play.
const mockAudio = jest.fn();
jest.mock('@/features/feed/player', () => ({
  canPlay: true,
  AudioSource: (props: { uri: string; playing: boolean }) => {
    mockAudio(props);
    return null;
  },
}));

// The microphone: a recorder the test drives (the take's length, where the file is) and a permission it can refuse.
type Snapshot = { isRecording: boolean; durationMillis: number; canRecord: boolean; mediaServicesDidReset: boolean; url: string | null };
let mockSnapshot: Snapshot = { isRecording: false, durationMillis: 0, canRecord: false, mediaServicesDidReset: false, url: null };
const mockListeners = new Set<(next: Snapshot) => void>();
const mockEmit = async (next: Partial<Snapshot>) => {
  mockSnapshot = { ...mockSnapshot, ...next };
  await act(async () => {
    mockListeners.forEach((listener) => listener(mockSnapshot));
  });
};
/** How many recordings are running: a `record` adds one, a `stop` takes one away. More than one is a microphone left recording. */
let mockActive = 0;
const mockRecorder = {
  currentTime: 0,
  uri: null as string | null,
  prepareToRecordAsync: jest.fn(async () => undefined),
  record: jest.fn(() => {
    mockActive += 1;
    mockSnapshot = { ...mockSnapshot, isRecording: true };
  }),
  stop: jest.fn(async () => {
    mockActive = Math.max(0, mockActive - 1);
    mockRecorder.uri = 'file:///recordings/take.m4a';
    mockSnapshot = { ...mockSnapshot, isRecording: false };
  }),
};
const mockPermission = jest.fn(async () => ({ granted: true, canAskAgain: true, status: 'granted', expires: 'never' }));
jest.mock('expo-audio', () => {
  const React = require('react');
  return {
    RecordingPresets: { HIGH_QUALITY: {} },
    requestRecordingPermissionsAsync: () => mockPermission(),
    setAudioModeAsync: jest.fn(async () => undefined),
    useAudioRecorder: () => mockRecorder,
    useAudioRecorderState: () => {
      const [state, setState] = React.useState(mockSnapshot);
      React.useEffect(() => {
        mockListeners.add(setState);
        return () => {
          mockListeners.delete(setState);
        };
      }, []);
      return state;
    },
  };
});

type Answer = { status: number; body: unknown } | 'offline' | 'hang';
let answers: Record<string, Answer | Answer[]> = {};
type Call = { method: string; path: string; body: unknown; key: string | null };
let sent: Call[] = [];

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const text = request.method === 'GET' || request.method === 'PUT' ? '' : await request.clone().text();
  sent.push({ method: request.method, path: url.pathname, body: text ? JSON.parse(text) : null, key: request.headers.get('idempotency-key') });
  const queued = answers[`${request.method} ${url.pathname}`];
  const answer = Array.isArray(queued) ? (queued.length > 1 ? queued.shift()! : queued[0]) : queued;
  if (!answer) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
  if (answer === 'offline') throw new TypeError('Network request failed');
  if (answer === 'hang') return new Promise<Response>(() => undefined);
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const ok = (data: unknown, status = 200) => ({ status, body: { statusCode: status, message: 'OK', data } });
const refusal = (status: number, message: string, code?: string) => ({
  status,
  body: { statusCode: status, message, data: null, ...(code ? { reason: { code, message } } : {}) },
});

const { VoiceConsentScreen } = require('../VoiceConsentScreen') as typeof import('../VoiceConsentScreen');
const model = require('../voiceModel') as typeof import('../voiceModel');

const ME = '/api/hub/users/me';
const VOICE = '/api/hub/me/voice';
const INTRO = '/api/hub/me/voice-intro';
const CONSENT = `${INTRO}/consent`;
const SAMPLE = `${INTRO}/sample`;
const GENERATE = `${INTRO}/generate`;
const PRESIGN = '/api/hub/uploads/presign';
const CONFIRM = '/api/hub/uploads/confirm';
const FILE = '/recordings/take.m4a';
const UPLOAD = '/up/take.m4a';

const WORDS = 'I shoot brand films for African founders.';
/** What the Hub serves as `consent.line` (FIX-95): the board's words with the person's own name. The app prints it as served. */
const HUB_LINE = 'I am Lennox Emmanuel. I agree that Who Made This? may create an AI version of my voice for my intros.';
/** The shortest and longest recording, as the Hub serves them (`voice_intro.sample_min_seconds` and `_max_seconds`). */
const BOUNDS = { minSeconds: 15, maxSeconds: 30 };
const profile = (over: Record<string, unknown> = {}) => ({
  wawuUserId: 'u1',
  sub: 'u1',
  firstName: 'Lennox',
  middleName: null,
  lastName: 'Emmanuel',
  accountType: 'creator',
  handle: 'lennox',
  avatarUrl: null,
  ...over,
});
const voiceView = (over: Record<string, unknown> = {}) => ({ namePhonetic: null, nameSavedAt: null, available: true, ...over });
const run = (over: Record<string, unknown> = {}) => ({ id: 'r1', state: 'working', costPoints: 0, included: true, message: null, createdAt: '2026-10-20T10:00:00.000Z', finishedAt: null, ...over });
const introView = (over: Record<string, unknown> = {}) => ({
  aiVoice: true,
  text: WORDS,
  textMaxChars: 500,
  consent: { line: HUB_LINE, given: false },
  sample: { recorded: false, ...BOUNDS },
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

const calls = (method: string, path: string) => sent.filter((call) => call.method === method && call.path === path);
const lastAudio = () => mockAudio.mock.calls[mockAudio.mock.calls.length - 1]?.[0] as { uri: string; playing: boolean } | undefined;

beforeEach(() => {
  answers = {};
  sent = [];
  mockAudio.mockClear();
  mockListeners.clear();
  mockSnapshot = { isRecording: false, durationMillis: 0, canRecord: false, mediaServicesDidReset: false, url: null };
  mockActive = 0;
  mockRecorder.currentTime = 0;
  mockRecorder.uri = null;
  mockRecorder.prepareToRecordAsync.mockClear();
  mockRecorder.record.mockClear();
  mockRecorder.stop.mockClear();
  mockPermission.mockClear();
  mockPermission.mockImplementation(async () => ({ granted: true, canAskAgain: true, status: 'granted', expires: 'never' }));
});

/** The whole sending path answered: the presign, the file, the PUT, the confirm, the sample and the try. */
function sendingAnswers(over: Record<string, Answer | Answer[]> = {}) {
  return {
    [`GET ${FILE}`]: ok('bytes'),
    [`POST ${PRESIGN}`]: ok({ uploadUrl: `https://files.test${UPLOAD}`, key: 'k1', fileUrl: 'https://files.test/voice/sample/u1/take.m4a' }),
    [`PUT ${UPLOAD}`]: { status: 200, body: {} },
    [`POST ${CONFIRM}`]: ok({ key: 'k1', status: 'confirmed' }),
    [`POST ${SAMPLE}`]: ok(introView({ consent: { line: HUB_LINE, given: true }, sample: { recorded: true, ...BOUNDS } })),
    [`POST ${GENERATE}`]: ok(introView({ consent: { line: HUB_LINE, given: true }, sample: { recorded: true, ...BOUNDS }, run: run() }), 202),
    ...over,
  } as Record<string, Answer | Answer[]>;
}

async function boot(over: Record<string, Answer | Answer[]> = {}) {
  answers = {
    [`GET ${ME}`]: ok(profile()),
    [`GET ${VOICE}`]: ok(voiceView()),
    [`GET ${INTRO}`]: ok(introView()),
    [`POST ${CONSENT}`]: ok(introView({ consent: { line: HUB_LINE, given: true } })),
    ...sendingAnswers(),
    ...over,
  };
  const props = { onBack: jest.fn(), onWriteText: jest.fn(), onUse: jest.fn() };
  await render(frame(<VoiceConsentScreen {...props} />));
  return props;
}

/** Past VF8: agreed, and on the recording screen. */
async function toRecording(over: Record<string, Answer | Answer[]> = {}) {
  const props = await boot(over);
  await fireEvent.press(await screen.findByTestId('voice-consent-agree'));
  await screen.findByTestId('voice-take-screen');
  return props;
}

/** A take of `seconds`: Start, the recorder runs to that length, Stop. */
async function record(seconds: number) {
  await fireEvent.press(screen.getByTestId('voice-take-record'));
  await waitFor(() => expect(mockRecorder.record).toHaveBeenCalled());
  await mockEmit({ isRecording: true, durationMillis: seconds * 1000 });
  mockRecorder.currentTime = seconds;
  await waitFor(() => expect(screen.getByTestId('voice-take-record').props.accessibilityLabel).toBe('Stop recording'));
  await fireEvent.press(screen.getByTestId('voice-take-record'));
}

describe('VF8 · Your voice, your consent', () => {
  it('reads the board\'s line with the name from the Hub, and the points the Hub backs (not "delete it any time")', async () => {
    await boot();
    expect(await screen.findByTestId('voice-consent-line')).toHaveTextContent(
      '“I am Lennox Emmanuel. I agree that Who Made This? may create an AI version of my voice for my intros.”',
    );
    expect(screen.getByText("You'll read this first")).toBeTruthy();
    expect(screen.getByText('Only you, the account owner, can do this')).toBeTruthy();
    expect(screen.getByText('Only with your own voice')).toBeTruthy();
    expect(screen.getByText('Your AI voice is only used for your intros')).toBeTruthy();
    expect(screen.queryByText(/Delete it any time/)).toBeNull();
    expect(screen.getByText('I agree, start recording')).toBeTruthy();
  });

  it('prints consent.line exactly as served, whatever its words, and sends back those same words', async () => {
    const served = 'I am Lennox Emmanuel. These are the words the Hub serves today.';
    await boot({
      [`GET ${INTRO}`]: ok(introView({ consent: { line: served, given: false } })),
      [`POST ${CONSENT}`]: ok(introView({ consent: { line: served, given: true } })),
    });
    expect(await screen.findByTestId('voice-consent-line')).toHaveTextContent(`\u201C${served}\u201D`);
    expect(screen.queryByText(/Who Made This\?/)).toBeNull();
    await fireEvent.press(screen.getByTestId('voice-consent-agree'));
    await screen.findByTestId('voice-take-screen');
    expect(calls('POST', CONSENT)).toEqual([expect.objectContaining({ body: { line: served } })]);
    expect(screen.getByTestId('voice-take-script')).toHaveTextContent(`${served} ${WORDS}`);
  });

  it('an answer without the consent line or the recording lengths is refused, never drawn with numbers of the app\'s own', async () => {
    answers = {
      [`GET ${ME}`]: ok(profile()),
      [`GET ${VOICE}`]: ok(voiceView()),
      [`GET ${INTRO}`]: ok({ ...introView(), sample: { recorded: false } }),
    };
    await render(frame(<VoiceConsentScreen onBack={jest.fn()} onWriteText={jest.fn()} onUse={jest.fn()} />));
    expect(await screen.findByTestId('voice-consent-error')).toBeTruthy();
    expect(screen.queryByTestId('voice-consent-agree')).toBeNull();
  });

  it('agreeing stores the Hub\'s own line through the consent route, then opens the recording', async () => {
    await boot();
    await fireEvent.press(await screen.findByTestId('voice-consent-agree'));
    await screen.findByTestId('voice-take-screen');
    expect(calls('POST', CONSENT)).toEqual([expect.objectContaining({ body: { line: HUB_LINE } })]);
    expect(screen.getByText('Record 30 seconds')).toBeTruthy();
  });

  it('a Hub that refused the consent says so in its words and stays on VF8; a changed line is read again', async () => {
    const changed = 'The words you agree to have changed. Read them again and agree.';
    await boot({ [`POST ${CONSENT}`]: refusal(409, changed, 'voice_consent_line_changed') });
    await fireEvent.press(await screen.findByTestId('voice-consent-agree'));
    expect(await screen.findByText(changed)).toBeTruthy();
    expect(screen.queryByTestId('voice-take-screen')).toBeNull();
    await waitFor(() => expect(calls('GET', INTRO).length).toBeGreaterThan(1));
  });

  it('a read still waiting shows the loading state, and nothing to agree to', async () => {
    answers = { [`GET ${ME}`]: ok(profile()), [`GET ${VOICE}`]: ok(voiceView()), [`GET ${INTRO}`]: 'hang' };
    await render(frame(<VoiceConsentScreen onBack={jest.fn()} onWriteText={jest.fn()} onUse={jest.fn()} />));
    expect(await screen.findByTestId('voice-consent-loading')).toBeTruthy();
    expect(screen.queryByTestId('voice-consent-agree')).toBeNull();
  });

  it('a failed read says so with Try again, which reads it again', async () => {
    answers = { [`GET ${ME}`]: ok(profile()), [`GET ${VOICE}`]: ok(voiceView()), [`GET ${INTRO}`]: refusal(500, 'Boom') };
    await render(frame(<VoiceConsentScreen onBack={jest.fn()} onWriteText={jest.fn()} onUse={jest.fn()} />));
    expect(await screen.findByTestId('voice-consent-error')).toBeTruthy();
    answers[`GET ${INTRO}`] = ok(introView());
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByTestId('voice-consent-line')).toBeTruthy();
  });

  it('voices off on the Hub says so and offers no agreement', async () => {
    await boot({ [`GET ${VOICE}`]: ok(voiceView({ available: false })) });
    expect(await screen.findByTestId('voice-consent-off')).toBeTruthy();
    expect(screen.queryByTestId('voice-consent-agree')).toBeNull();
  });

  it('words not written yet send the person to write them first (VF4), never to a recording with nothing to read', async () => {
    const props = await boot({ [`GET ${INTRO}`]: ok(introView({ text: null })) });
    expect(await screen.findByText('Write your Voice Intro first')).toBeTruthy();
    expect(screen.queryByTestId('voice-consent-agree')).toBeNull();
    await fireEvent.press(screen.getByText('Write my Voice Intro'));
    expect(props.onWriteText).toHaveBeenCalledTimes(1);
  });
});

describe('VF9 · Record 30 seconds', () => {
  it('shows the script (the consent line, then the person\'s words), a ring at 0:00 of 0:30 and the quiet-room line', async () => {
    await toRecording();
    expect(screen.getByTestId('voice-take-script')).toHaveTextContent(
      `I am Lennox Emmanuel. I agree that Who Made This? may create an AI version of my voice for my intros. ${WORDS}`,
    );
    expect(screen.getByTestId('voice-take-ring-clock')).toHaveTextContent('0:00');
    expect(screen.getByText('of 0:30')).toBeTruthy();
    expect(screen.getByText('Find a quiet room.')).toBeTruthy();
    expect(screen.queryByText('Redo')).toBeNull();
  });

  it('the title, the ring and the shortest take follow the Hub\'s lengths, not 30 and 15', async () => {
    const bounds = { minSeconds: 10, maxSeconds: 20 };
    await toRecording({
      [`GET ${INTRO}`]: ok(introView({ sample: { recorded: false, ...bounds } })),
      [`POST ${CONSENT}`]: ok(introView({ consent: { line: HUB_LINE, given: true }, sample: { recorded: false, ...bounds } })),
    });
    expect(screen.getByText('Record 20 seconds')).toBeTruthy();
    expect(screen.getByText('of 0:20')).toBeTruthy();
    await record(9);
    expect(await screen.findByText('Too short. Read the whole script.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Redo'));
    await record(12);
    expect(await screen.findByTestId('voice-take-got')).toBeTruthy();
  });

  it('VF9a: the recorder starts after the microphone is allowed, the ring runs and the line says to read at a normal pace', async () => {
    await toRecording();
    await fireEvent.press(screen.getByTestId('voice-take-record'));
    await waitFor(() => expect(mockRecorder.record).toHaveBeenCalledTimes(1));
    expect(mockPermission).toHaveBeenCalledTimes(1);
    await mockEmit({ isRecording: true, durationMillis: 14_300 });
    expect(await screen.findByText('Recording. Read at your normal pace.')).toBeTruthy();
    expect(screen.getByTestId('voice-take-ring-clock')).toHaveTextContent('0:14');
    expect(screen.getByText('Redo')).toBeTruthy();
  });

  it('VF9b: a take under the shortest is refused with the reason, the ring turns red and nothing is sent', async () => {
    await toRecording();
    await record(8);
    expect(await screen.findByText('Too short. Read the whole script.')).toBeTruthy();
    expect(screen.getByTestId('voice-take-ring-clock')).toHaveTextContent('0:08');
    expect(screen.queryByTestId('voice-take-use')).toBeNull();
    expect(calls('POST', PRESIGN)).toHaveLength(0);
    // Redo, or the record button, starts a new take.
    await fireEvent.press(screen.getByText('Redo'));
    expect(await screen.findByText('Find a quiet room.')).toBeTruthy();
    expect(screen.getByTestId('voice-take-ring-clock')).toHaveTextContent('0:00');
  });

  it('M1: Redo while recording stops and releases the recording, so record again leaves exactly one running', async () => {
    await toRecording();
    await fireEvent.press(screen.getByTestId('voice-take-record'));
    await waitFor(() => expect(mockRecorder.record).toHaveBeenCalledTimes(1));
    await mockEmit({ isRecording: true, durationMillis: 3_000 });
    await waitFor(() => expect(screen.getByTestId('voice-take-record').props.accessibilityLabel).toBe('Stop recording'));
    expect(mockActive).toBe(1);

    await fireEvent.press(screen.getByText('Redo'));
    // The microphone is let go before the screen says ready again.
    await waitFor(() => expect(mockRecorder.stop).toHaveBeenCalledTimes(1));
    expect(mockActive).toBe(0);
    expect(await screen.findByText('Find a quiet room.')).toBeTruthy();
    expect(screen.getByTestId('voice-take-ring-clock')).toHaveTextContent('0:00');

    await fireEvent.press(screen.getByTestId('voice-take-record'));
    await waitFor(() => expect(mockRecorder.record).toHaveBeenCalledTimes(2));
    expect(mockActive).toBe(1);
    // The first recording was stopped before the second began.
    expect(mockRecorder.stop.mock.invocationCallOrder[0]).toBeLessThan(mockRecorder.record.mock.invocationCallOrder[1]);
  });

  it('VF9c: a take long enough shows Got it with Redo and Use this; Redo goes back to a clean take', async () => {
    await toRecording();
    await record(24);
    expect(await screen.findByTestId('voice-take-got')).toBeTruthy();
    expect(screen.getByTestId('voice-take-ring-clock')).toHaveTextContent('0:24');
    expect(screen.getByText('Use this')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('voice-take-redo'));
    expect(await screen.findByText('Find a quiet room.')).toBeTruthy();
    expect(screen.queryByTestId('voice-take-got')).toBeNull();
  });

  it('a take that reaches 0:30 stops itself', async () => {
    await toRecording();
    await fireEvent.press(screen.getByTestId('voice-take-record'));
    await waitFor(() => expect(mockRecorder.record).toHaveBeenCalled());
    mockRecorder.currentTime = 30;
    await mockEmit({ isRecording: true, durationMillis: 30_000 });
    expect(await screen.findByTestId('voice-take-got')).toBeTruthy();
    expect(mockRecorder.stop).toHaveBeenCalledTimes(1);
  });

  it('Use this sends the recording the Hub\'s way: presign (voice/sample, the exact size), the PUT, confirm, the sample, then one keyed try', async () => {
    await toRecording();
    await record(24);
    await fireEvent.press(await screen.findByTestId('voice-take-use'));
    expect(await screen.findByTestId('voice-making-screen')).toBeTruthy();
    const presign = calls('POST', PRESIGN)[0].body as { folder: string; contentType: string; extension: string; contentLength: number };
    expect(presign).toEqual({ folder: 'voice/sample', contentType: 'audio/mp4', extension: 'm4a', contentLength: expect.any(Number) });
    expect(presign.contentLength).toBeGreaterThan(0);
    expect(calls('PUT', UPLOAD)).toHaveLength(1);
    expect(calls('POST', CONFIRM)[0].body).toEqual({ key: 'https://files.test/voice/sample/u1/take.m4a' });
    expect(calls('POST', SAMPLE)[0].body).toEqual({ fileUrl: 'https://files.test/voice/sample/u1/take.m4a' });
    const tries = calls('POST', GENERATE);
    expect(tries).toHaveLength(1);
    expect(tries[0].key).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
  });

  it('a refused try (no points) says the Hub\'s words under the ring and keeps the take; Use this again does not send the file twice', async () => {
    const noPoints = 'You need 200 points to make this. No points were taken.';
    await toRecording({ [`POST ${GENERATE}`]: [refusal(402, noPoints, 'insufficient_points'), ok(introView({ run: run() }), 202)] });
    await record(24);
    await fireEvent.press(await screen.findByTestId('voice-take-use'));
    expect(await screen.findByTestId('voice-take-failure')).toHaveTextContent(noPoints);
    expect(screen.getByTestId('voice-take-ring-clock')).toHaveTextContent('0:24');
    await fireEvent.press(screen.getByTestId('voice-take-use'));
    expect(await screen.findByTestId('voice-making-screen')).toBeTruthy();
    expect(calls('PUT', UPLOAD)).toHaveLength(1);
    expect(calls('POST', SAMPLE)).toHaveLength(1);
    const keys = calls('POST', GENERATE).map((call) => call.key);
    expect(keys).toHaveLength(2);
    // The Hub answered the first, so the second is a new try with a new key.
    expect(keys[1]).not.toBe(keys[0]);
  });

  it('no answer from the Hub to the try keeps the same key, so a repeat cannot take points twice', async () => {
    await toRecording({ [`POST ${GENERATE}`]: ['offline', ok(introView({ run: run() }), 202)] });
    await record(24);
    await fireEvent.press(await screen.findByTestId('voice-take-use'));
    expect(await screen.findByTestId('voice-take-failure')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('voice-take-use'));
    expect(await screen.findByTestId('voice-making-screen')).toBeTruthy();
    const keys = calls('POST', GENERATE).map((call) => call.key);
    expect(keys[1]).toBe(keys[0]);
  });

  it('a recording the Hub cannot use says so in its words and keeps the take', async () => {
    const unusable = 'That recording could not be used. Record it again.';
    await toRecording({ [`POST ${SAMPLE}`]: refusal(400, unusable, 'voice_sample_unusable') });
    await record(24);
    await fireEvent.press(await screen.findByTestId('voice-take-use'));
    expect(await screen.findByTestId('voice-take-failure')).toHaveTextContent(unusable);
    expect(calls('POST', GENERATE)).toHaveLength(0);
  });

  it('an upload the storage host did not take says the recording did not upload', async () => {
    await toRecording({ [`PUT ${UPLOAD}`]: { status: 403, body: {} } });
    await record(24);
    await fireEvent.press(await screen.findByTestId('voice-take-use'));
    expect(await screen.findByTestId('voice-take-failure')).toHaveTextContent('Your recording did not upload. Try again.');
    expect(calls('POST', SAMPLE)).toHaveLength(0);
  });

  it('a try that costs points says so before it is made (the free first one does not)', async () => {
    const next = { free: false, costPoints: 200 };
    await toRecording({
      [`GET ${INTRO}`]: ok(introView({ next })),
      [`POST ${CONSENT}`]: ok(introView({ consent: { line: HUB_LINE, given: true }, next })),
    });
    await record(24);
    expect(await screen.findByTestId('voice-take-cost')).toHaveTextContent('Making your intro uses 200 points.');
  });

  it('V10: a refused microphone shows a plain way forward, not a crash: ask again, then the phone\'s settings when it cannot ask', async () => {
    await toRecording();
    mockPermission.mockImplementation(async () => ({ granted: false, canAskAgain: true, status: 'undetermined', expires: 'never' }));
    await fireEvent.press(screen.getByTestId('voice-take-record'));
    expect(await screen.findByTestId('voice-take-mic-off')).toBeTruthy();
    expect(screen.getByText("We can't use your microphone")).toBeTruthy();
    expect(mockRecorder.record).not.toHaveBeenCalled();

    mockPermission.mockImplementation(async () => ({ granted: false, canAskAgain: false, status: 'denied', expires: 'never' }));
    await fireEvent.press(screen.getByTestId('voice-take-allow'));
    const settings = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
    await fireEvent.press(await screen.findByTestId('voice-take-settings'));
    expect(settings).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Turn on the microphone for Who Made This\?/)).toBeTruthy();

    // Allowed at last: the recording starts and the plain way forward goes.
    mockPermission.mockImplementation(async () => ({ granted: true, canAskAgain: true, status: 'granted', expires: 'never' }));
    await fireEvent.press(screen.getByTestId('voice-take-settings'));
    settings.mockRestore();
  });
});

/** Through VF9 to a try the Hub is making: consent, a take, Use this. The poll then reads whatever `GET /me/voice-intro` answers next. */
async function toMaking(over: Record<string, Answer | Answer[]> = {}) {
  const props = await toRecording(over);
  await record(24);
  await fireEvent.press(await screen.findByTestId('voice-take-use'));
  await screen.findByTestId('voice-making-screen');
  return props;
}

describe('VF10 and VF10a · Making your intro', () => {
  const kept = { consent: { line: HUB_LINE, given: true }, sample: { recorded: true, ...BOUNDS } };
  const working = (over: Record<string, unknown> = {}) => introView({ ...kept, run: run(), ...over });
  const failedRun = "That didn't work. No points were taken. Try again.";
  const failedView = () => working({ run: run({ state: 'failed', message: failedRun, finishedAt: '2026-10-20T10:01:00.000Z' }) });

  it('a try the Hub is still making opens on VF10 (a ring, no percentage, no promised time) and VF11 follows when it is done', async () => {
    await boot({ [`GET ${INTRO}`]: ok(working()) });
    expect(await screen.findByTestId('voice-making-screen')).toBeTruthy();
    expect(screen.getByText('Making your intro')).toBeTruthy();
    expect(screen.getByText('In your own voice.')).toBeTruthy();
    expect(screen.queryByText(/%/)).toBeNull();
    expect(screen.queryByText(/About a minute/)).toBeNull();
    expect(screen.queryByTestId('voice-consent-agree')).toBeNull();
    answers[`GET ${INTRO}`] = ok(working({ run: run({ state: 'done', finishedAt: '2026-10-20T10:01:00.000Z' }), audioUrl: 'https://files.test/intro.mp3' }));
    expect(await screen.findByTestId('voice-hear-screen', {}, { timeout: 6000 })).toBeTruthy();
  }, 15_000);

  it('VF10a: a failed try says the Hub\'s own words, "No points were taken", and Try again makes a new try from the kept recording', async () => {
    await toMaking();
    answers[`GET ${INTRO}`] = ok(failedView());
    expect(await screen.findByText("We couldn't make your intro", {}, { timeout: 6000 })).toBeTruthy();
    // SWEEP-R3 (CHECK-3 auth-me pass 4, L-p4-6): the board's line is "No points were taken. Try again." under the title; the Hub's own
    // opening sentence ("That didn't work.") repeats the title, so it is left off. (This assertion held the whole Hub sentence.)
    expect(screen.getByTestId('voice-failed-line')).toHaveTextContent(/^No points were taken\. Try again\.$/);
    expect(screen.getByTestId('voice-failed-line')).not.toHaveTextContent("That didn't work");
    expect(screen.queryByTestId('voice-hear-screen')).toBeNull();
    answers[`POST ${GENERATE}`] = ok(working(), 202);
    answers[`GET ${INTRO}`] = ok(working());
    await fireEvent.press(screen.getByTestId('voice-failed-again'));
    expect(await screen.findByTestId('voice-making-screen')).toBeTruthy();
    const keys = calls('POST', GENERATE).map((call) => call.key);
    expect(keys).toHaveLength(2);
    expect(keys[1]).not.toBe(keys[0]);
    expect(calls('POST', PRESIGN)).toHaveLength(1);
  }, 20_000);

  it('a Try again the Hub refuses (no points) says its words on the same screen', async () => {
    const noPoints = 'You need 200 points to make this. No points were taken.';
    await toMaking();
    answers[`GET ${INTRO}`] = ok(failedView());
    await screen.findByTestId('voice-failed-again', {}, { timeout: 6000 });
    answers[`POST ${GENERATE}`] = refusal(402, noPoints, 'insufficient_points');
    await fireEvent.press(screen.getByTestId('voice-failed-again'));
    await waitFor(() => expect(screen.getByTestId('voice-failed-line')).toHaveTextContent(noPoints));
  }, 20_000);

  it('Try again with no recording kept goes back to VF9', async () => {
    await toMaking();
    answers[`GET ${INTRO}`] = ok(introView({ consent: { line: HUB_LINE, given: true }, sample: { recorded: false, ...BOUNDS }, run: run({ state: 'failed', message: failedRun }) }));
    await fireEvent.press(await screen.findByTestId('voice-failed-again', {}, { timeout: 6000 }));
    expect(await screen.findByTestId('voice-take-screen')).toBeTruthy();
  }, 20_000);
});

describe('VF11 · Hear yourself', () => {
  const done = () =>
    introView({ consent: { line: HUB_LINE, given: true }, sample: { recorded: true, ...BOUNDS }, run: run({ state: 'done' }), audioUrl: 'https://files.test/intro.mp3' });

  it('the finished intro plays as it opens, labelled Bio with the AI voice tag, above the words it says; its three buttons lead on', async () => {
    const props = await toMaking();
    answers[`GET ${INTRO}`] = ok(done());
    expect(await screen.findByTestId('voice-hear-screen', {}, { timeout: 6000 })).toBeTruthy();
    expect(screen.getByText('Hear yourself')).toBeTruthy();
    expect(screen.getByText('Bio')).toBeTruthy();
    expect(screen.getByText('AI voice')).toBeTruthy();
    expect(screen.getByTestId('voice-hear-text')).toHaveTextContent(WORDS);
    expect(screen.getByTestId('voice-hear-player')).toBeTruthy();
    expect(lastAudio()).toEqual(expect.objectContaining({ uri: 'https://files.test/intro.mp3', playing: true }));
    await fireEvent.press(screen.getByTestId('voice-hear-edit'));
    expect(props.onWriteText).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByTestId('voice-hear-use'));
    expect(props.onUse).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByTestId('voice-hear-rerecord'));
    expect(await screen.findByTestId('voice-take-screen')).toBeTruthy();
  }, 20_000);
});

describe('the recording model', () => {
  it('a take under the Hub\'s shortest is short, anything from the shortest up is kept', () => {
    expect(model.takeVerdict(14, 15)).toBe('short');
    expect(model.takeVerdict(15, 15)).toBe('done');
    expect(model.takeVerdict(30, 15)).toBe('done');
    expect(model.takeVerdict(14.9, 15)).toBe('short');
    expect(model.takeVerdict(9, 10)).toBe('short');
  });

  it('the ring fills with the take against the Hub\'s longest and never past full', () => {
    expect(model.takeShare(0, 30)).toBe(0);
    expect(model.takeShare(15, 30)).toBe(0.5);
    expect(model.takeShare(45, 30)).toBe(1);
    expect(model.takeShare(Number.NaN, 30)).toBe(0);
    expect(model.takeShare(10, 20)).toBe(0.5);
    expect(model.takeClock(14)).toBe('0:14');
    expect(model.takeClock(30)).toBe('0:30');
  });

  it('the file\'s kind follows where the phone wrote it', () => {
    expect(model.sampleFileOf('file:///a/b/take.m4a')).toEqual({ contentType: 'audio/mp4', extension: 'm4a' });
    expect(model.sampleFileOf('file:///a/take.wav')).toEqual({ contentType: 'audio/wav', extension: 'wav' });
    expect(model.sampleFileOf('blob:https://x/abc')).toEqual({ contentType: 'audio/mp4', extension: 'm4a' });
    expect(model.sampleFileOf('file:///a/take.webm?x=1')).toEqual({ contentType: 'audio/webm', extension: 'webm' });
  });

  it('the script is the consent line exactly as served, then the person\'s words', () => {
    expect(model.scriptFor(HUB_LINE, '  Hello there.  ')).toBe(`${HUB_LINE} Hello there.`);
    expect(model.scriptFor(HUB_LINE, null)).toBe(HUB_LINE);
  });

  it('the failed line drops the Hub\'s opening "That didn\'t work." (the title says it) and keeps every other sentence (VF10a)', () => {
    expect(model.failedLineOf("That didn't work. No points were taken. Try again.")).toBe('No points were taken. Try again.');
    expect(model.failedLineOf('That didn\u2019t work. No points were taken.')).toBe('No points were taken.');
    expect(model.failedLineOf('You need 200 points to make this. No points were taken.')).toBe('You need 200 points to make this. No points were taken.');
    expect(model.failedLineOf('The audio did not finish')).toBe('The audio did not finish');
    expect(model.failedLineOf("That didn't work.")).toBe(model.FAILED_FALLBACK);
    expect(model.failedLineOf('  ')).toBe(model.FAILED_FALLBACK);
    expect(model.failedLineOf(null)).toBe(model.FAILED_FALLBACK);
  });

  it('the Hub\'s answer to a poll is still working, done with audio, or failed with its own words', () => {
    expect(model.makingResult({ run: null as never, audioUrl: null })).toEqual({ kind: 'working' });
    expect(model.makingResult({ run: run({ state: 'working' }) as never, audioUrl: null })).toEqual({ kind: 'working' });
    expect(model.makingResult({ run: run({ state: 'done' }) as never, audioUrl: 'https://x/a.mp3' })).toEqual({ kind: 'done', audioUrl: 'https://x/a.mp3' });
    expect(model.makingResult({ run: run({ state: 'done' }) as never, audioUrl: null })).toEqual({ kind: 'working' });
    expect(model.makingResult({ run: run({ state: 'failed', message: 'No points were taken.' }) as never, audioUrl: null })).toEqual({ kind: 'failed', message: 'No points were taken.' });
    expect(model.openingStage({ run: run({ state: 'working' }) as never })).toBe('making');
    expect(model.openingStage({ run: run({ state: 'failed' }) as never })).toBe('consent');
  });
});
