/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { servePrices } from '@/features/prices/__helpers__/prices';

import { ScriptedXhr, FORMATS, chosen, hub, installFetch, installXhr, ok, presigned, renderFrame } from '../__helpers__/harness';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

/*
 * CREATE-FRAMES. The phone's gallery and its video reader are scripted (jest has neither); everything between them is the real
 * code: `pickFile` and `readPicked` for a gallery pick, the preview step's handlers, the draft and the price step.
 */
const mockPicker = { assets: [] as unknown[] };
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: false, assets: mockPicker.assets })),
}));

const mockThumbnail = { kind: 'thumbnail', width: 480, height: 270 };
const mockReader: { calls: string[]; thumbnails: () => Promise<unknown[]>; events: string[] } = { calls: [], thumbnails: async () => [mockThumbnail], events: [] };
jest.mock('expo-video', () => ({
  VideoView: 'VideoView',
  useVideoPlayer: jest.fn(),
  createVideoPlayer: jest.fn((uri: string) => {
    mockReader.calls.push(uri);
    mockReader.events.push('player');
    return {
      status: 'readyToPlay',
      duration: 12,
      release: jest.fn(),
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      generateThumbnailsAsync: jest.fn(() => {
        mockReader.events.push('frame');
        return mockReader.thumbnails();
      }),
    };
  }),
}));

installFetch();
const { queryClient: appClient } = require('@/api/query') as typeof import('@/api/query');
const { PreviewScreen } = require('../PreviewScreen') as typeof import('../PreviewScreen');
const { PriceScreen } = require('../PriceScreen') as typeof import('../PriceScreen');
const draft = require('../draft') as typeof import('../draft');
const details = require('../details') as typeof import('../details');

const FORMATS_PATH = '/api/hub/uploads/formats';
const PRESIGN = '/api/hub/uploads/presign';
const GALLERY = 'content://media/external/video/media/42';
const MB = 1024 * 1024;

/** A 4 MB mp4 in the phone's gallery: what `expo-image-picker` hands back for it. */
const galleryVideo = { uri: GALLERY, type: 'video', mimeType: 'video/mp4', fileName: 'launch-day.mp4', width: 1920, height: 1080 };

const realFetch = () => globalThis.fetch;
function serveGallery() {
  const hubFetch = realFetch();
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string' && input.startsWith('content://')) {
      mockReader.events.push('read-file');
      return new Response(new Uint8Array(4 * MB));
    }
    return hubFetch(input, init);
  }) as typeof fetch;
}

/** `expo-image` hands its native view the source as a list of one. */
const imageSource = () => screen.getAllByTestId('preview-tile-image').map((n) => n.props.source);

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
  installFetch();
  installXhr();
  draft.resetDraft();
  details.setSent(null);
  appClient.clear();
  mockReader.calls = [];
  mockReader.events = [];
  mockReader.thumbnails = async () => [mockThumbnail];
  mockPicker.assets = [galleryVideo];
  hub.answers[`GET ${FORMATS_PATH}`] = ok(FORMATS);
  hub.answers[`POST ${PRESIGN}`] = presigned('content/preview', 'clip.mp4');
  serveGallery();
});
afterEach(() => {
  jest.restoreAllMocks();
});

const open = (format: 'video' | 'image' | 'audio' = 'video', onBack = jest.fn()) => renderFrame(<PreviewScreen format={format} onBack={onBack} onContinue={jest.fn()} />);
const land = async () => {
  await waitFor(() => expect(ScriptedXhr.last).not.toBeNull());
  await act(async () => {
    ScriptedXhr.last?.finish(200);
  });
};

describe('M22 · Preview, a video (Android, from the gallery)', () => {
  it('a user can pick a video from the gallery and see frames of it in How it will look: the preview twice, then the frosted locked one', async () => {
    await open();
    await fireEvent.press(await screen.findByTestId('preview-drop'));
    await land();
    expect(await screen.findByText('launch-day.mp4')).toBeTruthy();
    expect(screen.getByText('4 MB · public')).toBeTruthy();
    expect(screen.getByText('How it will look')).toBeTruthy();
    // The real gallery link went to the video reader, and the picture it gave back is what the three tiles draw.
    expect(mockReader.calls).toEqual([GALLERY]);
    expect(imageSource()).toEqual([[mockThumbnail], [mockThumbnail], [mockThumbnail]]);
    expect(screen.getAllByTestId('preview-tile')).toHaveLength(2);
    expect(screen.getByTestId('preview-tile-locked')).toBeTruthy();
    const frosted = screen.getAllByTestId('preview-tile-image')[2];
    expect(frosted.props.blurRadius).toBe(8);
    expect(screen.getAllByTestId('preview-tile-image')[0].props.blurRadius).toBe(0);
    expect(draft.getDraft().preview?.frame).toBe(mockThumbnail);
    expect(screen.queryByTestId('preview-failure')).toBeNull();
  });

  it('reads the frame before the upload starts, so the phone\'s own copy is still there to read', async () => {
    await open();
    await fireEvent.press(await screen.findByTestId('preview-drop'));
    await waitFor(() => expect(ScriptedXhr.last).not.toBeNull());
    expect(mockReader.events).toEqual(['read-file', 'player', 'frame']);
    expect(ScriptedXhr.last?.headers['content-type']).toBe('video/mp4');
    await act(async () => {
      ScriptedXhr.last?.finish(200);
    });
  });

  it('a user sees the same frame on the price step, as the piece card\'s cover', async () => {
    draft.setFormat('video');
    draft.setFull({ name: 'full.mp4', bytes: 90 * MB, contentType: 'video/mp4', key: 'content/full/u1/f.mp4', fileUrl: 'https://storage.test/content/full/u1/f.mp4?read=1' });
    const first = await open();
    await fireEvent.press(await screen.findByTestId('preview-drop'));
    await land();
    await screen.findByTestId('preview-look');
    await first.unmount();

    details.setDetails({ title: 'Launch day', description: 'The whole day.', category: 'entertainment_creative' });
    servePrices();
    await renderFrame(<PriceScreen format="video" onBack={jest.fn()} onSent={jest.fn()} />);
    expect(await screen.findByTestId('price-piece')).toBeTruthy();
    expect(screen.getByTestId('price-piece-image').props.source).toEqual([mockThumbnail]);
  });

  it('a frame that cannot be read keeps the icon: the upload still goes up, nothing is said, the price step keeps its icon', async () => {
    mockReader.thumbnails = async () => {
      throw new Error('Failed to generate thumbnail');
    };
    draft.setFormat('video');
    draft.setFull({ name: 'full.mp4', bytes: 90 * MB, contentType: 'video/mp4', key: 'content/full/u1/f.mp4', fileUrl: 'https://storage.test/content/full/u1/f.mp4?read=1' });
    const first = await open();
    await fireEvent.press(await screen.findByTestId('preview-drop'));
    await land();
    expect(await screen.findByTestId('preview-look')).toBeTruthy();
    expect(screen.queryByTestId('preview-tile-image')).toBeNull();
    expect(screen.getAllByTestId('preview-tile')).toHaveLength(2);
    expect(screen.getByTestId('preview-tile-locked')).toBeTruthy();
    expect(screen.queryByTestId('preview-failure')).toBeNull();
    expect(screen.getByTestId('create-continue').props.accessibilityState?.disabled).toBeFalsy();
    expect(draft.getDraft().preview).toMatchObject({ name: 'launch-day.mp4', key: 'content/preview/u1/clip.mp4' });
    expect(draft.getDraft().preview?.frame).toBeUndefined();
    await first.unmount();

    details.setDetails({ title: 'Launch day', description: 'The whole day.', category: 'entertainment_creative' });
    servePrices();
    await renderFrame(<PriceScreen format="video" onBack={jest.fn()} onSent={jest.fn()} />);
    expect(await screen.findByTestId('price-piece')).toBeTruthy();
    expect(screen.queryByTestId('price-piece-image')).toBeNull();
  });

  it('a frame the picture view cannot draw falls back to the icon on that tile, never a broken box', async () => {
    await open();
    await fireEvent.press(await screen.findByTestId('preview-drop'));
    await land();
    const tiles = await screen.findAllByTestId('preview-tile-image');
    await fireEvent(tiles[0], 'error', { nativeEvent: { error: 'decode' } });
    expect(screen.getAllByTestId('preview-tile-image')).toHaveLength(2);
    expect(screen.getAllByTestId('preview-tile')).toHaveLength(2);
  });

  it('leaving while the frame is being read starts no upload', async () => {
    let finish: (value: unknown[]) => void = () => undefined;
    mockReader.thumbnails = () => new Promise<unknown[]>((resolve) => (finish = resolve));
    const onBack = jest.fn();
    await open('video', onBack);
    await fireEvent.press(await screen.findByTestId('preview-drop'));
    await waitFor(() => expect(mockReader.events).toContain('frame'));
    await fireEvent.press(screen.getByLabelText('Back'));
    expect(onBack).toHaveBeenCalledTimes(1);
    await act(async () => finish([mockThumbnail]));
    expect(ScriptedXhr.last).toBeNull();
    expect(draft.getDraft().preview).toBeNull();
  });
});

describe('M22 · Preview, an image or an audio clip looks exactly as before', () => {
  it('a photo preview is drawn as itself in the three tiles and no video reader is opened', async () => {
    mockPicker.assets = [];
    const pickFileModule = require('../pickFile') as typeof import('../pickFile');
    jest.spyOn(pickFileModule, 'pickFile').mockResolvedValue(chosen('cover.png', 'image/png', 5, { previewUri: 'file:///cache/cover.png' }));
    hub.answers[`POST ${PRESIGN}`] = presigned('content/preview', 'cover.png');
    await open('image');
    await fireEvent.press(await screen.findByTestId('preview-drop'));
    await land();
    await screen.findByTestId('preview-look');
    expect(imageSource()).toEqual([[{ uri: 'file:///cache/cover.png' }], [{ uri: 'file:///cache/cover.png' }], [{ uri: 'file:///cache/cover.png' }]]);
    expect(mockReader.calls).toEqual([]);
    expect(draft.getDraft().preview?.frame).toBeUndefined();
  });

  it('an audio clip keeps the icon in the tiles and no video reader is opened', async () => {
    const pickFileModule = require('../pickFile') as typeof import('../pickFile');
    jest.spyOn(pickFileModule, 'pickFile').mockResolvedValue(chosen('clip.mp3', 'audio/mpeg', 5, { previewUri: 'file:///cache/clip.mp3' }));
    hub.answers[`POST ${PRESIGN}`] = presigned('content/preview', 'clip.mp3');
    await open('audio');
    await fireEvent.press(await screen.findByTestId('preview-drop'));
    await land();
    await screen.findByTestId('preview-look');
    expect(screen.queryByTestId('preview-tile-image')).toBeNull();
    expect(screen.getAllByTestId('preview-tile')).toHaveLength(2);
    expect(mockReader.calls).toEqual([]);
  });
});
