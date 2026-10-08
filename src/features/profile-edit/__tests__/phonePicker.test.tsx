/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * M8's camera buttons on the phone build (SHARED-04): the real `pickImage.ts` over `expo-image-picker`
 * and `expo-image-manipulator`, both replaced here so no test reaches the phone's photo library.
 * `pictures.test.tsx` covers the screen with the picker stood in; this file proves the phone's own.
 */

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

type Asset = { uri: string; type?: 'image' | 'video'; mimeType?: string; width: number; height: number };
/** What the phone's photo library answers to the next pick: the chosen assets, null when closed, or `throw`. */
let mockLibrary: Asset[] | null | 'throw' = null;
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(async () => {
    if (mockLibrary === 'throw') throw new Error('picker unavailable');
    return mockLibrary === null ? { canceled: true, assets: null } : { canceled: false, assets: mockLibrary };
  }),
}));
/** Each picture the manipulator re-encoded: where it came from and how it was saved. */
const mockEncoded: { source: string; options: unknown }[] = [];
jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg', PNG: 'png', WEBP: 'webp' },
  ImageManipulator: {
    manipulate: (source: string) => ({
      renderAsync: async () => ({
        saveAsync: async (options: unknown) => {
          mockEncoded.push({ source, options });
          return { uri: `file:///cache/ImageManipulator/converted-${mockEncoded.length}.jpg`, width: 1200, height: 1600 };
        },
        release: jest.fn(),
      }),
      release: jest.fn(),
    }),
  },
}));

const Picker = jest.mocked(require('expo-image-picker') as typeof import('expo-image-picker'));

type Sent = { method: string; url: string; body?: unknown; type?: string | null; size?: number };
let sent: Sent[] = [];
/** The files on the phone the test put there, by uri: their sizes in bytes. A uri not here cannot be read. */
let files: Record<string, number> = {};

const ok = (data: unknown) => new Response(JSON.stringify({ statusCode: 200, message: 'OK', data }), { status: 200, headers: { 'content-type': 'application/json' } });
const profile = {
  wawuUserId: 'u1', firstName: 'Lennox', middleName: null, lastName: 'Emmanuel', handle: 'lennox', bio: null, avatarUrl: null, coverUrl: null,
  instagramHandle: null, tiktokHandle: null, xHandle: null, youtubeUrl: null, facebookUrl: null, linkedinUrl: null,
};
const details = { wawuUserId: 'u1', location: null, skills: [], openTo: [], threadsHandle: null, socialOrder: [], memberSince: null };

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (href.startsWith('file://')) {
    // The phone reading a picked file into a Blob.
    if (!(href in files)) throw new TypeError('Network request failed');
    return new Response(new Uint8Array(files[href]));
  }
  const request = input instanceof Request ? input : new Request(href, init);
  const url = new URL(request.url);
  if (request.method === 'PUT') {
    const size = (await request.arrayBuffer()).byteLength;
    sent.push({ method: 'PUT', url: request.url, type: request.headers.get('content-type'), size });
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

beforeEach(() => {
  sent = [];
  files = {};
  mockLibrary = null;
  mockEncoded.length = 0;
  Picker.launchImageLibraryAsync.mockClear();
  draft.clearDraft();
});

describe('M8 on the phone: the photo library (expo-image-picker)', () => {
  it('a user can tap the avatar’s camera button, choose a photo, and it goes up as it was chosen', async () => {
    expect(canPickImage).toBe(true);
    files = { 'file:///picker/a.jpg': 2048 };
    mockLibrary = [{ uri: 'file:///picker/a.jpg', type: 'image', mimeType: 'image/jpeg', width: 1200, height: 1600 }];
    await boot();
    await fireEvent.press(screen.getByTestId('edit-avatar-pick'));
    await screen.findByTestId('edit-avatar-image');
    expect(Picker.launchImageLibraryAsync).toHaveBeenCalledWith({ mediaTypes: 'images' });
    expect(sent.find((s) => s.url.endsWith('/uploads/presign'))?.body).toEqual({ folder: 'avatars', contentType: 'image/jpeg', extension: 'jpg', contentLength: 2048 });
    expect(sent.find((s) => s.method === 'PUT')).toMatchObject({ url: 'https://files.example/put/avatars', type: 'image/jpeg', size: 2048 });
    expect(mockEncoded).toHaveLength(0);
  });

  it('a user can tap the cover’s camera button; a PNG goes up as a PNG', async () => {
    files = { 'file:///picker/c.png': 900 };
    mockLibrary = [{ uri: 'file:///picker/c.png', type: 'image', mimeType: 'image/png', width: 1600, height: 900 }];
    await boot();
    await fireEvent.press(screen.getByTestId('edit-cover-pick'));
    await waitFor(() => expect(sent.some((s) => s.method === 'PUT')).toBe(true));
    expect(sent.find((s) => s.url.endsWith('/uploads/presign'))?.body).toEqual({ folder: 'profile/cover', contentType: 'image/png', extension: 'png', contentLength: 900 });
  });

  it('a photo in a format the Hub does not take (an iPhone’s HEIC) goes up as a JPEG', async () => {
    files = { 'file:///cache/ImageManipulator/converted-1.jpg': 1500 };
    const heic = { uri: 'file:///picker/p.heic', type: 'image' as const, mimeType: 'image/heic', width: 3024, height: 4032 };
    mockLibrary = [heic];
    const picked = await pickImage();
    expect(mockEncoded).toEqual([{ source: heic.uri, options: { format: 'jpeg', compress: 0.9 } }]);
    expect(picked).toMatchObject({ contentType: 'image/jpeg', extension: 'jpg', previewUri: 'file:///cache/ImageManipulator/converted-1.jpg' });
    expect(picked?.blob.size).toBe(1500);
  });

  it('closing the library, a library that fails, or a file that cannot be read picks nothing, and nothing is uploaded', async () => {
    mockLibrary = null;
    await expect(pickImage()).resolves.toBeNull();
    mockLibrary = 'throw';
    await expect(pickImage()).resolves.toBeNull();
    mockLibrary = [{ uri: 'file:///picker/gone.jpg', type: 'image', mimeType: 'image/jpeg', width: 10, height: 10 }];
    await expect(pickImage()).resolves.toBeNull();

    mockLibrary = null;
    await boot();
    await fireEvent.press(screen.getByTestId('edit-avatar-pick'));
    expect(sent.some((s) => s.url.endsWith('/uploads/presign'))).toBe(false);
    expect(screen.getByTestId('edit-save')).toBeDisabled();
  });
});
