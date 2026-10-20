import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { pressScale } from '@/components/Button';
import { browserOutlineOff, useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { Text } from '@/components/Text';
import { playedBars, voicePlayerMetrics, waveShape } from '@/components/VoicePlayer';
import { font, layout, radius, space, useWawu } from '@/theme';

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

/** design/_gen/verify.js line 88 (the "Hear your name" row on VF2): a card, an accent 44 tile, a title (`cardTitle`, 15), a line (`caption`, 12.5), a chevron. */
const entry = { corner: radius.card, pad: space.lg, tile: 44, gap: space.md, chevron: 20 } as const;

export type EntryRowProps = {
  icon: IconName;
  title: string;
  line: string;
  onPress: () => void;
  testID?: string;
};

/** A row that opens one of the Voice screens: VF2's "Hear your name" and Me's Voice Intro prompt. */
export function EntryRow({ icon, title, line, onPress, testID }: EntryRowProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${line}`}
      onPress={onPress}
      {...ring.handlers}
      style={({ pressed }) => [
        styles.entry,
        { backgroundColor: pressed ? colors.surfaceSunken : colors.surfaceCard, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] },
        ring.style,
      ]}
    >
      <IconTile icon={icon} tone="accent" size={entry.tile} />
      <View style={styles.entryWords}>
        <Text variant="cardTitle" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="caption" numberOfLines={1}>
          {line}
        </Text>
      </View>
      <Icon name="ChevronRight" size={entry.chevron} color={colors.textMuted} />
    </Pressable>
  );
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

const styles = StyleSheet.create({
  disc: { width: playDisc.size, height: playDisc.size, borderRadius: playDisc.size / 2, alignItems: 'center', justifyContent: 'center' },
  wave: { flexDirection: 'row', alignItems: 'center' },
  entry: { flexDirection: 'row', alignItems: 'center', gap: entry.gap, borderRadius: entry.corner, padding: entry.pad },
  entryWords: { flex: 1, minWidth: 0, gap: space.xs },
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
