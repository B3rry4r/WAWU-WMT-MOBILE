import { Pressable, StyleSheet, View } from 'react-native';

import { useWawu } from '@/theme';

import { Card } from './Card';
import { useFocusRing } from './focusRing';
import { Icon, type IconName } from './icon';
import { IconTile } from './IconTile';
import { ListRow } from './ListRow';

/**
 * R-110 point 1 (owner, 30 Oct 2026): a promo row is one standard list row in a card. A 40 rounded square tile in the accent tint with an
 * accent glyph, the title, ONE muted line, a chevron; 72 high with the card's own 2 above and below the row's 14. No colour but the theme's.
 * "Get paid from abroad", "More than one currency" and the Voice entries (Hear your name, Voice Intro) are this one component.
 */
export const promoMetrics = { tile: 40, padV: 14, dismiss: 32, glyph: 14 } as const;

export type PromoRowDismiss = { label: string; onPress: () => void; testID?: string };

export type PromoRowProps = {
  icon: IconName;
  title: string;
  /** One line: it is cut with an ellipsis, never wrapped. */
  subtitle: string;
  onPress: () => void;
  testID?: string;
  /** The card around the row. */
  cardTestID?: string;
  subtitleTestID?: string;
  accessibilityLabel?: string;
  /** The card's corner, when it should match the cards around it (the Wallet's are 28). Default: the card's own. */
  radius?: number;
  /** A row that can be put away: a close button at its end, in place of the chevron. */
  dismiss?: PromoRowDismiss;
};

export function PromoRow({ icon, title, subtitle, onPress, testID, cardTestID, subtitleTestID, accessibilityLabel, radius, dismiss }: PromoRowProps) {
  const row = (
    <ListRow
      testID={testID}
      lead={<IconTile icon={icon} tone="accent" shape="square" size={promoMetrics.tile} />}
      title={title}
      subtitle={subtitle}
      subtitleTestID={subtitleTestID}
      padV={promoMetrics.padV}
      chevron={!dismiss}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? `${title}. ${subtitle}`}
    />
  );
  return (
    <Card testID={cardTestID} style={[dismiss ? styles.withDismiss : null, radius !== undefined ? { borderRadius: radius } : null]}>
      {dismiss ? (
        <>
          <View style={styles.grow}>{row}</View>
          <DismissButton {...dismiss} />
        </>
      ) : (
        row
      )}
    </Card>
  );
}

function DismissButton({ label, onPress, testID }: PromoRowDismiss) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      {...ring.handlers}
      style={({ pressed }) => [styles.dismiss, { backgroundColor: pressed ? colors.surfaceSunken : 'transparent' }, ring.style]}
    >
      <Icon name="X" size={promoMetrics.glyph + 2} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  withDismiss: { flexDirection: 'row', alignItems: 'center' },
  grow: { flex: 1, minWidth: 0 },
  dismiss: { width: promoMetrics.dismiss, height: promoMetrics.dismiss, borderRadius: promoMetrics.dismiss / 2, alignItems: 'center', justifyContent: 'center' },
});
