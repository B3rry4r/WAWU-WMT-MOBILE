/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text, View } from 'react-native';

import type { ComponentType } from 'react';

/*
 * Quick voice, Sound effect and Music track (POINTS-09) on the real Expo Router stack: Studio draws a tile for each tool the Hub lists
 * and the app has a screen for, the tile opens the tool, and the tool runs one job over the Hub's own route, all over a stand-in `fetch`
 * installed before the app's modules load. The stand-in answers in the Hub's shapes (AITOOLS-02 and AITOOLS-03): each tool with its
 * input kind, cost and unit; the quote with its token; the job route of each tool (a key it knows answers its first job); the job as it
 * stands each time it is read. It records every job request's tool, key and body.
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

const OWNER = '00000000-0000-4000-8000-0000000000f9';
const HUB_FAILED = "That didn't work. No points were taken. Try again.";
const AUDIO = 'https://audio.test/job.mp3';

type ToolId = 'quick-voice' | 'sound-effect' | 'music';
type Spec = { id: ToolId; action: string; name: string; unit: 'minute' | 'use' | 'track'; cost: number; kind: 'text' | 'prompt'; description: string; tile: string; sent: string };
const SPECS: Record<ToolId, Spec> = {
  'quick-voice': { id: 'quick-voice', action: 'quick_voice_per_min', name: 'Quick voice', unit: 'minute', cost: 125, kind: 'text', description: 'A fast read of your words.', tile: '125 a minute', sent: 'Welcome to the Pricing Playbook. In the next ten minutes you will learn how to put a number on your work without guessing.' },
  'sound-effect': { id: 'sound-effect', action: 'sfx', name: 'Sound effect', unit: 'use', cost: 75, kind: 'prompt', description: 'Describe a sound and hear it.', tile: '75', sent: 'A heavy wooden door creaking open in a quiet house' },
  music: { id: 'music', action: 'music_per_track', name: 'Music track', unit: 'track', cost: 500, kind: 'prompt', description: 'Describe a track and get the music.', tile: '500', sent: 'A calm Afrobeat groove with soft keys, no singing' },
};

const hub = {
  mode: 'ok' as 'ok' | 'fail' | 'lost',
  points: 1250,
  /** The tools the Hub lists, by id. */
  listed: ['quick-voice', 'sound-effect', 'music'] as string[],
  /** A tool the Hub lists that this build has no screen for. */
  stranger: false,
  cap: null as null | Record<string, unknown>,
  workReads: 1,
  quotes: [] as Record<string, unknown>[],
  posts: [] as { tool: string; key: string | null; body: Record<string, unknown> }[],
  jobs: {} as Record<string, Record<string, unknown>>,
  made: 0,
  reads: 0,
};

const entry = (spec: Spec) => ({
  id: spec.id,
  action: spec.action,
  name: spec.name,
  description: spec.description,
  unit: spec.unit,
  costPointsPerUnit: spec.cost,
  enabled: true,
  input: spec.kind === 'text' ? { kind: 'text', maxCharacters: 5000, charactersPerUnit: 900 } : { kind: 'prompt', maxCharacters: 5000, charactersPerUnit: 5000, ...(spec.id === 'music' ? { instrumental: true } : {}) },
  voices:
    spec.kind === 'text'
      ? [
          { id: 'ada', name: 'Ada', description: 'Warm, Nigerian English' },
          { id: 'tunde', name: 'Tunde', description: 'Calm, steady' },
        ]
      : [],
});

function quote(body: Record<string, unknown>) {
  const spec = Object.values(SPECS).find((s) => s.action === body.action) as Spec;
  const units = Number(body.units ?? 1);
  const cost = spec.cost * units;
  const shortfall = Math.max(0, cost - hub.points);
  return {
    action: spec.action,
    title: spec.name,
    per: spec.unit,
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
    const tools: Record<string, unknown>[] = hub.listed.map((id) => entry(SPECS[id as ToolId]));
    if (hub.stranger) tools.push({ id: 'dubbing', action: 'dub_standard_per_min_lang', name: 'Dubbing', description: 'Speak it in another language.', unit: 'minute', costPointsPerUnit: 1500, enabled: true, input: { kind: 'file', maxCharacters: 0, charactersPerUnit: 0 }, voices: [] });
    return ok({ tools, caps: { dailyPoints: 5000, maxCharactersPerJob: 5000, maxAudioMinutesPerJob: 10 } });
  }
  if (path === '/me/points') return ok({ balance: hub.points, nextExpiry: null, lots: [], lotCount: 0, movements: [] });
  if (path === '/points/quote' && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    hub.quotes.push(body);
    return ok(quote(body));
  }
  const start = /^\/ai-tools\/(quick-voice|sound-effect|music)\/jobs$/.exec(path);
  if (start && method === 'POST') {
    const spec = SPECS[start[1] as ToolId];
    const body = (await request.json()) as Record<string, unknown>;
    const key = request.headers.get('idempotency-key');
    hub.posts.push({ tool: spec.id, key, body });
    if (key && hub.jobs[key]) return json(200, { statusCode: 200, message: 'OK', data: { ...hub.jobs[key] } });
    hub.made += 1;
    const said = String(body.text ?? body.prompt);
    const job = {
      id: `job-${hub.made}`,
      tool: spec.id,
      state: 'working',
      voiceId: typeof body.voiceId === 'string' ? body.voiceId : '',
      characters: Array.from(said).length,
      units: spec.kind === 'text' ? Math.max(1, Math.ceil(Array.from(said).length / 900)) : 1,
      costPoints: spec.cost,
      audioUrl: null,
      outputs: [],
      message: null,
      createdAt: '2026-10-24T09:42:00.000Z',
      finishedAt: null,
    };
    hub.jobs[String(key)] = job;
    hub.jobs[job.id] = job;
    hub.points -= spec.cost;
    if (hub.mode === 'lost' && hub.made === 1) return json(500, { statusCode: 500, message: 'Something went wrong' });
    return json(202, { statusCode: 202, message: 'Accepted', data: { ...job } });
  }
  const read = /^\/ai-tools\/jobs\/(.+)$/.exec(path);
  if (read && method === 'GET') {
    const job = hub.jobs[read[1]];
    if (!job) return refuse(404, { code: 'not_found', message: "We couldn't find that job." });
    hub.reads += 1;
    if (job.state === 'working' && hub.reads >= hub.workReads) {
      if (hub.mode === 'fail') {
        hub.points += Number(job.costPoints);
        Object.assign(job, { state: 'failed', message: HUB_FAILED, finishedAt: '2026-10-24T09:43:00.000Z' });
      } else Object.assign(job, { state: 'done', audioUrl: AUDIO, outputs: [{ kind: 'audio', url: AUDIO }], finishedAt: '2026-10-24T09:43:00.000Z' });
    }
    return ok({ ...job });
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
  Object.assign(hub, { mode: 'ok', points: 1250, listed: ['quick-voice', 'sound-effect', 'music'], stranger: false, cap: null, workReads: 1, quotes: [], posts: [], jobs: {}, made: 0, reads: 0 });
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

/** A count as the app writes it: "1,175". */
const n = (count: number) => count.toLocaleString('en-US');

async function toTool(id: ToolId) {
  const rendered = await renderRouter(routes, { initialUrl: `/studio-tool?tool=${id}` });
  await screen.findByTestId('tool-text');
  return rendered;
}
async function typeIn(words: string) {
  await fireEvent.changeText(screen.getByTestId('tool-text'), words);
  await screen.findByTestId('tool-cost');
}
async function run() {
  await fireEvent.press(screen.getByTestId('tool-run'));
  await screen.findByTestId('tool-working');
}

describe('PT1 · the tiles Studio draws', () => {
  it('a person sees a tile for each of the three tools with the Hub’s cost, as the board words it, and opens each', async () => {
    await renderRouter(routes, { initialUrl: '/studio' });
    expect(await screen.findByTestId('studio-tool-quick-voice')).toHaveAccessibleName('Quick voice, 125 a minute');
    expect(screen.getByTestId('studio-tool-sound-effect')).toHaveAccessibleName('Sound effect, 75');
    expect(screen.getByTestId('studio-tool-music')).toHaveAccessibleName('Music track, 500');
    expect(screen.queryByText(/a track|a use/)).toBeNull();
    await fireEvent.press(screen.getByTestId('studio-tool-music'));
    await screen.findByTestId('tool-text');
    expect(screen.getByRole('header', { name: 'Music track' })).toBeTruthy();
  });

  it('a tool the Hub does not list has no tile, and a tool the Hub lists that the app has no screen for has none either', async () => {
    hub.listed = ['sound-effect'];
    hub.stranger = true;
    await renderRouter(routes, { initialUrl: '/studio' });
    await screen.findByTestId('studio-tool-sound-effect');
    expect(screen.queryByTestId('studio-tool-quick-voice')).toBeNull();
    expect(screen.queryByTestId('studio-tool-music')).toBeNull();
    expect(screen.queryByTestId('studio-tool-dubbing')).toBeNull();
    expect(screen.queryByText('Dubbing')).toBeNull();
    expect(screen.getAllByTestId(/^studio-tool-/)).toHaveLength(1);
  });

  it('a tool the app has no screen for opens as unavailable, never as a tool that runs', async () => {
    hub.stranger = true;
    await renderRouter(routes, { initialUrl: '/studio-tool?tool=dubbing' });
    await screen.findByTestId('tool-unavailable');
    expect(screen.queryByTestId('tool-run')).toBeNull();
  });
});

describe('PT2 · Quick voice, the words to speak', () => {
  const spec = SPECS['quick-voice'];

  it('a person types words, picks a voice, sees the length and the cost from the Hub, runs it, and plays the audio', async () => {
    await toTool('quick-voice');
    expect(screen.getByRole('header', { name: 'Quick voice' })).toBeTruthy();
    expect(screen.getByTestId('tool-voice-ada').props.accessibilityState.checked).toBe(true);
    await typeIn(spec.sent);
    expect(screen.getByTestId('tool-length')).toHaveTextContent('About 1 minute');
    expect(screen.getByTestId('tool-count')).toHaveTextContent(`${n(Array.from(spec.sent).length)} / 5,000`);
    expect(screen.getByTestId('tool-cost')).toHaveTextContent('This uses 125 points');
    expect(hub.quotes).toEqual([{ action: 'quick_voice_per_min', units: 1, characters: Array.from(spec.sent).length }]);
    await fireEvent.press(screen.getByTestId('tool-voice-tunde'));
    await run();
    expect(hub.posts).toHaveLength(1);
    expect(hub.posts[0].tool).toBe('quick-voice');
    expect(hub.posts[0].body).toEqual({ text: spec.sent, voiceId: 'tunde', quoteToken: 'job-quick_voice_per_min-125' });
    expect(hub.posts[0].key).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
    expect(screen.getByText('Making your Quick voice')).toBeTruthy();
    await sleep(2100);
    await screen.findByTestId('tool-player');
    expect(screen.getByTestId('tool-player-button')).toHaveAccessibleName(/^Play Quick voice/);
    await waitFor(() => expect(screen.getByTestId('tool-used')).toHaveTextContent('125 points used · 1,125 left'));
    await fireEvent.press(screen.getByTestId('tool-player-button'));
    expect(screen.getByTestId('tool-player-button')).toHaveAccessibleName('Pause Quick voice');
    expect(screen.queryByText(/Bio|Save|Use in a product/)).toBeNull();
  });

  it('a lost answer then Try again sends the same request under the same key and makes one job', async () => {
    hub.mode = 'lost';
    await toTool('quick-voice');
    await typeIn(spec.sent);
    await fireEvent.press(screen.getByTestId('tool-run'));
    await screen.findByTestId('tool-unsent');
    await fireEvent.press(screen.getByTestId('tool-resend'));
    await screen.findByTestId('tool-working');
    expect(hub.posts).toHaveLength(2);
    expect(hub.posts[1].key).toBe(hub.posts[0].key);
    expect(hub.posts[1].body).toEqual(hub.posts[0].body);
    expect(hub.made).toBe(1);
  });
});

describe('PT2 · Sound effect and Music track, a description and a flat price', () => {
  it.each([SPECS['sound-effect'], SPECS.music])('$name: a description box with its count, no voices and no length line, and the cost line reads the Hub’s quote', async (spec) => {
    await toTool(spec.id);
    expect(screen.getByRole('header', { name: spec.name })).toBeTruthy();
    expect(screen.getByTestId('tool-text')).toHaveAccessibleName('Description');
    expect(screen.getByTestId('tool-text').props.placeholder).toBe(spec.description);
    expect(screen.getByTestId('tool-count')).toHaveTextContent('0 / 5,000');
    expect(screen.queryByTestId('tool-voices')).toBeNull();
    expect(screen.queryByText('Voice')).toBeNull();
    await typeIn(spec.sent);
    expect(screen.getByTestId('tool-count')).toHaveTextContent(`${n(Array.from(spec.sent).length)} / 5,000`);
    expect(screen.getByTestId('tool-length')).toHaveTextContent('');
    expect(screen.queryByText(/About \d/)).toBeNull();
    expect(screen.getByTestId('tool-cost')).toHaveTextContent(`This uses ${spec.cost} points`);
    expect(hub.quotes).toEqual([{ action: spec.action, units: 1, characters: Array.from(spec.sent).length }]);
    // A long description is still one use or one track.
    await fireEvent.changeText(screen.getByTestId('tool-text'), spec.sent.repeat(40));
    await waitFor(() => expect(screen.getByTestId('tool-count')).toHaveTextContent(`${n(Array.from(spec.sent.repeat(40)).length)} / 5,000`));
    await screen.findByTestId('tool-cost');
    expect(screen.getByTestId('tool-cost')).toHaveTextContent(`This uses ${spec.cost} points`);
  });

  it.each([SPECS['sound-effect'], SPECS.music])('$name: Run starts one job on the tool’s own route with the description and the quote’s token, shows it working, then plays the result', async (spec) => {
    await toTool(spec.id);
    await typeIn(spec.sent);
    await run();
    expect(hub.posts).toHaveLength(1);
    expect(hub.posts[0].tool).toBe(spec.id);
    expect(hub.posts[0].body).toEqual({ prompt: spec.sent, quoteToken: `job-${spec.action}-${spec.cost}` });
    expect(screen.getByText(`Making your ${spec.name}`)).toBeTruthy();
    expect(screen.getByText('About a minute. You can leave this screen.')).toBeTruthy();
    expect(screen.queryByTestId('tool-run')).toBeNull();
    await sleep(2100);
    await screen.findByTestId('tool-player');
    expect(screen.getByTestId('tool-player-button')).toHaveAccessibleName(new RegExp(`^Play ${spec.name}`));
    await waitFor(() => expect(screen.getByTestId('tool-used')).toHaveTextContent(`${spec.cost} points used · ${n(1250 - spec.cost)} left`));
    await waitFor(() => expect(screen.getByTestId('points-subtitle')).toHaveTextContent(`Points: ${n(1250 - spec.cost)}`));
    await fireEvent.press(screen.getByTestId('tool-player-button'));
    expect(screen.getByTestId('tool-player-button')).toHaveAccessibleName(`Pause ${spec.name}`);
    expect(screen.queryByText(/Bio|Save|Use in a product/)).toBeNull();
    expect(hub.made).toBe(1);
  });

  it('a person who leaves a Sound effect working and starts a Music track does not lose the first: coming back finds its job', async () => {
    hub.workReads = 4;
    const sound = SPECS['sound-effect'];
    const first = await toTool('sound-effect');
    await typeIn(sound.sent);
    await run();
    await first.unmount();
    const second = await toTool('music');
    await typeIn(SPECS.music.sent);
    await run();
    expect(hub.posts.map((p) => p.tool)).toEqual(['sound-effect', 'music']);
    await second.unmount();
    await renderRouter(routes, { initialUrl: '/studio-tool?tool=sound-effect' });
    await screen.findByTestId('tool-working');
    expect((screen.getByTestId('tool-text').props as { value: string }).value).toBe(sound.sent);
    expect(hub.posts).toHaveLength(2);
    expect(hub.made).toBe(2);
  });
});

describe('PT2c · a job that did not work, for each tool', () => {
  it.each([SPECS['quick-voice'], SPECS['sound-effect'], SPECS.music])('$name: says the Hub’s own words (no points were taken) and the balance is the Hub’s, unchanged', async (spec) => {
    hub.mode = 'fail';
    await toTool(spec.id);
    await typeIn(spec.sent);
    await run();
    await sleep(2100);
    await screen.findByTestId('tool-failed');
    expect(screen.getByText("That didn't work")).toBeTruthy();
    expect(screen.getByText('No points were taken. Try again.')).toBeTruthy();
    expect(screen.queryByTestId('tool-player')).toBeNull();
    await waitFor(() => expect(screen.getByTestId('points-subtitle')).toHaveTextContent('Points: 1,250'));
    const first = hub.posts[0].key;
    hub.mode = 'ok';
    await fireEvent.press(screen.getByTestId('tool-try-again'));
    await waitFor(() => expect(hub.posts).toHaveLength(2));
    expect(hub.posts[1].key).not.toBe(first);
    expect(hub.posts[1].tool).toBe(spec.id);
  });
});

describe('PT3 and PT7 · too few points and the daily limit, for each tool', () => {
  it.each([SPECS['quick-voice'], SPECS['sound-effect'], SPECS.music])('$name: with too few points the sheet is asked first and nothing runs until the points are bought', async (spec) => {
    hub.points = spec.cost - 5;
    await toTool(spec.id);
    await typeIn(spec.sent);
    await fireEvent.press(screen.getByTestId('tool-run'));
    await screen.findByText('Not enough points');
    expect(hub.posts).toHaveLength(0);
    expect(hub.made).toBe(0);
    await fireEvent.press(screen.getByRole('button', { name: 'Buy points' }));
    await screen.findByText('from studio');
  });

  it.each([SPECS['quick-voice'], SPECS['sound-effect'], SPECS.music])('$name: past the daily limit the Hub’s own sentence names when it resets and nothing runs', async (spec) => {
    hub.cap = { cap: 'daily', limit: 5000, usedPoints: 4900, remainingPoints: 100, resetsAt: '2026-10-24T23:00:00.000Z', message: "That is over today's limit of 5000 points for AI tools. The count starts again at midnight." };
    await toTool(spec.id);
    await typeIn(spec.sent);
    await fireEvent.press(screen.getByTestId('tool-run'));
    await screen.findByTestId('cap-reached');
    expect(screen.getByText(/The count starts again at midnight/)).toBeTruthy();
    expect(hub.posts).toHaveLength(0);
  });
});
