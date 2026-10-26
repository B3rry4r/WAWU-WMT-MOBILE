import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, useWawu } from '@/theme';

import type { MyPass } from '../api/pass';
import { eventLine, PASSES_EMPTY } from './model';

/**
 * design/_gen/wallet.js line 46, `mini`: a 20 corner, padded 12 by 14, the parts 4 apart. The head is a 15 icon
 * and the word at 12.5 / 600 muted, 6 apart; the pass's name is 18 / 700 tracked -0.02em; the line under it is 12 muted.
 * Every line sits on the canvas's `line-height: normal`. The board's second line is the event's name (the Hub's, G-814, FIX-110); until an admin names the event the date line is there instead.
 */
const TILE = { radius: 20, padV: 12, padH: 14, stack: 4, head: 12.5, headGap: 6, icon: 15, title: 18, titleTracking: -0.02, sub: 12 } as const;
/**
 * The empty card's title ("No event pass yet") is the same 18 / 700 as a pass's name and the Points card's count (W1 draws one size for
 * the card's title; SWEEP-1026 row 9). It is longer than a pass's name, so in half a row it may take a second line rather than be set
 * smaller. Its last line ("Comes with Founding Maker") is the owner's words and a little wider than half a row at 390, so it may take a
 * second line too (the Points card beside it stretches to the same height).
 */

/**
 * W1's Passes card: the Hub's name for the person's pass and when the event is. Tapping it opens W44. It shares a row
 * with the Points card (DV2-02) and takes what room the row gives it.
 *
 * With no pass (`pass` null: the Hub has none for the person, or could not say) the card is still there, in the same place and size
 * (owner, 26 Oct 2026, R-97): "Passes", "No event pass yet", "Comes with Founding Maker". Tapping it opens the tiers (VF5) through
 * `onPress`, where the pass is bought.
 */
export function PassesTile({ pass, onPress }: { pass: Pick<MyPass, 'name' | 'eventDate' | 'eventName'> | null; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const title = pass ? pass.name : PASSES_EMPTY.title;
  const when = pass ? (pass.eventName ?? eventLine(pass.eventDate)) : PASSES_EMPTY.line;
  return (
    <Pressable
      testID="wallet-passes"
      accessibilityRole="button"
      accessibilityLabel={`Passes, ${title}, ${when}`}
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
        numberOfLines={pass ? 1 : 2}
        testID="wallet-passes-name"
        style={[font(700), { fontSize: TILE.title, letterSpacing: TILE.titleTracking * TILE.title, lineHeight: canvasNormalLineHeight(TILE.title) }]}
      >
        {title}
      </Text>
      <Text variant="body" tone="textMuted" numberOfLines={pass ? 1 : 2} testID="wallet-passes-when" style={{ fontSize: TILE.sub, lineHeight: canvasNormalLineHeight(TILE.sub) }}>
        {when}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, minWidth: 0, borderRadius: TILE.radius, paddingVertical: TILE.padV, paddingHorizontal: TILE.padH, gap: TILE.stack },
  head: { flexDirection: 'row', alignItems: 'center', gap: TILE.headGap },
});
