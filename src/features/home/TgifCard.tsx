import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { Button, pressScale } from '@/components/Button';

import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import type { TgifDay } from '@/features/tgif/api/tgif';
import { radius, stopOf } from '@/theme';

import { CardGlows } from './CardGlows';
import { cardInk, todayMetrics as m, todayWords } from './look';
import { tgifDayLabel, tgifMeta } from './model';

export type TgifCardProps = {
  day: TgifDay;
  /** Today's readers from the day's numbers (HOME-10); left out until they come. */
  readers: number | null;
  onOpen: () => void;
};

/**
 * The TGIF card (X1): the day, the series, how many cards and how many are reading, and the
 * play disc. The whole card opens the reader (H29, `/tgif`). It is dark in both themes, as the
 * reader's cards are. Explore draws it (EXPLORE-07); Home does not (R-59, DV2-RM), which is why the file
 * still sits under `features/home`.
 */
export function TgifCard({ day, readers, onOpen }: TgifCardProps) {
  const ring = useFocusRing();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.width || height !== size.height) setSize({ width, height });
  };
  const label = tgifDayLabel(day.date);
  const meta = tgifMeta(day, readers);
  const { tgifGlow: glow, tgifWarm: warm } = m;
  const warmGlow = stopOf(cardInk.tgifWarm);

  return (
    <Pressable
      testID="today-tgif"
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${day.series}. ${meta}`}
      accessibilityHint="Opens today's TGIF"
      onPress={onOpen}
      onLayout={onLayout}
      {...ring.handlers}
      style={({ pressed }) => [styles.card, { backgroundColor: cardInk.tgifGround, transform: [{ scale: pressed ? pressScale : 1 }] }, ring.style]}
    >
      <CardGlows
        id="tgifGlow"
        width={size.width}
        height={size.height}
        spots={[
          { x: size.width + glow.right - glow.size / 2, y: glow.size / 2 - glow.top, size: glow.size, color: cardInk.tgifGlow, strength: glow.strength },
          { x: warm.size / 2 - warm.left, y: size.height + warm.bottom - warm.size / 2, size: warm.size, color: warmGlow.color, strength: warmGlow.opacity },
        ]}
      />
      <View style={styles.words}>
        <Text numberOfLines={1} style={[todayWords.tgifLabel, { color: cardInk.tgifLabel }]}>
          {label}
        </Text>
        <Text numberOfLines={1} style={[todayWords.tgifTitle, { color: cardInk.ink }]}>
          {day.series}
        </Text>
        <Text testID="today-tgif-meta" numberOfLines={1} style={[todayWords.tgifMeta, { color: cardInk.ink }]}>
          {meta}
        </Text>
      </View>
      <View style={[styles.play, { backgroundColor: cardInk.ink }]}>
        <Icon name="Play" size={m.playIcon} color={cardInk.tgifGround} strokeWidth={m.playStroke} />
      </View>
    </Pressable>
  );
}

/**
 * Today's TGIF when its day could not be read (TGIF is on, the read failed): the card's own ground and label,
 * one line saying so and Try again, so it never looks like TGIF switched off.
 */
export function TgifProblem({ date, onRetry, retrying }: { date: string; onRetry: () => void; retrying: boolean }) {
  return (
    <View testID="today-tgif-error" style={[styles.card, { backgroundColor: cardInk.tgifGround }]}>
      <View style={styles.words}>
        <Text numberOfLines={1} style={[todayWords.tgifLabel, { color: cardInk.tgifLabel }]}>
          {tgifDayLabel(date)}
        </Text>
        <Text accessibilityRole="alert" numberOfLines={2} style={[todayWords.tgifProblem, { color: cardInk.ink }]}>
          {"Today's TGIF didn't load."}
        </Text>
      </View>
      <Button label="Try again" variant="glass" size="sm" icon="RotateCw" loading={retrying} onPress={onRetry} testID="today-tgif-retry" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: m.tgifHeight,
    borderRadius: radius.card,
    overflow: 'hidden',
    paddingVertical: m.tgifPadY,
    paddingHorizontal: m.tgifPadX,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.tgifGap,
  },
  words: { flex: 1, minWidth: 0, gap: m.tgifWordsGap },
  play: { width: m.play, height: m.play, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
