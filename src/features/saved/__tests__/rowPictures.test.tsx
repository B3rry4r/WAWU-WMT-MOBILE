/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, screen, within } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { hub, installFetch, ok, renderFrame } from '../../library/__helpers__/hub';
import { resetApp } from '@/features/store/testing/screen';

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
 * PREVIEWS-APP, rank 6 (M30): the Hub's thumbnail of a saved piece is the piece's public file, a clip or a PDF for most kinds. Only a
 * picture is handed to Image (no clip or PDF fetched to fail, no failed load flashing); every other tile draws the kind's mark.
 */
installFetch();
const { SavedScreen } = require('../SavedScreen') as typeof import('../SavedScreen');

const LIST = '/api/hub/me/saved';
const maker = { wawuId: 'w-chidi', displayName: 'Chidi Eze', handle: 'chidi', avatarUrl: null, verification: { creator: { verified: false, expiresAt: null }, professional: { verified: false, expiresAt: null } } };
const saved = (id: string, contentType: string, thumbnailUrl: string | null) => ({
  id: `s-${id}`,
  kind: 'content',
  savedAt: '2026-10-01T10:00:00.000Z',
  content: { id, title: `Piece ${id}`, contentType, accessType: 'free', priceKobo: null, thumbnailUrl, bought: false, creator: maker },
  event: null,
  creator: null,
});
const ITEMS = [
  saved('video', 'video', 'https://cdn.test/previews/clip.mp4?sig=1'),
  saved('course', 'course', 'https://cdn.test/previews/lesson-1.mp4?sig=1'),
  saved('audio', 'audio', 'https://cdn.test/previews/clip.mp3?sig=1'),
  saved('pdf', 'pdf', 'https://cdn.test/previews/pages.pdf?sig=1'),
  saved('tplpic', 'template', 'https://cdn.test/previews/cover.png?sig=1'),
  saved('photo', 'image', 'https://cdn.test/previews/shoot.jpg?sig=1'),
];

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
  installFetch();
  hub.answers[`GET ${LIST}`] = ok({ items: ITEMS, nextCursor: null });
});
afterEach(async () => {
  await resetApp();
  jest.restoreAllMocks();
});

/** The tile that holds a saved piece: found through its title, the way a person finds it. */
const tile = (id: string) => within(screen.getByLabelText(new RegExp(`^Piece ${id}`)));

describe('M30 · Saved (Android)', () => {
  it('a user sees pictures only where the Hub gave a picture, and the kind mark on a clip, a sound or a PDF, with no failed image load', async () => {
    await renderFrame(<SavedScreen onBack={jest.fn()} onOpenEvent={jest.fn()} onOpenContent={jest.fn()} />);
    await screen.findByText('Piece video');
    for (const [id, uri] of [['tplpic', 'https://cdn.test/previews/cover.png?sig=1'], ['photo', 'https://cdn.test/previews/shoot.jpg?sig=1']] as const) {
      expect(tile(id).getByTestId('saved-thumb-image').props.source).toEqual([{ uri }]);
      expect(tile(id).queryByTestId('saved-thumb-mark')).toBeNull();
    }
    for (const id of ['video', 'course', 'audio', 'pdf']) {
      expect(tile(id).getByTestId('saved-thumb-mark')).toBeTruthy();
      expect(tile(id).queryByTestId('saved-thumb-image')).toBeNull();
    }
    const drawn = JSON.stringify(screen.toJSON());
    for (const file of ['previews/clip.mp4', 'previews/lesson-1.mp4', 'previews/clip.mp3', 'previews/pages.pdf']) expect(drawn).not.toContain(file);
  });

  it('a picture that will not load gives way to the mark', async () => {
    await renderFrame(<SavedScreen onBack={jest.fn()} onOpenEvent={jest.fn()} onOpenContent={jest.fn()} />);
    await screen.findByText('Piece photo');
    await fireEvent(tile('photo').getByTestId('saved-thumb-image'), 'error', { nativeEvent: { error: 'not an image' } });
    expect(tile('photo').queryByTestId('saved-thumb-image')).toBeNull();
    expect(tile('photo').getByTestId('saved-thumb-mark')).toBeTruthy();
  });
});
