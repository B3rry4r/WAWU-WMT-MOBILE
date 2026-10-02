import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { font } from '@/theme';

import { useFocusRing } from './focusRing';
import type { IconName } from './icon';
import { IconTile, type IconTileTone } from './IconTile';
import { rowMetrics } from './ListRow';
import { formatMoney, Money, type Currency } from './Money';
import { Text } from './Text';

/** design/_gen/kit.js `tx`: the amount and the time sit 5 apart; the amount is 15.5. */
const amountSize = 15.5;
const metaGap = 5;
const meta = 12.5;
const leadSize = 44;

export type TransactionRowProps = {
  title: string;
  subtitle?: string;
  /** In kobo (or cents), negative when money left the wallet. */
  amountMinor: number;
  currency?: Currency;
  /** "10:24". */
  time?: string;
  /** An Avatar for a person. Without one the row draws `icon` on a tinted circle. */
  lead?: ReactNode;
  icon?: IconName;
  tone?: IconTileTone;
  onPress?: () => void;
  testID?: string;
};

/** One line of the ledger: who or what, a line under it, the signed amount and the time. */
export function TransactionRow({
  title,
  subtitle,
  amountMinor,
  currency = 'NGN',
  time,
  lead,
  icon = 'ArrowUpRight',
  tone,
  onPress,
  testID,
}: TransactionRowProps) {
  const ring = useFocusRing();
  const label = [title, subtitle, formatMoney(amountMinor, { currency, sign: true }), time].filter(Boolean).join(', ');
  const body = (
    <>
      {lead ?? <IconTile icon={icon} tone={tone ?? (amountMinor > 0 ? 'in' : 'neutral')} size={leadSize} />}
      <View style={styles.words}>
        <Text variant="body" numberOfLines={1} style={[font(600), styles.title]}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="secondary" tone="textMuted" numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.end}>
        <Money minorUnits={amountMinor} currency={currency} signed size={amountSize} />
        {time ? (
          <Text variant="caption" style={{ fontSize: meta }}>
            {time}
          </Text>
        ) : null}
      </View>
    </>
  );
  return onPress ? (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} {...ring.handlers} style={[styles.row, ring.style]}>
      {body}
    </Pressable>
  ) : (
    <View testID={testID} accessible accessibilityLabel={label} style={styles.row}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: rowMetrics.between },
  words: { flex: 1, minWidth: 0 },
  title: { fontSize: rowMetrics.title, letterSpacing: rowMetrics.titleTracking * rowMetrics.title },
  subtitle: { fontSize: rowMetrics.subtitle, marginTop: rowMetrics.subtitleGap },
  end: { alignItems: 'flex-end', gap: metaGap },
});
