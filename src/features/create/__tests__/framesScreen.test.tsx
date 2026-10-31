/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { servePrices } from '@/features/prices/__helpers__/prices';

import { ScriptedXhr, FORMATS, allowance, chosen, hub, installFetch, installXhr, ok, presigned, refusal, renderFrame } from '../__helpers__/harness';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

/*
 * CREATE-FRAMES under R-118. The phone's gallery, its video reader and its image manipulator are scripted (jest has none of them); everything
 * between them is the real code: `pickFile` and `readPicked` for a gallery pick, the upload step's handlers (the frame of a video and the
 * smaller copy of a picture are read from the FULL file the creator picks, because nobody uploads a preview any more), the cover step, the
 * draft and the price step.
 */
const mockPicker = { assets: [] as unknown[] };
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: false, assets: mockPicker.assets })),
}));

const mockThumbnail = { kind: 'thumbnail', width: 480, height: 270 };
const mockReader: { calls: string[]; thumbnails: () => Promise<unknown[]>; events: string[] } = { calls: [], thumbnails: async () => [mockThumbnail], events: [] };
const mockManipulator = { calls: [] as string[], size: { width: 4000, height: 3000 }, readable: true };
jest.mock('expo-image-manipulator', () => {
  const context = (source: unknown) => {
    const c = {
      resize: (size: unknown) => {
        mockManipulator.calls.push(`resize ${JSON.stringify(size)}`);
        return c;
      },
      renderAsync: async () => {
        if (!mockManipulator.readable) throw new Error('Could not load the image');
        mockManipulator.calls.push(`render ${typeof source === 'string' ? source : 'image'}`);
        return {
          width: mockManipulator.size.width,
          height: mockManipulator.size.height,
          saveAsync: async (options: { format: string; compress: number }) => {
            mockManipulator.calls.push(`save ${options.format} ${options.compress}`);
            return { uri: 'file:///cache/ImageManipulator/small.jpg', width: 640, height: 480 };
          },
          release: jest.fn(),
        };
      },
      release: jest.fn(),
    };
    return c;
  };
  return { SaveFormat: { JPEG: 'jpeg', PNG: 'png', WEBP: 'webp' }, ImageManipulator: { manipulate: context } };
});
jest.mock('@/features/media/manipulatorCache', () => ({ forgetFile: jest.fn() }));

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
const { UploadScreen } = require('../UploadScreen') as typeof import('../UploadScreen');
const { PreviewScreen } = require('../PreviewScreen') as typeof import('../PreviewScreen');
const { PriceScreen } = require('../PriceScreen') as typeof import('../PriceScreen');
const draft = require('../draft') as typeof import('../draft');
const details = require('../details') as typeof import('../details');
const pickFileModule = require('../pickFile') as typeof import('../pickFile');

const FORMATS_PATH = '/api/hub/uploads/formats';
const ALLOWANCE_PATH = '/api/hub/uploads/allowance';
const PRESIGN = '/api/hub/uploads/presign';
const CREATE = '/api/hub/content';
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
    if (typeof input === 'string' && input.startsWith('file:///cache/ImageManipulator/small')) return new Response(new Uint8Array(60_000));
    return hubFetch(input, init);
  }) as typeof fetch;
}

/** `expo-image` hands its native view the source as a list of one. */
const imageSource = () => screen.getAllByTestId('preview-tile-image').map((n) => n.props.source);
const posts = () => hub.sent.filter((s) => s.method === 'POST' && s.path === CREATE).map((s) => s.body as Record<string, unknown>);
const presigns = () => hub.sent.filter((s) => s.method === 'POST' && s.path === PRESIGN).map((s) => s.body as Record<string, unknown>);

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
  mockManipulator.calls = [];
  mockManipulator.size = { width: 4000, height: 3000 };
  mockManipulator.readable = true;
  mockPicker.assets = [galleryVideo];
  hub.answers[`GET ${FORMATS_PATH}`] = ok(FORMATS);
  hub.answers[`GET ${ALLOWANCE_PATH}`] = ok(allowance(0, 5));
  hub.answers[`POST ${PRESIGN}`] = presigned('content/full', 'launch.mp4');
  hub.answers[`POST ${CREATE}`] = { status: 201, body: { statusCode: 201, message: 'Created', data: { id: 'c1', title: 'Launch day', status: 'pending' } } };
  serveGallery();
});
afterEach(() => {
  jest.restoreAllMocks();
});

const openUpload = (format: 'video' | 'image' = 'video', onBack = jest.fn()) => renderFrame(<UploadScreen format={format} onBack={onBack} onContinue={jest.fn()} />);
const openCover = (format: 'video' | 'course' | 'image' | 'audio' = 'video', onBack = jest.fn()) => renderFrame(<PreviewScreen format={format} onBack={onBack} onContinue={jest.fn()} />);
const land = async () => {
  await waitFor(() => expect(ScriptedXhr.last).not.toBeNull());
  await act(async () => {
    ScriptedXhr.last?.finish(200);
  });
};
const toPrice = async (format: 'video' | 'image', paid = true) => {
  details.setDetails({ title: 'Launch day', description: 'The whole day.', category: 'entertainment_creative', accessType: paid ? 'paid' : 'free', price: paid ? '3000' : '' });
  servePrices();
  await renderFrame(<PriceScreen format={format} onBack={jest.fn()} onSent={jest.fn()} />);
};

describe('R-118 · the frame of a video is read from the FULL file the creator picks (Android, from the gallery)', () => {
  it('a user picks a video at step 2: the frame is read before the upload starts, while the phone\'s copy is still there, and kept on the full file', async () => {
    await openUpload();
    await fireEvent.press(await screen.findByTestId('upload-drop'));
    await waitFor(() => expect(ScriptedXhr.last).not.toBeNull());
    expect(mockReader.events).toEqual(['read-file', 'player', 'frame']);
    expect(mockReader.calls).toEqual([GALLERY]);
    expect(ScriptedXhr.last?.headers['content-type']).toBe('video/mp4');
    expect(presigns()[0]).toMatchObject({ folder: 'content/full', format: 'video' });
    await act(async () => {
      ScriptedXhr.last?.finish(200);
    });
    await waitFor(() => expect(draft.getDraft().full?.frame).toBe(mockThumbnail));
    // No preview is uploaded for a video: one transfer, the full file.
    expect(presigns()).toHaveLength(1);
  });

  it('a user on the cover step sees that frame in How it will look (the cover twice, then the frosted locked one) and "Video frame" chosen', async () => {
    draft.setFormat('video');
    draft.setFull({ name: 'launch-day.mp4', bytes: 4 * MB, contentType: 'video/mp4', key: 'content/full/u1/f.mp4', fileUrl: 'https://storage.test/content/full/u1/f.mp4?read=1', frame: mockThumbnail as never });
    await openCover('video');
    expect(await screen.findByText('Add a cover')).toBeTruthy();
    expect(screen.getByTestId('preview-line').props.children).toBe('Your preview is the first 30 seconds, made for you.');
    expect(screen.queryByTestId('preview-drop')).toBeNull();
    expect(screen.getByRole('tab', { name: 'Video frame' }).props.accessibilityState.selected).toBe(true);
    expect(imageSource()).toEqual([[mockThumbnail], [mockThumbnail], [mockThumbnail]]);
    expect(screen.getAllByTestId('preview-tile')).toHaveLength(2);
    expect(screen.getAllByTestId('preview-tile-image')[2].props.blurRadius).toBe(8);
    expect(screen.getByTestId('create-continue').props.accessibilityState?.disabled).toBeFalsy();
  });

  it('a user sees the same frame on the price step, as the piece card\'s cover, paid or free', async () => {
    draft.setFormat('video');
    draft.setFull({ name: 'launch-day.mp4', bytes: 4 * MB, contentType: 'video/mp4', key: 'content/full/u1/f.mp4', fileUrl: 'https://storage.test/content/full/u1/f.mp4?read=1', frame: mockThumbnail as never });
    await toPrice('video', false);
    expect(await screen.findByTestId('price-piece')).toBeTruthy();
    expect(screen.getByText('Free for everyone')).toBeTruthy();
    expect(screen.getByTestId('price-piece-image').props.source).toEqual([mockThumbnail]);
  });

  it('a frame that cannot be read keeps the icon: the upload still goes up, nothing is said, and the cover step offers Picture and None only', async () => {
    mockReader.thumbnails = async () => {
      throw new Error('Failed to generate thumbnail');
    };
    const view = await openUpload();
    await fireEvent.press(await screen.findByTestId('upload-drop'));
    await land();
    await waitFor(() => expect(draft.getDraft().full).toMatchObject({ name: 'launch-day.mp4' }));
    expect(draft.getDraft().full?.frame).toBeUndefined();
    expect(screen.queryByTestId('upload-failure')).toBeNull();
    await view.unmount();
    await openCover('video');
    expect(screen.queryByTestId('preview-tile-image')).toBeNull();
    expect(screen.queryByRole('tab', { name: 'Video frame' })).toBeNull();
    expect(screen.getByRole('tab', { name: 'Picture' })).toBeTruthy();
  });

  it('a frame the picture view cannot draw falls back to the icon on that tile, never a broken box', async () => {
    draft.setFormat('video');
    draft.setFull({ name: 'launch-day.mp4', bytes: 4 * MB, contentType: 'video/mp4', key: 'content/full/u1/f.mp4', fileUrl: 'https://storage.test/content/full/u1/f.mp4?read=1', frame: mockThumbnail as never });
    await openCover('video');
    const tiles = await screen.findAllByTestId('preview-tile-image');
    await fireEvent(tiles[0], 'error', { nativeEvent: { error: 'decode' } });
    expect(screen.getAllByTestId('preview-tile-image')).toHaveLength(2);
    expect(screen.getAllByTestId('preview-tile')).toHaveLength(2);
  });

  it('leaving while the frame is being read starts no upload and leaves no copy behind: the phone\'s copy of the video is discarded once', async () => {
    let finish: (value: unknown[]) => void = () => undefined;
    mockReader.thumbnails = () => new Promise<unknown[]>((resolve) => (finish = resolve));
    const discard = jest.fn();
    jest.spyOn(pickFileModule, 'pickFile').mockResolvedValue({ ...chosen('launch-day.mp4', 'video/mp4', 4, { previewUri: GALLERY }), discard });
    const onBack = jest.fn();
    await openUpload('video', onBack);
    await fireEvent.press(await screen.findByTestId('upload-drop'));
    await waitFor(() => expect(mockReader.events).toContain('frame'));
    expect(discard).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByLabelText('Back'));
    expect(onBack).toHaveBeenCalledTimes(1);
    await act(async () => finish([mockThumbnail]));
    expect(ScriptedXhr.last).toBeNull();
    expect(discard).toHaveBeenCalledTimes(1);
    expect(draft.getDraft().full).toBeNull();
  });

  it('a file the step refuses (a type the Hub does not take) opens no video reader and uploads nothing', async () => {
    jest.spyOn(pickFileModule, 'pickFile').mockResolvedValue(chosen('launch-day.avi', 'video/x-msvideo', 4, { previewUri: GALLERY }));
    await openUpload();
    await fireEvent.press(await screen.findByTestId('upload-drop'));
    expect(await screen.findByTestId('upload-failure')).toBeTruthy();
    expect(ScriptedXhr.last).toBeNull();
    expect(mockReader.calls).toEqual([]);
  });

  it('a course\'s first lesson that is a video gives the frame for the course\'s cover, read when the lesson file is chosen', async () => {
    draft.setFormat('course');
    draft.addLesson();
    draft.setLessonFile(draft.getLessons()[0].key, { name: 'lesson-1.mp4', bytes: 90 * MB, contentType: 'video/mp4', key: 'content/full/u1/l1.mp4', fileUrl: 'https://storage.test/content/full/u1/l1.mp4?read=1', frame: mockThumbnail as never });
    await openCover('course');
    expect(screen.getByTestId('preview-line').props.children).toBe('Your preview is the first 30 seconds of your first lesson, made for you.');
    expect(screen.getByRole('tab', { name: 'Video frame' }).props.accessibilityState.selected).toBe(true);
    expect(imageSource()).toEqual([[mockThumbnail], [mockThumbnail], [mockThumbnail]]);
  });
});

describe('R-118 · the preview of a picture is made on the phone from the creator\'s own first picture (Android)', () => {
  const PICTURE = 'file:///cache/ImageManipulator/first.jpg';
  const pickPicture = (discard = jest.fn()) =>
    jest.spyOn(pickFileModule, 'pickFile').mockResolvedValue({ ...chosen('first.jpg', 'image/jpeg', 8, { previewUri: PICTURE }), discard });

  it('choosing the first picture makes a smaller copy: long edge 640 px, a JPEG at 0.7, read from the phone\'s own copy before it goes; only the full picture uploads now', async () => {
    hub.answers[`POST ${PRESIGN}`] = presigned('content/full', 'first.jpg');
    pickPicture();
    await openUpload('image');
    await fireEvent.press(await screen.findByTestId('upload-drop'));
    await land();
    await waitFor(() => expect(draft.getDraft().full).toMatchObject({ name: 'first.jpg' }));
    // 4000 x 3000 brought down to 640 wide, never up; the encoder writes a JPEG at 0.7.
    expect(mockManipulator.calls).toEqual([`render ${PICTURE}`, 'resize {"width":640}', 'render image', 'save jpeg 0.7']);
    const copy = draft.getSmallCopy();
    expect(copy).toMatchObject({ name: 'preview.jpg', contentType: 'image/jpeg', extension: 'jpg' });
    expect(copy?.blob.size).toBe(60_000);
    expect(presigns()).toHaveLength(1);
    // The full picture is drawn from the link it came back with: the phone's copy is gone by now.
    expect(draft.getDraft().full?.previewUri).toBe('https://storage.test/content/full/u1/first.jpg?read=1');
  });

  it('a picture already under 640 px is not enlarged', async () => {
    mockManipulator.size = { width: 500, height: 400 };
    pickPicture();
    await openUpload('image');
    await fireEvent.press(await screen.findByTestId('upload-drop'));
    await land();
    await waitFor(() => expect(draft.getSmallCopy()).not.toBeNull());
    expect(mockManipulator.calls.some((c) => c.startsWith('resize'))).toBe(false);
    expect(mockManipulator.calls[mockManipulator.calls.length - 1]).toBe('save jpeg 0.7');
  });

  it('a tall picture is brought down by its height, so the long edge is 640 px', async () => {
    mockManipulator.size = { width: 1200, height: 3000 };
    pickPicture();
    await openUpload('image');
    await fireEvent.press(await screen.findByTestId('upload-drop'));
    await land();
    await waitFor(() => expect(draft.getSmallCopy()).not.toBeNull());
    expect(mockManipulator.calls).toContain('resize {"height":640}');
  });

  it('a picture the phone cannot read again is refused at step 2, in words, and nothing uploads', async () => {
    mockManipulator.readable = false;
    const discard = jest.fn();
    pickPicture(discard);
    await openUpload('image');
    await fireEvent.press(await screen.findByTestId('upload-drop'));
    expect(await screen.findByText('That picture could not be read. Choose another.')).toBeTruthy();
    expect(ScriptedXhr.last).toBeNull();
    expect(discard).toHaveBeenCalledTimes(1);
    expect(draft.getSmallCopy()).toBeNull();
  });

  const sendPicture = async (paid: boolean) => {
    draft.setFormat('image');
    draft.setFull({ name: 'first.jpg', bytes: 8 * MB, contentType: 'image/jpeg', key: 'content/full/u1/first.jpg', fileUrl: 'https://storage.test/content/full/u1/first.jpg?read=1', previewUri: 'https://storage.test/content/full/u1/first.jpg?read=1' });
    draft.setSmallCopy({ ...chosen('preview.jpg', 'image/jpeg', 60_000), extension: 'jpg' });
    hub.answers[`POST ${PRESIGN}`] = presigned('content/preview', 'preview.jpg');
    await toPrice('image', paid);
    await waitFor(() => expect(screen.getByTestId('create-send').props.accessibilityState.disabled).toBe(false));
    await fireEvent.press(screen.getByTestId('create-send'));
  };

  it('Send on a PAID picture uploads the smaller copy as the preview (format image, folder content/preview) and names it as previewAsset', async () => {
    await sendPicture(true);
    await land();
    await waitFor(() => expect(posts()).toHaveLength(1));
    expect(presigns()[0]).toMatchObject({ folder: 'content/preview', format: 'image', contentType: 'image/jpeg', extension: 'jpg' });
    expect(posts()[0]).toMatchObject({ contentType: 'image', previewAsset: 'https://storage.test/content/preview/u1/preview.jpg?read=1', fullAsset: 'https://storage.test/content/full/u1/first.jpg?read=1' });
    expect(posts()[0]).not.toHaveProperty('previewFromFile');
  });

  it('Send on a FREE picture uploads no preview and asks for none', async () => {
    await sendPicture(false);
    await waitFor(() => expect(posts()).toHaveLength(1));
    expect(presigns()).toEqual([]);
    expect(posts()[0]).not.toHaveProperty('previewAsset');
    expect(posts()[0]).not.toHaveProperty('previewFromFile');
  });

  it('a Send that fails after the preview went up is tried again with the same preview: one upload, not two', async () => {
    hub.answers[`POST ${CREATE}`] = refusal(500, 'Something went wrong.');
    await sendPicture(true);
    await land();
    await waitFor(() => expect(posts()).toHaveLength(1));
    expect(await screen.findByTestId('price-failure')).toBeTruthy();
    hub.answers[`POST ${CREATE}`] = { status: 201, body: { statusCode: 201, message: 'Created', data: { id: 'c1', title: 'Launch day', status: 'pending' } } };
    await fireEvent.press(screen.getByTestId('create-send'));
    await waitFor(() => expect(posts()).toHaveLength(2));
    expect(presigns().filter((b) => b.folder === 'content/preview')).toHaveLength(1);
    expect(posts()[1].previewAsset).toBe(posts()[0].previewAsset);
  });

  it('a copy that is gone (the app was closed and opened again) says so in words and sends nothing', async () => {
    draft.setFormat('image');
    draft.setFull({ name: 'first.jpg', bytes: 8 * MB, contentType: 'image/jpeg', key: 'content/full/u1/first.jpg', fileUrl: 'https://storage.test/content/full/u1/first.jpg?read=1' });
    await toPrice('image', true);
    await waitFor(() => expect(screen.getByTestId('create-send').props.accessibilityState.disabled).toBe(false));
    await fireEvent.press(screen.getByTestId('create-send'));
    expect(await screen.findByText('Your preview could not be made. Choose your picture again.')).toBeTruthy();
    expect(posts()).toEqual([]);
  });

  it('the cover step of a picture says the preview is a smaller copy, and draws the picture itself in the tiles', async () => {
    draft.setFormat('image');
    draft.setFull({ name: 'first.jpg', bytes: 8 * MB, contentType: 'image/jpeg', key: 'content/full/u1/first.jpg', fileUrl: 'https://storage.test/content/full/u1/first.jpg?read=1', previewUri: 'https://storage.test/content/full/u1/first.jpg?read=1' });
    await openCover('image');
    expect(screen.getByTestId('preview-line').props.children).toBe('Your preview is a smaller copy of your first picture.');
    expect(imageSource()).toEqual(Array(3).fill([{ uri: 'https://storage.test/content/full/u1/first.jpg?read=1' }]));
    expect(mockReader.calls).toEqual([]);
  });
});
