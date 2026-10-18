import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { radius, space, useWawu } from '@/theme';

import { OUT_LINE, OUT_TITLE } from './model';

/**
 * design/_gen/kit.js line 58 (`banner`, warning) in design/_gen/inbox.js line 78: an 18 radius tint box, 14 by 16 inside, a 19 coin
 * with 12 after it, the title at 14.5 / 600, the words at 13 on a 1.45 line, and a small Buy credits button 8 under them. It sits in
 * the composer's top, 10 under the bar's edge, 16 at the sides.
 */
const panelMetrics = { padV: 14, icon: 19, iconToText: 12, inner: 3, iconNudge: 1, buttonTop: 8, barTop: 10, barSide: 16 } as const;

export type OutOfCreditsPanelProps = {
  onBuy: () => void;
  /** The words under the title. Left out, the older words are used. A room passes the board's, built from the Hub's costs by kind (INBOX-23). */
  line?: string;
};

/**
 * I27 · Out of credits: a room where the person has no credits left. Reading stays free, and Buy credits opens I28. The words are
 * the ones that are true today (the Hub charges one credit for any message); the board's "Text and emoji stay free" waits for the
 * costs by kind of message (INBOX-22, R-62).
 */
export function OutOfCreditsPanel({ onBuy, line = OUT_LINE }: OutOfCreditsPanelProps) {
  const { colors } = useWawu();
  return (
    <View testID="out-of-credits" style={[styles.bar, { backgroundColor: colors.surfaceChrome, borderTopColor: colors.borderHairline }]}>
      <View style={[styles.panel, { backgroundColor: colors.warningTint }]} accessibilityRole="alert" accessibilityLiveRegion="polite">
        <View style={styles.icon}>
          <Icon name="Coins" size={panelMetrics.icon} color={colors.warning} strokeWidth={2.2} />
        </View>
        <View style={styles.text}>
          <Text variant="kvValue">{OUT_TITLE}</Text>
          <Text variant="bannerBody">{line}</Text>
          <View style={styles.action}>
            <Button testID="out-of-credits-buy" label="Buy credits" size="sm" onPress={onBuy} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingTop: panelMetrics.barTop, paddingHorizontal: panelMetrics.barSide, borderTopWidth: StyleSheet.hairlineWidth },
  panel: { flexDirection: 'row', alignItems: 'flex-start', gap: panelMetrics.iconToText, borderRadius: radius.tile, paddingVertical: panelMetrics.padV, paddingHorizontal: space.lg },
  icon: { paddingTop: panelMetrics.iconNudge },
  text: { flex: 1, gap: panelMetrics.inner },
  action: { marginTop: panelMetrics.buttonTop, alignItems: 'flex-start' },
});
