/* eslint-disable @typescript-eslint/no-require-imports */
import { Platform } from 'react-native';

/**
 * CREATE-FRAMES: the frame read out of a person's own video (`frames.ts`). It runs on the phone's `expo-video` thumbnail reader,
 * which jest has no phone for, so the reader is scripted here: what it is asked, and what it does when the phone cannot read
 * the file. The phone's own part is on the task file's PHONE CHECK list.
 */
type Listener = (event: { status: string }) => void;
type Script = {
  status: 'idle' | 'loading' | 'readyToPlay' | 'error';
  duration: number;
  /** Then the status the player reports once the file has opened (a phone loads a file after the player exists). */
  opensAs: 'readyToPlay' | 'error' | null;
  thumbnails: () => Promise<unknown[]>;
  makeThrows: boolean;
};

const mockThumbnail = { width: 480, height: 270, requestedTime: 0.5, actualTime: 0.5 };
const mockVideo: {
  script: Script;
  made: { uri: string; release: jest.Mock; thumbnails: jest.Mock }[];
} = {
  script: { status: 'readyToPlay', duration: 8, opensAs: null, thumbnails: async () => [mockThumbnail], makeThrows: false },
  made: [],
};

jest.mock('expo-video', () => ({
  VideoView: 'VideoView',
  useVideoPlayer: jest.fn(),
  createVideoPlayer: jest.fn((uri: string) => {
    if (mockVideo.script.makeThrows) throw new Error('The link cannot be opened.');
    const listeners = new Set<Listener>();
    const release = jest.fn();
    const thumbnails = jest.fn((_times: number[], _options: unknown) => mockVideo.script.thumbnails());
    const player = {
      status: mockVideo.script.status,
      duration: mockVideo.script.duration,
      release,
      generateThumbnailsAsync: thumbnails,
      addListener: jest.fn((_name: string, listener: Listener) => {
        listeners.add(listener);
        if (mockVideo.script.opensAs) {
          const status = mockVideo.script.opensAs;
          setTimeout(() => listeners.forEach((l) => l({ status })), 5);
        }
        return { remove: () => listeners.delete(listener) };
      }),
    };
    mockVideo.made.push({ uri, release, thumbnails });
    return player;
  }),
}));

const { frameFor, FRAME_AT_SECONDS, FRAME_MAX_SIDE, FRAME_TIMEOUT_MS } = require('../frames') as typeof import('../frames');

const GALLERY = 'content://media/external/video/media/42';
const video = () => ({ contentType: 'video/mp4', previewUri: GALLERY });

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
  mockVideo.made = [];
  mockVideo.script = { status: 'readyToPlay', duration: 8, opensAs: null, thumbnails: async () => [mockThumbnail], makeThrows: false };
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('the frame of a video the person chose (Android, a gallery content:// link)', () => {
  it('a user who picks a video gets a frame of it: the gallery link is opened as it is and a half second frame is read, bounded in size', async () => {
    const frame = await frameFor(video());
    expect(frame).toBe(mockThumbnail);
    expect(mockVideo.made).toHaveLength(1);
    expect(mockVideo.made[0].uri).toBe(GALLERY);
    expect(mockVideo.made[0].thumbnails).toHaveBeenCalledWith([FRAME_AT_SECONDS], { maxWidth: FRAME_MAX_SIDE, maxHeight: FRAME_MAX_SIDE });
    expect(FRAME_AT_SECONDS).toBe(0.5);
  });

  it('lets the player go once the frame is read', async () => {
    await frameFor(video());
    expect(mockVideo.made[0].release).toHaveBeenCalledTimes(1);
  });

  it('waits for a file the phone is still opening (an iPhone loads a .mov after the player exists), then reads it', async () => {
    mockVideo.script.status = 'loading';
    mockVideo.script.opensAs = 'readyToPlay';
    expect(await frameFor({ contentType: 'video/quicktime', previewUri: 'file:///var/mobile/clip.mov' })).toBe(mockThumbnail);
    expect(mockVideo.made[0].thumbnails).toHaveBeenCalledTimes(1);
  });

  it('reads a clip shorter than a second at its middle', async () => {
    mockVideo.script.duration = 0.6;
    await frameFor(video());
    expect(mockVideo.made[0].thumbnails.mock.calls[0][0]).toEqual([0.3]);
  });

  it('a video the phone cannot read keeps the icon: the reader failing, answering nothing, or the file never opening each give null, and the player is let go', async () => {
    mockVideo.script.thumbnails = async () => {
      throw new Error('Failed to generate thumbnail');
    };
    expect(await frameFor(video())).toBeNull();

    mockVideo.script.thumbnails = async () => [];
    expect(await frameFor(video())).toBeNull();

    mockVideo.script.thumbnails = async () => [mockThumbnail];
    mockVideo.script.status = 'loading';
    mockVideo.script.opensAs = 'error';
    expect(await frameFor(video())).toBeNull();

    mockVideo.script.status = 'error';
    expect(await frameFor(video())).toBeNull();

    expect(mockVideo.made).toHaveLength(4);
    expect(mockVideo.made.every((m) => m.release.mock.calls.length === 1)).toBe(true);
  });

  it('a phone that cannot make a player at all gives null, not a crash', async () => {
    mockVideo.script.makeThrows = true;
    expect(await frameFor(video())).toBeNull();
  });

  it('a file that never answers gives null after the limit, so the upload is never held back for ever', async () => {
    jest.useFakeTimers();
    mockVideo.script.thumbnails = () => new Promise<unknown[]>(() => undefined);
    const pending = frameFor(video());
    await jest.advanceTimersByTimeAsync(FRAME_TIMEOUT_MS - 1);
    let settled = false;
    void pending.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    await jest.advanceTimersByTimeAsync(2);
    expect(await pending).toBeNull();
    expect(mockVideo.made[0].release).toHaveBeenCalledTimes(1);
  });

  it('opens nothing for a photo, an audio file or a PDF, or for a video with no link to read', async () => {
    expect(await frameFor({ contentType: 'image/jpeg', previewUri: 'file:///p.jpg' })).toBeNull();
    expect(await frameFor({ contentType: 'audio/mpeg', previewUri: 'file:///a.mp3' })).toBeNull();
    expect(await frameFor({ contentType: 'application/pdf', previewUri: undefined })).toBeNull();
    expect(await frameFor({ contentType: 'video/mp4', previewUri: undefined })).toBeNull();
    expect(mockVideo.made).toHaveLength(0);
  });
});
