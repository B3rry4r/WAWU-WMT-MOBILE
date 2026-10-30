/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { Platform } from 'react-native';

import type { FeedItem } from '../api';
import type { VideoSurfaceProps } from '../player';

/*
 * PREVIEWS-APP, rank 2 (H2, H7): a video or a course card in the feed was plain black until its player had its first frame (the player is
 * transparent until then). It now draws the kind's mark behind the player until the first frame is in, and not after. Nothing new plays:
 * a post plays only while it is the one on screen, as before. The player is a stand-in with the real props (as VideoPost.test.tsx).
 */
const mockSurface: { current: VideoSurfaceProps | null } = { current: null };
jest.mock('../player', () => ({
  canPlay: true,
  VideoSurface: (props: VideoSurfaceProps) => {
    mockSurface.current = props;
    return null;
  },
  AudioSource: () => null,
  loadPeaks: async () => null,
}));

globalThis.fetch = jest.fn(async () => new Response(JSON.stringify({ statusCode: 200, message: 'OK', data: { views: 1, counted: true } }), { status: 200 })) as typeof fetch;

const CLIP = 'https://cdn.test/previews/clip.mp4?sig=1';
const LESSON = 'https://cdn.test/previews/lesson-1.mp4?sig=1';
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

const clients: QueryClient[] = [];
async function show(post: FeedItem, active = true, course = false) {
  const { VideoPost } = require('../VideoPost') as typeof import('../VideoPost');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  const view = await rtl.render(
    <QueryClientProvider client={client}>
      <VideoPost item={post} active={active} width={390} height={754} myId={null} chromeTop={50} course={course} />
    </QueryClientProvider>,
  );
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  return view;
}

beforeAll(async () => {
  const view = await show(item());
  await view.unmount();
}, 120_000);

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
  mockSurface.current = null;
});
afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  clients.splice(0).forEach((c) => c.clear());
  jest.restoreAllMocks();
});

describe('H2: a video card (Android)', () => {
  it('a user scrolling to a video sees the video mark until its first frame is in, and the frame after, not plain black', async () => {
    const view = await show(item());
    expect(view.getByTestId('video-mark-a')).toBeTruthy();
    expect(mockSurface.current?.uri).toBe(CLIP);
    await rtl.act(async () => {
      mockSurface.current?.onFirstFrame?.();
    });
    expect(view.queryByTestId('video-mark-a')).toBeNull();
  });

  it('a card that is not on screen shows the mark too, and plays nothing', async () => {
    const view = await show(item(), false);
    expect(view.getByTestId('video-mark-a')).toBeTruthy();
    expect(mockSurface.current?.playing).toBe(false);
  });

  it('a card on screen plays as it did; the mark changes nothing about playing', async () => {
    await show(item(), true);
    expect(mockSurface.current?.playing).toBe(true);
  });

  it('unlocking plays a new file, and its first frame is awaited behind the mark again', async () => {
    const view = await show(item());
    await rtl.act(async () => {
      mockSurface.current?.onFirstFrame?.();
    });
    expect(view.queryByTestId('video-mark-a')).toBeNull();
    const { VideoPost } = require('../VideoPost') as typeof import('../VideoPost');
    await view.rerender(
      <QueryClientProvider client={clients[clients.length - 1]}>
        <VideoPost item={item({ fullAssetLocked: false, fullAssetUrl: FULL })} active width={390} height={754} myId={null} chromeTop={50} />
      </QueryClientProvider>,
    );
    expect(mockSurface.current?.uri).toBe(FULL);
    expect(view.getByTestId('video-mark-a')).toBeTruthy();
  });
});

describe('H7: a course card (Android)', () => {
  it('a course shows its mark until the first frame of its free lesson is in', async () => {
    const view = await show(item({ contentType: 'course', previewAssetUrl: LESSON }), true, true);
    expect(view.getByTestId('video-mark-a')).toBeTruthy();
    await rtl.act(async () => {
      mockSurface.current?.onFirstFrame?.();
    });
    expect(view.queryByTestId('video-mark-a')).toBeNull();
  });

  it('a course whose preview is a picture draws the picture and no player, so no mark', async () => {
    const view = await show(item({ contentType: 'course', previewAssetUrl: 'https://cdn.test/previews/cover.jpg' }), true, true);
    expect(view.getByTestId('still-a')).toBeTruthy();
    expect(view.queryByTestId('video-mark-a')).toBeNull();
  });
});
