/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * M36's "Add photos or a video" on the phone build (SHARED-04): the real `pickMedia.ts` over
 * `expo-image-picker` and `expo-image-manipulator`, both replaced here so no test reaches the phone's
 * photo library. `AddWorkScreen.test.tsx` covers the screen with the picker stood in; this file proves
 * the phone's own, down to the bytes that go up: a photo never carries where it was taken (lead ruling,
 * 8 Oct 2026); a video goes as it was chosen.
 */

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

/** The files on the phone, by uri. A uri not here cannot be read. */
let mockFiles: Record<string, Uint8Array> = {};

/** What the encoder writes from a picture: a fresh JPEG of the pixels and nothing else (a JFIF APP0 header, then the image). */
function mockReencode(source: Uint8Array): Uint8Array {
  const jfif = [0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00];
  if (source[0] !== 0xff || source[1] !== 0xd8) return Uint8Array.from([0xff, 0xd8, ...jfif, 0xff, 0xda, 0x00, 0x02, 0x11, 0x22, 0xff, 0xd9]);
  let at = 2;
  while (source[at] === 0xff && source[at + 1] >= 0xe0 && source[at + 1] <= 0xef) at += 2 + ((source[at + 2] << 8) | source[at + 3]);
  return Uint8Array.from([0xff, 0xd8, ...jfif, ...source.slice(at)]);
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
/** Each picture the manipulator wrote again, by the uri it came from. */
const mockEncoded: string[] = [];
jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg', PNG: 'png', WEBP: 'webp' },
  ImageManipulator: {
    manipulate: (source: string) => ({
      renderAsync: async () => {
        if (!(source in mockFiles)) throw new Error('Could not load the image');
        return {
          saveAsync: async () => {
            const uri = `file:///cache/ImageManipulator/converted-${mockEncoded.length + 1}.jpg`;
            mockFiles[uri] = mockReencode(mockFiles[source]);
            mockEncoded.push(source);
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

/** A made-up camera JPEG: an APP1 Exif block whose IFD0 points (0x8825) to a GPS block, then the image. Never a real place. */
function photoWithPlace(): Uint8Array {
  const u16 = (n: number) => [(n >> 8) & 0xff, n & 0xff];
  const u32 = (n: number) => [(n >>> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
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

beforeEach(() => {
  sent = [];
  mockFiles = {};
  presigns = 0;
  mockLibrary = null;
  mockEncoded.length = 0;
  Picker.launchImageLibraryAsync.mockClear();
});

describe('M36 on the phone: the photo library (expo-image-picker)', () => {
  it('a user sees "Add photos or a video", taps it, chooses a photo taken with its place and a video: both go up in the order chosen, the photo without its Exif block, the video as chosen', async () => {
    expect(canPickMedia).toBe(true);
    const photo = photoWithPlace();
    const video = Uint8Array.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32, 9, 8, 7]);
    mockFiles = { 'file:///picker/1.jpg': photo, 'file:///picker/2.mp4': video };
    expect(mentions(photo, 'Exif')).toBe(true);
    expect(markersOf(photo)).toContain(0xe1);
    mockLibrary = [
      { uri: 'file:///picker/1.jpg', type: 'image', mimeType: 'image/jpeg', width: 1200, height: 1600 },
      { uri: 'file:///picker/2.mp4', type: 'video', mimeType: 'video/mp4', width: 1080, height: 1920 },
    ];
    await boot();
    expect(screen.getByText('Add photos or a video')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('work-add-media'));
    await waitFor(() => expect(puts()).toHaveLength(2));
    expect(Picker.launchImageLibraryAsync).toHaveBeenCalledWith({ mediaTypes: ['images', 'videos'], allowsMultipleSelection: true, selectionLimit: 8, orderedSelection: true });
    expect(mockEncoded).toEqual(['file:///picker/1.jpg']);
    const written = mockFiles['file:///cache/ImageManipulator/converted-1.jpg'];
    expect(presignBodies()).toEqual([
      { folder: 'profile/work', contentType: 'image/jpeg', extension: 'jpg', contentLength: written.length },
      { folder: 'profile/work', contentType: 'video/mp4', extension: 'mp4', contentLength: video.length },
    ]);
    const [photoUp, videoUp] = puts();
    expect(photoUp.type).toBe('image/jpeg');
    expect(photoUp.bytes).toEqual(written);
    expect(markersOf(photoUp.bytes as Uint8Array)).toEqual([0xe0, 0xdb, 0xc0]);
    expect(mentions(photoUp.bytes as Uint8Array, 'Exif')).toBe(false);
    expect(videoUp.type).toBe('video/mp4');
    expect(videoUp.bytes).toEqual(video);
  });

  it('a WebP, an iPhone’s HEIC and a GIF go up as JPEGs; a file that cannot be read is left out', async () => {
    mockFiles = {
      'file:///picker/1.heic': Uint8Array.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70]),
      'file:///picker/3.webp': Uint8Array.from([0x52, 0x49, 0x46, 0x46, 1, 2]),
      'file:///picker/4.gif': Uint8Array.from([0x47, 0x49, 0x46, 0x38, 1, 2]),
    };
    mockLibrary = [
      { uri: 'file:///picker/1.heic', type: 'image', mimeType: 'image/heic', width: 3024, height: 4032 },
      { uri: 'file:///picker/gone.jpg', type: 'image', mimeType: 'image/jpeg', width: 10, height: 10 },
      { uri: 'file:///picker/3.webp', type: 'image', mimeType: 'image/webp', width: 800, height: 800 },
      { uri: 'file:///picker/4.gif', type: 'image', mimeType: 'image/gif', width: 200, height: 200 },
    ];
    const picked = await pickMedia();
    expect(mockEncoded).toEqual(['file:///picker/1.heic', 'file:///picker/3.webp', 'file:///picker/4.gif']);
    expect(picked.map((file) => [file.contentType, file.extension])).toEqual([
      ['image/jpeg', 'jpg'],
      ['image/jpeg', 'jpg'],
      ['image/jpeg', 'jpg'],
    ]);
  });

  it('closing the library or a library that fails adds nothing', async () => {
    mockLibrary = null;
    await expect(pickMedia()).resolves.toEqual([]);
    mockLibrary = 'throw';
    await expect(pickMedia()).resolves.toEqual([]);
    await boot();
    await fireEvent.press(screen.getByTestId('work-add-media'));
    expect(presignBodies()).toHaveLength(0);
    expect(screen.queryByTestId('work-media-previews')).toBeNull();
  });
});
