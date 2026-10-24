import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import type { AvatarHue } from '@/components/Avatar';
import { radius, useWawu, type ColorToken } from '@/theme';

/**
 * The tile a creator card draws for a person with no photo: design/_ds/wawu/assets/mock/p1.jpg to p5.jpg, the pictures the
 * canvas's `cCard` stands a creator on. A saturated ground in the person's hue (the `--hue-*` tokens), a pale head and
 * shoulders on it, and a light corner at the top left. No initials: the card's words already say who it is (FIX-68 F-7).
 * Sizes are the picture's own proportions (600 by 800: head 240 across from 210 down, shoulders 500 across from 510 down,
 * 250 high), so the figure sits the same on a 150 by 200 rail card and on a grid card.
 */
export const portraitMetrics = {
  headSize: '40%',
  headLeft: '30%',
  headTop: '26.25%',
  shouldersWidth: '83.33%',
  shouldersLeft: '8.33%',
  shouldersTop: '63.75%',
  shouldersHeight: '31.25%',
} as const;

const hueToken = (hue: AvatarHue) => `hue${hue.charAt(0).toUpperCase()}${hue.slice(1)}` as ColorToken;

/** Fills the whole picture of a `MediaCard` through its `placeholder` slot (an absolute child ignores the slot's padding). */
export function PortraitTile({ hue, testID }: { hue: AvatarHue; testID?: string }) {
  const { colors } = useWawu();
  const figure = colors.mediaWhite35;
  return (
    <View testID={testID} pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors[hueToken(hue)] }]}>
      <LinearGradient
        pointerEvents="none"
        colors={[colors.mediaWhite25, colors.mediaBlack0]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.head, { backgroundColor: figure }]} />
      <View style={styles.shoulders}>
        <View style={[styles.shouldersCircle, { backgroundColor: figure }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    position: 'absolute',
    width: portraitMetrics.headSize,
    left: portraitMetrics.headLeft,
    top: portraitMetrics.headTop,
    aspectRatio: 1,
    borderRadius: radius.chip,
  },
  shoulders: {
    position: 'absolute',
    width: portraitMetrics.shouldersWidth,
    left: portraitMetrics.shouldersLeft,
    top: portraitMetrics.shouldersTop,
    height: portraitMetrics.shouldersHeight,
    overflow: 'hidden',
  },
  shouldersCircle: { width: '100%', aspectRatio: 1, borderRadius: radius.chip },
});
