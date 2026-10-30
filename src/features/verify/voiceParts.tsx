import { useEffect, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, Easing, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { pressScale } from '@/components/Button';
import { browserOutlineOff, useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { PromoRow } from '@/components/PromoRow';
import { Text } from '@/components/Text';
import { playedBars, voicePlayerMetrics, waveShape } from '@/components/VoicePlayer';
import { font, layout, useWawu } from '@/theme';

/**
 * design/_gen/verify.js `playBig`: an 84 round accent disc with the FAB's shadow and a 34 mark at 2.2, white. `busy` is the Hub making the
 * audio (the disc cannot be pressed); `failed` is audio that could not be made or played (the mark turns round and the disc tries again).
 */
export const playDisc = { size: 84, icon: 34, stroke: 2.2 } as const;

export type PlayDiscProps = {
  playing: boolean;
  busy?: boolean;
  failed?: boolean;
  onPress: () => void;
  /** What a screen reader hears when the disc is idle ("Play your name"). */
  label: string;
  testID?: string;
};

export function PlayDisc({ playing, busy, failed, onPress, label, testID }: PlayDiscProps) {
  const { colors, shadows } = useWawu();
  const ring = useFocusRing();
  const spoken = busy ? 'Getting your name ready' : failed ? 'Try again' : playing ? 'Pause' : label;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={spoken}
      accessibilityState={{ disabled: Boolean(busy), busy: Boolean(busy) }}
      disabled={busy}
      onPress={onPress}
      hitSlop={Math.max(0, (layout.tapMin - playDisc.size) / 2)}
      {...ring.handlers}
      style={({ pressed }) => [styles.disc, { backgroundColor: colors.accent, boxShadow: shadows.fab, transform: [{ scale: pressed ? pressScale : 1 }] }, ring.style]}
    >
      {busy ? (
        <ActivityIndicator color={colors.textOnAccent} />
      ) : (
        <Icon name={failed ? 'RotateCcw' : playing ? 'Pause' : 'Play'} size={playDisc.icon} color={colors.textOnAccent} strokeWidth={playDisc.stroke} fill={failed ? 'none' : colors.textOnAccent} />
      )}
    </Pressable>
  );
}

/** design/_gen/verify.js `wave(30, ...)` held to 240 wide: 30 bars 2 apart in a 26 high strip, the played ones in the accent. */
export const nameWave = { bars: 30, width: 240 } as const;

/** The strip under the name while it plays (VF3). `progress` is 0 to 1. */
export function NameWave({ progress, testID }: { progress: number; testID?: string }) {
  const { colors } = useWawu();
  const m = voicePlayerMetrics;
  const played = playedBars(progress, nameWave.bars);
  return (
    <View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel="Your name playing"
      accessibilityValue={{ min: 0, max: 100, now: playedBars(progress, 100) }}
      style={[styles.wave, { width: nameWave.width, height: m.waveHeight, gap: m.barGap }]}
    >
      {Array.from({ length: nameWave.bars }, (_, i) => (
        <View key={i} style={{ flex: 1, height: `${waveShape[i % waveShape.length]}%`, borderRadius: m.barRadius, backgroundColor: i < played ? colors.accent : colors.borderStrong }} />
      ))}
    </View>
  );
}

export type EntryRowProps = {
  icon: IconName;
  title: string;
  line: string;
  onPress: () => void;
  testID?: string;
};

/**
 * A card with one row that opens one of the Voice screens: VF2's "Hear your name" and Me's Voice Intro prompt. It is the shared promo row
 * (R-110 point 1): a 40 rounded accent tile, the title, one line, a chevron, 72 high (design/_gen/verify.js line 88 drew a 44 round tile at 76).
 */
export function EntryRow({ icon, title, line, onPress, testID }: EntryRowProps) {
  return <PromoRow testID={testID} icon={icon} title={title} subtitle={line} onPress={onPress} />;
}

/**
 * design/_gen/verify.js line 93 (VF4's box): at least 200 high, 20 cornered, 16 inside, 15.5 type on a 1.5 line, the accent ring (the
 * danger ring over the limit). `TextField`'s multi-line box is 76 high with a label above it, and the board has no label, so this box is
 * the board's own until the shared field takes a height and a hidden label (SHARED-CHANGES VERIFY-02 #1).
 */
export const introBox = { minHeight: 200, corner: 20, pad: 16, font: 15.5, leading: 1.5, ring: 1.5 } as const;

export type IntroBoxProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  /** What a screen reader hears for the box. */
  label: string;
  /** Over the Hub's limit: the ring turns red. */
  over: boolean;
  /** Typing is off while the words are being kept. */
  disabled?: boolean;
  testID?: string;
};

export function IntroBox({ value, onChangeText, placeholder, label, over, disabled, testID }: IntroBoxProps) {
  const { colors } = useWawu();
  const [focused, setFocused] = useState(false);
  // The box grows with the words, as the board's does (the web's textarea would scroll inside a fixed box instead).
  const [grown, setGrown] = useState(0);
  const edge = over ? colors.danger : focused ? colors.accent : colors.borderHairline;
  const width = over || focused ? introBox.ring : 1;
  return (
    <View
      style={[styles.introBox, { backgroundColor: colors.surfaceInput, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: width, color: edge, inset: true }] }]}
    >
      <TextInput
        testID={testID}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.accent}
        cursorColor={colors.accent}
        multiline
        editable={!disabled}
        autoFocus
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onContentSizeChange={(e) => setGrown(Math.ceil(e.nativeEvent.contentSize.height))}
        style={[styles.introInput, grown > introBox.minHeight - introBox.pad * 2 ? { height: grown } : null, { color: disabled ? colors.textDisabled : colors.textPrimary }, Platform.OS === 'web' ? browserOutlineOff : null]}
      />
    </View>
  );
}

/** design/_gen/verify.js `vf9`: a 150 ring with a 132 disc inside (a 9 stroke), the time at 32 bold and "of 0:30" at 12 in the muted ink. */
export const takeRing = { size: 150, inner: 132, time: 32, of: 12 } as const;
const TAKE_STROKE = (takeRing.size - takeRing.inner) / 2;
const TAKE_RADIUS = (takeRing.size - TAKE_STROKE) / 2;
const TAKE_CIRCUMFERENCE = 2 * Math.PI * TAKE_RADIUS;

export type TakeRingProps = {
  /** How much of the ring is filled, 0 to 1. */
  share: number;
  /** "0:14". */
  clock: string;
  /** "of 0:30". */
  of: string;
  /** The ring turns red on a take that is too short. */
  tone: 'accent' | 'danger';
  testID?: string;
};

/** VF9's ring: a track, an arc from the top for how far the take has run, and the clock inside. */
export function TakeRing({ share, clock, of, tone, testID }: TakeRingProps) {
  const { colors } = useWawu();
  const middle = takeRing.size / 2;
  const arc = TAKE_CIRCUMFERENCE * Math.min(1, Math.max(0, share));
  return (
    <View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel="Recording time"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(share * 100), text: `${clock} ${of}` }}
      style={styles.takeRing}
    >
      <Svg width={takeRing.size} height={takeRing.size} viewBox={`0 0 ${takeRing.size} ${takeRing.size}`}>
        <Circle cx={middle} cy={middle} r={TAKE_RADIUS} stroke={colors.surfaceSunken} strokeWidth={TAKE_STROKE} fill="none" />
        {arc > 0 ? (
          <Circle
            cx={middle}
            cy={middle}
            r={TAKE_RADIUS}
            stroke={tone === 'danger' ? colors.danger : colors.accent}
            strokeWidth={TAKE_STROKE}
            fill="none"
            strokeDasharray={`${arc} ${TAKE_CIRCUMFERENCE - arc}`}
            rotation={-90}
            origin={`${middle}, ${middle}`}
          />
        ) : null}
      </Svg>
      <View style={styles.takeFigure} pointerEvents="none">
        <Text variant="body" testID={testID ? `${testID}-clock` : undefined} style={[font(700), styles.takeClock]}>
          {clock}
        </Text>
        <Text variant="body" tone="textMuted" style={[font(400), styles.takeOf]}>
          {of}
        </Text>
      </View>
    </View>
  );
}

/** design/_gen/verify.js `vf9`'s foot: a 76 round button with a 4 inset red ring and a 56 red disc, or a 28 square (8 cornered) while recording. */
export const recordButton = { size: 76, ring: 4, disc: 56, square: 28, squareCorner: 8, side: 44, between: 40 } as const;

export type RecordButtonProps = { recording: boolean; onPress: () => void; disabled?: boolean; testID?: string };

export function RecordButton({ recording, onPress, disabled, testID }: RecordButtonProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const size = recording ? recordButton.square : recordButton.disc;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={recording ? 'Stop recording' : 'Start recording'}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={Math.max(0, (layout.tapMin - recordButton.size) / 2)}
      {...ring.handlers}
      style={({ pressed }) => [
        styles.recordRing,
        { boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: recordButton.ring, color: colors.danger, inset: true }], opacity: disabled ? 0.5 : 1, transform: [{ scale: pressed ? pressScale : 1 }] },
        ring.style,
      ]}
    >
      <View style={{ width: size, height: size, borderRadius: recording ? recordButton.squareCorner : size / 2, backgroundColor: colors.danger }} />
    </Pressable>
  );
}

/** design/_gen/verify.js `vf10`: the ring is 96 across. The Hub serves no percentage for a try, so the arc turns instead of filling. */
export const makingRing = { size: 96, stroke: 8, arcDegrees: 100, turnMs: 1100 } as const;
const MAKING_RADIUS = (makingRing.size - makingRing.stroke) / 2;
const MAKING_CIRCUMFERENCE = 2 * Math.PI * MAKING_RADIUS;
const MAKING_ARC = (makingRing.arcDegrees / 360) * MAKING_CIRCUMFERENCE;

/** VF10's ring: turning once in 1.1 seconds, held still when the phone asks for less motion. */
export function MakingRing({ label, testID }: { label: string; testID?: string }) {
  const { colors } = useWawu();
  const [turn] = useState(() => new Animated.Value(0));
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    let live = true;
    void Promise.resolve(AccessibilityInfo.isReduceMotionEnabled?.())
      .catch(() => false)
      .then((reduced) => {
        if (!live || reduced) return;
        loop = Animated.loop(Animated.timing(turn, { toValue: 1, duration: makingRing.turnMs, easing: Easing.linear, useNativeDriver: true }));
        loop.start();
      });
    return () => {
      live = false;
      loop?.stop();
    };
  }, [turn]);
  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const middle = makingRing.size / 2;
  return (
    <Animated.View testID={testID} accessibilityRole="progressbar" accessibilityLabel={label} style={{ transform: [{ rotate }] }}>
      <Svg width={makingRing.size} height={makingRing.size} viewBox={`0 0 ${makingRing.size} ${makingRing.size}`}>
        <Circle cx={middle} cy={middle} r={MAKING_RADIUS} stroke={colors.surfaceSunken} strokeWidth={makingRing.stroke} fill="none" />
        <Circle
          cx={middle}
          cy={middle}
          r={MAKING_RADIUS}
          stroke={colors.accent}
          strokeWidth={makingRing.stroke}
          fill="none"
          strokeDasharray={`${MAKING_ARC} ${MAKING_CIRCUMFERENCE - MAKING_ARC}`}
          rotation={-90}
          origin={`${middle}, ${middle}`}
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  takeRing: { width: takeRing.size, height: takeRing.size, alignItems: 'center', justifyContent: 'center' },
  takeFigure: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  takeClock: { fontSize: takeRing.time, lineHeight: Math.round(takeRing.time * 1.25), fontVariant: ['tabular-nums'] },
  takeOf: { fontSize: takeRing.of, lineHeight: Math.round(takeRing.of * 1.3) },
  recordRing: { width: recordButton.size, height: recordButton.size, borderRadius: recordButton.size / 2, alignItems: 'center', justifyContent: 'center' },
  disc: { width: playDisc.size, height: playDisc.size, borderRadius: playDisc.size / 2, alignItems: 'center', justifyContent: 'center' },
  wave: { flexDirection: 'row', alignItems: 'center' },
  introBox: { minHeight: introBox.minHeight, borderRadius: introBox.corner, padding: introBox.pad },
  introInput: {
    ...font(400),
    flexGrow: 1,
    minHeight: introBox.minHeight - introBox.pad * 2,
    padding: 0,
    fontSize: introBox.font,
    lineHeight: introBox.font * introBox.leading,
    textAlignVertical: 'top',
  },
});
