/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor, within } from 'expo-router/testing-library';
import { Dimensions, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { ComponentType } from 'react';

/*
 * Studio's home (STUDIO-HOME, R-113) on the real Expo Router stack, over a stand-in `fetch` that answers in the Hub's shapes: the tools it lists
 * (any set), the points, the person's jobs, the quote, the uploads. The phone's picker and the byte upload are stood in the way the other Studio
 * tests do. Nothing is charged on the home: the tests count the job routes the home calls (none).
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
const mockPick = jest.fn();
jest.mock('@/features/create/pickFile', () => ({ canPickFile: true, pickFile: (types: string[]) => mockPick(types) }));
const mockPut = jest.fn();
jest.mock('@/features/create/upload', () => ({
  ...jest.requireActual('@/features/create/upload'),
  xhrPut: (url: string, body: Blob, type: string, onProgress: (share: number) => void) => mockPut(url, body, type, onProgress),
}));

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });

const OWNER = '00000000-0000-4000-8000-0000000000fb';
const MB = 1024 * 1024;
const FILE_RULE = {
  folders: { audio: 'ai/input-audio', video: 'ai/input-video' },
  accepts: { audio: ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac'], video: ['video/mp4', 'video/quicktime', 'video/webm'] },
  maxBytes: 500 * MB,
  maxMinutes: 60,
  languageCode: true,
};
const PHOTO = { use: 'required', folder: 'ai/input-image', accepts: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 25 * MB };
const VOICES = [
  { id: 'ada', name: 'Ada', description: 'Warm and clear' },
  { id: 'tunde', name: 'Tunde', description: 'Deep and calm' },
];
type Spec = { id: string; action: string; name: string; description: string; unit: string; cost: number; voices?: typeof VOICES; input: Record<string, unknown> };
const text = { kind: 'text', maxCharacters: 5000, charactersPerUnit: 900 };
const prompt = { kind: 'prompt', maxCharacters: 500, charactersPerUnit: 0 };
const SPECS: Record<string, Spec> = {
  voiceover: { id: 'voiceover', action: 'voiceover_per_min', name: 'VoiceOver', description: 'Turn your words into spoken audio.', unit: 'minute', cost: 250, voices: VOICES, input: text },
  music: { id: 'music', action: 'music_per_track', name: 'Music track', description: 'Describe a song and hear it.', unit: 'track', cost: 500, input: prompt },
  'sound-effect': { id: 'sound-effect', action: 'sound_effect_per_use', name: 'Sound effect', description: 'Describe a sound and hear it.', unit: 'use', cost: 75, input: prompt },
  'quick-voice': { id: 'quick-voice', action: 'quick_voice_per_min', name: 'Quick voice', description: 'A fast voice for short lines.', unit: 'minute', cost: 125, voices: VOICES, input: text },
  captions: { id: 'captions', action: 'captions_per_min', name: 'Captions', description: 'Turn what is said into words.', unit: 'minute', cost: 15, input: { kind: 'file', maxCharacters: 0, charactersPerUnit: 0, file: FILE_RULE } },
  'clean-audio': { id: 'clean-audio', action: 'clean_audio_per_min', name: 'Clean audio', description: 'Take the noise out of a recording.', unit: 'minute', cost: 400, input: { kind: 'file', maxCharacters: 0, charactersPerUnit: 0, file: FILE_RULE } },
  dubbing: { id: 'dubbing', action: 'dubbing_per_min', name: 'Dubbing', description: 'Hear it in another language.', unit: 'minute', cost: 1500, input: { kind: 'file', maxCharacters: 0, charactersPerUnit: 0, file: { ...FILE_RULE, dubbing: { languages: [{ code: 'es', name: 'Spanish' }] } } } },
  image: { id: 'image', action: 'image_per_use', name: 'Make an image', description: 'Describe a picture and see it.', unit: 'use', cost: 100, input: { kind: 'image', maxCharacters: 1000, charactersPerUnit: 0, options: { shapes: ['1:1', '16:9'] } } },
  'photo-edit': { id: 'photo-edit', action: 'photo_edit_per_use', name: 'Edit a photo', description: 'Say what to change in your photo.', unit: 'use', cost: 100, input: { kind: 'image', maxCharacters: 1000, charactersPerUnit: 0, options: { shapes: ['1:1'], photo: PHOTO } } },
};
// The tools added after launch (the Hub's own names and lines), so a test can list every tool or any set of them.
const AUDIO_FILE = { ...FILE_RULE, only: 'audio' };
const FILE = { kind: 'file', maxCharacters: 0, charactersPerUnit: 0 };
Object.assign(SPECS, {
  video: { id: 'video', action: 'video_per_second', name: 'Make a video', description: 'Describe a short clip and watch it.', unit: 'second', cost: 250, input: { kind: 'video', maxCharacters: 1000, charactersPerUnit: 0, options: { shapes: ['16:9'], lengths: [4, 8] } } },
  'talking-photo': { id: 'talking-photo', action: 'talking_photo_per_second', name: 'Talking photo', description: 'Make your photo speak with a voice.', unit: 'second', cost: 200, input: { kind: 'video', maxCharacters: 0, charactersPerUnit: 0, options: { shapes: [], photo: PHOTO, speech: { audioFolder: 'ai/input-audio', accepts: ['audio/mpeg', 'audio/wav'], maxSeconds: 60 } } } },
  'voice-changer': { id: 'voice-changer', action: 'voice_changer_per_min', name: 'Voice changer', description: 'Say it again in another voice.', unit: 'minute', cost: 400, voices: VOICES, input: { ...FILE, file: { ...AUDIO_FILE, voice: true } } },
  'video-music': { id: 'video-music', action: 'video_music_per_track', name: 'Music for a video', description: 'Get music made for your video.', unit: 'track', cost: 500, input: { ...FILE, file: { ...FILE_RULE, only: 'video', description: { maxCharacters: 200 } } } },
  stems: { id: 'stems', action: 'stems_per_use', name: 'Split a song', description: 'Pull a song apart into its voice and instruments.', unit: 'use', cost: 300, input: { ...FILE, file: { ...AUDIO_FILE, parts: [2, 6] } } },
  audiobook: { id: 'audiobook', action: 'audiobook_per_min', name: 'Audiobook', description: 'Turn a long text into an audiobook.', unit: 'minute', cost: 250, voices: VOICES, input: text },
  dialogue: { id: 'dialogue', action: 'dialogue_per_min', name: 'Dialogue', description: 'Write a scene and hear it in several voices.', unit: 'minute', cost: 250, voices: VOICES, input: { kind: 'dialogue', maxCharacters: 400, charactersPerUnit: 900, dialogue: { maxVoices: 2 } } },
  'my-voice': { id: 'my-voice', action: 'my_voice_per_use', name: 'Clone your own voice', description: 'Keep a copy of your voice for your voice tools.', unit: 'use', cost: 100, input: { ...FILE, file: { ...AUDIO_FILE, clone: true } } },
  podcast: { id: 'podcast', action: 'podcast_per_use', name: 'Podcast maker', description: 'Turn a text or a web page into a podcast.', unit: 'use', cost: 1250, voices: VOICES, input: { kind: 'podcast', maxCharacters: 2000, charactersPerUnit: 0, podcast: { modes: ['conversation', 'bulletin'], maxVoices: 2, durations: [{ id: 'short', action: 'podcast_short', costPoints: 750 }, { id: 'standard', action: 'podcast_standard', costPoints: 1250 }, { id: 'long', action: 'podcast_long', costPoints: 2500 }], maxLinkCharacters: 200, languages: [{ code: 'en', name: 'English' }, { code: 'fr', name: 'French' }] } } },
  receptionist: { id: 'receptionist', action: 'receptionist_per_message', name: 'Receptionist', description: 'Your own agent that answers from what you give it.', unit: 'message', cost: 20, input: { kind: 'chat', maxCharacters: 2000, charactersPerUnit: 0 } },
});
const LAUNCH = ['voiceover', 'quick-voice', 'sound-effect', 'music', 'captions', 'clean-audio', 'dubbing'];

const hub = {
  points: 1250,
  listed: LAUNCH.slice(),
  jobs: [] as Record<string, unknown>[],
  jobsFail: false,
  quotes: [] as Record<string, unknown>[],
  starts: 0,
  uploads: 0,
  presigns: [] as Record<string, unknown>[],
  confirmed: [] as string[],
};

const entry = (spec: Spec) => ({ id: spec.id, action: spec.action, name: spec.name, description: spec.description, unit: spec.unit, costPointsPerUnit: spec.cost, enabled: true, input: spec.input, voices: spec.voices ?? [] });
const done = (id: string, tool: string, outputs: Record<string, unknown>[], audioUrl: string | null = null) => ({ id, tool, state: 'done', voiceId: '', targetLanguage: null, characters: 0, units: 1, costPoints: 100, audioUrl, outputs, message: null, saved: false, createdAt: '2026-10-30T09:00:00.000Z', finishedAt: '2026-10-30T09:01:00.000Z' });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  const method = request.method;
  if (path === '/ai-tools') return ok({ tools: hub.listed.map((id) => entry(SPECS[id])), caps: { dailyPoints: 5000, maxCharactersPerJob: 5000, maxAudioMinutesPerJob: 60 } });
  if (path === '/me/points') return ok({ balance: hub.points, nextExpiry: null, lots: [], lotCount: 0, movements: [] });
  if (path === '/ai-tools/jobs' && method === 'GET') return hub.jobsFail ? json(503, { statusCode: 503, message: 'Not now.' }) : ok({ items: hub.jobs, nextCursor: null });
  const read = /^\/ai-tools\/jobs\/(.+)$/.exec(path);
  if (read && method === 'GET') {
    const job = hub.jobs.find((j) => j.id === read[1]);
    return job ? ok(job) : json(404, { statusCode: 404, message: 'No such job.' });
  }
  if (/^\/ai-tools\/[^/]+\/jobs$/.test(path) && method === 'POST') {
    hub.starts += 1;
    return json(500, { statusCode: 500, message: 'The home never starts a job.' });
  }
  if (path === '/points/quote' && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    hub.quotes.push(body);
    const spec = Object.values(SPECS).find((s) => s.action === body.action) as Spec;
    const units = Number(body.units ?? 1);
    return ok({ action: spec.action, title: spec.name, per: spec.unit, units, languages: 1, perUnitPoints: spec.cost, costPoints: spec.cost * units, balancePoints: hub.points, shortfallPoints: 0, useWallet: false, quoteToken: `job-${spec.action}`, canRun: true, cap: null, wallet: null, walletNote: null });
  }
  if (path === '/uploads/presign' && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    hub.presigns.push(body);
    hub.uploads += 1;
    const key = `${String(body.folder)}/${OWNER}/file-${hub.uploads}.${String(body.extension)}`;
    return ok({ uploadUrl: `https://storage.test/${key}`, key, fileUrl: `https://storage.test/${key}` });
  }
  if (path === '/uploads/confirm' && method === 'POST') {
    const body = (await request.json()) as { key: string };
    hub.confirmed.push(body.key);
    return ok({ key: body.key, status: 'confirmed' });
  }
  const fileQuote = /^\/ai-tools\/([^/]+)\/quote$/.exec(path);
  if (fileQuote && method === 'POST') {
    const spec = SPECS[fileQuote[1]];
    return ok({ action: spec.action, title: spec.name, per: spec.unit, units: 2, languages: 1, perUnitPoints: spec.cost, costPoints: spec.cost * 2, balancePoints: hub.points, shortfallPoints: 0, useWallet: false, quoteToken: `file-${spec.action}`, canRun: true, cap: null, wallet: null, walletNote: null, file: { seconds: 90, minutes: 2 } });
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
    'create-preview': stub('Preview'),
    tiers: stub('Tiers'),
    studio: page('@/app/studio'),
    'studio-tool': page('@/app/studio-tool'),
  };
  const { unmount } = await renderRouter(routes, { initialUrl: '/studio' });
  await unmount();
}, 60_000);

beforeEach(() => {
  Object.assign(hub, { points: 1250, listed: LAUNCH.slice(), jobs: [], jobsFail: false, quotes: [], starts: 0, uploads: 0, presigns: [], confirmed: [] });
  mockPick.mockReset();
  mockPut.mockReset();
  mockPut.mockImplementation(async (_url: string, _body: Blob, _type: string, onProgress: (share: number) => void) => {
    onProgress(0.5);
    return 200;
  });
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

const file = (name: string, contentType: string, bytes = 4 * MB) => ({ blob: { size: bytes } as unknown as Blob, name, contentType, extension: name.split('.').pop() ?? '', previewUri: contentType.startsWith('image/') ? `file:///${name}` : undefined });
async function toHome() {
  await renderRouter(routes, { initialUrl: '/studio' });
  await screen.findByTestId('studio-balance');
}
const chipIds = () => screen.queryAllByTestId(/^studio-chip-/).map((n) => String(n.props.testID).replace('studio-chip-', ''));

describe('STUDIO-HOME · the prompt box and its chips', () => {
  it('a user types a prompt, picks Image, presses Make, and the image tool opens with the words in and its quote, with nothing charged on the home', async () => {
    hub.listed = [...LAUNCH, 'image'];
    await toHome();
    expect(screen.getByRole('header', { name: 'What would you like to make?' })).toBeTruthy();
    expect(chipIds()).toEqual(['image', 'voiceover', 'music', 'sound-effect']);
    expect(screen.getByTestId('studio-prompt').props.placeholder).toBe('Describe a picture');
    await fireEvent.changeText(screen.getByTestId('studio-prompt'), 'A red door in a white wall');
    await fireEvent.press(screen.getByTestId('studio-chip-image'));
    await fireEvent.press(screen.getByTestId('studio-make'));
    await waitFor(() => expect(screen.getByTestId('tool-text').props.value).toBe('A red door in a white wall'));
    expect(screen.getByRole('header', { name: 'Make an image' })).toBeTruthy();
    expect(await screen.findByTestId('tool-cost')).toHaveTextContent('100 points', { exact: false });
    expect(hub.starts).toBe(0);
  });

  it('a user cannot press Make with nothing typed, and the placeholder follows the chip', async () => {
    await toHome();
    expect(screen.getByTestId('studio-make')).toBeDisabled();
    await fireEvent.press(screen.getByTestId('studio-chip-music'));
    expect(screen.getByTestId('studio-prompt').props.placeholder).toBe('Describe a song');
    await fireEvent.changeText(screen.getByTestId('studio-prompt'), 'Slow drums');
    expect(screen.getByTestId('studio-make')).toBeEnabled();
  });

  it('a user picks a voice beside the box for Speech, and the speech tool opens with that voice and the words', async () => {
    await toHome();
    expect(screen.getByTestId('studio-voice')).toHaveAccessibleName('Voice: Ada');
    await fireEvent.press(screen.getByTestId('studio-voice'));
    await fireEvent.press(await screen.findByTestId('studio-voice-tunde'));
    expect(screen.getByTestId('studio-voice')).toHaveAccessibleName('Voice: Tunde');
    await fireEvent.changeText(screen.getByTestId('studio-prompt'), 'Welcome to the show');
    await fireEvent.press(screen.getByTestId('studio-make'));
    await waitFor(() => expect(screen.getByTestId('tool-text').props.value).toBe('Welcome to the show'));
    expect(screen.getByRole('radio', { name: /Tunde/ }).props.accessibilityState?.checked ?? screen.getByRole('radio', { name: /Tunde/ }).props['aria-checked']).toBeTruthy();
  });
});

describe('STUDIO-HOME · a file in the box', () => {
  it('a user attaches a photo and the chips become the tools that take a photo; Make opens the photo tool with the photo already going up', async () => {
    hub.listed = [...LAUNCH, 'image', 'photo-edit'];
    await toHome();
    mockPick.mockResolvedValueOnce(file('me.jpg', 'image/jpeg'));
    await fireEvent.press(screen.getByTestId('studio-attach'));
    await fireEvent.press(await screen.findByTestId('studio-attach-photo'));
    await screen.findByTestId('studio-attached');
    expect(mockPick).toHaveBeenCalledWith(['image/jpeg', 'image/png', 'image/webp']);
    expect(chipIds()).toEqual(['photo-edit']);
    await fireEvent.changeText(screen.getByTestId('studio-prompt'), 'Make the sky orange');
    await fireEvent.press(screen.getByTestId('studio-make'));
    await screen.findByTestId('tool-photo');
    await waitFor(() => expect(screen.getByTestId('tool-photo-state')).toHaveTextContent('Ready', { exact: false }));
    expect(screen.getByTestId('tool-text').props.value).toBe('Make the sky orange');
    expect(hub.presigns).toHaveLength(1);
    expect(hub.starts).toBe(0);
  });

  it('a user attaches a recording and the chips become Dubbing, Captions and Clean audio; Make opens Captions with the recording already in and its quote', async () => {
    await toHome();
    mockPick.mockResolvedValueOnce(file('talk.mp3', 'audio/mpeg'));
    await fireEvent.press(screen.getByTestId('studio-attach'));
    expect(screen.queryByTestId('studio-attach-photo')).toBeNull();
    await fireEvent.press(await screen.findByTestId('studio-attach-audio'));
    await screen.findByTestId('studio-attached');
    expect(chipIds()).toEqual(['dubbing', 'captions', 'clean-audio']);
    await fireEvent.press(screen.getByTestId('studio-chip-captions'));
    await fireEvent.press(screen.getByTestId('studio-make'));
    expect(await screen.findByTestId('tool-cost')).toHaveTextContent('30 points', { exact: false });
    expect(screen.getByRole('header', { name: 'Captions' })).toBeTruthy();
  });

  it('a user takes the file out and the chips go back to the prompt tools; a file no tool takes is refused with a note', async () => {
    await toHome();
    mockPick.mockResolvedValueOnce(file('talk.mp3', 'audio/mpeg'));
    await fireEvent.press(screen.getByTestId('studio-attach'));
    await fireEvent.press(await screen.findByTestId('studio-attach-audio'));
    await screen.findByTestId('studio-attached');
    await fireEvent.press(screen.getByTestId('studio-attached-remove'));
    expect(screen.queryByTestId('studio-attached')).toBeNull();
    expect(chipIds()).toEqual(['voiceover', 'music', 'sound-effect']);
    mockPick.mockResolvedValueOnce(file('notes.pdf', 'application/pdf'));
    await fireEvent.press(screen.getByTestId('studio-attach'));
    await fireEvent.press(await screen.findByTestId('studio-attach-audio'));
    expect(await screen.findByTestId('studio-note')).toBeTruthy();
    expect(screen.queryByTestId('studio-attached')).toBeNull();
  });
});

describe('STUDIO-HOME · the tools grid and More', () => {
  it('a user opens More, sees every other tool the Hub lists with its description, and opens one', async () => {
    await toHome();
    expect(screen.getAllByTestId(/^studio-tool-/).map((n) => String(n.props.testID))).toEqual(['studio-tool-voiceover', 'studio-tool-music', 'studio-tool-dubbing']);
    await fireEvent.press(screen.getByTestId('studio-more'));
    const menu = await screen.findByTestId('studio-more-menu');
    expect(menu).toBeTruthy();
    expect(screen.getByTestId('studio-tool-quick-voice')).toHaveAccessibleName('Quick voice, 125 a minute');
    expect(screen.getByText('Take the noise out of a recording.')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('studio-tool-clean-audio'));
    await screen.findByTestId('tool-file');
    expect(screen.getByRole('header', { name: 'Clean audio' })).toBeTruthy();
  });

  it('with only the seven launch tools the home draws no picture, video or voice tool, and Speech, Music and Sound effect have a working box', async () => {
    await toHome();
    expect(chipIds()).toEqual(['voiceover', 'music', 'sound-effect']);
    for (const id of ['image', 'video', 'talking-photo', 'voice-changer']) expect(screen.queryByTestId(`studio-tool-${id}`)).toBeNull();
    expect(screen.queryByText(/Edit a photo|Talking photo|Voice changer|Make an image|Make a video/)).toBeNull();
    await fireEvent.press(screen.getByTestId('studio-chip-sound-effect'));
    await fireEvent.changeText(screen.getByTestId('studio-prompt'), 'Rain on a tin roof');
    await fireEvent.press(screen.getByTestId('studio-make'));
    await waitFor(() => expect(screen.getByTestId('tool-text').props.value).toBe('Rain on a tin roof'));
    expect(screen.getByRole('header', { name: 'Sound effect' })).toBeTruthy();
  });

  it('a tool the Hub does not list has no tile, no chip and no More row, and with nothing for More there is no More', async () => {
    hub.listed = ['voiceover', 'music', 'dubbing'];
    await toHome();
    expect(screen.queryByTestId('studio-more')).toBeNull();
    expect(chipIds()).toEqual(['voiceover', 'music']);
    expect(screen.queryByTestId('studio-chip-sound-effect')).toBeNull();
  });
});

describe('STUDIO-HOME · Recent', () => {
  it('a user sees their last results newest first as cards and opens one, and its done view opens', async () => {
    hub.listed = [...LAUNCH, 'image'];
    hub.jobs = [
      done('job-b', 'image', [{ kind: 'image', url: 'https://cdn.test/b.png', contentType: 'image/png', pieceFormat: 'image' }]),
      done('job-a', 'voiceover', [{ kind: 'audio', url: 'https://cdn.test/a.mp3' }], 'https://cdn.test/a.mp3'),
      { ...done('job-c', 'music', []), state: 'failed' },
      done('job-z', 'podcast', [{ kind: 'audio', url: 'https://cdn.test/z.mp3' }], 'https://cdn.test/z.mp3'),
    ];
    await toHome();
    const list = await screen.findByTestId('studio-recent-list');
    expect(list).toBeTruthy();
    expect(screen.getAllByTestId(/^studio-recent-job-/).map((n) => String(n.props.testID))).toEqual(['studio-recent-job-b', 'studio-recent-job-a']);
    expect(screen.getByTestId('studio-recent-picture')).toBeTruthy();
    expect(screen.getByTestId('studio-recent-wave')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('studio-recent-job-a'));
    await waitFor(() => expect(screen.getByRole('header', { name: 'VoiceOver' })).toBeTruthy());
    await screen.findByTestId('result-player', undefined, { timeout: 4000 }).catch(() => undefined);
    expect(hub.starts).toBe(0);
  });

  it('a user with no results sees one line and no art; a list the Hub cannot give is one line too', async () => {
    await toHome();
    expect(await screen.findByTestId('studio-recent-empty')).toHaveTextContent('Nothing made yet', { exact: false });
    expect(screen.queryByTestId('studio-recent-list')).toBeNull();
  });

  it('a list that cannot be read says so in one line and the rest of the home still works', async () => {
    hub.jobsFail = true;
    await toHome();
    expect(await screen.findByTestId('studio-recent-failed')).toBeTruthy();
    expect(screen.getByTestId('studio-prompt')).toBeTruthy();
  });
});

describe('STUDIO-HOME · on the phone (Platform.OS android, the real handlers)', () => {
  const original = Platform.OS;
  beforeEach(() => {
    Platform.OS = 'android';
  });
  afterEach(() => {
    Platform.OS = original;
  });

  it('the keyboard over the prompt box: focusing the box scrolls it into view above the keyboard, a chip taps through the open keyboard, and Make stays reachable', async () => {
    await toHome();
    const scrollTo = jest.spyOn(ScrollView.prototype as unknown as { scrollTo: () => void }, 'scrollTo').mockImplementation(() => undefined);
    // The part holding the title and the box starts 420 down the page.
    await fireEvent(screen.getByTestId('studio-home'), 'layout', { nativeEvent: { layout: { x: 0, y: 420, width: 350, height: 900 } } });
    const box = screen.getByTestId('studio-prompt');
    await fireEvent(box, 'focus');
    expect(scrollTo).toHaveBeenCalledWith({ y: 412, animated: true });
    // A tap on a chip or on Make while the keyboard is up reaches its button the first time (the page keeps taps).
    expect(screen.getByTestId('points-scroll').props.keyboardShouldPersistTaps).toBe('handled');
    expect(screen.getByTestId('studio-chips').props.keyboardShouldPersistTaps).toBe('handled');
    await fireEvent.changeText(box, 'Rain');
    await fireEvent.press(screen.getByTestId('studio-chip-sound-effect'));
    expect(screen.getByTestId('studio-make')).toBeEnabled();
    scrollTo.mockRestore();
  });

  it('the Android back button closes the More menu and leaves the home where it was', async () => {
    await toHome();
    await fireEvent.press(screen.getByTestId('studio-more'));
    await screen.findByTestId('studio-more-menu');
    // The back button is the menu's Modal's own request to close.
    await fireEvent(screen.getByTestId('studio-more-menu'), 'requestClose');
    await waitFor(() => expect(screen.queryByTestId('studio-more-menu')).toBeNull());
    expect(screen.getByTestId('studio-more')).toBeTruthy();
    expect(screen.getByTestId('studio-prompt')).toBeTruthy();
  });

  it('the attach picker opens the phone picker for the kind chosen, with the types the Hub lists, and a picker closed without a file changes nothing', async () => {
    await toHome();
    mockPick.mockResolvedValueOnce(null);
    await fireEvent.press(screen.getByTestId('studio-attach'));
    await fireEvent.press(await screen.findByTestId('studio-attach-video'));
    await waitFor(() => expect(mockPick).toHaveBeenCalledTimes(1));
    expect(mockPick).toHaveBeenCalledWith(['video/mp4', 'video/quicktime', 'video/webm']);
    expect(screen.queryByTestId('studio-attached')).toBeNull();
    expect(chipIds()).toEqual(['voiceover', 'music', 'sound-effect']);
  });
});

/*
 * Round 1 of the patch (the verifier's findings 1 to 3): the words box is there only for a file tool that takes words, and the More pop-over
 * never leaves the screen, with every tool the Hub lists or the four after-launch pictures and clips switched off.
 */
const ALL = Object.keys(SPECS);
const OFF4 = ALL.filter((id) => !['image', 'photo-edit', 'video', 'talking-photo'].includes(id));
const MORE_ROWS = (listed: string[]) => listed.filter((id) => !['voiceover', 'music', 'image', 'video', 'dubbing', 'talking-photo', 'voice-changer'].includes(id));

describe('STUDIO-HOME · the words box with a file in it', () => {
  const handoff = () => require('../studioHandoff') as typeof import('../studioHandoff');
  const attach = async (kind: 'photo' | 'video' | 'audio', picked: ReturnType<typeof file>) => {
    mockPick.mockResolvedValueOnce(picked);
    await fireEvent.press(screen.getByTestId('studio-attach'));
    await fireEvent.press(await screen.findByTestId(`studio-attach-${kind}`));
    await screen.findByTestId('studio-attached');
  };

  it('a user with a recording in the box is offered no words box for Dubbing, Captions or Clean audio, and Make still opens Captions without the words typed earlier', async () => {
    const put = jest.spyOn(handoff(), 'putHandoff');
    await toHome();
    await fireEvent.changeText(screen.getByTestId('studio-prompt'), 'in Spanish please');
    await attach('audio', file('talk.mp3', 'audio/mpeg'));
    expect(chipIds()).toEqual(['dubbing', 'captions', 'clean-audio']);
    for (const id of ['dubbing', 'captions', 'clean-audio']) {
      await fireEvent.press(screen.getByTestId(`studio-chip-${id}`));
      expect(screen.queryByTestId('studio-prompt')).toBeNull();
      expect(screen.getByTestId('studio-make')).toBeEnabled();
    }
    await fireEvent.press(screen.getByTestId('studio-chip-captions'));
    await fireEvent.press(screen.getByTestId('studio-make'));
    expect(await screen.findByTestId('tool-cost')).toHaveTextContent('30 points', { exact: false });
    expect(screen.queryByTestId('tool-text')).toBeNull();
    expect(put).toHaveBeenCalledWith(expect.objectContaining({ toolId: 'captions', text: '' }));
    put.mockRestore();
  });

  it('a user with a photo in the box gets the box for Edit a photo ("Say what to change"), none for Talking photo, and the words come back with Edit a photo and arrive on its screen', async () => {
    hub.listed = [...LAUNCH, 'image', 'photo-edit', 'talking-photo'];
    await toHome();
    await attach('photo', file('me.jpg', 'image/jpeg'));
    expect(chipIds()).toEqual(['photo-edit', 'talking-photo']);
    expect(screen.getByTestId('studio-prompt').props.placeholder).toBe('Say what to change (optional)');
    await fireEvent.changeText(screen.getByTestId('studio-prompt'), 'Make the sky orange');
    await fireEvent.press(screen.getByTestId('studio-chip-talking-photo'));
    expect(screen.queryByTestId('studio-prompt')).toBeNull();
    expect(screen.getByTestId('studio-make')).toBeEnabled();
    await fireEvent.press(screen.getByTestId('studio-chip-photo-edit'));
    expect(screen.getByTestId('studio-prompt').props.value).toBe('Make the sky orange');
    await fireEvent.press(screen.getByTestId('studio-make'));
    await screen.findByTestId('tool-photo');
    await waitFor(() => expect(screen.getByTestId('tool-text').props.value).toBe('Make the sky orange'));
    expect(screen.getByRole('header', { name: 'Edit a photo' })).toBeTruthy();
  });

  it('Talking photo is opened with the photo and no words, even when words were typed beside the photo for Edit a photo', async () => {
    hub.listed = [...LAUNCH, 'photo-edit', 'talking-photo'];
    const put = jest.spyOn(handoff(), 'putHandoff');
    await toHome();
    await attach('photo', file('me.jpg', 'image/jpeg'));
    await fireEvent.changeText(screen.getByTestId('studio-prompt'), 'Make the sky orange');
    await fireEvent.press(screen.getByTestId('studio-chip-talking-photo'));
    await fireEvent.press(screen.getByTestId('studio-make'));
    expect(put).toHaveBeenCalledWith(expect.objectContaining({ toolId: 'talking-photo', text: '' }));
    put.mockRestore();
  });

  it('a user with a clip in the box gets the box for Music for a video ("Describe the mood"), none for Captions, and the mood arrives on its screen', async () => {
    hub.listed = [...LAUNCH, 'video-music'];
    await toHome();
    await attach('video', file('clip.mp4', 'video/mp4'));
    expect(chipIds()).toEqual(['video-music', 'dubbing', 'captions', 'clean-audio']);
    expect(screen.getByTestId('studio-prompt').props.placeholder).toBe('Describe the mood (optional)');
    await fireEvent.changeText(screen.getByTestId('studio-prompt'), 'Warm and hopeful');
    await fireEvent.press(screen.getByTestId('studio-chip-captions'));
    expect(screen.queryByTestId('studio-prompt')).toBeNull();
    await fireEvent.press(screen.getByTestId('studio-chip-video-music'));
    await fireEvent.press(screen.getByTestId('studio-make'));
    await waitFor(() => expect(screen.getByTestId('tool-mood').props.value).toBe('Warm and hopeful'));
    expect(screen.getByRole('header', { name: 'Music for a video' })).toBeTruthy();
  });

  it('a Music for a video the Hub lists with no mood line gets no words box (nothing would take the words)', async () => {
    const was = SPECS['video-music'];
    SPECS['video-music'] = { ...was, input: { kind: 'file', maxCharacters: 0, charactersPerUnit: 0, file: { ...FILE_RULE, only: 'video' } } };
    try {
      hub.listed = [...LAUNCH, 'video-music'];
      await toHome();
      await attach('video', file('clip.mp4', 'video/mp4'));
      expect(chipIds()[0]).toBe('video-music');
      expect(screen.queryByTestId('studio-prompt')).toBeNull();
      expect(screen.getByTestId('studio-make')).toBeEnabled();
    } finally {
      SPECS['video-music'] = was;
    }
  });

  it('taking the file out brings the box back, with the words typed before, for the prompt tools', async () => {
    await toHome();
    await fireEvent.changeText(screen.getByTestId('studio-prompt'), 'Welcome to the show');
    await attach('audio', file('talk.mp3', 'audio/mpeg'));
    expect(screen.queryByTestId('studio-prompt')).toBeNull();
    await fireEvent.press(screen.getByTestId('studio-attached-remove'));
    expect(screen.getByTestId('studio-prompt').props.value).toBe('Welcome to the show');
    expect(screen.getByTestId('studio-prompt').props.placeholder).toBe('Type what to say');
  });
});

describe('STUDIO-HOME · the More pop-over stays inside the screen', () => {
  const methods = (require('@react-native/jest-preset/jest/MockNativeMethods') as { default: { measureInWindow: jest.Mock } }).default;
  const SIDE = 16;
  const ROW = 52;
  const original = Dimensions.get('window');
  const setWindow = (width: number, height: number) =>
    act(async () => {
      Dimensions.set({ window: { width, height, scale: 2, fontScale: 1 }, screen: { width, height, scale: 2, fontScale: 1 } });
    });
  // The More tile as the phone reports it: the fourth cell of a line at 390 wide, `y` down the window (the page scrolled or not).
  const moreAt = (y: number) =>
    methods.measureInWindow.mockImplementation(function (this: { props?: { testID?: string } }, callback: (x: number, y: number, width: number, height: number) => void) {
      if (this?.props?.testID === 'studio-more') callback(292, y, 82, 107);
    });
  const close = async () => {
    await fireEvent(screen.getByTestId('studio-more-menu'), 'requestClose');
    await waitFor(() => expect(screen.queryByTestId('studio-more-menu')).toBeNull());
  };
  /** Opens More with the tile at `y`, and checks the panel is inside the screen with every row in the scrolling list. */
  const checkFits = async (listed: string[], height: number, y: number) => {
    await setWindow(390, height);
    moreAt(y);
    await fireEvent.press(screen.getByTestId('studio-more'));
    const menu = await screen.findByTestId('studio-more-menu');
    const style = StyleSheet.flatten(menu.props.style) as { maxHeight: number; top?: number; bottom?: number };
    const bottom = style.bottom !== undefined ? height - style.bottom : (style.top as number) + style.maxHeight;
    const top = style.top !== undefined ? style.top : bottom - style.maxHeight;
    expect(top).toBeGreaterThanOrEqual(SIDE);
    expect(bottom).toBeLessThanOrEqual(height - SIDE);
    const rows = screen.getByTestId('studio-more-menu-rows');
    expect(rows.props.scrollEnabled).not.toBe(false);
    for (const id of MORE_ROWS(listed)) expect(within(rows).getByTestId(`studio-tool-${id}`)).toBeTruthy();
    // The list is taller than the room it has been given, so the cap is what keeps it on the screen (it scrolls inside).
    expect(style.maxHeight).toBeLessThan(MORE_ROWS(listed).length * ROW + 16);
    return { menu, style };
  };

  afterAll(async () => {
    await setWindow(original.width, original.height);
    methods.measureInWindow.mockReset();
  });

  it.each([
    ['390x844, page unscrolled', 844, 560],
    ['390x844, page scrolled a thumb', 844, 440],
    ['390x667, page unscrolled', 667, 500],
    ['390x667, page scrolled a thumb', 667, 380],
  ])('a user opens More with every tool the Hub lists on %s: the panel fits the window and all 12 rows are in its scroll list', async (_name, height, y) => {
    hub.listed = ALL.slice();
    await toHome();
    expect(MORE_ROWS(hub.listed)).toHaveLength(12);
    await checkFits(hub.listed, height, y);
    await close();
  });

  it.each([
    ['390x844, page unscrolled', 844, 560],
    ['390x844, page scrolled a thumb', 844, 440],
    ['390x667, page unscrolled', 667, 500],
    ['390x667, page scrolled a thumb', 667, 380],
  ])('a user opens More with the picture, clip and photo tools off (11 rows) on %s: the panel fits the window and all 11 rows are in its scroll list', async (_name, height, y) => {
    hub.listed = OFF4;
    await toHome();
    expect(MORE_ROWS(hub.listed)).toHaveLength(11);
    await checkFits(hub.listed, height, y);
    await close();
  });

  it('a list too tall for the room above the tile drops below it once the rows are laid out, and still fits', async () => {
    hub.listed = ALL.slice();
    await toHome();
    const { menu } = await checkFits(hub.listed, 844, 140);
    await fireEvent(screen.getByTestId('studio-more-menu-rows'), 'contentSizeChange', 288, 12 * ROW);
    const style = StyleSheet.flatten(screen.getByTestId('studio-more-menu').props.style) as { maxHeight: number; top?: number; bottom?: number };
    expect(menu).toBeTruthy();
    expect(style.bottom).toBeUndefined();
    expect(style.top).toBe(140 + 107 + 8);
    expect(style.top! + style.maxHeight).toBeLessThanOrEqual(844 - SIDE);
    await close();
  });

  it('on the phone (Platform.OS android) the panel fits at 390x667 too, and the back button still closes it', async () => {
    const was = Platform.OS;
    Platform.OS = 'android';
    try {
      hub.listed = ALL.slice();
      await toHome();
      await checkFits(hub.listed, 667, 500);
      await close();
      expect(screen.getByTestId('studio-prompt')).toBeTruthy();
    } finally {
      Platform.OS = was;
    }
  });

  it('a short menu keeps its own height and its rows read in two lines: Quick voice and the other launch rows are whole', async () => {
    await toHome();
    await setWindow(390, 844);
    moreAt(560);
    await fireEvent.press(screen.getByTestId('studio-more'));
    await screen.findByTestId('studio-more-menu');
    for (const id of MORE_ROWS(LAUNCH)) expect(within(screen.getByTestId('studio-more-menu-rows')).getByTestId(`studio-tool-${id}`)).toBeTruthy();
    // The Hub's one-line description may take two lines on a row, never cut after the first.
    for (const line of screen.getAllByText(/^(A fast voice|Describe a sound|Turn what is said|Take the noise)/)) expect(line.props.numberOfLines).toBe(2);
    await close();
  });
});
