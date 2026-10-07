import { StyleSheet, type DimensionValue } from 'react-native';

import { Button } from '@/components/Button';
import { VerifiedTick } from '@/components/icon';
import { MediaCard, mediaMetrics } from '@/components/MediaCard';
import { useWawu } from '@/theme';

import type { ExploreCreator } from './api';

/**
 * design/_gen/explore.js `cCard`, drawn by the shared `MediaCard` (stacked): 150 by 200 on the rail, 218 high in the
 * Categories grid, 10 between cards across and down, a 13 tick after the handle.
 */
export const creatorCardMetrics = {
  railWidth: mediaMetrics.stackedWidth,
  railHeight: mediaMetrics.stackedHeight,
  gridHeight: 218,
  between: 10,
  tick: 13,
  /** `cCard`'s "Following": white at 20%, no outline (the canvas's 0.2 white). */
  followingAlpha: 0.2,
} as const;

/**
 * White at the strength `cCard` draws "Following" with, taken from the glass token (white at 14%) so no colour is
 * written here. `MediaCard`'s `action` draws its on state as the glass Button (white at 14% with an outline), so the
 * Following pill goes through `footer` as the same shared Button with this fill and no outline.
 */
function whiteAt(glass: string, alpha: number): string {
  return glass.replace(/[\d.]+\)$/, `${alpha})`);
}

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
  const { colors } = useWawu();
  const tick = tickOf(creator);
  const followTestID = testID ? `${testID}-follow` : undefined;
  const following = Boolean(onToggleFollow) && creator.following;

  return (
    <MediaCard
      layout="stacked"
      testID={testID}
      title={displayHandle(creator)}
      subtitle={creator.field ?? undefined}
      titleAccessory={tick ? <VerifiedTick kind={tick} size={creatorCardMetrics.tick} /> : undefined}
      imageUrl={creator.avatarUrl ?? undefined}
      width={width}
      height={height}
      action={onToggleFollow && !following ? { label: 'Follow', onPress: onToggleFollow, testID: followTestID } : undefined}
      footer={
        onToggleFollow && following ? (
          <Button
            testID={followTestID}
            label="Following"
            variant="glass"
            size="sm"
            full
            onPress={onToggleFollow}
            style={[styles.following, { backgroundColor: whiteAt(colors.surfaceGlass, creatorCardMetrics.followingAlpha) }]}
          />
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  following: { height: mediaMetrics.actionHeight, borderWidth: 0 },
});
