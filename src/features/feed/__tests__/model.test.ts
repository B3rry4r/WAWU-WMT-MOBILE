import type { FeedEntry, FeedItem } from '../api';
import { nairaToKobo } from '../api';
import {
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
      subtitle: '18 min · Pay from wallet',
    });
    expect(offerFor(locked({ contentType: 'pdf', media: { ...piece().media, pageCount: 84 } }), 'pdf')).toEqual({
      icon: 'BookOpen',
      title: 'Read the full PDF',
      subtitle: '84 pages · Pay from wallet',
    });
    expect(offerFor(locked({ contentType: 'image', media: { ...piece().media, frameCount: 4 } }), 'photos')?.subtitle).toBe(
      '4 photos · Pay from wallet',
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
