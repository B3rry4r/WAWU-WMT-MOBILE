import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, radius, space, type, useWawu } from '@/theme';

/** design/_gen/pros.js line 31, `picked`: 32 high, 12 across, 13 semi-bold, a 12 cross 6 after the word; "Add" is the same with a 13 plus and 5 between. */
const chipMetrics = { between: 7, height: 32, padH: 12, font: 13, icon: 13, cross: 12, crossGap: 6, plusGap: 5 } as const;

/** A chosen field or thing you take on, with its cross. Pressing it takes it away. */
export function PickedChip({ label, onRemove, testID }: { label: string; onRemove: () => void; testID?: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`Remove ${label}`}
      onPress={onRemove}
      {...ring.handlers}
      style={[styles.chip, { backgroundColor: colors.accentTint, gap: chipMetrics.crossGap }, ring.style]}
    >
      <Text variant="body" tone="accentFg" style={[font(600), styles.chipText]}>
        {label}
      </Text>
      <Icon name="X" size={chipMetrics.cross} color={colors.accentFg} strokeWidth={2.4} />
    </Pressable>
  );
}

/** The outlined "Add" chip beside them. */
export function AddChip({ label = 'Add', onPress, testID }: { label?: string; onPress: () => void; testID?: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.chip, { borderColor: colors.borderStrong, borderWidth: StyleSheet.hairlineWidth, gap: chipMetrics.plusGap }, ring.style]}
    >
      <Icon name="Plus" size={chipMetrics.icon} color={colors.textPrimary} />
      <Text variant="body" style={[font(600), styles.chipText]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** A small caps heading with its chips under it (kit `label` on `line-height: normal`, then 10 and the chips 7 apart). */
const groupMetrics = { labelToChips: 10 } as const;
export function ChipGroup({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  return (
    <View style={styles.group}>
      <Text variant="label" style={styles.groupLabel}>
        {label}
      </Text>
      <View style={styles.chips}>{children}</View>
      {error ? (
        <Text variant="caption" tone="danger" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/** kit.js line 58, `banner`: 18 corner, 14 by 16 padding, a 19 icon, 12 gap, 3 between title and words. */
const noteMetrics = { padV: 14, icon: 19, iconToText: 12, inner: 3, nudge: 1 } as const;

export type NoteProps = {
  tone: 'warning' | 'info';
  icon: IconName;
  title: string;
  body?: string;
  testID?: string;
  children?: ReactNode;
};

/** The tinted note: a reason, a rule, a pointer. The shared Banner carries one icon and two tones (SHARED-CHANGES.md, PROS-03). */
export function Note({ tone, icon, title, body, testID, children }: NoteProps) {
  const { colors } = useWawu();
  return (
    <View testID={testID} style={[styles.note, { backgroundColor: tone === 'warning' ? colors.warningTint : colors.infoTint }]}>
      <View style={styles.noteIcon}>
        <Icon name={icon} size={noteMetrics.icon} color={tone === 'warning' ? colors.warning : colors.info} strokeWidth={2.2} />
      </View>
      <View style={styles.noteText}>
        <Text variant="kvValue">{title}</Text>
        {body ? <Text variant="bannerBody">{body}</Text> : null}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { height: chipMetrics.height, paddingHorizontal: chipMetrics.padH, borderRadius: radius.chip, flexDirection: 'row', alignItems: 'center' },
  chipText: { fontSize: chipMetrics.font },
  group: { gap: groupMetrics.labelToChips },
  groupLabel: { lineHeight: canvasNormalLineHeight(type.size.label) },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: chipMetrics.between },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: noteMetrics.iconToText, borderRadius: radius.tile, paddingVertical: noteMetrics.padV, paddingHorizontal: space.lg },
  noteIcon: { paddingTop: noteMetrics.nudge },
  noteText: { flex: 1, gap: noteMetrics.inner },
});

export { noteMetrics };
