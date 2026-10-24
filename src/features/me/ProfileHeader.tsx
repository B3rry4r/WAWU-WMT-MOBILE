import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button, IconButton } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { VerifiedTick } from '@/components/icon';
import { gradientEnds } from '@/components/MediaCard';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { TierBadge, tierBadgeLabel } from '@/components/TierBadge';
import { hueFor } from '@/features/feed/model';
import { SOCIAL } from '@/features/profile-edit/social';
import { SocialLogo, hasMark } from '@/features/profile-edit/SocialLogo';
import { canvasNormalLineHeight, font, layout, radius, space, useWawu } from '@/theme';

import type { HeaderBadge, SocialLink } from './model';

/**
 * design/_gen/me.js lines 15 to 19 (`cover`, `profTop`, `nameBlock`, `profBody`):
 * - the cover is 200 high from the top of the phone (the 50 status bar included), black at 0.3 fading out by half way;
 * - the round glass buttons (42) sit 6 under the status bar, 20 from the side, 8 apart;
 * - the body starts 76 under them, 20 in from each side, its blocks 16 apart;
 * - the avatar is 96 with a 4 ring of the page colour; "Edit profile" is 38 high, 16 in, 14 at 600 on a strong ring (`Button size="profile"`);
 * - the name 24 at 700 (-0.03em) with its 20 tick 6 after it; the bio 14.5 secondary at 1.45, 5 under the name.
 * line 9 (`soc`): social chips 34 high, 10 in on the left and 12 on the right, 15 logos 7 from 13 at 600, 8 apart,
 * running off the right edge. line 12 (`counts`): 22 apart, 14 secondary words after a 16 bold figure.
 */
export const headerMetrics = {
  cover: 200,
  statusBar: 50,
  scrimEnd: 0.5,
  buttonsTop: 6,
  buttons: 42,
  buttonGap: 8,
  bodyTop: 76,
  avatar: 96,
  avatarRing: 4,
  name: 24,
  nameTracking: -0.03,
  tick: 20,
  tickGap: 6,
  bio: 14.5,
  bioLine: 1.45,
  bioGap: 5,
  chipH: 34,
  chipLeft: 10,
  chipRight: 12,
  chipLogo: 15,
  chipGap: 7,
  chip: 13,
  chipsApart: 8,
  countsApart: 22,
  countWord: 14,
  countFigure: 16,
} as const;

/** The cover's height on this phone: the canvas's 200 counts a 50 status bar; the real one is `top`. */
export const coverHeight = (top: number) => headerMetrics.cover - headerMetrics.statusBar + top;
/** Where the body (avatar row) starts: under the buttons, then 76. */
export const bodyTop = (top: number) => top + headerMetrics.buttonsTop + headerMetrics.buttons + headerMetrics.bodyTop;

export type ProfileTopProps = {
  coverUrl: string | null;
  top: number;
  /** Off until the profile has loaded: there is nothing to share before then. */
  canShare: boolean;
  onShare: () => void;
  /** The gift button: opens Invite and earn (RF1, REF-03). Drawn only when the route gives it a place to go (R-47). */
  onOpenInvite?: () => void;
  /** Menu: raises Z1, the sheet with Settings in it. It needs no profile, so it works while the profile is loading or failed. */
  onOpenMenu: () => void;
};

/** The cover picture, and the glass buttons over it: Gift (Invite and earn), Share and Menu. QR (WALLET-20) is added by COMPLETE-04. */
export function ProfileTop({ coverUrl, top, canShare, onShare, onOpenInvite, onOpenMenu }: ProfileTopProps) {
  const { colors } = useWawu();
  const ends = gradientEnds(180);
  return (
    <>
      {/* The page's name for a screen reader: the tab is "Me", and M1 draws no title over the cover. */}
      <View testID="me-cover" accessible accessibilityRole="header" accessibilityLabel="Me" style={[styles.cover, { height: coverHeight(top), backgroundColor: colors.surfaceSunken }]}>
        {coverUrl ? <Image source={{ uri: coverUrl }} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
        <LinearGradient
          pointerEvents="none"
          colors={[colors.mediaBlack30, colors.mediaBlack0]}
          locations={[0, headerMetrics.scrimEnd]}
          start={ends.start}
          end={ends.end}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={[styles.buttons, { top: top + headerMetrics.buttonsTop }]}>
        {onOpenInvite ? <IconButton icon="Gift" label="Invite and earn" tone="glass" size={headerMetrics.buttons} onPress={onOpenInvite} testID="me-invite" /> : null}
        <IconButton icon="Share" label="Share your profile" tone="glass" size={headerMetrics.buttons} disabled={!canShare} onPress={onShare} testID="me-share" />
        <IconButton icon="Menu" label="Menu" tone="glass" size={headerMetrics.buttons} onPress={onOpenMenu} testID="me-menu-button" />
      </View>
    </>
  );
}

export type NameBlockProps = {
  wawuId: string;
  name: string;
  avatarUrl: string | null;
  ticks: readonly ('creator' | 'pro')[];
  /** The tier pill after the ticks (M1): only for a person with a running tier, from the Hub. */
  badge?: HeaderBadge | null;
  bio: string | null;
  /** The owner's "Edit profile" (M1). A visitor's header (M5) has none, so it is not drawn without it. */
  onEditProfile?: () => void;
  /** The tier pill opens Your tier (VF14, VERIFY-05). Left out, the pill is read, not pressed. */
  onOpenTier?: () => void;
};

export function NameBlock({ wawuId, name, avatarUrl, ticks, badge, bio, onEditProfile, onOpenTier }: NameBlockProps) {
  const { colors } = useWawu();
  return (
    <>
      <View style={styles.avatarRow}>
        <View style={[styles.avatarRing, { backgroundColor: colors.surfacePage }]}>
          <Avatar name={name} hue={hueFor(wawuId)} size={headerMetrics.avatar} source={avatarUrl ?? undefined} testID="me-avatar" />
        </View>
        {onEditProfile ? <Button label="Edit profile" variant="outline" size="profile" onPress={onEditProfile} testID="me-edit" /> : null}
      </View>
      <View>
        <View style={styles.nameRow}>
          <Text variant="h1" style={styles.name} testID="me-name">
            {name}
          </Text>
          {ticks.map((kind) => (
            <View
              key={kind}
              accessible
              accessibilityRole="image"
              accessibilityLabel={kind === 'pro' ? 'Professional tick' : 'Creator tick'}
            >
              <VerifiedTick kind={kind} size={headerMetrics.tick} />
            </View>
          ))}
          {/* The pill pins itself to the top of its row; this slot lets the name row centre it, as the board does. */}
          {badge ? (
            <View style={styles.badgeSlot}>
              {onOpenTier ? (
                <Pressable testID="me-tier-open" accessibilityRole="button" accessibilityLabel={`${tierBadgeLabel(badge.name, badge.number)}. Open your tier`} onPress={onOpenTier} hitSlop={8}>
                  <TierBadge name={badge.name} number={badge.number} testID="me-tier-badge" />
                </Pressable>
              ) : (
                <TierBadge name={badge.name} number={badge.number} testID="me-tier-badge" />
              )}
            </View>
          ) : null}
        </View>
        {bio ? (
          <Text variant="body" tone="textSecondary" style={styles.bio} testID="me-bio">
            {bio}
          </Text>
        ) : null}
      </View>
    </>
  );
}

/** The person's social handles, in their order; each opens the platform. */
export function SocialChips({ links, onOpen }: { links: readonly SocialLink[]; onOpen: (link: SocialLink) => void }) {
  if (links.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} testID="me-socials" style={styles.chipScroller} contentContainerStyle={styles.chips}>
      {links.map((link) => (
        <SocialChip key={link.platform} link={link} onPress={() => onOpen(link)} />
      ))}
    </ScrollView>
  );
}

function SocialChip({ link, onPress }: { link: SocialLink; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const platform = SOCIAL[link.platform].label;
  return (
    <Pressable
      testID={`me-social-${link.platform}`}
      accessibilityRole="link"
      accessibilityLabel={`${platform}, ${link.label}`}
      onPress={onPress}
      {...ring.handlers}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: pressed ? colors.surfaceSunken : colors.surfaceCard,
          boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }],
        },
        ring.style,
      ]}
    >
      <SocialLogo platform={link.platform} size={headerMetrics.chipLogo} />
      {hasMark(link.platform) ? null : (
        <Text variant="body" tone="textMuted" style={styles.chipText}>
          {platform}
        </Text>
      )}
      <Text variant="body" style={styles.chipText}>
        {link.label}
      </Text>
    </Pressable>
  );
}

export type Count = { key: string; value: string; label: string };

export function Counts({ counts }: { counts: readonly Count[] }) {
  return (
    <View style={styles.counts} testID="me-counts">
      {counts.map((count) => (
        <Text key={count.key} variant="body" tone="textSecondary" style={styles.countWord} testID={`me-count-${count.key}`}>
          <Text variant="body" style={styles.countFigure}>
            {count.value}
          </Text>{' '}
          {count.label}
        </Text>
      ))}
    </View>
  );
}

/** The header while the profile loads: the cover, an avatar and the lines where the name, bio and counts go. */
export function HeaderSkeleton() {
  const { colors } = useWawu();
  return (
    <>
      <View style={styles.avatarRow}>
        <View style={[styles.avatarRing, { backgroundColor: colors.surfacePage }]}>
          <Skeleton width={headerMetrics.avatar} height={headerMetrics.avatar} radius={radius.chip} />
        </View>
      </View>
      <Skeleton width="55%" height={headerMetrics.name} />
      <Skeleton height={headerMetrics.bio} />
      <Skeleton width="70%" height={headerMetrics.chipH} radius={radius.chip} />
      <Skeleton width="80%" height={headerMetrics.countFigure} />
    </>
  );
}

const styles = StyleSheet.create({
  cover: { position: 'absolute', top: 0, left: 0, right: 0 },
  // Over the body, which starts at the top of the scroll and would otherwise take the taps meant for them.
  buttons: { position: 'absolute', right: layout.gutter, flexDirection: 'row', gap: headerMetrics.buttonGap, zIndex: 1 },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  avatarRing: { borderRadius: radius.chip, padding: headerMetrics.avatarRing, margin: -headerMetrics.avatarRing },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: headerMetrics.tickGap, flexWrap: 'wrap' },
  name: { fontSize: headerMetrics.name, letterSpacing: headerMetrics.nameTracking * headerMetrics.name, lineHeight: canvasNormalLineHeight(headerMetrics.name), flexShrink: 1 },
  badgeSlot: { flexShrink: 1 },
  bio: { fontSize: headerMetrics.bio, lineHeight: headerMetrics.bio * headerMetrics.bioLine, marginTop: headerMetrics.bioGap },
  chipScroller: { marginRight: -layout.gutter, flexGrow: 0 },
  chips: { gap: headerMetrics.chipsApart, paddingRight: layout.gutter },
  chip: {
    height: headerMetrics.chipH,
    paddingLeft: headerMetrics.chipLeft,
    paddingRight: headerMetrics.chipRight,
    borderRadius: radius.chip,
    flexDirection: 'row',
    alignItems: 'center',
    gap: headerMetrics.chipGap,
  },
  chipText: { ...font(600), fontSize: headerMetrics.chip, lineHeight: canvasNormalLineHeight(headerMetrics.chip) },
  counts: { flexDirection: 'row', flexWrap: 'wrap', columnGap: headerMetrics.countsApart, rowGap: space.xs },
  countWord: { fontSize: headerMetrics.countWord, lineHeight: canvasNormalLineHeight(headerMetrics.countFigure) },
  countFigure: { ...font(700), fontSize: headerMetrics.countFigure },
});
