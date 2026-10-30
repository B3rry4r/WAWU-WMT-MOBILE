/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-router', () => ({ useIsFocused: () => true }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

/*
 * PREVIEWS-APP, rank 3 (X6, X7): a content row in a search result never draws an empty square. The Hub gives the piece's public file, a
 * clip, a sound or a PDF for most kinds; only a picture is handed to Image, and every other row (or a picture that will not load) draws
 * the kind's mark, as the other lists do.
 */
const ok = (data: unknown, status = 200) => ({ status, body: { statusCode: status, message: 'OK', data } });
let answers: Record<string, ReturnType<typeof ok>> = {};

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const key = `${request.method} ${url.pathname.replace(/^\/api\/hub/, '')}`;
  const answer = answers[key];
  if (!answer) throw new Error(`no answer for ${key}`);
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { SearchScreen } = require('../SearchScreen') as typeof import('../SearchScreen');

const ticks = { creator: { verified: false, expiresAt: null }, professional: { verified: false, expiresAt: null } };
const kemi = { wawuId: 'c-kemi', name: 'Kemi Okafor', handle: 'kemi', avatarUrl: null, field: 'Coach', verification: ticks, following: false };
const piece = (id: string, contentType: string, previewAssetUrl: string, over: Record<string, unknown> = {}) => ({
  id, title: `Piece ${id}`, creatorWawuId: 'c-kemi', contentType, accessType: 'paid', price: 3000, previewAssetUrl, fullAssetLocked: true, ...over,
});

const PIECES = [
  piece('video', 'video', 'https://cdn.test/previews/clip.mp4?sig=1'),
  piece('course', 'course', 'https://cdn.test/previews/lesson-1.mp4?sig=1'),
  piece('audio', 'audio', 'https://cdn.test/previews/clip.mp3?sig=1'),
  piece('pdf', 'pdf', 'https://cdn.test/previews/pages.pdf?sig=1'),
  piece('photo', 'image', 'https://cdn.test/previews/photo.jpg?sig=1'),
  piece('tplpic', 'template', 'https://cdn.test/previews/cover.png?sig=1'),
  piece('tplpdf', 'template', 'https://cdn.test/previews/cover.pdf?sig=1'),
  piece('nothing', 'video', ''),
];

function wrap() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>
        <SearchScreen onCancel={jest.fn()} onOpenRoom={jest.fn()} />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

async function searchContent() {
  answers = {
    'GET /users/me': ok({ wawuUserId: 'me-1' }),
    'GET /search/suggestions': ok({ recentSearches: ['pricing'], popularSearches: [], suggestedCreators: [] }),
    'GET /search/popular': ok({ items: [] }),
    'GET /search/people': ok({ items: [kemi] }),
    'GET /search': ok({ content: PIECES, creators: [], communities: [] }),
    'POST /search/recent': ok({ items: ['pricing'] }, 201),
  };
  await rtl.render(wrap());
  await rtl.fireEvent.press(await rtl.screen.findByText('pricing'));
  await rtl.fireEvent.press(await rtl.screen.findByTestId('search-tab-content'));
  await rtl.screen.findByTestId('search-content-video');
}

const row = (id: string) => rtl.within(rtl.screen.getByTestId(`search-content-${id}`));

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
  queryClient.clear();
});
afterEach(async () => {
  await queryClient.cancelQueries();
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  rtl.cleanup();
  queryClient.getMutationCache().getAll().forEach((mutation) => mutation.destroy());
  queryClient.clear();
  jest.restoreAllMocks();
});

describe('X7 · the Content tab', () => {
  it('a user sees the kind mark, never an empty square, on a video, a course, an audio, a PDF and a template whose preview is a PDF', async () => {
    await searchContent();
    for (const id of ['video', 'course', 'audio', 'pdf', 'tplpdf', 'nothing']) {
      expect(row(id).getByTestId('search-thumb-mark')).toBeTruthy();
      // The clip, the sound or the PDF is never handed to Image (the phone would fetch it to fail decoding it).
      expect(row(id).queryByTestId('search-thumb-image')).toBeNull();
    }
    // Nothing on the screen carries those files as a picture source at all.
    const drawn = JSON.stringify(rtl.screen.toJSON());
    for (const file of ['previews/clip.mp4', 'previews/lesson-1.mp4', 'previews/clip.mp3', 'previews/pages.pdf', 'previews/cover.pdf']) expect(drawn).not.toContain(file);
  });

  it('a user sees the picture on a photo and on a template whose preview is a picture, and no mark under it', async () => {
    await searchContent();
    for (const [id, uri] of [['photo', 'https://cdn.test/previews/photo.jpg?sig=1'], ['tplpic', 'https://cdn.test/previews/cover.png?sig=1']] as const) {
      expect(row(id).getByTestId('search-thumb-image').props.source).toEqual([{ uri }]);
      expect(row(id).queryByTestId('search-thumb-mark')).toBeNull();
    }
  });

  it('a picture that will not load gives way to the mark of its kind', async () => {
    await searchContent();
    await rtl.act(async () => {
      rtl.fireEvent(row('photo').getByTestId('search-thumb-image'), 'error', { nativeEvent: { error: 'not an image' } });
    });
    expect(row('photo').queryByTestId('search-thumb-image')).toBeNull();
    expect(row('photo').getByTestId('search-thumb-mark')).toBeTruthy();
  });

  it('a paid row keeps its lock over the mark, and the row still says what it is and what it costs', async () => {
    await searchContent();
    expect(row('video').getByText('Kemi Okafor · Video')).toBeTruthy();
    expect(row('video').getByTestId('search-thumb-lock')).toBeTruthy();
  });
});
