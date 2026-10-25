import type { DimensionValue } from 'react-native';

import { VerifiedTick } from '@/components/icon';
import { MediaCard, mediaMetrics } from '@/components/MediaCard';
import { hueFor } from '@/features/feed/model';

import type { ExploreCreator } from './api';
import { useInterestLabel } from './interestLabel';
import { PortraitTile } from './PortraitTile';

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
  /** The card itself: opens the creator's profile (M5, ME-02). Follow stays its own button. */
  onPress?: () => void;
  /** Absent on the viewer's own card: nobody follows themselves. */
  onToggleFollow?: () => void;
  testID?: string;
};

/**
 * One creator on Explore: their portrait (or the canvas's portrait tile in their hue when they have none), handle and tick, what
 * they do, and Follow. Follow and Following are `MediaCard`'s own `action`, drawn as on Home's creator rail.
 */
export function CreatorCard({ creator, width = creatorCardMetrics.railWidth, height = creatorCardMetrics.railHeight, onPress, onToggleFollow, testID }: CreatorCardProps) {
  const tick = tickOf(creator);
  const labelOf = useInterestLabel();
  const followTestID = testID ? `${testID}-follow` : undefined;
  const following = Boolean(onToggleFollow) && creator.following;

  return (
    <MediaCard
      layout="stacked"
      testID={testID}
      title={displayHandle(creator)}
      subtitle={labelOf(creator.field) ?? undefined}
      titleAccessory={tick ? <VerifiedTick kind={tick} size={creatorCardMetrics.tick} /> : undefined}
      imageUrl={creator.avatarUrl ?? undefined}
      placeholder={<PortraitTile hue={hueFor(creator.wawuId)} testID={testID ? `${testID}-portrait` : undefined} />}
      width={width}
      height={height}
      onPress={onPress}
      action={
        onToggleFollow ? { label: following ? 'Following' : 'Follow', on: following, onPress: onToggleFollow, testID: followTestID } : undefined
      }
    />
  );
}
