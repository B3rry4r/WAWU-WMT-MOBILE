/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * M36's "Add photos or a video" on the phone build (SHARED-04): the real `pickMedia.ts` over
 * `expo-image-picker` and `expo-image-manipulator`, both replaced here so no test reaches the phone's
 * photo library. `AddWorkScreen.test.tsx` covers the screen with the picker stood in; this file proves
 * the phone's own.
 */

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

type Asset = { uri: string; type?: 'image' | 'video'; mimeType?: string; width: number; height: number };
/** What the phone's photo library answers to the next pick: the chosen assets in order, null when closed, or `throw`. */
let mockLibrary: Asset[] | null | 'throw' = null;
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(async () => {
    if (mockLibrary === 'throw') throw new Error('picker unavailable');
    return mockLibrary === null ? { canceled: true, assets: null } : { canceled: false, assets: mockLibrary };
  }),
}));
const mockEncoded: string[] = [];
jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg', PNG: 'png', WEBP: 'webp' },
  ImageManipulator: {
    manipulate: (source: string) => ({
      renderAsync: async () => ({
        saveAsync: async () => {
          mockEncoded.push(source);
          return { uri: `file:///cache/ImageManipulator/converted-${mockEncoded.length}.jpg`, width: 800, height: 800 };
        },
        release: jest.fn(),
      }),
      release: jest.fn(),
    }),
  },
}));

const Picker = jest.mocked(require('expo-image-picker') as typeof import('expo-image-picker'));

type Sent = { method: string; path: string; body?: unknown; type?: string | null; size?: number };
let sent: Sent[] = [];
/** The files on the phone the test put there, by uri: their sizes in bytes. A uri not here cannot be read. */
let files: Record<string, number> = {};
let presigns = 0;

const ok = (data: unknown, status = 200) => new Response(JSON.stringify({ statusCode: status, message: 'OK', data }), { status, headers: { 'content-type': 'application/json' } });
const mine = { owner: { wawuId: 'u1', displayName: 'Lennox Emmanuel', handle: 'lennox', avatarUrl: null }, count: 0, categories: [], works: [] };

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (href.startsWith('file://')) {
    if (!(href in files)) throw new TypeError('Network request failed');
    return new Response(new Uint8Array(files[href]));
  }
  const request = input instanceof Request ? input : new Request(href, init);
  const url = new URL(request.url);
  if (request.method === 'PUT') {
    sent.push({ method: 'PUT', path: url.pathname, type: request.headers.get('content-type'), size: (await request.arrayBuffer()).byteLength });
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

beforeEach(() => {
  sent = [];
  files = {};
  presigns = 0;
  mockLibrary = null;
  mockEncoded.length = 0;
  Picker.launchImageLibraryAsync.mockClear();
});

describe('M36 on the phone: the photo library (expo-image-picker)', () => {
  it('a user sees "Add photos or a video", taps it, chooses a photo and a video, and both go up in the order chosen', async () => {
    expect(canPickMedia).toBe(true);
    files = { 'file:///picker/1.jpg': 3000, 'file:///picker/2.mp4': 9000 };
    mockLibrary = [
      { uri: 'file:///picker/1.jpg', type: 'image', mimeType: 'image/jpeg', width: 1200, height: 1600 },
      { uri: 'file:///picker/2.mp4', type: 'video', mimeType: 'video/mp4', width: 1080, height: 1920 },
    ];
    await boot();
    expect(screen.getByText('Add photos or a video')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('work-add-media'));
    await waitFor(() => expect(sent.filter((s) => s.method === 'PUT')).toHaveLength(2));
    expect(Picker.launchImageLibraryAsync).toHaveBeenCalledWith({ mediaTypes: ['images', 'videos'], allowsMultipleSelection: true, selectionLimit: 8, orderedSelection: true });
    expect(presignBodies()).toEqual([
      { folder: 'profile/work', contentType: 'image/jpeg', extension: 'jpg', contentLength: 3000 },
      { folder: 'profile/work', contentType: 'video/mp4', extension: 'mp4', contentLength: 9000 },
    ]);
    expect(sent.filter((s) => s.method === 'PUT').map((s) => [s.type, s.size])).toEqual([
      ['image/jpeg', 3000],
      ['video/mp4', 9000],
    ]);
  });

  it('a photo in a format the Hub does not take goes up as a JPEG; a file that cannot be read is left out', async () => {
    files = { 'file:///cache/ImageManipulator/converted-1.jpg': 1200, 'file:///picker/3.webp': 700 };
    mockLibrary = [
      { uri: 'file:///picker/1.heic', type: 'image', mimeType: 'image/heic', width: 3024, height: 4032 },
      { uri: 'file:///picker/gone.jpg', type: 'image', mimeType: 'image/jpeg', width: 10, height: 10 },
      { uri: 'file:///picker/3.webp', type: 'image', mimeType: 'image/webp', width: 800, height: 800 },
    ];
    const picked = await pickMedia();
    expect(mockEncoded).toEqual(['file:///picker/1.heic']);
    expect(picked.map((file) => [file.contentType, file.extension, file.blob.size])).toEqual([
      ['image/jpeg', 'jpg', 1200],
      ['image/webp', 'webp', 700],
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
