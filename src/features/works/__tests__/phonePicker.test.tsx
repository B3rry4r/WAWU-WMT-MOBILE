/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * M36's "Add photos or a video" on the phone build (SHARED-04): the real `pickMedia.ts` over
 * `expo-image-picker`, `expo-image-manipulator` and `expo-file-system`, all replaced here so no test reaches
 * the phone. These specs read the bytes that go up: a photo never carries where it was taken (lead ruling,
 * 8 Oct 2026) and keeps its format when that is PNG or WebP (D2); a video goes as it was chosen; files that
 * cannot be read are counted for the person (D1); the app's copies do not stay behind (F3).
 */

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

/** The files on the phone, by uri. A uri not here cannot be read. */
let mockFiles: Record<string, Uint8Array> = {};
/** Every file deleted, in order. */
const mockDeleted: string[] = [];

jest.mock('expo-file-system', () => {
  class File {
    uri: string;
    constructor(uri: string) {
      this.uri = uri;
    }
    get exists() {
      return this.uri in mockFiles;
    }
    delete() {
      delete mockFiles[this.uri];
      mockDeleted.push(this.uri);
    }
  }
  class Directory {
    uri = 'file:///cache/ImageManipulator/';
    exists = true;
    list() {
      return Object.keys(mockFiles).filter((uri) => uri.startsWith(this.uri)).map((uri) => new File(uri));
    }
  }
  return { File, Directory, Paths: { cache: { uri: 'file:///cache/' } } };
});

const JFIF = [0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00];

/**
 * What the encoder writes from a picture: the pixels and nothing else (for a JPEG, a JFIF header and the
 * source's image segments; for another format, a small file of it). A file it cannot decode (0 bytes, or not a
 * picture) throws, as the native encoder does.
 */
function mockReencode(source: Uint8Array | undefined, format: string): Uint8Array {
  const pictures = [[0xff, 0xd8], [0x89, 0x50, 0x4e, 0x47], [0x52, 0x49, 0x46, 0x46], [0x47, 0x49, 0x46, 0x38], [0, 0, 0]];
  if (!source || source.length === 0 || !pictures.some((head) => head.every((byte, i) => source[i] === byte))) throw new Error('Could not load the image');
  if (format === 'png') return Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
  if (format === 'webp') return Uint8Array.from([0x52, 0x49, 0x46, 0x46, 12, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20, 0, 0, 0, 0]);
  if (source[0] !== 0xff || source[1] !== 0xd8) return Uint8Array.from([0xff, 0xd8, ...JFIF, 0xff, 0xda, 0x00, 0x02, 0x11, 0x22, 0xff, 0xd9]);
  let at = 2;
  while (source[at] === 0xff && source[at + 1] >= 0xe0 && source[at + 1] <= 0xef) at += 2 + ((source[at + 2] << 8) | source[at + 3]);
  return Uint8Array.from([0xff, 0xd8, ...JFIF, ...source.slice(at)]);
}

type Asset = { uri: string; type?: 'image' | 'video'; mimeType?: string; width: number; height: number };
/** What the phone's photo library answers to the next pick: the chosen assets in order, null when closed, or `throw`. */
let mockLibrary: Asset[] | null | 'throw' = null;
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(async () => {
    if (mockLibrary === 'throw') throw new Error('picker unavailable');
    return mockLibrary === null ? { canceled: true, assets: null } : { canceled: false, assets: mockLibrary };
  }),
}));
/** Each picture the manipulator wrote again: where it came from, the format asked for, and where it put the result. */
const mockEncoded: { source: string; format?: string; uri: string }[] = [];
jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg', PNG: 'png', WEBP: 'webp' },
  ImageManipulator: {
    manipulate: (source: string) => ({
      renderAsync: async () => {
        const bytes = mockFiles[source];
        return {
          saveAsync: async (options: { format?: string }) => {
            const written = mockReencode(bytes, options.format ?? 'jpeg');
            const uri = `file:///cache/ImageManipulator/converted-${mockEncoded.length + 1}.${options.format === 'jpeg' ? 'jpg' : options.format}`;
            mockFiles[uri] = written;
            mockEncoded.push({ source, format: options.format, uri });
            return { uri, width: 800, height: 800 };
          },
          release: jest.fn(),
        };
      },
      release: jest.fn(),
    }),
  },
}));

const Picker = jest.mocked(require('expo-image-picker') as typeof import('expo-image-picker'));

const u16 = (n: number) => [(n >> 8) & 0xff, n & 0xff];
const u32 = (n: number) => [(n >>> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];

/** A made-up camera JPEG: an APP1 Exif block whose IFD0 points (0x8825) to a GPS block, then the image. Never a real place. */
function photoWithPlace(): Uint8Array {
  const tiff = [
    0x4d, 0x4d, 0x00, 0x2a, ...u32(8),
    ...u16(1), ...u16(0x8825), ...u16(4), ...u32(1), ...u32(26), ...u32(0),
    ...u16(2), ...u16(1), ...u16(2), ...u32(2), 0x4e, 0x00, 0x00, 0x00, ...u16(2), ...u16(5), ...u32(3), ...u32(56), ...u32(0),
    ...u32(6), ...u32(1), ...u32(27), ...u32(1), ...u32(0), ...u32(1),
  ];
  const exif = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00, ...tiff];
  const dqt = [0xff, 0xdb, ...u16(67), 0x00, ...Array.from({ length: 64 }, (_, i) => i + 1)];
  const sof = [0xff, 0xc0, ...u16(11), 0x08, ...u16(16), ...u16(16), 0x01, 0x01, 0x11, 0x00];
  const sos = [0xff, 0xda, ...u16(8), 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x12, 0x34, 0x56, 0x78];
  return Uint8Array.from([0xff, 0xd8, 0xff, 0xe1, ...u16(exif.length + 2), ...exif, ...dqt, ...sof, ...sos, 0xff, 0xd9]);
}

/** The marker segments before the image data. */
function markersOf(bytes: Uint8Array): number[] {
  const markers: number[] = [];
  let at = 2;
  while (bytes[at] === 0xff && bytes[at + 1] !== 0xda && at + 4 <= bytes.length) {
    markers.push(bytes[at + 1]);
    at += 2 + ((bytes[at + 2] << 8) | bytes[at + 3]);
  }
  return markers;
}
const mentions = (bytes: Uint8Array, text: string) => Buffer.from(bytes).includes(Buffer.from(text));

type Sent = { method: string; path: string; body?: unknown; type?: string | null; bytes?: Uint8Array };
let sent: Sent[] = [];
let presigns = 0;

const ok = (data: unknown, status = 200) => new Response(JSON.stringify({ statusCode: status, message: 'OK', data }), { status, headers: { 'content-type': 'application/json' } });
const mine = { owner: { wawuId: 'u1', displayName: 'Lennox Emmanuel', handle: 'lennox', avatarUrl: null }, count: 0, categories: [], works: [] };

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (href.startsWith('file://')) {
    if (!(href in mockFiles)) throw new TypeError('Network request failed');
    return new Response(Uint8Array.from(mockFiles[href]));
  }
  const request = input instanceof Request ? input : new Request(href, init);
  const url = new URL(request.url);
  if (request.method === 'PUT') {
    sent.push({ method: 'PUT', path: url.pathname, type: request.headers.get('content-type'), bytes: new Uint8Array(await request.arrayBuffer()) });
    return new Response('', { status: 200 });
  }
  const text = request.method === 'GET' ? '' : await request.text();
  sent.push({ method: request.method, path: url.pathname, body: text ? JSON.parse(text) : undefined });
  if (request.method === 'GET' && url.pathname === '/api/hub/users/me/featured-works') return ok(mine);
  if (url.pathname === '/api/hub/uploads/presign') {
    presigns += 1;
    return ok({ uploadUrl: `https://storage.test/put/${presigns}`, key: `profile/work/u1/${presigns}`, fileUrl: `https://storage.test/profile/work/u1/${presigns}` });
  }
  return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
}) as typeof fetch;

const { canPickMedia, pickMedia } = require('../pickMedia') as typeof import('../pickMedia');
const { AddWorkScreen } = require('../AddWorkScreen') as typeof import('../AddWorkScreen');

async function boot() {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false }, mutations: { retry: false } } });
  await render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>
        <AddWorkScreen onBack={jest.fn()} onSaved={jest.fn()} onOpenWorks={jest.fn()} />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

const presignBodies = () => sent.filter((s) => s.path === '/api/hub/uploads/presign').map((s) => s.body);
const puts = () => sent.filter((s) => s.method === 'PUT');
const settle = () => act(async () => new Promise((resolve) => setTimeout(resolve, 50)));
const photo = (n: number): Asset => ({ uri: `file:///picker/${n}.jpg`, type: 'image', mimeType: 'image/jpeg', width: 10, height: 10 });

beforeEach(() => {
  sent = [];
  mockFiles = {};
  mockDeleted.length = 0;
  presigns = 0;
  mockLibrary = null;
  mockEncoded.length = 0;
  Picker.launchImageLibraryAsync.mockClear();
});

describe('M36 on the phone: the photo library (expo-image-picker)', () => {
  it('a user sees "Add photos or a video", taps it, chooses a photo taken with its place and a video: both go up in order, the photo without its Exif block, the video as chosen, and no copy is left', async () => {
    expect(canPickMedia).toBe(true);
    const picked = photoWithPlace();
    const video = Uint8Array.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32, 9, 8, 7]);
    mockFiles = { 'file:///picker/1.jpg': picked, 'file:///cache/ImagePicker/2.mp4': video };
    expect(mentions(picked, 'Exif')).toBe(true);
    expect(markersOf(picked)).toContain(0xe1);
    mockLibrary = [
      { uri: 'file:///picker/1.jpg', type: 'image', mimeType: 'image/jpeg', width: 1200, height: 1600 },
      { uri: 'file:///cache/ImagePicker/2.mp4', type: 'video', mimeType: 'video/mp4', width: 1080, height: 1920 },
    ];
    await boot();
    expect(screen.getByText('Add photos or a video')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('work-add-media'));
    await waitFor(() => expect(puts()).toHaveLength(2));
    expect(Picker.launchImageLibraryAsync).toHaveBeenCalledWith({ mediaTypes: ['images', 'videos'], allowsMultipleSelection: true, selectionLimit: 8, orderedSelection: true });
    expect(mockEncoded.map((e) => [e.source, e.format])).toEqual([['file:///picker/1.jpg', 'jpeg']]);
    const [photoUp, videoUp] = puts();
    expect(presignBodies()).toEqual([
      { folder: 'profile/work', contentType: 'image/jpeg', extension: 'jpg', contentLength: (photoUp.bytes as Uint8Array).length },
      { folder: 'profile/work', contentType: 'video/mp4', extension: 'mp4', contentLength: video.length },
    ]);
    expect(photoUp.type).toBe('image/jpeg');
    expect(markersOf(photoUp.bytes as Uint8Array)).toEqual([0xe0, 0xdb, 0xc0]);
    expect(mentions(photoUp.bytes as Uint8Array, 'Exif')).toBe(false);
    expect(videoUp.type).toBe('video/mp4');
    expect(videoUp.bytes).toEqual(video);
    // F3: once each upload settles, the app's copy of the photo and the library's copy of the video (in the app's cache) are gone.
    await waitFor(() => expect(mockDeleted).toEqual(expect.arrayContaining([mockEncoded[0].uri, 'file:///cache/ImagePicker/2.mp4'])));
    expect('file:///picker/1.jpg' in mockFiles).toBe(true);
    expect(screen.queryByTestId('work-media-notice')).toBeNull();
  });

  it('D2: a WebP stays a WebP, a PNG a PNG, a GIF becomes a PNG, a HEIC a JPEG', async () => {
    mockFiles = {
      'file:///picker/1.heic': Uint8Array.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70]),
      'file:///picker/2.png': Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 1, 2]),
      'file:///picker/3.webp': Uint8Array.from([0x52, 0x49, 0x46, 0x46, 1, 2]),
      'file:///picker/4.gif': Uint8Array.from([0x47, 0x49, 0x46, 0x38, 1, 2]),
    };
    mockLibrary = [
      { uri: 'file:///picker/1.heic', type: 'image', mimeType: 'image/heic', width: 3024, height: 4032 },
      { uri: 'file:///picker/2.png', type: 'image', mimeType: 'image/png', width: 64, height: 64 },
      { uri: 'file:///picker/3.webp', type: 'image', mimeType: 'image/webp', width: 800, height: 800 },
      { uri: 'file:///picker/4.gif', type: 'image', mimeType: 'image/gif', width: 200, height: 200 },
    ];
    const picked = await pickMedia();
    expect(mockEncoded.map((e) => e.format)).toEqual(['jpeg', 'png', 'webp', 'png']);
    expect(picked.map((file) => [file.contentType, file.extension])).toEqual([
      ['image/jpeg', 'jpg'],
      ['image/png', 'png'],
      ['image/webp', 'webp'],
      ['image/png', 'png'],
    ]);
  });

  it('D1: three chosen, the middle one corrupt: the two that can be read go up, and the box says one could not be added', async () => {
    mockFiles = { 'file:///picker/1.jpg': photoWithPlace(), 'file:///picker/2.jpg': new Uint8Array(0), 'file:///picker/3.jpg': photoWithPlace() };
    mockLibrary = [photo(1), photo(2), photo(3)];
    await boot();
    await fireEvent.press(screen.getByTestId('work-add-media'));
    await waitFor(() => expect(puts()).toHaveLength(2));
    expect(screen.getByTestId('work-media-notice')).toBeTruthy();
    expect(screen.getByText("1 photo couldn't be added. Try it again or choose another.")).toBeTruthy();
    expect(screen.getByTestId('work-media-1')).toBeTruthy();
    expect(screen.queryByTestId('work-media-2')).toBeNull();
  });

  it('D1: the count names what could not be read, and pickMedia reports each kind', async () => {
    const { mediaUnreadable } = require('../form') as typeof import('../form');
    expect(mediaUnreadable(['image', 'image'])).toBe("2 photos couldn't be added. Try them again or choose others.");
    expect(mediaUnreadable(['video'])).toBe("1 video couldn't be added. Try it again or choose another.");
    expect(mediaUnreadable(['image', 'video'])).toBe("2 files couldn't be added. Try them again or choose others.");
    mockFiles = { 'file:///picker/1.jpg': photoWithPlace() };
    mockLibrary = [photo(1), photo(2), { uri: 'file:///picker/v.mp4', type: 'video', mimeType: 'video/mp4', width: 1, height: 1 }];
    const heard: string[][] = [];
    const picked = await pickMedia((kinds) => heard.push(kinds));
    expect(picked).toHaveLength(1);
    expect(heard).toEqual([['image', 'video']]);
  });

  it('D1: a 0-byte video is not added: it is counted, and nothing is sent', async () => {
    mockFiles = { 'file:///picker/empty.mp4': new Uint8Array(0) };
    mockLibrary = [{ uri: 'file:///picker/empty.mp4', type: 'video', mimeType: 'video/mp4', width: 1, height: 1 }];
    await boot();
    await fireEvent.press(screen.getByTestId('work-add-media'));
    expect(await screen.findByText("1 video couldn't be added. Try it again or choose another.")).toBeTruthy();
    expect(presignBodies()).toHaveLength(0);
    expect(screen.queryByTestId('work-media-previews')).toBeNull();
  });

  it('D1: a photo library that fails is said plainly in the box; a cancel stays silent', async () => {
    mockLibrary = 'throw';
    await expect(pickMedia()).rejects.toThrow('picker unavailable');
    await boot();
    await fireEvent.press(screen.getByTestId('work-add-media'));
    await settle();
    expect(screen.getByText("We couldn't open your photo library. Try again.")).toBeTruthy();
    expect(presignBodies()).toHaveLength(0);

    mockLibrary = null;
    await expect(pickMedia()).resolves.toEqual([]);
  });

  it('a cancel adds nothing and says nothing', async () => {
    mockLibrary = null;
    await boot();
    await fireEvent.press(screen.getByTestId('work-add-media'));
    await settle();
    expect(presignBodies()).toHaveLength(0);
    expect(screen.queryByTestId('work-media-previews')).toBeNull();
    expect(screen.queryByTestId('work-media-notice')).toBeNull();
  });

  it('F3: a file chosen beyond what a work can carry is never sent, and its copy is deleted at once', async () => {
    for (let n = 1; n <= 9; n += 1) mockFiles[`file:///picker/${n}.jpg`] = photoWithPlace();
    mockLibrary = Array.from({ length: 9 }, (_, i) => photo(i + 1));
    await boot();
    await fireEvent.press(screen.getByTestId('work-add-media'));
    await waitFor(() => expect(puts()).toHaveLength(8));
    expect(screen.getByText('A work can carry up to 8 photos or videos. 1 was not added.')).toBeTruthy();
    await waitFor(() => expect(Object.keys(mockFiles).filter((uri) => uri.startsWith('file:///cache/ImageManipulator/'))).toEqual([]));
    expect(mockDeleted).toContain(mockEncoded[8].uri);
  });
});
