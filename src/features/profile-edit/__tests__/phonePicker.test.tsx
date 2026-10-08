/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { crc32, deflateSync, inflateSync } from 'zlib';

/*
 * M8's camera buttons on the phone build (SHARED-04): the real `pickImage.ts` over `expo-image-picker`,
 * `expo-image-manipulator` and `expo-file-system`, all replaced here so no test reaches the phone. These
 * specs read the bytes that go up: a photo never carries where it was taken (lead ruling, 8 Oct 2026), a
 * transparent photo keeps its transparency (D2), a photo that cannot be read is said plainly (D1), and the
 * app's copies do not stay behind (F3).
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
const startsWith = (bytes: Uint8Array, head: number[]) => head.every((byte, i) => bytes[i] === byte);
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** The chunks of a PNG, as [type, data]. */
function mockChunksOf(png: Uint8Array): [string, Uint8Array][] {
  const chunks: [string, Uint8Array][] = [];
  let at = 8;
  while (at + 12 <= png.length) {
    const length = ((png[at] << 24) | (png[at + 1] << 16) | (png[at + 2] << 8) | png[at + 3]) >>> 0;
    chunks.push([String.fromCharCode(...png.slice(at + 4, at + 8)), png.slice(at + 8, at + 8 + length)]);
    at += 12 + length;
  }
  return chunks;
}

/**
 * What the encoder writes from a picture, as Android's `Bitmap.compress` does: the pixels and nothing else.
 * A JPEG: a JFIF header, then the source's image segments. A PNG: the signature and the critical chunks
 * (IHDR, PLTE, IDAT, IEND) only. A WebP, and a PNG or JPEG from another format: a small file of that format.
 * A file it cannot decode (0 bytes, or not a picture) throws, as the native encoder does.
 */
function mockReencode(source: Uint8Array | undefined, format: string): Uint8Array {
  const kinds = [[0xff, 0xd8], PNG_SIGNATURE, [0x52, 0x49, 0x46, 0x46], [0x47, 0x49, 0x46, 0x38], [0, 0, 0]];
  if (!source || source.length === 0 || !kinds.some((head) => startsWith(source, head))) throw new Error('Could not load the image');
  if (format === 'jpeg') {
    if (!startsWith(source, [0xff, 0xd8])) return Uint8Array.from([0xff, 0xd8, ...JFIF, 0xff, 0xda, 0x00, 0x02, 0x11, 0x22, 0xff, 0xd9]);
    let at = 2;
    while (source[at] === 0xff && source[at + 1] >= 0xe0 && source[at + 1] <= 0xef) at += 2 + ((source[at + 2] << 8) | source[at + 3]);
    return Uint8Array.from([0xff, 0xd8, ...JFIF, ...source.slice(at)]);
  }
  if (format === 'png') {
    if (!startsWith(source, PNG_SIGNATURE)) return Uint8Array.from([...PNG_SIGNATURE, 0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
    const keep: number[] = [];
    let at = 8;
    while (at + 12 <= source.length) {
      const length = ((source[at] << 24) | (source[at + 1] << 16) | (source[at + 2] << 8) | source[at + 3]) >>> 0;
      const type = String.fromCharCode(...source.slice(at + 4, at + 8));
      if (['IHDR', 'PLTE', 'IDAT', 'IEND'].includes(type)) keep.push(...source.slice(at, at + 12 + length));
      at += 12 + length;
    }
    return Uint8Array.from([...PNG_SIGNATURE, ...keep]);
  }
  return Uint8Array.from([0x52, 0x49, 0x46, 0x46, 12, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20, 0, 0, 0, 0]);
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
const mockEncoded: { source: string; resized: boolean; options: { format?: string; compress?: number }; uri: string }[] = [];
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
          const bytes = mockFiles[source];
          return {
            saveAsync: async (options: { format?: string; compress?: number }) => {
              const written = mockReencode(bytes, options.format ?? 'jpeg');
              const uri = `file:///cache/ImageManipulator/converted-${mockEncoded.length + 1}.${options.format === 'jpeg' ? 'jpg' : options.format}`;
              mockFiles[uri] = written;
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

const u16 = (n: number) => [(n >> 8) & 0xff, n & 0xff];
const u32 = (n: number) => [(n >>> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];

/**
 * A made-up JPEG as a phone camera writes it: an APP1 Exif block whose IFD0 points (tag 0x8825) to a GPS
 * block holding a latitude, then the image's own segments. Never a real photo or a real place.
 */
function photoWithPlace(): Uint8Array {
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

/** One PNG chunk with its real CRC. */
function chunk(type: string, data: number[] | Uint8Array): number[] {
  const typed = [...Buffer.from(type, 'latin1'), ...data];
  return [...u32(data.length), ...typed, ...u32(crc32(Buffer.from(typed)))];
}

/** The 2 x 2 RGBA pixels of the fixture logo: a purple, a fully transparent, a half-transparent white, a black. */
const LOGO_ROWS = [
  [0x94, 0x11, 0xc9, 0xff, 0x00, 0x00, 0x00, 0x00],
  [0xff, 0xff, 0xff, 0x80, 0x00, 0x00, 0x00, 0xff],
];

/**
 * A made-up 2 x 2 RGBA logo (colour type 6) as a phone might hold it: an eXIf chunk with a GPS pointer and a
 * tEXt chunk naming a place, besides its pixels. Never a real place.
 */
function logoWithPlace(): Uint8Array {
  const raw = LOGO_ROWS.flatMap((row) => [0, ...row]);
  const exifTiff = [0x4d, 0x4d, 0x00, 0x2a, ...u32(8), ...u16(1), ...u16(0x8825), ...u16(4), ...u32(1), ...u32(26), ...u32(0)];
  return Uint8Array.from([
    ...PNG_SIGNATURE,
    ...chunk('IHDR', [...u32(2), ...u32(2), 8, 6, 0, 0, 0]),
    ...chunk('eXIf', exifTiff),
    ...chunk('tEXt', [...Buffer.from('GPS\u0000Lat 6.45 N, Lon 3.39 E', 'latin1')]),
    ...chunk('IDAT', deflateSync(Buffer.from(raw))),
    ...chunk('IEND', []),
  ]);
}

/** The marker segments before a JPEG's image data, as `[marker, data]`. */
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
/** True when the text appears anywhere in the bytes. */
const mentions = (bytes: Uint8Array, text: string) => Buffer.from(bytes).includes(Buffer.from(text, 'latin1'));

type Sent = { method: string; url: string; body?: unknown; type?: string | null; bytes?: Uint8Array };
let sent: Sent[] = [];
let putStatus = 200;

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
    return new Response('', { status: putStatus });
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
const { PickFailed } = require('../readPicked') as typeof import('../readPicked');
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
const presignBody = () => sent.find((s) => s.url.endsWith('/uploads/presign'))?.body;
const settle = () => act(async () => new Promise((resolve) => setTimeout(resolve, 50)));
const PICK_FAILED = "We couldn't open that photo. Try another one.";

beforeEach(() => {
  sent = [];
  putStatus = 200;
  mockFiles = {};
  mockDeleted.length = 0;
  mockLibrary = null;
  mockEncoded.length = 0;
  Picker.launchImageLibraryAsync.mockClear();
  draft.clearDraft();
});

describe('M8 on the phone: the photo library (expo-image-picker)', () => {
  it('a user can tap the avatar’s camera button and choose a photo: it goes up written again as a JPEG at the size it was picked, then the copy is deleted and the preview is the uploaded picture', async () => {
    expect(canPickImage).toBe(true);
    mockFiles = { 'file:///picker/a.jpg': photoWithPlace() };
    mockLibrary = [{ uri: 'file:///picker/a.jpg', type: 'image', mimeType: 'image/jpeg', width: 1200, height: 1600 }];
    await boot();
    await fireEvent.press(screen.getByTestId('edit-avatar-pick'));
    const preview = await screen.findByTestId('edit-avatar-image');
    expect(Picker.launchImageLibraryAsync).toHaveBeenCalledWith({ mediaTypes: 'images' });
    expect(mockEncoded).toHaveLength(1);
    expect(mockEncoded[0]).toMatchObject({ source: 'file:///picker/a.jpg', resized: false, options: { format: 'jpeg', compress: 0.9 } });
    const body = put()?.bytes as Uint8Array;
    expect(presignBody()).toEqual({ folder: 'avatars', contentType: 'image/jpeg', extension: 'jpg', contentLength: body.length });
    expect(put()).toMatchObject({ url: 'https://files.example/put/avatars', type: 'image/jpeg' });
    expect(startsWith(body, [0xff, 0xd8, ...JFIF])).toBe(true);
    // F3: the app's copy is gone once it is up; the library's own file (outside the app's cache) is never touched.
    expect(mockDeleted).toEqual([mockEncoded[0].uri]);
    expect('file:///picker/a.jpg' in mockFiles).toBe(true);
    expect(JSON.stringify(preview.props)).toContain('https://files.example/read/avatars.jpg');
  });

  it('a photo taken with its place in it goes up without it: the upload has no Exif block, and no GPS', async () => {
    const picked = photoWithPlace();
    // The fixture really carries the place.
    expect(hasExif(picked)).toBe(true);
    expect(hasPlace(picked)).toBe(true);
    expect(mentions(picked, 'Exif')).toBe(true);
    mockFiles = { 'file:///picker/place.jpg': picked };
    mockLibrary = [{ uri: 'file:///picker/place.jpg', type: 'image', mimeType: 'image/jpeg', width: 4032, height: 3024 }];
    await boot();
    await fireEvent.press(screen.getByTestId('edit-cover-pick'));
    await waitFor(() => expect(put()).toBeTruthy());
    const body = put()?.bytes as Uint8Array;
    expect(startsWith(body, [0xff, 0xd8])).toBe(true);
    expect(hasExif(body)).toBe(false);
    expect(hasPlace(body)).toBe(false);
    expect(mentions(body, 'Exif')).toBe(false);
    expect(segmentsOf(body).some(([marker]) => marker === 0xe1)).toBe(false);
    // The picture itself is still there: the image's own segments follow the encoder's header.
    expect(segmentsOf(body).map(([marker]) => marker)).toEqual([0xe0, 0xdb, 0xc0]);
  });

  it('D2: a transparent PNG goes up as a PNG with its alpha intact and no metadata chunk (no eXIf, no tEXt with a place)', async () => {
    const logo = logoWithPlace();
    expect(mockChunksOf(logo).map(([type]) => type)).toEqual(['IHDR', 'eXIf', 'tEXt', 'IDAT', 'IEND']);
    mockFiles = { 'file:///picker/logo.png': logo };
    mockLibrary = [{ uri: 'file:///picker/logo.png', type: 'image', mimeType: 'image/png', width: 2, height: 2 }];
    await boot();
    await fireEvent.press(screen.getByTestId('edit-cover-pick'));
    await waitFor(() => expect(put()).toBeTruthy());
    expect(mockEncoded[0].options).toEqual({ format: 'png', compress: 1 });
    expect(presignBody()).toMatchObject({ folder: 'profile/cover', contentType: 'image/png', extension: 'png' });
    expect(put()?.type).toBe('image/png');
    const body = put()?.bytes as Uint8Array;
    expect(startsWith(body, PNG_SIGNATURE)).toBe(true);
    const chunks = mockChunksOf(body);
    expect(chunks.map(([type]) => type)).toEqual(['IHDR', 'IDAT', 'IEND']);
    expect(mentions(body, 'eXIf')).toBe(false);
    expect(mentions(body, 'tEXt')).toBe(false);
    expect(mentions(body, 'GPS')).toBe(false);
    // RGBA (colour type 6), and the same pixels: the transparent one still has alpha 0, the half-transparent one 0x80.
    expect(chunks[0][1][9]).toBe(6);
    const pixels = inflateSync(Buffer.from(chunks[1][1]));
    expect([...pixels]).toEqual(LOGO_ROWS.flatMap((row) => [0, ...row]));
    expect(pixels[8]).toBe(0x00);
    expect(pixels[13]).toBe(0x80);
  });

  it('D2: a WebP stays a WebP, a GIF becomes a PNG (its first frame), a HEIC becomes a JPEG', async () => {
    const cases: [string, string, Uint8Array, { format: string; compress: number }, string, string][] = [
      ['file:///picker/w.webp', 'image/webp', Uint8Array.from([0x52, 0x49, 0x46, 0x46, 1, 2]), { format: 'webp', compress: 0.9 }, 'image/webp', 'webp'],
      ['file:///picker/g.gif', 'image/gif', Uint8Array.from([0x47, 0x49, 0x46, 0x38, 1, 2]), { format: 'png', compress: 1 }, 'image/png', 'png'],
      ['file:///picker/p.heic', 'image/heic', Uint8Array.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70]), { format: 'jpeg', compress: 0.9 }, 'image/jpeg', 'jpg'],
      ['file:///picker/p.heif', 'image/heif', Uint8Array.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70]), { format: 'jpeg', compress: 0.9 }, 'image/jpeg', 'jpg'],
    ];
    for (const [uri, mimeType, bytes, options, contentType, extension] of cases) {
      mockFiles[uri] = bytes;
      mockLibrary = [{ uri, type: 'image', mimeType, width: 10, height: 10 }];
      const picked = await pickImage();
      expect(mockEncoded[mockEncoded.length - 1].options).toEqual(options);
      expect(picked).toMatchObject({ contentType, extension });
    }
  });

  it('D1: a user whose photo library fails is told plainly, and nothing is uploaded', async () => {
    mockLibrary = 'throw';
    await boot();
    await fireEvent.press(screen.getByTestId('edit-avatar-pick'));
    await settle();
    expect(screen.getByTestId('edit-banner')).toBeTruthy();
    expect(screen.getByText(PICK_FAILED)).toBeTruthy();
    expect(presignBody()).toBeUndefined();
  });

  it('D1: a photo that cannot be read (0 bytes, or corrupt) is said plainly on M8, nothing is uploaded, and no copy is left', async () => {
    for (const bytes of [new Uint8Array(0), Uint8Array.from([0x3c, 0x68, 0x74, 0x6d, 0x6c, 0x3e])]) {
      mockFiles = { 'file:///cache/ImagePicker/bad.jpg': bytes };
      mockLibrary = [{ uri: 'file:///cache/ImagePicker/bad.jpg', type: 'image', mimeType: 'image/jpeg', width: 0, height: 0 }];
      await expect(pickImage()).rejects.toBeInstanceOf(PickFailed);
    }
    mockFiles = { 'file:///picker/empty.jpg': new Uint8Array(0) };
    mockLibrary = [{ uri: 'file:///picker/empty.jpg', type: 'image', mimeType: 'image/jpeg', width: 0, height: 0 }];
    await boot();
    await fireEvent.press(screen.getByTestId('edit-cover-pick'));
    await settle();
    expect(screen.getByText(PICK_FAILED)).toBeTruthy();
    expect(presignBody()).toBeUndefined();
    expect(Object.keys(mockFiles).filter((uri) => uri.startsWith('file:///cache/ImageManipulator/'))).toEqual([]);
  });

  it('a user who closes the library sees nothing new: a cancel stays silent', async () => {
    mockLibrary = null;
    await expect(pickImage()).resolves.toBeNull();
    await boot();
    await fireEvent.press(screen.getByTestId('edit-avatar-pick'));
    await settle();
    expect(screen.queryByTestId('edit-banner')).toBeNull();
    expect(presignBody()).toBeUndefined();
    expect(mockEncoded).toHaveLength(0);
    expect(screen.getByTestId('edit-save')).toBeDisabled();
  });

  it('F3: the library’s own copy in the app’s cache (it holds the Exif) is deleted once written again, and the app’s copy after a failed upload too', async () => {
    putStatus = 403;
    mockFiles = { 'file:///cache/ImagePicker/x.jpg': photoWithPlace() };
    mockLibrary = [{ uri: 'file:///cache/ImagePicker/x.jpg', type: 'image', mimeType: 'image/jpeg', width: 1200, height: 1600 }];
    await boot();
    await fireEvent.press(screen.getByTestId('edit-avatar-pick'));
    expect(await screen.findByText('Your picture did not upload. Try again.')).toBeTruthy();
    expect(mockDeleted).toEqual(['file:///cache/ImagePicker/x.jpg', mockEncoded[0].uri]);
    expect(Object.keys(mockFiles)).toEqual([]);
  });
});
