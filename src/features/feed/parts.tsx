import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { useFocusRing } from '@/components/focusRing';
import { Icon, ICON_STROKE, VerifiedTick, type IconName } from '@/components/icon';
import { Money } from '@/components/Money';
import { radius } from '@/theme';

import type { FeedItem } from './api';
import { media, metrics, words } from './look';
import { caption, compactCount, creatorName, hueFor, shareAt, tickKind, type Offer } from './model';

/** The canvas measures the post from the phone's bottom; the post itself ends at the bottom bar. */
export const fromPostBottom = (canvasBottom: number) => canvasBottom - metrics.tabbar;

/** `--scrim-feed`: dark at the top for the tabs, darker at the foot for the words. */
export function Scrim() {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={media.scrim.colors as unknown as [string, string, ...string[]]}
      locations={media.scrim.locations as unknown as [number, number, ...number[]]}
      style={StyleSheet.absoluteFill}
    />
  );
}

/** A press handler that also keeps the keyboard focus ring. */
function RailButton({
  label,
  selected,
  onPress,
  children,
  testID,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  children: ReactNode;
  testID?: string;
}) {
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.railItem, ring.style]}
    >
      {children}
    </Pressable>
  );
}

function RailCount({ icon, count, filled, testID }: { icon: IconName; count: number | null; filled?: boolean; testID?: string }) {
  return (
    <>
      <Icon name={icon} size={metrics.railIcon} color={media.ink} strokeWidth={2} fill={filled ? media.ink : 'none'} />
      {count === null ? null : (
        <Text testID={testID} style={[words.count, { color: media.ink }]}>
          {compactCount(count)}
        </Text>
      )}
    </>
  );
}

export type RailProps = {
  item: FeedItem;
  liked: boolean;
  likes: number;
  saved: boolean;
  /** Shown while the viewer does not follow the creator, and never on their own post. */
  canFollow: boolean;
  onLike: () => void;
  onSave: () => void;
  onFollow: () => void;
};

/**
 * The right rail (H2 to H6): the creator, likes, comments and saves. The avatar's profile
 * (M5) is ME-02's to open, the comments (H21) HOME-03's, and the ₦ Tip button (H26)
 * HOME-13's: each adds its press as drawn. The saves count is not served (BACKEND_GAPS
 * G-215), so the bookmark has no figure under it.
 */
export function Rail({ item, liked, likes, saved, canFollow, onLike, onSave, onFollow }: RailProps) {
  const name = creatorName(item.creator) ?? undefined;
  const ring = useFocusRing();
  return (
    <View style={[styles.rail, { bottom: fromPostBottom(metrics.railBottom) + metrics.tipSlot }]} testID={`rail-${item.id}`}>
      <View style={styles.avatarRing}>
        <Avatar name={name} hue={hueFor(item.creatorWawuId)} source={item.creator?.avatarUrl ?? undefined} size={metrics.avatar} />
        {canFollow ? (
          <Pressable
            testID={`follow-${item.id}`}
            accessibilityRole="button"
            accessibilityLabel={name ? `Follow ${name}` : 'Follow'}
            onPress={onFollow}
            hitSlop={metrics.followBadgeDrop}
            {...ring.handlers}
            style={[styles.followBadge, ring.style]}
          >
            <Icon name="Plus" size={metrics.followIcon} color={media.ink} strokeWidth={3} />
          </Pressable>
        ) : null}
      </View>
      <RailButton testID={`like-${item.id}`} label={liked ? 'Unlike' : 'Like'} selected={liked} onPress={onLike}>
        <RailCount icon="Heart" count={likes} filled={liked} testID={`likes-${item.id}`} />
      </RailButton>
      <View style={styles.railItem} accessible accessibilityLabel={`${item.commentCount} comments`}>
        <RailCount icon="MessageCircle" count={item.commentCount} testID={`comments-${item.id}`} />
      </View>
      <RailButton testID={`save-${item.id}`} label={saved ? 'Saved' : 'Save'} selected={saved} onPress={onSave}>
        <RailCount icon="Bookmark" count={null} filled={saved} />
      </RailButton>
    </View>
  );
}

/** The pill above the name: "Video · 1:50", "Locked · 18 min", "PDF · 84 pages". */
export function Pill({ icon, text, testID }: { icon: IconName; text: string; testID?: string }) {
  return (
    <View style={styles.pillRow}>
      <View testID={testID} style={[styles.pill, { backgroundColor: media.pill }]}>
        <Icon name={icon} size={metrics.pillIcon} color={media.ink} strokeWidth={ICON_STROKE.button} />
        <Text numberOfLines={1} style={[words.pill, { color: media.ink }]}>
          {text}
        </Text>
      </View>
    </View>
  );
}

/** The name, its tick, "· Following" (H6), then the caption. */
export function Byline({ item, follows }: { item: FeedItem; follows: boolean }) {
  const name = creatorName(item.creator);
  const tick = tickKind(item.creator);
  return (
    <View>
      {name ? (
        <View style={styles.nameRow}>
          <Text numberOfLines={1} style={[words.name, styles.shrink, { color: media.ink }]} testID={`name-${item.id}`}>
            {name}
          </Text>
          {tick ? <VerifiedTick kind={tick} size={metrics.tick} /> : null}
          {follows ? <Text style={[words.following, { color: media.ink }]}>· Following</Text> : null}
        </View>
      ) : null}
      <Text numberOfLines={3} style={[words.caption, styles.captionText, { color: media.ink }]} testID={`caption-${item.id}`}>
        {caption(item)}
      </Text>
    </View>
  );
}

/**
 * The offer bar under a locked post (H3, H4, H5). It shows what unlocking gives and the
 * price. Its words wrap and the bar grows to hold them (as H4 draws the subtitle on two
 * lines), so nothing is cut at a small width or a long price; pressing it opens the unlock sheet (H14), which HOME-12 adds as drawn. Until then
 * it starts nothing: no payment can begin from the feed.
 */
export function OfferBar({ offer, priceKobo, compact = false, testID }: { offer: Offer; priceKobo: number; compact?: boolean; testID?: string }) {
  return (
    <View
      testID={testID}
      style={[
        styles.offer,
        compact && { gap: metrics.offerGapCompact, paddingLeft: metrics.offerLeftCompact, paddingRight: metrics.offerRightCompact },
        { backgroundColor: media.glass, borderColor: media.glassEdge },
      ]}
    >
      <Icon name={offer.icon} size={compact ? metrics.offerIconCompact : metrics.offerIcon} color={media.ink} />
      <View style={styles.offerWords}>
        <Text style={[words.offerTitle, { color: media.ink }]}>{offer.title}</Text>
        <Text style={[words.offerSub, { color: media.ink }]}>{offer.subtitle}</Text>
      </View>
      <View style={[styles.price, compact && { paddingHorizontal: metrics.pricePadCompact }, { backgroundColor: media.ink }]}>
        <Money minorUnits={priceKobo} decimals={false} size={compact ? metrics.priceTextCompact : metrics.priceText} weight={700} tone="textOnLight" testID={testID ? `${testID}-price` : undefined} />
      </View>
    </View>
  );
}

/**
 * A track a person can press or drag along (H2's scrubber, H6's waveform): `onSeek` gets
 * the share of the length where the finger is. A screen reader can step it.
 */
export function Seekable({
  label,
  value,
  onSeek,
  onStep,
  children,
  testID,
  style,
}: {
  label: string;
  value: string;
  onSeek: (share: number) => void;
  onStep: (direction: 1 | -1) => void;
  children: ReactNode;
  testID?: string;
  style?: object;
}) {
  const [width, setWidth] = useState(0);
  const at = (e: GestureResponderEvent) => onSeek(shareAt(e.nativeEvent.locationX, width));
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onStep(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={at}
      onResponderMove={at}
      style={style}
    >
      {children}
    </View>
  );
}

/** H2's scrubber and H4's reading bar: a thin track, its filled share, and the words beside it. */
export function TrackBar({ share, label, testID }: { share: number; label: string; testID?: string }) {
  return (
    <View style={styles.trackRow} pointerEvents="box-none">
      <View style={styles.trackHit}>
        <View style={[styles.track, { backgroundColor: media.track }]}>
          <View testID={testID} style={[styles.trackFill, { width: `${Math.round(share * 1000) / 10}%`, backgroundColor: media.ink }]} />
        </View>
      </View>
      <Text style={[words.time, { color: media.ink }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    position: 'absolute',
    right: metrics.railRight,
    alignItems: 'center',
    gap: metrics.railGap,
    zIndex: 6,
  },
  railItem: { alignItems: 'center', gap: metrics.railCountGap },
  avatarRing: {
    borderRadius: radius.chip,
    borderWidth: metrics.avatarRing,
    borderColor: media.ink,
    margin: -metrics.avatarRing,
  },
  followBadge: {
    position: 'absolute',
    bottom: -metrics.followBadgeDrop,
    left: metrics.followBadgeLeft,
    width: metrics.followBadge,
    height: metrics.followBadge,
    borderRadius: radius.chip,
    backgroundColor: media.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillRow: { flexDirection: 'row', marginBottom: metrics.pillBelow },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: metrics.pillGap,
    height: metrics.pillH,
    paddingHorizontal: metrics.pillPad,
    borderRadius: radius.chip,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: metrics.nameGap },
  shrink: { flexShrink: 1 },
  captionText: { marginTop: metrics.captionTop },
  offer: {
    minHeight: metrics.offerH,
    paddingVertical: metrics.offerPadV,
    marginRight: metrics.barRight,
    borderRadius: metrics.offerRadius,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: metrics.offerGap,
    paddingLeft: metrics.offerLeft,
    paddingRight: metrics.offerRight,
  },
  offerWords: { flex: 1, minWidth: 0 },
  price: {
    flexShrink: 0,
    height: metrics.priceH,
    paddingHorizontal: metrics.pricePad,
    borderRadius: metrics.priceRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: metrics.trackGap, marginRight: metrics.barRight },
  trackHit: { flex: 1, height: metrics.trackHit, justifyContent: 'center' },
  track: { height: metrics.track, borderRadius: metrics.trackRadius, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: metrics.trackRadius },
});
