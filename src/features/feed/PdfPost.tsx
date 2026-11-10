import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';

import { detailKey, fetchContentDetail } from './api';
import { media, metrics, words } from './look';
import { bookPlacement, creatorName, freePages, isLocked, pictureCandidates, playableUrl } from './model';
import { fromTop, PostFrame, type MiddleSpace, type PostProps } from './PostFrame';
import { TrackBar } from './parts';
import { PdfReader } from './reader';
import { usePicture } from './usePicture';

/**
 * H4: a PDF drawn as its book, with how many pages are free (the creator's declared
 * preview, HOME-06) and the free stretch of the bar. Pressing the book opens those pages
 * in place; a PDF the viewer may read whole opens whole.
 */
export function PdfPost(props: PostProps) {
  const { item } = props;
  const locked = isLocked(item);
  const pages = item.media?.pageCount ?? item.pageCount;
  const [reading, setReading] = useState(false);
  const ring = useFocusRing();
  const detail = useQuery({
    queryKey: detailKey(item.id),
    queryFn: () => fetchContentDetail(item.id),
    enabled: locked,
  });
  const free = locked ? freePages(detail.data, pages) : null;
  const by = creatorName(item.creator);
  // R-114: a PDF with a cover draws it as the front of its book; one with none keeps the generated cover (H4). Either way pressing it reads.
  const cover = usePicture(pictureCandidates(item, null));

  return (
    <>
      <PostFrame
        {...props}
        kind="pdf"
        backdrop={<View style={[StyleSheet.absoluteFill, { backgroundColor: media.backdrop }]} />}
        middle={(space: MiddleSpace) => {
          const { top, scale } = bookPlacement({
            width: space.width,
            areaTop: space.top,
            areaBottom: space.bottom,
            canvasTop: fromTop(props.chromeTop, metrics.bookTop),
            bookH: metrics.bookH,
            extentH: metrics.bookExtentH,
            reachRight: metrics.bookReachRight,
            railClear: metrics.railClear,
          });
          return (
            <View
              pointerEvents="box-none"
              testID={`book-row-${item.id}`}
              style={[styles.bookRow, { top, opacity: space.ready ? 1 : 0 }]}
            >
              <Pressable
                testID={`book-${item.id}`}
                accessibilityRole="button"
                accessibilityLabel={locked ? `Read the free pages of ${item.title}` : `Read ${item.title}`}
                onPress={() => setReading(true)}
                {...ring.handlers}
                style={[styles.book, { transform: [{ scale }] }, ring.style]}
              >
                <View style={[styles.backPage, { backgroundColor: media.page }]} />
                <View style={[styles.cover, { backgroundColor: media.cover, boxShadow: `0 30px 50px -10px ${media.coverShadow}` }]}>
                  {cover.uri ? (
                    <Image testID={`book-cover-${item.id}`} source={{ uri: cover.uri }} contentFit="cover" accessibilityLabel={item.title} onError={cover.onError} style={StyleSheet.absoluteFill} />
                  ) : (
                    <>
                      <View style={[styles.spine, { backgroundColor: media.spine }]} />
                      <Text numberOfLines={1} style={[words.bookBy, { color: media.ink }]}>
                        {by ?? ''}
                      </Text>
                      <Text numberOfLines={5} style={[words.bookTitle, { color: media.ink }]}>
                        {item.title}
                      </Text>
                      <Text style={[words.bookPages, { color: media.ink }]}>{pages ? `${pages} pages` : ''}</Text>
                    </>
                  )}
                </View>
              </Pressable>
            </View>
          );
        }}
        above={free ? <TrackBar share={free.fraction ?? 0} label={free.label} testID={`free-pages-${item.id}`} /> : null}
      />
      <PdfReader
        uri={playableUrl(item)}
        title={item.title}
        visible={reading}
        onClose={() => setReading(false)}
        testID={`reader-${item.id}`}
      />
    </>
  );
}

const styles = StyleSheet.create({
  bookRow: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 3 },
  book: { width: metrics.bookW, height: metrics.bookH },
  backPage: {
    position: 'absolute',
    left: metrics.pageLeft,
    top: metrics.pageTop,
    width: metrics.bookW,
    height: metrics.bookH,
    borderRadius: metrics.bookRadius,
    transform: [{ rotate: '4deg' }],
  },
  cover: {
    width: metrics.bookW,
    height: metrics.bookH,
    borderRadius: metrics.bookRadius,
    paddingVertical: metrics.bookPadV,
    paddingHorizontal: metrics.bookPadH,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  spine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: metrics.spine },
});
