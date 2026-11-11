/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Platform, ScrollView, StyleSheet } from 'react-native';

import { appListeners, hub, openSheetCount, openToolFromStudio, pressAndroidBack, pressTile, resetHub, routes, setUpRoutes, sleep, watchAppState, watchBackButton } from '../__helpers__/studio2Harness';

/*
 * S2-APP-2 patch, round 1 (the verifier's F1, F2 and F4), on the real Expo Router stack, on Platform.OS android:
 *  F1  the Audiobook's text box and the Podcast maker's form fold into one summary row once Run is pressed, so the working, done and failed views
 *      sit right under it; "Edit" unfolds the input again on done and failed only, with the result kept below.
 *  F2  the phone's Back button on every new screen: the router's own listener pops the route, a sheet takes the press first, a running job is kept.
 *  F4  Dialogue: only the line being written in carries the accent ring.
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
  watchBackButton();
});

afterEach(async () => {
  await act(async () => {
    jest.advanceTimersByTime(10);
  });
});

const file = (name: string, mimeType: string, size = 4000): Asset => ({ uri: `file:///cache/${name}`, name, mimeType, size });
const video = (seconds: number) => ({ uri: 'file:///cache/clip.mp4', mimeType: 'video/mp4', fileName: 'clip.mp4', fileSize: 8_000_000, duration: seconds * 1000 });
const bookText = (count: number) => `${'Once upon a time. '.repeat(Math.ceil(count / 18)).slice(0, count - 1)}.`;
/** The router's own view of where it is (what `toHavePathname` reads). */
const where = (): string => (jest.requireActual('expo-router/build/global-state/router-store') as { store: { getRouteInfo: () => { pathname: string } } }).store.getRouteInfo().pathname;

/** Every test id on the page's scroll, in the order they are drawn: what sits above what. */
function idsOnPage(): string[] {
  const out: string[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    const n = node as { props?: { testID?: string }; children?: unknown[] | null };
    if (n.props?.testID && !n.props.testID.startsWith('icon-') && out[out.length - 1] !== n.props.testID) out.push(n.props.testID);
    n.children?.forEach(walk);
  };
  walk(screen.getByTestId('points-scroll'));
  return out.slice(1);
}
const reachedBy = (ids: string[], id: string) => ids.slice(0, ids.indexOf(id) + 1);
const summaryIds = ['run-summary', 'run-summary-title', 'run-summary-line', 'run-summary-edit'];

describe('F1 · the Audiobook folds its text into one row once Run is pressed', () => {
  async function runBook(count = 25_200) {
    hub.points = 20_000;
    await openToolFromStudio('audiobook', 'tool-text');
    await fireEvent.changeText(screen.getByTestId('tool-text'), bookText(count));
    await waitFor(() => expect(screen.getByTestId('tool-cost')).toBeTruthy());
    expect(screen.queryByTestId('run-summary')).toBeNull();
    await fireEvent.press(screen.getByTestId('tool-run'));
    await screen.findByTestId('tool-working');
  }

  it('a user with a 25,200 character book sees, right after Run, one row ("Your text", "25,200 characters") with the working view under it and no text box; the page is scrolled to the top', async () => {
    const scrolls = jest.spyOn(ScrollView.prototype as unknown as { scrollTo: (o: object) => void }, 'scrollTo');
    await runBook();
    expect(screen.queryByTestId('tool-text')).toBeNull();
    expect(screen.getByTestId('run-summary-title')).toHaveTextContent('Your text');
    expect(screen.getByTestId('run-summary-line')).toHaveTextContent('25,200 characters');
    // Nothing is drawn between the top of the page and the working view but that row: the working view is in the first screen however long the book is.
    const ids = idsOnPage();
    expect(ids[0]).toBe('run-summary');
    expect(reachedBy(ids, 'tool-working').filter((id) => !summaryIds.includes(id))).toEqual(['tool-working']);
    expect(scrolls).toHaveBeenCalledWith({ x: 0, y: 0, animated: false });
    // While the book is being made the row has no action.
    expect(screen.queryByTestId('run-summary-edit')).toBeNull();
  });

  it('a user whose book is done sees "Make it a piece" right under the row, and Edit unfolds the text again with the player and the piece kept below', async () => {
    await runBook();
    await sleep(2100);
    await screen.findByTestId('tool-player');
    const ids = idsOnPage();
    expect(ids[0]).toBe('run-summary');
    expect(reachedBy(ids, 'tool-player').filter((id) => !summaryIds.includes(id))).toEqual(['tool-player']);
    expect(ids.indexOf('result-piece')).toBeGreaterThan(ids.indexOf('tool-player'));
    expect(screen.queryByTestId('tool-text')).toBeNull();
    await fireEvent.press(screen.getByTestId('run-summary-edit'));
    expect(screen.getByTestId('tool-text').props.value).toHaveLength(25_200);
    expect(screen.queryByTestId('run-summary')).toBeNull();
    expect(screen.getByTestId('tool-player')).toBeTruthy();
    expect(screen.getByTestId('result-piece')).toBeTruthy();
    const after = idsOnPage();
    expect(after.indexOf('tool-text')).toBeLessThan(after.indexOf('tool-player'));
    expect(hub.posts).toHaveLength(1);
    // Changing the words is a new run: the old result goes, the page is the input.
    await fireEvent.changeText(screen.getByTestId('tool-text'), bookText(25_000));
    expect(screen.queryByTestId('tool-player')).toBeNull();
    expect(screen.getByTestId('tool-run')).toBeTruthy();
  });

  it('a user whose book failed sees the failure right under the row, and Edit unfolds the text with the failure kept below', async () => {
    hub.fail = true;
    await runBook();
    await sleep(2100);
    await screen.findByTestId('tool-failed');
    const ids = idsOnPage();
    expect(ids[0]).toBe('run-summary');
    expect(reachedBy(ids, 'tool-failed').filter((id) => !summaryIds.includes(id))).toEqual(['tool-failed']);
    await fireEvent.press(screen.getByTestId('run-summary-edit'));
    expect(screen.getByTestId('tool-text').props.value).toHaveLength(25_200);
    expect(screen.getByTestId('tool-failed')).toBeTruthy();
    expect(screen.getByTestId('tool-try-again')).toBeTruthy();
  });

  it('there is no row before Run and no Edit while the book is being made', async () => {
    await openToolFromStudio('audiobook', 'tool-text');
    expect(screen.queryByTestId('run-summary')).toBeNull();
    expect(screen.getByTestId('tool-text')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('tool-text'), 'A short book.');
    await screen.findByTestId('tool-cost');
    await fireEvent.press(screen.getByTestId('tool-run'));
    await screen.findByTestId('tool-working');
    expect(screen.getByTestId('run-summary-line')).toHaveTextContent('13 characters');
    expect(screen.queryByTestId('run-summary-edit')).toBeNull();
  });
});

describe('F1 · the Podcast maker folds its form into one row once Run is pressed', () => {
  async function runPodcast(setUp: () => Promise<void> = async () => undefined) {
    await openToolFromStudio('podcast', 'podcast-inputs');
    await setUp();
    await waitFor(() => expect(screen.getByTestId('tool-cost')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('tool-run'));
    await screen.findByTestId('tool-working');
  }
  const twoHostsText = async () => {
    await fireEvent.changeText(screen.getByTestId('tool-text'), 'How to price handmade soap for a market stall.');
    await fireEvent.press(screen.getByTestId('podcast-voice-2-tunde'));
  };

  it('a user with a two-host podcast from a text sees, right after Run, one row ("Your text", "Two hosts. Standard") with the working view under it and no form', async () => {
    const scrolls = jest.spyOn(ScrollView.prototype as unknown as { scrollTo: (o: object) => void }, 'scrollTo');
    await runPodcast(twoHostsText);
    expect(screen.queryByTestId('podcast-inputs')).toBeNull();
    expect(screen.queryByTestId('tool-text')).toBeNull();
    expect(screen.getByTestId('run-summary-title')).toHaveTextContent('Your text');
    expect(screen.getByTestId('run-summary-line')).toHaveTextContent('Two hosts. Standard');
    const ids = idsOnPage();
    expect(ids[0]).toBe('run-summary');
    expect(reachedBy(ids, 'tool-working').filter((id) => !summaryIds.includes(id))).toEqual(['tool-working']);
    expect(scrolls).toHaveBeenCalledWith({ x: 0, y: 0, animated: false });
    expect(screen.queryByTestId('run-summary-edit')).toBeNull();
  });

  it('a user whose podcast is done sees "Make it a piece" right under the row; Edit unfolds the form with the player and the piece kept below', async () => {
    await runPodcast(twoHostsText);
    await sleep(2100);
    await screen.findByTestId('tool-player');
    const ids = idsOnPage();
    expect(ids[0]).toBe('run-summary');
    expect(reachedBy(ids, 'tool-player').filter((id) => !summaryIds.includes(id))).toEqual(['tool-player']);
    expect(ids.indexOf('result-piece')).toBeGreaterThan(ids.indexOf('tool-player'));
    await fireEvent.press(screen.getByTestId('run-summary-edit'));
    expect(screen.getByTestId('podcast-inputs')).toBeTruthy();
    expect(screen.getByTestId('tool-text').props.value).toBe('How to price handmade soap for a market stall.');
    expect(screen.queryByTestId('run-summary')).toBeNull();
    expect(screen.getByTestId('tool-player')).toBeTruthy();
    expect(screen.getByTestId('result-piece')).toBeTruthy();
    const after = idsOnPage();
    expect(after.indexOf('podcast-inputs')).toBeLessThan(after.indexOf('tool-player'));
    // A change is a new run: the old result goes.
    await fireEvent.press(screen.getByTestId('podcast-length-short'));
    expect(screen.queryByTestId('tool-player')).toBeNull();
    expect(hub.posts).toHaveLength(1);
  });

  it('a user whose podcast from a link failed sees "From your link" and "One host. Short"; Edit unfolds the form with the failure kept below', async () => {
    hub.fail = true;
    await runPodcast(async () => {
      await fireEvent.press(screen.getByTestId('podcast-source-link'));
      await fireEvent.changeText(screen.getByTestId('podcast-link'), 'https://example.com/soap');
      await fireEvent.press(screen.getByTestId('podcast-hosts-1'));
      await fireEvent.press(screen.getByTestId('podcast-length-short'));
    });
    await sleep(2100);
    await screen.findByTestId('tool-failed');
    expect(screen.getByTestId('run-summary-title')).toHaveTextContent('From your link');
    expect(screen.getByTestId('run-summary-line')).toHaveTextContent('One host. Short');
    expect(reachedBy(idsOnPage(), 'tool-failed').filter((id) => !summaryIds.includes(id))).toEqual(['tool-failed']);
    await fireEvent.press(screen.getByTestId('run-summary-edit'));
    expect(screen.getByTestId('podcast-link').props.value).toBe('https://example.com/soap');
    expect(screen.getByTestId('tool-failed')).toBeTruthy();
  });

  it('a podcast opened from a ready notice, where the phone holds no record of the choices, is a row that says only what it is', async () => {
    hub.holdJobs = true;
    hub.jobs['job-77'] = { id: 'job-77', tool: 'podcast', state: 'working', voiceId: 'ada', targetLanguage: null, characters: 0, units: 1, costPoints: 1250, audioUrl: null, outputs: [], message: null, saved: false, createdAt: new Date().toISOString(), finishedAt: null };
    await renderRouter(routes, { initialUrl: '/studio-tool?job=job-77' });
    await screen.findByTestId('run-summary');
    expect(screen.getByTestId('run-summary-title')).toHaveTextContent('Your podcast');
    expect(screen.queryByTestId('run-summary-line')).toBeNull();
    expect(screen.queryByTestId('podcast-inputs')).toBeNull();
  });
});

describe('F4 · Dialogue: only the line being written in carries the accent ring', () => {
  const ring = (i: number) => (StyleSheet.flatten(screen.getByTestId(`scene-box-${i}`).props.style) as { boxShadow: { spreadDistance: number }[] }).boxShadow[0].spreadDistance;

  it('a user with an empty scene sees no line ringed, and the ring follows the line they tap into', async () => {
    await openToolFromStudio('dialogue', 'scene');
    expect([ring(0), ring(1)]).toEqual([1, 1]);
    await fireEvent(screen.getByTestId('scene-text-1'), 'focus');
    expect([ring(0), ring(1)]).toEqual([1, 1.5]);
    await fireEvent(screen.getByTestId('scene-text-1'), 'blur');
    await fireEvent(screen.getByTestId('scene-text-0'), 'focus');
    expect([ring(0), ring(1)]).toEqual([1.5, 1]);
    await fireEvent.changeText(screen.getByTestId('scene-text-0'), 'Good morning.');
    expect([ring(0), ring(1)]).toEqual([1.5, 1]);
    await fireEvent(screen.getByTestId('scene-text-0'), 'blur');
    expect([ring(0), ring(1)]).toEqual([1, 1]);
  });
});

/** What a person does to get each job tool to the point of Run. */
const READY: Record<string, string> = { 'voice-changer': 'tool-file', dialogue: 'scene', 'video-music': 'tool-file', stems: 'tool-file', audiobook: 'tool-text', podcast: 'podcast-inputs' };
async function fillIn(id: string) {
  if (id === 'voice-changer' || id === 'stems') {
    mockPick.file = file(id === 'stems' ? 'song.mp3' : 'clip.mp3', 'audio/mpeg');
    await fireEvent.press(screen.getByTestId('tool-file'));
  } else if (id === 'video-music') {
    mockPick.video = video(20);
    await fireEvent.press(screen.getByTestId('tool-file'));
  } else if (id === 'dialogue') {
    await fireEvent.changeText(screen.getByTestId('scene-text-0'), 'Good morning.');
    await fireEvent.changeText(screen.getByTestId('scene-text-1'), 'Morning!');
  } else await fireEvent.changeText(screen.getByTestId('tool-text'), 'A short text for the tool.');
  await screen.findByTestId('tool-cost');
}
async function runTool(id: string) {
  await openToolFromStudio(id, READY[id]);
  await fillIn(id);
  await fireEvent.press(screen.getByTestId('tool-run'));
  await screen.findByTestId('tool-working');
}
const onStudio = () => expect(where()).toBe('/studio');
const JOB_TOOLS = Object.keys(READY);

describe('F2 · the phone’s Back button on the new tools (Android)', () => {
  it.each(JOB_TOOLS)('%s: Back from the input leaves for Studio and sends nothing', async (id) => {
    await openToolFromStudio(id, READY[id]);
    expect(where()).toBe('/studio-tool');
    expect(await pressAndroidBack()).toBe('screen');
    onStudio();
    expect(hub.posts).toHaveLength(0);
  });

  it.each(JOB_TOOLS)('%s: Back while the job works keeps it, and opening the tool again finds it running and sends no second request', async (id) => {
    hub.holdJobs = true;
    await runTool(id);
    expect(await pressAndroidBack()).toBe('screen');
    onStudio();
    await pressTile(id, 'tool-working');
    expect(hub.posts).toHaveLength(1);
    hub.holdJobs = false;
    await sleep(2100);
    await waitFor(() => expect(screen.queryByTestId('tool-working')).toBeNull());
    expect(hub.posts).toHaveLength(1);
  });

  it.each(JOB_TOOLS)('%s: Back from the finished result leaves; opening the tool again is a fresh input', async (id) => {
    await runTool(id);
    await sleep(2100);
    await waitFor(() => expect(screen.queryByTestId('tool-working')).toBeNull());
    expect(screen.queryByTestId('tool-failed')).toBeNull();
    expect(await pressAndroidBack()).toBe('screen');
    onStudio();
    await pressTile(id, READY[id]);
    expect(screen.queryByTestId('tool-working')).toBeNull();
    expect(screen.queryByTestId('tool-player')).toBeNull();
    expect(hub.posts).toHaveLength(1);
  });

  it.each(JOB_TOOLS)('%s: Back from the failure leaves; opening the tool again is a fresh input', async (id) => {
    hub.fail = true;
    await runTool(id);
    await sleep(2100);
    await screen.findByTestId('tool-failed');
    expect(await pressAndroidBack()).toBe('screen');
    onStudio();
    await pressTile(id, READY[id]);
    expect(screen.queryByTestId('tool-failed')).toBeNull();
    expect(hub.posts).toHaveLength(1);
  });
});

describe('F2 · the phone’s Back button on Clone your own voice (Android)', () => {
  const record = async (seconds = 25) => {
    await fireEvent.press(screen.getByTestId('clone-record'));
    await waitFor(() => expect(mockRecorder.record).toHaveBeenCalled());
    await mockEmit({ isRecording: true, durationMillis: seconds * 1000 });
    await fireEvent.press(screen.getByTestId('clone-record-stop'));
    await mockEmit({ isRecording: false });
    await waitFor(() => expect(screen.getByTestId('clone-take-state')).toHaveTextContent(/Ready/));
  };
  const agree = async () => {
    await openToolFromStudio('my-voice', 'clone-consent');
    await record();
    await fireEvent.changeText(screen.getByTestId('clone-name'), 'My voice');
    await fireEvent.press(screen.getByTestId('clone-agree'));
    await screen.findByTestId('tool-working');
  };

  it('Back from the consent leaves for Studio and creates nothing', async () => {
    await openToolFromStudio('my-voice', 'clone-consent');
    expect(await pressAndroidBack()).toBe('screen');
    onStudio();
    expect(hub.posts).toHaveLength(0);
    expect(hub.presigns).toHaveLength(0);
  });

  it('Back while the voice is being made keeps it, and opening the tool again finds it being made; it is then kept', async () => {
    hub.holdJobs = true;
    await agree();
    expect(await pressAndroidBack()).toBe('screen');
    onStudio();
    await pressTile('my-voice', 'tool-working');
    expect(hub.posts).toHaveLength(1);
    // The Hub finishes the voice on its own (the stand-in only does it when the job is read, and a reopened clone reads the saved voice).
    hub.holdJobs = false;
    hub.saved = { state: 'ready', name: 'My voice' };
    hub.ownVoice = true;
    await sleep(2100);
    expect(await screen.findByTestId('clone-saved-name')).toHaveTextContent('My voice');
  });

  it('Back from a failed clone leaves; opening the tool again asks for a new recording', async () => {
    hub.fail = true;
    await agree();
    await sleep(2100);
    await screen.findByTestId('clone-failed');
    expect(await pressAndroidBack()).toBe('screen');
    onStudio();
    await pressTile('my-voice', 'clone-consent');
    expect(screen.queryByTestId('clone-failed')).toBeNull();
  });

  it('Back with the remove-confirm sheet open closes the sheet first and keeps the voice; the next Back leaves', async () => {
    hub.saved = { state: 'ready', name: 'Ada' };
    await openToolFromStudio('my-voice', 'clone-saved');
    await fireEvent.press(screen.getByTestId('clone-remove'));
    await screen.findByTestId('clone-remove-sheet');
    expect(await pressAndroidBack()).toBe('sheet');
    await waitFor(() => expect(openSheetCount()).toBe(0));
    expect(where()).toBe('/studio-tool');
    expect(screen.getByTestId('clone-saved-name')).toHaveTextContent('Ada');
    expect(hub.calls).not.toContain('DELETE /ai-tools/my-voice');
    expect(await pressAndroidBack()).toBe('screen');
    onStudio();
    expect(hub.calls).not.toContain('DELETE /ai-tools/my-voice');
  });
});

describe('F2 · the phone’s Back button on the Receptionist (Android)', () => {
  async function setUp() {
    await openToolFromStudio('receptionist', 'receptionist-setup');
    await fireEvent.changeText(screen.getByTestId('receptionist-name'), 'Ada Soaps');
    await fireEvent.changeText(screen.getByTestId('receptionist-offer'), 'Handmade soap, open nine to five.');
    await fireEvent.press(screen.getByTestId('receptionist-save'));
    await screen.findByTestId('receptionist-tabs');
  }

  it('Back from the set-up before anything is saved leaves for Studio and saves nothing', async () => {
    await openToolFromStudio('receptionist', 'receptionist-setup');
    await fireEvent.changeText(screen.getByTestId('receptionist-name'), 'Ada Soaps');
    expect(await pressAndroidBack()).toBe('screen');
    onStudio();
    expect(hub.calls).not.toContain('PUT /ai-tools/receptionist');
  });

  it.each(['setup', 'knows', 'chat'])('Back from the %s tab leaves for Studio, and what was saved is still saved when it is opened again', async (tab) => {
    await setUp();
    await fireEvent.press(screen.getByTestId(`receptionist-tabs-${tab}`));
    await screen.findByTestId(`receptionist-${tab === 'setup' ? 'setup' : tab === 'knows' ? 'knows' : 'chat'}`);
    expect(await pressAndroidBack()).toBe('screen');
    onStudio();
    await pressTile('receptionist', 'receptionist-tabs');
    expect(hub.receptionist.setUp).toBe(true);
    expect(screen.getByTestId('receptionist-name').props.value).toBe('Ada Soaps');
  });

  it('Back with the clear sheet open closes the sheet first and clears nothing; the next Back leaves', async () => {
    await setUp();
    await fireEvent.press(screen.getByTestId('receptionist-clear'));
    await screen.findByTestId('receptionist-clear-sheet');
    expect(await pressAndroidBack()).toBe('sheet');
    expect(where()).toBe('/studio-tool');
    expect(hub.receptionist.setUp).toBe(true);
    expect(hub.calls).not.toContain('DELETE /ai-tools/receptionist');
    expect(await pressAndroidBack()).toBe('screen');
    onStudio();
  });
});
