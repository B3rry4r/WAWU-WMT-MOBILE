/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor, within } from 'expo-router/testing-library';
import { Text, View } from 'react-native';

import type { ComponentType } from 'react';

/*
 * Dubbing (POINTS-11) on the real Expo Router stack: Studio draws its tile, the tile opens the tool, the person's recording goes up, the Hub
 * reads its length and quotes the minutes for one language, the person picks a language from the Hub's own list, and the job runs over
 * `POST /ai-tools/dubbing/jobs`. It takes minutes: the person leaves and finds it still working, then done with the dubbed audio and the
 * subtitles. All over a stand-in `fetch` installed before the app's modules load, answering in the Hub's shapes (AITOOLS-05).
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
const AUDIO = 'https://audio.test/dub.flac';
const MB = 1024 * 1024;
const ACTION = 'dub_standard_per_min_lang';
const PER_MINUTE = 1500;
const VTT = 'WEBVTT\n\n1\n00:00:00.000 --> 00:00:04.000\nBienvenido al Pricing Playbook.\n\n2\n00:01:05.500 --> 00:01:09.000\n<v Ada>Pon un precio a tu trabajo.</v>\n';
/** The Hub's list of languages (`input.file.dubbing.languages`), in its order. */
const LANGUAGES = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'yo', name: 'Yoruba' },
];
const RULE = {
  folders: { audio: 'ai/input-audio', video: 'ai/input-video' },
  accepts: { audio: ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac'], video: ['video/mp4', 'video/quicktime', 'video/webm'] },
  maxBytes: 500 * MB,
  maxMinutes: 60,
  languageCode: false,
  dubbing: { languages: LANGUAGES },
};

const hub = {
  mode: 'ok' as 'ok' | 'fail' | 'lost',
  points: 6000,
  cap: null as null | Record<string, unknown>,
  seconds: 90,
  workReads: 1,
  /** The languages the Hub lists on `GET /ai-tools`, and the ones the job route takes (they differ when the list changed under the person). */
  listed: LANGUAGES as { code: string; name: string }[],
  accepted: ['es', 'fr', 'yo'],
  subtitles: true,
  presigns: [] as Record<string, unknown>[],
  fileQuotes: [] as { fileKey: string }[],
  quotes: [] as Record<string, unknown>[],
  posts: [] as { key: string | null; body: Record<string, unknown> }[],
  files: {} as Record<string, number>,
  jobs: {} as Record<string, Record<string, unknown>>,
  uploads: 0,
  confirmed: [] as string[],
  made: 0,
  reads: 0,
};

const entry = () => ({
  id: 'dubbing',
  action: ACTION,
  name: 'Dubbing',
  description: 'Hear a recording or video again in another language.',
  unit: 'minute',
  costPointsPerUnit: PER_MINUTE,
  enabled: true,
  input: { kind: 'file', maxCharacters: 0, charactersPerUnit: 0, file: { ...RULE, dubbing: { languages: hub.listed } } },
  voices: [],
});

function quote(units: number) {
  const cost = PER_MINUTE * units;
  const shortfall = Math.max(0, cost - hub.points);
  return {
    action: ACTION,
    title: 'Dubbing',
    per: 'minute_per_language',
    units,
    languages: 1,
    perUnitPoints: PER_MINUTE,
    costPoints: cost,
    balancePoints: hub.points,
    shortfallPoints: shortfall,
    useWallet: false,
    quoteToken: `job-${ACTION}-${cost}`,
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
  if (path === '/ai-tools') return ok({ tools: [entry()], caps: { dailyPoints: 50000, maxCharactersPerJob: 5000, maxAudioMinutesPerJob: 60 } });
  if (path === '/me/points') return ok({ balance: hub.points, nextExpiry: null, lots: [], lotCount: 0, movements: [] });
  if (path === '/uploads/presign' && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    hub.presigns.push(body);
    hub.uploads += 1;
    const key = `${String(body.folder)}/${OWNER}/file-${hub.uploads}.${String(body.extension)}`;
    hub.files[key] = hub.seconds;
    return ok({ uploadUrl: `https://storage.test/${key}`, key, fileUrl: `https://storage.test/${key}` });
  }
  if (path === '/uploads/confirm' && method === 'POST') {
    const body = (await request.json()) as { key: string };
    hub.confirmed.push(body.key);
    return ok({ key: body.key, status: 'confirmed' });
  }
  if (path === '/ai-tools/dubbing/quote' && method === 'POST') {
    const body = (await request.json()) as { fileKey: string };
    hub.fileQuotes.push({ fileKey: body.fileKey });
    const seconds = hub.confirmed.includes(body.fileKey) ? hub.files[body.fileKey] : undefined;
    if (seconds === undefined) return refuse(404, { code: 'not_found', message: "We couldn't find that file." });
    const minutes = Math.max(1, Math.ceil(seconds / 60));
    return ok({ ...quote(minutes), file: { seconds, minutes } });
  }
  if (path === '/points/quote' && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    hub.quotes.push(body);
    return ok(quote(Number(body.units ?? 1)));
  }
  if (path === '/ai-tools/dubbing/jobs' && method === 'POST') {
    const body = (await request.json()) as { fileKey: string; targetLanguage: string };
    const key = request.headers.get('idempotency-key');
    hub.posts.push({ key, body });
    if (key && hub.jobs[key]) return json(200, { statusCode: 200, message: 'OK', data: { ...hub.jobs[key] } });
    if (!hub.accepted.includes(body.targetLanguage)) return refuse(422, { code: 'ai_language_unsupported', message: "That language isn't on the list. Pick one from the list. No points were taken." });
    const seconds = hub.files[body.fileKey];
    if (seconds === undefined) return refuse(404, { code: 'not_found', message: "We couldn't find that file." });
    const minutes = Math.max(1, Math.ceil(seconds / 60));
    hub.made += 1;
    const job = {
      id: `job-${hub.made}`,
      tool: 'dubbing',
      state: 'working',
      voiceId: '',
      targetLanguage: body.targetLanguage,
      characters: 0,
      units: minutes,
      costPoints: PER_MINUTE * minutes,
      audioUrl: null,
      outputs: [],
      message: null,
      createdAt: new Date().toISOString(),
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
        Object.assign(job, { state: 'failed', message: HUB_FAILED, finishedAt: new Date().toISOString() });
      } else {
        const outputs: Record<string, unknown>[] = [{ kind: 'audio', url: AUDIO }];
        if (hub.subtitles) outputs.push({ kind: 'subtitles', text: VTT });
        Object.assign(job, { state: 'done', audioUrl: AUDIO, outputs, finishedAt: new Date().toISOString() });
      }
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
  const { StudioRow } = require('../StudioRow') as typeof import('../StudioRow');
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
    // The Create hub's Studio card, on its own.
    'studio-card': () => <StudioRow onPress={() => undefined} />,
  };
  const { unmount } = await renderRouter(routes, { initialUrl: '/studio' });
  await unmount();
}, 60_000);

beforeEach(() => {
  Object.assign(hub, {
    mode: 'ok',
    points: 6000,
    cap: null,
    seconds: 90,
    workReads: 1,
    listed: LANGUAGES,
    accepted: ['es', 'fr', 'yo'],
    subtitles: true,
    presigns: [],
    fileQuotes: [],
    quotes: [],
    posts: [],
    files: {},
    jobs: {},
    uploads: 0,
    confirmed: [],
    made: 0,
    reads: 0,
  });
  mockPick.mockReset();
  mockPut.mockReset();
  mockPut.mockImplementation(async (_url: string, _body: Blob, _type: string, onProgress: (share: number) => void) => {
    onProgress(0.5);
    return 200;
  });
  mockWritten.length = 0;
  (require('expo-sharing') as { isAvailableAsync: jest.Mock }).isAvailableAsync.mockResolvedValue(false);
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

async function toTool() {
  const rendered = await renderRouter(routes, { initialUrl: '/studio-tool?tool=dubbing' });
  await screen.findByTestId('tool-file');
  return rendered;
}
/** Taps the row and waits for the Hub's cost line. */
async function choose(file = recording('interview.mp3', 'audio/mpeg')) {
  mockPick.mockResolvedValueOnce(file);
  await fireEvent.press(screen.getByTestId('tool-file'));
  await screen.findByTestId('tool-cost');
}
const pickLanguage = (code: string) => fireEvent.press(screen.getByTestId(`tool-language-${code}`));
async function run() {
  await fireEvent.press(screen.getByTestId('tool-run'));
  await screen.findByTestId('tool-working');
}
/** A recording and a language chosen, the dub running. */
async function start(code = 'yo') {
  await toTool();
  await choose();
  await pickLanguage(code);
  await run();
}

describe('PT1 · the tile Studio draws', () => {
  it('a person sees a Dubbing tile that says where the price starts, in the Hub’s figure, and opens it', async () => {
    await renderRouter(routes, { initialUrl: '/studio' });
    expect(await screen.findByTestId('studio-tool-dubbing')).toHaveAccessibleName('Dubbing, From 1,500 a minute');
    await fireEvent.press(screen.getByTestId('studio-tool-dubbing'));
    await screen.findByTestId('tool-file');
    expect(screen.getByRole('header', { name: 'Dubbing' })).toBeTruthy();
  });

  it('a Dubbing the Hub lists with no languages has no tile and no mention, and a link straight to it says it is unavailable', async () => {
    // R-47 (lead, 24 Oct 2026): a tool the app cannot run is not drawn. This test used to pin the tile that opened as a dead end.
    hub.listed = [];
    const studio = await renderRouter(routes, { initialUrl: '/studio' });
    await screen.findByTestId('studio-empty');
    expect(screen.queryByTestId('studio-tool-dubbing')).toBeNull();
    expect(screen.queryByText(/Dubbing/)).toBeNull();
    await studio.unmount();
    const card = await renderRouter(routes, { initialUrl: '/studio-card' });
    await waitFor(() => expect(queryClient.getQueryState(['ai-tools', OWNER])?.status).toBe('success'));
    expect(screen.getByTestId('create-studio-sub')).toHaveTextContent('AI voice tools', { exact: true });
    expect(screen.queryByText(/Dubbing/)).toBeNull();
    await card.unmount();
    await renderRouter(routes, { initialUrl: '/studio-tool?tool=dubbing' });
    await screen.findByTestId('tool-unavailable');
    expect(screen.queryByTestId('tool-run')).toBeNull();
    expect(screen.queryByTestId('tool-file')).toBeNull();
  });
});

describe('PT2 · the file and the language', () => {
  it('a person sees the recording row, the Hub’s types and limits, and a row for each language the Hub lists, none chosen', async () => {
    await toTool();
    expect(screen.getByTestId('tool-file-name')).toHaveTextContent('Choose a recording');
    expect(screen.getByTestId('tool-length')).toHaveTextContent('MP3, WAV, M4A, AAC, MP4, MOV or WEBM. Up to 500 MB and 60 minutes.');
    expect(screen.getByRole('header', { name: 'Language' })).toBeTruthy();
    expect(screen.getAllByTestId(/^tool-language-/).map((row) => row.props.accessibilityLabel)).toEqual(['Spanish', 'French', 'Yoruba']);
    for (const row of screen.getAllByTestId(/^tool-language-/)) expect(row.props.accessibilityState.checked).toBe(false);
    expect(screen.queryByTestId('tool-voices')).toBeNull();
    expect(screen.queryByTestId('tool-text')).toBeNull();
    expect(screen.queryByTestId('tool-cost')).toBeNull();
    expect(screen.getByTestId('tool-run')).toBeDisabled();
    expect(mockPick).not.toHaveBeenCalled();
  });

  it('a person picks a 90 second recording and sees the cost for 2 minutes in one language before anything runs', async () => {
    await toTool();
    await choose();
    expect(hub.presigns).toEqual([{ folder: 'ai/input-audio', contentType: 'audio/mpeg', extension: 'mp3', contentLength: 4 * MB }]);
    expect(screen.getByTestId('tool-length')).toHaveTextContent('About 2 minutes');
    expect(screen.getByTestId('tool-cost')).toHaveTextContent('This uses 3,000 points');
    // The Hub read the file by its key, on Dubbing's own quote route, and nothing has run or been held.
    expect(hub.fileQuotes).toEqual([{ fileKey: expect.stringMatching(/^ai\/input-audio\//) }]);
    expect(hub.posts).toHaveLength(0);
    expect(hub.quotes).toHaveLength(0);
    // The recording alone is not enough: Run waits for a language.
    expect(screen.getByTestId('tool-run')).toBeDisabled();
    await pickLanguage('fr');
    expect(screen.getByTestId('tool-language-fr').props.accessibilityState.checked).toBe(true);
    expect(screen.getByTestId('tool-language-yo').props.accessibilityState.checked).toBe(false);
    expect(screen.getByTestId('tool-run')).toBeEnabled();
    expect(screen.getByTestId('tool-cost')).toHaveTextContent('This uses 3,000 points');
  });

  it('a person who picks a language first and the recording after can run it just the same', async () => {
    await toTool();
    await pickLanguage('es');
    expect(screen.getByTestId('tool-run')).toBeDisabled();
    await choose();
    expect(screen.getByTestId('tool-run')).toBeEnabled();
  });

  it('a language the Hub does not list cannot be chosen: there is no row for it', async () => {
    await toTool();
    expect(screen.queryByTestId('tool-language-de')).toBeNull();
    expect(screen.queryByText('German')).toBeNull();
  });

  it('a video goes to the Hub’s video folder, and nothing on screen promises a video back', async () => {
    await toTool();
    await choose(recording('talk.mp4', 'video/mp4'));
    expect(hub.presigns[0]).toMatchObject({ folder: 'ai/input-video', contentType: 'video/mp4', extension: 'mp4' });
    await pickLanguage('es');
    await run();
    await sleep(2100);
    await screen.findByTestId('tool-player');
    expect(screen.queryByText(/video/i)).toBeNull();
  });
});

describe('PT2a and PT2b · a dub that takes minutes', () => {
  it('a person runs a dub: the quote is for one language, the job carries the language, and the working view says it can take a few minutes', async () => {
    await start('yo');
    expect(hub.quotes).toEqual([{ action: ACTION, units: 2, languages: 1 }]);
    expect(hub.posts).toHaveLength(1);
    expect(hub.posts[0].body).toEqual({ fileKey: expect.stringMatching(/^ai\/input-audio\//), targetLanguage: 'yo', quoteToken: 'job-dub_standard_per_min_lang-3000' });
    expect(hub.posts[0].key).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
    expect(screen.getByText('Making your Dubbing')).toBeTruthy();
    expect(screen.getByText('This can take a few minutes. You can leave this screen.')).toBeTruthy();
    expect(screen.queryByText(/About a minute/)).toBeNull();
    // The language rows are gone while it works, as PT2a's voice rows are.
    expect(screen.queryByTestId('tool-languages')).toBeNull();
  });

  it('a person sees the dubbed audio play and the subtitles read, with the points used and what is left', async () => {
    await start('yo');
    await sleep(2100);
    await screen.findByTestId('tool-player');
    expect(screen.getByTestId('tool-player-button')).toHaveAccessibleName(/^Play Dubbing/);
    await fireEvent.press(screen.getByTestId('tool-player-button'));
    expect(screen.getByTestId('tool-player-button')).toHaveAccessibleName('Pause Dubbing');
    // The subtitles are read for the person: where each line starts and what it says, without the file's markup.
    expect(await screen.findByTestId('tool-subtitles-card')).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Subtitles' })).toBeTruthy();
    const lines = within(screen.getByTestId('tool-subtitles'));
    expect(lines.getByText('0:00')).toBeTruthy();
    expect(lines.getByText('Bienvenido al Pricing Playbook.')).toBeTruthy();
    expect(lines.getByText('1:05')).toBeTruthy();
    expect(lines.getByText('Pon un precio a tu trabajo.')).toBeTruthy();
    expect(screen.queryByText(/WEBVTT|-->|<v/)).toBeNull();
    await waitFor(() => expect(screen.getByTestId('tool-used')).toHaveTextContent('3,000 points used · 3,000 left'));
    expect(screen.queryByTestId('tool-transcript')).toBeNull();
  });

  it('a dub the Hub made with no subtitles still plays, and draws no subtitles card', async () => {
    hub.subtitles = false;
    await start('es');
    await sleep(2100);
    await screen.findByTestId('tool-player');
    expect(screen.queryByTestId('tool-subtitles-card')).toBeNull();
    expect(screen.queryByTestId('tool-share-subtitles')).toBeNull();
  });

  it('a person can share the subtitle file through the phone’s share sheet, as WebVTT', async () => {
    (require('expo-sharing') as { isAvailableAsync: jest.Mock }).isAvailableAsync.mockResolvedValue(true);
    await toTool();
    await choose(recording('Q3 interview (final).mp3', 'audio/mpeg'));
    await pickLanguage('fr');
    await run();
    await sleep(2100);
    await screen.findByTestId('tool-share-subtitles');
    await fireEvent.press(screen.getByTestId('tool-share-subtitles'));
    await waitFor(() => expect((require('expo-sharing') as { shareAsync: jest.Mock }).shareAsync).toHaveBeenCalledTimes(1));
    // The Hub's own file goes, untouched: the markup the screen leaves out is still in it.
    expect(mockWritten).toEqual([{ name: 'Q3 interview final.vtt', text: VTT }]);
    const [uri, options] = (require('expo-sharing') as { shareAsync: jest.Mock }).shareAsync.mock.calls[0];
    expect(uri).toBe('file:///cache/Q3 interview final.vtt');
    expect(options).toMatchObject({ mimeType: 'text/vtt' });
  });

  it('a phone with no share sheet draws no share row', async () => {
    await start('yo');
    await sleep(2100);
    await screen.findByTestId('tool-subtitles-card');
    expect(screen.queryByTestId('tool-share-subtitles')).toBeNull();
  });

  it('a person who leaves while it works comes back to a job still working, with the recording and the language they chose, then done', async () => {
    hub.workReads = 99;
    const first = await toTool();
    await choose();
    await pickLanguage('yo');
    await run();
    await sleep(6000);
    await first.unmount();
    await toTool();
    await screen.findByTestId('tool-working');
    expect(screen.getByTestId('tool-file-name')).toHaveTextContent('interview.mp3');
    expect(hub.made).toBe(1);
    expect(hub.posts).toHaveLength(1);
    hub.workReads = 0;
    await sleep(2100);
    await screen.findByTestId('tool-player');
    await waitFor(() => expect(screen.getByTestId('tool-used')).toHaveTextContent('3,000 points used · 3,000 left'));
    // The person has seen the end: nothing is left on the phone to find again.
    await waitFor(() => expect(Array.from(mockVault.keys()).filter((k) => k.startsWith('wmt.points.job.'))).toEqual([]));
  });

  it('the reads of a working dub slow down after its first minute', async () => {
    hub.workReads = 9999;
    await start('yo');
    // Time moves in small steps so each read the screen asks for can answer before the next one is asked for.
    const pass = async (ms: number, step: number) => {
      for (let spent = 0; spent < ms; spent += step) await sleep(step);
    };
    const reads = async (ms: number) => {
      const before = hub.reads;
      await pass(ms, 500);
      return hub.reads - before;
    };
    // The first minute: every 2 seconds.
    expect(await reads(20_000)).toBeGreaterThanOrEqual(9);
    await pass(45_000, 1000);
    // After a minute: every 5 seconds, not every 2.
    const gentle = await reads(20_000);
    expect(gentle).toBeGreaterThanOrEqual(3);
    expect(gentle).toBeLessThanOrEqual(5);
    // After five minutes: every 10 seconds.
    await pass(300_000, 2000);
    const slow = await reads(20_000);
    expect(slow).toBeGreaterThanOrEqual(1);
    expect(slow).toBeLessThanOrEqual(3);
  });
});

describe('PT2c · what the person is told when it does not go', () => {
  it('a failed dub says no points were taken, the balance is back, and Try again asks for the recording again', async () => {
    hub.mode = 'fail';
    await start('yo');
    await sleep(2100);
    const failed = await screen.findByTestId('tool-failed');
    expect(failed).toHaveTextContent("That didn't work", { exact: false });
    expect(failed).toHaveTextContent('No points were taken. Try again.', { exact: false });
    expect(hub.points).toBe(6000);
    await waitFor(() => expect(screen.getByRole('header', { name: 'Dubbing' })).toBeTruthy());
    expect(screen.getByTestId('tool-file-name')).toHaveTextContent('Choose a recording');
    expect(screen.queryByTestId('tool-player')).toBeNull();
    hub.mode = 'ok';
    mockPick.mockResolvedValueOnce(recording('again.mp3', 'audio/mpeg'));
    await fireEvent.press(screen.getByTestId('tool-try-again'));
    await screen.findByTestId('tool-cost');
    // The language the person chose is still chosen: the next Run is a new job under a new key.
    expect(screen.getByTestId('tool-language-yo').props.accessibilityState.checked).toBe(true);
    await run();
    expect(hub.posts).toHaveLength(2);
    expect(hub.posts[1].key).not.toBe(hub.posts[0].key);
    expect(hub.posts[1].body.targetLanguage).toBe('yo');
    expect(hub.uploads).toBe(2);
  });

  it('a language the Hub no longer takes is refused in the Hub’s own sentence and nothing is held', async () => {
    hub.accepted = ['es', 'fr'];
    await toTool();
    await choose();
    await pickLanguage('yo');
    await fireEvent.press(screen.getByTestId('tool-run'));
    const refused = await screen.findByTestId('tool-refused');
    expect(refused).toHaveTextContent("That language isn't on the list. Pick one from the list. No points were taken.", { exact: false });
    expect(hub.points).toBe(6000);
    expect(hub.made).toBe(0);
    // Another language from the list goes through.
    await pickLanguage('es');
    expect(screen.queryByTestId('tool-refused')).toBeNull();
    await run();
    expect(hub.made).toBe(1);
  });

  it('a lost answer then Try again sends the same file and language under the same key and makes one job', async () => {
    hub.mode = 'lost';
    await toTool();
    await choose();
    await pickLanguage('yo');
    await fireEvent.press(screen.getByTestId('tool-run'));
    await screen.findByTestId('tool-unsent');
    await fireEvent.press(screen.getByTestId('tool-resend'));
    await screen.findByTestId('tool-working');
    expect(hub.posts).toHaveLength(2);
    expect(hub.posts[1].key).toBe(hub.posts[0].key);
    expect(hub.posts[1].body).toEqual(hub.posts[0].body);
    expect(hub.posts[1].body.targetLanguage).toBe('yo');
    expect(hub.made).toBe(1);
    expect(hub.points).toBe(3000);
  });

  it('a recording over the Hub’s byte cap is refused in the Hub’s numbers and nothing is sent', async () => {
    await toTool();
    mockPick.mockResolvedValueOnce(recording('long.wav', 'audio/wav', 600 * MB));
    await fireEvent.press(screen.getByTestId('tool-file'));
    expect(await screen.findByTestId('tool-file-refused')).toHaveTextContent('That file is over the 500 MB limit.', { exact: false });
    expect(hub.presigns).toHaveLength(0);
    expect(screen.getByTestId('tool-run')).toBeDisabled();
  });
});

describe('PT3 and PT7 · the sheets, for this tool', () => {
  it('with too few points the sheet appears, for the cost of the file in one language, and nothing runs', async () => {
    hub.points = 100;
    await toTool();
    await choose();
    await pickLanguage('yo');
    await fireEvent.press(screen.getByTestId('tool-run'));
    expect(await screen.findByTestId('shortfall-sheet')).toBeTruthy();
    expect(screen.getByTestId('shortfall-cost')).toHaveAccessibleName('3,000 points');
    expect(screen.getByTestId('shortfall-have')).toHaveAccessibleName('100 points');
    expect(hub.quotes).toEqual([{ action: ACTION, units: 2, languages: 1 }]);
    expect(hub.posts).toHaveLength(0);
  });

  it('past the daily limit the board’s sentence is drawn from the Hub’s numbers and nothing runs', async () => {
    hub.cap = { cap: 'daily', limit: 50000, usedPoints: 49000, remainingPoints: 1000, resetsAt: '2026-10-24T23:00:00.000Z', message: "That is over today's limit of 50000 points for AI tools. The count starts again at midnight." };
    await toTool();
    await choose();
    await pickLanguage('yo');
    await fireEvent.press(screen.getByTestId('tool-run'));
    await screen.findByTestId('cap-reached');
    expect(screen.getByText("You've used 49,000 points on AI tools today. It resets at midnight.")).toBeTruthy();
    expect(hub.posts).toHaveLength(0);
  });
});
