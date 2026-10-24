/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text, View } from 'react-native';

import type { ComponentType } from 'react';

/*
 * One AI tool (POINTS-08: PT2, PT2a, PT2b, PT2c) on the real Expo Router stack: Studio's tile opens the tool's route, the tool runs a
 * VoiceOver job, all over the Hub as a stand-in `fetch` installed before the app's modules load. The stand-in answers in the Hub's shapes:
 * the tool and its voices, the points, the quote (with its token), the job (a key it knows answers its first job), and the job as it
 * stands each time it is read. It records every job request's key and body.
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

const OWNER = '00000000-0000-4000-8000-0000000000f8';
const HUB_FAILED = "That didn't work. No points were taken. Try again.";
const AUDIO = 'https://audio.test/job.mp3';

type Mode = 'ok' | 'fail' | 'failquiet' | 'lost' | 'refuse' | 'off' | 'settled';
const hub = {
  mode: 'ok' as Mode,
  points: 1250,
  perMinute: 250,
  enabled: true,
  voices: true,
  cap: null as null | Record<string, unknown>,
  toolsFail: 0,
  quoteDrift: 0,
  /** Reads of a working job before it ends. */
  workReads: 1,
  quotes: [] as Record<string, unknown>[],
  posts: [] as { key: string | null; body: Record<string, unknown> }[],
  jobs: {} as Record<string, Record<string, unknown>>,
  made: 0,
  reads: 0,
  /** The key whose job the Hub could not write (mode 'settled'): its points went back, so the same key now meets a spent hold. */
  spent: null as string | null,
};

function quote(body: Record<string, unknown>) {
  const units = Number(body.units ?? 1);
  const cost = hub.perMinute * units + hub.quoteDrift;
  const shortfall = Math.max(0, cost - hub.points);
  return {
    action: 'voiceover_per_min',
    title: 'VoiceOver',
    per: 'minute',
    units,
    languages: 1,
    perUnitPoints: hub.perMinute,
    costPoints: cost,
    balancePoints: hub.points,
    shortfallPoints: shortfall,
    useWallet: false,
    quoteToken: `job-${cost}`,
    canRun: shortfall === 0 && hub.cap === null,
    cap: hub.cap,
    wallet: null,
    walletNote: null,
  };
}

const jobView = (job: Record<string, unknown>) => ({ ...job });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  const method = request.method;
  if (path === '/ai-tools') {
    if (hub.toolsFail > 0) {
      hub.toolsFail -= 1;
      return json(400, { statusCode: 400, message: 'This tool is not answering. Try again.' });
    }
    return ok({
      tools: [
        {
          id: 'voiceover',
          action: 'voiceover_per_min',
          name: 'VoiceOver',
          description: 'Turn your words into spoken audio.',
          unit: 'minute',
          costPointsPerUnit: hub.perMinute,
          enabled: hub.enabled,
          input: { maxCharacters: 5000, charactersPerUnit: 900 },
          voices: hub.voices
            ? [
                { id: 'ada', name: 'Ada', description: 'Warm, Nigerian English' },
                { id: 'tunde', name: 'Tunde', description: 'Calm, steady' },
              ]
            : [],
        },
      ],
      caps: { dailyPoints: 5000, maxCharactersPerJob: 5000, maxAudioMinutesPerJob: 10 },
    });
  }
  if (path === '/me/points') return ok({ balance: hub.points, nextExpiry: null, lots: [], lotCount: 0, movements: [] });
  if (path === '/points/quote' && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    hub.quotes.push(body);
    return ok(quote(body));
  }
  if (path === '/ai-tools/voiceover/jobs' && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    const key = request.headers.get('idempotency-key');
    hub.posts.push({ key, body });
    if (key && hub.jobs[key]) return json(200, { statusCode: 200, message: 'OK', data: jobView(hub.jobs[key]) });
    if (hub.mode === 'refuse') return refuse(409, { code: 'quote_changed', message: 'The cost changed or the quote ended. Check the points and run it again. No points were taken.' });
    if (hub.mode === 'off') return refuse(503, { code: 'ai_tool_unavailable', message: 'AI voice tools are not available right now. No points were taken.' });
    if (hub.mode === 'settled') {
      if (hub.spent === null) {
        hub.spent = String(key);
        return json(500, { statusCode: 500, message: 'Something went wrong' });
      }
      if (key === hub.spent) return refuse(409, { code: 'points_hold_settled', message: 'Those points were already given back.' });
    }
    hub.made += 1;
    const characters = Array.from(String(body.text)).length;
    const job = {
      id: `job-${hub.made}`,
      tool: 'voiceover',
      state: 'working',
      voiceId: body.voiceId,
      characters,
      units: Math.max(1, Math.ceil(characters / 900)),
      costPoints: hub.perMinute,
      audioUrl: null,
      message: null,
      createdAt: '2026-10-17T09:42:00.000Z',
      finishedAt: null,
    };
    hub.jobs[String(key)] = job;
    hub.jobs[job.id] = job;
    hub.points -= hub.perMinute;
    if (hub.mode === 'lost' && hub.made === 1) return json(500, { statusCode: 500, message: 'Something went wrong' });
    return json(202, { statusCode: 202, message: 'Accepted', data: jobView(job) });
  }
  const read = /^\/ai-tools\/jobs\/(.+)$/.exec(path);
  if (read && method === 'GET') {
    const job = hub.jobs[read[1]];
    if (!job) return refuse(404, { code: 'not_found', message: "We couldn't find that job." });
    hub.reads += 1;
    if (job.state === 'working' && hub.reads >= hub.workReads) {
      if (hub.mode === 'fail' || hub.mode === 'failquiet') {
        hub.points += hub.perMinute;
        Object.assign(job, { state: 'failed', message: hub.mode === 'fail' ? HUB_FAILED : "That didn't work.", finishedAt: '2026-10-17T09:43:00.000Z' });
      } else Object.assign(job, { state: 'done', audioUrl: AUDIO, finishedAt: '2026-10-17T09:43:00.000Z' });
    }
    return ok(jobView(job));
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
  Object.assign(hub, { mode: 'ok', points: 1250, perMinute: 250, enabled: true, voices: true, cap: null, toolsFail: 0, quoteDrift: 0, workReads: 1, quotes: [], posts: [], jobs: {}, made: 0, reads: 0, spent: null });
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
const WORDS = 'Welcome to the Pricing Playbook. In the next ten minutes you will learn how to put a number on your work without guessing.';

async function toTool() {
  const rendered = await renderRouter(routes, { initialUrl: '/studio-tool?tool=voiceover' });
  await screen.findByTestId('tool-text');
  return rendered;
}
async function typeWords(words = WORDS) {
  await fireEvent.changeText(screen.getByTestId('tool-text'), words);
  await screen.findByTestId('tool-cost');
}
/** Taps Run and lets the check, the job request and the first read of the job settle. */
async function run() {
  await fireEvent.press(screen.getByTestId('tool-run'));
  await screen.findByTestId('tool-working');
}
async function untilDone() {
  await sleep(2100);
  await screen.findByTestId('tool-player');
}

describe('PT1 to PT2 · opening a tool', () => {
  it('the Studio tile opens the tool the Hub lists, with its name, the person’s points and the Hub’s voices', async () => {
    await renderRouter(routes, { initialUrl: '/studio' });
    await fireEvent.press(await screen.findByTestId('studio-tool-voiceover'));
    await screen.findByTestId('tool-text');
    expect(screen.getByRole('header', { name: 'VoiceOver' })).toBeTruthy();
    expect(screen.getByTestId('points-subtitle')).toHaveTextContent('Points: 1,250');
    expect(screen.getByTestId('tool-voice-ada')).toHaveAccessibleName('Ada, Warm, Nigerian English');
    expect(screen.getByTestId('tool-voice-tunde')).toBeTruthy();
    expect(screen.getByTestId('tool-voice-ada').props.accessibilityState.checked).toBe(true);
    expect(screen.queryByText(/Your voice|ElevenLabs|Save|Use in a product|Example values/)).toBeNull();
  });

  it('nothing is run and nothing is priced until there are words: Run waits, no cost line, no quote asked', async () => {
    await toTool();
    expect(screen.getByTestId('tool-count')).toHaveTextContent('0 / 5,000');
    expect(screen.queryByTestId('tool-cost')).toBeNull();
    expect(screen.getByTestId('tool-run').props.accessibilityState.disabled).toBe(true);
    expect(hub.quotes).toHaveLength(0);
  });

  it('typing shows the length in minutes and the Hub’s own cost before Run, in points', async () => {
    await toTool();
    await typeWords();
    expect(screen.getByTestId('tool-count')).toHaveTextContent(`${Array.from(WORDS).length} / 5,000`);
    expect(screen.getByTestId('tool-length')).toHaveTextContent('About 1 minute');
    expect(screen.getByTestId('tool-cost')).toHaveTextContent('This uses 250 points');
    expect(screen.queryByText(/₦/)).toBeNull();
    expect(hub.quotes).toEqual([{ action: 'voiceover_per_min', units: 1, characters: Array.from(WORDS).length }]);
    // Two minutes of words: the length and the cost move together, from the Hub's quote and the Hub's characters per minute.
    await fireEvent.changeText(screen.getByTestId('tool-text'), 'a'.repeat(1000));
    await waitFor(() => expect(screen.getByTestId('tool-cost')).toHaveTextContent('This uses 500 points'));
    expect(screen.getByTestId('tool-length')).toHaveTextContent('About 2 minutes');
    expect(hub.quotes[1]).toEqual({ action: 'voiceover_per_min', units: 2, characters: 1000 });
  });

  it('the text never goes past the most the Hub takes', async () => {
    await toTool();
    await fireEvent.changeText(screen.getByTestId('tool-text'), 'a'.repeat(5600));
    expect(screen.getByTestId('tool-count')).toHaveTextContent('5,000 / 5,000');
  });

  it('a tool the Hub lists as off, or with no voices, is not drawn as usable', async () => {
    hub.enabled = false;
    await renderRouter(routes, { initialUrl: '/studio-tool?tool=voiceover' });
    await screen.findByTestId('tool-unavailable');
    expect(screen.getByText("VoiceOver isn't available right now")).toBeTruthy();
    expect(screen.queryByTestId('tool-run')).toBeNull();
  });

  it('a tool the Hub does not list is the same unavailable view, and a read that fails is the error view with Try again', async () => {
    hub.toolsFail = 1;
    await renderRouter(routes, { initialUrl: '/studio-tool?tool=voiceover' });
    await screen.findByTestId('tool-error');
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    await screen.findByTestId('tool-text');
  });
});

describe('PT2a and PT2b · running a job', () => {
  it('Run asks the Hub for the cost, starts one job with the quote’s token and the person’s voice, shows it working, then plays the audio and says what it took', async () => {
    await toTool();
    await typeWords();
    await fireEvent.press(screen.getByTestId('tool-voice-tunde'));
    await run();
    expect(hub.posts).toHaveLength(1);
    expect(hub.posts[0].body).toEqual({ text: WORDS, voiceId: 'tunde', quoteToken: 'job-250' });
    expect(hub.posts[0].key).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
    expect(screen.getByText('Making your VoiceOver')).toBeTruthy();
    expect(screen.getByText('About a minute. You can leave this screen.')).toBeTruthy();
    expect(screen.queryByTestId('tool-run')).toBeNull();
    await untilDone();
    expect(screen.getByTestId('tool-player-button')).toHaveAccessibleName(/^Play VoiceOver/);
    expect(screen.queryByText(/Bio/)).toBeNull();
    await waitFor(() => expect(screen.getByTestId('tool-used')).toHaveTextContent('250 points used · 1,000 left'));
    await waitFor(() => expect(screen.getByTestId('points-subtitle')).toHaveTextContent('Points: 1,000'));
    // AITOOLS-07 builds PT2b's Save and Use in a product rows (G-AITOOLS-01-4, G-POINTS-08-2): this line pinned the gap that task closes.
    expect(screen.getByTestId('result-save')).toBeTruthy();
    expect(screen.getByTestId('result-use')).toBeTruthy();
    expect(hub.made).toBe(1);
  });

  // SWEEP-APP-3 row 166: the count under the title stayed at the balance from before Run while the job worked, though the Hub already held its points.
  it('shows the Hub\'s balance, less the points the job holds, while the job is still working', async () => {
    hub.workReads = 99;
    await toTool();
    expect(screen.getByTestId('points-subtitle')).toHaveTextContent('Points: 1,250');
    await typeWords();
    await run();
    expect(screen.getByText('Making your VoiceOver')).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId('points-subtitle')).toHaveTextContent('Points: 1,000'));
    expect(screen.getByText('Making your VoiceOver')).toBeTruthy();
  });

  // SWEEP-APP-3 row 167: with the job read failing the screen stayed on "Making your VoiceOver" with no message, asking again for ever.
  it('says so when the job cannot be read, and stops asking for a job the Hub does not know', async () => {
    hub.workReads = 99;
    await toTool();
    await typeWords();
    await run();
    delete hub.jobs['job-1'];
    await sleep(2100);
    expect(await screen.findByTestId('tool-job-error')).toBeTruthy();
    const reads = hub.reads;
    await sleep(10_000);
    expect(hub.reads).toBe(reads);
    expect(screen.getByText('Making your VoiceOver')).toBeTruthy();
  });

  it('the player plays and pauses the audio', async () => {
    await toTool();
    await typeWords();
    await run();
    await untilDone();
    await fireEvent.press(screen.getByTestId('tool-player-button'));
    expect(screen.getByTestId('tool-player-button')).toHaveAccessibleName('Pause VoiceOver');
    await fireEvent.press(screen.getByTestId('tool-player-button'));
    expect(screen.getByTestId('tool-player-button')).toHaveAccessibleName(/^Play VoiceOver/);
  });

  it('a double tap on Run makes one job', async () => {
    await toTool();
    await typeWords();
    const button = screen.getByTestId('tool-run');
    await fireEvent.press(button);
    await fireEvent.press(button);
    await screen.findByTestId('tool-working');
    expect(hub.posts).toHaveLength(1);
    expect(hub.made).toBe(1);
  });

  it('editing the words after the audio is made goes back to typing, and the next Run is a new job with a new key', async () => {
    await toTool();
    await typeWords();
    await run();
    await untilDone();
    const first = hub.posts[0].key;
    await fireEvent.changeText(screen.getByTestId('tool-text'), `${WORDS} Thank you.`);
    await screen.findByTestId('tool-run');
    expect(screen.queryByTestId('tool-player')).toBeNull();
    await screen.findByTestId('tool-cost');
    await run();
    expect(hub.posts).toHaveLength(2);
    expect(hub.posts[1].key).not.toBe(first);
    expect(hub.made).toBe(2);
  });

  it('leaving while it works and coming back finds the same job, and sends nothing again', async () => {
    hub.workReads = 3;
    const first = await toTool();
    await typeWords();
    await run();
    expect(hub.posts).toHaveLength(1);
    await first.unmount();
    await renderRouter(routes, { initialUrl: '/studio-tool?tool=voiceover' });
    await screen.findByTestId('tool-working');
    expect((screen.getByTestId('tool-text').props as { value: string }).value).toBe(WORDS);
    await sleep(4300);
    await screen.findByTestId('tool-player');
    expect(hub.posts).toHaveLength(1);
    expect(hub.made).toBe(1);
  });
});

describe('PT2c · a job that did not work', () => {
  it('says the Hub’s own words, including that no points were taken, and the balance is the Hub’s', async () => {
    hub.mode = 'fail';
    await toTool();
    await typeWords();
    await run();
    await sleep(2100);
    await screen.findByTestId('tool-failed');
    expect(screen.getByText("That didn't work")).toBeTruthy();
    expect(screen.getByText('No points were taken. Try again.')).toBeTruthy();
    expect(screen.queryByTestId('tool-player')).toBeNull();
    await waitFor(() => expect(screen.getByTestId('points-subtitle')).toHaveTextContent('Points: 1,250'));
  });

  it('does not say the points came back when the Hub does not', async () => {
    hub.mode = 'failquiet';
    await toTool();
    await typeWords();
    await run();
    await sleep(2100);
    await screen.findByTestId('tool-failed');
    expect(screen.queryByText(/No points were taken|came back|refunded/)).toBeNull();
  });

  it('Try again starts a new job with a new key after a fresh check of the cost', async () => {
    hub.mode = 'fail';
    await toTool();
    await typeWords();
    await run();
    await sleep(2100);
    await screen.findByTestId('tool-failed');
    const first = hub.posts[0].key;
    hub.mode = 'ok';
    await fireEvent.press(screen.getByTestId('tool-try-again'));
    await waitFor(() => expect(hub.posts).toHaveLength(2));
    expect(hub.posts[1].key).not.toBe(first);
    expect(hub.made).toBe(2);
    await screen.findByTestId('tool-working');
  });
});

describe('V8 and V6 · answers that do not arrive, and refusals', () => {
  it('a lost answer then Try again sends the same request and makes one job', async () => {
    hub.mode = 'lost';
    await toTool();
    await typeWords();
    await fireEvent.press(screen.getByTestId('tool-run'));
    await screen.findByTestId('tool-unsent');
    expect(screen.getByText("That didn't go through")).toBeTruthy();
    expect(screen.queryByText(/No points were taken/)).toBeNull();
    await fireEvent.press(screen.getByTestId('tool-resend'));
    await screen.findByTestId('tool-working');
    expect(hub.posts).toHaveLength(2);
    expect(hub.posts[1].key).toBe(hub.posts[0].key);
    expect(hub.posts[1].body).toEqual(hub.posts[0].body);
    expect(hub.made).toBe(1);
    await untilDone();
  });

  it('a lost answer, then the app opened again, sends the same request on its own and makes one job', async () => {
    hub.mode = 'lost';
    const first = await toTool();
    await typeWords();
    await fireEvent.press(screen.getByTestId('tool-run'));
    await screen.findByTestId('tool-unsent');
    (require('../voiceoverIntent') as { forgetJobIntentInMemory: () => void }).forgetJobIntentInMemory();
    await first.unmount();
    await renderRouter(routes, { initialUrl: '/studio-tool?tool=voiceover' });
    await screen.findByTestId('tool-working');
    expect(hub.posts).toHaveLength(2);
    expect(hub.posts[1].key).toBe(hub.posts[0].key);
    expect(hub.made).toBe(1);
  });

  it('a refusal says the Hub’s sentence, leaves the person typing and makes no job', async () => {
    hub.mode = 'refuse';
    await toTool();
    await typeWords();
    await fireEvent.press(screen.getByTestId('tool-run'));
    await screen.findByTestId('tool-refused');
    expect(screen.getByTestId('tool-refused')).toHaveTextContent('The cost changed or the quote ended. Check the points and run it again. No points were taken.', { exact: false });
    expect(screen.getByTestId('tool-run')).toBeTruthy();
    expect(hub.made).toBe(0);
  });

  it('SWEEP-MONEY AITOOLS-01 L2b · a start the Hub could not write, then Try again with the same key, is a plain refusal; the next Run is a new attempt under a new key and makes one job', async () => {
    hub.mode = 'settled';
    await toTool();
    await typeWords();
    await fireEvent.press(screen.getByTestId('tool-run'));
    await screen.findByTestId('tool-unsent');
    await fireEvent.press(screen.getByTestId('tool-resend'));
    await screen.findByTestId('tool-refused');
    expect(hub.posts).toHaveLength(2);
    expect(hub.posts[1].key).toBe(hub.posts[0].key);
    expect(screen.getByTestId('tool-refused')).toHaveTextContent('That did not start, and no points were taken. Run it again.', { exact: false });
    expect(screen.queryByText(/already given back/)).toBeNull();
    expect(screen.queryByTestId('tool-unsent')).toBeNull();
    expect(hub.made).toBe(0);
    await fireEvent.press(screen.getByTestId('tool-run'));
    await screen.findByTestId('tool-working');
    expect(hub.posts).toHaveLength(3);
    expect(hub.posts[2].key).not.toBe(hub.posts[0].key);
    expect(hub.made).toBe(1);
    await untilDone();
  });

  it('the tool being off when Run is tapped is the Hub’s sentence, not a retry', async () => {
    hub.mode = 'off';
    await toTool();
    await typeWords();
    await fireEvent.press(screen.getByTestId('tool-run'));
    await screen.findByTestId('tool-refused');
    expect(screen.getByTestId('tool-refused')).toHaveTextContent('AI voice tools are not available right now.', { exact: false });
    expect(screen.queryByTestId('tool-unsent')).toBeNull();
  });

  it('a cost that moved since it was shown is shown again and nothing runs until the person runs it', async () => {
    await toTool();
    await typeWords();
    hub.quoteDrift = 50;
    await fireEvent.press(screen.getByTestId('tool-run'));
    await screen.findByTestId('tool-notice');
    expect(hub.posts).toHaveLength(0);
    await waitFor(() => expect(screen.getByTestId('tool-cost')).toHaveTextContent('This uses 300 points'));
    await fireEvent.press(screen.getByTestId('tool-run'));
    await screen.findByTestId('tool-working');
    expect(hub.posts[0].body.quoteToken).toBe('job-300');
  });

  it('too few points opens the check before anything runs, and nothing is sent', async () => {
    hub.points = 90;
    await toTool();
    await typeWords();
    await fireEvent.press(screen.getByTestId('tool-run'));
    await screen.findByText('Not enough points');
    expect(hub.posts).toHaveLength(0);
    await fireEvent.press(screen.getByRole('button', { name: 'Buy points' }));
    await screen.findByText('from studio');
  });

  it('the daily limit shows the Hub’s own sentence and nothing runs', async () => {
    hub.cap = { cap: 'daily', limit: 5000, usedPoints: 4900, remainingPoints: 100, resetsAt: '2026-10-17T23:00:00.000Z', message: "That is over today's limit of 5000 points for AI tools. The count starts again at midnight." };
    await toTool();
    await typeWords();
    await fireEvent.press(screen.getByTestId('tool-run'));
    await screen.findByTestId('cap-reached');
    expect(hub.posts).toHaveLength(0);
  });
});
