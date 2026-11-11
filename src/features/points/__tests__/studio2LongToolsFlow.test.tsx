/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, screen, waitFor } from 'expo-router/testing-library';
import { Platform } from 'react-native';

import { appListeners, hub, openTool, resetHub, setUpRoutes, sleep, watchAppState } from '../__helpers__/studio2Harness';

/*
 * POINTS-17 (Music for a video, Split a song), POINTS-18 (Audiobook, Podcast maker) and POINTS-12 (Receptionist) on the real Expo Router stack, on
 * Platform.OS android: each tool's input, the job, the result and the done view, over the harness's stand-in Hub and the phone's edge.
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

/** What the phone's pickers hand back next. */
type Asset = { uri: string; name: string; mimeType: string; size: number };
const mockPick: { file: Asset | null; video: { uri: string; mimeType: string; fileName: string; fileSize: number; duration: number } | null } = { file: null, video: null };
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(async () => (mockPick.file ? { canceled: false, assets: [mockPick.file] } : { canceled: true, assets: null })),
}));
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchCameraAsync: jest.fn(async () => ({ canceled: true, assets: null })),
  launchImageLibraryAsync: jest.fn(async () => (mockPick.video ? { canceled: false, assets: [mockPick.video] } : { canceled: true, assets: null })),
}));
jest.mock('@/features/profile-edit/readPicked', () => ({
  readPicked: jest.fn(async (asset: { uri: string; mimeType?: string; fileSize?: number }) => ({
    blob: new Blob([new Uint8Array(asset.fileSize ?? 1000)], { type: asset.mimeType }),
    contentType: asset.mimeType ?? 'video/mp4',
    extension: 'mp4',
    previewUri: asset.uri,
    discard: jest.fn(),
  })),
  rewriteFor: jest.fn(),
}));

// The microphone: a recorder the test drives (the take's length) and a permission it can refuse.
type Snapshot = { isRecording: boolean; durationMillis: number; canRecord: boolean; mediaServicesDidReset: boolean; url: string | null };
let mockSnapshot: Snapshot = { isRecording: false, durationMillis: 0, canRecord: false, mediaServicesDidReset: false, url: null };
const mockListeners = new Set<(next: Snapshot) => void>();
const mockRecorder = {
  currentTime: 0,
  uri: null as string | null,
  prepareToRecordAsync: jest.fn(async () => undefined),
  record: jest.fn(() => {
    mockSnapshot = { ...mockSnapshot, isRecording: true };
  }),
  stop: jest.fn(async () => {
    mockRecorder.uri = 'file:///recordings/take.m4a';
    mockSnapshot = { ...mockSnapshot, isRecording: false };
  }),
};
const mockPermission = jest.fn(async () => ({ granted: true, canAskAgain: true, status: 'granted', expires: 'never' }));
jest.mock('expo-audio', () => {
  const React = require('react');
  const makePlayer = () => ({ play: jest.fn(), pause: jest.fn(), seekTo: jest.fn(() => Promise.resolve()), addListener: jest.fn(() => ({ remove: jest.fn() })) });
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
    useAudioPlayer: jest.fn(() => React.useMemo(makePlayer, [])),
  };
});

beforeAll(async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  await setUpRoutes(mockVault);
}, 60_000);

beforeEach(() => {
  jest.clearAllMocks();
  resetHub(mockVault);
  mockPick.file = null;
  mockPick.video = null;
  mockSnapshot = { isRecording: false, durationMillis: 0, canRecord: false, mediaServicesDidReset: false, url: null };
  mockRecorder.uri = null;
  mockPermission.mockImplementation(async () => ({ granted: true, canAskAgain: true, status: 'granted', expires: 'never' }));
  appListeners.clear();
  watchAppState();
});

afterEach(async () => {
  await act(async () => {
    jest.advanceTimersByTime(10);
  });
});


const file = (name: string, mimeType: string, size = 4000): Asset => ({ uri: `file:///cache/${name}`, name, mimeType, size });
const video = (seconds: number, size = 8_000_000) => ({ uri: 'file:///cache/clip.mp4', mimeType: 'video/mp4', fileName: 'clip.mp4', fileSize: size, duration: seconds * 1000 });
async function pickFileFor(asset: Asset) {
  mockPick.file = asset;
  await fireEvent.press(screen.getByTestId('tool-file'));
  await screen.findByTestId('tool-cost');
}
async function pickVideo(seconds = 20) {
  mockPick.video = video(seconds);
  await fireEvent.press(screen.getByTestId('tool-file'));
}
async function runAndFinish() {
  await fireEvent.press(screen.getByTestId('tool-run'));
  await screen.findByTestId('tool-working');
  await sleep(2100);
}

describe('POINTS-17 · Music for a video', () => {
  it('a person picks a 20 second video, adds a mood, sees one cost, runs it and plays the music; the line says it is separate from the video', async () => {
    await openTool('video-music', 'tool-file');
    expect(screen.getByTestId('tool-length')).toHaveTextContent('MP4 or MOV. Up to 500 MB and 2 minutes.');
    await pickVideo(20);
    await screen.findByTestId('tool-cost');
    expect(hub.presigns[0]).toMatchObject({ folder: 'ai/input-video', contentType: 'video/mp4' });
    expect(screen.getByTestId('tool-length')).toHaveTextContent('20 seconds');
    expect(screen.getByTestId('tool-cost')).toHaveTextContent('This uses 500 points');
    await fireEvent.changeText(screen.getByTestId('tool-mood'), 'Warm and hopeful');
    await runAndFinish();
    await screen.findByTestId('tool-player');
    expect(screen.getByTestId('tool-music-separate')).toHaveTextContent('This music is separate from your video. It is not put on the video.');
    expect(hub.posts[0]).toMatchObject({ tool: 'video-music', body: { fileKey: 'ai/input-video/k1', description: 'Warm and hopeful', quoteToken: 'tok-video_music_per_track-500' } });
    await fireEvent.press(screen.getByTestId('result-piece'));
    await waitFor(() => expect(screen.getByTestId('draft-format')).toHaveTextContent('audio'));
  });

  it('a video over the Hub’s length is refused before it goes up, with the reason', async () => {
    await openTool('video-music', 'tool-file');
    await pickVideo(300);
    expect(await screen.findByTestId('tool-file-refused')).toHaveTextContent(/longer than 2 minutes/);
    expect(hub.presigns).toHaveLength(0);
    expect(screen.getByTestId('tool-run')).toBeDisabled();
  });

  it('a big upload shows its progress and can be stopped: nothing is held, and choosing the same video again sends it once', async () => {
    hub.holdUploads = true;
    await openTool('video-music', 'tool-file');
    await pickVideo(30);
    await waitFor(() => expect(screen.getByTestId('tool-file-status')).toHaveTextContent(/Uploading 25%/));
    await fireEvent.press(screen.getByTestId('tool-file-cancel'));
    await waitFor(() => expect(screen.queryByTestId('tool-file-cancel')).toBeNull());
    expect(screen.getByTestId('tool-file-name')).toHaveTextContent('Choose a video');
    expect(hub.posts).toHaveLength(0);
    expect(hub.fileQuotes).toHaveLength(0);
    hub.holdUploads = false;
    await pickVideo(30);
    await screen.findByTestId('tool-cost');
    await runAndFinish();
    expect(hub.posts).toHaveLength(1);
  });
});

describe('POINTS-17 · Split a song', () => {
  const partButtons = () => [0, 1, 2, 3, 4, 5].map((i) => screen.queryByTestId(`stems-play-${i}`));

  it('a person splits a song into two parts and into six, plays one part at a time, and makes the one they want a piece', async () => {
    await openTool('stems', 'tool-file');
    expect(screen.getByTestId('tool-part-chip-2')).toBeTruthy();
    await pickFileFor(file('song.mp3', 'audio/mpeg'));
    expect(screen.getByTestId('tool-cost')).toHaveTextContent('This uses 300 points');
    await fireEvent.press(screen.getByTestId('tool-part-chip-6'));
    await runAndFinish();
    await screen.findByTestId('stems-parts');
    expect(hub.posts[0]).toMatchObject({ tool: 'stems', body: { fileKey: 'ai/input-audio/k1', parts: 6 } });
    expect(partButtons().filter(Boolean)).toHaveLength(6);
    await fireEvent.press(screen.getByTestId('stems-play-0'));
    expect(screen.getByTestId('stems-play-0').props.accessibilityLabel).toBe('Pause Voice');
    await fireEvent.press(screen.getByTestId('stems-play-2'));
    expect(screen.getByTestId('stems-play-0').props.accessibilityLabel).toBe('Play Voice');
    expect(screen.getByTestId('stems-play-2').props.accessibilityLabel).toBe('Pause Bass');
    await fireEvent.press(screen.getByTestId('stems-piece-1'));
    await waitFor(() => expect(screen.getByTestId('draft-format')).toHaveTextContent('audio'));
    expect(hub.pieces[0].body).toEqual({ outputIndex: 1 });
    // The card draws no single "Make it a piece" of its own: each part has its own.
    expect(screen.queryByTestId('result-piece')).toBeNull();
  });

  it('a person who is not a creator hears the parts and keeps Save, with no "Make it a piece"', async () => {
    hub.creator = false;
    await openTool('stems', 'tool-file');
    await pickFileFor(file('song.mp3', 'audio/mpeg'));
    await runAndFinish();
    await screen.findByTestId('stems-parts');
    expect(screen.queryByTestId('stems-piece-0')).toBeNull();
    expect(screen.getByTestId('result-save')).toBeTruthy();
  });
});

describe('POINTS-18 · Audiobook', () => {
  const bookText = (n_: number) => 'Once upon a time. '.repeat(Math.ceil(n_ / 18)).slice(0, n_);

  it('a person pastes 40,000 characters, sees the length and the Hub’s cost, runs it, leaves, and the tool reopens on the running book; the finished audio is one piece', async () => {
    hub.points = 20_000;
    const rendered = await openTool('audiobook', 'tool-text');
    await fireEvent.changeText(screen.getByTestId('tool-text'), bookText(40_000));
    await waitFor(() => expect(screen.getByTestId('tool-length')).toHaveTextContent('About 45 minutes'));
    expect(screen.getByTestId('tool-count')).toHaveTextContent('40,000 / 50,000');
    await waitFor(() => expect(screen.getByTestId('tool-cost')).toHaveTextContent('This uses 11,250 points'));
    await fireEvent.press(screen.getByTestId('tool-run'));
    await screen.findByTestId('tool-working');
    expect(screen.getByText(/You can leave this screen. We will tell you when it is ready./)).toBeTruthy();
    expect(hub.posts[0]).toMatchObject({ tool: 'audiobook', body: { voiceId: 'ada', quoteToken: 'tok-audiobook_per_min-11250' } });
    expect((hub.posts[0].body.text as string).length).toBe(40_000);
    await fireEvent.press(screen.getByTestId('points-back'));
    await rendered.unmount();
    // The phone remembers the running book: reopening reads that job and does not send a second.
    await openTool('audiobook', 'tool-screen');
    await screen.findByTestId('tool-player');
    expect(hub.posts).toHaveLength(1);
    await fireEvent.press(screen.getByTestId('result-piece'));
    await waitFor(() => expect(screen.getByTestId('draft-format')).toHaveTextContent('audio'));
    expect(hub.pieces[0].body).toEqual({ outputIndex: 0 });
  });

  it('a person picks a .txt file and it fills the box; a file of another type or over the Hub’s characters is refused with the reason', async () => {
    await openTool('audiobook', 'tool-text');
    (globalThis as unknown as { __bookText: string }).__bookText = 'Chapter one. It was a bright day.';
    mockPick.file = file('book.txt', 'text/plain', 40);
    await fireEvent.press(screen.getByTestId('tool-text-file'));
    await waitFor(() => expect(screen.getByTestId('tool-text').props.value).toBe('Chapter one. It was a bright day.'));
    expect(screen.getByTestId('tool-text-file-name')).toHaveTextContent('book.txt, 33 characters');
    mockPick.file = file('report.pdf', 'application/pdf', 900);
    await fireEvent.press(screen.getByTestId('tool-text-file'));
    expect(await screen.findByTestId('tool-file-refused')).toHaveTextContent(/Choose a plain text file/);
    (globalThis as unknown as { __bookText: string }).__bookText = bookText(60_000);
    mockPick.file = file('book.txt', 'text/plain', 60_000);
    await fireEvent.press(screen.getByTestId('tool-text-file'));
    await waitFor(() => expect(screen.getByTestId('tool-file-refused')).toHaveTextContent(/60,000 characters. The most is 50,000/));
  });

  it('past the daily limit the limit view names when it resets and nothing runs', async () => {
    hub.cap = { cap: 'daily', limit: 5000, message: 'Daily limit reached.', resetsAt: '2026-10-31T00:00:00.000Z', usedPoints: 5000, remainingPoints: 0 };
    await openTool('audiobook', 'tool-text');
    await fireEvent.changeText(screen.getByTestId('tool-text'), 'A short book.');
    await screen.findByTestId('tool-cost');
    await fireEvent.press(screen.getByTestId('tool-run'));
    expect(await screen.findByTestId('cap-reached')).toHaveTextContent(/resets at midnight/);
    expect(hub.posts).toHaveLength(0);
  });

  it('a double tap on Run sends one request', async () => {
    await openTool('audiobook', 'tool-text');
    await fireEvent.changeText(screen.getByTestId('tool-text'), 'A short book.');
    await screen.findByTestId('tool-cost');
    const run = screen.getByTestId('tool-run');
    await fireEvent.press(run);
    await fireEvent.press(run);
    await screen.findByTestId('tool-working');
    expect(hub.posts).toHaveLength(1);
    await fireEvent.press(screen.getByTestId('points-back'));
  });
});

describe('POINTS-18 · Podcast maker', () => {
  it('a person makes a podcast from a text with two hosts and from an https link with one, choosing the length', async () => {
    await openTool('podcast', 'podcast-inputs');
    await fireEvent.changeText(screen.getByTestId('tool-text'), 'How to price handmade soap for a market stall.');
    await fireEvent.press(screen.getByTestId('podcast-voice-2-tunde'));
    await waitFor(() => expect(screen.getByTestId('tool-cost')).toHaveTextContent('This uses 1,250 points'));
    await fireEvent.press(screen.getByTestId('podcast-length-short'));
    await waitFor(() => expect(screen.getByTestId('tool-cost')).toHaveTextContent('This uses 750 points'));
    await fireEvent.press(screen.getByTestId('tool-run'));
    await screen.findByTestId('tool-working');
    await sleep(2100);
    await screen.findByTestId('tool-player');
    expect(hub.posts[0]).toMatchObject({ tool: 'podcast', body: { source: { text: 'How to price handmade soap for a market stall.' }, mode: 'conversation', voiceIds: ['ada', 'tunde'], duration: 'short', language: 'en', quoteToken: 'tok-podcast_short-750' } });
    hub.posts.length = 0;
    // A link, one host.
    await fireEvent.press(screen.getByTestId('points-back'));
    await openTool('podcast', 'podcast-inputs');
    await fireEvent.press(screen.getByTestId('podcast-source-link'));
    await fireEvent.changeText(screen.getByTestId('podcast-link'), 'https://example.com/soap');
    await fireEvent.press(screen.getByTestId('podcast-hosts-1'));
    await waitFor(() => expect(screen.getByTestId('tool-run')).toBeEnabled());
    await fireEvent.press(screen.getByTestId('tool-run'));
    await screen.findByTestId('tool-working');
    expect(hub.posts[0].body).toMatchObject({ source: { url: 'https://example.com/soap' }, mode: 'bulletin', voiceIds: ['ada'], duration: 'standard' });
  });

  it('a link that is not https is refused before Run, and two hosts need two different voices', async () => {
    await openTool('podcast', 'podcast-inputs');
    await fireEvent.press(screen.getByTestId('podcast-source-link'));
    await fireEvent.changeText(screen.getByTestId('podcast-link'), 'http://example.com/soap');
    expect(screen.getByTestId('podcast-link-problem')).toHaveTextContent('Use a link that starts with https://.');
    expect(screen.getByTestId('tool-run')).toBeDisabled();
    await fireEvent.changeText(screen.getByTestId('podcast-link'), 'https://example.com/soap');
    expect(screen.queryByTestId('podcast-link-problem')).toBeNull();
    await fireEvent.press(screen.getByTestId('podcast-voice-2-ada'));
    expect(screen.getByTestId('podcast-voice-problem')).toHaveTextContent('Two hosts need two different voices.');
    expect(screen.getByTestId('tool-run')).toBeDisabled();
    expect(hub.posts).toHaveLength(0);
  });

  it('with too few points the sheet appears and nothing runs; past the daily limit the limit view names the reset time', async () => {
    hub.points = 100;
    await openTool('podcast', 'podcast-inputs');
    await fireEvent.changeText(screen.getByTestId('tool-text'), 'A text.');
    await screen.findByTestId('tool-cost');
    await fireEvent.press(screen.getByTestId('tool-run'));
    expect(await screen.findByTestId('shortfall-sheet')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('shortfall-close'));
    hub.points = 5000;
    hub.cap = { cap: 'daily', limit: 5000, message: 'Daily limit reached.', resetsAt: '2026-10-31T00:00:00.000Z', usedPoints: 5000, remainingPoints: 0 };
    await fireEvent.press(screen.getByTestId('tool-run'));
    expect(await screen.findByTestId('cap-reached')).toHaveTextContent(/resets at midnight/);
    expect(hub.posts).toHaveLength(0);
  });
});

describe('POINTS-12 · Receptionist', () => {
  async function setUp() {
    await openTool('receptionist', 'receptionist-setup');
    await fireEvent.changeText(screen.getByTestId('receptionist-name'), 'Ada Soaps');
    await fireEvent.changeText(screen.getByTestId('receptionist-offer'), 'Handmade soap, open nine to five.');
    await fireEvent.press(screen.getByTestId('receptionist-save'));
    await screen.findByTestId('receptionist-tabs');
  }

  it('a creator saves details, adds a text, a link and a document, sends a message and reads the reply; 20 points are used', async () => {
    await setUp();
    expect(hub.receptionist.details).toMatchObject({ businessName: 'Ada Soaps', offer: 'Handmade soap, open nine to five.' });
    await fireEvent.press(screen.getByTestId('receptionist-tabs-knows'));
    expect(await screen.findByTestId('receptionist-knows-empty')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('knowledge-add-text'));
    await fireEvent.changeText(screen.getByTestId('knowledge-name'), 'Prices');
    await fireEvent.changeText(screen.getByTestId('knowledge-text'), 'A bar of soap is 1,500 naira.');
    await fireEvent.press(screen.getByTestId('knowledge-save'));
    await screen.findByTestId('knowledge-k1');
    await fireEvent.press(screen.getByTestId('knowledge-add-link'));
    await fireEvent.changeText(screen.getByTestId('knowledge-name'), 'Shop page');
    await fireEvent.changeText(screen.getByTestId('knowledge-link'), 'http://example.com');
    expect(screen.getByTestId('knowledge-link-problem')).toHaveTextContent('Use a link that starts with https://.');
    expect(screen.getByTestId('knowledge-save')).toBeDisabled();
    await fireEvent.changeText(screen.getByTestId('knowledge-link'), 'https://example.com/shop');
    await fireEvent.press(screen.getByTestId('knowledge-save'));
    await screen.findByTestId('knowledge-k2');
    mockPick.file = file('policy.pdf', 'application/pdf', 90_000);
    await fireEvent.press(screen.getByTestId('knowledge-add-document'));
    await screen.findByTestId('knowledge-k3');
    expect(hub.presigns[0]).toMatchObject({ folder: 'ai/input-doc', contentType: 'application/pdf' });
    expect(hub.posts.filter((p) => p.tool === 'knowledge').map((p) => p.body.kind)).toEqual(['text', 'url', 'file']);
    // It can know three things, no more.
    expect(screen.getByTestId('receptionist-full')).toHaveTextContent('It can know up to 3 things. Take one away to add another.');
    expect(screen.queryByTestId('knowledge-add-text')).toBeNull();
    await fireEvent.press(screen.getByTestId('receptionist-tabs-chat'));
    await fireEvent.changeText(await screen.findByTestId('chat-message'), 'When do you open?');
    await waitFor(() => expect(screen.getByTestId('tool-cost')).toHaveTextContent('This uses 20 points'));
    await fireEvent.press(screen.getByTestId('chat-send'));
    await screen.findByTestId('chat-you');
    await sleep(2100);
    expect(await screen.findByTestId('chat-agent')).toHaveTextContent('We open at nine in the morning.');
    expect(hub.posts.find((p) => p.tool === 'receptionist')).toMatchObject({ body: { message: 'When do you open?', quoteToken: 'tok-receptionist_message-20' } });
    expect(hub.points).toBe(4980);
  });

  it('a message that fails says no points were taken and the balance is the Hub’s unchanged one; a double tap sends one request', async () => {
    await setUp();
    hub.fail = true;
    await fireEvent.press(screen.getByTestId('receptionist-tabs-chat'));
    await fireEvent.changeText(await screen.findByTestId('chat-message'), 'Hello?');
    await screen.findByTestId('tool-cost');
    const send = screen.getByTestId('chat-send');
    await fireEvent.press(send);
    await fireEvent.press(send);
    await sleep(2100);
    expect(await screen.findByTestId('chat-failed')).toHaveTextContent(/No points were taken/);
    expect(hub.posts.filter((p) => p.tool === 'receptionist')).toHaveLength(1);
    expect(hub.points).toBe(5000);
  });

  it('details over the limit cannot be saved and say why; a document of another type is refused with the reason and nothing is added', async () => {
    await openTool('receptionist', 'receptionist-setup');
    await fireEvent.changeText(screen.getByTestId('receptionist-name'), 'N'.repeat(81));
    await fireEvent.changeText(screen.getByTestId('receptionist-offer'), 'Soap');
    await fireEvent.press(screen.getByTestId('receptionist-save'));
    expect(screen.getByTestId('receptionist-problem')).toHaveTextContent('The business name can be 80 characters at most.');
    expect(hub.calls).not.toContain('PUT /ai-tools/receptionist');
    await fireEvent.changeText(screen.getByTestId('receptionist-name'), 'Ada');
    await fireEvent.press(screen.getByTestId('receptionist-save'));
    await screen.findByTestId('receptionist-tabs');
    await fireEvent.press(screen.getByTestId('receptionist-tabs-knows'));
    mockPick.file = file('photo.png', 'image/png', 900);
    await fireEvent.press(await screen.findByTestId('knowledge-add-document'));
    expect(await screen.findByTestId('knowledge-failed')).toHaveTextContent(/Choose a PDF or a plain text file/);
    expect(hub.presigns).toHaveLength(0);
    expect(hub.receptionist.knowledge).toHaveLength(0);
  });

  it('Remove takes away what it says, and Clear asks first and then clears everything', async () => {
    await setUp();
    await fireEvent.press(screen.getByTestId('receptionist-tabs-knows'));
    await fireEvent.press(await screen.findByTestId('knowledge-add-text'));
    await fireEvent.changeText(screen.getByTestId('knowledge-name'), 'Prices');
    await fireEvent.changeText(screen.getByTestId('knowledge-text'), 'Soap is cheap.');
    await fireEvent.press(screen.getByTestId('knowledge-save'));
    await fireEvent.press(await screen.findByTestId('knowledge-remove-k1'));
    await waitFor(() => expect(screen.queryByTestId('knowledge-k1')).toBeNull());
    expect(hub.calls).toContain('DELETE /ai-tools/receptionist/knowledge/k1');
    await fireEvent.press(screen.getByTestId('receptionist-tabs-setup'));
    await fireEvent.press(screen.getByTestId('receptionist-clear'));
    expect(await screen.findByTestId('receptionist-clear-sheet')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('receptionist-clear-keep'));
    expect(hub.receptionist.setUp).toBe(true);
    await fireEvent.press(screen.getByTestId('receptionist-clear'));
    await fireEvent.press(await screen.findByTestId('receptionist-clear-confirm'));
    await waitFor(() => expect(screen.queryByTestId('receptionist-tabs')).toBeNull());
    expect(hub.receptionist.setUp).toBe(false);
    expect(screen.getByTestId('receptionist-notice-ok')).toHaveTextContent('Your Receptionist is cleared.');
  });

  it('the Receptionist draws no voice entry and nothing about a phone, WhatsApp or a call', async () => {
    await setUp();
    for (const id of ['receptionist-setup', 'receptionist-knows', 'receptionist-chat']) {
      if (id !== 'receptionist-setup') await fireEvent.press(screen.getByTestId(`receptionist-tabs-${id.split('-')[1] === 'knows' ? 'knows' : 'chat'}`));
      expect(screen.queryAllByText(/whatsapp|phone number|call list|calls?\b|speak to|talk to/i)).toHaveLength(0);
    }
    expect(screen.queryByTestId('chat-voice')).toBeNull();
  });
});
