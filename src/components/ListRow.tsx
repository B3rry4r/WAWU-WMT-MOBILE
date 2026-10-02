import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { font, space, useWawu } from '@/theme';

import { useFocusRing } from './focusRing';
import { Icon } from './icon';
import { Text } from './Text';

/**
 * Row sizes from the board kit (design/_gen/kit.js line 56 `listRow`, line 44 `kv`;
 * DECISIONS R-22): they sit here, once, and nowhere else.
 */
export const rowMetrics = {
  /** Space between the lead, the words and the trailing part. */
  between: 13,
  padV: 12,
  minHeight: 64,
  title: 15.5,
  subtitle: 13,
  /** Space between a title and the line under it. */
  subtitleGap: 3,
  /** `letter-spacing: -0.01em` on a row title. */
  titleTracking: -0.01,
  chevron: 18,
  /** A key and its value (the `kv` rows of a receipt or a sheet). */
  pairMinHeight: 50,
  pairGap: 14,
  pairLabel: 14,
  pairValue: 14.5,
  /** Space between the parts of a value (kit `kv`: gap 6). */
  pairValueGap: 6,
} as const;

export type ListRowProps = {
  /** An Avatar, IconTile or MediaCard thumbnail. */
  lead?: ReactNode;
  title: string;
  /** Sits right of the title, such as a verified Tick. */
  titleAccessory?: ReactNode;
  subtitle?: string;
  /** Replaces the chevron, such as a Money figure or a pill. */
  trailing?: ReactNode;
  /** With no `trailing`, a row that can be opened shows a chevron. */
  onPress?: () => void;
  /** What a screen reader says when it is not just the title and subtitle. */
  accessibilityLabel?: string;
  testID?: string;
};

/** One row of a grouped list: lead, title with a line under it, and a chevron or a figure. */
export function ListRow({ lead, title, titleAccessory, subtitle, trailing, onPress, accessibilityLabel, testID }: ListRowProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const end = trailing ?? (onPress ? <Icon name="ChevronRight" size={rowMetrics.chevron} color={colors.textMuted} /> : null);
  const body = (
    <>
      {lead}
      <View style={styles.words}>
        <View style={styles.titleLine}>
          <Text variant="body" numberOfLines={1} style={[font(600), styles.title]}>
            {title}
          </Text>
          {titleAccessory}
        </View>
        {subtitle ? (
          <Text variant="secondary" tone="textMuted" numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {end}
    </>
  );

  if (!onPress) {
    return (
      <View testID={testID} accessible accessibilityLabel={accessibilityLabel ?? [title, subtitle].filter(Boolean).join(', ')} style={styles.row}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? [title, subtitle].filter(Boolean).join(', ')}
      onPress={onPress}
      {...ring.handlers}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceSunken }, ring.style]}
    >
      {body}
    </Pressable>
  );
}

export type KeyValueRowProps = {
  label: string;
  /** Words, or a Money figure. */
  value: ReactNode;
  testID?: string;
};

/** "Price  ₦2,500": a label on the left and its value on the right. Put these in a GroupedList. */
export function KeyValueRow({ label, value, testID }: KeyValueRowProps) {
  return (
    <View testID={testID} accessible style={styles.pair}>
      <Text variant="secondary" style={styles.pairLabel}>
        {label}
      </Text>
      <View style={styles.pairValue}>
        {typeof value === 'string' ? (
          <Text variant="body" numberOfLines={1} style={[font(600), { fontSize: rowMetrics.pairValue }]}>
            {value}
          </Text>
        ) : (
          value
        )}
      </View>
    </View>
  );
}

export type ListSectionProps = { title: string; children: ReactNode; testID?: string };

/** A day or a group: the small capital label, then its rows (design/_gen/wallet.js, W26 "Today" and "Yesterday"). */
export function ListSection({ title, children, testID }: ListSectionProps) {
  return (
    <View testID={testID} style={styles.section}>
      <Text variant="label" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rowMetrics.between,
    minHeight: rowMetrics.minHeight,
    paddingVertical: rowMetrics.padV,
  },
  words: { flex: 1, minWidth: 0 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  title: { fontSize: rowMetrics.title, letterSpacing: rowMetrics.titleTracking * rowMetrics.title, flexShrink: 1 },
  subtitle: { fontSize: rowMetrics.subtitle, marginTop: rowMetrics.subtitleGap },
  pair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: rowMetrics.pairGap,
    minHeight: rowMetrics.pairMinHeight,
    paddingVertical: rowMetrics.padV,
  },
  pairLabel: { fontSize: rowMetrics.pairLabel, flexShrink: 0 },
  pairValue: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: rowMetrics.pairValueGap, flexShrink: 1, minWidth: 0 },
  section: { gap: space.lg },
});
