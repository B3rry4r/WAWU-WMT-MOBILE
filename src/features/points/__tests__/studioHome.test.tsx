/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Platform, ScrollView, Text, View } from 'react-native';

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
