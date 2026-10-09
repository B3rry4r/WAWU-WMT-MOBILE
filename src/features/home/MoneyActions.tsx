import { Pressable, StyleSheet, Text, View } from 'react-native';

import { pressScale } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { ICON_STROKE, Icon, type IconName } from '@/components/icon';
import { unbuilt } from '@/lib/unbuilt';
import { radius, useWawu } from '@/theme';

import { cardInk, todayMetrics as m, todayWords } from './look';

type Action = { key: string; icon: IconName; label: string; onPress: () => void };

/**
 * H1 and H36's four money actions, in the canvas's order (design/_gen/home.js `balanceCard`). None of their screens is
 * built yet, so each is drawn and opens nothing (R-46): Send is W7 (WALLET-02), Add is W15 (WALLET-05), Bills is S2
 * (BILLS-01) and Scan is W24 (WALLET-20, after launch). The task that builds a screen wires its action here.
 */
export const moneyActions: readonly Action[] = [
  { key: 'send', icon: 'ArrowUpRight', label: 'Send', onPress: unbuilt('WALLET-02') },
  { key: 'add', icon: 'Plus', label: 'Add', onPress: unbuilt('WALLET-05') },
  { key: 'bills', icon: 'Receipt', label: 'Bills', onPress: unbuilt('BILLS-01') },
  { key: 'scan', icon: 'ScanLine', label: 'Scan', onPress: unbuilt('WALLET-20') },
];

function ActionButton({ action, first }: { action: Action; first: boolean }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`today-action-${action.key}`}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      onPress={action.onPress}
      {...ring.handlers}
      style={({ pressed }) => [styles.column, { transform: [{ scale: pressed ? pressScale : 1 }] }, ring.style]}
    >
      <View style={[styles.circle, { backgroundColor: first ? colors.accent : cardInk.chip }]}>
        <Icon name={action.icon} size={m.actionGlyph} color={cardInk.ink} strokeWidth={ICON_STROKE.button} />
      </View>
      <Text numberOfLines={1} style={[todayWords.action, { color: cardInk.ink }]}>
        {action.label}
      </Text>
    </Pressable>
  );
}

/** The row under the figure: four columns spread across the card, giving way together on a narrow phone. */
export function MoneyActions() {
  return (
    <View testID="today-actions" style={styles.row}>
      {moneyActions.map((action, i) => (
        <ActionButton key={action.key} action={action} first={i === 0} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginTop: m.actionsTop, flexDirection: 'row', justifyContent: 'space-between' },
  column: { width: m.actionWidth, flexShrink: 1, minWidth: 0, alignItems: 'center', gap: m.actionGap },
  circle: { width: m.actionButton, height: m.actionButton, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
