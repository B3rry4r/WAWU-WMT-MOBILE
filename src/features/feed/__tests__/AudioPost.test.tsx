/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import type { FeedItem } from '../api';
import { metrics } from '../look';
import { WAVEFORM_BARS } from '../model';

/*
 * The real audio element is the browser's (player/index.web.tsx), which jest cannot run. This stand-in keeps the props, as the
 * video post's test does. `loadPeaks` finds nothing, so the waveform is the level bars a build that cannot read the file draws.
 */
jest.mock('../player', () => ({
  canPlay: true,
  VideoSurface: () => null,
  AudioSource: () => null,
  loadPeaks: async () => null,
}));

globalThis.fetch = jest.fn(async () => new Response(JSON.stringify({ statusCode: 200, message: 'OK', data: { views: 1, counted: true } }), { status: 200 })) as typeof fetch;

function audio(over: Partial<FeedItem> = {}): FeedItem {
  return {
    id: 'a',
    status: 'live',
    createdAt: '2026-10-01T00:00:00Z',
    title: 'Studio session',
    creatorWawuId: 'creator-a',
    slug: 'a',
    contentType: 'audio',
    description: 'Caption a',
    category: 'Music',
    specializations: [],
    tags: [],
    accessType: 'free',
    price: 0,
    durationLabel: '12:00',
    pageCount: null,
    previewAssetUrl: 'https://cdn.test/a-preview.mp3',
    creatorFirstUploadFree: false,
    views: 0,
    ratingPct: null,
    commentCount: 0,
    likes: 0,
    fullAssetUrl: 'https://cdn.test/a-full.mp3',
    fullAssetLocked: false,
    likedByMe: false,
    savedByMe: false,
    followsCreator: false,
    shares: 0,
    creator: { wawuId: 'creator-a', displayName: 'Person a', handle: 'a', avatarUrl: null, verification: { creator: { verified: true, expiresAt: null }, professional: { verified: false, expiresAt: null } } },
    media: { contentId: 'a', contentType: 'audio', durationLabel: '12:00', pageCount: null, frameCount: 0, frames: [] },
    ...over,
  } as FeedItem;
}

const clients: QueryClient[] = [];

async function show(width = 390, height = 754) {
  const { AudioPost } = require('../AudioPost') as typeof import('../AudioPost');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  const screen = await rtl.render(
    <QueryClientProvider client={client}>
      <AudioPost item={audio()} active width={width} height={height} myId="viewer" chromeTop={50} onTip={() => undefined} />
    </QueryClientProvider>,
  );
  // Let the counted view's answer land inside act, so it does not update the post outside one.
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  return screen;
}

const styleOf = (node: { props: { style?: unknown } }) => (StyleSheet.flatten(node.props.style as never) ?? {}) as Record<string, number | string | undefined>;
const flat = (id: string) => styleOf(rtl.screen.getByTestId(id));

/** What the waveform draws, from the tree: every bar's width and the gaps between them (the canvas's is 44 x 3 + 43 x 2.5 = 239.5). */
function waveWidth() {
  const wave = rtl.screen.getByTestId('wave-a');
  const bars = wave.children.filter((c) => typeof c !== 'string') as unknown as { props: { style?: unknown } }[];
  expect(bars).toHaveLength(WAVEFORM_BARS);
  const gap = Number(styleOf(wave).gap ?? 0);
  return bars.reduce((sum, bar) => sum + Number(styleOf(bar).width), 0) + gap * (bars.length - 1);
}

/** Where the rail's box starts, in from the phone's left edge: the rail is `right` in from the right and as wide as its avatar. */
function railLeft(width: number) {
  const rail = flat('rail-a');
  expect(rail.position).toBe('absolute');
  expect(typeof rail.right).toBe('number');
  return width - Number(rail.right) - metrics.avatar;
}

/* The first render loads the feed's modules (slow on a loaded machine): pay that here, not in a test's own budget. */
beforeAll(async () => {
  const screen = await show();
  await screen.unmount();
}, 120_000);

afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  clients.splice(0).forEach((c) => c.clear());
});

describe('FIX-68 N1: the audio waveform and the rail', () => {
  // The waveform is centred under the square, so its right end is half of (the phone's width + its own) in. The rail runs from
  // above the waveform down to the words, so on any phone the waveform's band lies inside the rail's, and only the sides can clash.
  it.each([320, 340, 360, 375, 390, 412, 430])('on a %i wide phone the waveform ends clear of the rail, so it never lies under a rail button\'s box', async (width) => {
    await show(width);
    const drawn = waveWidth();
    const waveRight = (width + drawn) / 2;
    expect(waveRight).toBeLessThanOrEqual(railLeft(width));
  });

  // SWEEP-APP-7 (SWEEP-APP-6b L4): the avatar's white ring (2) is drawn outside the rail's box (a -2 margin), and a tap on it belongs to the rail.
  it.each([320, 340, 360, 375, 390, 412, 430])('on a %i wide phone the waveform ends clear of the avatar ring as well, so no bar has its outer pixels under the rail\'s reach', async (width) => {
    await show(width);
    const waveRight = (width + waveWidth()) / 2;
    expect(waveRight).toBeLessThanOrEqual(railLeft(width) - metrics.avatarRing + 1e-9);
  });

  it('on the canvas\'s 390 phone the waveform is drawn exactly as the canvas draws it: 44 bars of 3 with 2.5 between', async () => {
    await show(390);
    expect(waveWidth()).toBeCloseTo(WAVEFORM_BARS * metrics.waveBar + (WAVEFORM_BARS - 1) * metrics.waveGap, 5);
    expect(Number(styleOf(rtl.screen.getByTestId('wave-a')).gap)).toBe(metrics.waveGap);
  });

  it('a narrow phone keeps the bars the canvas draws, drawn smaller: the same count, never a bar dropped', async () => {
    await show(320);
    expect(waveWidth()).toBeLessThan(WAVEFORM_BARS * metrics.waveBar + (WAVEFORM_BARS - 1) * metrics.waveGap);
    expect(waveWidth()).toBeGreaterThan(0);
  });

  it('the rail sits above the foot and above the middle the waveform is in, so a rail button wins a tap inside its own box', async () => {
    await show();
    const railZ = Number(flat('rail-a').zIndex);
    expect(railZ).toBeGreaterThan(Number(flat('foot-a').zIndex));
    // Every box around the waveform, up to the post: none is above the rail.
    let above = 0;
    for (let node = rtl.screen.getByTestId('wave-a').parent; node && node.props?.testID !== 'post-a'; node = node.parent) {
      above = Math.max(above, Number(styleOf(node as never).zIndex ?? 0));
    }
    expect(above).toBeGreaterThan(0);
    expect(railZ).toBeGreaterThan(above);
  });

  it('the waveform still takes a press along its own track', async () => {
    await show(320);
    expect(rtl.screen.getByTestId('wave-a').props.onStartShouldSetResponder()).toBe(true);
  });
});
