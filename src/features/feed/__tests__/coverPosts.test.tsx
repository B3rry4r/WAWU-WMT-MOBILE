/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { FeedItem } from '../api';
import type { VideoSurfaceProps } from '../player';
import { fireEvent } from '@testing-library/react-native';

/*
 * COVERS-APP (R-114): a feed card draws the creator's cover. A video's or a course's is the picture under the player until its first frame; an
 * audio's is its square; a template's is its frame, before its own preview. A cover that will not load gives way to the mark (or the preview).
 * (Harness as videoPostLoading.test.tsx.)
 *
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


const COVER = 'https://cdn.test/covers/v.jpg?sig=1';
const errorEvent = () => ({ nativeEvent: { error: 'gone' } });

describe('H2 and H7: a video or a course card with a cover (Android)', () => {
  it('a user scrolling to a video sees its cover until the first frame is in, then the frame', async () => {
    const view = await show(item({ coverUrl: COVER }));
    expect(view.getByTestId('cover-a').props.source).toEqual([{ uri: COVER }]);
    expect(view.queryByTestId('video-mark-a')).toBeNull();
    await rtl.act(async () => {
      mockSurface.current?.onFirstFrame?.();
    });
    expect(view.queryByTestId('cover-a')).toBeNull();
  });

  it('a cover that will not load gives way to the kind mark', async () => {
    const view = await show(item({ coverUrl: COVER }));
    await rtl.act(async () => {
      fireEvent(view.getByTestId('cover-a'), 'error', errorEvent());
    });
    expect(view.queryByTestId('cover-a')).toBeNull();
    expect(view.getByTestId('video-mark-a')).toBeTruthy();
  });

  it('a course whose preview is a picture draws the cover first, and the preview picture when the cover will not load', async () => {
    const view = await show(item({ contentType: 'course', previewAssetUrl: 'https://cdn.test/previews/cover.jpg', coverUrl: COVER }), true, true);
    expect(view.getByTestId('still-a').props.source).toEqual([{ uri: COVER }]);
    await rtl.act(async () => {
      fireEvent(view.getByTestId('still-a'), 'error', errorEvent());
    });
    expect(view.getByTestId('still-a').props.source).toEqual([{ uri: 'https://cdn.test/previews/cover.jpg' }]);
  });
});

describe('H6 and H8: an audio and a template card with a cover (Android)', () => {
  const wrap = (node: React.ReactElement) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
    clients.push(client);
    return rtl.render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
  };

  it('an audio card draws its cover in the square, in place of the audio mark', async () => {
    const { AudioPost } = require('../AudioPost') as typeof import('../AudioPost');
    const view = await wrap(<AudioPost item={item({ contentType: 'audio', previewAssetUrl: 'https://cdn.test/previews/clip.mp3', coverUrl: COVER })} active width={390} height={754} myId={null} chromeTop={50} />);
    expect(view.getByTestId('art-image-a').props.source).toEqual([{ uri: COVER }]);
    await rtl.act(async () => {
      fireEvent(view.getByTestId('art-image-a'), 'error', errorEvent());
    });
    expect(view.queryByTestId('art-image-a')).toBeNull();
    expect(view.getByTestId('art-a')).toBeTruthy();
  });

  it('a template card draws the cover before its own preview, and its mark when neither loads', async () => {
    const { TemplatePost } = require('../TemplatePost') as typeof import('../TemplatePost');
    const view = await wrap(<TemplatePost item={item({ contentType: 'template', previewAssetUrl: 'https://cdn.test/previews/cover.png', coverUrl: COVER })} active width={390} height={754} myId={null} chromeTop={50} />);
    expect(view.getByTestId('cover-a').props.source).toEqual([{ uri: COVER }]);
    await rtl.act(async () => {
      fireEvent(view.getByTestId('cover-a'), 'error', errorEvent());
    });
    expect(view.getByTestId('cover-a').props.source).toEqual([{ uri: 'https://cdn.test/previews/cover.png' }]);
    await rtl.act(async () => {
      fireEvent(view.getByTestId('cover-a'), 'error', errorEvent());
    });
    expect(view.getByTestId('cover-a-none')).toBeTruthy();
  });

  it('the creator card\'s work tile draws the work\'s cover, then its thumbnail picture, then nothing but the kind\'s badge', async () => {
    const { FeedCreatorCard } = require('../FeedCreatorCard') as typeof import('../FeedCreatorCard');
    const work = { id: 'w1', contentType: 'video', accessType: 'free', price: 0, locked: false, title: 'Free clip', thumbnailUrl: 'https://cdn.test/thumbs/w1.jpg', coverUrl: COVER, durationLabel: '4:12', pageCount: null, frameCount: 0, views: 12000 };
    const card = { wawuId: 'u1', displayName: 'Zainab Bello', handle: 'zainab', headline: 'Trainer', avatarUrl: null, coverUrl: null, verification: { creator: { verified: true, expiresAt: null }, professional: { verified: false, expiresAt: null } }, badge: null, followers: 18200, posts: 64, rating: null, knownFollowers: { count: 0, people: [] }, works: [work], followsCreator: false };
    const view = await wrap(<FeedCreatorCard card={card as never} width={390} height={754} chromeTop={50} />);
    expect(view.getByTestId('work-image-w1').props.source).toEqual([{ uri: COVER }]);
    await rtl.act(async () => {
      fireEvent(view.getByTestId('work-image-w1'), 'error', errorEvent());
    });
    expect(view.getByTestId('work-image-w1').props.source).toEqual([{ uri: 'https://cdn.test/thumbs/w1.jpg' }]);
    await rtl.act(async () => {
      fireEvent(view.getByTestId('work-image-w1'), 'error', errorEvent());
    });
    expect(view.queryByTestId('work-image-w1')).toBeNull();
  });

  it('a PDF card draws its cover as the front of its book (pressing it still reads), the generated cover when it has none', async () => {
    const { PdfPost } = require('../PdfPost') as typeof import('../PdfPost');
    const area = (node: React.ReactElement) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{node}</SafeAreaProvider>;
    const view = await wrap(area(<PdfPost item={item({ contentType: 'pdf', previewAssetUrl: 'https://cdn.test/previews/pages.pdf', coverUrl: COVER, pageCount: 84 })} active width={390} height={754} myId={null} chromeTop={50} />));
    expect(view.getByTestId('book-cover-a').props.source).toEqual([{ uri: COVER }]);
    expect(view.queryByText('84 pages')).toBeNull();
    expect(view.getByTestId('book-a')).toBeTruthy();
    await rtl.act(async () => {
      fireEvent(view.getByTestId('book-cover-a'), 'error', errorEvent());
    });
    expect(view.getByText('84 pages')).toBeTruthy();
    const plain = await wrap(area(<PdfPost item={item({ id: 'b', contentType: 'pdf', previewAssetUrl: 'https://cdn.test/previews/pages.pdf', coverUrl: null, pageCount: 12 })} active width={390} height={754} myId={null} chromeTop={50} />));
    expect(plain.queryByTestId('book-cover-b')).toBeNull();
    expect(plain.getByText('12 pages')).toBeTruthy();
  });
});
