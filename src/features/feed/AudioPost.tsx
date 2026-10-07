import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';

import { media, metrics } from './look';
import { clock, playableUrl, SKIP_SECONDS, WAVEFORM_BARS } from './model';
import { AudioSource, canPlay, loadPeaks, type SeekRequest } from './player';
import { fromTop, PostFrame, type PostProps } from './PostFrame';
import { Seekable } from './parts';

/** Bar heights while the file has not been read (or cannot be, on a phone build today): level. */
const level = Array.from({ length: WAVEFORM_BARS }, () => 0.5);

function RoundButton({ icon, label, onPress, big, testID }: { icon: 'RotateCcw' | 'RotateCw' | 'Play' | 'Pause'; label: string; onPress: () => void; big?: boolean; testID?: string }) {
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      {...ring.handlers}
      style={[big ? [styles.play, { backgroundColor: media.ink }] : styles.skip, ring.style]}
    >
      {big ? (
        <Icon name={icon} size={metrics.playIcon} color={media.inkOnLight} fill={media.inkOnLight} />
      ) : (
        <Icon name={icon} size={metrics.controlIcon} color={media.ink} />
      )}
    </Pressable>
  );
}

/**
 * H6: an audio post. It plays while it fills the screen; the big button pauses and plays,
 * the two beside it move back and on, and the waveform is a scrubber. The waveform is read
 * from the file itself where the build can decode it (the Hub serves no peaks,
 * BACKEND_GAPS G-217); the square above it is a tile, because an audio piece has no
 * cover picture (BACKEND_GAPS G-218).
 */
export function AudioPost(props: PostProps) {
  const { item, active } = props;
  const uri = playableUrl(item);
  const [paused, setPaused] = useState(false);
  const [time, setTime] = useState({ position: 0, length: 0 });
  const [seek, setSeek] = useState<SeekRequest>(null);
  const [peaks, setPeaks] = useState<number[] | null>(null);

  // Coming back to the post starts it playing again (a locked video's ended preview stays ended).
  const [wasActive, setWasActive] = useState(active);
  if (active !== wasActive) {
    setWasActive(active);
    if (active) setPaused(false);
  }

  useEffect(() => {
    if (!active || peaks) return;
    let live = true;
    loadPeaks(uri, WAVEFORM_BARS).then((p) => {
      if (live && p) setPeaks(p);
    });
    return () => {
      live = false;
    };
  }, [active, peaks, uri]);

  const playing = active && !paused;
  const seekTo = (to: number) => setSeek({ to: Math.max(0, Math.min(time.length || 0, to)), at: Date.now() });
  const share = time.length > 0 ? time.position / time.length : 0;
  const bars = peaks ?? level;
  const played = Math.round(share * bars.length);

  const waveform = bars.map((h, i) => (
    <View
      key={i}
      pointerEvents="none"
      testID={i < played ? `wave-played-${item.id}` : undefined}
      style={[
        styles.bar,
        {
          height: Math.max(metrics.waveMin, h) * metrics.waveH,
          backgroundColor: i < played ? media.ink : media.waveRest,
        },
      ]}
    />
  ));

  return (
    <PostFrame
      {...props}
      kind="audio"
      backdrop={
        <View style={[StyleSheet.absoluteFill, { backgroundColor: media.backdrop }]}>
          <AudioSource
            uri={uri}
            playing={playing}
            seek={seek}
            onTime={(position, length) => setTime({ position, length })}
            onEnded={() => setPaused(true)}
            testID={`audio-${item.id}`}
          />
        </View>
      }
      middle={
        <View pointerEvents="box-none" style={[styles.stage, { top: fromTop(props.chromeTop, metrics.bookTop) }]}>
          <View style={[styles.art, { backgroundColor: media.glass, borderColor: media.glassEdge, boxShadow: `0 30px 50px -12px ${media.coverShadow}` }]} testID={`art-${item.id}`}>
            <Icon name="AudioLines" size={metrics.pausedIcon} color={media.ink} />
          </View>
          {canPlay ? (
            <Seekable
              testID={`wave-${item.id}`}
              label="Audio position"
              value={`${clock(time.position)} of ${clock(time.length)}`}
              onSeek={(s) => seekTo(s * time.length)}
              onStep={(d) => seekTo(time.position + d * SKIP_SECONDS)}
              style={styles.wave}
            >
              {waveform}
            </Seekable>
          ) : (
            <View style={styles.wave} testID={`wave-${item.id}`}>
              {waveform}
            </View>
          )}
          {canPlay ? (
            <View style={styles.controls}>
              <RoundButton icon="RotateCcw" label={`Back ${SKIP_SECONDS} seconds`} onPress={() => seekTo(time.position - SKIP_SECONDS)} testID={`back-${item.id}`} />
              <RoundButton
                big
                icon={playing ? 'Pause' : 'Play'}
                label={playing ? 'Pause' : 'Play'}
                onPress={() => setPaused((p) => !p)}
                testID={`play-${item.id}`}
              />
              <RoundButton icon="RotateCw" label={`On ${SKIP_SECONDS} seconds`} onPress={() => seekTo(time.position + SKIP_SECONDS)} testID={`on-${item.id}`} />
            </View>
          ) : null}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  stage: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: metrics.audioGap, zIndex: 3 },
  art: {
    width: metrics.artSize,
    height: metrics.artSize,
    borderRadius: metrics.artRadius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: { flexDirection: 'row', alignItems: 'center', gap: metrics.waveGap, height: metrics.waveH },
  bar: { width: metrics.waveBar, borderRadius: metrics.trackRadius },
  controls: { flexDirection: 'row', alignItems: 'center', gap: metrics.controlsGap },
  play: {
    width: metrics.playSize,
    height: metrics.playSize,
    borderRadius: metrics.playSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skip: { alignItems: 'center', justifyContent: 'center' },
});
