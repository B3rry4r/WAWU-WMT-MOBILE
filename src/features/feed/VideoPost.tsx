import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { layout, radius, space as gap } from '@/theme';

import { media, metrics, words } from './look';
import { clock, counterRight, endedBodyWidth, PLAYER_FAILED, isLocked, isPicture, minutesAdjective, pictureCandidates, playableUrl, roomPlacement, SKIP_SECONDS, type CourseDetail } from './model';
import { canPlay, VideoSurface, type LoadState, type SeekRequest } from './player';
import { FullscreenButton } from './player/FullscreenButton';
import { fromTop, PostFrame, type MiddleSpace, type PostProps } from './PostFrame';
import { Seekable, TrackBar } from './parts';
import { usePicture } from './usePicture';

/**
 * H2 (a video) and H5 (a locked video). It plays while it fills the screen; a tap pauses or
 * plays it, and the scrubber above the caption moves it. A locked video plays its public
 * preview, and when the preview ends the frame frosts and says so (H5).
 *
 * A course (H7) is the same post: its public preview is the free lesson (the creator's "first lesson is the preview", M20), which plays here the
 * same way and just stops when it ends (a tap plays it again); the pill and the offer bar read the
 * course's `detail`. A course whose preview is a still picture shows the picture and plays nothing.
 */
export function VideoPost(props: PostProps & { course?: boolean; detail?: CourseDetail | null }) {
  const { item, active, course = false, detail } = props;
  const locked = isLocked(item);
  // A course's full file is the whole course (a video, a PDF or an archive): the feed only ever plays its free lesson.
  const uri = course ? item.previewAssetUrl : playableUrl(item);
  const still = course && isPicture(uri);
  // The creator's cover (R-114) is the picture under the player until its first frame is in (and the picture itself for a course whose preview is one);
  // without one, or when it will not load, the kind's mark stands there.
  const picture = usePicture(pictureCandidates(item, uri));
  // The address whose first frame is on screen. Until it is, the backdrop draws the kind's mark, never plain black (a player is
  // transparent until its first frame); an unlocked post plays a new file, whose frame is awaited the same way.
  const [framed, setFramed] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [time, setTime] = useState({ position: 0, length: 0 });
  const [ended, setEnded] = useState(false);
  // The message's own height, measured: on a narrow phone its words wrap onto more lines.
  const [messageH, setMessageH] = useState(0);
  const [seek, setSeek] = useState<SeekRequest>(null);
  // R-117: the player's loading state (the spinner in the centre while the file comes in), the words when it will not load, and the full-screen button's number.
  const [load, setLoad] = useState<LoadState>('ready');
  const [failed, setFailed] = useState(false);
  const [fullscreen, setFullscreen] = useState(0);
  const onLoad = (state: LoadState) => {
    if (state === 'failed') {
      setFailed(true);
      setPaused(true);
      setLoad('ready');
      return;
    }
    setLoad(state);
    if (state === 'ready') setFailed(false);
  };

  // Coming back to the post starts it playing again (a locked video's ended preview stays ended).
  const [wasActive, setWasActive] = useState(active);
  if (active !== wasActive) {
    setWasActive(active);
    if (active) setPaused(false);
  }

  // The post was just unlocked (H16, Watch now): the preview's end is over, and the full video plays from the start.
  const [wasLocked, setWasLocked] = useState(locked);
  if (locked !== wasLocked) {
    setWasLocked(locked);
    if (!locked) {
      setEnded(false);
      setPaused(false);
      setSeek(null);
    }
  }

  const previewEnded = !course && locked && ended;
  const playing = active && !paused && !ended;
  const seekTo = (to: number) => {
    setEnded(false);
    setSeek({ to: Math.max(0, Math.min(time.length || 0, to)), at: Date.now() });
  };
  const toggle = () => {
    setFailed(false);
    if (ended) {
      seekTo(0);
      setPaused(false);
      return;
    }
    setPaused((p) => !p);
  };
  const share = time.length > 0 ? time.position / time.length : 0;
  const adjective = minutesAdjective(item.media?.durationLabel ?? item.durationLabel);

  const playLayer = canPlay && !still ? (
    <Pressable
      testID={`tap-${item.id}`}
      accessibilityRole="button"
      accessibilityLabel={playing ? 'Pause' : 'Play'}
      onPress={toggle}
      style={styles.tapLayer}
    >
      {active && !playing ? (
        <View style={styles.paused} testID={`paused-${item.id}`} pointerEvents="none">
          <Icon name="Play" size={metrics.pausedIcon} color={media.ink} fill={media.ink} />
        </View>
      ) : playing && load === 'waiting' ? (
        <View style={styles.paused} testID={`waiting-${item.id}`} pointerEvents="none">
          <ActivityIndicator testID={`spinner-${item.id}`} size="large" color={media.ink} />
        </View>
      ) : null}
      {failed ? (
        <Text testID={`failed-${item.id}`} accessibilityRole="alert" style={[words.pill, styles.failed, { color: media.ink, backgroundColor: media.pill }]}>
          {PLAYER_FAILED}
        </Text>
      ) : null}
    </Pressable>
  ) : null;

  return (
    <PostFrame
      {...props}
      kind={course ? 'course' : 'video'}
      detail={detail}
      backdrop={
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {still ? (
            picture.uri ? (
              <Image testID={`still-${item.id}`} source={{ uri: picture.uri }} contentFit="cover" accessibilityLabel={item.title} onError={picture.onError} style={StyleSheet.absoluteFill} />
            ) : (
              <View testID={`video-mark-${item.id}`} style={[StyleSheet.absoluteFill, styles.mark]}>
                <Icon name={course ? 'GraduationCap' : 'Video'} size={metrics.loadingMark} color={media.dot} />
              </View>
            )
          ) : (
            <>
              {framed === uri ? null : picture.uri ? (
                <Image testID={`cover-${item.id}`} source={{ uri: picture.uri }} contentFit="cover" accessibilityLabel={item.title} onError={picture.onError} style={StyleSheet.absoluteFill} />
              ) : (
                <View testID={`video-mark-${item.id}`} style={[StyleSheet.absoluteFill, styles.mark]}>
                  <Icon name={course ? 'GraduationCap' : 'Video'} size={metrics.loadingMark} color={media.dot} />
                </View>
              )}
              <VideoSurface
                uri={uri}
                playing={playing}
                seek={seek}
                frosted={previewEnded}
                onTime={(position, length) => setTime({ position, length })}
                onEnded={() => setEnded(true)}
                onLoad={onLoad}
                fullscreenAt={fullscreen}
                onFirstFrame={() => setFramed(uri)}
                testID={`video-${item.id}`}
              />
            </>
          )}
          {previewEnded ? <View style={[StyleSheet.absoluteFill, { backgroundColor: media.veil }]} /> : null}
        </View>
      }
      corner={(space: MiddleSpace) => {
        // R-117: the full-screen button, top right under the tabs where the photo set draws its counter; a still has no video, and an ended preview has nothing more to play.
        if (!canPlay || still || previewEnded) return null;
        const top = fromTop(props.chromeTop, metrics.counterTop);
        return (
          <View
            pointerEvents="box-none"
            style={[styles.fullscreen, { top, right: counterRight({ side: metrics.side, railClearRight: metrics.railClear, counterBottom: top + layout.tapMin, railTop: space.railTop, gap: metrics.counterRailGap }) }]}
          >
            <FullscreenButton onPress={() => setFullscreen((n) => n + 1)} label={`Full screen, ${item.title}`} testID={`fullscreen-${item.id}`} />
          </View>
        );
      }}
      middle={(space: MiddleSpace) => {
        if (!previewEnded) return playLayer;
        const { top, scale } = roomPlacement({
          areaTop: space.top,
          areaBottom: space.bottom,
          canvasTop: fromTop(props.chromeTop, metrics.endedTop),
          boxH: messageH || metrics.endedH,
          extentH: messageH || metrics.endedH,
        });
        return (
          <View
            onLayout={(e) => {
              const next = Math.round(e.nativeEvent.layout.height);
              if (next !== messageH) setMessageH(next);
            }}
            style={[styles.ended, { top, opacity: space.ready && messageH > 0 ? 1 : 0, transform: [{ scale }] }]}
            testID={`preview-ended-${item.id}`}
          >
            <View style={[styles.lockCircle, { backgroundColor: media.glass, borderColor: media.glassEdge }]}>
              <Icon name="Lock" size={metrics.endedIcon} color={media.ink} />
            </View>
            <Text accessibilityRole="header" style={[words.endedTitle, { color: media.ink }]}>
              Preview ended
            </Text>
            <Text style={[words.endedBody, { maxWidth: endedBodyWidth(space.width, metrics.endedWidth, metrics.endedRailClear), color: media.ink }]}>
              {adjective ? `The full ${adjective} video is one tap away.` : 'The full video is one tap away.'}
            </Text>
          </View>
        );
      }}
      above={
        canPlay && !still && !previewEnded ? (
          <Seekable
            testID={`scrub-${item.id}`}
            label={course ? 'Lesson position' : 'Video position'}
            value={`${clock(time.position)} of ${clock(time.length)}`}
            onSeek={(s) => seekTo(s * time.length)}
            onStep={(d) => seekTo(time.position + d * SKIP_SECONDS)}
            style={styles.scrub}
          >
            <TrackBar inset={false} share={share} label={`${clock(time.position)} / ${clock(time.length)}`} testID={`scrub-fill-${item.id}`} />
          </Seekable>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  /** The scrub bar's own box ends where the rail starts, so it can never take a tap meant for the Tip button (FIX-68 F-1). */
  scrub: { marginRight: metrics.barRight },
  tapLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  paused: { opacity: 0.85 },
  fullscreen: { position: 'absolute', zIndex: 7 },
  failed: { position: 'absolute', bottom: '38%', paddingHorizontal: gap.md, paddingVertical: gap.sm, borderRadius: radius.chip, overflow: 'hidden' },
  mark: { alignItems: 'center', justifyContent: 'center' },
  ended: {
    position: 'absolute',
    left: metrics.endedSide,
    right: metrics.endedSide,
    alignItems: 'center',
    gap: metrics.endedGap,
    zIndex: 5,
  },
  lockCircle: {
    width: metrics.endedCircle,
    height: metrics.endedCircle,
    borderRadius: metrics.endedCircle / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
