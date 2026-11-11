/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { AppState, BackHandler, Modal, Pressable, Text, View } from 'react-native';

import type { ComponentType } from 'react';

/*
 * The shared stand-in for POINTS-16, POINTS-17, POINTS-18 and POINTS-12's flow tests: a Hub that answers in the shapes of AITOOLS-11, -12, -13 and -06
 * (the catalogue, the quotes, the uploads, the jobs, the saved voice and the Receptionist) and records every request, and the phone's edge (the
 * pickers, the microphone, the upload's request object). Every handler of the app runs for real on top of it.
 */
export const OWNER = '00000000-0000-4000-8000-0000000000fb';
const MB = 1024 * 1024;
const AUDIO = 'https://files.test/audio.mp3';
const PART = (n: number) => `https://files.test/part-${n}.mp3`;

export const VOICES = [
  { id: 'ada', name: 'Ada', description: 'Warm' },
  { id: 'tunde', name: 'Tunde', description: 'Deep' },
  { id: 'zara', name: 'Zara', description: 'Bright' },
];
const FILE = (over: Record<string, unknown>) => ({
  folders: { audio: 'ai/input-audio', video: 'ai/input-video' },
  accepts: { audio: ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac'], video: ['video/mp4', 'video/quicktime'] },
  maxBytes: 500 * MB,
  maxMinutes: 10,
  languageCode: false,
  ...over,
});
export const CLONE_LINE = 'I, Ada Obi, agree that my voice may be kept for my own WAWU voice tools.';

type Spec = { action: string; name: string; unit: string; cost: number; description: string; input: Record<string, unknown>; voices: boolean };
export const SPECS: Record<string, Spec> = {
  'voice-changer': { action: 'voice_changer_per_min', name: 'Voice changer', unit: 'minute', cost: 400, description: 'Say it again in another voice.', voices: true, input: { kind: 'file', maxCharacters: 0, charactersPerUnit: 0, file: FILE({ only: 'audio', voice: true }) } },
  dialogue: { action: 'dialogue_per_min', name: 'Dialogue', unit: 'minute', cost: 250, description: 'Write a scene and hear it in several voices.', voices: true, input: { kind: 'dialogue', maxCharacters: 400, charactersPerUnit: 900, dialogue: { maxVoices: 2 } } },
  'my-voice': { action: 'voice_clone_once', name: 'Clone your own voice', unit: 'use', cost: 100, description: 'Keep a copy of your voice for your voice tools.', voices: false, input: { kind: 'file', maxCharacters: 0, charactersPerUnit: 0, file: FILE({ only: 'audio', clone: true, maxSeconds: 180 }) } },
  'video-music': { action: 'video_music_per_track', name: 'Music for a video', unit: 'track', cost: 500, description: 'Get music made for your video.', voices: false, input: { kind: 'file', maxCharacters: 0, charactersPerUnit: 0, file: FILE({ only: 'video', maxSeconds: 120, description: { maxCharacters: 60 } }) } },
  stems: { action: 'stems_per_song', name: 'Split a song', unit: 'use', cost: 300, description: 'Pull a song apart into its voice and instruments.', voices: false, input: { kind: 'file', maxCharacters: 0, charactersPerUnit: 0, file: FILE({ only: 'audio', maxSeconds: 600, parts: [2, 6] }) } },
  audiobook: { action: 'audiobook_per_min', name: 'Audiobook', unit: 'minute', cost: 250, description: 'Turn a long text into an audiobook.', voices: true, input: { kind: 'text', maxCharacters: 50000, charactersPerUnit: 900 } },
  podcast: {
    action: 'podcast_standard',
    name: 'Podcast maker',
    unit: 'use',
    cost: 1250,
    description: 'Turn a text or a web page into a podcast.',
    voices: true,
    input: {
      kind: 'podcast',
      maxCharacters: 2000,
      charactersPerUnit: 0,
      podcast: {
        modes: ['conversation', 'bulletin'],
        maxVoices: 2,
        durations: [
          { id: 'short', action: 'podcast_short', costPoints: 750 },
          { id: 'standard', action: 'podcast_standard', costPoints: 1250 },
          { id: 'long', action: 'podcast_long', costPoints: 2500 },
        ],
        maxLinkCharacters: 200,
        languages: [
          { code: 'en', name: 'English' },
          { code: 'fr', name: 'French' },
        ],
      },
    },
  },
  receptionist: { action: 'receptionist_message', name: 'Receptionist', unit: 'message', cost: 20, description: 'Your own agent that answers from what you give it.', voices: false, input: { kind: 'chat', maxCharacters: 2000, charactersPerUnit: 2000 } },
};
const PRICE: Record<string, number> = { voice_changer_per_min: 400, dialogue_per_min: 250, voice_clone_once: 100, video_music_per_track: 500, stems_per_song: 300, audiobook_per_min: 250, podcast_short: 750, podcast_standard: 1250, podcast_long: 2500, receptionist_message: 20 };
const ROUTE_TOOL: Record<string, string> = { 'voice-changer': 'voice-changer', dialogue: 'dialogue', 'my-voice': 'my-voice', 'video-music': 'video-music', stems: 'stems', audiobook: 'audiobook', podcast: 'podcast', receptionist: 'receptionist' };

export type Knowledge = { id: string; kind: string; name: string; bytes: number; createdAt: string };
export const hub = {
  points: 5000,
  listed: Object.keys(SPECS) as string[],
  creator: true,
  cap: null as null | Record<string, unknown>,
  fail: false,
  ownVoice: false,
  fileSeconds: 20,
  fileRefusal: null as null | { code: string; message: string },
  holdUploads: false,
  /** A job stays working until the test lets it go (the Back button's "the job is kept" proof). */
  holdJobs: false,
  saved: { state: 'none' as 'none' | 'making' | 'ready', name: null as string | null },
  receptionist: { setUp: false, details: null as null | Record<string, unknown>, knowledge: [] as Knowledge[], available: true },
  quotes: [] as Record<string, unknown>[],
  fileQuotes: [] as { tool: string; body: Record<string, unknown> }[],
  posts: [] as { tool: string; key: string | null; body: Record<string, unknown> }[],
  pieces: [] as { id: string; key: string | null; body: Record<string, unknown> }[],
  presigns: [] as Record<string, unknown>[],
  puts: [] as { url: string; type: string; size: number }[],
  calls: [] as string[],
  jobs: {} as Record<string, Record<string, unknown>>,
  made: 0,
  uploads: 0,
  knowledgeMade: 0,
};

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });
const refuse = (status: number, reason: Record<string, unknown>) => json(status, { data: null, statusCode: status, message: String(reason.message ?? ''), reason });

const entry = (id: string) => {
  const s = SPECS[id];
  const own = hub.ownVoice && s.voices ? [{ id: 'own', name: 'Your voice', description: 'Your own voice, kept for your voice tools.' }] : [];
  return { id, action: s.action, name: s.name, description: s.description, unit: s.unit, costPointsPerUnit: s.cost, enabled: true, input: s.input, voices: s.voices ? [...own, ...VOICES] : [] };
};

function quote(body: Record<string, unknown>) {
  const action = String(body.action);
  const units = Number(body.units ?? 1);
  const cost = (PRICE[action] ?? 0) * units;
  const shortfall = Math.max(0, cost - hub.points);
  return {
    action,
    title: action,
    per: 'minute',
    units,
    languages: 1,
    perUnitPoints: PRICE[action],
    costPoints: cost,
    balancePoints: hub.points,
    shortfallPoints: shortfall,
    useWallet: false,
    quoteToken: `tok-${action}-${cost}`,
    canRun: shortfall === 0 && hub.cap === null,
    cap: hub.cap,
    wallet: null,
    walletNote: null,
  };
}
const piece = (jobId: string, index: number) => ({
  format: 'audio',
  full: { key: `content/full/${OWNER}/piece-${hub.pieces.length}`, fileUrl: `https://files.test/piece-${hub.pieces.length}`, contentType: 'audio/mpeg', bytes: 480_000, name: `studio-audio-${jobId}-${index}` },
  suggestedTitle: 'Audio, 30 Oct 2026',
});
const audioOut = (url: string, name: string, fresh = 0) => ({ kind: 'audio', url, contentType: 'audio/mpeg', bytes: 480_000, name, downloadUrl: `${url}?dl=${fresh}`, pieceFormat: 'audio' });
function doneJob(job: Record<string, unknown>) {
  const tool = String(job.tool);
  if (tool === 'stems') {
    const names = Number(job.parts) === 6 ? ['Voice', 'Drums', 'Bass', 'Guitar', 'Piano', 'The rest'] : ['Voice', 'The rest'];
    return { ...job, state: 'done', audioUrl: null, outputs: names.map((n, i) => audioOut(PART(i), n)), finishedAt: new Date().toISOString() };
  }
  if (tool === 'receptionist') return { ...job, state: 'done', outputs: [{ kind: 'text', text: 'We open at nine in the morning.' }], finishedAt: new Date().toISOString() };
  if (tool === 'my-voice') return { ...job, state: 'done', outputs: [], finishedAt: new Date().toISOString() };
  return { ...job, state: 'done', audioUrl: AUDIO, outputs: [audioOut(AUDIO, SPECS[tool].name)], finishedAt: new Date().toISOString() };
}

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  if (request.url.startsWith('file:')) {
    const text = (globalThis as unknown as { __bookText?: string }).__bookText;
    return request.url.endsWith('book.txt') && text !== undefined ? new Response(text) : new Response(new Uint8Array(2000), { status: 200 });
  }
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  const method = request.method;
  hub.calls.push(`${method} ${path}`);
  const body = method === 'POST' || method === 'PUT' ? ((await request.clone().json().catch(() => ({}))) as Record<string, unknown>) : {};
  if (path === '/ai-tools') return ok({ tools: hub.listed.map(entry), caps: { dailyPoints: 5000, maxCharactersPerJob: 5000, maxAudioMinutesPerJob: 10 } });
  if (path === '/me/points') return ok({ balance: hub.points, nextExpiry: null, lots: [], lotCount: 0, movements: [] });
  if (path === '/users/me') return ok({ wawuUserId: OWNER, accountType: hub.creator ? 'creator' : 'buyer' });
  if (path === '/points/quote' && method === 'POST') {
    hub.quotes.push(body);
    return ok(quote(body));
  }
  const fileQuote = /^\/ai-tools\/(voice-changer|my-voice|video-music|stems)\/quote$/.exec(path);
  if (fileQuote && method === 'POST') {
    hub.fileQuotes.push({ tool: fileQuote[1], body });
    if (hub.fileRefusal) return refuse(422, hub.fileRefusal);
    const action = SPECS[fileQuote[1]].action;
    const minutes = Math.max(1, Math.ceil(hub.fileSeconds / 60));
    const flat = SPECS[fileQuote[1]].unit !== 'minute';
    return ok({ ...quote({ action, units: flat ? 1 : minutes }), file: { seconds: hub.fileSeconds, minutes } });
  }
  if (path === '/uploads/presign' && method === 'POST') {
    hub.presigns.push(body);
    hub.uploads += 1;
    return ok({ uploadUrl: `https://upload.test/${hub.uploads}`, key: `${String(body.folder)}/k${hub.uploads}`, fileUrl: `https://files.test/k${hub.uploads}` });
  }
  if (path === '/uploads/confirm' && method === 'POST') return ok({ status: 'confirmed' });
  if (path === '/uploads/release' && method === 'POST') return ok({ released: true });

  // The saved voice.
  if (path === '/ai-tools/my-voice' && method === 'GET') return ok(savedView());
  if (path === '/ai-tools/my-voice' && method === 'DELETE') {
    hub.saved = { state: 'none', name: null };
    hub.ownVoice = false;
    return ok({ myVoice: savedView(), atProvider: 'gone' });
  }
  // The Receptionist.
  if (path === '/ai-tools/receptionist' && method === 'GET') return ok(receptionistView());
  if (path === '/ai-tools/receptionist' && method === 'PUT') {
    hub.receptionist.setUp = true;
    hub.receptionist.details = { businessName: body.businessName, offer: body.offer, replyStyle: body.replyStyle ?? '', language: body.language ?? 'en', voiceId: 'ada' };
    return ok(receptionistView());
  }
  if (path === '/ai-tools/receptionist' && method === 'DELETE') {
    hub.receptionist = { setUp: false, details: null, knowledge: [], available: true };
    return ok({ receptionist: receptionistView(), atProvider: 'gone' });
  }
  if (path === '/ai-tools/receptionist/knowledge' && method === 'POST') {
    hub.knowledgeMade += 1;
    hub.receptionist.knowledge.push({ id: `k${hub.knowledgeMade}`, kind: String(body.kind), name: String(body.name), bytes: body.kind === 'text' ? String(body.text).length : 0, createdAt: new Date().toISOString() });
    hub.posts.push({ tool: 'knowledge', key: null, body });
    return json(201, { statusCode: 201, message: 'Created', data: receptionistView() });
  }
  const forget = /^\/ai-tools\/receptionist\/knowledge\/(.+)$/.exec(path);
  if (forget && method === 'DELETE') {
    hub.receptionist.knowledge = hub.receptionist.knowledge.filter((k) => k.id !== forget[1]);
    return ok(receptionistView());
  }

  // Jobs.
  const start = /^\/ai-tools\/(voice-changer|dialogue|my-voice|video-music|stems|audiobook|podcast)\/jobs$/.exec(path) ?? (path === '/ai-tools/my-voice' && method === 'POST' ? ['', 'my-voice'] : null) ?? (path === '/ai-tools/receptionist/messages' ? ['', 'receptionist'] : null);
  if (start && method === 'POST') {
    const id = ROUTE_TOOL[start[1]];
    const spec = SPECS[id];
    const key = request.headers.get('idempotency-key');
    hub.posts.push({ tool: id, key, body });
    if (key && hub.jobs[key]) return json(200, { statusCode: 200, message: 'OK', data: { ...hub.jobs[key] } });
    hub.made += 1;
    const units = id === 'dialogue' || id === 'audiobook' ? 1 : id === 'voice-changer' ? Math.max(1, Math.ceil(hub.fileSeconds / 60)) : 1;
    const price = id === 'podcast' ? PRICE[`podcast_${String(body.duration)}`] : spec.cost;
    const job = { id: `job-${hub.made}`, tool: id, state: 'working', voiceId: String(body.voiceId ?? ''), targetLanguage: null, characters: 0, units, costPoints: price * units, audioUrl: null, outputs: [], message: null, saved: false, createdAt: new Date().toISOString(), finishedAt: null, parts: body.parts };
    hub.jobs[String(key)] = job;
    hub.jobs[job.id] = job;
    hub.points -= price * units;
    if (id === 'my-voice') hub.saved = { state: 'making', name: String(body.name) };
    return json(202, { statusCode: 202, message: 'Accepted', data: { ...job } });
  }
  const pieceMatch = /^\/ai-tools\/jobs\/(.+)\/piece$/.exec(path);
  if (pieceMatch && method === 'POST') {
    hub.pieces.push({ id: pieceMatch[1], key: request.headers.get('idempotency-key'), body });
    return ok(piece(pieceMatch[1], Number(body.outputIndex)));
  }
  const read = /^\/ai-tools\/jobs\/([^/]+)$/.exec(path);
  if (read && method === 'GET') {
    const job = hub.jobs[read[1]];
    if (!job) return refuse(404, { code: 'not_found', message: "We couldn't find that job." });
    if (job.state === 'working' && !hub.holdJobs) {
      if (hub.fail) {
        hub.points += Number(job.costPoints);
        Object.assign(job, { state: 'failed', message: "That didn't work. No points were taken. Try again.", finishedAt: new Date().toISOString() });
        if (job.tool === 'my-voice') hub.saved = { state: 'none', name: null };
      } else {
        Object.assign(job, doneJob(job));
        if (job.tool === 'my-voice') {
          hub.saved = { state: 'ready', name: hub.saved.name };
          hub.ownVoice = true;
        }
      }
    }
    return ok({ ...job });
  }
  return json(404, { statusCode: 404, message: `Not here: ${method} ${path}` });
}) as typeof fetch;

function savedView() {
  return {
    available: hub.listed.includes('my-voice'),
    state: hub.saved.state,
    name: hub.saved.name,
    createdAt: hub.saved.state === 'ready' ? '2026-10-30T09:00:00.000Z' : null,
    consent: { line: CLONE_LINE },
    recording: { folder: 'ai/input-audio', accepts: ['audio/mp4', 'audio/mpeg', 'audio/wav'], minSeconds: 10, maxSeconds: 180, maxBytes: 20 * MB },
  };
}
function receptionistView() {
  const r = hub.receptionist;
  return {
    available: r.available,
    setUp: r.setUp,
    details: r.details,
    knowledge: r.knowledge,
    limits: { docsMax: 3, docMaxBytes: 5 * MB, textMaxChars: 200, messageMaxChars: 100, voiceMaxMinutes: 5, languages: [{ code: 'en', name: 'English' }] },
    voices: VOICES,
  };
}

/** The upload's request object: a PUT records what went up and answers 200 (or is held until the test stops it, to prove a cancel). */
export class UploadRequest {
  upload: { onprogress: ((event: { lengthComputable: boolean; loaded: number; total: number }) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  status = 0;
  private url = '';
  private type = '';
  open(_method: string, url: string) {
    this.url = url;
  }
  setRequestHeader(_name: string, value: string) {
    this.type = value;
  }
  addEventListener() {}
  send(body: Blob) {
    hub.puts.push({ url: this.url, type: this.type, size: body.size });
    if (hub.holdUploads) {
      this.upload.onprogress?.({ lengthComputable: true, loaded: body.size / 4, total: body.size });
      return;
    }
    void Promise.resolve().then(() => {
      this.upload.onprogress?.({ lengthComputable: true, loaded: body.size, total: body.size });
      this.status = 200;
      this.onload?.();
    });
  }
  abort() {
    this.onabort?.();
  }
}
(globalThis as unknown as { XMLHttpRequest: unknown }).XMLHttpRequest = UploadRequest;

const page = (path: string) => (require(path) as { default: ComponentType }).default;
export let routes: Record<string, ComponentType>;
export let session: typeof import('@/api/session');
export let queryClient: typeof import('@/api/query').queryClient;

const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};
const stub = (name: string) => {
  function Stub() {
    return (
      <View>
        <Text accessibilityRole="header">{name}</Text>
      </View>
    );
  }
  return Stub;
};
/** Create's preview step (M22) as far as this task reaches it: what the draft holds when it opens, and Back. */
function PreviewStub() {
  const router = useRouter();
  const { useDraft } = require('@/features/create/draft') as typeof import('@/features/create/draft');
  const draft = useDraft();
  return (
    <View>
      <Text accessibilityRole="header">Add a preview</Text>
      <Text testID="draft-format">{draft.format ?? 'none'}</Text>
      <Text testID="draft-file">{draft.full ? `${draft.full.key}|${draft.full.name}|${draft.full.contentType}` : 'no file'}</Text>
      <Pressable testID="preview-back" onPress={() => router.back()}>
        <Text>Back</Text>
      </Pressable>
    </View>
  );
}

export async function setUpRoutes(vault: Map<string, string>) {
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
    tiers: stub('Tiers'),
    shop: stub('Shop'),
    points: stub('Your points'),
    'points-buy': stub('Buy points'),
    'create-preview': PreviewStub,
    studio: page('@/app/studio'),
    'studio-tool': page('@/app/studio-tool'),
  };
  const { unmount } = await renderRouter(routes, { initialUrl: '/studio' });
  await unmount();
  void vault;
}

export function resetHub(vault: Map<string, string>) {
  Object.assign(hub, {
    points: 5000,
    listed: Object.keys(SPECS),
    creator: true,
    cap: null,
    fail: false,
    ownVoice: false,
    fileSeconds: 20,
    fileRefusal: null,
    holdUploads: false,
  /** A job stays working until the test lets it go (the Back button's "the job is kept" proof). */
  holdJobs: false,
    saved: { state: 'none', name: null },
    receptionist: { setUp: false, details: null, knowledge: [], available: true },
    quotes: [],
    fileQuotes: [],
    posts: [],
    pieces: [],
    presigns: [],
    puts: [],
    calls: [],
    jobs: {},
    made: 0,
    uploads: 0,
    knowledgeMade: 0,
  });
  delete (globalThis as unknown as { __bookText?: string }).__bookText;
  (require('../voiceoverIntent') as { forgetJobIntentInMemory: () => void }).forgetJobIntentInMemory();
  (require('@/features/create/draft') as typeof import('@/features/create/draft')).resetDraft();
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, gcTime: 0 } });
  vault.clear();
  vault.set('wawu.session.access', tokenFor(OWNER));
  vault.set('wawu.session.refresh', 'refresh-1');
  session.resetSessionForTests();
}

/** The app's change-of-state listeners, so a test can send the app to the background (a call came in). */
export const appListeners = new Set<(state: string) => void>();
export function watchAppState() {
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((_type: string, cb: (state: string) => void) => {
    appListeners.add(cb);
    return { remove: () => appListeners.delete(cb) };
  }) as never);
}
export const goToBackground = () =>
  act(async () => {
    appListeners.forEach((cb) => cb('background'));
  });

/** The router test library fakes the clock once it has rendered: time passes by being moved on. */
export const sleep = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });
export const n = (count: number) => count.toLocaleString('en-US');
export async function openTool(id: string, ready: string, extra = '') {
  const rendered = await renderRouter(routes, { initialUrl: `/studio-tool?tool=${id}${extra}` });
  await screen.findByTestId(ready);
  return rendered;
}

/**
 * The phone's Back button (S2-APP-2 patch, F2). On Android a sheet (a native dialog) takes the press first and calls its `onRequestClose`; with none open
 * the press goes to the JavaScript listeners, last registered first, and the first that answers true has it: the router's own listener pops the route. A
 * press nobody takes would close the app, which the helper reports as 'exit'. `watchBackButton` must run before the router renders.
 */
const backListeners: (() => boolean | null | undefined)[] = [];
export function watchBackButton() {
  backListeners.length = 0;
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation(((_type: string, cb: () => boolean | null | undefined) => {
    backListeners.push(cb);
    return {
      remove: () => {
        const at = backListeners.indexOf(cb);
        if (at !== -1) backListeners.splice(at, 1);
      },
    };
  }) as never);
}
type FiberLike = { stateNode?: { current?: FiberLike } | null; alternate?: FiberLike | null; type?: unknown; memoizedProps?: { visible?: boolean; onRequestClose?: () => void }; child?: FiberLike | null; sibling?: FiberLike | null; return?: FiberLike | null };
/** The sheets (native dialogs) that are open right now, read from the rendered tree. */
function openSheets(): { visible?: boolean; onRequestClose?: () => void }[] {
  let top = (screen.root as unknown as { unstable_fiber?: FiberLike }).unstable_fiber;
  while (top?.return) top = top.return;
  // The tree as it is now: the root's `current` (the other copy of each fiber is the one React is not showing).
  top = top?.stateNode?.current ?? top;
  const out: { visible?: boolean; onRequestClose?: () => void }[] = [];
  const walk = (first: FiberLike | null | undefined) => {
    for (let at = first; at; at = at.sibling) {
      if (at.type === Modal && at.memoizedProps?.visible) out.push(at.memoizedProps);
      walk(at.child);
    }
  };
  walk(top);
  return out;
}
export const openSheetCount = () => openSheets().length;
export async function pressAndroidBack(): Promise<'sheet' | 'screen' | 'exit'> {
  const open = openSheets();
  if (open.length > 0) {
    await act(async () => {
      open[open.length - 1].onRequestClose?.();
    });
    return 'sheet';
  }
  let took = false;
  await act(async () => {
    for (let i = backListeners.length - 1; i >= 0 && !took; i--) took = Boolean(backListeners[i]());
  });
  return took ? 'screen' : 'exit';
}
/** Studio first, then the tool's tile: the tool is a screen on top of Studio, as it is on the phone, so Back has somewhere to go. */
export async function openToolFromStudio(id: string, ready: string) {
  const rendered = await renderRouter(routes, { initialUrl: '/studio' });
  await pressTile(id, ready);
  return rendered;
}
export async function pressTile(id: string, ready: string) {
  // STUDIO-HOME (R-113): a tool that is not a main tile is a row of the More menu.
  await screen.findByTestId('studio-balance');
  if (!screen.queryByTestId(`studio-tool-${id}`)) await fireEvent.press(await screen.findByTestId('studio-more'));
  await fireEvent.press(await screen.findByTestId(`studio-tool-${id}`));
  await screen.findByTestId(ready);
}
