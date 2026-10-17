import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, useWawu } from '@/theme';

import type { MyPass } from '../api/pass';
import { eventLine } from './model';

/**
 * design/_gen/wallet.js line 46, `mini`: a 20 corner, padded 12 by 14, the parts 4 apart. The head is a 15 icon
 * and the word at 12.5 / 600 muted, 6 apart; the pass's name is 18 / 700 tracked -0.02em; the line under it is 12 muted.
 * Every line sits on the canvas's `line-height: normal`. The board's second line, the event's name, has no source (G-814, R-47), so the date line is there instead.
 */
const TILE = { radius: 20, padV: 12, padH: 14, stack: 4, head: 12.5, headGap: 6, icon: 15, title: 18, titleTracking: -0.02, sub: 12 } as const;

/**
 * W1's Passes card: the Hub's name for the person's pass and when the event is. Tapping it opens W44. It shares a row
 * with the Points card (DV2-02) and takes what room the row gives it.
 */
export function PassesTile({ pass, onPress }: { pass: Pick<MyPass, 'name' | 'eventDate'>; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const when = eventLine(pass.eventDate);
  return (
    <Pressable
      testID="wallet-passes"
      accessibilityRole="button"
      accessibilityLabel={`Passes, ${pass.name}, ${when}`}
      onPress={onPress}
      {...ring.handlers}
      style={[
        styles.tile,
        {
          backgroundColor: colors.surfaceCard,
          boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }],
        },
        ring.style,
      ]}
    >
      <View style={styles.head}>
        <Icon name="Ticket" size={TILE.icon} color={colors.accentFg} />
        <Text variant="body" tone="textMuted" style={[font(600), { fontSize: TILE.head, lineHeight: canvasNormalLineHeight(TILE.head) }]}>
          Passes
        </Text>
      </View>
      <Text
        variant="body"
        numberOfLines={1}
        testID="wallet-passes-name"
        style={[font(700), { fontSize: TILE.title, letterSpacing: TILE.titleTracking * TILE.title, lineHeight: canvasNormalLineHeight(TILE.title) }]}
      >
        {pass.name}
      </Text>
      <Text variant="body" tone="textMuted" numberOfLines={1} testID="wallet-passes-when" style={{ fontSize: TILE.sub, lineHeight: canvasNormalLineHeight(TILE.sub) }}>
        {when}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, minWidth: 0, borderRadius: TILE.radius, paddingVertical: TILE.padV, paddingHorizontal: TILE.padH, gap: TILE.stack },
  head: { flexDirection: 'row', alignItems: 'center', gap: TILE.headGap },
});
