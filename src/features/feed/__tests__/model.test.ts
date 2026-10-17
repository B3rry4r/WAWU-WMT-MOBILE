import type { FeedEntry, FeedItem } from '../api';
import { nairaToKobo } from '@/api/kobo';
import { metrics } from '../look';
import {
  bookPlacement,
  counterRight,
  endedBodyWidth,
  caption,
  clock,
  compactCount,
  creatorName,
  drawablePosts,
  durationSeconds,
  durationText,
  freePages,
  hueFor,
  isLocked,
  minutesAdjective,
  offerFor,
  peaksFrom,
  pillFor,
  playableUrl,
  postKind,
  roomPlacement,
  shareAt,
  tickKind,
} from '../model';

const tick = (verified: boolean) => ({ verified, expiresAt: null });

function piece(over: Partial<FeedItem> = {}): FeedItem {
  return {
    id: 'p1',
    status: 'live',
    createdAt: '2026-10-01T00:00:00Z',
    title: 'A title',
    creatorWawuId: 'c1',
    slug: 'a-title',
    contentType: 'video',
    description: 'A description',
    category: 'Creative',
    specializations: [],
    tags: [],
    accessType: 'free',
    price: 0,
    durationLabel: '1:50',
    pageCount: null,
    previewAssetUrl: 'https://cdn.test/preview.webm',
    creatorFirstUploadFree: false,
    views: 0,
    ratingPct: null,
    commentCount: 0,
    likes: 0,
    fullAssetUrl: 'https://cdn.test/full.webm',
    fullAssetLocked: false,
    likedByMe: false,
    savedByMe: false,
    followsCreator: false,
    shares: 0,
    creator: {
      wawuId: 'c1',
      displayName: 'Tife Adeola',
      handle: 'tife',
      avatarUrl: null,
      verification: { creator: tick(true), professional: tick(false) },
    },
    media: { contentId: 'p1', contentType: 'video', durationLabel: '1:50', pageCount: null, frameCount: 0, frames: [] },
    ...over,
  };
}

const locked = (over: Partial<FeedItem> = {}) =>
  piece({ accessType: 'paid', price: 2500, fullAssetLocked: true, fullAssetUrl: null, ...over });

describe('which posts the feed draws', () => {
  it('a user sees videos, photo sets, PDFs and audio; courses, templates and the cards are left to HOME-07', () => {
    expect(postKind({ contentType: 'video' })).toBe('video');
    expect(postKind({ contentType: 'image' })).toBe('photos');
    expect(postKind({ contentType: 'pdf' })).toBe('pdf');
    expect(postKind({ contentType: 'audio' })).toBe('audio');
    expect(postKind({ contentType: 'course' })).toBeNull();
    expect(postKind({ contentType: 'template' })).toBeNull();

    const entries = [
      { kind: 'content', content: piece({ id: 'a' }) },
      { kind: 'creator', creator: {} },
      { kind: 'content', content: piece({ id: 'b', contentType: 'course' }) },
      { kind: 'content', content: piece({ id: 'c', contentType: 'pdf' }) },
    ] as unknown as FeedEntry[];
    expect(drawablePosts(entries).map((p) => p.id)).toEqual(['a', 'c']);
  });
});

describe('locks and files', () => {
  it('a paid piece the viewer has not bought is locked and plays its public preview', () => {
    expect(isLocked(locked())).toBe(true);
    expect(playableUrl(locked())).toBe('https://cdn.test/preview.webm');
  });

  it('a locked piece never plays the full file, even when a full url is sent with it (M12)', () => {
    const sent = locked({ fullAssetUrl: 'https://cdn.test/leaked-full.webm' });
    expect(isLocked(sent)).toBe(true);
    expect(playableUrl(sent)).toBe('https://cdn.test/preview.webm');
    expect(playableUrl(sent)).not.toContain('leaked-full');
  });

  it('a free piece, or a bought one, plays the full file', () => {
    expect(isLocked(piece())).toBe(false);
    expect(playableUrl(piece())).toBe('https://cdn.test/full.webm');
    expect(isLocked(piece({ accessType: 'paid', fullAssetLocked: false }))).toBe(false);
  });
});

describe('figures as the canvas writes them', () => {
  it('a user sees rail counts shortened: 340, 1.1K, 12.4K, 21K, 1.2M', () => {
    expect(compactCount(340)).toBe('340');
    expect(compactCount(1100)).toBe('1.1K');
    expect(compactCount(12400)).toBe('12.4K');
    expect(compactCount(12499)).toBe('12.4K');
    expect(compactCount(21000)).toBe('21K');
    expect(compactCount(1250000)).toBe('1.2M');
    expect(compactCount(-3)).toBe('0');
  });

  it('a user sees a short length as a clock and a long one in minutes', () => {
    expect(durationSeconds('1:50')).toBe(110);
    expect(durationSeconds('1:20:05')).toBe(4805);
    expect(durationSeconds('1h 20m')).toBeNull();
    expect(durationText('1:50')).toBe('1:50');
    expect(durationText('18:00')).toBe('18 min');
    expect(durationText('12:00')).toBe('12 min');
    expect(durationText('1h 20m')).toBe('1h 20m');
    expect(durationText(null)).toBeNull();
    expect(minutesAdjective('18:00')).toBe('18-minute');
    expect(minutesAdjective('0:30')).toBeNull();
  });

  it('a player clock reads 0:42, 1:50 and 1:02:03', () => {
    expect(clock(42.7)).toBe('0:42');
    expect(clock(110)).toBe('1:50');
    expect(clock(3723)).toBe('1:02:03');
    expect(clock(Number.NaN)).toBe('0:00');
  });

  it('a price in naira from the Hub is drawn in kobo', () => {
    expect(nairaToKobo(2500)).toBe(250000);
  });
});

describe('the words on a post', () => {
  it('a user sees the creator name with the right tick, or the handle when WAWU ID has no name', () => {
    const p = piece();
    expect(creatorName(p.creator)).toBe('Tife Adeola');
    expect(tickKind(p.creator)).toBe('creator');
    const pro = { ...p.creator, displayName: null, verification: { creator: tick(false), professional: tick(true) } };
    expect(creatorName(pro)).toBe('tife');
    expect(tickKind(pro)).toBe('pro');
    expect(tickKind({ ...p.creator, verification: { creator: tick(false), professional: tick(false) } })).toBeNull();
  });

  it('a user reads the description, or the title when there is none', () => {
    expect(caption(piece())).toBe('A description');
    expect(caption(piece({ description: '  ' }))).toBe('A title');
  });

  it('a user sees what each post is in its pill (H2 to H6)', () => {
    expect(pillFor(piece(), 'video')).toEqual({ icon: 'Play', text: 'Video · 1:50' });
    expect(pillFor(locked({ durationLabel: '18:00', media: { ...piece().media, durationLabel: '18:00' } }), 'video')).toEqual({
      icon: 'Lock',
      text: 'Locked · 18 min',
    });
    expect(pillFor(piece({ contentType: 'image', media: { ...piece().media, frameCount: 6 } }), 'photos').text).toBe('Photo set · 6');
    expect(pillFor(piece({ contentType: 'pdf', pageCount: 84, media: { ...piece().media, pageCount: 84 } }), 'pdf').text).toBe('PDF · 84 pages');
    expect(pillFor(piece({ contentType: 'audio', durationLabel: '12:00', media: { ...piece().media, durationLabel: '12:00' } }), 'audio').text).toBe(
      'Audio · 12 min',
    );
    expect(pillFor(piece({ durationLabel: null, media: { ...piece().media, durationLabel: null } }), 'video').text).toBe('Video');
  });
});

describe('the offer bar', () => {
  it('a free post has no offer bar', () => {
    expect(offerFor(piece(), 'video')).toBeNull();
  });

  it('a locked post offers itself, with its length or size and the way to pay', () => {
    expect(offerFor(locked({ media: { ...piece().media, durationLabel: '18:00' } }), 'video')).toEqual({
      icon: 'Lock',
      title: 'Unlock the full video',
      subtitle: '18 min · Pay\u00a0from\u00a0wallet',
    });
    expect(offerFor(locked({ contentType: 'pdf', media: { ...piece().media, pageCount: 84 } }), 'pdf')).toEqual({
      icon: 'BookOpen',
      title: 'Read the full PDF',
      subtitle: '84 pages · Pay\u00a0from\u00a0wallet',
    });
    expect(offerFor(locked({ contentType: 'image', media: { ...piece().media, frameCount: 4 } }), 'photos')?.subtitle).toBe(
      '4 photos · Pay\u00a0from\u00a0wallet',
    );
  });
});

describe('H4: free pages', () => {
  const detail = (pages: number | null) => ({ freePreview: { pages, seconds: null, lessons: null } });

  it('a user sees how many pages are free and that stretch of the bar', () => {
    expect(freePages(detail(12), 84)).toEqual({ label: '12 pages free', fraction: 12 / 84 });
    expect(freePages(detail(1), null)).toEqual({ label: '1 page free', fraction: null });
  });

  it('a PDF whose creator declared no free pages shows no bar', () => {
    expect(freePages(detail(null), 84)).toBeNull();
    expect(freePages(undefined, 84)).toBeNull();
  });
});

describe('scrubbing and the waveform', () => {
  it('a press lands at its share of the track', () => {
    expect(shareAt(50, 200)).toBe(0.25);
    expect(shareAt(-5, 200)).toBe(0);
    expect(shareAt(500, 200)).toBe(1);
    expect(shareAt(10, 0)).toBe(0);
  });

  it('bars are the loudness of each slice, scaled to the loudest', () => {
    expect(peaksFrom([0.5, -0.5, 1, -1], 2)).toEqual([0.5, 1]);
    expect(peaksFrom([0, 0, 0, 0], 2)).toEqual([0, 0]);
    expect(peaksFrom([], 3)).toEqual([0, 0, 0]);
  });

  it('a person keeps the same avatar colour', () => {
    expect(hueFor('abc')).toBe(hueFor('abc'));
  });
});

describe('H4: the book never reaches the words or the rail (D2)', () => {
  const tabsBottom = (chromeTop: number) => chromeTop + metrics.middleTop - metrics.statusBar;
  const place = (width: number, areaTop: number, areaBottom: number, chromeTop = metrics.statusBar) =>
    bookPlacement({
      width,
      areaTop,
      areaBottom,
      canvasTop: chromeTop + metrics.bookTop - metrics.statusBar,
      bookH: metrics.bookH,
      extentH: metrics.bookExtentH,
      reachRight: metrics.bookReachRight,
      railClear: metrics.railClear,
    });
  /** The book and its back page as drawn: a scale grows from the middle of the 280 tall box. */
  const drawn = (width: number, p: { top: number; scale: number }) => {
    const middle = p.top + metrics.bookH / 2;
    return {
      top: middle - (metrics.bookExtentH / 2) * p.scale,
      bottom: middle + (metrics.bookExtentH / 2) * p.scale,
      right: width / 2 + metrics.bookReachRight * p.scale,
    };
  };

  it('on the canvas phone it stays where the canvas draws it, full size', () => {
    expect(place(390, 100, 460)).toEqual({ top: metrics.bookTop, scale: 1 });
  });

  it('on every phone from 320 x 568 to 430 x 932 it fits between the tabs and the words, and clear of the rail', () => {
    for (const [width, height] of [[320, 568], [360, 640], [375, 667], [390, 844], [412, 915], [430, 932]]) {
      const post = height - metrics.tabbar;
      for (const foot of [190, 230, 270, 330]) {
        const areaTop = tabsBottom(metrics.statusBar);
        const areaBottom = post - (metrics.captionBottom - metrics.tabbar) - foot - metrics.middleGap;
        const p = place(width, areaTop, areaBottom);
        const box = drawn(width, p);
        expect(box.top).toBeGreaterThanOrEqual(areaTop - 0.01);
        expect(box.bottom).toBeLessThanOrEqual(Math.max(areaTop, areaBottom) + 0.01);
        expect(box.right).toBeLessThanOrEqual(width - metrics.railRight - metrics.avatar - 8 + 0.01);
        expect(p.scale).toBeLessThanOrEqual(1);
      }
    }
  });

  it('with no room at all it shrinks to nothing rather than overlapping', () => {
    expect(place(360, 100, 90).scale).toBe(0);
  });
});

describe('H5: the "Preview ended" message never reaches the words (D2 for H5)', () => {
  it('sits at the canvas place when it fits, and is scaled into the room when it does not', () => {
    const at = (areaBottom: number) =>
      roomPlacement({ areaTop: 100, areaBottom, canvasTop: metrics.endedTop, boxH: metrics.endedH, extentH: metrics.endedH });
    expect(at(500)).toEqual({ top: metrics.endedTop, scale: 1 });
    const tight = at(250);
    expect(tight.scale).toBeCloseTo(150 / metrics.endedH, 5);
    const visualTop = tight.top + metrics.endedH / 2 - (metrics.endedH * tight.scale) / 2;
    expect(visualTop).toBeGreaterThanOrEqual(100 - 0.01);
    expect(visualTop + metrics.endedH * tight.scale).toBeLessThanOrEqual(250 + 0.01);
  });
});

describe('H5 and H3 keep clear of the rail on a small phone', () => {
  it('the "Preview ended" words stop short of the rail from 320 to 430 wide, and keep the canvas width on the canvas phone', () => {
    for (const width of [320, 360, 375, 390, 412, 430]) {
      const w = endedBodyWidth(width, metrics.endedWidth, metrics.endedRailClear);
      // Centred on the screen: its right edge must not pass the rail's left edge.
      expect(width / 2 + w / 2).toBeLessThanOrEqual(width - metrics.railRight - metrics.avatar);
      expect(w).toBeLessThanOrEqual(metrics.endedWidth);
    }
    expect(endedBodyWidth(390, metrics.endedWidth, metrics.endedRailClear)).toBe(metrics.endedWidth);
    expect(endedBodyWidth(320, metrics.endedWidth, metrics.endedRailClear)).toBe(320 - 2 * metrics.endedRailClear);
  });

  it('the frame counter stays top right, and steps left of the rail only when the rail rises to it', () => {
    const at = (railTop: number) =>
      counterRight({ side: metrics.side, railClearRight: metrics.railClear, counterBottom: 128, railTop, gap: metrics.counterRailGap });
    expect(at(0)).toBe(metrics.side);
    expect(at(345)).toBe(metrics.side);
    expect(at(120)).toBe(metrics.railClear);
  });
});
