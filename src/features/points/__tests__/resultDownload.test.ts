/* eslint-disable @typescript-eslint/no-require-imports */
import { Platform } from 'react-native';

/*
 * POINTS-13 · the phone's side of the quiet Download, on Platform.OS android, over the phone's file, photos and share modules: a picture
 * goes to the photos, audio to the share sheet, a stopped download leaves nothing, and no permission means nothing is saved.
 */
const mockWritten: string[] = [];
jest.mock('expo-file-system', () => {
  class File {
    uri: string;
    constructor(_dir: unknown, name: string) {
      this.uri = `file:///cache/${name}`;
    }
    delete() {
      mockWritten.push(`deleted ${this.uri}`);
    }
    static downloadFileAsync = jest.fn(async (_url: string, target: { uri: string }, options: { signal?: AbortSignal; onProgress?: (p: { bytesWritten: number; totalBytes: number }) => void }) => {
      options.onProgress?.({ bytesWritten: 50, totalBytes: 100 });
      if (options.signal?.aborted) throw new Error('aborted');
      return target;
    });
  }
  return { File, Paths: { cache: {} } };
});

beforeAll(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
});
beforeEach(() => {
  mockWritten.length = 0;
  jest.clearAllMocks();
});

const load = () => require('../resultDownload') as typeof import('../resultDownload');
const photos = () => require('expo-media-library') as { requestPermissionsAsync: jest.Mock; Asset: { create: jest.Mock } };
const sharing = () => require('expo-sharing') as { isAvailableAsync: jest.Mock; shareAsync: jest.Mock };

describe('Download on a phone', () => {
  it('saves a picture to the photos and leaves nothing in the cache', async () => {
    photos().requestPermissionsAsync.mockResolvedValue({ granted: true });
    const progress: (number | null)[] = [];
    const outcome = await load().downloadResult({ url: 'https://f.test/p.png?dl=1', name: 'studio-image-30-oct-2026.png', contentType: 'image/png' }, { onProgress: (s) => progress.push(s) });
    expect(outcome).toBe('saved');
    expect(photos().Asset.create).toHaveBeenCalledWith('file:///cache/studio-image-30-oct-2026.png');
    expect(mockWritten).toEqual(['deleted file:///cache/studio-image-30-oct-2026.png']);
    expect(progress).toEqual([0.5]);
  });

  it('asks for the photos once and saves nothing when they are not allowed', async () => {
    photos().requestPermissionsAsync.mockResolvedValue({ granted: false });
    const outcome = await load().downloadResult({ url: 'https://f.test/c.mp4', name: 'clip.mp4', contentType: 'video/mp4' });
    expect(outcome).toBe('denied');
    expect(photos().Asset.create).not.toHaveBeenCalled();
    expect(photos().requestPermissionsAsync).toHaveBeenCalledWith(true);
  });

  it('hands audio to the share sheet to be saved to Files', async () => {
    sharing().isAvailableAsync.mockResolvedValue(true);
    const outcome = await load().downloadResult({ url: 'https://f.test/v.mp3', name: 'voice.mp3', contentType: 'audio/mpeg' });
    expect(outcome).toBe('shared');
    expect(sharing().shareAsync).toHaveBeenCalledWith('file:///cache/voice.mp3', { mimeType: 'audio/mpeg', dialogTitle: 'Save to Files' });
    expect(photos().Asset.create).not.toHaveBeenCalled();
  });

  it('a stopped download is cancelled, not failed, and the part of the file goes', async () => {
    const stop = new AbortController();
    stop.abort();
    const outcome = await load().downloadResult({ url: 'https://f.test/c.mp4', name: 'clip.mp4', contentType: 'video/mp4' }, { signal: stop.signal });
    expect(outcome).toBe('cancelled');
    expect(mockWritten).toEqual(['deleted file:///cache/clip.mp4']);
  });
});
