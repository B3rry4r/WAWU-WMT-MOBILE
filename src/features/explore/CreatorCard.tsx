import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type DimensionValue } from 'react-native';

import { Button } from '@/components/Button';
import { VerifiedTick } from '@/components/icon';
import { gradientEnds, mediaMetrics } from '@/components/MediaCard';
import { Text } from '@/components/Text';
import { font, radius, useWawu } from '@/theme';

import type { ExploreCreator } from './api';

/**
 * design/_gen/explore.js `cCard`: a portrait 150 by 200 on the rail (218 high in the Categories grid), corner 20,
 * `--scrim-card` over it, and a caption 10 in from the sides and bottom: `@handle` 14.5 bold with a 13 tick 4 after
 * it, the field 12 at 80% two below, then 8 down a 32 high pill, "Follow" on the accent or "Following" on white at 20%.
 */
export const creatorCardMetrics = {
  railWidth: mediaMetrics.stackedWidth,
  railHeight: mediaMetrics.stackedHeight,
  gridHeight: 218,
  /** `creatorsRail` and `cgrid`: 10 between cards, across and down. */
  between: 10,
  tick: 13,
  tickGap: 4,
  stack: 8,
  button: 32,
} as const;

/** Which tick a card shows: the creator tick first, else the professional tick (X1 draws one or the other). */
export function tickOf(creator: Pick<ExploreCreator, 'verification'>): 'creator' | 'pro' | undefined {
  if (creator.verification?.creator?.verified) return 'creator';
  if (creator.verification?.professional?.verified) return 'pro';
  return undefined;
}

/** `@handle`, or the name when the creator has not picked a handle. */
export function displayHandle(creator: Pick<ExploreCreator, 'handle' | 'name'>): string {
  return creator.handle ? `@${creator.handle}` : creator.name;
}

export type CreatorCardProps = {
  creator: ExploreCreator;
  width?: DimensionValue;
  height?: number;
  /** Absent on the viewer's own card: nobody follows themselves. */
  onToggleFollow?: () => void;
  testID?: string;
};

/** One creator on Explore: their portrait, handle and tick, what they do, and Follow. */
export function CreatorCard({ creator, width = creatorCardMetrics.railWidth, height = creatorCardMetrics.railHeight, onToggleFollow, testID }: CreatorCardProps) {
  const { colors, gradients } = useWawu();
  const scrim = gradients.scrimCard;
  const ends = gradientEnds(scrim.angle);
  const tick = tickOf(creator);
  const handle = displayHandle(creator);

  return (
    <View testID={testID} style={[styles.card, { width, height, backgroundColor: colors.surfaceSunken }]}>
      {creator.avatarUrl ? (
        <Image
          testID={testID ? `${testID}-photo` : undefined}
          source={{ uri: creator.avatarUrl }}
          contentFit="cover"
          accessible={false}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <LinearGradient
        pointerEvents="none"
        colors={scrim.colors as unknown as readonly [string, string, ...string[]]}
        locations={scrim.locations as unknown as readonly [number, number, ...number[]]}
        start={ends.start}
        end={ends.end}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.caption}>
        <View accessible accessibilityLabel={[creator.name, handle !== creator.name ? handle : null, creator.field].filter(Boolean).join(', ')}>
          <View style={styles.handleLine}>
            <Text variant="h3" tone="textOnAccent" numberOfLines={1} style={[font(700), styles.handle]}>
              {handle}
            </Text>
            {tick ? <VerifiedTick kind={tick} size={creatorCardMetrics.tick} /> : null}
          </View>
          {creator.field ? (
            <Text variant="secondary" tone="textOnAccent" numberOfLines={1} style={styles.field}>
              {creator.field}
            </Text>
          ) : null}
        </View>
        {onToggleFollow ? (
          <Button
            testID={testID ? `${testID}-follow` : undefined}
            label={creator.following ? 'Following' : 'Follow'}
            variant={creator.following ? 'glass' : 'primary'}
            size="sm"
            full
            onPress={onToggleFollow}
            style={styles.follow}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.media, overflow: 'hidden', flexShrink: 0 },
  caption: {
    position: 'absolute',
    left: mediaMetrics.captionInset,
    right: mediaMetrics.captionInset,
    bottom: mediaMetrics.captionInset,
    gap: creatorCardMetrics.stack,
  },
  handleLine: { flexDirection: 'row', alignItems: 'center', gap: creatorCardMetrics.tickGap },
  handle: { fontSize: mediaMetrics.stackedTitle, flexShrink: 1 },
  field: {
    fontSize: mediaMetrics.stackedSubtitle,
    opacity: mediaMetrics.stackedSubtitleOpacity,
    marginTop: mediaMetrics.stackedSubtitleGap,
  },
  follow: { height: creatorCardMetrics.button },
});
