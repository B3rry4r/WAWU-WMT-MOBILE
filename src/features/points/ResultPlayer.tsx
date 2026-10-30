import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { pressScale } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { barCountFor, playedBars, voiceClock, voicePlayerMetrics as m, waveShape } from '@/components/VoicePlayer';
import { AudioSource, type SeekRequest } from '@/features/feed/player';
import { font, layout, radius, type, useWawu } from '@/theme';

export type ResultPlayerProps = {
  /** The Hub's link to the finished audio. */
  uri: string;
  /** What the player calls the audio for a screen reader: the tool's name ("VoiceOver"), never the Voice Intro's "Bio". */
  name: string;
  testID?: string;
};

/**
 * PT2b's player: the pill the Voice Intro uses (`VoicePlayer`'s measures, bars and clock) for the audio a tool made. It is not the Voice
 * Intro: no "Bio" label, and a screen reader hears the tool's name. The shared `VoicePlayer` says "Bio" in its labels and takes no name
 * (SHARED-CHANGES POINTS-08 #1); when it does this file goes and the screen uses it.
 */
export function ResultPlayer({ uri, name, testID }: ResultPlayerProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [length, setLength] = useState(0);
  const [seek, setSeek] = useState<SeekRequest>(null);
  const [waveWidth, setWaveWidth] = useState<number | undefined>();

  const onTime = useCallback((at: number, total: number) => {
    setPosition(at);
    setLength(total);
  }, []);
  const onEnded = useCallback(() => {
    setPlaying(false);
    setPosition(0);
    setSeek({ to: 0, at: Date.now() });
  }, []);

  const bars = barCountFor(waveWidth);
  const progress = length > 0 ? position / length : 0;
  const played = playedBars(progress, bars);
  const clock = voiceClock(length);

  return (
    <View
      testID={testID}
      style={[styles.pill, { backgroundColor: colors.surfaceCard, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] }]}
    >
      <AudioSource uri={uri} playing={playing} seek={seek} title={name} onTime={onTime} onEnded={onEnded} />
      <Pressable
        testID={testID ? `${testID}-button` : undefined}
        accessibilityRole="button"
        accessibilityLabel={playing ? `Pause ${name}` : length > 0 ? `Play ${name}, ${clock}` : `Play ${name}`}
        onPress={() => setPlaying((on) => !on)}
        hitSlop={(layout.tapMin - m.button) / 2}
        {...ring.handlers}
        style={({ pressed }) => [styles.button, { backgroundColor: colors.accent, transform: [{ scale: pressed ? pressScale : 1 }] }, ring.style]}
      >
        <Icon name={playing ? 'Pause' : 'Play'} size={m.buttonIcon} color={colors.textOnAccent} strokeWidth={m.buttonIconStroke} fill={colors.textOnAccent} />
      </Pressable>
      <View
        testID={testID ? `${testID}-wave` : undefined}
        accessibilityRole="progressbar"
        accessibilityLabel={name}
        accessibilityValue={{ min: 0, max: 100, now: playedBars(progress, 100) }}
        onLayout={(e) => setWaveWidth(e.nativeEvent.layout.width)}
        style={styles.wave}
      >
        {Array.from({ length: bars }, (_, i) => (
          <View key={i} style={[styles.bar, { height: `${waveShape[i % waveShape.length]}%`, backgroundColor: i < played ? colors.accent : colors.borderStrong }]} />
        ))}
      </View>
      <Text variant="body" tone="textMuted" testID={testID ? `${testID}-time` : undefined} style={styles.time}>
        {clock}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: m.between, paddingVertical: m.padV, paddingLeft: m.padLeft, paddingRight: m.padRight, borderRadius: radius.chip },
  button: { width: m.button, height: m.button, borderRadius: m.button / 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  wave: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: m.barGap, height: m.waveHeight },
  bar: { flex: 1, borderRadius: m.barRadius },
  time: { ...font(400), fontSize: m.time, lineHeight: Math.round(m.time * type.leading.snug), flexShrink: 0, fontVariant: ['tabular-nums'] },
});
