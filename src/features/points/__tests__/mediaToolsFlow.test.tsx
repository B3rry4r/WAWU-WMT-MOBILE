/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Platform, Pressable, Text, View } from 'react-native';

import type { ComponentType } from 'react';

/*
 * POINTS-13 to POINTS-15 on the real Expo Router stack, on Platform.OS android: Make an image, Edit a photo, Make a video and Talking photo
 * (the tiles, the inputs, the job, the working view, the result) and the done view every Studio tool ends in: "Make it a piece" into Create,
 * Save, "Use in a product", and the quiet Download. The pickers' packages, the upload's request object and the phone's file, photo and share
 * modules are replaced at the edge; every handler of the app runs for real over a stand-in `fetch` that answers in the Hub's shapes (AITOOLS-08
 * to AITOOLS-10) and records each request.
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

/** What the phone's picker hands back next, and the answers of the camera permission. */
const mockPick: { photo: { uri: string; mimeType: string; fileName: string; size: number } | null; camera: boolean; recording: { uri: string; name: string; mimeType: string; size: number } | null } = { photo: null, camera: true, recording: null };
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: mockPick.camera })),
  launchCameraAsync: jest.fn(async () => (mockPick.photo ? { canceled: false, assets: [{ ...mockPick.photo, fileSize: mockPick.photo.size }] } : { canceled: true, assets: null })),
  launchImageLibraryAsync: jest.fn(async () => (mockPick.photo ? { canceled: false, assets: [{ ...mockPick.photo, fileSize: mockPick.photo.size }] } : { canceled: true, assets: null })),
}));
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(async () => (mockPick.recording ? { canceled: false, assets: [mockPick.recording] } : { canceled: true, assets: null })),
}));
// The photo is written again without where it was taken: the type it leaves as is the real rule (`rewriteFor`), over a stand-in encoder.
jest.mock('@/features/profile-edit/readPicked', () => {
  const real = jest.requireActual('@/features/profile-edit/readPicked') as typeof import('@/features/profile-edit/readPicked');
  return {
    ...real,
    readPicked: jest.fn(async (asset: { uri: string; mimeType?: string; fileSize?: number }) => {
      const how = real.rewriteFor(asset.mimeType);
      return { blob: new Blob([new Uint8Array(asset.fileSize ?? 1000)], { type: how.contentType }), contentType: how.contentType, extension: how.contentType === 'image/png' ? 'png' : how.contentType === 'image/webp' ? 'webp' : 'jpg', previewUri: asset.uri, discard: jest.fn() };
    }),
  };
});

/** The phone's file module: a download writes a file and reports its progress, until its signal stops it. */
const mockDownload: { calls: { url: string; name: string }[]; failCalls: number; slow: boolean; deleted: string[] } = { calls: [], failCalls: 0, slow: false, deleted: [] };
jest.mock('expo-file-system', () => {
  class File {
    uri: string;
    constructor(_dir: unknown, name: string) {
      this.uri = `file:///cache/${name}`;
    }
    delete() {
      mockDownload.deleted.push(this.uri);
    }
    static downloadFileAsync = jest.fn(async (url: string, target: { uri: string }, options: { onProgress?: (p: { bytesWritten: number; totalBytes: number }) => void; signal?: AbortSignal }) => {
      mockDownload.calls.push({ url, name: target.uri });
      if (mockDownload.calls.length <= mockDownload.failCalls) throw new Error('403');
      options.onProgress?.({ bytesWritten: 25, totalBytes: 100 });
      if (mockDownload.slow) {
        await new Promise<void>((_resolve, reject) => options.signal?.addEventListener('abort', () => reject(new Error('aborted'))));
      }
      options.onProgress?.({ bytesWritten: 100, totalBytes: 100 });
      return target;
    });
  }
  return { File, Directory: class {}, Paths: { cache: { uri: 'file:///cache/' } } };
});

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });
const refuse = (status: number, reason: Record<string, unknown>) => json(status, { data: null, statusCode: status, message: String(reason.message ?? ''), reason });

const OWNER = '00000000-0000-4000-8000-0000000000fa';
const PIC = 'https://files.test/picture.png';
const CLIP = 'https://files.test/clip.mp4';
const VOICE = 'https://files.test/voice.mp3';
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
const photoRule = (use: 'required' | 'optional') => ({ use, folder: 'ai/input-image', accepts: ACCEPT, maxBytes: 25 * 1024 * 1024 });
const SHAPES = ['1:1', '4:5', '9:16', '16:9'];

type Spec = { id: string; action: string; name: string; unit: string; cost: number; kind: string; description: string; options: Record<string, unknown> };
const SPECS: Record<string, Spec> = {
  image: { id: 'image', action: 'image_per_use', name: 'Make an image', unit: 'use', cost: 100, kind: 'image', description: 'Describe a picture and see it.', options: { shapes: SHAPES } },
  'photo-edit': { id: 'photo-edit', action: 'photo_edit_per_use', name: 'Edit a photo', unit: 'use', cost: 100, kind: 'image', description: 'Say what to change.', options: { shapes: SHAPES, photo: photoRule('required') } },
  video: { id: 'video', action: 'video_per_sec', name: 'Make a video', unit: 'second', cost: 250, kind: 'video', description: 'Describe a short clip.', options: { shapes: ['16:9', '9:16'], lengths: [4, 6, 8], photo: photoRule('optional') } },
  'talking-photo': {
    id: 'talking-photo',
    action: 'talking_photo_per_sec',
    name: 'Talking photo',
    unit: 'second',
    cost: 200,
    kind: 'video',
    description: 'Make your photo speak.',
    options: { shapes: [], photo: photoRule('required'), speech: { audioFolder: 'ai/input-audio', accepts: ['audio/mpeg', 'audio/wav'], maxSeconds: 60, fromJob: true } },
  },
};

const hub = {
  points: 1250,
  listed: ['image', 'photo-edit', 'video', 'talking-photo'] as string[],
  creator: true,
  cap: null as null | Record<string, unknown>,
  fail: false,
  workReads: 1,
  roomFull: false,
  tierNeeded: false,
  speechSeconds: 12,
  speechRefusal: null as null | string,
  quotes: [] as Record<string, unknown>[],
  posts: [] as { tool: string; key: string | null; body: Record<string, unknown> }[],
  pieces: [] as { id: string; key: string | null; body: Record<string, unknown> }[],
  presigns: [] as Record<string, unknown>[],
  puts: [] as { url: string; type: string; size: number }[],
  releases: [] as string[],
  jobs: {} as Record<string, Record<string, unknown>>,
  made: 0,
  reads: 0,
  uploads: 0,
  freshLinks: 0,
};

const entry = (spec: Spec) => ({
  id: spec.id,
  action: spec.action,
  name: spec.name,
  description: spec.description,
  unit: spec.unit,
  costPointsPerUnit: spec.cost,
  enabled: true,
  input: { kind: spec.kind, maxCharacters: spec.id === 'talking-photo' ? 0 : 1000, charactersPerUnit: 0, options: spec.options },
  voices: [],
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

const fileOutput = (kind: 'image' | 'video', fresh: number) => {
  const url = kind === 'image' ? PIC : CLIP;
  return { kind, url, contentType: kind === 'image' ? 'image/png' : 'video/mp4', bytes: kind === 'image' ? 480_000 : 8_000_000, name: kind === 'image' ? 'Picture' : 'Video', downloadUrl: `${url}?dl=${fresh}`, pieceFormat: kind };
};

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  if (request.url.startsWith('file:')) return new Response(new Uint8Array(2000), { status: 200 });
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  const method = request.method;
  const body = method === 'POST' ? ((await request.clone().json().catch(() => ({}))) as Record<string, unknown>) : {};
  if (path === '/ai-tools') return ok({ tools: hub.listed.map((id) => entry(SPECS[id])), caps: { dailyPoints: 5000, maxCharactersPerJob: 5000, maxAudioMinutesPerJob: 10 } });
  if (path === '/me/points') return ok({ balance: hub.points, nextExpiry: null, lots: [], lotCount: 0, movements: [] });
  if (path === '/users/me') return ok({ wawuUserId: OWNER, accountType: hub.creator ? 'creator' : 'buyer' });
  if (path === '/points/quote' && method === 'POST') {
    hub.quotes.push(body);
    return ok(quote(body));
  }
  if (path === '/ai-tools/talking-photo/quote' && method === 'POST') {
    hub.quotes.push({ talking: body });
    if (hub.speechRefusal) return refuse(422, { code: 'ai_speech_unreadable', message: hub.speechRefusal });
    return ok({ ...quote({ action: 'talking_photo_per_sec', units: hub.speechSeconds }), speech: { seconds: hub.speechSeconds } });
  }
  if (path === '/uploads/presign' && method === 'POST') {
    hub.presigns.push(body);
    hub.uploads += 1;
    return ok({ uploadUrl: `https://upload.test/${hub.uploads}`, key: `${String(body.folder)}/k${hub.uploads}`, fileUrl: `https://files.test/k${hub.uploads}` });
  }
  if (path === '/uploads/confirm' && method === 'POST') return ok({ status: 'confirmed' });
  if (path === '/uploads/release' && method === 'POST') {
    hub.releases.push(String(body.key));
    return ok({ released: true });
  }
  const start = /^\/ai-tools\/(image|photo-edit|video|talking-photo)\/jobs$/.exec(path);
  if (start && method === 'POST') {
    const spec = SPECS[start[1]];
    const key = request.headers.get('idempotency-key');
    hub.posts.push({ tool: spec.id, key, body });
    if (key && hub.jobs[key]) return json(200, { statusCode: 200, message: 'OK', data: { ...hub.jobs[key] } });
    hub.made += 1;
    const seconds = spec.id === 'video' ? Number(body.seconds) : spec.id === 'talking-photo' ? hub.speechSeconds : 1;
    const job = {
      id: `job-${hub.made}`,
      tool: spec.id,
      state: 'working',
      voiceId: '',
      targetLanguage: null,
      characters: String(body.prompt ?? '').length,
      units: seconds,
      costPoints: spec.cost * seconds,
      audioUrl: null,
      outputs: [],
      message: null,
      saved: false,
      createdAt: '2026-10-30T09:42:00.000Z',
      finishedAt: null,
    };
    hub.jobs[String(key)] = job;
    hub.jobs[job.id] = job;
    hub.points -= spec.cost * seconds;
    return json(202, { statusCode: 202, message: 'Accepted', data: { ...job } });
  }
  const piece = /^\/ai-tools\/jobs\/(.+)\/piece$/.exec(path);
  if (piece && method === 'POST') {
    hub.pieces.push({ id: piece[1], key: request.headers.get('idempotency-key'), body });
    if (hub.tierNeeded) return refuse(402, { code: 'tier_required', message: 'Choose a tier to publish.' });
    if (hub.roomFull) return refuse(413, { code: 'storage_limit_reached', message: 'This file needs 3 MB, but only 1 MB of your 1 GB storage is free.' });
    const job = hub.jobs[piece[1]] as { tool: string };
    const format = job.tool === 'video' || job.tool === 'talking-photo' ? 'video' : 'image';
    return ok({ format, full: { key: `content/full/${OWNER}/piece-${hub.pieces.length}`, fileUrl: `https://files.test/piece-${hub.pieces.length}`, contentType: format === 'video' ? 'video/mp4' : 'image/png', bytes: 480_000, name: `studio-${format}-30-oct-2026`, }, suggestedTitle: `${format === 'video' ? 'Video' : 'Picture'}, 30 Oct 2026` });
  }
  if (path === '/ai-tools/jobs' && method === 'GET') {
    return ok({
      items: [
        { id: 'voice-1', tool: 'voiceover', state: 'done', voiceId: 'ada', targetLanguage: null, characters: 480, units: 1, costPoints: 250, audioUrl: VOICE, outputs: [{ kind: 'audio', url: VOICE }], message: null, saved: false, createdAt: '2026-10-29T10:05:00.000Z', finishedAt: '2026-10-29T10:06:00.000Z' },
        { id: 'sfx-1', tool: 'sound-effect', state: 'done', voiceId: '', targetLanguage: null, characters: 20, units: 1, costPoints: 75, audioUrl: VOICE, outputs: [{ kind: 'audio', url: VOICE }], message: null, saved: false, createdAt: '2026-10-29T10:09:00.000Z', finishedAt: '2026-10-29T10:10:00.000Z' },
      ],
      nextCursor: null,
    });
  }
  const read = /^\/ai-tools\/jobs\/([^/]+)$/.exec(path);
  if (read && method === 'GET') {
    const job = hub.jobs[read[1]];
    if (!job) return refuse(404, { code: 'not_found', message: "We couldn't find that job." });
    hub.reads += 1;
    if (job.state === 'working' && hub.reads >= hub.workReads) {
      if (hub.fail) {
        hub.points += Number(job.costPoints);
        Object.assign(job, { state: 'failed', message: "That didn't work. No points were taken. Try again.", finishedAt: '2026-10-30T09:43:00.000Z' });
      } else Object.assign(job, { state: 'done', outputs: [fileOutput(job.tool === 'video' || job.tool === 'talking-photo' ? 'video' : 'image', 0)], finishedAt: '2026-10-30T09:43:00.000Z' });
    }
    // A fresh read of a finished job gives a fresh link (the old one has expired).
    if (job.state === 'done') {
      hub.freshLinks += 1;
      return ok({ ...job, outputs: [fileOutput(job.tool === 'video' || job.tool === 'talking-photo' ? 'video' : 'image', hub.freshLinks)] });
    }
    return ok({ ...job });
  }
  return json(404, { statusCode: 404, message: `Not here: ${method} ${path}` });
}) as typeof fetch;

/** The upload's request object: a PUT records what went up and answers 200 (the bytes go straight to storage, as on a phone). */
class FakeXhr {
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
    void Promise.resolve().then(() => {
      this.upload.onprogress?.({ lengthComputable: true, loaded: body.size, total: body.size });
      this.status = 200;
      this.onload?.();
    });
  }
  abort() {}
}
(globalThis as unknown as { XMLHttpRequest: unknown }).XMLHttpRequest = FakeXhr;

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
  const { useDetails } = require('@/features/create/details') as typeof import('@/features/create/details');
  const draft = useDraft();
  const details = useDetails();
  return (
    <View>
      <Text accessibilityRole="header">Add a preview</Text>
      <Text testID="draft-format">{draft.format ?? 'none'}</Text>
      <Text testID="draft-file">{draft.full ? `${draft.full.key}|${draft.full.name}|${draft.full.contentType}` : 'no file'}</Text>
      <Text testID="draft-title">{details.title}</Text>
      <Pressable testID="preview-back" onPress={() => router.back()}>
        <Text>Back</Text>
      </Pressable>
    </View>
  );
}
beforeAll(async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
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
}, 60_000);

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(hub, {
    points: 1250,
    listed: ['image', 'photo-edit', 'video', 'talking-photo'],
    creator: true,
    cap: null,
    fail: false,
    workReads: 1,
    roomFull: false,
    tierNeeded: false,
    speechSeconds: 12,
    speechRefusal: null,
    quotes: [],
    posts: [],
    pieces: [],
    presigns: [],
    puts: [],
    releases: [],
    jobs: {},
    made: 0,
    reads: 0,
    uploads: 0,
    freshLinks: 0,
  });
  Object.assign(mockPick, { photo: null, camera: true, recording: null });
  Object.assign(mockDownload, { calls: [], failCalls: 0, slow: false, deleted: [] });
  (require('../voiceoverIntent') as { forgetJobIntentInMemory: () => void }).forgetJobIntentInMemory();
  (require('@/features/create/draft') as typeof import('@/features/create/draft')).resetDraft();
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
const n = (count: number) => count.toLocaleString('en-US');

async function toTool(id: string, url = `/studio-tool?tool=${id}`) {
  const rendered = await renderRouter(routes, { initialUrl: url });
  await screen.findByTestId('tool-run');
  return rendered;
}
const describe_ = async (words: string) => {
  await fireEvent.changeText(await screen.findByTestId('tool-text'), words);
};
async function runAndFinish() {
  await fireEvent.press(screen.getByTestId('tool-run'));
  await screen.findByTestId('tool-working');
  await sleep(2100);
}
/** The phone's picker hands back a photo and the app uploads it; resolves when the photo row says it is ready. */
async function pickPhoto(photo: { mimeType?: string; fileName?: string; size?: number } = {}, from: 'tool-photo-choose' | 'tool-photo-camera' = 'tool-photo-choose') {
  mockPick.photo = { uri: 'file:///cache/ImagePicker/p.jpg', mimeType: photo.mimeType ?? 'image/jpeg', fileName: photo.fileName ?? 'holiday.jpg', size: photo.size ?? 3000 };
  await fireEvent.press(screen.getByTestId(from));
}

describe('PT1 · the tiles for the picture and video tools', () => {
  it('a person sees a tile for each tool the Hub lists with its cost, opens one, and sees none for a tool the Hub does not list (R-47)', async () => {
    hub.listed = ['image', 'video'];
    await renderRouter(routes, { initialUrl: '/studio' });
    expect(await screen.findByTestId('studio-tool-image')).toHaveAccessibleName('Make an image, 100');
    expect(screen.getByTestId('studio-tool-video')).toHaveAccessibleName('Make a video, 250 a second');
    expect(screen.queryByTestId('studio-tool-photo-edit')).toBeNull();
    expect(screen.queryByTestId('studio-tool-talking-photo')).toBeNull();
    expect(screen.getByTestId('studio-line')).toHaveTextContent('Every AI tool, paid in points');
    await fireEvent.press(screen.getByTestId('studio-tool-video'));
    await screen.findByTestId('tool-text');
    expect(screen.getByRole('header', { name: 'Make a video' })).toBeTruthy();
  });

  it('a tool the Hub lists without the options its screen reads is not drawn', async () => {
    const edit = SPECS['photo-edit'];
    const saved = edit.options;
    edit.options = { shapes: SHAPES };
    try {
      await renderRouter(routes, { initialUrl: '/studio' });
      await screen.findByTestId('studio-tool-image');
      expect(screen.queryByTestId('studio-tool-photo-edit')).toBeNull();
    } finally {
      edit.options = saved;
    }
  });
});

describe('PT2 · Make an image', () => {
  it('a person describes a picture, picks a shape, sees the Hub’s cost, runs it, sees it working and then the picture, and the points line', async () => {
    await toTool('image');
    await describe_('A red door in a blue wall');
    expect((await screen.findByTestId('tool-cost')).props.children).toBeTruthy();
    expect(screen.getByTestId('tool-cost')).toHaveTextContent('This uses 100 points');
    expect(screen.getByTestId('tool-shape-1:1')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('tool-shape-9:16'));
    await fireEvent.press(screen.getByTestId('tool-run'));
    await screen.findByTestId('tool-working');
    expect(hub.posts).toHaveLength(1);
    expect(hub.posts[0].body).toEqual({ prompt: 'A red door in a blue wall', shape: '9:16', quoteToken: 'job-image_per_use-100' });
    expect(hub.posts[0].key).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
    await sleep(2100);
    await screen.findByTestId('result-picture');
    await waitFor(() => expect(screen.getByTestId('tool-used')).toHaveTextContent(`100 points used · ${n(1150)} left`));
  });

  it('each shape the Hub lists is a chip and the one tapped is what the job carries', async () => {
    for (const shape of SHAPES) {
      hub.posts = [];
      const { unmount } = await toTool('image');
      await describe_('A hill');
      await screen.findByTestId('tool-cost');
      await fireEvent.press(screen.getByTestId(`tool-shape-${shape}`));
      await fireEvent.press(screen.getByTestId('tool-run'));
      await screen.findByTestId('tool-working');
      expect(hub.posts[0].body.shape).toBe(shape);
      await unmount();
      (require('../voiceoverIntent') as { forgetJobIntentInMemory: () => void }).forgetJobIntentInMemory();
      mockVault.forEach((_v, k) => k.startsWith('wmt.points.job') && mockVault.delete(k));
    }
  });

  it('a double tap on Run sends one request', async () => {
    await toTool('image');
    await describe_('A hill');
    await screen.findByTestId('tool-cost');
    const run = screen.getByTestId('tool-run');
    await act(async () => {
      void fireEvent.press(run);
      void fireEvent.press(run);
    });
    await screen.findByTestId('tool-working');
    expect(hub.posts).toHaveLength(1);
    expect(hub.made).toBe(1);
  });

  it('a failed job says no points were taken, and the balance is the Hub’s unchanged one', async () => {
    hub.fail = true;
    await toTool('image');
    await describe_('A hill');
    await screen.findByTestId('tool-cost');
    await runAndFinish();
    await screen.findByTestId('tool-failed');
    expect(screen.getByTestId('tool-failed')).toHaveTextContent(/No points were taken/);
    expect(hub.points).toBe(1250);
    await waitFor(() => expect(screen.getByTestId('points-subtitle')).toHaveTextContent(`Points: ${n(1250)}`));
  });

  it('with too few points the sheet appears and nothing runs; past the daily limit the limit view names when it resets', async () => {
    hub.points = 40;
    await toTool('image');
    await describe_('A hill');
    await screen.findByTestId('tool-cost');
    await fireEvent.press(screen.getByTestId('tool-run'));
    expect(await screen.findByText('Not enough points')).toBeTruthy();
    expect(hub.posts).toHaveLength(0);
  });
});

describe('POINTS-13 · the done view of a picture', () => {
  async function toDonePicture() {
    await toTool('image');
    await describe_('A red door in a blue wall');
    await screen.findByTestId('tool-cost');
    await runAndFinish();
    await screen.findByTestId('result-card');
  }

  it('a creator sees "Make it a piece" first and largest, then Save, with a small quiet Download, and a tap on the picture opens it larger and Back closes it', async () => {
    await toDonePicture();
    const piece = await screen.findByTestId('result-piece');
    const save = screen.getByTestId('result-save');
    const download = screen.getByTestId('result-download');
    expect(piece).toHaveAccessibleName('Make it a piece. Into Create, as an image');
    const all = screen.getAllByTestId(/^(result-piece|result-save|result-download|tool-used)$/);
    expect(all.map((x) => x.props.testID)).toEqual(['result-piece', 'result-save', 'result-download', 'tool-used']);
    // The piece row is the tallest part and Download the smallest: their styles say so.
    const styleOf = (node: { props: { style?: unknown } }) => (typeof node.props.style === 'function' ? (node.props.style as (s: { pressed: boolean }) => unknown)({ pressed: false }) : node.props.style);
    const flat = (node: { props: { style?: unknown } }) => Object.assign({}, ...[styleOf(node)].flat(4).filter(Boolean)) as { minHeight?: number; fontSize?: number };
    expect(flat(piece).minHeight).toBeGreaterThan(64);
    expect(screen.getByTestId('result-download')).toHaveTextContent('Download');
    expect(save).toBeTruthy();
    expect(download).toBeTruthy();
    expect(screen.queryByTestId('result-use')).toBeNull();
    await fireEvent.press(screen.getByTestId('result-picture'));
    expect(await screen.findByTestId('result-picture-large')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('result-picture-close'));
    await waitFor(() => expect(screen.queryByTestId('result-picture-large')).toBeNull());
  });

  it('a creator taps "Make it a piece": Create opens on the preview step with the format image, the file in the draft and the title filled in; Back returns to the result, and tapping again opens it without a second copy', async () => {
    await toDonePicture();
    await fireEvent.press(await screen.findByTestId('result-piece'));
    await screen.findByText('Add a preview');
    expect(hub.pieces).toHaveLength(1);
    expect(hub.pieces[0].body).toEqual({ outputIndex: 0 });
    expect(hub.pieces[0].key).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
    expect(screen.getByTestId('draft-format')).toHaveTextContent('image');
    expect(screen.getByTestId('draft-file')).toHaveTextContent(`content/full/${OWNER}/piece-1|studio-image-30-oct-2026|image/png`);
    expect(screen.getByTestId('draft-title')).toHaveTextContent('Picture, 30 Oct 2026');
    await fireEvent.press(screen.getByTestId('preview-back'));
    await screen.findByTestId('result-picture');
    expect(screen.getByTestId('tool-used')).toHaveTextContent(/100 points used/);
    expect(hub.posts).toHaveLength(1);
    await fireEvent.press(screen.getByTestId('result-piece'));
    await screen.findByText('Add a preview');
    expect(hub.pieces).toHaveLength(1);
  });

  it('a person with no room is told in the Hub’s words and stays on the result; a person who needs a tier is sent to the tiers', async () => {
    hub.roomFull = true;
    await toDonePicture();
    await fireEvent.press(await screen.findByTestId('result-piece'));
    expect(await screen.findByTestId('piece-failure')).toHaveTextContent(/This file needs 3 MB, but only 1 MB of your 1 GB storage is free\./);
    expect(screen.getByTestId('result-picture')).toBeTruthy();
    hub.roomFull = false;
    hub.tierNeeded = true;
    await fireEvent.press(screen.getByTestId('result-piece'));
    await screen.findByText('Tiers');
  });

  it('a person who is not a creator sees Save and Download and no "Make it a piece"', async () => {
    hub.creator = false;
    await toDonePicture();
    await waitFor(() => expect(screen.getByTestId('result-save')).toBeTruthy());
    expect(screen.getByTestId('result-download')).toBeTruthy();
    expect(screen.queryByTestId('result-piece')).toBeNull();
  });

  it('a result no Create format takes shows no "Make it a piece" and no dead end (Save and Download remain)', async () => {
    await toDonePicture();
    const job = hub.jobs['job-1'];
    const noFormat = { ...job, outputs: [{ ...(job.outputs as Record<string, unknown>[])[0], pieceFormat: null }] };
    const { DoneCard } = require('../ResultView') as typeof import('../ResultView');
    const { render } = require('@testing-library/react-native') as typeof import('@testing-library/react-native');
    const view = await render(
      <DoneCard owner={OWNER} job={noFormat as never} toolName="Make an image" creator onPiece={jest.fn()} onReopen={jest.fn()} onNeedTier={jest.fn()} onProductsFull={jest.fn()} onNotice={jest.fn()} />,
    );
    expect(view.queryByTestId('result-piece')).toBeNull();
    expect(view.getByTestId('result-save')).toBeTruthy();
    expect(view.getByTestId('result-download')).toBeTruthy();
  });

  it('Download saves a picture to the phone’s photos, and says so when the photos are not allowed', async () => {
    const photos = require('expo-media-library') as { requestPermissionsAsync: jest.Mock; Asset: { create: jest.Mock } };
    photos.requestPermissionsAsync.mockResolvedValue({ granted: true });
    await toDonePicture();
    await fireEvent.press(screen.getByTestId('result-download'));
    await waitFor(() => expect(photos.Asset.create).toHaveBeenCalledTimes(1));
    expect(mockDownload.calls[0].url).toMatch(/^https:\/\/files\.test\/picture\.png\?dl=/);
    expect(mockDownload.deleted).toHaveLength(1);
    expect(await screen.findByTestId('tool-notice-ok')).toHaveTextContent('Saved to your photos.');
    photos.requestPermissionsAsync.mockResolvedValue({ granted: false });
    await fireEvent.press(screen.getByTestId('result-download'));
    expect(await screen.findByTestId('download-failure')).toHaveTextContent(/We can't save to your photos/);
    expect(photos.Asset.create).toHaveBeenCalledTimes(1);
  });

  it('an expired link is read again for a fresh one and the download is tried once more; a failure that persists says so and changes nothing else', async () => {
    const photos = require('expo-media-library') as { requestPermissionsAsync: jest.Mock; Asset: { create: jest.Mock } };
    photos.requestPermissionsAsync.mockResolvedValue({ granted: true });
    await toDonePicture();
    // The first link has expired: the first try fails.
    mockDownload.failCalls = 1;
    await fireEvent.press(screen.getByTestId('result-download'));
    await waitFor(() => expect(mockDownload.calls.length).toBeGreaterThanOrEqual(2));
    expect(mockDownload.calls[1].url).not.toBe(mockDownload.calls[0].url);
    expect(photos.Asset.create).toHaveBeenCalledTimes(1);
    mockDownload.failCalls = 99;
    await fireEvent.press(screen.getByTestId('result-download'));
    expect(await screen.findByTestId('download-failure')).toHaveTextContent(/We couldn't download that/);
    expect(screen.getByTestId('result-picture')).toBeTruthy();
    expect(screen.getByTestId('tool-used')).toBeTruthy();
  });
});

describe('PT2 · Edit a photo', () => {
  it('a person chooses a photo from the library, it uploads, Run waits for it, and the edited picture shows beside the original', async () => {
    await toTool('photo-edit');
    await describe_('Make the sky orange');
    expect(screen.getByTestId('tool-run')).toBeDisabled();
    await pickPhoto();
    await waitFor(() => expect(screen.getByTestId('tool-photo-state')).toHaveTextContent('Ready'));
    expect(hub.presigns).toEqual([{ folder: 'ai/input-image', contentType: 'image/jpeg', extension: 'jpg', contentLength: 3000 }]);
    expect(hub.puts).toEqual([{ url: 'https://upload.test/1', type: 'image/jpeg', size: 3000 }]);
    await screen.findByTestId('tool-cost');
    await runAndFinish();
    expect(hub.posts[0].body).toEqual({ prompt: 'Make the sky orange', shape: '1:1', photoKey: 'ai/input-image/k1', quoteToken: 'job-photo_edit_per_use-100' });
    await screen.findByTestId('result-picture');
    expect(screen.getByTestId('tool-original')).toBeTruthy();
  });

  it('a photo over the Hub’s size is refused before Run with the reason; a GIF leaves as a PNG and a HEIC photo as a JPEG, and both are accepted', async () => {
    await toTool('photo-edit');
    await describe_('Make the sky orange');
    await pickPhoto({ size: 26 * 1024 * 1024 });
    expect(await screen.findByTestId('tool-photo-refused')).toHaveTextContent(/over the 25 MB limit/);
    expect(hub.presigns).toHaveLength(0);
    // A GIF leaves as a PNG (its first frame), which the Hub takes.
    await pickPhoto({ mimeType: 'image/gif', fileName: 'x.gif', size: 4000 });
    await waitFor(() => expect(screen.getByTestId('tool-photo-state')).toHaveTextContent('Ready'));
    expect(hub.presigns[0]).toMatchObject({ contentType: 'image/png', extension: 'png' });
    hub.presigns = [];
    await pickPhoto({ mimeType: 'image/heic', fileName: 'IMG_0001.HEIC', size: 5000 });
    await waitFor(() => expect(screen.getByTestId('tool-photo-state')).toHaveTextContent('Ready'));
    expect(hub.presigns[0]).toMatchObject({ contentType: 'image/jpeg', extension: 'jpg' });
  });

  it('replacing the photo lets the old upload go; taking it away lets it go too', async () => {
    await toTool('photo-edit');
    await pickPhoto();
    await waitFor(() => expect(screen.getByTestId('tool-photo-state')).toHaveTextContent('Ready'));
    await pickPhoto({ fileName: 'other.jpg' });
    await waitFor(() => expect(hub.releases).toEqual(['ai/input-image/k1']));
    await waitFor(() => expect(screen.getByTestId('tool-photo-state')).toHaveTextContent('Ready'));
    await fireEvent.press(screen.getByTestId('tool-photo-remove'));
    await waitFor(() => expect(hub.releases).toEqual(['ai/input-image/k1', 'ai/input-image/k2']));
  });

  it('a camera shot uploads the same way; when the camera is off the person is told and the library still works', async () => {
    await toTool('photo-edit');
    mockPick.camera = false;
    await pickPhoto({}, 'tool-photo-camera');
    expect(await screen.findByTestId('tool-camera-off')).toBeTruthy();
    expect(hub.presigns).toHaveLength(0);
    await pickPhoto();
    await waitFor(() => expect(screen.getByTestId('tool-photo-state')).toHaveTextContent('Ready'));
    mockPick.camera = true;
    await pickPhoto({ fileName: 'shot.jpg' }, 'tool-photo-camera');
    await waitFor(() => expect(hub.presigns).toHaveLength(2));
  });
});

describe('PT2 · Make a video', () => {
  it('a person describes a clip, picks 4 seconds and tall, sees the cost for 4 seconds, runs it, leaves, and the tool reopens on the running job; the finished video plays', async () => {
    hub.workReads = 3;
    const first = await toTool('video');
    await describe_('A red ball rolls across a table');
    await screen.findByTestId('tool-cost');
    expect(screen.getByTestId('tool-cost')).toHaveTextContent('This uses 1,000 points');
    await fireEvent.press(screen.getByTestId('tool-length-chip-6'));
    await waitFor(() => expect(screen.getByTestId('tool-cost')).toHaveTextContent('This uses 1,500 points'));
    await fireEvent.press(screen.getByTestId('tool-length-chip-4'));
    await fireEvent.press(screen.getByTestId('tool-shape-9:16'));
    await waitFor(() => expect(screen.getByTestId('tool-cost')).toHaveTextContent('This uses 1,000 points'));
    await fireEvent.press(screen.getByTestId('tool-run'));
    await screen.findByTestId('tool-working');
    expect(screen.getByText(/You can leave this screen. We will tell you when it is ready./)).toBeTruthy();
    expect(hub.posts[0].body).toEqual({ prompt: 'A red ball rolls across a table', shape: '9:16', seconds: 4, quoteToken: 'job-video_per_sec-1000' });
    // The person leaves; the tool opened again finds the running job and sends no second request.
    await first.unmount();
    queryClient.clear();
    (require('../voiceoverIntent') as { forgetJobIntentInMemory: () => void }).forgetJobIntentInMemory();
    await renderRouter(routes, { initialUrl: '/studio-tool?tool=video' });
    await screen.findByTestId('tool-working');
    await sleep(2100);
    await sleep(2100);
    await screen.findByTestId('result-video');
    expect(hub.posts).toHaveLength(1);
    expect(screen.getByTestId('result-video-view')).toBeTruthy();
    expect(screen.getByTestId('tool-used')).toHaveTextContent(/1,000 points used/);
  });

  it('the ready notice opens the tool on the finished video', async () => {
    hub.jobs['job-9'] = { id: 'job-9', tool: 'video', state: 'done', voiceId: '', targetLanguage: null, characters: 12, units: 4, costPoints: 1000, audioUrl: null, outputs: [fileOutput('video', 0)], message: null, saved: false, createdAt: '2026-10-30T09:42:00.000Z', finishedAt: '2026-10-30T09:43:00.000Z' };
    await renderRouter(routes, { initialUrl: '/studio-tool?job=job-9' });
    await screen.findByTestId('result-video');
    expect(screen.getByRole('header', { name: 'Make a video' })).toBeTruthy();
  });

  it('a person adds a start photo and it uploads and is used; removing it lets the upload go; a finished video becomes a video piece', async () => {
    await toTool('video');
    await describe_('A red ball rolls across a table');
    await pickPhoto();
    await waitFor(() => expect(screen.getByTestId('tool-photo-state')).toHaveTextContent('Ready'));
    await fireEvent.press(screen.getByTestId('tool-photo-remove'));
    await waitFor(() => expect(hub.releases).toEqual(['ai/input-image/k1']));
    await pickPhoto();
    await waitFor(() => expect(screen.getByTestId('tool-photo-state')).toHaveTextContent('Ready'));
    await screen.findByTestId('tool-cost');
    await runAndFinish();
    expect(hub.posts[0].body).toMatchObject({ photoKey: 'ai/input-image/k2', seconds: 4 });
    await fireEvent.press(await screen.findByTestId('result-piece'));
    await screen.findByText('Add a preview');
    expect(screen.getByTestId('draft-format')).toHaveTextContent('video');
    expect(screen.getByTestId('draft-file')).toHaveTextContent(/video\/mp4/);
  });

  it('a large video shows its progress and can be stopped, and a stopped download changes nothing', async () => {
    mockDownload.slow = true;
    await toTool('video');
    await describe_('A red ball rolls across a table');
    await screen.findByTestId('tool-cost');
    await runAndFinish();
    await screen.findByTestId('result-video');
    await fireEvent.press(screen.getByTestId('result-download'));
    expect(await screen.findByTestId('result-downloading')).toHaveTextContent(/Downloading 25%/);
    await fireEvent.press(screen.getByTestId('result-download-cancel'));
    await waitFor(() => expect(screen.queryByTestId('result-downloading')).toBeNull());
    expect(screen.queryByTestId('download-failure')).toBeNull();
    expect(mockDownload.deleted).toHaveLength(1);
    expect(screen.getByTestId('result-video')).toBeTruthy();
  });
});

describe('PT2 · Talking photo', () => {
  async function photoAndVoice() {
    hub.points = 5000;
    await toTool('talking-photo');
    expect(screen.queryByTestId('tool-text')).toBeNull();
    await pickPhoto();
    await waitFor(() => expect(screen.getByTestId('tool-photo-state')).toHaveTextContent('Ready'));
  }

  it('a person picks a photo and a recording, sees the cost for the length the Hub read, runs it and watches the photo speak; no way to record is drawn', async () => {
    await photoAndVoice();
    expect(screen.queryByText(/Record/)).toBeNull();
    mockPick.recording = { uri: 'file:///cache/DocumentPicker/voice.mp3', name: 'voice.mp3', mimeType: 'audio/mpeg', size: 2000 };
    await fireEvent.press(screen.getByTestId('tool-voice-file'));
    await waitFor(() => expect(screen.getByTestId('tool-voice-state')).toHaveTextContent('Your voice runs 12 seconds'));
    expect(hub.presigns[1]).toMatchObject({ folder: 'ai/input-audio', contentType: 'audio/mpeg' });
    await waitFor(() => expect(screen.getByTestId('tool-cost')).toHaveTextContent('This uses 2,400 points'));
    await runAndFinish();
    expect(hub.posts[0].body).toEqual({ photoKey: 'ai/input-image/k1', audioKey: 'ai/input-audio/k2', quoteToken: 'job-talking_photo_per_sec-2400' });
    await screen.findByTestId('result-video');
  });

  it('a person uses one of their own finished voice results instead; only voice results are listed', async () => {
    await photoAndVoice();
    await fireEvent.press(screen.getByTestId('tool-voice-result'));
    await screen.findByTestId('tool-voice-results');
    expect(screen.getByTestId('tool-voice-result-voice-1')).toBeTruthy();
    expect(screen.queryByTestId('tool-voice-result-sfx-1')).toBeNull();
    await fireEvent.press(screen.getByTestId('tool-voice-result-voice-1'));
    await waitFor(() => expect(screen.getByTestId('tool-voice-state')).toHaveTextContent('Your voice runs 12 seconds'));
    await screen.findByTestId('tool-cost');
    await runAndFinish();
    expect(hub.posts[0].body).toEqual({ photoKey: 'ai/input-image/k1', sourceJobId: 'voice-1', quoteToken: 'job-talking_photo_per_sec-2400' });
  });

  it('a recording the Hub refuses (too long or unreadable) is refused before Run in the Hub’s own words, and a recording of the wrong type before it goes up', async () => {
    await photoAndVoice();
    mockPick.recording = { uri: 'file:///cache/DocumentPicker/voice.m4a', name: 'voice.m4a', mimeType: 'audio/mp4', size: 2000 };
    await fireEvent.press(screen.getByTestId('tool-voice-file'));
    expect(await screen.findByTestId('tool-voice-refused')).toHaveTextContent(/Choose an MP3 or WAV recording\./);
    expect(hub.presigns).toHaveLength(1);
    hub.speechRefusal = 'That voice is longer than 60 seconds.';
    mockPick.recording = { uri: 'file:///cache/DocumentPicker/long.mp3', name: 'long.mp3', mimeType: 'audio/mpeg', size: 2000 };
    await fireEvent.press(screen.getByTestId('tool-voice-file'));
    await waitFor(() => expect(screen.getByTestId('tool-voice-refused')).toHaveTextContent(/That voice is longer than 60 seconds\./));
    expect(screen.getByTestId('tool-run')).toBeDisabled();
    expect(hub.posts).toHaveLength(0);
  });
});

describe('POINTS-13 · the Android back button and the stems list', () => {
  it('Back leaves the tool from the input, the working view and the result', async () => {
    const rendered = await toTool('image');
    await fireEvent.press(screen.getByTestId('points-back'));
    await waitFor(() => expect(screen.queryByTestId('tool-screen')).toBeNull());
    await rendered.unmount();
    await toTool('image');
    await describe_('A hill');
    await screen.findByTestId('tool-cost');
    await fireEvent.press(screen.getByTestId('tool-run'));
    await screen.findByTestId('tool-working');
    await fireEvent.press(screen.getByTestId('points-back'));
    await waitFor(() => expect(screen.queryByTestId('tool-screen')).toBeNull());
  });

  it('a result with several files asks which one first, in the list, and sends that file’s place', async () => {
    const { DoneCard } = require('../ResultView') as typeof import('../ResultView');
    const { render } = require('@testing-library/react-native') as typeof import('@testing-library/react-native');
    const stems = {
      id: 'job-stems',
      tool: 'music',
      state: 'done',
      voiceId: '',
      targetLanguage: null,
      characters: 0,
      units: 1,
      costPoints: 500,
      audioUrl: VOICE,
      saved: false,
      createdAt: '2026-10-30T09:42:00.000Z',
      finishedAt: null,
      message: null,
      outputs: [
        { kind: 'audio', url: VOICE, name: 'Vocals', contentType: 'audio/mpeg', bytes: 10, downloadUrl: `${VOICE}?dl=1`, pieceFormat: 'audio' },
        { kind: 'audio', url: `${VOICE}?2`, name: 'Drums', contentType: 'audio/mpeg', bytes: 10, downloadUrl: `${VOICE}?dl=2`, pieceFormat: 'audio' },
      ],
    };
    const view = await render(<DoneCard owner={OWNER} job={stems as never} toolName="Music track" creator onUse={jest.fn()} onPiece={jest.fn()} onReopen={jest.fn()} onNeedTier={jest.fn()} onProductsFull={jest.fn()} onNotice={jest.fn()} />);
    expect(view.getByTestId('result-use')).toBeTruthy();
    await fireEvent.press(view.getByTestId('result-piece'));
    expect(view.getByTestId('piece-picker')).toBeTruthy();
    await fireEvent.press(view.getByTestId('piece-picker-1'));
    await waitFor(() => expect(hub.pieces).toHaveLength(1));
    expect(hub.pieces[0].body).toEqual({ outputIndex: 1 });
  });
});
