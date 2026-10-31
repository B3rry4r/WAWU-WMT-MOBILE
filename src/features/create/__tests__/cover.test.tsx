/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { servePrices } from '@/features/prices/__helpers__/prices';

import { ScriptedXhr, FORMATS, chosen, hub, installFetch, installXhr, ok, presigned, refusal, renderFrame } from '../__helpers__/harness';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })) }));
jest.mock('expo-video', () => ({ VideoView: 'VideoView', useVideoPlayer: jest.fn(), createVideoPlayer: jest.fn() }));
// The phone writes the frame as a JPEG with the image manipulator, which jest has no phone for: the file it would give is scripted.
const mockFrameFile = jest.fn();
jest.mock('../frameFile', () => ({ frameFile: (...args: unknown[]) => mockFrameFile(...args) }));

/*
 * COVERS-APP (R-114): the "Cover" choice on the preview step and what the create call sends. Android's real picker handlers (Platform.OS
 * android): the picture comes through `pickFile`'s own photo path (the phone's photo library), goes to `content/cover` through the
 * presign call and the PUT, and the create call names it as `coverAsset`.
 */
installFetch();
const { queryClient: appClient } = require('@/api/query') as typeof import('@/api/query');
const { PreviewScreen } = require('../PreviewScreen') as typeof import('../PreviewScreen');
const { PriceScreen } = require('../PriceScreen') as typeof import('../PriceScreen');
const draft = require('../draft') as typeof import('../draft');
const details = require('../details') as typeof import('../details');
const pickFileModule = require('../pickFile') as typeof import('../pickFile');

const FORMATS_PATH = '/api/hub/uploads/formats';
const PRESIGN = '/api/hub/uploads/presign';
const CREATE = '/api/hub/content';
const MB = 1024 * 1024;
const thumbnail = { kind: 'thumbnail', width: 480, height: 270 };

const presigns = () => hub.sent.filter((s) => s.method === 'POST' && s.path === PRESIGN).map((s) => s.body as Record<string, unknown>);
const posts = () => hub.sent.filter((s) => s.method === 'POST' && s.path === CREATE).map((s) => s.body as Record<string, unknown>);

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
  installFetch();
  installXhr();
  draft.resetDraft();
  details.setSent(null);
  appClient.clear();
  mockFrameFile.mockReset();
  hub.answers[`GET ${FORMATS_PATH}`] = ok(FORMATS);
  hub.answers[`POST ${CREATE}`] = { status: 201, body: { statusCode: 201, message: 'Created', data: { id: 'c1', title: 'Launch day', status: 'pending' } } };
});
afterEach(() => {
  jest.restoreAllMocks();
});

/** A video piece at the preview step with its preview up and its frame read (what CREATE-FRAMES leaves in the draft). */
async function atPreview() {
  draft.setFormat('video');
  draft.setFull({ name: 'full.mp4', bytes: 90 * MB, contentType: 'video/mp4', key: 'content/full/u1/f.mp4', fileUrl: 'https://storage.test/content/full/u1/f.mp4?read=1' });
  draft.setPreview({ name: 'clip.mp4', bytes: 4 * MB, contentType: 'video/mp4', key: 'content/preview/u1/clip.mp4', fileUrl: 'https://storage.test/content/preview/u1/clip.mp4?read=1', frame: thumbnail as never });
  return renderFrame(<PreviewScreen format="video" onBack={jest.fn()} onContinue={jest.fn()} />);
}

/** The price step for the same piece, paid at ₦3,000, Send pressed. */
async function sendPiece() {
  details.setDetails({ title: 'Launch day', description: 'The whole day.', category: 'entertainment_creative', accessType: 'paid', price: '3000' });
  servePrices();
  await renderFrame(<PriceScreen format="video" onBack={jest.fn()} onSent={jest.fn()} />);
  await waitFor(() => expect(screen.getByTestId('create-send').props.accessibilityState.disabled).toBe(false));
  await fireEvent.press(screen.getByTestId('create-send'));
  await waitFor(() => expect(posts()).toHaveLength(1));
  return posts()[0];
}

/** The phone's photo picker gives the cover; every other pick (the preview) is not asked for here. */
function pickerGives(file: ReturnType<typeof chosen>) {
  jest.spyOn(pickFileModule, 'pickFile').mockImplementation(async (types) => (types.includes('image/png') ? file : null));
}

describe('M22 · the Cover choice (Android)', () => {
  it('a user with a video preview sees the frame as the default cover, with Picture and None beside it', async () => {
    await atPreview();
    expect(await screen.findByTestId('cover-choice')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Video frame' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole('tab', { name: 'Picture' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'None' })).toBeTruthy();
    expect(screen.getAllByTestId('preview-tile-image').length).toBe(3);
  });

  it('a user picks a picture: it goes to content/cover with no format, the tiles draw it, and the create call names it as coverAsset', async () => {
    hub.answers[`POST ${PRESIGN}`] = presigned('content/cover', 'cover.png');
    pickerGives(chosen('cover.png', 'image/png', 3, { previewUri: 'file:///cache/cover.png' }));
    await atPreview();
    await fireEvent.press(await screen.findByRole('tab', { name: 'Picture' }));
    await waitFor(() => expect(ScriptedXhr.last).not.toBeNull());
    expect(presigns()[0]).toMatchObject({ folder: 'content/cover', contentType: 'image/png', extension: 'png' });
    expect(presigns()[0]).not.toHaveProperty('format');
    await act(async () => {
      ScriptedXhr.last?.finish(200);
    });
    expect(await screen.findByTestId('cover-picked-image')).toBeTruthy();
    expect(screen.getAllByTestId('preview-tile-image')[0].props.source).toEqual([{ uri: 'file:///cache/cover.png' }]);
    expect(draft.getCover()).toMatchObject({ mode: 'picture', file: { key: 'content/cover/u1/cover.png' } });
  });

  it('None draws the marks in the tiles and the create call carries no coverAsset', async () => {
    const view = await atPreview();
    await fireEvent.press(await screen.findByRole('tab', { name: 'None' }));
    expect(screen.queryByTestId('preview-tile-image')).toBeNull();
    expect(draft.getCover()).toEqual({ mode: 'none', file: null });
    await view.unmount();
    const body = await sendPiece();
    expect(body).not.toHaveProperty('coverAsset');
    expect(mockFrameFile).not.toHaveBeenCalled();
  });

  it('a Hub refusal of the picture (over 5 MB) is shown in the Hub\'s own words and nothing is chosen', async () => {
    hub.answers[`POST ${PRESIGN}`] = refusal(400, 'That picture is over the 5 MB limit for a cover.');
    pickerGives(chosen('cover.png', 'image/png', 3, { previewUri: 'file:///cache/cover.png' }));
    await atPreview();
    await fireEvent.press(await screen.findByRole('tab', { name: 'Picture' }));
    expect(await screen.findByText('That picture is over the 5 MB limit for a cover.')).toBeTruthy();
    expect(draft.getCover().file).toBeNull();
  });
});

describe('M24 · what the create call sends as the cover (Android)', () => {
  it('by default a video piece sends the frame as its cover: written as a JPEG, sent to content/cover, named as coverAsset', async () => {
    mockFrameFile.mockResolvedValue(chosen('cover.jpg', 'image/jpeg', 3));
    hub.answers[`POST ${PRESIGN}`] = presigned('content/cover', 'cover.jpg');
    draft.setFormat('video');
    draft.setFull({ name: 'full.mp4', bytes: 90 * MB, contentType: 'video/mp4', key: 'content/full/u1/f.mp4', fileUrl: 'https://storage.test/content/full/u1/f.mp4?read=1' });
    draft.setPreview({ name: 'clip.mp4', bytes: 4 * MB, contentType: 'video/mp4', key: 'content/preview/u1/clip.mp4', fileUrl: 'https://storage.test/content/preview/u1/clip.mp4?read=1', frame: thumbnail as never });
    details.setDetails({ title: 'Launch day', description: 'The whole day.', category: 'entertainment_creative', accessType: 'paid', price: '3000' });
    servePrices();
    await renderFrame(<PriceScreen format="video" onBack={jest.fn()} onSent={jest.fn()} />);
    await waitFor(() => expect(screen.getByTestId('create-send').props.accessibilityState.disabled).toBe(false));
    await fireEvent.press(screen.getByTestId('create-send'));
    await waitFor(() => expect(ScriptedXhr.last).not.toBeNull());
    expect(mockFrameFile).toHaveBeenCalledWith(thumbnail);
    expect(presigns()[0]).toMatchObject({ folder: 'content/cover', contentType: 'image/jpeg' });
    await act(async () => {
      ScriptedXhr.last?.finish(200);
    });
    await waitFor(() => expect(posts()).toHaveLength(1));
    expect(posts()[0]).toMatchObject({ coverAsset: 'https://storage.test/content/cover/u1/cover.jpg?read=1', previewAsset: 'https://storage.test/content/preview/u1/clip.mp4?read=1' });
  });

  it('a frame that cannot be written or sent leaves the piece without a cover and the piece still goes', async () => {
    mockFrameFile.mockResolvedValue(null);
    draft.setFormat('video');
    draft.setFull({ name: 'full.mp4', bytes: 90 * MB, contentType: 'video/mp4', key: 'content/full/u1/f.mp4', fileUrl: 'https://storage.test/content/full/u1/f.mp4?read=1' });
    draft.setPreview({ name: 'clip.mp4', bytes: 4 * MB, contentType: 'video/mp4', key: 'content/preview/u1/clip.mp4', fileUrl: 'https://storage.test/content/preview/u1/clip.mp4?read=1', frame: thumbnail as never });
    const body = await sendPiece();
    expect(body).not.toHaveProperty('coverAsset');
    expect(screen.queryByTestId('price-failure')).toBeNull();
  });

  it('a picture the person picked is sent as coverAsset, and a piece with no frame and no pick sends none', async () => {
    draft.setFormat('audio');
    draft.setFull({ name: 'full.mp3', bytes: 9 * MB, contentType: 'audio/mpeg', key: 'content/full/u1/f.mp3', fileUrl: 'https://storage.test/content/full/u1/f.mp3?read=1' });
    draft.setPreview({ name: 'clip.mp3', bytes: 1 * MB, contentType: 'audio/mpeg', key: 'content/preview/u1/clip.mp3', fileUrl: 'https://storage.test/content/preview/u1/clip.mp3?read=1' });
    draft.setCover({ mode: 'picture', file: { name: 'cover.png', bytes: 3, contentType: 'image/png', key: 'content/cover/u1/cover.png', fileUrl: 'https://storage.test/content/cover/u1/cover.png?read=1', previewUri: 'file:///cache/cover.png' } });
    details.setDetails({ title: 'Beats', description: 'Stems.', category: 'entertainment_creative', accessType: 'paid', price: '3000' });
    servePrices();
    await renderFrame(<PriceScreen format="audio" onBack={jest.fn()} onSent={jest.fn()} />);
    await waitFor(() => expect(screen.getByTestId('create-send').props.accessibilityState.disabled).toBe(false));
    expect(screen.getByTestId('price-piece-image').props.source).toEqual([{ uri: 'file:///cache/cover.png' }]);
    await fireEvent.press(screen.getByTestId('create-send'));
    await waitFor(() => expect(posts()).toHaveLength(1));
    expect(posts()[0]).toMatchObject({ coverAsset: 'https://storage.test/content/cover/u1/cover.png?read=1' });
    expect(mockFrameFile).not.toHaveBeenCalled();
  });
});
