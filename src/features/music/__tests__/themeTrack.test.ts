/* eslint-disable @typescript-eslint/no-require-imports */
/** THEME-MUSIC: the file store behind the player. The phone's mockFiles are stood in; the module under test is the real one. */
const mockFiles = new Map<string, { size: number }>();
const mockDownload = jest.fn();
const mockMove = jest.fn();
let mockPart = 'file:///documents/';

jest.mock('expo-file-system', () => {
  class File {
    uri: string;
    constructor(...parts: unknown[]) {
      this.uri = parts.map((p) => (typeof p === 'string' ? p : (p as { uri: string }).uri)).join('');
    }
    get exists() {
      return mockFiles.has(this.uri);
    }
    get size() {
      return mockFiles.get(this.uri)?.size ?? null;
    }
    delete() {
      mockFiles.delete(this.uri);
    }
    async move(to: File) {
      mockMove(this.uri, to.uri);
      mockFiles.set(to.uri, mockFiles.get(this.uri) ?? { size: 0 });
      mockFiles.delete(this.uri);
    }
    static downloadFileAsync = (...args: unknown[]) => mockDownload(...args);
  }
  return { File, Paths: { document: { uri: mockPart } } };
});

type Track = typeof import('../themeTrack');
let track: Track;

beforeEach(() => {
  mockFiles.clear();
  jest.clearAllMocks();
  mockDownload.mockImplementation(async (_url: string, to: { uri: string }) => {
    mockFiles.set(to.uri, { size: 8_700_000 });
    return { uri: to.uri, exists: true, size: 8_700_000, move: async (dest: { uri: string }) => { mockMove(to.uri, dest.uri); mockFiles.set(dest.uri, mockFiles.get(to.uri)!); mockFiles.delete(to.uri); } };
  });
  track = require('../themeTrack');
});

describe('the song kept on the phone', () => {
  it('is the website\'s own track', () => {
    expect(track.THEME_URL).toBe('https://wawuafrica.com/wawu-theme.mp3');
  });

  it('is not there until it has been fetched', () => {
    expect(track.savedTrack()).toBeNull();
  });

  it('downloads beside the final name, then moves into place, so half a file is never taken for the song', async () => {
    const uri = await track.fetchTrack();
    expect(mockDownload).toHaveBeenCalledTimes(1);
    expect(mockDownload.mock.calls[0]?.[0]).toBe(track.THEME_URL);
    expect(mockDownload.mock.calls[0]?.[1].uri).toMatch(/\.part$/);
    expect(mockMove).toHaveBeenCalledTimes(1);
    expect(uri).toMatch(/wawu-theme\.mp3$/);
    expect(track.savedTrack()).toBe(uri);
  });

  it('clears a half file left by an earlier try before it starts again', async () => {
    mockFiles.set('file:///documents/wawu-theme.part', { size: 10 });
    await track.fetchTrack();
    expect(mockFiles.has('file:///documents/wawu-theme.part')).toBe(false);
  });

  it('refuses an empty download', async () => {
    mockDownload.mockImplementation(async (_url: string, to: { uri: string }) => ({ uri: to.uri, exists: true, size: 0, move: jest.fn() }));
    await expect(track.fetchTrack()).rejects.toThrow();
    expect(track.savedTrack()).toBeNull();
  });

  it('passes on a failed download', async () => {
    mockDownload.mockRejectedValue(new Error('UnableToDownload 404'));
    await expect(track.fetchTrack()).rejects.toThrow('UnableToDownload');
    expect(track.savedTrack()).toBeNull();
  });
});
