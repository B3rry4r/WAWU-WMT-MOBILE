import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { unbuilt } from '@/lib/unbuilt';
import { space, useWawu } from '@/theme';

/**
 * wallet.js line 44 (`cardRow`): a card padded 12 by 14, holding a 64 wide card picture (a card is 0.63 as
 * high as it is wide, with a 4 corner at that size), then the name (15 / 600) over a line (13, muted, 2 below),
 * then a chevron (18, muted), 14 apart.
 *
 * The card row is the way into Cards (W29 to W34), which WALLET-22 builds. Nothing serves a card yet, so the
 * picture is a neutral stand-in, the line under the name is left out (the canvas's "Physical, the last four
 * digits, Active" are one person's card), and the row does nothing when tapped (R-46).
 */
export const CARD_ROW = { padV: space.md, padH: 14, between: 14, pictureW: 64, pictureH: 40, pictureRadius: 4, glyph: 20, chevron: 18 } as const;

export function WalletCardRow() {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID="wallet-card-row"
      accessibilityRole="button"
      accessibilityLabel="WAWU card"
      onPress={unbuilt('WALLET-22')}
      {...ring.handlers}
      style={ring.style}
    >
      <Card style={styles.card}>
        <View style={styles.row}>
          <View testID="wallet-card-picture" style={[styles.picture, { backgroundColor: colors.surfaceSunken }]}>
            <Icon name="CreditCard" size={CARD_ROW.glyph} color={colors.textMuted} />
          </View>
          <View style={styles.words}>
            <Text variant="cardTitle">WAWU card</Text>
          </View>
          <Icon name="ChevronRight" size={CARD_ROW.chevron} color={colors.textMuted} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: CARD_ROW.padV, paddingHorizontal: CARD_ROW.padH },
  row: { flexDirection: 'row', alignItems: 'center', gap: CARD_ROW.between },
  picture: {
    width: CARD_ROW.pictureW,
    height: CARD_ROW.pictureH,
    borderRadius: CARD_ROW.pictureRadius,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  words: { flex: 1, minWidth: 0 },
});
