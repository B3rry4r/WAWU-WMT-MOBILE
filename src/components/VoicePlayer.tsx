import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { font, layout, radius, space, type, useWawu } from '@/theme';

import { pressScale } from './Button';
import { useFocusRing } from './focusRing';
import { Icon } from './icon';
import { Text } from './Text';

/**
 * design/_gen/me.js lines 13 to 15 (`wave`, `aiTag`, `voicePlayer`), the player on M1 and VF11: a pill 8 in from the top, bottom and
 * left and 12 from the right, a 36 play button, 10 between parts, 26 bars 2 apart in a 26 high strip, the time at 12.
 * The Bio label is `aiTag` there (22 high, 8 across, 11 at 700, a 11 wave mark at 2.4, 4 between mark and word).
 */
export const voicePlayerMetrics = {
  padV: 8,
  padLeft: 8,
  padRight: 12,
  between: 10,
  button: 36,
  buttonIcon: 16,
  buttonIconStroke: 2.4,
  bars: 26,
  barGap: 2,
  barRadius: 2,
  waveHeight: 26,
  time: 12,
  label: { height: 22, padH: 8, font: 11, icon: 11, iconStroke: 2.4, iconToWord: 4 },
  /** The "AI voice" tag is not on the boards (R-66 adds it): smaller than the Bio label, in the sunken tone, so it reads as a note. */
  aiVoiceTag: { height: 20, padH: 7, font: 10 },
  /** On a phone too narrow for 26 bars, fewer are drawn so none is thinner than this, and never fewer than the floor. */
  minBar: 2,
  minBars: 8,
} as const;

/** The bar heights the kit draws, in percent of the strip, repeating every 12 bars (me.js line 13). */
export const waveShape = [40, 70, 55, 90, 60, 35, 80, 100, 65, 45, 75, 50] as const;

/** The edge the kit draws inside the pill (`box-shadow: inset 0 0 0 1px var(--border-hairline)`): it adds no height. */
const edge = 1;

/** The Voice Intro is always called "Bio" (R-66). */
export const voiceLabelText = 'Bio';
/** The small tag that tells a listener the voice is made by AI (R-66). No outside brand is named in it (R-68). */
export const aiVoiceTagText = 'AI voice';

/** "0:22": minutes, a colon and two-digit seconds. A whole number of seconds from the Hub (`durationSeconds`). */
export function voiceClock(seconds: number): string {
  const whole = Math.max(0, Math.round(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

/** How many bars fit the strip's width: all 26 where the board draws them, fewer on a narrow phone (an unmeasured strip draws all). */
export function barCountFor(width: number | undefined): number {
  const m = voicePlayerMetrics;
  if (width === undefined || !(width > 0)) return m.bars;
  return Math.min(m.bars, Math.max(m.minBars, Math.floor((width + m.barGap) / (m.minBar + m.barGap))));
}

/** How many of the bars are drawn as played, from how far through the clip the listener is (0 to 1). */
export function playedBars(progress: number | undefined, bars: number = voicePlayerMetrics.bars): number {
  const p = progress === undefined || !Number.isFinite(progress) ? 0 : Math.min(1, Math.max(0, progress));
  return Math.round(p * bars);
}

export type VoiceLabelProps = {
  /** Draw the small "AI voice" tag after the Bio label. The Hub marks the audio (R-66); true unless it says otherwise. */
  aiVoice?: boolean;
  testID?: string;
};

/**
 * The "Bio" label and the small "AI voice" tag. The player draws it after its time; VF11 draws it alone, under the person's avatar,
 * with the player beneath (`label="none"` on the player there).
 */
export function VoiceLabel({ aiVoice = true, testID }: VoiceLabelProps) {
  const { colors } = useWawu();
  const m = voicePlayerMetrics.label;
  return (
    <View testID={testID} style={styles.labels}>
      <View style={[styles.tag, { backgroundColor: colors.accentTint }]}>
        <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Icon name="AudioLines" size={m.icon} color={colors.accentFg} strokeWidth={m.iconStroke} />
        </View>
        <Text variant="body" tone="accentFg" style={[font(700), styles.tagText]}>
          {voiceLabelText}
        </Text>
      </View>
      {aiVoice ? (
        <View testID={testID ? `${testID}-ai` : undefined} style={[styles.tag, styles.aiVoiceTag, { backgroundColor: colors.surfaceSunken }]}>
          <Text variant="body" tone="textSecondary" style={[font(700), styles.aiVoiceTagText]}>
            {aiVoiceTagText}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export type VoicePlayerStatus = 'idle' | 'loading' | 'playing' | 'error';

export type VoicePlayerProps = {
  /**
   * `idle` shows Play (also when paused part-way: `progress` says where); `playing` shows Pause; `loading` is the audio on its way
   * (the button is busy and cannot be pressed); `error` is the audio that could not be fetched or played: the strip is replaced by
   * the message and the button tries again.
   */
  status: VoicePlayerStatus;
  /** How far through the clip, 0 to 1. The played bars take the accent. */
  progress?: number;
  /** The clip's length in whole seconds, as the Hub serves it. Drawn as "0:22". */
  durationSeconds: number;
  /** Pressed to play, to pause, or (in `error`) to try again. */
  onToggle: () => void;
  /** `inline` draws the Bio label and tag in the pill (M1); `none` leaves them out for a screen that draws `VoiceLabel` itself (VF11). */
  label?: 'inline' | 'none';
  /** The small "AI voice" tag (R-66). True unless the Hub says the audio is not AI voice. */
  aiVoice?: boolean;
  /** What the pill says when `status` is `error`. */
  errorMessage?: string;
  testID?: string;
};

const defaultError = "Couldn't play this. Tap to try again.";

/**
 * The Voice Intro: play and pause, a bar strip that fills as it plays, the clip's length, and the "Bio" label with the small "AI voice"
 * tag (R-66). It plays nothing itself: the screen owns the audio and passes its status and position, so the same pill is the
 * player on M1, M5 to M7 and VF11.
 */
export function VoicePlayer({ status, progress, durationSeconds, onToggle, label = 'inline', aiVoice = true, errorMessage = defaultError, testID }: VoicePlayerProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const m = voicePlayerMetrics;
  const [waveWidth, setWaveWidth] = useState<number | undefined>();
  const bars = barCountFor(waveWidth);
  const played = playedBars(progress, bars);
  const loading = status === 'loading';
  const failed = status === 'error';
  const clock = voiceClock(durationSeconds);
  const buttonLabel = failed ? 'Try again' : loading ? 'Loading Bio' : status === 'playing' ? 'Pause Bio' : `Play Bio, ${clock}`;

  return (
    <View
      testID={testID}
      style={[
        styles.pill,
        { backgroundColor: colors.surfaceCard, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: edge, color: colors.borderHairline, inset: true }] },
      ]}
    >
      <Pressable
        testID={testID ? `${testID}-button` : undefined}
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
        accessibilityState={{ disabled: loading, busy: loading }}
        disabled={loading}
        onPress={onToggle}
        hitSlop={(layout.tapMin - m.button) / 2}
        {...ring.handlers}
        style={({ pressed }) => [styles.button, { backgroundColor: colors.accent, transform: [{ scale: pressed && !loading ? pressScale : 1 }] }, ring.style]}
      >
        {loading ? (
          <ActivityIndicator testID={testID ? `${testID}-spinner` : undefined} size="small" color={colors.textOnAccent} />
        ) : (
          <Icon
            name={failed ? 'RotateCcw' : status === 'playing' ? 'Pause' : 'Play'}
            size={m.buttonIcon}
            color={colors.textOnAccent}
            strokeWidth={m.buttonIconStroke}
            fill={failed ? 'none' : colors.textOnAccent}
          />
        )}
      </Pressable>

      {failed ? (
        <Text variant="errorLine" accessibilityRole="alert" style={styles.error}>
          {errorMessage}
        </Text>
      ) : (
        <>
          <View
            testID={testID ? `${testID}-wave` : undefined}
            accessibilityRole="progressbar"
            accessibilityLabel="Bio"
            accessibilityValue={{ min: 0, max: 100, now: Math.round((played / bars) * 100) }}
            onLayout={(e) => setWaveWidth(e.nativeEvent.layout.width)}
            style={styles.wave}
          >
            {Array.from({ length: bars }, (_, i) => (
              <View
                key={i}
                style={[styles.bar, { height: `${waveShape[i % waveShape.length]}%`, backgroundColor: i < played ? colors.accent : colors.borderStrong }]}
              />
            ))}
          </View>
          <Text variant="body" tone="textMuted" style={styles.time}>
            {clock}
          </Text>
          {label === 'inline' ? <VoiceLabel aiVoice={aiVoice} testID={testID ? `${testID}-label` : undefined} /> : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: voicePlayerMetrics.between,
    paddingVertical: voicePlayerMetrics.padV,
    paddingLeft: voicePlayerMetrics.padLeft,
    paddingRight: voicePlayerMetrics.padRight,
    borderRadius: radius.chip,
  },
  button: {
    width: voicePlayerMetrics.button,
    height: voicePlayerMetrics.button,
    borderRadius: voicePlayerMetrics.button / 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  wave: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: voicePlayerMetrics.barGap, height: voicePlayerMetrics.waveHeight },
  bar: { flex: 1, borderRadius: voicePlayerMetrics.barRadius },
  time: { fontSize: voicePlayerMetrics.time, lineHeight: Math.round(voicePlayerMetrics.time * type.leading.snug), flexShrink: 0, fontVariant: ['tabular-nums'] },
  error: { flex: 1, paddingVertical: space.xs },
  labels: { flexDirection: 'row', alignItems: 'center', gap: space.xs, flexShrink: 0 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    height: voicePlayerMetrics.label.height,
    paddingHorizontal: voicePlayerMetrics.label.padH,
    gap: voicePlayerMetrics.label.iconToWord,
    borderRadius: radius.chip,
    flexShrink: 0,
  },
  tagText: { fontSize: voicePlayerMetrics.label.font, lineHeight: Math.round(voicePlayerMetrics.label.font * type.leading.snug) },
  aiVoiceTag: { height: voicePlayerMetrics.aiVoiceTag.height, paddingHorizontal: voicePlayerMetrics.aiVoiceTag.padH },
  aiVoiceTagText: { fontSize: voicePlayerMetrics.aiVoiceTag.font, lineHeight: Math.round(voicePlayerMetrics.aiVoiceTag.font * type.leading.snug) },
});
