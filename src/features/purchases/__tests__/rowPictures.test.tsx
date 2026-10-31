/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, screen, within } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { hub, installFetch, ok, renderFrame } from '../../library/__helpers__/hub';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

/*
 * PREVIEWS-APP, rank 6 (M29): the Hub's thumbnail of a purchase is the piece's public file, a clip or a PDF for most kinds. Only a
 * picture is handed to Image (the phone no longer fetches a clip or a PDF to fail decoding it, and no failed load flashes); every other
 * row draws the kind's mark from the first frame.
 */
installFetch();
const { PurchasesScreen } = require('../PurchasesScreen') as typeof import('../PurchasesScreen');

const LIST = '/api/hub/me/purchases/all';
const maker = { wawuId: 'w-kemi', displayName: 'Kemi Okafor', handle: 'kemi', avatarUrl: null, verification: { creator: { verified: false, expiresAt: null }, professional: { verified: false, expiresAt: null } } };
const entry = (id: string, contentType: string, thumbnailUrl: string | null, coverUrl: string | null = null) => ({
  id,
  kind: 'content_unlock',
  title: `Piece ${id}`,
  amountKobo: 250000,
  totalKobo: null,
  purchasedAt: `${new Date().getFullYear()}-02-26T10:00:00.000Z`,
  status: 'paid',
  openId: `c-${id}`,
  content: { id: `c-${id}`, title: `Piece ${id}`, contentType, thumbnailUrl, coverUrl, creator: maker },
  lessons: null,
  credits: null,
});

const ENTRIES = [
  entry('video', 'video', 'https://cdn.test/previews/clip.mp4?sig=1'),
  entry('course', 'course', 'https://cdn.test/previews/lesson-1.mp4?sig=1'),
  entry('audio', 'audio', 'https://cdn.test/previews/clip.mp3?sig=1'),
  entry('pdf', 'pdf', 'https://cdn.test/previews/pages.pdf?sig=1'),
  entry('tplpic', 'template', 'https://cdn.test/previews/cover.png?sig=1'),
  entry('photo', 'image', 'https://cdn.test/previews/shoot.jpg?sig=1'),
  entry('none', 'video', null),
  entry('cov', 'video', 'https://cdn.test/previews/clip.mp4?sig=1', 'https://cdn.test/covers/v.jpg?sig=1'),
];

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
  installFetch();
  hub.answers[`GET ${LIST}`] = ok({ items: ENTRIES, nextCursor: null });
});
afterEach(() => {
  jest.restoreAllMocks();
});

const row = (id: string) => within(screen.getByTestId(`purchase-row-${id}`));

describe('M29 · My purchases (Android)', () => {
  it('a user sees pictures only where the Hub gave a picture, and the kind mark on a clip, a sound, a PDF or nothing, with no failed image load', async () => {
    await renderFrame(<PurchasesScreen onBack={jest.fn()} />);
    await screen.findByText('Piece video');
    for (const [id, uri] of [['tplpic', 'https://cdn.test/previews/cover.png?sig=1'], ['photo', 'https://cdn.test/previews/shoot.jpg?sig=1']] as const) {
      expect(row(id).getByTestId('purchase-thumb-image').props.source).toEqual([{ uri }]);
      expect(row(id).queryByTestId('purchase-thumb-mark')).toBeNull();
    }
    for (const id of ['video', 'course', 'audio', 'pdf', 'none']) {
      expect(row(id).getByTestId('purchase-thumb-mark')).toBeTruthy();
      expect(row(id).queryByTestId('purchase-thumb-image')).toBeNull();
    }
    const drawn = JSON.stringify(screen.toJSON());
    for (const file of ['previews/clip.mp4', 'previews/lesson-1.mp4', 'previews/clip.mp3', 'previews/pages.pdf']) expect(drawn).not.toContain(file);
  });

  it('a picture that will not load gives way to the mark', async () => {
    await renderFrame(<PurchasesScreen onBack={jest.fn()} />);
    await screen.findByText('Piece video');
    await fireEvent(row('photo').getByTestId('purchase-thumb-image'), 'error', { nativeEvent: { error: 'not an image' } });
    expect(row('photo').queryByTestId('purchase-thumb-image')).toBeNull();
    expect(row('photo').getByTestId('purchase-thumb-mark')).toBeTruthy();
  });
});

describe('M29 · covers (R-114, Android)', () => {
  it('a user sees the cover of a bought video, and the mark when it will not load', async () => {
    await renderFrame(<PurchasesScreen onBack={jest.fn()} />);
    await screen.findByText('Piece cov');
    expect(row('cov').getByTestId('purchase-thumb-image').props.source).toEqual([{ uri: 'https://cdn.test/covers/v.jpg?sig=1' }]);
    await fireEvent(row('cov').getByTestId('purchase-thumb-image'), 'error', { nativeEvent: { error: 'gone' } });
    expect(row('cov').getByTestId('purchase-thumb-mark')).toBeTruthy();
  });
});
