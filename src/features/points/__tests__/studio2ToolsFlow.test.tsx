/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, renderRouter, screen, waitFor, within } from 'expo-router/testing-library';
import { Platform } from 'react-native';

import { appListeners, CLONE_LINE, goToBackground, hub, n, openTool, resetHub, routes, setUpRoutes, SPECS, sleep, watchAppState } from '../__helpers__/studio2Harness';

/*
 * POINTS-16 (Voice changer, Dialogue, Clone your own voice), POINTS-17 (Music for a video, Split a song), POINTS-18 (Audiobook, Podcast maker) and
 * POINTS-12 (Receptionist) on the real Expo Router stack, on Platform.OS android: the tiles, each tool's input, the job, the result and the done
 * view. The pickers' packages, the microphone, the upload's request object and the phone's file modules are replaced at the edge (the harness
 * stands the Hub in); every handler of the app runs for real.
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
const mockEmit = async (next: Partial<Snapshot>) => {
  mockSnapshot = { ...mockSnapshot, ...next };
  await act(async () => {
    mockListeners.forEach((listener) => listener(mockSnapshot));
  });
};
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

const audioFile = (name = 'clip.mp3', mimeType = 'audio/mpeg', size = 4000): Asset => ({ uri: `file:///cache/${name}`, name, mimeType, size });
/** The person picks a file for a file tool and it goes up, is measured and quoted. */
async function pickFileFor(asset: Asset) {
  mockPick.file = asset;
  await fireEvent.press(screen.getByTestId('tool-file'));
  await screen.findByTestId('tool-cost');
}
/** Run, and let the job finish on the next read. */
async function runAndFinish() {
  await fireEvent.press(screen.getByTestId('tool-run'));
  await screen.findByTestId('tool-working');
  await sleep(2100);
}

describe('PT1 · the tiles for the voice, music and long-audio tools', () => {
  it('a person sees a tile for each of the eight tools the Hub lists, and none for a tool the Hub does not list (R-47)', async () => {
    hub.listed = ['voice-changer', 'stems', 'receptionist'];
    await renderRouter(routes, { initialUrl: '/studio' });
    expect(await screen.findByTestId('studio-tool-voice-changer')).toHaveAccessibleName('Voice changer, 400 a minute');
    expect(screen.getByTestId('studio-tool-stems')).toHaveAccessibleName('Split a song, 300');
    expect(screen.getByTestId('studio-tool-receptionist')).toHaveAccessibleName('Receptionist, 20 a message');
    for (const id of ['dialogue', 'my-voice', 'video-music', 'audiobook', 'podcast']) expect(screen.queryByTestId(`studio-tool-${id}`)).toBeNull();
    expect(screen.getByTestId('studio-line')).toHaveTextContent('Every AI tool, paid in points');
  });

  it('a tool the Hub lists without what its screen reads is not drawn', async () => {
    const saved = { dialogue: SPECS.dialogue.input, podcast: SPECS.podcast.input, vc: SPECS['voice-changer'].input };
    SPECS.dialogue.input = { ...saved.dialogue, dialogue: undefined };
    SPECS.podcast.input = { ...saved.podcast, podcast: { ...(saved.podcast.podcast as object), durations: [] } };
    SPECS['voice-changer'].input = { ...saved.vc, file: { ...(saved.vc.file as object), voice: undefined } };
    try {
      await renderRouter(routes, { initialUrl: '/studio' });
      await screen.findByTestId('studio-tool-stems');
      for (const id of ['dialogue', 'podcast', 'voice-changer']) expect(screen.queryByTestId(`studio-tool-${id}`)).toBeNull();
    } finally {
      SPECS.dialogue.input = saved.dialogue;
      SPECS.podcast.input = saved.podcast;
      SPECS['voice-changer'].input = saved.vc;
    }
  });
});

describe('POINTS-16 · Voice changer', () => {
  it('a person picks a clip, picks a voice, sees the cost for its length, runs it and hears the new voice', async () => {
    await openTool('voice-changer', 'tool-file');
    expect(screen.getByTestId('tool-length')).toHaveTextContent('MP3, WAV, M4A or AAC. Up to 500 MB and 10 minutes.');
    await pickFileFor(audioFile());
    expect(hub.presigns[0]).toMatchObject({ folder: 'ai/input-audio', contentType: 'audio/mpeg' });
    expect(screen.getByTestId('tool-length')).toHaveTextContent('About 1 minute');
    expect(screen.getByTestId('tool-cost')).toHaveTextContent('This uses 400 points');
    await fireEvent.press(screen.getByTestId('tool-voice-tunde'));
    await runAndFinish();
    await screen.findByTestId('tool-player');
    expect(hub.posts).toHaveLength(1);
    expect(hub.posts[0]).toMatchObject({ tool: 'voice-changer', body: { fileKey: 'ai/input-audio/k1', voiceId: 'tunde', quoteToken: 'tok-voice_changer_per_min-400' } });
    expect(hub.posts[0].key).toBeTruthy();
    expect(screen.getByTestId('tool-used')).toHaveTextContent(/400 points used/);
  });

  it('a double tap on Run sends one request, and a recording over the Hub’s length is refused before Run in its own words', async () => {
    await openTool('voice-changer', 'tool-file');
    hub.fileRefusal = { code: 'ai_length_too_long', message: 'That recording is 14 minutes. The longest is 10. No points were taken.' };
    mockPick.file = audioFile();
    await fireEvent.press(screen.getByTestId('tool-file'));
    expect(await screen.findByTestId('tool-file-refused')).toHaveTextContent(/The longest is 10/);
    expect(screen.getByTestId('tool-run')).toBeDisabled();
    hub.fileRefusal = null;
    await pickFileFor(audioFile('again.mp3'));
    const run = screen.getByTestId('tool-run');
    await fireEvent.press(run);
    await fireEvent.press(run);
    await screen.findByTestId('tool-working');
    expect(hub.posts).toHaveLength(1);
  });

  it('a person records a clip: the microphone is asked once, the take plays back, goes up as an M4A and is quoted; the phone call that cuts it short keeps it', async () => {
    await openTool('voice-changer', 'tool-file');
    await fireEvent.press(screen.getByTestId('tool-record'));
    await waitFor(() => expect(mockRecorder.record).toHaveBeenCalledTimes(1));
    expect(mockPermission).toHaveBeenCalledTimes(1);
    await mockEmit({ isRecording: true, durationMillis: 7000 });
    expect(screen.getByTestId('tool-record-clock')).toHaveTextContent('Recording 0:07');
    await fireEvent.press(screen.getByTestId('tool-record-stop'));
    await mockEmit({ isRecording: false });
    await screen.findByTestId('tool-cost');
    expect(hub.presigns[0]).toMatchObject({ folder: 'ai/input-audio', contentType: 'audio/mp4', extension: 'm4a' });
    expect(screen.getByTestId('tool-record-playback')).toBeTruthy();
    expect(screen.getByTestId('tool-record')).toHaveTextContent('Record again');
    // A second take: a call comes in and the app goes to the background; the take is stopped and kept, and goes up.
    await fireEvent.press(screen.getByTestId('tool-record'));
    await waitFor(() => expect(mockRecorder.record).toHaveBeenCalledTimes(2));
    await mockEmit({ isRecording: true, durationMillis: 3000 });
    await goToBackground();
    await mockEmit({ isRecording: false });
    await waitFor(() => expect(mockRecorder.stop).toHaveBeenCalledTimes(2));
    expect(await screen.findByTestId('tool-record-interrupted')).toBeTruthy();
    await waitFor(() => expect(hub.presigns).toHaveLength(2));
  });

  it('a refused microphone says how to turn it on and leaves choosing a recording working', async () => {
    mockPermission.mockImplementation(async () => ({ granted: false, canAskAgain: false, status: 'denied', expires: 'never' }));
    await openTool('voice-changer', 'tool-file');
    await fireEvent.press(screen.getByTestId('tool-record'));
    expect(await screen.findByTestId('tool-record-refused')).toHaveTextContent(/phone's settings/);
    await pickFileFor(audioFile());
    expect(screen.getByTestId('tool-run')).toBeEnabled();
  });

  it('"Your voice" leads the voice list when the Hub adds it, once, and picking it asks for no new agreement', async () => {
    hub.ownVoice = true;
    await openTool('voice-changer', 'tool-file');
    const rows = within(screen.getByTestId('tool-voices')).getAllByRole('radio');
    expect(rows.map((r) => r.props.accessibilityLabel.split(',')[0])).toEqual(['Your voice', 'Ada', 'Tunde', 'Zara']);
    await pickFileFor(audioFile());
    await fireEvent.press(screen.getByTestId('tool-voice-own'));
    expect(screen.queryByTestId('own-voice-consent')).toBeNull();
    await runAndFinish();
    expect(hub.posts[0].body.voiceId).toBe('own');
  });
});

describe('POINTS-16 · Dialogue', () => {
  const write = async (index: number, words: string) => fireEvent.changeText(screen.getByTestId(`scene-text-${index}`), words);
  const pick = async (index: number, voice: string) => {
    await fireEvent.press(screen.getByTestId(`scene-voice-${index}`));
    await fireEvent.press(screen.getByTestId(`scene-voice-${index}-pick-${voice}`));
  };

  it('a person writes 3 lines with 2 voices, sees the cost, runs the scene and hears it', async () => {
    await openTool('dialogue', 'scene');
    expect(screen.getByTestId('scene-line-0')).toBeTruthy();
    await write(0, 'Good morning.');
    await write(1, 'Morning! Did you sleep well?');
    await fireEvent.press(screen.getByTestId('scene-add'));
    await write(2, 'Very well, thank you.');
    await pick(2, 'ada');
    expect(screen.getByTestId('tool-count')).toHaveTextContent('62 / 400');
    await waitFor(() => expect(screen.getByTestId('tool-cost')).toHaveTextContent('This uses 250 points'));
    await runAndFinish();
    await screen.findByTestId('tool-player');
    expect(hub.posts[0]).toMatchObject({ tool: 'dialogue', body: { quoteToken: 'tok-dialogue_per_min-250' } });
    expect(hub.posts[0].body.lines).toEqual([
      { text: 'Good morning.', voiceId: 'ada' },
      { text: 'Morning! Did you sleep well?', voiceId: 'tunde' },
      { text: 'Very well, thank you.', voiceId: 'ada' },
    ]);
  });

  it('a third voice past the Hub’s most is refused with the reason and the scene stays as it was; a line past the characters is cut with the reason', async () => {
    await openTool('dialogue', 'scene');
    await write(0, 'One.');
    await write(1, 'Two.');
    await fireEvent.press(screen.getByTestId('scene-add'));
    await pick(2, 'zara');
    expect(screen.getByTestId('scene-note')).toHaveTextContent('A scene can use up to 2 different voices.');
    await fireEvent.press(screen.getByTestId('scene-voice-2'));
    expect(screen.getByTestId('scene-voice-2').props.accessibilityLabel).not.toContain('Zara');
    await write(2, 'x'.repeat(500));
    expect(screen.getByTestId('scene-note')).toHaveTextContent('A scene can have 400 characters in all.');
    expect(screen.getByTestId('tool-count')).toHaveTextContent('400 / 400');
    await fireEvent.press(screen.getByTestId('scene-add'));
    expect(screen.getByTestId('scene-note')).toHaveTextContent(/400 characters/);
    expect(screen.queryByTestId('scene-line-3')).toBeNull();
  });

  it('a line with no words keeps Run off, and a line can be taken out', async () => {
    await openTool('dialogue', 'scene');
    await write(0, 'Only one line has words.');
    expect(screen.getByTestId('tool-run')).toBeDisabled();
    await fireEvent.press(screen.getByTestId('scene-remove-1'));
    expect(screen.queryByTestId('scene-line-1')).toBeNull();
    await waitFor(() => expect(screen.getByTestId('tool-run')).toBeEnabled());
  });

  it('with too few points the sheet appears and nothing runs; past the daily limit the limit view names when it resets', async () => {
    hub.points = 100;
    await openTool('dialogue', 'scene');
    await write(0, 'Hello there.');
    await write(1, 'Hi!');
    await screen.findByTestId('tool-cost');
    await fireEvent.press(screen.getByTestId('tool-run'));
    expect(await screen.findByTestId('shortfall-sheet')).toBeTruthy();
    expect(hub.posts).toHaveLength(0);
    await fireEvent.press(screen.getByTestId('shortfall-close'));
    hub.points = 5000;
    hub.cap = { cap: 'daily', limit: 5000, message: 'Daily limit reached.', resetsAt: '2026-10-31T00:00:00.000Z', usedPoints: 5000, remainingPoints: 0 };
    await fireEvent.press(screen.getByTestId('tool-run'));
    expect(await screen.findByTestId('cap-reached')).toHaveTextContent(/resets at midnight/);
    expect(hub.posts).toHaveLength(0);
  });
});

describe('POINTS-16 · Clone your own voice', () => {
  const record = async (seconds = 25) => {
    await fireEvent.press(screen.getByTestId('clone-record'));
    await waitFor(() => expect(mockRecorder.record).toHaveBeenCalled());
    await mockEmit({ isRecording: true, durationMillis: seconds * 1000 });
    await fireEvent.press(screen.getByTestId('clone-record-stop'));
    await mockEmit({ isRecording: false });
    await waitFor(() => expect(screen.getByTestId('clone-take-state')).toHaveTextContent(/Ready/));
  };

  it('a person reads the Hub’s words exactly, records, names the voice and agrees; the voice is made and kept; Remove takes it away after a confirm', async () => {
    await openTool('my-voice', 'clone-consent');
    expect(screen.getByTestId('clone-consent-line')).toHaveTextContent(CLONE_LINE);
    expect(screen.getByTestId('clone-hint')).toHaveTextContent(/at least 10 seconds, up to 180/);
    expect(screen.getByTestId('clone-agree')).toBeDisabled();
    await record();
    expect(hub.fileQuotes[0].tool).toBe('my-voice');
    await fireEvent.changeText(screen.getByTestId('clone-name'), 'My voice');
    expect(screen.getByTestId('tool-cost')).toHaveTextContent('This uses 100 points');
    await fireEvent.press(screen.getByTestId('clone-agree'));
    await screen.findByTestId('tool-working');
    expect(hub.posts[0]).toMatchObject({ tool: 'my-voice', body: { fileKey: 'ai/input-audio/k1', name: 'My voice', consentLine: CLONE_LINE, quoteToken: 'tok-voice_clone_once-100' } });
    await sleep(2100);
    expect(await screen.findByTestId('clone-saved-name')).toHaveTextContent('My voice');
    await fireEvent.press(screen.getByTestId('clone-remove'));
    expect(await screen.findByTestId('clone-remove-sheet')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('clone-remove-confirm'));
    await screen.findByTestId('clone-consent');
    expect(hub.calls).toContain('DELETE /ai-tools/my-voice');
    expect(screen.getByTestId('clone-notice-ok')).toHaveTextContent('Your voice is removed.');
  });

  it('declining creates nothing, and a voice already kept shows the saved row with no way to make a second', async () => {
    const rendered = await openTool('my-voice', 'clone-consent');
    await fireEvent.press(screen.getByTestId('clone-not-now'));
    await waitFor(() => expect(screen.queryByTestId('clone-screen')).toBeNull());
    expect(hub.posts).toHaveLength(0);
    expect(hub.presigns).toHaveLength(0);
    await rendered.unmount();
    hub.saved = { state: 'ready', name: 'Ada' };
    await openTool('my-voice', 'clone-saved');
    expect(screen.queryByTestId('clone-record')).toBeNull();
    expect(screen.queryByTestId('clone-agree')).toBeNull();
  });

  it('a sample the Hub refuses (too short) is said in its words and nothing is held; a failed clone says no points were taken and the balance is unchanged', async () => {
    await openTool('my-voice', 'clone-consent');
    hub.fileRefusal = { code: 'ai_length_too_short', message: 'Record at least 10 seconds of your voice. This one is 4. No points were taken.' };
    await fireFilled();
    async function fireFilled() {
      await fireEvent.press(screen.getByTestId('clone-record'));
      await waitFor(() => expect(mockRecorder.record).toHaveBeenCalled());
      await mockEmit({ isRecording: true, durationMillis: 4000 });
      await fireEvent.press(screen.getByTestId('clone-record-stop'));
      await mockEmit({ isRecording: false });
    }
    expect(await screen.findByTestId('clone-refused')).toHaveTextContent(/Record at least 10 seconds/);
    expect(screen.getByTestId('clone-agree')).toBeDisabled();
    hub.fileRefusal = null;
    hub.fail = true;
    await fireEvent.press(screen.getByTestId('clone-record'));
    await waitFor(() => expect(mockRecorder.record).toHaveBeenCalledTimes(2));
    await mockEmit({ isRecording: true, durationMillis: 20000 });
    await fireEvent.press(screen.getByTestId('clone-record-stop'));
    await mockEmit({ isRecording: false });
    await waitFor(() => expect(screen.getByTestId('clone-take-state')).toHaveTextContent(/Ready/));
    await fireEvent.changeText(screen.getByTestId('clone-name'), 'Voice');
    await fireEvent.press(screen.getByTestId('clone-agree'));
    await screen.findByTestId('tool-working');
    await sleep(2100);
    expect(await screen.findByTestId('clone-failed')).toHaveTextContent(/No points were taken/);
    expect(hub.points).toBe(5000);
    expect(n(hub.points)).toBe('5,000');
  });
});
