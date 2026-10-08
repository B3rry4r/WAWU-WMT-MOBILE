/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * M8's camera buttons on the phone build (SHARED-04): the real `pickImage.ts` over `expo-image-picker`
 * and `expo-image-manipulator`, both replaced here so no test reaches the phone's photo library.
 * `pictures.test.tsx` covers the screen with the picker stood in; this file proves the phone's own,
 * down to the bytes that go up: a photo never carries where it was taken (lead ruling, 8 Oct 2026).
 */

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

/** The files on the phone, by uri. A uri not here cannot be read. */
let mockFiles: Record<string, Uint8Array> = {};

/**
 * What the encoder writes from a picture: a fresh JPEG of the pixels and nothing else, as Android's
 * `Bitmap.compress` does (a JFIF APP0 header, then the image). Modelled on the source's own image
 * segments; a source that is not a JPEG (a HEIC here) gives a small JPEG of its own.
 */
function mockReencode(source: Uint8Array): Uint8Array {
  const jfif = [0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00];
  if (source[0] !== 0xff || source[1] !== 0xd8) return Uint8Array.from([0xff, 0xd8, ...jfif, 0xff, 0xda, 0x00, 0x02, 0x11, 0x22, 0xff, 0xd9]);
  let at = 2;
  while (source[at] === 0xff && source[at + 1] >= 0xe0 && source[at + 1] <= 0xef) at += 2 + ((source[at + 2] << 8) | source[at + 3]);
  return Uint8Array.from([0xff, 0xd8, ...jfif, ...source.slice(at)]);
}

type Asset = { uri: string; type?: 'image' | 'video'; mimeType?: string; width: number; height: number };
/** What the phone's photo library answers to the next pick: the chosen assets, null when closed, or `throw`. */
let mockLibrary: Asset[] | null | 'throw' = null;
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(async () => {
    if (mockLibrary === 'throw') throw new Error('picker unavailable');
    return mockLibrary === null ? { canceled: true, assets: null } : { canceled: false, assets: mockLibrary };
  }),
}));
/** Each picture the manipulator wrote again: where it came from, what was asked of it, and where it put the result. */
const mockEncoded: { source: string; resized: boolean; options: unknown; uri: string }[] = [];
jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg', PNG: 'png', WEBP: 'webp' },
  ImageManipulator: {
    manipulate: (source: string) => {
      let resized = false;
      const context = {
        resize: () => {
          resized = true;
          return context;
        },
        renderAsync: async () => {
          if (!(source in mockFiles)) throw new Error('Could not load the image');
          return {
            saveAsync: async (options: unknown) => {
              const uri = `file:///cache/ImageManipulator/converted-${mockEncoded.length + 1}.jpg`;
              mockFiles[uri] = mockReencode(mockFiles[source]);
              mockEncoded.push({ source, resized, options, uri });
              return { uri, width: 1200, height: 1600 };
            },
            release: jest.fn(),
          };
        },
        release: jest.fn(),
      };
      return context;
    },
  },
}));

const Picker = jest.mocked(require('expo-image-picker') as typeof import('expo-image-picker'));

/**
 * A made-up JPEG as a phone camera writes it: an APP1 Exif block whose IFD0 points (tag 0x8825) to a GPS
 * block holding a latitude, then the image's own segments. Never a real photo or a real place.
 */
function photoWithPlace(): Uint8Array {
  const u16 = (n: number) => [(n >> 8) & 0xff, n & 0xff];
  const u32 = (n: number) => [(n >>> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
  const tiff = [
    0x4d, 0x4d, 0x00, 0x2a, ...u32(8),
    // IFD0: one entry, GPSInfo (0x8825, LONG) pointing at the GPS block at 26.
    ...u16(1), ...u16(0x8825), ...u16(4), ...u32(1), ...u32(26), ...u32(0),
    // The GPS block: GPSLatitudeRef "N" and GPSLatitude (three RATIONALs at 56).
    ...u16(2), ...u16(1), ...u16(2), ...u32(2), 0x4e, 0x00, 0x00, 0x00, ...u16(2), ...u16(5), ...u32(3), ...u32(56), ...u32(0),
    ...u32(6), ...u32(1), ...u32(27), ...u32(1), ...u32(0), ...u32(1),
  ];
  const exif = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00, ...tiff];
  const app1 = [0xff, 0xe1, ...u16(exif.length + 2), ...exif];
  const dqt = [0xff, 0xdb, ...u16(67), 0x00, ...Array.from({ length: 64 }, (_, i) => i + 1)];
  const sof = [0xff, 0xc0, ...u16(11), 0x08, ...u16(16), ...u16(16), 0x01, 0x01, 0x11, 0x00];
  const sos = [0xff, 0xda, ...u16(8), 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x12, 0x34, 0x56, 0x78];
  return Uint8Array.from([0xff, 0xd8, ...app1, ...dqt, ...sof, ...sos, 0xff, 0xd9]);
}

/** The marker segments before the image data, as `[marker, data]`. */
function segmentsOf(bytes: Uint8Array): [number, Uint8Array][] {
  const segments: [number, Uint8Array][] = [];
  let at = 2;
  while (bytes[at] === 0xff && bytes[at + 1] !== 0xda && at + 4 <= bytes.length) {
    const length = (bytes[at + 2] << 8) | bytes[at + 3];
    segments.push([bytes[at + 1], bytes.slice(at + 4, at + 2 + length)]);
    at += 2 + length;
  }
  return segments;
}

/** True when the JPEG has an APP1 Exif block. */
const hasExif = (bytes: Uint8Array) => segmentsOf(bytes).some(([marker, data]) => marker === 0xe1 && String.fromCharCode(...data.slice(0, 4)) === 'Exif');
/** True when an Exif block's IFD0 points to a GPS block (tag 0x8825, big-endian TIFF as written above). */
function hasPlace(bytes: Uint8Array): boolean {
  const exif = segmentsOf(bytes).find(([marker, data]) => marker === 0xe1 && String.fromCharCode(...data.slice(0, 4)) === 'Exif');
  if (!exif) return false;
  const tiff = exif[1].slice(6);
  const ifd = (tiff[4] << 24) | (tiff[5] << 16) | (tiff[6] << 8) | tiff[7];
  const count = (tiff[ifd] << 8) | tiff[ifd + 1];
  return Array.from({ length: count }, (_, i) => (tiff[ifd + 2 + i * 12] << 8) | tiff[ifd + 3 + i * 12]).includes(0x8825);
}
/** True when the ASCII "Exif" appears anywhere in the bytes. */
const mentionsExif = (bytes: Uint8Array) => Buffer.from(bytes).includes(Buffer.from('Exif'));

type Sent = { method: string; url: string; body?: unknown; type?: string | null; bytes?: Uint8Array };
let sent: Sent[] = [];

const ok = (data: unknown) => new Response(JSON.stringify({ statusCode: 200, message: 'OK', data }), { status: 200, headers: { 'content-type': 'application/json' } });
const profile = {
  wawuUserId: 'u1', firstName: 'Lennox', middleName: null, lastName: 'Emmanuel', handle: 'lennox', bio: null, avatarUrl: null, coverUrl: null,
  instagramHandle: null, tiktokHandle: null, xHandle: null, youtubeUrl: null, facebookUrl: null, linkedinUrl: null,
};
const details = { wawuUserId: 'u1', location: null, skills: [], openTo: [], threadsHandle: null, socialOrder: [], memberSince: null };

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (href.startsWith('file://')) {
    // The phone reading a file into a Blob.
    if (!(href in mockFiles)) throw new TypeError('Network request failed');
    return new Response(Uint8Array.from(mockFiles[href]));
  }
  const request = input instanceof Request ? input : new Request(href, init);
  const url = new URL(request.url);
  if (request.method === 'PUT') {
    const bytes = new Uint8Array(await request.arrayBuffer());
    sent.push({ method: 'PUT', url: request.url, type: request.headers.get('content-type'), bytes });
    return new Response('', { status: 200 });
  }
  const text = request.method === 'GET' ? '' : await request.text();
  sent.push({ method: request.method, url: request.url, body: text ? JSON.parse(text) : undefined });
  if (request.method === 'GET' && url.pathname.endsWith('/profile-fields')) return ok(details);
  if (request.method === 'GET') return ok(profile);
  if (url.pathname.endsWith('/uploads/presign')) {
    const folder = (JSON.parse(text) as { folder: string }).folder;
    return ok({ uploadUrl: `https://files.example/put/${folder}`, key: `k/${folder}`, fileUrl: `https://files.example/read/${folder}.jpg` });
  }
  return ok(profile);
}) as typeof fetch;

const { canPickImage, pickImage } = require('../pickImage') as typeof import('../pickImage');
const { EditProfileScreen } = require('../EditProfileScreen') as typeof import('../EditProfileScreen');
const draft = require('../draft') as typeof import('../draft');

async function boot() {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
  await render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>
        <EditProfileScreen onBack={jest.fn()} onOpenSocial={jest.fn()} onSaved={jest.fn()} ownNotice={false} />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
  await screen.findByTestId('edit-profile');
}

const put = () => sent.find((s) => s.method === 'PUT');

beforeEach(() => {
  sent = [];
  mockFiles = {};
  mockLibrary = null;
  mockEncoded.length = 0;
  Picker.launchImageLibraryAsync.mockClear();
  draft.clearDraft();
});

describe('M8 on the phone: the photo library (expo-image-picker)', () => {
  it('a user can tap the avatar’s camera button and choose a photo: it goes up written again as a JPEG, at the size it was picked', async () => {
    expect(canPickImage).toBe(true);
    mockFiles = { 'file:///picker/a.jpg': photoWithPlace() };
    mockLibrary = [{ uri: 'file:///picker/a.jpg', type: 'image', mimeType: 'image/jpeg', width: 1200, height: 1600 }];
    await boot();
    await fireEvent.press(screen.getByTestId('edit-avatar-pick'));
    await screen.findByTestId('edit-avatar-image');
    expect(Picker.launchImageLibraryAsync).toHaveBeenCalledWith({ mediaTypes: 'images' });
    expect(mockEncoded).toEqual([{ source: 'file:///picker/a.jpg', resized: false, options: { format: 'jpeg', compress: 0.9 }, uri: 'file:///cache/ImageManipulator/converted-1.jpg' }]);
    const written = mockFiles['file:///cache/ImageManipulator/converted-1.jpg'];
    expect(sent.find((s) => s.url.endsWith('/uploads/presign'))?.body).toEqual({ folder: 'avatars', contentType: 'image/jpeg', extension: 'jpg', contentLength: written.length });
    expect(put()).toMatchObject({ url: 'https://files.example/put/avatars', type: 'image/jpeg' });
    expect(put()?.bytes).toEqual(written);
  });

  it('a photo taken with its place in it goes up without it: the upload has no Exif block, and no GPS', async () => {
    const picked = photoWithPlace();
    // The fixture really carries the place.
    expect(hasExif(picked)).toBe(true);
    expect(hasPlace(picked)).toBe(true);
    expect(mentionsExif(picked)).toBe(true);
    mockFiles = { 'file:///picker/place.jpg': picked };
    mockLibrary = [{ uri: 'file:///picker/place.jpg', type: 'image', mimeType: 'image/jpeg', width: 4032, height: 3024 }];
    await boot();
    await fireEvent.press(screen.getByTestId('edit-cover-pick'));
    await waitFor(() => expect(put()).toBeTruthy());
    const body = put()?.bytes as Uint8Array;
    expect(body[0]).toBe(0xff);
    expect(body[1]).toBe(0xd8);
    expect(hasExif(body)).toBe(false);
    expect(hasPlace(body)).toBe(false);
    expect(mentionsExif(body)).toBe(false);
    expect(segmentsOf(body).some(([marker]) => marker === 0xe1)).toBe(false);
    // The picture itself is still there: the image's own segments follow the encoder's header.
    expect(segmentsOf(body).map(([marker]) => marker)).toEqual([0xe0, 0xdb, 0xc0]);
  });

  it('a PNG cover and an iPhone’s HEIC go up as JPEGs too', async () => {
    mockFiles = { 'file:///picker/c.png': Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]) };
    mockLibrary = [{ uri: 'file:///picker/c.png', type: 'image', mimeType: 'image/png', width: 1600, height: 900 }];
    await boot();
    await fireEvent.press(screen.getByTestId('edit-cover-pick'));
    await waitFor(() => expect(put()).toBeTruthy());
    expect(sent.find((s) => s.url.endsWith('/uploads/presign'))?.body).toMatchObject({ folder: 'profile/cover', contentType: 'image/jpeg', extension: 'jpg' });

    mockFiles['file:///picker/p.heic'] = Uint8Array.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70]);
    mockLibrary = [{ uri: 'file:///picker/p.heic', type: 'image', mimeType: 'image/heic', width: 3024, height: 4032 }];
    const picked = await pickImage();
    expect(mockEncoded.map((e) => e.source)).toEqual(['file:///picker/c.png', 'file:///picker/p.heic']);
    expect(picked).toMatchObject({ contentType: 'image/jpeg', extension: 'jpg', previewUri: 'file:///cache/ImageManipulator/converted-2.jpg' });
  });

  it('closing the library, a library that fails, or a file that cannot be read picks nothing, and nothing is uploaded', async () => {
    mockLibrary = null;
    await expect(pickImage()).resolves.toBeNull();
    mockLibrary = 'throw';
    await expect(pickImage()).resolves.toBeNull();
    mockLibrary = [{ uri: 'file:///picker/gone.jpg', type: 'image', mimeType: 'image/jpeg', width: 10, height: 10 }];
    mockFiles = {};
    await expect(pickImage()).resolves.toBeNull();
    expect(mockEncoded).toHaveLength(0);

    mockLibrary = null;
    await boot();
    await fireEvent.press(screen.getByTestId('edit-avatar-pick'));
    expect(sent.some((s) => s.url.endsWith('/uploads/presign'))).toBe(false);
    expect(screen.getByTestId('edit-save')).toBeDisabled();
  });
});
