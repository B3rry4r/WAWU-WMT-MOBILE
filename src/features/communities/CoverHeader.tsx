import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/Button';
import { Icon } from '@/components/icon';
import { gradientEnds } from '@/components/MediaCard';
import { Text } from '@/components/Text';
import { font, radius, space, useWawu } from '@/theme';

/**
 * design/_gen/inbox.js line 82, `privCover`: the room's picture is the header, under a dark gradient so the white words stay readable;
 * a glass back button at the left and a glass share button at the right (6 under the top, 16 in), a "Private" pill (26 high, white at 18%,
 * 12 / 700, a 13 lock), the name at 26 / 700 with -0.03em and a 13.5 line under it. The canvas draws 250 high on the landing (I30, I31)
 * and 170 in the room (I37).
 *
 * The canvas lets the name and the count run past the bottom of the picture (white on the page, unreadable in the light theme). Here
 * the words sit on the picture's bottom edge, 20 in, so they are always on the gradient.
 */
export const coverMetrics = { landing: 250, room: 170, top: 6, side: 16, textSide: 20, textBottom: 20, between: 6, pillHeight: 26, pillPadH: 10, pillFont: 12, pillIcon: 13, name: 26, nameTracking: -0.03, sub: 13.5, subOpacity: 0.85, glass: 40 } as const;

export type CoverHeaderProps = {
  name: string;
  imageUrl: string | null;
  /** "640 members · hosted by adaeze". */
  sub: string;
  onBack: () => void;
  /** The glass button at the right (share), or the credit pill in the room. Left out, nothing is drawn there. */
  right?: ReactNode;
  /** `landing` (250) for I30 and I31, `room` (170) for I37. */
  size?: 'landing' | 'room';
  testID?: string;
};

/** The private room's cover header (I30, I31, I37). */
export function CoverHeader({ name, imageUrl, sub, onBack, right, size = 'landing', testID = 'cover-header' }: CoverHeaderProps) {
  const { colors, gradients } = useWawu();
  const insets = useSafeAreaInsets();
  const scrim = gradients.scrimFeed;
  const ends = gradientEnds(scrim.angle);
  return (
    <View style={[styles.cover, { height: coverMetrics[size] + insets.top, backgroundColor: colors.accentTint }]} testID={testID}>
      {imageUrl ? <Image testID={`${testID}-image`} source={{ uri: imageUrl }} contentFit="cover" style={StyleSheet.absoluteFill} accessibilityIgnoresInvertColors /> : null}
      <LinearGradient
        pointerEvents="none"
        colors={scrim.colors as unknown as readonly [string, string, ...string[]]}
        locations={scrim.locations as unknown as readonly [number, number, ...number[]]}
        start={ends.start}
        end={ends.end}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.top, { paddingTop: insets.top + coverMetrics.top }]}>
        <IconButton icon="ChevronLeft" label="Back" tone="glass" onPress={onBack} size={coverMetrics.glass} testID={`${testID}-back`} />
        {right ?? null}
      </View>
      <View style={styles.words}>
        <View style={[styles.pill, { backgroundColor: colors.surfaceGlass }]}>
          <Icon name="Lock" size={coverMetrics.pillIcon} color={colors.textOnAccent} strokeWidth={2.4} />
          <Text variant="caption" tone="textOnAccent" style={[font(700), { fontSize: coverMetrics.pillFont }]}>
            Private
          </Text>
        </View>
        <Text
          variant="body"
          tone="textOnAccent"
          accessibilityRole="header"
          numberOfLines={3}
          style={[font(700), { fontSize: coverMetrics.name, letterSpacing: coverMetrics.nameTracking * coverMetrics.name }]}
          testID={`${testID}-name`}
        >
          {name}
        </Text>
        {sub ? (
          <Text variant="caption" tone="textOnAccent" style={{ fontSize: coverMetrics.sub, opacity: coverMetrics.subOpacity }} testID={`${testID}-sub`}>
            {sub}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/** The glass share button at the cover's right (I30, I31). */
export function CoverShare({ onPress }: { onPress: () => void }) {
  return <IconButton icon="Share" label="Share this community" tone="glass" onPress={onPress} size={coverMetrics.glass} testID="cover-share" />;
}

const styles = StyleSheet.create({
  cover: { justifyContent: 'space-between', overflow: 'hidden' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: coverMetrics.side },
  words: { paddingHorizontal: coverMetrics.textSide, paddingBottom: coverMetrics.textBottom, gap: coverMetrics.between },
  pill: {
    alignSelf: 'flex-start',
    height: coverMetrics.pillHeight,
    paddingHorizontal: coverMetrics.pillPadH,
    borderRadius: radius.chip,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 1,
  },
});
