/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { ContentPiece } from '../api';

const { ContentGrid } = require('@/features/me/ContentGrid') as typeof import('@/features/me/ContentGrid');
const { tileOf, visitorTileOf } = require('@/features/me/model') as typeof import('@/features/me/model');

/*
 * PREVIEWS-APP, rank 4 (M1): the Content tab, on the person's own profile and on a visitor's, decides picture or mark by the file the
 * Hub gave. A template whose cover is a picture shows it; a video, an audio, a PDF, a course or a template with a PDF preview shows the
 * kind's mark; a photo shows itself.
 */
const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const frame = (children: React.ReactNode) => <SafeAreaProvider initialMetrics={metrics}>{children}</SafeAreaProvider>;
const piece = (id: string, contentType: string, previewAssetUrl: string, over: Partial<ContentPiece> = {}) =>
  ({ id, title: `Piece ${id}`, contentType, accessType: 'free', price: 0, views: 120, previewAssetUrl, fullAssetLocked: false, ...over }) as ContentPiece;

const PIECES = [
  piece('video', 'video', 'https://cdn.test/previews/clip.mp4?sig=1'),
  piece('course', 'course', 'https://cdn.test/previews/lesson-1.mp4?sig=1'),
  piece('audio', 'audio', 'https://cdn.test/previews/clip.mp3?sig=1'),
  piece('pdf', 'pdf', 'https://cdn.test/previews/pages.pdf?sig=1'),
  piece('tplpic', 'template', 'https://cdn.test/previews/cover.png?sig=1'),
  piece('tplpdf', 'template', 'https://cdn.test/previews/cover.pdf?sig=1'),
  piece('photo', 'image', 'https://cdn.test/previews/shoot.jpg?sig=1'),
];

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
});
afterEach(() => {
  jest.restoreAllMocks();
});

const tile = (id: string) => within(screen.getByTestId(`me-tile-${id}`));

describe.each([
  ['own profile', (p: ContentPiece) => tileOf(p)],
  ['a visitor', (p: ContentPiece) => visitorTileOf(p)],
])('M1 · the Content tab on %s (Android)', (_who, make) => {
  it('a user sees a picture on a photo and on a template with a picture cover, and the kind mark on every other tile', async () => {
    await render(frame(<ContentGrid tiles={PIECES.map(make)} />));
    for (const [id, uri] of [['tplpic', 'https://cdn.test/previews/cover.png?sig=1'], ['photo', 'https://cdn.test/previews/shoot.jpg?sig=1']] as const) {
      expect(tile(id).getByTestId('grid-thumb-image').props.source).toEqual([{ uri }]);
      expect(tile(id).queryByTestId('grid-thumb-mark')).toBeNull();
    }
    for (const id of ['video', 'course', 'audio', 'pdf', 'tplpdf']) {
      expect(tile(id).getByTestId('grid-thumb-mark')).toBeTruthy();
      expect(tile(id).queryByTestId('grid-thumb-image')).toBeNull();
    }
    const drawn = JSON.stringify(screen.toJSON());
    for (const file of ['previews/clip.mp4', 'previews/lesson-1.mp4', 'previews/clip.mp3', 'previews/pages.pdf', 'previews/cover.pdf']) expect(drawn).not.toContain(file);
  });

  it('a template cover that will not load gives way to the template mark', async () => {
    await render(frame(<ContentGrid tiles={PIECES.map(make)} />));
    await fireEvent(tile('tplpic').getByTestId('grid-thumb-image'), 'error', { nativeEvent: { error: 'not an image' } });
    expect(tile('tplpic').queryByTestId('grid-thumb-image')).toBeNull();
    expect(tile('tplpic').getByTestId('grid-thumb-mark')).toBeTruthy();
  });
});
