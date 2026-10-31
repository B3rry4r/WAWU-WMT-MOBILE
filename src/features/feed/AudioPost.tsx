import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';

import { media, metrics, words } from './look';
import { clock, pictureCandidates, PLAYER_FAILED, playableUrl, SKIP_SECONDS, WAVEFORM_BARS } from './model';
import { AudioSource, canPlay, loadPeaks, type LoadState, type SeekRequest } from './player';
import { fromTop, PostFrame, type PostProps } from './PostFrame';
import { Seekable } from './parts';
import { usePicture } from './usePicture';

/** The waveform at the canvas's size: every bar and the gaps between them (44 x 3 + 43 x 2.5 = 239.5 wide). */
const WAVE_WIDTH = WAVEFORM_BARS * metrics.waveBar + (WAVEFORM_BARS - 1) * metrics.waveGap;

/**
 * How much of the canvas's waveform a phone this wide has room for. It is centred under the square, and the rail's box starts
 * `railRight` + the avatar in from the right edge, and the avatar's ring (drawn outside that box) takes the tap too, so a phone under about
 * 364 wide would draw its last bars under the rail, where the rail takes the tap (zIndex 7 over the middle's 3): the same room is kept on
 * both sides and the bars are drawn smaller, never fewer (FIX-68 N1, SWEEP-APP-6b L4). Phones from 364 up draw it as the canvas does.
 */
const waveFit = (width: number) => Math.max(0, Math.min(1, (width - 2 * (metrics.railRight + metrics.avatar + metrics.avatarRing)) / WAVE_WIDTH));

/** Bar heights while the file has not been read (or cannot be, on a phone build today): level. */
const level = Array.from({ length: WAVEFORM_BARS }, () => 0.5);

function RoundButton({ icon, label, onPress, big, loading, testID }: { icon: 'RotateCcw' | 'RotateCw' | 'Play' | 'Pause'; label: string; onPress: () => void; big?: boolean; /** R-117: the file is still coming in; the button keeps its place and shows the spinner. */ loading?: boolean; testID?: string }) {
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={loading ? { busy: true } : undefined}
      onPress={onPress}
      {...ring.handlers}
      style={[big ? [styles.play, { backgroundColor: media.ink }] : styles.skip, ring.style]}
    >
      {big && loading ? (
        <ActivityIndicator testID={testID ? `${testID}-spinner` : undefined} size="small" color={media.inkOnLight} />
      ) : big ? (
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
  const { item, active, width } = props;
  const fit = waveFit(width);
  const uri = playableUrl(item);
  // The square is the creator's cover when there is one (H6 draws a cover photo there, R-114); else the tile with the audio mark.
  const { uri: cover, onError: coverFailed } = usePicture(pictureCandidates(item, null));
  const [paused, setPaused] = useState(false);
  const [time, setTime] = useState({ position: 0, length: 0 });
  const [seek, setSeek] = useState<SeekRequest>(null);
  const [peaks, setPeaks] = useState<number[] | null>(null);
  // R-117: the file is still coming in (the play button shows the spinner until the sound runs); or it will not load (the words say so).
  const [load, setLoad] = useState<LoadState>('ready');
  const [failed, setFailed] = useState(false);
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
          width: metrics.waveBar * fit,
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
            title={item.title}
            onTime={(position, length) => setTime({ position, length })}
            onEnded={() => setPaused(true)}
            onLoad={onLoad}
            testID={`audio-${item.id}`}
          />
        </View>
      }
      middle={
        <View pointerEvents="box-none" style={[styles.stage, { top: fromTop(props.chromeTop, metrics.bookTop) }]}>
          <View style={[styles.art, { backgroundColor: media.glass, borderColor: media.glassEdge, boxShadow: `0 30px 50px -12px ${media.coverShadow}` }]} testID={`art-${item.id}`}>
            {cover ? <Image testID={`art-image-${item.id}`} source={{ uri: cover }} contentFit="cover" accessibilityLabel={item.title} onError={coverFailed} style={StyleSheet.absoluteFill} /> : <Icon name="AudioLines" size={metrics.pausedIcon} color={media.ink} />}
          </View>
          {canPlay ? (
            <Seekable
              testID={`wave-${item.id}`}
              label="Audio position"
              value={`${clock(time.position)} of ${clock(time.length)}`}
              onSeek={(s) => seekTo(s * time.length)}
              onStep={(d) => seekTo(time.position + d * SKIP_SECONDS)}
              style={[styles.wave, { gap: metrics.waveGap * fit }]}
            >
              {waveform}
            </Seekable>
          ) : (
            <View style={[styles.wave, { gap: metrics.waveGap * fit }]} testID={`wave-${item.id}`}>
              {waveform}
            </View>
          )}
          {canPlay ? (
            <View style={styles.controls}>
              <RoundButton icon="RotateCcw" label={`Back ${SKIP_SECONDS} seconds`} onPress={() => seekTo(time.position - SKIP_SECONDS)} testID={`back-${item.id}`} />
              <RoundButton
                big
                loading={playing && load === 'waiting'}
                icon={playing ? 'Pause' : 'Play'}
                label={playing ? (load === 'waiting' ? 'Loading, tap to pause' : 'Pause') : 'Play'}
                onPress={() => {
                  setFailed(false);
                  setPaused((p) => !p);
                }}
                testID={`play-${item.id}`}
              />
              <RoundButton icon="RotateCw" label={`On ${SKIP_SECONDS} seconds`} onPress={() => seekTo(time.position + SKIP_SECONDS)} testID={`on-${item.id}`} />
            </View>
          ) : null}
          {failed ? (
            <Text testID={`failed-${item.id}`} accessibilityRole="alert" style={[words.pill, { color: media.ink }]}>
              {PLAYER_FAILED}
            </Text>
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
    overflow: 'hidden',
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
