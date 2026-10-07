/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';

import type { FeedItem } from '../api';
import type { VideoSurfaceProps } from '../player';

/*
 * The real player is the browser's <video> (player/index.web.tsx), which jest cannot run.
 * This stand-in has the same props and keeps the latest ones, so these tests see what the
 * post tells its player (which file, whether the frame is frosted) and can make the file
 * "end" the way the browser does, through the `onEnded` the post gave it.
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

const PREVIEW = 'https://cdn.test/a-preview.webm';
const FULL = 'https://cdn.test/a-full.webm';

function video(over: Partial<FeedItem> = {}): FeedItem {
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
    accessType: 'free',
    price: 0,
    durationLabel: '18:00',
    pageCount: null,
    previewAssetUrl: PREVIEW,
    creatorFirstUploadFree: false,
    views: 0,
    ratingPct: null,
    commentCount: 0,
    likes: 0,
    fullAssetUrl: FULL,
    fullAssetLocked: false,
    likedByMe: false,
    savedByMe: false,
    followsCreator: false,
    shares: 0,
    creator: { wawuId: 'creator-a', displayName: 'Person a', handle: 'a', avatarUrl: null, verification: { creator: { verified: true, expiresAt: null }, professional: { verified: false, expiresAt: null } } },
    media: { contentId: 'a', contentType: 'video', durationLabel: '18:00', pageCount: null, frameCount: 0, frames: [] },
    ...over,
  } as FeedItem;
}
/** Paid and not bought: the Hub holds the full file back. Here it also (wrongly) sends one. */
const lockedVideo = (over: Partial<FeedItem> = {}) => video({ accessType: 'paid', price: 2500, fullAssetLocked: true, ...over });

const clients: QueryClient[] = [];

async function show(item: FeedItem, active = true) {
  const { VideoPost } = require('../VideoPost') as typeof import('../VideoPost');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  return rtl.render(
    <QueryClientProvider client={client}>
      <VideoPost item={item} active={active} width={390} height={754} myId={null} chromeTop={50} />
    </QueryClientProvider>,
  );
}

/* The first render loads the feed's modules (slow on a loaded machine): pay that here, not in a test's own budget. */
beforeAll(async () => {
  const screen = await show(video());
  await screen.unmount();
}, 120_000);

beforeEach(() => {
  mockSurface.current = null;
});
afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  clients.splice(0).forEach((c) => c.clear());
});

describe('H5: a locked video', () => {
  it('plays only its public preview, even when the Hub sends a full file with it (M12)', async () => {
    await show(lockedVideo());
    expect(mockSurface.current?.uri).toBe(PREVIEW);
    expect(mockSurface.current?.uri).not.toBe(FULL);
  });

  it('a video the viewer may watch plays the full file', async () => {
    await show(video());
    expect(mockSurface.current?.uri).toBe(FULL);
  });

  it('frosts the frame, says "Preview ended" and hides the scrubber when the preview ends (M18)', async () => {
    const screen = await show(lockedVideo());
    expect(mockSurface.current?.frosted).toBe(false);
    expect(screen.queryByTestId('preview-ended-a')).toBeNull();
    expect(screen.getByTestId('scrub-a')).toBeTruthy();

    await rtl.act(async () => {
      mockSurface.current?.onEnded();
    });

    expect(mockSurface.current?.frosted).toBe(true);
    expect(screen.getByTestId('preview-ended-a')).toBeTruthy();
    expect(screen.getByText('Preview ended')).toBeTruthy();
    expect(screen.getByText('The full 18-minute video is one tap away.')).toBeTruthy();
    expect(screen.queryByTestId('scrub-a')).toBeNull();
    expect(mockSurface.current?.playing).toBe(false);
  });

  it('a video that is free just stops at its end: no frost, no message', async () => {
    const screen = await show(video());
    await rtl.act(async () => {
      mockSurface.current?.onEnded();
    });
    expect(mockSurface.current?.frosted).toBe(false);
    expect(screen.queryByTestId('preview-ended-a')).toBeNull();
    expect(screen.queryByText('Preview ended')).toBeNull();
  });
});
