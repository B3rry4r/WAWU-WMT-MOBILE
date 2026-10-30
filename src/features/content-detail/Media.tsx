import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon, ICON_STROKE, type IconName } from '@/components/icon';
import { radius, useWawu } from '@/theme';
import type { FeedItem } from '@/features/feed/api';
import { media, words } from '@/features/feed/look';
import { playableUrl } from '@/features/feed/model';
import { Pill } from '@/features/feed/parts';
import { AudioSource, canPlay, VideoSurface } from '@/features/feed/player';
import { PdfReader } from '@/features/feed/reader';

import { BAR_TITLE, kindOf, type Kind } from './model';

/**
 * The piece's picture on its own page (home.js `pdfMedia` 250 tall, the free video 220, the course 200; every one with a 20 corner
 * and the type tag 12 from the bottom left). A PDF is drawn as its book and opens its pages in the reader (the free pages while it
 * is locked, all of them once it is the viewer's); a video plays in place (the public preview while locked); a course and a
 * photo set show the picture the Hub serves. A course plays the lesson the page opened (`lesson`: the Hub's short-lived link for it,
 * FIX-107) in the same frame, and says when it ends.
 */
const metrics = {
  pdf: 250,
  video: 220,
  course: 200,
  bookW: 150,
  bookH: 210,
  bookPad: 18,
  bookPadBottom: 24,
  bookRadius: 10,
  spine: 6,
  tagInset: 12,
  playDisc: 62,
  playIcon: 26,
} as const;

/** Heights by what is drawn. */
const heightOf = (kind: Kind): number => (kind === 'pdf' ? metrics.pdf : kind === 'course' ? metrics.course : metrics.video);

export type MediaProps = {
  piece: FeedItem;
  tag: { icon: IconName; text: string };
  by: string | null;
  /** A number that goes up each time the page's "Read now" or "Watch now" is pressed: the book opens, or the video starts. */
  signal?: number;
  /** The lesson to play in a course's frame: its id, and the Hub's link for it. A new `key` starts it again. */
  lesson?: { key: number; uri: string; title: string } | null;
  /** The lesson played to its end. */
  onLessonEnded?: () => void;
  testID?: string;
};

export function Media({ piece, tag, by, signal = 0, lesson = null, onLessonEnded, testID = 'detail-media' }: MediaProps) {
  const { colors } = useWawu();
  const kind = kindOf(piece);
  const [reading, setReading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [time, setTime] = useState({ position: 0, length: 0 });
  const ring = useFocusRing();
  const uri = playableUrl(piece);
  const [seen, setSeen] = useState(0);
  if (signal !== seen) {
    setSeen(signal);
    if (signal > 0 && kind === 'pdf') setReading(true);
    else if (signal > 0) {
      setEnded(false);
      setPlaying(true);
    }
  }
  const [lessonSeen, setLessonSeen] = useState<number | null>(null);
  if ((lesson?.key ?? null) !== lessonSeen) {
    setLessonSeen(lesson?.key ?? null);
    if (lesson) {
      setEnded(false);
      setPlaying(true);
    }
  }
  const tapToPlay = () => {
    setEnded(false);
    setPlaying((p) => !p);
  };

  let body;
  if (kind === 'pdf') {
    body = (
      <Pressable
        testID={`${testID}-book`}
        accessibilityRole="button"
        accessibilityLabel={`Read ${piece.title}`}
        onPress={() => setReading(true)}
        {...ring.handlers}
        style={[styles.center, ring.style]}
      >
        <View style={[styles.cover, { backgroundColor: media.cover, boxShadow: `0 30px 50px -10px ${media.coverShadow}` }]}>
          <View style={[styles.spine, { backgroundColor: media.spine }]} />
          <Text numberOfLines={1} style={[words.bookBy, { color: media.ink }]}>
            {by ?? ''}
          </Text>
          <Text numberOfLines={5} style={[words.bookTitle, { color: media.ink }]}>
            {piece.title}
          </Text>
          <Text style={[words.bookPages, { color: media.ink }]}>{piece.pageCount ? `${piece.pageCount} pages` : ''}</Text>
        </View>
      </Pressable>
    );
  } else if (kind === 'video' || kind === 'audio') {
    body = (
      <Pressable
        testID={`${testID}-play`}
        accessibilityRole="button"
        accessibilityLabel={playing ? `Pause ${piece.title}` : `Play ${piece.title}`}
        accessibilityState={{ selected: playing }}
        accessibilityValue={time.length > 0 ? { min: 0, max: Math.floor(time.length), now: Math.floor(time.position) } : undefined}
        onPress={tapToPlay}
        {...ring.handlers}
        style={[StyleSheet.absoluteFill, styles.center, ring.style]}
      >
        {kind === 'video' && canPlay ? (
          <VideoSurface uri={uri} playing={playing} seek={null} frosted={false} onTime={(position, length) => setTime({ position, length })} onEnded={() => (setPlaying(false), setEnded(true))} testID={`${testID}-video`} />
        ) : null}
        {kind === 'audio' ? (
          <>
            <AudioSource uri={uri} playing={playing} seek={null} title={piece.title} onTime={(position, length) => setTime({ position, length })} onEnded={() => (setPlaying(false), setEnded(true))} testID={`${testID}-audio`} />
            <Icon name="AudioLines" size={metrics.playDisc} color={colors.textMuted} strokeWidth={ICON_STROKE.fab} />
          </>
        ) : null}
        {!playing ? (
          <View pointerEvents="none" style={[styles.disc, { backgroundColor: media.ink }]}>
            <Icon name="Play" size={metrics.playIcon} color={media.inkOnLight} fill={media.inkOnLight} strokeWidth={1.8} />
          </View>
        ) : null}
      </Pressable>
    );
  } else if (kind === 'course' && lesson && canPlay) {
    body = (
      <Pressable
        testID={`${testID}-lesson`}
        accessibilityRole="button"
        accessibilityLabel={playing ? `Pause ${lesson.title}` : `Play ${lesson.title}`}
        accessibilityState={{ selected: playing }}
        onPress={tapToPlay}
        {...ring.handlers}
        style={[StyleSheet.absoluteFill, styles.center, ring.style]}
      >
        <VideoSurface
          key={lesson.key}
          uri={lesson.uri}
          playing={playing}
          seek={null}
          frosted={false}
          onTime={(position, length) => setTime({ position, length })}
          onEnded={() => (setPlaying(false), setEnded(true), onLessonEnded?.())}
          testID={`${testID}-lesson-video`}
        />
        {!playing ? (
          <View pointerEvents="none" style={[styles.disc, { backgroundColor: media.ink }]}>
            <Icon name="Play" size={metrics.playIcon} color={media.inkOnLight} fill={media.inkOnLight} strokeWidth={1.8} />
          </View>
        ) : null}
      </Pressable>
    );
  } else if (piece.previewAssetUrl) {
    body = <Image testID={`${testID}-image`} source={{ uri: piece.previewAssetUrl }} contentFit="cover" accessibilityLabel={piece.title} style={StyleSheet.absoluteFill} />;
  } else {
    body = (
      <View style={styles.center}>
        <Icon name={tag.icon} size={metrics.playDisc} color={colors.textMuted} />
      </View>
    );
  }

  return (
    <View testID={testID} accessibilityLabel={`${BAR_TITLE[kind]}${lesson ? `, ${lesson.title}` : ''}${ended ? ', finished' : ''}`} style={[styles.frame, { height: heightOf(kind), backgroundColor: colors.surfaceSunken }]}>
      {body}
      <View pointerEvents="none" style={styles.tag}>
        <Pill icon={tag.icon} text={tag.text} testID={`${testID}-tag`} flush />
      </View>
      {kind === 'pdf' ? <PdfReader uri={uri} title={piece.title} visible={reading} onClose={() => setReading(false)} testID={`${testID}-reader`} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: radius.media, overflow: 'hidden', flexShrink: 0 },
  center: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  cover: {
    width: metrics.bookW,
    height: metrics.bookH,
    borderRadius: metrics.bookRadius,
    paddingTop: metrics.bookPad,
    paddingBottom: metrics.bookPadBottom,
    paddingHorizontal: metrics.bookPad,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  spine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: metrics.spine },
  disc: { width: metrics.playDisc, height: metrics.playDisc, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  tag: { position: 'absolute', left: metrics.tagInset, bottom: metrics.tagInset },
});

export type { Kind };
