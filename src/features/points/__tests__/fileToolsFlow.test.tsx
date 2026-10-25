/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text, View } from 'react-native';

import type { ComponentType } from 'react';

/*
 * Captions and Clean audio (POINTS-10) on the real Expo Router stack: Studio draws a tile for each tool the Hub lists, the tile opens the
 * tool, the person's recording goes up to the Hub's private folder, the Hub reads its length and quotes the minutes, and the job runs over
 * the tool's own route. All over a stand-in `fetch` installed before the app's modules load, answering in the Hub's shapes (AITOOLS-04):
 * the tool's `input.file` rule, the presign link, the file quote with the length the Hub read, the job route (a key it knows answers its
 * first job) and the job as it stands each time it is read. The Hub lets a file go when its job settles, as AITOOLS-04 does.
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

// The picker and the byte upload are the phone's: the test hands over a recording and says how the upload went.
const mockPick = jest.fn();
jest.mock('@/features/create/pickFile', () => ({ canPickFile: true, pickFile: (types: string[]) => mockPick(types) }));
const mockPut = jest.fn();
jest.mock('@/features/create/upload', () => ({
  ...jest.requireActual('@/features/create/upload'),
  xhrPut: (url: string, body: Blob, type: string, onProgress: (share: number) => void) => mockPut(url, body, type, onProgress),
}));
const mockWritten: { name: string; text: string }[] = [];
jest.mock('expo-file-system', () => ({
  Paths: { cache: 'cache' },
  File: class {
    uri: string;
    name: string;
    constructor(_dir: unknown, name: string) {
      this.name = name;
      this.uri = `file:///cache/${name}`;
    }
    create() {}
    write(text: string) {
      mockWritten.push({ name: this.name, text });
    }
  },
}));

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });
const refuse = (status: number, reason: Record<string, unknown>) => json(status, { data: null, statusCode: status, message: String(reason.message ?? ''), reason });

const OWNER = '00000000-0000-4000-8000-0000000000fa';
const HUB_FAILED = "That didn't work. No points were taken. Try again.";
const AUDIO = 'https://audio.test/clean.mp3';
const TRANSCRIPT = 'Welcome to the Pricing Playbook. In the next ten minutes you will learn how to put a number on your work.';
const SRT = '1\n00:00:00,000 --> 00:00:04,000\nWelcome to the Pricing Playbook.\n';
const MB = 1024 * 1024;

type ToolId = 'captions' | 'clean-audio';
type Spec = { id: ToolId; action: string; name: string; cost: number; description: string; tile: string };
const SPECS: Record<ToolId, Spec> = {
  captions: { id: 'captions', action: 'captions_per_min', name: 'Captions', cost: 15, description: 'Turn what is said in a recording or video into words.', tile: '15 a minute' },
  'clean-audio': { id: 'clean-audio', action: 'clean_audio_per_min', name: 'Clean audio', cost: 400, description: 'Take the noise out of a recording.', tile: '400 a minute' },
};
const RULE = {
  folders: { audio: 'ai/input-audio', video: 'ai/input-video' },
  accepts: { audio: ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac'], video: ['video/mp4', 'video/quicktime', 'video/webm'] },
  maxBytes: 500 * MB,
  maxMinutes: 60,
  languageCode: true,
};

const hub = {
  mode: 'ok' as 'ok' | 'fail' | 'lost',
  points: 1250,
  cap: null as null | Record<string, unknown>,
  /** The longest job in seconds; a longer file is quoted with `minutes_per_job`. */
  longest: 3600,
  /** The next file's length in seconds, as the Hub will read it. */
  seconds: 90,
  unreadable: false,
  presignRefusal: null as null | string,
  workReads: 1,
  presigns: [] as Record<string, unknown>[],
  fileQuotes: [] as { tool: string; fileKey: string }[],
  quotes: [] as Record<string, unknown>[],
  posts: [] as { tool: string; key: string | null; body: Record<string, unknown> }[],
  files: {} as Record<string, number>,
  jobs: {} as Record<string, Record<string, unknown>>,
  uploads: 0,
  /** What `POST /uploads/confirm` answers for the next file: the storage host's word. */
  confirm: 'confirmed' as 'confirmed' | 'abandoned' | 'pending',
  confirmed: [] as string[],
  made: 0,
  reads: 0,
};

const entry = (spec: Spec) => ({
  id: spec.id,
  action: spec.action,
  name: spec.name,
  description: spec.description,
  unit: 'minute',
  costPointsPerUnit: spec.cost,
  enabled: true,
  input: { kind: 'file', maxCharacters: 0, charactersPerUnit: 0, file: RULE },
  voices: [],
});

function quote(spec: Spec, units: number) {
  const cost = spec.cost * units;
  const shortfall = Math.max(0, cost - hub.points);
  return {
    action: spec.action,
    title: spec.name,
    per: 'minute',
    units,
    languages: 1,
    perUnitPoints: spec.cost,
    costPoints: cost,
    balancePoints: hub.points,
    shortfallPoints: shortfall,
    useWallet: false,
    quoteToken: `job-${spec.action}-${cost}`,
    canRun: shortfall === 0 && hub.cap === null,
    cap: hub.cap,
    wallet: null,
    walletNote: null,
  };
}

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  const method = request.method;
  if (path === '/ai-tools') {
    return ok({ tools: [entry(SPECS.captions), entry(SPECS['clean-audio'])], caps: { dailyPoints: 5000, maxCharactersPerJob: 5000, maxAudioMinutesPerJob: 60 } });
  }
  if (path === '/me/points') return ok({ balance: hub.points, nextExpiry: null, lots: [], lotCount: 0, movements: [] });
  if (path === '/uploads/presign' && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    hub.presigns.push(body);
    if (hub.presignRefusal) return refuse(422, { code: 'content_type_not_allowed', message: hub.presignRefusal });
    hub.uploads += 1;
    const key = `${String(body.folder)}/${OWNER}/file-${hub.uploads}.${String(body.extension)}`;
    hub.files[key] = hub.seconds;
    return ok({ uploadUrl: `https://storage.test/${key}`, key, fileUrl: `https://storage.test/${key}` });
  }
  if (path === '/uploads/confirm' && method === 'POST') {
    const body = (await request.json()) as { key: string };
    if (hub.confirm === 'confirmed') hub.confirmed.push(body.key);
    return ok({ key: body.key, status: hub.confirm });
  }
  const fileQuote = /^\/ai-tools\/(captions|clean-audio)\/quote$/.exec(path);
  if (fileQuote && method === 'POST') {
    const spec = SPECS[fileQuote[1] as ToolId];
    const body = (await request.json()) as { fileKey: string };
    hub.fileQuotes.push({ tool: spec.id, fileKey: body.fileKey });
    const seconds = hub.confirmed.includes(body.fileKey) ? hub.files[body.fileKey] : undefined;
    if (seconds === undefined) return refuse(404, { code: 'not_found', message: "We couldn't find that file." });
    if (hub.unreadable) return refuse(422, { code: 'ai_file_unreadable', message: "We couldn't read that file. No points were taken." });
    const minutes = Math.max(1, Math.ceil(seconds / 60));
    const q = quote(spec, minutes);
    const over = seconds > hub.longest;
    return ok({
      ...q,
      canRun: over ? false : q.canRun,
      cap: over ? { cap: 'minutes_per_job', limit: 60, usedPoints: null, remainingPoints: null, resetsAt: null, message: 'That recording is longer than the 60 minutes one job takes. Choose a shorter one. No points were taken.' } : q.cap,
      file: { seconds, minutes },
    });
  }
  if (path === '/points/quote' && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    hub.quotes.push(body);
    const spec = Object.values(SPECS).find((s) => s.action === body.action) as Spec;
    return ok(quote(spec, Number(body.units ?? 1)));
  }
  const start = /^\/ai-tools\/(captions|clean-audio)\/jobs$/.exec(path);
  if (start && method === 'POST') {
    const spec = SPECS[start[1] as ToolId];
    const body = (await request.json()) as { fileKey: string };
    const key = request.headers.get('idempotency-key');
    hub.posts.push({ tool: spec.id, key, body });
    if (key && hub.jobs[key]) return json(200, { statusCode: 200, message: 'OK', data: { ...hub.jobs[key] } });
    const seconds = hub.files[body.fileKey];
    if (seconds === undefined) return refuse(404, { code: 'not_found', message: "We couldn't find that file." });
    const minutes = Math.max(1, Math.ceil(seconds / 60));
    hub.made += 1;
    const job = {
      id: `job-${hub.made}`,
      tool: spec.id,
      state: 'working',
      voiceId: '',
      characters: 0,
      units: minutes,
      costPoints: spec.cost * minutes,
      audioUrl: null,
      outputs: [],
      message: null,
      createdAt: '2026-10-24T09:42:00.000Z',
      finishedAt: null,
      fileKey: body.fileKey,
    };
    hub.jobs[String(key)] = job;
    hub.jobs[job.id] = job;
    hub.points -= job.costPoints;
    if (hub.mode === 'lost' && hub.made === 1) return json(500, { statusCode: 500, message: 'Something went wrong' });
    return json(202, { statusCode: 202, message: 'Accepted', data: { ...job } });
  }
  const read = /^\/ai-tools\/jobs\/(.+)$/.exec(path);
  if (read && method === 'GET') {
    const job = hub.jobs[read[1]];
    if (!job) return refuse(404, { code: 'not_found', message: "We couldn't find that job." });
    hub.reads += 1;
    if (job.state === 'working' && hub.reads >= hub.workReads) {
      // The Hub lets the person's file go when the job settles, done or failed.
      delete hub.files[String(job.fileKey)];
      if (hub.mode === 'fail') {
        hub.points += Number(job.costPoints);
        Object.assign(job, { state: 'failed', message: HUB_FAILED, finishedAt: '2026-10-24T09:43:00.000Z' });
      } else if (job.tool === 'captions') {
        Object.assign(job, { state: 'done', outputs: [{ kind: 'text', text: TRANSCRIPT }, { kind: 'subtitles', text: SRT }], finishedAt: '2026-10-24T09:43:00.000Z' });
      } else Object.assign(job, { state: 'done', audioUrl: AUDIO, outputs: [{ kind: 'audio', url: AUDIO }], finishedAt: '2026-10-24T09:43:00.000Z' });
    }
    const { fileKey: _kept, ...seen } = job;
    return ok({ ...seen });
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

beforeAll(async () => {
  session = require('@/api/session') as typeof import('@/api/session');
  queryClient = (require('@/api/query') as typeof import('@/api/query')).queryClient;
  routes = {
    _layout: () => (
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    ),
    index: stub('Home'),
    welcome: stub('Welcome'),
    points: stub('Your points'),
    'points-buy': stub('Buy points'),
    'reset-pin': stub('Reset PIN'),
    'open-wallet': stub('Open your wallet'),
    'open-wallet-pin': stub('Create your PIN'),
    studio: page('@/app/studio'),
    'studio-tool': page('@/app/studio-tool'),
  };
  const { unmount } = await renderRouter(routes, { initialUrl: '/studio' });
  await unmount();
}, 60_000);

beforeEach(() => {
  Object.assign(hub, { mode: 'ok', points: 1250, cap: null, longest: 3600, seconds: 90, unreadable: false, presignRefusal: null, workReads: 1, presigns: [], fileQuotes: [], quotes: [], posts: [], files: {}, jobs: {}, uploads: 0, confirm: 'confirmed', confirmed: [], made: 0, reads: 0 });
  mockPick.mockReset();
  mockPut.mockReset();
  mockPut.mockImplementation(async (_url: string, _body: Blob, _type: string, onProgress: (share: number) => void) => {
    onProgress(0.5);
    return 200;
  });
  mockWritten.length = 0;
  (require('expo-sharing') as { isAvailableAsync: jest.Mock; shareAsync: jest.Mock }).isAvailableAsync.mockResolvedValue(false);
  (require('expo-sharing') as { shareAsync: jest.Mock }).shareAsync.mockClear();
  (require('../voiceoverIntent') as { forgetJobIntentInMemory: () => void }).forgetJobIntentInMemory();
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, gcTime: 0 } });
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
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

/** A recording as the phone's picker hands it over; the size is what the rule is checked against. */
const recording = (name: string, contentType: string, bytes = 4 * MB) => ({ blob: { size: bytes } as unknown as Blob, name, contentType, extension: name.split('.').pop() ?? '' });

async function toTool(id: ToolId) {
  const rendered = await renderRouter(routes, { initialUrl: `/studio-tool?tool=${id}` });
  await screen.findByTestId('tool-file');
  return rendered;
}
/** Taps the row and waits for the Hub's cost line. */
async function choose(file = recording('interview.mp3', 'audio/mpeg')) {
  mockPick.mockResolvedValueOnce(file);
  await fireEvent.press(screen.getByTestId('tool-file'));
  await screen.findByTestId('tool-cost');
}
async function run() {
  await fireEvent.press(screen.getByTestId('tool-run'));
  await screen.findByTestId('tool-working');
}

describe('PT1 · the tiles Studio draws', () => {
  it('a person sees a tile for Captions and Clean audio with the Hub’s cost, as the board words it, and opens each', async () => {
    await renderRouter(routes, { initialUrl: '/studio' });
    expect(await screen.findByTestId('studio-tool-captions')).toHaveAccessibleName('Captions, 15 a minute');
    expect(screen.getByTestId('studio-tool-clean-audio')).toHaveAccessibleName('Clean audio, 400 a minute');
    await fireEvent.press(screen.getByTestId('studio-tool-clean-audio'));
    await screen.findByTestId('tool-file');
    expect(screen.getByRole('header', { name: 'Clean audio' })).toBeTruthy();
  });
});

describe('PT2 · the file step', () => {
  it.each([SPECS.captions, SPECS['clean-audio']])('$name: a person sees a choose-a-recording row where the text box is, and the Hub’s types and limits under it', async (spec) => {
    await toTool(spec.id);
    expect(screen.getByRole('header', { name: spec.name })).toBeTruthy();
    expect(screen.getByTestId('tool-file-name')).toHaveTextContent('Choose a recording');
    expect(screen.queryByTestId('tool-text')).toBeNull();
    expect(screen.queryByTestId('tool-voices')).toBeNull();
    expect(screen.queryByTestId('tool-cost')).toBeNull();
    expect(screen.getByTestId('tool-length')).toHaveTextContent('MP3, WAV, M4A, AAC, MP4, MOV or WEBM. Up to 500 MB and 60 minutes.');
    expect(screen.getByTestId('tool-run')).toBeDisabled();
    expect(mockPick).not.toHaveBeenCalled();
  });

  it('a person picks a 90 second recording and sees a cost for 2 minutes before anything runs', async () => {
    await toTool('captions');
    await choose();
    expect(mockPick).toHaveBeenCalledWith(['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac', 'video/mp4', 'video/quicktime', 'video/webm']);
    expect(hub.presigns).toEqual([{ folder: 'ai/input-audio', contentType: 'audio/mpeg', extension: 'mp3', contentLength: 4 * MB }]);
    // The bytes went up, and the Hub was told so before it was asked to read the file.
    expect(hub.confirmed).toEqual([hub.fileQuotes[0].fileKey]);
    expect(screen.getByTestId('tool-file-name')).toHaveTextContent('interview.mp3');
    expect(screen.getByTestId('tool-file-status')).toHaveTextContent('4 MB');
    expect(screen.getByTestId('tool-length')).toHaveTextContent('About 2 minutes');
    expect(screen.getByTestId('tool-cost')).toHaveTextContent('This uses 30 points');
    // The phone sent no length: the Hub read the file by its key. Nothing has run or been asked yet.
    expect(hub.fileQuotes).toEqual([{ tool: 'captions', fileKey: expect.stringMatching(/^ai\/input-audio\//) }]);
    expect(hub.posts).toHaveLength(0);
    expect(hub.quotes).toHaveLength(0);
    expect(screen.getByTestId('tool-run')).toBeEnabled();
  });

  it('a video goes to the Hub’s video folder', async () => {
    await toTool('captions');
    await choose(recording('talk.mp4', 'video/mp4'));
    expect(hub.presigns[0]).toMatchObject({ folder: 'ai/input-video', contentType: 'video/mp4', extension: 'mp4' });
  });

  it('a phone that calls an m4a recording by another name is understood', async () => {
    await toTool('clean-audio');
    await choose(recording('note.m4a', 'audio/x-m4a'));
    expect(hub.presigns[0]).toMatchObject({ folder: 'ai/input-audio', contentType: 'audio/mp4', extension: 'm4a' });
  });

  it('a person runs Captions, reads the transcript, and the points line says what was used and what is left', async () => {
    await toTool('captions');
    await choose();
    await run();
    expect(hub.quotes).toEqual([{ action: 'captions_per_min', units: 2 }]);
    expect(hub.posts).toHaveLength(1);
    expect(hub.posts[0].tool).toBe('captions');
    expect(hub.posts[0].body).toEqual({ fileKey: Object.keys(hub.files)[0] ?? hub.posts[0].body.fileKey, quoteToken: 'job-captions_per_min-30' });
    expect(hub.posts[0].body).not.toHaveProperty('languageCode');
    expect(hub.posts[0].key).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
    expect(screen.getByText('Making your Captions')).toBeTruthy();
    await sleep(2100);
    await screen.findByTestId('tool-transcript');
    expect(screen.getByTestId('tool-transcript')).toHaveTextContent(TRANSCRIPT);
    expect(screen.getByTestId('tool-transcript').props.selectable).toBe(true);
    await waitFor(() => expect(screen.getByTestId('tool-used')).toHaveTextContent('30 points used · 1,220 left'));
    expect(screen.queryByTestId('tool-player')).toBeNull();
    // No share sheet on this phone: no share row is drawn.
    expect(screen.queryByTestId('tool-share-subtitles')).toBeNull();
    expect(screen.queryByText(/Save|Use in a product|Bio/)).toBeNull();
  });

  it('a person can share the subtitle file through the phone’s share sheet', async () => {
    (require('expo-sharing') as { isAvailableAsync: jest.Mock }).isAvailableAsync.mockResolvedValue(true);
    await toTool('captions');
    await choose(recording('Q3 interview (final).mp3', 'audio/mpeg'));
    await run();
    await sleep(2100);
    await screen.findByTestId('tool-share-subtitles');
    await fireEvent.press(screen.getByTestId('tool-share-subtitles'));
    await waitFor(() => expect((require('expo-sharing') as { shareAsync: jest.Mock }).shareAsync).toHaveBeenCalledTimes(1));
    expect(mockWritten).toEqual([{ name: 'Q3 interview final.srt', text: SRT }]);
    const [uri, options] = (require('expo-sharing') as { shareAsync: jest.Mock }).shareAsync.mock.calls[0];
    expect(uri).toBe('file:///cache/Q3 interview final.srt');
    expect(options).toMatchObject({ mimeType: 'application/x-subrip' });
  });

  it('a person runs Clean audio and plays the cleaned recording', async () => {
    await toTool('clean-audio');
    await choose();
    expect(screen.getByTestId('tool-cost')).toHaveTextContent('This uses 800 points');
    await run();
    expect(hub.posts[0].tool).toBe('clean-audio');
    await sleep(2100);
    await screen.findByTestId('tool-player');
    expect(screen.queryByTestId('tool-transcript')).toBeNull();
    expect(screen.getByTestId('tool-player-button')).toHaveAccessibleName(/^Play Clean audio/);
    await waitFor(() => expect(screen.getByTestId('tool-used')).toHaveTextContent('800 points used · 450 left'));
    await fireEvent.press(screen.getByTestId('tool-player-button'));
    expect(screen.getByTestId('tool-player-button')).toHaveAccessibleName('Pause Clean audio');
  });

  it.each([SPECS.captions, SPECS['clean-audio']])('SWEEP-APP-8 L3 (POINTS-10): $name: once a job is done the row names the recording and its length, with no limits line and no "Choose another" above the result', async (spec) => {
    await toTool(spec.id);
    await choose();
    await run();
    await sleep(2100);
    await screen.findByTestId(spec.id === 'captions' ? 'tool-transcript' : 'tool-player');
    expect(screen.getByTestId('tool-file-name')).toHaveTextContent('interview.mp3');
    expect(screen.getByTestId('tool-length')).toHaveTextContent('About 2 minutes');
    expect(screen.queryByText(/Up to 500 MB/)).toBeNull();
    expect(screen.queryByText('Choose another')).toBeNull();
    // The row is still the way to a new recording (it says so to a screen reader), it just does not shout it above the result.
    expect(screen.getByTestId('tool-file')).toHaveAccessibleName(/Choose another$/);
    mockPick.mockResolvedValueOnce(recording('second.mp3', 'audio/mpeg'));
    await fireEvent.press(screen.getByTestId('tool-file'));
    await screen.findByTestId('tool-cost');
    expect(screen.getByTestId('tool-file-name')).toHaveTextContent('second.mp3');
  });

  it.each([SPECS.captions, SPECS['clean-audio']])('SWEEP-APP-8 L3 (POINTS-10): $name: a failed job shows no limits line above its failure', async (spec) => {
    hub.mode = 'fail';
    await toTool(spec.id);
    await choose();
    await run();
    await sleep(2100);
    await screen.findByTestId('tool-failed');
    expect(screen.getByTestId('tool-length')).toHaveTextContent('');
    expect(screen.queryByText(/Up to 500 MB/)).toBeNull();
    expect(screen.queryByText('Choose another')).toBeNull();
  });

  it('a second tap on Run while the check is running makes one job', async () => {
    await toTool('captions');
    await choose();
    const button = screen.getByTestId('tool-run');
    await act(async () => {
      fireEvent.press(button);
      fireEvent.press(button);
    });
    await screen.findByTestId('tool-working');
    expect(hub.made).toBe(1);
    expect(hub.points).toBe(1220);
  });

  it('a lost answer then Try again sends the same file under the same key and makes one job', async () => {
    hub.mode = 'lost';
    await toTool('captions');
    await choose();
    await fireEvent.press(screen.getByTestId('tool-run'));
    await screen.findByTestId('tool-unsent');
    await fireEvent.press(screen.getByTestId('tool-resend'));
    await screen.findByTestId('tool-working');
    expect(hub.posts).toHaveLength(2);
    expect(hub.posts[1].key).toBe(hub.posts[0].key);
    expect(hub.posts[1].body).toEqual(hub.posts[0].body);
    expect(hub.made).toBe(1);
  });

  it('a person who leaves while it works finds the job again with the recording’s name', async () => {
    hub.workReads = 99;
    const first = await toTool('captions');
    await choose();
    await run();
    await first.unmount();
    await toTool('captions');
    await screen.findByTestId('tool-working');
    expect(screen.getByTestId('tool-file-name')).toHaveTextContent('interview.mp3');
    expect(hub.made).toBe(1);
  });
});

describe('PT2c · what the person is told when it does not go', () => {
  it('a file of a type the Hub does not take is refused in the Hub’s own list, and nothing is sent', async () => {
    await toTool('captions');
    mockPick.mockResolvedValueOnce(recording('contract.pdf', 'application/pdf'));
    await fireEvent.press(screen.getByTestId('tool-file'));
    const refused = await screen.findByTestId('tool-file-refused');
    expect(refused).toHaveTextContent('That file type is not accepted here. Choose MP3, WAV, M4A, AAC, MP4, MOV or WEBM.', { exact: false });
    expect(hub.presigns).toHaveLength(0);
    expect(screen.queryByTestId('tool-cost')).toBeNull();
    expect(screen.getByTestId('tool-run')).toBeDisabled();
  });

  it('a file over the Hub’s byte cap is refused with the cap in the Hub’s numbers, and nothing is sent', async () => {
    await toTool('clean-audio');
    mockPick.mockResolvedValueOnce(recording('long.wav', 'audio/wav', 600 * MB));
    await fireEvent.press(screen.getByTestId('tool-file'));
    expect(await screen.findByTestId('tool-file-refused')).toHaveTextContent('That file is over the 500 MB limit.', { exact: false });
    expect(hub.presigns).toHaveLength(0);
  });

  it('a recording over the minute cap shows the Hub’s reason, draws no cost, and holds nothing', async () => {
    hub.seconds = 4000;
    await toTool('captions');
    mockPick.mockResolvedValueOnce(recording('lecture.mp3', 'audio/mpeg'));
    await fireEvent.press(screen.getByTestId('tool-file'));
    const refused = await screen.findByTestId('tool-file-refused');
    expect(refused).toHaveTextContent('That is too much for one go', { exact: false });
    expect(refused).toHaveTextContent('That recording is longer than the 60 minutes one job takes. Choose a shorter one. No points were taken.', { exact: false });
    expect(screen.queryByTestId('tool-cost')).toBeNull();
    expect(screen.getByTestId('tool-run')).toBeDisabled();
    expect(hub.posts).toHaveLength(0);
    expect(hub.points).toBe(1250);
    // Choosing a shorter one starts over.
    hub.seconds = 120;
    await choose(recording('short.mp3', 'audio/mpeg'));
    expect(screen.queryByTestId('tool-file-refused')).toBeNull();
    expect(screen.getByTestId('tool-length')).toHaveTextContent('About 2 minutes');
  });

  it('a failed upload says so, asks nothing of the Hub, and holds nothing', async () => {
    mockPut.mockResolvedValueOnce(503);
    await toTool('captions');
    mockPick.mockResolvedValueOnce(recording('interview.mp3', 'audio/mpeg'));
    await fireEvent.press(screen.getByTestId('tool-file'));
    const refused = await screen.findByTestId('tool-file-refused');
    expect(refused).toHaveTextContent("That didn't upload", { exact: false });
    expect(refused).toHaveTextContent('That file did not upload. Try again.', { exact: false });
    expect(hub.fileQuotes).toHaveLength(0);
    expect(hub.posts).toHaveLength(0);
    expect(screen.getByTestId('tool-run')).toBeDisabled();
    // Choosing it again goes through.
    await choose();
    expect(screen.getByTestId('tool-cost')).toHaveTextContent('This uses 30 points');
  });

  it('a file the storage host did not take (abandoned) is a failed upload: the Hub is not asked to read it and nothing is held', async () => {
    hub.confirm = 'abandoned';
    await toTool('captions');
    mockPick.mockResolvedValueOnce(recording('interview.mp3', 'audio/mpeg'));
    await fireEvent.press(screen.getByTestId('tool-file'));
    expect(await screen.findByTestId('tool-file-refused')).toHaveTextContent('That file did not upload. Try again.', { exact: false });
    expect(hub.fileQuotes).toHaveLength(0);
    expect(screen.queryByTestId('tool-cost')).toBeNull();
    expect(screen.getByTestId('tool-run')).toBeDisabled();
  });

  it('a type the storage refuses shows the Hub’s own sentence', async () => {
    hub.presignRefusal = 'That file type is not allowed here.';
    await toTool('captions');
    mockPick.mockResolvedValueOnce(recording('interview.mp3', 'audio/mpeg'));
    await fireEvent.press(screen.getByTestId('tool-file'));
    expect(await screen.findByTestId('tool-file-refused')).toHaveTextContent('That file type is not allowed here.', { exact: false });
    expect(mockPut).not.toHaveBeenCalled();
  });

  it('a recording the Hub cannot read is refused in its words and nothing is held', async () => {
    hub.unreadable = true;
    await toTool('captions');
    mockPick.mockResolvedValueOnce(recording('broken.mp3', 'audio/mpeg'));
    await fireEvent.press(screen.getByTestId('tool-file'));
    expect(await screen.findByTestId('tool-file-refused')).toHaveTextContent("We couldn't read that file. No points were taken.", { exact: false });
    expect(screen.queryByTestId('tool-cost')).toBeNull();
    expect(hub.posts).toHaveLength(0);
  });

  it('a picker that fails says so and a person can try the row again', async () => {
    await toTool('captions');
    mockPick.mockRejectedValueOnce(new Error('no access'));
    await fireEvent.press(screen.getByTestId('tool-file'));
    expect(await screen.findByTestId('tool-file-refused')).toHaveTextContent("That didn't open", { exact: false });
    await choose();
    expect(screen.queryByTestId('tool-file-refused')).toBeNull();
  });

  it.each([SPECS.captions, SPECS['clean-audio']])('$name: a failed job says no points were taken, the balance is back, and Try again asks for the recording again', async (spec) => {
    hub.mode = 'fail';
    await toTool(spec.id);
    await choose();
    await run();
    await sleep(2100);
    const failed = await screen.findByTestId('tool-failed');
    expect(failed).toHaveTextContent("That didn't work", { exact: false });
    expect(failed).toHaveTextContent('No points were taken. Try again.', { exact: false });
    expect(hub.points).toBe(1250);
    // The Hub let the file go when the job settled, so the row is empty and Try again opens the chooser.
    expect(screen.getByTestId('tool-file-name')).toHaveTextContent('Choose a recording');
    hub.mode = 'ok';
    mockPick.mockResolvedValueOnce(recording('again.mp3', 'audio/mpeg'));
    await fireEvent.press(screen.getByTestId('tool-try-again'));
    await screen.findByTestId('tool-cost');
    await run();
    expect(hub.posts).toHaveLength(2);
    expect(hub.posts[1].key).not.toBe(hub.posts[0].key);
    expect(hub.posts[1].body.fileKey).not.toBe(hub.posts[0].body.fileKey);
    expect(hub.uploads).toBe(2);
  });
});

describe('PT3 and PT7 · the sheets, for these tools', () => {
  it.each([SPECS.captions, SPECS['clean-audio']])('$name: with too few points the sheet appears and nothing runs until confirmed', async (spec) => {
    hub.points = 10;
    await toTool(spec.id);
    await choose();
    await fireEvent.press(screen.getByTestId('tool-run'));
    expect(await screen.findByTestId('shortfall-sheet')).toBeTruthy();
    expect(screen.getByTestId('shortfall-cost')).toHaveAccessibleName(`${(spec.cost * 2).toLocaleString('en-US')} points`);
    expect(screen.getByTestId('shortfall-have')).toHaveAccessibleName('10 points');
    expect(hub.posts).toHaveLength(0);
  });

  it.each([SPECS.captions, SPECS['clean-audio']])('$name: past the daily limit the board’s three sentences are drawn from the Hub’s numbers and nothing runs', async (spec) => {
    hub.cap = { cap: 'daily', limit: 5000, usedPoints: 4900, remainingPoints: 100, resetsAt: '2026-10-24T23:00:00.000Z', message: "That is over today's limit of 5000 points for AI tools. The count starts again at midnight." };
    await toTool(spec.id);
    await choose();
    await fireEvent.press(screen.getByTestId('tool-run'));
    await screen.findByTestId('cap-reached');
    expect(screen.getByText("You've used 4,900 points on AI tools today. It resets at midnight. Your points are safe.")).toBeTruthy();
    expect(hub.posts).toHaveLength(0);
  });
});
