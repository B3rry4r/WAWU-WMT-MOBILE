import * as rtl from '@testing-library/react-native';
import { useVideoPlayer } from 'expo-video';
import { Platform } from 'react-native';

import type { FeedItem } from '@/features/feed/api';

import { Media } from '../Media';
import { ParentCourseRow } from '../Parts';

// The "From the course" row reads the store's price ladder; this file is about pictures, so the ladder is a plain list price here.
jest.mock('@/features/store/ladder/usePrice', () => ({
  useShownPrice: () => ({ native: false, kobo: (list: number | null | undefined) => (list == null ? null : Math.round(list * 100)), forKobo: (list: number | null | undefined) => (list == null ? null : list), ready: true }),
}));

/*
 * PREVIEWS-APP, rank 1: a piece's own page never opens on an empty box. The Hub gives one public file per piece (the clip of a video
 * or a course, the PDF of a template), so the page draws what the piece has: the course's first frame, the template's generated book,
 * a picture, or the kind's mark. Android's own player (`Platform.OS` android, the real handlers) is the one that reads the frame.
 */
const COURSE_MP4 = 'https://cdn.test/previews/lesson-1.mp4?sig=abc';
const TEMPLATE_PDF = 'https://cdn.test/previews/pages.pdf?sig=abc';

const piece = (contentType: FeedItem['contentType'], previewAssetUrl: string, over: Partial<FeedItem> = {}) =>
  ({
    id: `${contentType}-1`,
    title: 'VFX for Beginners',
    contentType,
    accessType: 'paid',
    price: 8000,
    previewAssetUrl,
    fullAssetUrl: null,
    fullAssetLocked: true,
    pageCount: null,
    ...over,
  }) as unknown as FeedItem;

const course = { icon: 'GraduationCap' as const, text: '12 lessons · 2h 40m' };
const template = { icon: 'LayoutTemplate' as const, text: 'Template' };
const photos = { icon: 'Image' as const, text: 'Photos' };

const players = () => (useVideoPlayer as jest.Mock).mock.results.map((r) => r.value as { play: jest.Mock; pause: jest.Mock });
const sources = () => (useVideoPlayer as jest.Mock).mock.calls.map((c) => c[0] as string);

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
  (useVideoPlayer as jest.Mock).mockClear();
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe('H25: a course page before a lesson is tapped (Android)', () => {
  it('a user sees the first frame of the course preview, paused and quiet, and not an empty box', async () => {
    await rtl.render(<Media piece={piece('course', COURSE_MP4)} tag={course} by="Tife Adeola" />);
    expect(rtl.screen.getByTestId('detail-media-frame-video')).toBeTruthy();
    expect(sources()).toEqual([COURSE_MP4]);
    // The mp4 is never handed to Image (it would fetch the clip to fail decoding it).
    expect(rtl.screen.queryByTestId('detail-media-image')).toBeNull();
    // It only shows a frame: nothing plays, no play button is drawn that does nothing.
    expect(players()[0].play).not.toHaveBeenCalled();
    expect(players()[0].pause).toHaveBeenCalled();
    expect(rtl.screen.queryByRole('button')).toBeNull();
    expect(rtl.screen.getByText('12 lessons · 2h 40m')).toBeTruthy();
  });

  it('while the frame loads, and when the clip never opens, the course mark stands in its place; once the frame is in the mark goes', async () => {
    await rtl.render(<Media piece={piece('course', COURSE_MP4)} tag={course} by="Tife Adeola" />);
    expect(rtl.screen.getByTestId('detail-media-mark')).toBeTruthy();
    await rtl.act(async () => {
      rtl.screen.getByTestId('detail-media-frame-video').props.onFirstFrameRender();
    });
    expect(rtl.screen.queryByTestId('detail-media-mark')).toBeNull();
    expect(rtl.screen.getByTestId('detail-media-frame-video')).toBeTruthy();
  });

  it('a course whose preview is a picture still shows the picture, and the mark when that picture will not load', async () => {
    await rtl.render(<Media piece={piece('course', 'https://cdn.test/previews/cover.jpg')} tag={course} by="Tife Adeola" />);
    const image = rtl.screen.getByTestId('detail-media-image');
    expect(image.props.source).toEqual([{ uri: 'https://cdn.test/previews/cover.jpg' }]);
    expect(sources()).toEqual([]);
    await rtl.act(async () => {
      rtl.fireEvent(image, 'error', { nativeEvent: { error: 'not an image' } });
    });
    expect(rtl.screen.queryByTestId('detail-media-image')).toBeNull();
    expect(rtl.screen.getByTestId('detail-media-mark')).toBeTruthy();
  });

  it('a course the Hub gave no preview for shows the course mark', async () => {
    await rtl.render(<Media piece={piece('course', '')} tag={course} by="Tife Adeola" />);
    expect(rtl.screen.getByTestId('detail-media-mark')).toBeTruthy();
    expect(sources()).toEqual([]);
  });

  it('a tapped lesson takes the frame over and plays from the Hub link', async () => {
    const lesson = { key: 1, uri: 'https://cdn.test/lessons/l1.mp4?sig=z', title: 'Orbit shots' };
    await rtl.render(<Media piece={piece('course', COURSE_MP4)} tag={course} by="Tife Adeola" lesson={lesson} />);
    expect(rtl.screen.getByTestId('detail-media-lesson-video')).toBeTruthy();
    expect(rtl.screen.queryByTestId('detail-media-frame-video')).toBeNull();
    expect(sources()).toEqual([lesson.uri]);
  });
});

describe('H19: a template page', () => {
  it('a user sees the generated book (its title, who made it, its pages) for a template whose preview is a PDF, not an empty box', async () => {
    await rtl.render(<Media piece={piece('template', TEMPLATE_PDF, { title: 'Rate card template', pageCount: 6 })} tag={template} by="Kemi Okafor" />);
    expect(rtl.screen.getByTestId('detail-media-book')).toBeTruthy();
    expect(rtl.within(rtl.screen.getByTestId('detail-media-book')).getByText('Rate card template')).toBeTruthy();
    expect(rtl.within(rtl.screen.getByTestId('detail-media-book')).getByText('Kemi Okafor')).toBeTruthy();
    expect(rtl.within(rtl.screen.getByTestId('detail-media-book')).getByText('6 pages')).toBeTruthy();
    expect(rtl.screen.queryByTestId('detail-media-image')).toBeNull();
    // It is a picture of the file, not a button: the template's reader is not built.
    expect(rtl.screen.queryByRole('button')).toBeNull();
  });

  it('a template with a picture cover shows the picture, and the template mark when it will not load', async () => {
    await rtl.render(<Media piece={piece('template', 'https://cdn.test/previews/cover.png?sig=1')} tag={template} by="Kemi Okafor" />);
    const image = rtl.screen.getByTestId('detail-media-image');
    expect(image.props.source).toEqual([{ uri: 'https://cdn.test/previews/cover.png?sig=1' }]);
    await rtl.act(async () => {
      rtl.fireEvent(image, 'error', { nativeEvent: { error: 'not an image' } });
    });
    expect(rtl.screen.queryByTestId('detail-media-image')).toBeNull();
    expect(rtl.screen.getByTestId('detail-media-mark')).toBeTruthy();
  });

  it('a template whose preview is neither a picture nor a PDF shows the template mark', async () => {
    await rtl.render(<Media piece={piece('template', 'https://cdn.test/previews/sheet.xlsx')} tag={template} by="Kemi Okafor" />);
    expect(rtl.screen.getByTestId('detail-media-mark')).toBeTruthy();
    expect(rtl.screen.queryByTestId('detail-media-image')).toBeNull();
    expect(sources()).toEqual([]);
  });
});

describe('a photo set page', () => {
  it('shows the picture, and the image mark when the picture will not load', async () => {
    await rtl.render(<Media piece={piece('image', 'https://cdn.test/previews/set-1.jpg')} tag={photos} by="Kemi Okafor" />);
    await rtl.act(async () => {
      rtl.fireEvent(rtl.screen.getByTestId('detail-media-image'), 'error', { nativeEvent: { error: 'not an image' } });
    });
    expect(rtl.screen.queryByTestId('detail-media-image')).toBeNull();
    expect(rtl.screen.getByTestId('detail-media-mark')).toBeTruthy();
  });
});

describe('H24: the "From the course" row (Android)', () => {
  const parent = (previewAssetUrl: string | null) => ({ id: 'course-1', title: 'VFX for Beginners', lessonCount: 12, price: 8000, previewAssetUrl });

  it('a user sees the course mark, with no picture fetched, when the course preview is a clip; the picture when it is one', async () => {
    const view = await rtl.render(<ParentCourseRow course={parent('https://cdn.test/previews/lesson-1.mp4?sig=1')} onPress={jest.fn()} />);
    expect(JSON.stringify(view.toJSON())).not.toContain('lesson-1.mp4');
    await view.rerender(<ParentCourseRow course={parent('https://cdn.test/previews/cover.jpg?sig=1')} onPress={jest.fn()} />);
    expect(JSON.stringify(view.toJSON())).toContain('previews/cover.jpg');
  });
});
