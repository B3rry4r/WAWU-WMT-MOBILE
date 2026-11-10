import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon, ICON_STROKE, type IconName } from '@/components/icon';
import { radius, space, useWawu } from '@/theme';
import type { FeedItem } from '@/features/feed/api';
import { media, words } from '@/features/feed/look';
import { isPdfFile, isPicture, isVideoFile, pictureCandidates, PLAYER_FAILED, playableUrl } from '@/features/feed/model';
import { Pill } from '@/features/feed/parts';
import { PictureViewer, picturesOf } from '@/features/feed/PictureViewer';
import { AudioSource, canPlay, VideoSurface, type LoadState } from '@/features/feed/player';
import { FullscreenButton } from '@/features/feed/player/FullscreenButton';
import { PdfReader } from '@/features/feed/reader';
import { usePicture } from '@/features/feed/usePicture';

import { BAR_TITLE, kindOf, type Kind } from './model';

/**
 * The piece's picture on its own page (home.js `pdfMedia` 250 tall, the free video 220, the course 200; every one with a 20 corner
 * and the type tag 12 from the bottom left). A PDF is drawn as its book and opens its pages in the reader (the free pages while it
 * is locked, all of them once it is the viewer's); a video plays in place (the public preview while locked); a course and a
 * photo set show the picture the Hub serves. A course plays the lesson the page opened (`lesson`: the Hub's short-lived link for it,
 * FIX-107) in the same frame, and says when it ends.
 *
 * The Hub gives each piece one public file, not a cover (PREVIEWS-APP): the clip of a course, the PDF of a template. Before a lesson is
 * tapped the frame draws what the piece has, never an empty box: a course's first frame (paused, quiet, from its own clip), a template's
 * generated book, a picture, or the kind's mark (while the frame loads, when a file will not open, and when there is nothing to draw).
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
  /** The full-screen button's inset from the frame's right and bottom (the type tag keeps the left, 12 in). */
  fullscreenInset: 12,
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
  // R-117: the player's loading state (the play button keeps its place and shows the spinner while the file comes in), the words when it
  // will not load, the number the full-screen button raises, and the picture viewer.
  const [load, setLoad] = useState<LoadState>('ready');
  const [failed, setFailed] = useState(false);
  const [fullscreen, setFullscreen] = useState(0);
  const [viewing, setViewing] = useState(false);
  const onLoad = (state: LoadState) => {
    if (state === 'failed') {
      setFailed(true);
      setPlaying(false);
      setLoad('ready');
      return;
    }
    setLoad(state);
    if (state === 'ready') setFailed(false);
  };
  const ring = useFocusRing();
  const uri = playableUrl(piece);
  // The creator's cover (R-114): under the player until its first frame, and in place of the audio mark; a cover that will not load gives way to the mark.
  const cover = usePicture(pictureCandidates(piece, null));
  const [framed, setFramed] = useState<string | null>(null);
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
    setFailed(false);
    setPlaying((p) => !p);
  };
  const waiting = playing && load === 'waiting';
  // The button in the middle of the picture: Play when stopped, the spinner while the file comes in, nothing while it plays (a tap pauses).
  const centre = !playing || waiting ? (
    <View pointerEvents="none" testID={`${testID}-${waiting ? 'waiting' : 'disc'}`} style={[styles.disc, { backgroundColor: media.ink }]}>
      {waiting ? <ActivityIndicator testID={`${testID}-spinner`} size="small" color={media.inkOnLight} /> : <Icon name="Play" size={metrics.playIcon} color={media.inkOnLight} fill={media.inkOnLight} strokeWidth={1.8} />}
    </View>
  ) : null;
  const failure = failed ? (
    <View pointerEvents="none" style={styles.failed}>
      <Text testID={`${testID}-failed`} accessibilityRole="alert" style={[words.pill, { color: media.ink, backgroundColor: media.pill }, styles.failedText]}>
        {PLAYER_FAILED}
      </Text>
    </View>
  ) : null;

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
        {/* R-114: a PDF with a cover draws it as the front of its book (H19, H20: the same portrait frame as the generated one); one with none, or a cover that will not load, keeps the generated book. Either way the tap reads the pages. */}
        <Book title={piece.title} by={by} pages={piece.pageCount} cover={cover.uri} onCoverError={cover.onError} coverTestID={`${testID}-cover`} />
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
        {kind === 'video' && cover.uri && framed !== uri ? <Image testID={`${testID}-cover`} source={{ uri: cover.uri }} contentFit="cover" accessibilityLabel={piece.title} onError={cover.onError} style={StyleSheet.absoluteFill} /> : null}
        {kind === 'video' && canPlay ? (
          <VideoSurface uri={uri} playing={playing} seek={null} frosted={false} fullscreenAt={fullscreen} onTime={(position, length) => setTime({ position, length })} onEnded={() => (setPlaying(false), setEnded(true))} onLoad={onLoad} onFirstFrame={() => setFramed(uri)} testID={`${testID}-video`} />
        ) : null}
        {kind === 'audio' ? (
          <>
            <AudioSource uri={uri} playing={playing} seek={null} title={piece.title} onTime={(position, length) => setTime({ position, length })} onEnded={() => (setPlaying(false), setEnded(true))} onLoad={onLoad} testID={`${testID}-audio`} />
            {cover.uri ? (
              <Image testID={`${testID}-cover`} source={{ uri: cover.uri }} contentFit="cover" accessibilityLabel={piece.title} onError={cover.onError} style={StyleSheet.absoluteFill} />
            ) : (
              <Icon name="AudioLines" size={metrics.playDisc} color={colors.textMuted} strokeWidth={ICON_STROKE.fab} />
            )}
          </>
        ) : null}
        {centre}
        {failure}
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
          fullscreenAt={fullscreen}
          onTime={(position, length) => setTime({ position, length })}
          onEnded={() => (setPlaying(false), setEnded(true), onLessonEnded?.())}
          onLoad={onLoad}
          testID={`${testID}-lesson-video`}
        />
        {centre}
        {failure}
      </Pressable>
    );
  } else {
    body = <Cover piece={piece} kind={kind} tag={tag} by={by} testID={testID} onOpenPicture={kind === 'photos' ? () => setViewing(true) : undefined} />;
  }
  // R-117: the pictures the viewer may show are the ones this person may see: a locked set has no address for its locked frames.
  const pictures = kind === 'photos' ? picturesOf(piece) : [];
  const fullscreenVideo = canPlay && (kind === 'video' || (kind === 'course' && lesson !== null));

  return (
    <View testID={testID} accessibilityLabel={`${BAR_TITLE[kind]}${lesson ? `, ${lesson.title}` : ''}${ended ? ', finished' : ''}`} style={[styles.frame, { height: heightOf(kind), backgroundColor: colors.surfaceSunken }]}>
      {body}
      <View pointerEvents="none" style={styles.tag}>
        <Pill icon={tag.icon} text={tag.text} testID={`${testID}-tag`} flush />
      </View>
      {fullscreenVideo ? (
        <View style={styles.fullscreen}>
          <FullscreenButton onPress={() => setFullscreen((n) => n + 1)} label={`Full screen, ${piece.title}`} testID={`${testID}-fullscreen`} />
        </View>
      ) : null}
      {kind === 'pdf' ? <PdfReader uri={uri} title={piece.title} visible={reading} onClose={() => setReading(false)} testID={`${testID}-reader`} /> : null}
      {kind === 'photos' && pictures.length > 0 ? <PictureViewer pictures={pictures} index={0} visible={viewing} onClose={() => setViewing(false)} testID={`${testID}-viewer`} /> : null}
    </View>
  );
}

/** The generated book of a PDF (H4 in the feed, H19 and H20 on the page): the title, who made it and how many pages. */
function Book({ title, by, pages, cover = null, onCoverError, coverTestID }: { title: string; by: string | null; pages: number | null; cover?: string | null; onCoverError?: () => void; coverTestID?: string }) {
  return (
    <View style={[styles.cover, { backgroundColor: media.cover, boxShadow: `0 30px 50px -10px ${media.coverShadow}` }]}>
      {cover ? (
        // The creator's cover fills the front of the book, fitted inside its portrait frame (R-114).
        <Image testID={coverTestID} source={{ uri: cover }} contentFit="cover" accessibilityLabel={title} onError={onCoverError} style={StyleSheet.absoluteFill} />
      ) : (
        <>
          <View style={[styles.spine, { backgroundColor: media.spine }]} />
          <Text numberOfLines={1} style={[words.bookBy, { color: media.ink }]}>
            {by ?? ''}
          </Text>
          <Text numberOfLines={5} style={[words.bookTitle, { color: media.ink }]}>
            {title}
          </Text>
          <Text style={[words.bookPages, { color: media.ink }]}>{pages ? `${pages} pages` : ''}</Text>
        </>
      )}
    </View>
  );
}

/**
 * What fills the frame when nothing is playing: the piece's picture, the first frame of its clip, the book of its PDF, or the kind's
 * mark. The address that failed to load, or whose frame is not in yet, shows the mark; a file is never handed to something that cannot
 * draw it (an mp4 or a PDF to `Image`).
 */
function Cover({ piece, kind, tag, by, testID, onOpenPicture }: { piece: FeedItem; kind: Kind; tag: MediaProps['tag']; by: string | null; testID: string; onOpenPicture?: () => void }) {
  const { colors } = useWawu();
  const url = piece.previewAssetUrl || null;
  // The creator's cover first (R-114), then the preview when it is a picture (a photo is always one); the one that will not load gives way to the next.
  const picture = usePicture(pictureCandidates(piece, url));
  // The address whose first frame is on screen: a new address starts again.
  const [framed, setFramed] = useState<string | null>(null);
  const mark = (
    <View testID={`${testID}-mark`} pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
      <Icon name={tag.icon} size={metrics.playDisc} color={colors.textMuted} />
    </View>
  );
  if (picture.uri) {
    const image = <Image testID={`${testID}-image`} source={{ uri: picture.uri }} contentFit="cover" accessibilityLabel={piece.title} onError={picture.onError} style={StyleSheet.absoluteFill} />;
    // R-117: a photo opens full screen on a tap.
    return onOpenPicture ? (
      <Pressable testID={`${testID}-open-picture`} accessibilityRole="imagebutton" accessibilityLabel={`View ${piece.title} full screen`} onPress={onOpenPicture} style={StyleSheet.absoluteFill}>
        {image}
      </Pressable>
    ) : (
      image
    );
  }
  // A picture that failed to load is not handed to anything else: the mark.
  if (!url || isPicture(url) || kind === 'photos') return mark;
  if (isPdfFile(url)) {
    return (
      <View testID={`${testID}-book`} style={styles.center}>
        <Book title={piece.title} by={by} pages={piece.pageCount} />
      </View>
    );
  }
  // A course's preview is a lesson, an mp4 by the Hub's rule: its first frame, from a paused player (the mark shows until it is in).
  if (canPlay && (isVideoFile(url) || kind === 'course')) {
    return (
      <>
        {framed === url ? null : mark}
        <VideoSurface uri={url} playing={false} seek={null} frosted={false} onTime={noTime} onEnded={noEnd} onFirstFrame={() => setFramed(url)} testID={`${testID}-frame-video`} />
      </>
    );
  }
  return mark;
}

function noTime() {
  return undefined;
}

function noEnd() {
  return undefined;
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
  fullscreen: { position: 'absolute', right: metrics.fullscreenInset, bottom: metrics.fullscreenInset },
  failed: { position: 'absolute', left: 0, right: 0, bottom: metrics.tagInset, alignItems: 'center' },
  failedText: { paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.chip, overflow: 'hidden' },
});

export type { Kind };
