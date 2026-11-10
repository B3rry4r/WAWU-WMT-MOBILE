/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { installXhr, presigned, ScriptedXhr } from '@/features/create/__helpers__/harness';
import { pricesAnswer } from '@/features/prices/__helpers__/prices';

import { calls, hub, installFetch, ok, piece, refusal, renderFrame } from '../__helpers__/hub';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
const mockDownload = jest.fn();
const mockForget = jest.fn();
const mockCopy = jest.fn();
jest.mock('expo-file-system', () => ({
  Paths: { cache: 'file:///cache' },
  File: class {
    uri: string;
    constructor(_dir: unknown, name: string) {
      this.uri = `file:///cache/${name}`;
    }
    static downloadFileAsync(...args: unknown[]): unknown {
      return mockDownload(...args);
    }
  },
}));
jest.mock('@/features/media/manipulatorCache', () => ({ forgetFile: (...args: unknown[]) => mockForget(...args) }));
jest.mock('@/features/create/previewCopy', () => ({ smallCopyOf: (...args: unknown[]) => mockCopy(...args) }));

installFetch();
const { EditDetailsScreen } = require('../EditDetailsScreen') as typeof import('../EditDetailsScreen');

const MINE = '/api/hub/content/mine/library/f1';
const PATCH = '/api/hub/content/f1';
const PRESIGN = '/api/hub/uploads/presign';
const RELEASE = '/api/hub/uploads/release';

const free = (over: Record<string, unknown> = {}) =>
  piece({ id: 'f1', title: 'Over the Horizon', description: 'A song.', contentType: 'audio', category: 'business_entrepreneurship', status: 'pending', accessType: 'free', price: 0, salesCount: 0, fullAssetUrl: 'https://storage.test/content/full/u1/song.mp3?read=1', ...over });

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
  installFetch();
  installXhr();
  mockDownload.mockReset();
  mockForget.mockReset();
  mockCopy.mockReset();
  hub.answers[`GET ${MINE}`] = ok(free());
  hub.answers[`GET /api/hub/prices`] = pricesAnswer();
});

const open = async () => {
  const handlers = { back: jest.fn(), saved: jest.fn() };
  const view = await renderFrame(<EditDetailsScreen id="f1" onBack={handlers.back} onSaved={handlers.saved} />);
  return { ...handlers, ...view };
};
const toPaid = async () => {
  await fireEvent.press(await screen.findByText('Paid'));
  await fireEvent.press(await screen.findByTestId('price-stop-1000'));
};

describe('Edit details, a free piece sent to paid needs no separate preview (R-118, UPLOAD-REST)', () => {
  it('an audio piece asks the Hub to make its preview: previewFromFile, no previewAsset, nothing uploaded', async () => {
    hub.answers[`PATCH ${PATCH}`] = ok(free({ accessType: 'paid', price: 1000 }));
    const handlers = await open();
    await toPaid();
    await fireEvent.press(screen.getByTestId('edit-save'));
    await waitFor(() => expect(handlers.saved).toHaveBeenCalledTimes(1));
    expect(calls('PATCH', PATCH)[0].body).toEqual({ accessType: 'paid', price: 1000, previewFromFile: true });
    expect(calls('POST', PRESIGN)).toHaveLength(0);
  });

  it('a paid piece changing its price sends no flag, and a title change on a free piece sends none', async () => {
    hub.answers[`GET ${MINE}`] = ok(free({ accessType: 'paid', price: 2500 }));
    hub.answers[`PATCH ${PATCH}`] = ok(free({ accessType: 'paid', price: 1000 }));
    const handlers = await open();
    await fireEvent.press(await screen.findByTestId('price-stop-1000'));
    await fireEvent.press(screen.getByTestId('edit-save'));
    await waitFor(() => expect(handlers.saved).toHaveBeenCalledTimes(1));
    expect(calls('PATCH', PATCH)[0].body).toEqual({ accessType: 'paid', price: 1000 });
  });

  it('a picture is made on the phone from the piece\'s own picture (a smaller copy), uploaded as its preview, and both phone copies are deleted', async () => {
    hub.answers[`GET ${MINE}`] = ok(free({ contentType: 'image', fullAssetUrl: 'https://storage.test/content/full/u1/art.png?read=1' }));
    hub.answers[`POST ${PRESIGN}`] = presigned('content/preview', 'small.jpg');
    hub.answers[`PATCH ${PATCH}`] = ok(free({ contentType: 'image', accessType: 'paid', price: 1000 }));
    mockDownload.mockResolvedValue({ exists: true, size: 9000, uri: 'file:///cache/edit-picture-1' });
    const discard = jest.fn();
    mockCopy.mockResolvedValue({ blob: new Blob([new Uint8Array(900)]), name: 'preview.jpg', contentType: 'image/jpeg', extension: 'jpg', previewUri: 'file:///cache/ImageManipulator/s.jpg', discard });
    const handlers = await open();
    await toPaid();
    await fireEvent.press(screen.getByTestId('edit-save'));
    await waitFor(() => expect(ScriptedXhr.last).not.toBeNull());
    await act(async () => {
      ScriptedXhr.last?.finish(200);
    });
    await waitFor(() => expect(handlers.saved).toHaveBeenCalledTimes(1));
    expect(mockDownload.mock.calls[0][0]).toBe('https://storage.test/content/full/u1/art.png?read=1');
    expect(calls('POST', PRESIGN)[0].body).toMatchObject({ folder: 'content/preview', format: 'image', contentType: 'image/jpeg' });
    expect(calls('PATCH', PATCH)[0].body).toEqual({ accessType: 'paid', price: 1000, previewAsset: 'https://storage.test/content/preview/u1/small.jpg?read=1' });
    expect(calls('PATCH', PATCH)[0].body).not.toHaveProperty('previewFromFile');
    expect(discard).toHaveBeenCalledTimes(1);
    expect(mockForget).toHaveBeenCalledWith(expect.stringContaining('edit-picture-'));
  });

  it('a picture the phone cannot read says so in words and sends nothing', async () => {
    hub.answers[`GET ${MINE}`] = ok(free({ contentType: 'image', fullAssetUrl: 'https://storage.test/content/full/u1/art.png?read=1' }));
    mockDownload.mockRejectedValue(new Error('offline'));
    const handlers = await open();
    await toPaid();
    await fireEvent.press(screen.getByTestId('edit-save'));
    expect(await screen.findByText('Your preview could not be made. Try again.')).toBeTruthy();
    expect(calls('PATCH', PATCH)).toHaveLength(0);
    expect(handlers.saved).not.toHaveBeenCalled();
  });

  it('a refusal from the Hub (a file too short to cut) is shown in its words, in the body under the form, and the screen scrolls to it', async () => {
    const words = 'This file is too short to make a preview from. Choose a longer one.';
    hub.answers[`PATCH ${PATCH}`] = refusal(400, words);
    await open();
    await toPaid();
    await fireEvent.press(screen.getByTestId('edit-save'));
    expect(await screen.findByText(words)).toBeTruthy();
    expect(screen.getByTestId('edit-failure')).toBeTruthy();
    expect(screen.getByTestId('edit-screen-scroll')).toContainElement(screen.getByTestId('edit-failure'));
  });

  it('leaving with a picture copy that went up but was never saved gives it back to the Hub', async () => {
    hub.answers[`GET ${MINE}`] = ok(free({ contentType: 'image', fullAssetUrl: 'https://storage.test/content/full/u1/art.png?read=1' }));
    hub.answers[`POST ${PRESIGN}`] = presigned('content/preview', 'small.jpg');
    hub.answers[`PATCH ${PATCH}`] = refusal(409, 'This piece was reviewed a moment ago. Open it again to see where it stands.');
    hub.answers[`POST ${RELEASE}`] = ok({ released: true });
    mockDownload.mockResolvedValue({ exists: true, size: 9000, uri: 'file:///cache/edit-picture-1' });
    mockCopy.mockResolvedValue({ blob: new Blob([new Uint8Array(900)]), name: 'preview.jpg', contentType: 'image/jpeg', extension: 'jpg', previewUri: 'file:///cache/ImageManipulator/s.jpg', discard: jest.fn() });
    const view = await open();
    await toPaid();
    await fireEvent.press(screen.getByTestId('edit-save'));
    await waitFor(() => expect(ScriptedXhr.last).not.toBeNull());
    await act(async () => {
      ScriptedXhr.last?.finish(200);
    });
    expect(await screen.findByText(/reviewed a moment ago/)).toBeTruthy();
    await view.unmount();
    await waitFor(() => expect(calls('POST', RELEASE)).toHaveLength(1));
    expect(calls('POST', RELEASE)[0].body).toEqual({ key: 'content/preview/u1/small.jpg' });
  });
});
