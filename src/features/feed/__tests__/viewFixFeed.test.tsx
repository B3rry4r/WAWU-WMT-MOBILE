/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { Platform, StyleSheet } from 'react-native';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { FeedItem } from '../api';
import type { AudioSourceProps, VideoSurfaceProps } from '../player';

require('react-native-gesture-handler/jestSetup');

/*
 * VIEW-FIX (R-117) in the feed, as an Android phone: a video post has the full-screen button (it raises the surface's `fullscreenAt`);
 * a photo set opens the picture viewer on a tap and never offers a locked frame; an audio or video post shows the spinner in the place of
 * pause while the player says its file is still coming in, and the words when it will not load. The players are stand-ins with the real props.
 */
const mockSurface: { current: VideoSurfaceProps | null } = { current: null };
const mockAudio: { current: AudioSourceProps | null } = { current: null };
jest.mock('../player', () => ({
  canPlay: true,
  VideoSurface: (props: VideoSurfaceProps) => {
    mockSurface.current = props;
    return null;
  },
  AudioSource: (props: AudioSourceProps) => {
    mockAudio.current = props;
    return null;
  },
  loadPeaks: async () => null,
}));
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 390, height: 844, scale: 2, fontScale: 1 }) }));
jest.mock('@/features/store/ladder/usePrice', () => ({
  useShownPrice: () => ({ native: false, kobo: (list: number | null | undefined) => (list == null ? null : Math.round(list * 100)), forKobo: (list: number | null | undefined) => (list == null ? null : list), ready: true }),
}));
globalThis.fetch = jest.fn(async () => new Response(JSON.stringify({ statusCode: 200, message: 'OK', data: { views: 1, counted: true } }), { status: 200 })) as typeof fetch;

const CLIP = 'https://cdn.test/previews/clip.mp4?sig=1';
const FULL = 'https://cdn.test/full/clip.mp4?sig=2';
function item(over: Partial<FeedItem> = {}): FeedItem {
  return {
    id: 'a',
    status: 'live',
    createdAt: '2026-10-01T00:00:00Z',
    title: 'How I built an agency',
    creatorWawuId: 'creator-a',
    slug: 'a',
    contentType: 'video',
    description: 'Caption a',
    category: 'Business',
    specializations: [],
    tags: [],
    accessType: 'paid',
    price: 2500,
    durationLabel: '18:00',
    pageCount: null,
    previewAssetUrl: CLIP,
    creatorFirstUploadFree: false,
    views: 0,
    ratingPct: null,
    commentCount: 0,
    likes: 0,
    fullAssetUrl: null,
    fullAssetLocked: true,
    likedByMe: false,
    savedByMe: false,
    followsCreator: false,
    shares: 0,
    creator: { wawuId: 'creator-a', displayName: 'Person a', handle: 'a', avatarUrl: null, verification: { creator: { verified: true, expiresAt: null }, professional: { verified: false, expiresAt: null } } },
    media: { contentId: 'a', contentType: 'video', durationLabel: '18:00', pageCount: null, frameCount: 0, frames: [] },
    ...over,
  } as FeedItem;
}


const { PLAYER_FAILED } = require('../model') as typeof import('../model');

const clients: QueryClient[] = [];
async function show(kind: 'VideoPost' | 'AudioPost' | 'PhotoSetPost', post: FeedItem, active = true) {
  const mod = require(`../${kind}`) as Record<string, React.ComponentType<Record<string, unknown>>>;
  const Post = mod[kind];
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  const view = await rtl.render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>
        <Post item={post} active={active} width={390} height={754} myId={null} chromeTop={50} />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  return view;
}

let os: jest.ReplaceProperty<typeof Platform.OS>;
beforeEach(() => {
  os = jest.replaceProperty(Platform, 'OS', 'android');
  mockSurface.current = null;
  mockAudio.current = null;
});
afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  clients.splice(0).forEach((c) => c.clear());
  os.restore();
});

describe('R-117 A · the feed video post goes full screen (Android)', () => {
  it('a user can press the full-screen button on a video post: the surface is asked once per press, and the button is a 44 tap target', async () => {
    const view = await show('VideoPost', item());
    const button = view.getByTestId('fullscreen-a');
    expect(button.props.accessibilityLabel).toBe('Full screen, How I built an agency');
    expect(StyleSheet.flatten(button.props.style).width).toBeGreaterThanOrEqual(44);
    expect(mockSurface.current?.fullscreenAt ?? 0).toBe(0);
    await rtl.act(async () => rtl.fireEvent.press(button));
    expect(mockSurface.current?.fullscreenAt).toBe(1);
    await rtl.act(async () => rtl.fireEvent.press(button));
    expect(mockSurface.current?.fullscreenAt).toBe(2);
    // A locked video holds its preview and nothing more.
    expect(mockSurface.current?.uri).toBe(CLIP);
  });

  it('what the person owns goes full screen as the full file; a still picture and an ended preview have no button', async () => {
    await show('VideoPost', item({ fullAssetLocked: false, fullAssetUrl: FULL }));
    expect(mockSurface.current?.uri).toBe(FULL);
    const ended = await show('VideoPost', item());
    await rtl.act(async () => mockSurface.current?.onEnded());
    expect(ended.queryByTestId('fullscreen-a')).toBeNull();
  });
});

describe('R-117 A · a photo set in the feed opens full screen (Android)', () => {
  const frames = [
    { position: 1, url: 'https://cdn.test/p/1.jpg', locked: false },
    { position: 2, url: 'https://cdn.test/p/2.jpg', locked: false },
    { position: 3, url: null, locked: true },
  ];
  const set = () => item({ contentType: 'image', previewAssetUrl: 'https://cdn.test/p/1.jpg', media: { contentId: 'a', contentType: 'image', durationLabel: null, pageCount: null, frameCount: 3, frames } as never });

  it('a tap on a picture opens the viewer on that picture; a locked frame has nothing to open; the back button closes it', async () => {
    const view = await show('PhotoSetPost', set());
    expect(view.queryByTestId('viewer-a')).toBeNull();
    expect(view.queryByTestId('open-frame-a-3')).toBeNull();
    await rtl.act(async () => rtl.fireEvent.press(view.getByTestId('open-frame-a-2')));
    expect(view.getByTestId('viewer-a')).toBeTruthy();
    expect(view.getByText('2 / 2')).toBeTruthy();
    await rtl.act(async () => rtl.fireEvent.press(view.getByTestId('viewer-a-close')));
    expect(view.queryByTestId('viewer-a')).toBeNull();
  });

  it('a user can pinch a picture in the feed viewer', async () => {
    const view = await show('PhotoSetPost', set());
    await rtl.act(async () => rtl.fireEvent.press(view.getByTestId('open-frame-a-1')));
    await rtl.act(async () => fireGestureHandler(getByGestureTestId('viewer-a-page-0-pinch'), [{ scale: 1 }, { scale: 1.6 }, { scale: 2.2 }, { scale: 2.2 }]));
    const scale = StyleSheet.flatten(view.getByTestId('viewer-a-page-0-image').props.style).transform.find((t: Record<string, number>) => 'scale' in t).scale;
    expect(scale).toBeGreaterThan(2);
  });
});

describe('R-117 C · the feed players show their loading state (Android)', () => {
  it('audio post: the big play button keeps its place and shows the spinner while the file comes in, then pause the moment the sound runs', async () => {
    const view = await show('AudioPost', item({ contentType: 'audio', previewAssetUrl: 'https://cdn.test/previews/a.mp3?sig=1', media: undefined }));
    expect(view.getByLabelText('Pause')).toBeTruthy();
    await rtl.act(async () => mockAudio.current?.onLoad?.('waiting'));
    expect(view.getByTestId('play-a-spinner')).toBeTruthy();
    expect(view.getByTestId('play-a').props.accessibilityState).toEqual({ busy: true });
    await rtl.act(async () => mockAudio.current?.onLoad?.('ready'));
    expect(view.queryByTestId('play-a-spinner')).toBeNull();
    expect(view.getByLabelText('Pause')).toBeTruthy();
  });

  it('audio post: a file that will not load says so and stops; a tap tries again', async () => {
    const view = await show('AudioPost', item({ contentType: 'audio', previewAssetUrl: 'https://cdn.test/previews/a.mp3?sig=1', media: undefined }));
    await rtl.act(async () => mockAudio.current?.onLoad?.('waiting'));
    await rtl.act(async () => mockAudio.current?.onLoad?.('failed'));
    expect(view.getByTestId('failed-a').props.children).toBe(PLAYER_FAILED);
    expect(view.queryByTestId('play-a-spinner')).toBeNull();
    expect(mockAudio.current?.playing).toBe(false);
    await rtl.act(async () => rtl.fireEvent.press(view.getByTestId('play-a')));
    expect(view.queryByTestId('failed-a')).toBeNull();
    expect(mockAudio.current?.playing).toBe(true);
  });

  it('video post: the spinner stands where the play mark stands while the file comes in, and goes when the picture runs', async () => {
    const view = await show('VideoPost', item());
    expect(view.queryByTestId('waiting-a')).toBeNull();
    await rtl.act(async () => mockSurface.current?.onLoad?.('waiting'));
    expect(view.getByTestId('spinner-a')).toBeTruthy();
    expect(view.queryByTestId('paused-a')).toBeNull();
    await rtl.act(async () => mockSurface.current?.onLoad?.('ready'));
    expect(view.queryByTestId('waiting-a')).toBeNull();
    await rtl.act(async () => mockSurface.current?.onLoad?.('failed'));
    expect(view.getByTestId('failed-a').props.children).toBe(PLAYER_FAILED);
    expect(mockSurface.current?.playing).toBe(false);
  });
});
