import type { RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Avatar, type AvatarHue } from '@/components/Avatar';
import { BrandMark } from '@/components/BrandMark';
import { VerifiedTick } from '@/components/icon';
import { Text } from '@/components/Text';
import { font, stopOf, useWawu } from '@/theme';
import { darkColors } from '@/theme/tokens.generated';
import { readableLink } from '@/lib/appLinks';

import { CARD_LINE } from './model';

/**
 * design/_gen/referral.js `shareImg` (RF2): a 300 by 380 card, 28 round, 24 in, the mark at the top and the person at
 * the bottom 10 apart: a 64 avatar, the name at 24 / 700 (-0.03em) with its 20 tick, the line at 15 (85%) and the link at
 * 15 / 700. The glow is a 260 circle with its centre 130 in from the top right corner, clear at 70% of its far corner.
 *
 * The card is the same in both themes (the light artboard shows the same card) and it is the picture that goes out, so
 * it reads the dark token set directly, as the TGIF cards do, and does not follow the phone's theme. It carries no
 * outside brand name (R-68): the mark is the app's own.
 */
export const cardMetrics = {
  width: 300,
  height: 380,
  radius: 28,
  pad: 24,
  mark: 34,
  stack: 10,
  avatar: 64,
  name: 24,
  nameTracking: -0.03,
  nameGap: 6,
  tick: 20,
  line: 15,
  lineOpacity: 0.85,
  link: 15,
  glow: { size: 260, out: 70, strength: 0.85, clear: 0.7 },
} as const;

/** Where the glow's centre sits on the card, and how far it reaches before it is clear. */
const glowCentre = { x: cardMetrics.width + cardMetrics.glow.out - cardMetrics.glow.size / 2, y: cardMetrics.glow.size / 2 - cardMetrics.glow.out };
const glowReach = cardMetrics.glow.clear * (cardMetrics.glow.size / 2) * Math.SQRT2;

export type ShareCardProps = {
  name: string;
  hue: AvatarHue;
  avatarUrl?: string | null;
  /** The ticks beside the name, as Me draws them. */
  ticks: readonly ('creator' | 'pro')[];
  /** The Hub's link, `wawu/r/<code>`. */
  link: string;
  /** What `react-native-view-shot` draws to the picture. */
  viewRef?: RefObject<View | null>;
};

export function ShareCard({ name, hue, avatarUrl, ticks, link, viewRef }: ShareCardProps) {
  const { shadows } = useWawu();
  const glow = stopOf(darkColors.accent);
  return (
    <View style={[styles.shadow, { boxShadow: [...shadows.cover] }]}>
      <View ref={viewRef} collapsable={false} testID="invite-card" style={[styles.card, { backgroundColor: darkColors.tgifVerseGround }]}>
        <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={cardMetrics.width} height={cardMetrics.height}>
          <Defs>
            <RadialGradient id="inviteGlow" gradientUnits="userSpaceOnUse" cx={glowCentre.x} cy={glowCentre.y} r={glowReach}>
              <Stop offset="0" stopColor={glow.color} stopOpacity={cardMetrics.glow.strength} />
              <Stop offset="1" stopColor={glow.color} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width={cardMetrics.width} height={cardMetrics.height} fill="url(#inviteGlow)" />
        </Svg>
        <BrandMark layout="submark" width={cardMetrics.mark} surface="dark" decorative />
        <View style={styles.who}>
          <Avatar name={name} hue={hue} size={cardMetrics.avatar} source={avatarUrl ?? undefined} testID="invite-card-avatar" />
          <View style={styles.nameRow}>
            <Text variant="body" numberOfLines={2} style={[font(700), styles.name]} testID="invite-card-name">
              {name}
            </Text>
            {ticks.map((kind) => (
              <View key={kind} accessible accessibilityRole="image" accessibilityLabel={kind === 'pro' ? 'Professional tick' : 'Creator tick'}>
                <VerifiedTick kind={kind} size={cardMetrics.tick} />
              </View>
            ))}
          </View>
          <Text variant="body" style={styles.line}>
            {CARD_LINE}
          </Text>
          <Text variant="body" style={[font(700), styles.link]} testID="invite-card-link">
            {readableLink(link)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { width: cardMetrics.width, height: cardMetrics.height, borderRadius: cardMetrics.radius },
  card: {
    width: cardMetrics.width,
    height: cardMetrics.height,
    borderRadius: cardMetrics.radius,
    padding: cardMetrics.pad,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  who: { gap: cardMetrics.stack },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: cardMetrics.nameGap },
  name: { flexShrink: 1, fontSize: cardMetrics.name, letterSpacing: cardMetrics.nameTracking * cardMetrics.name, color: darkColors.textOnAccent },
  line: { fontSize: cardMetrics.line, opacity: cardMetrics.lineOpacity, color: darkColors.textOnAccent },
  link: { fontSize: cardMetrics.link, color: darkColors.textOnAccent },
});
