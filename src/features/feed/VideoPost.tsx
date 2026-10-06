import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';

import { media, metrics, words } from './look';
import { clock, isLocked, minutesAdjective, playableUrl, SKIP_SECONDS } from './model';
import { canPlay, VideoSurface, type SeekRequest } from './player';
import { fromTop, PostFrame, type PostProps } from './PostFrame';
import { Seekable, TrackBar } from './parts';

/**
 * H2 (a video) and H5 (a locked video). It plays while it fills the screen; a tap pauses or
 * plays it, and the scrubber above the caption moves it. A locked video plays its public
 * preview, and when the preview ends the frame frosts and says so (H5).
 */
export function VideoPost(props: PostProps) {
  const { item, active } = props;
  const locked = isLocked(item);
  const [paused, setPaused] = useState(false);
  const [time, setTime] = useState({ position: 0, length: 0 });
  const [ended, setEnded] = useState(false);
  const [seek, setSeek] = useState<SeekRequest>(null);

  // Coming back to the post starts it playing again (a locked video's ended preview stays ended).
  const [wasActive, setWasActive] = useState(active);
  if (active !== wasActive) {
    setWasActive(active);
    if (active) setPaused(false);
  }

  const previewEnded = locked && ended;
  const playing = active && !paused && !ended;
  const seekTo = (to: number) => {
    setEnded(false);
    setSeek({ to: Math.max(0, Math.min(time.length || 0, to)), at: Date.now() });
  };
  const toggle = () => {
    if (ended) {
      seekTo(0);
      setPaused(false);
      return;
    }
    setPaused((p) => !p);
  };
  const share = time.length > 0 ? time.position / time.length : 0;
  const adjective = minutesAdjective(item.media?.durationLabel ?? item.durationLabel);

  return (
    <PostFrame
      {...props}
      kind="video"
      backdrop={
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <VideoSurface
            uri={playableUrl(item)}
            playing={playing}
            seek={seek}
            frosted={previewEnded}
            onTime={(position, length) => setTime({ position, length })}
            onEnded={() => setEnded(true)}
            testID={`video-${item.id}`}
          />
          {previewEnded ? <View style={[StyleSheet.absoluteFill, { backgroundColor: media.veil }]} /> : null}
        </View>
      }
      middle={
        previewEnded ? (
          <View style={[styles.ended, { top: fromTop(props.chromeTop, metrics.endedTop) }]} testID={`preview-ended-${item.id}`}>
            <View style={[styles.lockCircle, { backgroundColor: media.glass, borderColor: media.glassEdge }]}>
              <Icon name="Lock" size={metrics.endedIcon} color={media.ink} />
            </View>
            <Text accessibilityRole="header" style={[words.endedTitle, { color: media.ink }]}>
              Preview ended
            </Text>
            <Text style={[words.endedBody, styles.endedBody, { color: media.ink }]}>
              {adjective ? `The full ${adjective} video is one tap away.` : 'The full video is one tap away.'}
            </Text>
          </View>
        ) : canPlay ? (
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
            ) : null}
          </Pressable>
        ) : null
      }
      above={
        canPlay && !previewEnded ? (
          <Seekable
            testID={`scrub-${item.id}`}
            label="Video position"
            value={`${clock(time.position)} of ${clock(time.length)}`}
            onSeek={(s) => seekTo(s * time.length)}
            onStep={(d) => seekTo(time.position + d * SKIP_SECONDS)}
          >
            <TrackBar share={share} label={`${clock(time.position)} / ${clock(time.length)}`} testID={`scrub-fill-${item.id}`} />
          </Seekable>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  tapLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  paused: { opacity: 0.85 },
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
  endedBody: { maxWidth: metrics.endedWidth },
});
