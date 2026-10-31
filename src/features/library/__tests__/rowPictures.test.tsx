/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, screen, within } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { allowance, hub, installFetch, ok, piece, renderFrame } from '../__helpers__/hub';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('expo-router', () => ({
  useFocusEffect: (run: () => void) => {
    require('react').useEffect(run, [run]);
  },
}));

/*
 * PREVIEWS-APP, rank 4 (M28, M26): a row decides picture or mark by the file the Hub gave, with the one shared check, never by the
 * piece's kind alone. A template whose cover is a picture shows it; a video, an audio, a PDF or a template whose preview is a PDF shows
 * the kind's mark; a picture that will not load gives way to the mark.
 */
installFetch();
const { LibraryScreen } = require('../LibraryScreen') as typeof import('../LibraryScreen');
const { RejectedScreen } = require('../RejectedScreen') as typeof import('../RejectedScreen');

const LIST = '/api/hub/content/mine/library';
const COUNTS = '/api/hub/content/mine/library/counts';
const ALLOWANCE = '/api/hub/uploads/allowance';
const page = (items: unknown[]) => ok(items, { currentPage: 1, nextPage: null, perPage: 20, total: items.length });

const pieces = [
  piece({ id: 'video', title: 'A clip', contentType: 'video', previewAssetUrl: 'https://cdn.test/previews/clip.mp4?sig=1' }),
  piece({ id: 'audio', title: 'A beat', contentType: 'audio', previewAssetUrl: 'https://cdn.test/previews/clip.mp3?sig=1' }),
  piece({ id: 'pdf', title: 'A book', contentType: 'pdf', previewAssetUrl: 'https://cdn.test/previews/pages.pdf?sig=1' }),
  piece({ id: 'tplpic', title: 'A deck', contentType: 'template', previewAssetUrl: 'https://cdn.test/previews/cover.png?sig=1' }),
  piece({ id: 'tplpdf', title: 'A form', contentType: 'template', previewAssetUrl: 'https://cdn.test/previews/cover.pdf?sig=1' }),
  piece({ id: 'photo', title: 'A shoot', contentType: 'image', previewAssetUrl: 'https://cdn.test/previews/shoot.jpg?sig=1' }),
];

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
  installFetch();
  hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(4, 5));
  hub.answers[`GET ${COUNTS}`] = ok({ all: 6, live: 6, pending: 0, rejected: 0 });
  hub.answers[`GET ${LIST}`] = page(pieces);
});
afterEach(() => {
  jest.restoreAllMocks();
});

const row = (id: string) => within(screen.getByTestId(`library-row-${id}`));

describe('M28 · My content (Android)', () => {
  it('a user sees a picture on a photo and on a template with a picture cover, and the kind mark on everything else', async () => {
    await renderFrame(<LibraryScreen onBack={jest.fn()} onCreate={jest.fn()} onSeeWhy={jest.fn()} />);
    await screen.findByText('A clip');
    for (const [id, uri] of [['tplpic', 'https://cdn.test/previews/cover.png?sig=1'], ['photo', 'https://cdn.test/previews/shoot.jpg?sig=1']] as const) {
      expect(row(id).getByTestId('library-thumb-image').props.source).toEqual([{ uri }]);
      expect(row(id).queryByTestId('library-thumb-mark')).toBeNull();
    }
    for (const id of ['video', 'audio', 'pdf', 'tplpdf']) {
      expect(row(id).getByTestId('library-thumb-mark')).toBeTruthy();
      expect(row(id).queryByTestId('library-thumb-image')).toBeNull();
    }
    // A clip, a sound or a PDF is never handed to Image.
    const drawn = JSON.stringify(screen.toJSON());
    for (const file of ['previews/clip.mp4', 'previews/clip.mp3', 'previews/pages.pdf', 'previews/cover.pdf']) expect(drawn).not.toContain(file);
  });

  it('a template cover that will not load gives way to the template mark', async () => {
    await renderFrame(<LibraryScreen onBack={jest.fn()} onCreate={jest.fn()} onSeeWhy={jest.fn()} />);
    await screen.findByText('A deck');
    await fireEvent(row('tplpic').getByTestId('library-thumb-image'), 'error', { nativeEvent: { error: 'not an image' } });
    expect(row('tplpic').queryByTestId('library-thumb-image')).toBeNull();
    expect(row('tplpic').getByTestId('library-thumb-mark')).toBeTruthy();
  });
});

describe('M26 · Rejected (Android)', () => {
  const MINE = '/api/hub/content/mine/library/r1';
  const rejected = (over: Record<string, unknown>) =>
    piece({ id: 'r1', title: 'A turned down piece', status: 'rejected', salesCount: 0, rejectionReason: 'Not clear.', rejectedAt: new Date().toISOString(), ...over });
  const open = () => renderFrame(<RejectedScreen id="r1" onBack={jest.fn()} onReplace={jest.fn()} onEdit={jest.fn()} onDeleted={jest.fn()} onSent={jest.fn()} />);

  it('a turned down template with a picture cover shows the picture', async () => {
    hub.answers[`GET ${MINE}`] = ok(rejected({ contentType: 'template', previewAssetUrl: 'https://cdn.test/previews/cover.png?sig=1' }));
    await open();
    await screen.findByText('Not approved');
    expect(screen.getByTestId('rejected-thumb-image').props.source).toEqual([{ uri: 'https://cdn.test/previews/cover.png?sig=1' }]);
    expect(screen.queryByTestId('rejected-thumb-mark')).toBeNull();
  });

  it('a turned down video, or a template with a PDF preview, shows the kind mark and is never handed to Image', async () => {
    hub.answers[`GET ${MINE}`] = ok(rejected({ contentType: 'template', previewAssetUrl: 'https://cdn.test/previews/cover.pdf?sig=1' }));
    await open();
    await screen.findByText('Not approved');
    expect(screen.getByTestId('rejected-thumb-mark')).toBeTruthy();
    expect(screen.queryByTestId('rejected-thumb-image')).toBeNull();
    expect(JSON.stringify(screen.toJSON())).not.toContain('previews/cover.pdf');
  });
});

describe('M28 and M26 · covers (R-114, Android)', () => {
  it('a user sees the cover of a video, an audio and a PDF in My content, and the preview picture when the cover will not load', async () => {
    hub.answers[`GET ${LIST}`] = page([
      piece({ id: 'cv', title: 'Covered video', contentType: 'video', previewAssetUrl: 'https://cdn.test/previews/clip.mp4?sig=1', coverUrl: 'https://cdn.test/covers/v.jpg?sig=1' }),
      piece({ id: 'ct', title: 'Covered deck', contentType: 'template', previewAssetUrl: 'https://cdn.test/previews/cover.png?sig=1', coverUrl: 'https://cdn.test/covers/t.png?sig=1' }),
    ]);
    await renderFrame(<LibraryScreen onBack={jest.fn()} onCreate={jest.fn()} onSeeWhy={jest.fn()} />);
    await screen.findByText('Covered video');
    expect(row('cv').getByTestId('library-thumb-image').props.source).toEqual([{ uri: 'https://cdn.test/covers/v.jpg?sig=1' }]);
    await fireEvent(row('ct').getByTestId('library-thumb-image'), 'error', { nativeEvent: { error: 'gone' } });
    expect(row('ct').getByTestId('library-thumb-image').props.source).toEqual([{ uri: 'https://cdn.test/previews/cover.png?sig=1' }]);
    await fireEvent(row('cv').getByTestId('library-thumb-image'), 'error', { nativeEvent: { error: 'gone' } });
    expect(row('cv').getByTestId('library-thumb-mark')).toBeTruthy();
  });

  it('a turned down video with a cover shows the cover on the Rejected card', async () => {
    hub.answers[`GET /api/hub/content/mine/library/r1`] = ok(
      piece({ id: 'r1', title: 'A turned down piece', status: 'rejected', salesCount: 0, rejectionReason: 'Not clear.', rejectedAt: new Date().toISOString(), contentType: 'video', previewAssetUrl: 'https://cdn.test/previews/clip.mp4?sig=1', coverUrl: 'https://cdn.test/covers/v.jpg?sig=1' }),
    );
    await renderFrame(<RejectedScreen id="r1" onBack={jest.fn()} onReplace={jest.fn()} onEdit={jest.fn()} onDeleted={jest.fn()} onSent={jest.fn()} />);
    await screen.findByText('Not approved');
    expect(screen.getByTestId('rejected-thumb-image').props.source).toEqual([{ uri: 'https://cdn.test/covers/v.jpg?sig=1' }]);
  });
});
