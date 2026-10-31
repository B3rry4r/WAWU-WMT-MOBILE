import * as rtl from '@testing-library/react-native';
import { useVideoPlayer } from 'expo-video';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { FeedItem } from '@/features/feed/api';

import { Media } from '../Media';
import { ParentCourseRow } from '../Parts';

// The "From the course" row reads the store's price ladder; this file is about pictures, so the ladder is a plain list price here.
jest.mock('@/features/store/ladder/usePrice', () => ({
  useShownPrice: () => ({ native: false, kobo: (list: number | null | undefined) => (list == null ? null : Math.round(list * 100)), forKobo: (list: number | null | undefined) => (list == null ? null : list), ready: true }),
}));

/*
 * COVERS-APP (R-114): a piece's own page draws the creator's cover where it had a mark, a book or a bare frame: a course and a template before their
 * preview, a video under its player until the first frame, an audio in place of its mark. A cover that will not load gives way to what the page drew
 * before (the first frame, the book, the preview's picture, the mark).
 */
const COVER = 'https://cdn.test/covers/c.jpg?sig=1';
const bad = () => ({ nativeEvent: { error: 'gone' } });
const piece = (contentType: FeedItem['contentType'], previewAssetUrl: string, over: Partial<FeedItem> = {}) =>
  ({ id: `${contentType}-1`, title: 'VFX for Beginners', contentType, accessType: 'paid', price: 8000, previewAssetUrl, fullAssetUrl: null, fullAssetLocked: true, pageCount: null, coverUrl: COVER, ...over }) as unknown as FeedItem;
const tag = { icon: 'GraduationCap' as const, text: '12 lessons' };
// The PDF's reader (opened by a tap on its picture) needs the safe area.
const inArea = (node: React.ReactElement) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{node}</SafeAreaProvider>;

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
  (useVideoPlayer as jest.Mock).mockClear();
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe('H25, H19 and H24 · covers on the piece page (Android)', () => {
  it('a course draws its cover, not an empty box, and opens no player for it; the first frame returns when the cover will not load', async () => {
    await rtl.render(<Media piece={piece('course', 'https://cdn.test/previews/lesson-1.mp4?sig=1')} tag={tag} by="Tife Adeola" />);
    expect(rtl.screen.getByTestId('detail-media-image').props.source).toEqual([{ uri: COVER }]);
    expect(useVideoPlayer).not.toHaveBeenCalled();
    await rtl.act(async () => {
      rtl.fireEvent(rtl.screen.getByTestId('detail-media-image'), 'error', bad());
    });
    expect(rtl.screen.getByTestId('detail-media-frame-video')).toBeTruthy();
  });

  it('a template with a PDF preview draws its cover instead of the generated book; the book returns when the cover will not load', async () => {
    await rtl.render(<Media piece={piece('template', 'https://cdn.test/previews/pages.pdf?sig=1', { title: 'Rate card template', pageCount: 6 })} tag={{ icon: 'LayoutTemplate', text: 'Template' }} by="Kemi Okafor" />);
    expect(rtl.screen.getByTestId('detail-media-image').props.source).toEqual([{ uri: COVER }]);
    expect(rtl.screen.queryByTestId('detail-media-book')).toBeNull();
    await rtl.act(async () => {
      rtl.fireEvent(rtl.screen.getByTestId('detail-media-image'), 'error', bad());
    });
    expect(rtl.screen.getByTestId('detail-media-book')).toBeTruthy();
  });

  it('a video draws its cover under the player until its first frame is in, and not after', async () => {
    await rtl.render(<Media piece={piece('video', 'https://cdn.test/previews/clip.mp4?sig=1')} tag={{ icon: 'Play', text: 'Video' }} by="Tife Adeola" />);
    expect(rtl.screen.getByTestId('detail-media-cover').props.source).toEqual([{ uri: COVER }]);
    await rtl.act(async () => {
      rtl.screen.getByTestId('detail-media-video').props.onFirstFrameRender();
    });
    expect(rtl.screen.queryByTestId('detail-media-cover')).toBeNull();
  });

  it('an audio draws its cover in place of the audio mark', async () => {
    await rtl.render(<Media piece={piece('audio', 'https://cdn.test/previews/clip.mp3?sig=1')} tag={{ icon: 'AudioLines', text: 'Audio' }} by="Kemi Okafor" />);
    expect(rtl.screen.getByTestId('detail-media-cover').props.source).toEqual([{ uri: COVER }]);
    await rtl.act(async () => {
      rtl.fireEvent(rtl.screen.getByTestId('detail-media-cover'), 'error', bad());
    });
    expect(rtl.screen.queryByTestId('detail-media-cover')).toBeNull();
  });

  it('the "From the course" row draws the course\'s cover, then its preview picture, then the course mark', async () => {
    const course = { id: 'course-1', title: 'VFX for Beginners', lessonCount: 12, price: 8000, previewAssetUrl: 'https://cdn.test/previews/cover.jpg?sig=1', coverUrl: COVER };
    await rtl.render(<ParentCourseRow course={course} onPress={jest.fn()} />);
    expect(rtl.screen.getByTestId('detail-parent-course-image').props.source).toEqual([{ uri: COVER }]);
    await rtl.act(async () => {
      rtl.fireEvent(rtl.screen.getByTestId('detail-parent-course-image'), 'error', bad());
    });
    expect(rtl.screen.getByTestId('detail-parent-course-image').props.source).toEqual([{ uri: 'https://cdn.test/previews/cover.jpg?sig=1' }]);
    await rtl.act(async () => {
      rtl.fireEvent(rtl.screen.getByTestId('detail-parent-course-image'), 'error', bad());
    });
    expect(rtl.screen.queryByTestId('detail-parent-course-image')).toBeNull();
  });

  it('a PDF with a cover draws it, and a tap still reads the pages; a PDF with none keeps the generated book', async () => {
    await rtl.render(inArea(<Media piece={piece('pdf', 'https://cdn.test/previews/pages.pdf?sig=1', { title: 'Pricing playbook', pageCount: 84 })} tag={{ icon: 'Eye', text: 'Preview' }} by="Kemi Okafor" />));
    expect(rtl.screen.getByTestId('detail-media-cover').props.source).toEqual([{ uri: COVER }]);
    expect(rtl.screen.queryByText('84 pages')).toBeNull();
    expect(rtl.screen.getByRole('button', { name: 'Read Pricing playbook' })).toBeTruthy();
    await rtl.act(async () => {
      rtl.fireEvent(rtl.screen.getByTestId('detail-media-cover'), 'error', bad());
    });
    // A cover that will not load gives way to the book.
    expect(rtl.screen.getByText('84 pages')).toBeTruthy();
  });

  it('a PDF with no cover draws its generated book (H19)', async () => {
    await rtl.render(inArea(<Media piece={piece('pdf', 'https://cdn.test/previews/pages.pdf?sig=1', { title: 'Pricing playbook', pageCount: 84, coverUrl: null })} tag={{ icon: 'Eye', text: 'Preview' }} by="Kemi Okafor" />));
    expect(rtl.screen.queryByTestId('detail-media-cover')).toBeNull();
    expect(rtl.screen.getByText('Pricing playbook')).toBeTruthy();
    expect(rtl.screen.getByText('84 pages')).toBeTruthy();
  });
});
