import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { queryClient } from '@/api/query';
import { Button, IconButton } from '@/components/Button';
import { Icon } from '@/components/icon';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { PLAYER_FAILED } from '@/features/feed/model';
import { VideoSurface } from '@/features/feed/player';
import { usePlayerLoad } from '@/features/feed/player/useLoad';
import { font, layout, radius, space } from '@/theme';
import { darkColors } from '@/theme/tokens.generated';

import { detailKey, fetchDetail } from './api';
import { trailerMetrics as t } from './look';
import { premiereAhead } from './model';
import { WatchFlow } from './WatchFlow';

/** "0:51": a position or a length in minutes and seconds. */
export function clock(seconds: number): string {
  const whole = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

export type TrailerScreenProps = { movieId: string; onClose: () => void; onOpenTerms?: () => void; onOpenPrivacy?: () => void; now?: Date };

/**
 * MV3 · Trailer: a `file` trailer plays in the app through the app's own video player (`VideoSurface`), with a play and pause
 * button, a bar and the time, over the board's black page. "Watch on Flixora" opens MV4; before a premiere it is not drawn (the
 * trailer is all that is out, MV9). A `youtube` trailer is opened outside the app at once (G-FLIX-3), and the screen closes.
 */
export function TrailerScreen({ movieId, onClose, onOpenTerms, onOpenPrivacy, now = new Date() }: TrailerScreenProps) {
  const insets = useSafeAreaInsets();
  const detail = useQuery({ queryKey: detailKey(movieId), queryFn: () => fetchDetail(movieId) }, queryClient);
  const movie = detail.data;
  const trailer = movie?.trailer ?? null;
  const [playing, setPlaying] = useState(true);
  // R-117: the trailer is still coming in (the button shows the spinner in place of pause); or it will not load (the words stand over the picture, and Play asks again).
  const stop = useCallback(() => setPlaying(false), []);
  const load = usePlayerLoad(playing, stop);
  const [time, setTime] = useState({ at: 0, length: 0 });
  const [sheet, setSheet] = useState(false);
  const left = useRef(false);

  // A YouTube trailer plays outside the app: open it once and leave this screen.
  useEffect(() => {
    if (trailer?.kind !== 'youtube' || left.current) return;
    left.current = true;
    void Linking.openURL(trailer.url)
      .catch(() => undefined)
      .finally(onClose);
  }, [trailer, onClose]);

  const ahead = movie ? premiereAhead(movie, now) : false;
  const share = time.length > 0 ? Math.min(1, time.at / time.length) : 0;
  const ink = darkColors.textOnAccent;

  return (
    <View testID="trailer-screen" style={[styles.root, { backgroundColor: darkColors.surfacePage }]}>
      <View style={[styles.bar, { paddingTop: insets.top + 6 }]}>
        <IconButton icon="X" label="Close" tone="glass" onPress={onClose} testID="trailer-close" />
      </View>
      {detail.isPending ? (
        <View testID="trailer-loading" accessibilityLabel="Loading" style={styles.middle}>
          <Skeleton height={t.height} radius={0} />
        </View>
      ) : detail.isError || !movie ? (
        <View style={styles.middle}>
          <ErrorState testID="trailer-error" icon="WifiOff" title="Couldn't load the trailer" message="Check your connection and try again." onRetry={() => void detail.refetch()} />
        </View>
      ) : trailer?.kind === 'file' ? (
        <View style={styles.middle}>
          <View style={styles.video}>
            <VideoSurface
              key={load.attempt}
              testID="trailer-video"
              uri={trailer.url}
              playing={playing}
              seek={null}
              frosted={false}
              onTime={(at, length) => setTime({ at, length })}
              onEnded={() => setPlaying(false)}
              onLoad={load.onLoad}
            />
            {load.failed ? (
              <View pointerEvents="none" style={styles.failedLayer}>
                <Text variant="errorLine" accessibilityRole="alert" testID="trailer-failed" style={[styles.failed, { backgroundColor: darkColors.surfaceScrim, color: ink }]}>
                  {PLAYER_FAILED}
                </Text>
              </View>
            ) : null}
            <View style={styles.controls}>
              <Pressable testID="trailer-toggle" accessibilityRole="button" accessibilityLabel={load.failed ? PLAYER_FAILED : playing ? (load.waiting ? 'Loading, tap to pause' : 'Pause') : 'Play'} accessibilityState={load.waiting ? { busy: true } : undefined} hitSlop={space.md} onPress={() => setPlaying((p) => !p)}>
                {load.waiting ? <ActivityIndicator testID="trailer-spinner" size="small" color={ink} /> : <Icon name={playing ? 'Pause' : 'Play'} size={t.icon} color={ink} fill={ink} strokeWidth={2.4} />}
              </Pressable>
              <View style={[styles.track, { backgroundColor: darkColors.mediaWhite25 }]}>
                <View testID="trailer-progress" style={[styles.fill, { width: `${Math.round(share * 100)}%`, backgroundColor: ink }]} />
              </View>
              <Text variant="caption" tone="textOnAccent" testID="trailer-time" style={{ fontSize: t.time }}>
                {`${clock(time.at)} / ${clock(time.length)}`}
              </Text>
            </View>
          </View>
          <View style={styles.words}>
            <Text variant="label" tone="textOnAccent" style={styles.kicker}>
              Trailer
            </Text>
            <Text variant="sheetTitle" tone="textOnAccent" accessibilityRole="header" style={styles.title}>
              {movie.title}
            </Text>
          </View>
        </View>
      ) : trailer ? (
        <View style={styles.middle} />
      ) : (
        <View style={styles.middle}>
          <ErrorState testID="trailer-none" icon="Clapperboard" title="No trailer yet" message={`There is no trailer for ${movie.title} yet.`} />
        </View>
      )}
      {movie && !ahead ? (
        <View style={[styles.foot, { paddingBottom: Math.max(insets.bottom, t.footBottom) }]}>
          <Button testID="trailer-watch" label="Watch on Flixora" variant="white" onPress={() => setSheet(true)} />
        </View>
      ) : null}
      {movie ? (
        <WatchFlow movieId={movie.id} title={movie.title} mustAgreeTerms={movie.mustAgreeTerms} visible={sheet} onClose={() => setSheet(false)} onOpenTerms={onOpenTerms} onOpenPrivacy={onOpenPrivacy} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bar: { paddingHorizontal: layout.gutter, flexDirection: 'row' },
  middle: { flex: 1, justifyContent: 'center', gap: t.between },
  video: { height: t.height, overflow: 'hidden' },
  failedLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  failed: { textAlign: 'center', paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.chip, overflow: 'hidden' },
  controls: { position: 'absolute', left: t.controlsInset, right: t.controlsInset, bottom: t.controlsBottom, flexDirection: 'row', alignItems: 'center', gap: t.controlsGap },
  track: { flex: 1, height: t.scrub, borderRadius: t.scrub / 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: t.scrub / 2 },
  words: { paddingHorizontal: layout.gutter },
  kicker: { fontSize: t.kicker, letterSpacing: t.kicker * t.kickerTrack, opacity: t.kickerOpacity, ...font(700) },
  title: { marginTop: t.titleTop, fontSize: t.title },
  foot: { paddingHorizontal: layout.gutter },
});
