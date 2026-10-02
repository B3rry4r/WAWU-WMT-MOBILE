import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { font, radius, space, useWawu, type GradientToken } from '@/theme';

import { useFocusRing } from './focusRing';
import { Text } from './Text';

/** Sizes from the unlock sheet (design/_gen/home.js `unlockSheet`) and the Explore cards the loading view stands in for. */
export const mediaMetrics = {
  thumb: 56,
  thumbRadius: 14,
  rowGap: space.md,
  captionGap: 3,
  subtitle: 13,
  stackedWidth: 150,
  stackedHeight: 200,
  /** design/_gen/explore.js `cCard`: the caption sits 10 in from the left, right and bottom of the picture, title 14.5 bold, line under it 12 at 80%. */
  captionInset: 10,
  stackedTitle: 14.5,
  stackedSubtitle: 12,
  stackedSubtitleOpacity: 0.8,
  stackedSubtitleGap: 2,
} as const;

/** A CSS-style angle (180 is top to bottom, as in `--scrim-card`) as the start and end points `LinearGradient` takes. */
export function gradientEnds(angle: number) {
  const rad = (angle * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  return { start: { x: 0.5 - dx / 2, y: 0.5 - dy / 2 }, end: { x: 0.5 + dx / 2, y: 0.5 + dy / 2 } };
}

function Scrim({ token }: { token: GradientToken }) {
  const ends = gradientEnds(token.angle);
  return (
    <LinearGradient
      testID="media-scrim"
      pointerEvents="none"
      colors={token.colors as unknown as readonly [string, string, ...string[]]}
      locations={token.locations as unknown as readonly [number, number, ...number[]]}
      start={ends.start}
      end={ends.end}
      style={StyleSheet.absoluteFill}
    />
  );
}

export type MediaCardProps = {
  title: string;
  /** The line under the title: who made it, what kind, how long. */
  subtitle?: string;
  /** A verified Tick or a pill, shown on the subtitle line after the creator's name. */
  subtitleAccessory?: ReactNode;
  /** The picture. Without one a quiet block holds its place, so a layout never jumps when it arrives. */
  imageUrl?: string;
  /** What the picture shows, for a screen reader. Leave empty when the title already says it. */
  imageLabel?: string;
  /** `row`: thumbnail beside the words (a sheet header). `stacked`: picture above the words (a shelf). */
  layout?: 'row' | 'stacked';
  /** Stacked only. Defaults to the shelf's 150 by 200 picture. */
  width?: number;
  height?: number;
  onPress?: () => void;
  testID?: string;
};

/** A piece of content: its picture, its title and who made it. */
export function MediaCard({
  title,
  subtitle,
  subtitleAccessory,
  imageUrl,
  imageLabel,
  layout = 'row',
  width = mediaMetrics.stackedWidth,
  height = mediaMetrics.stackedHeight,
  onPress,
  testID,
}: MediaCardProps) {
  const { colors, gradients } = useWawu();
  const ring = useFocusRing();
  const stacked = layout === 'stacked';
  const frame = stacked
    ? { width, height, borderRadius: radius.media }
    : { width: mediaMetrics.thumb, height: mediaMetrics.thumb, borderRadius: mediaMetrics.thumbRadius };

  const picture = (
    <View style={[styles.picture, frame, { backgroundColor: colors.surfaceSunken }]}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          accessibilityLabel={imageLabel}
          accessible={Boolean(imageLabel)}
          contentFit="cover"
          style={styles.fill}
        />
      ) : null}
      {stacked ? (
        <>
          <Scrim token={gradients.scrimCard} />
          <View style={styles.caption}>
            <Text variant="h3" tone="textOnAccent" numberOfLines={1} style={[font(700), styles.stackedTitle]}>
              {title}
            </Text>
            {subtitle || subtitleAccessory ? (
              <View style={styles.stackedSubtitleLine}>
                {subtitle ? (
                  <Text variant="secondary" tone="textOnAccent" numberOfLines={1} style={styles.stackedSubtitle}>
                    {subtitle}
                  </Text>
                ) : null}
                {subtitleAccessory}
              </View>
            ) : null}
          </View>
        </>
      ) : null}
    </View>
  );
  const words = stacked ? null : (
    <View style={styles.words}>
      <Text variant="h3" numberOfLines={1} style={font(600)}>
        {title}
      </Text>
      {subtitle || subtitleAccessory ? (
        <View style={styles.subtitleLine}>
          {subtitle ? (
            <Text variant="secondary" tone="textMuted" numberOfLines={1} style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
          {subtitleAccessory}
        </View>
      ) : null}
    </View>
  );
  const label = [title, subtitle].filter(Boolean).join(', ');
  const style = stacked ? styles.stacked : styles.row;
  const body = (
    <>
      {picture}
      {words}
    </>
  );
  return onPress ? (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} {...ring.handlers} style={[style, ring.style]}>
      {body}
    </Pressable>
  ) : (
    <View testID={testID} accessible accessibilityLabel={label} style={style}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: mediaMetrics.rowGap },
  stacked: {},
  picture: { overflow: 'hidden', flexShrink: 0 },
  fill: { width: '100%', height: '100%' },
  words: { flex: 1, minWidth: 0 },
  subtitleLine: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: mediaMetrics.captionGap },
  subtitle: { fontSize: mediaMetrics.subtitle, flexShrink: 1 },
  caption: { position: 'absolute', left: mediaMetrics.captionInset, right: mediaMetrics.captionInset, bottom: mediaMetrics.captionInset },
  stackedTitle: { fontSize: mediaMetrics.stackedTitle },
  stackedSubtitleLine: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: mediaMetrics.stackedSubtitleGap },
  stackedSubtitle: { fontSize: mediaMetrics.stackedSubtitle, opacity: mediaMetrics.stackedSubtitleOpacity, flexShrink: 1 },
});

