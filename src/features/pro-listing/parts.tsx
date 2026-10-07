import { useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { browserOutlineOff, useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/Text';
import { fieldMetrics } from '@/components/TextField';
import { font, radius, space, useWawu } from '@/theme';

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

/** A small caps heading with its chips under it (kit `label`, then 10 and the chips 7 apart). */
export function ChipGroup({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  return (
    <View style={styles.group}>
      <Text variant="label">{label}</Text>
      <View style={styles.chips}>{children}</View>
      {error ? (
        <Text variant="caption" tone="danger" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/** pros.js line 32: the about box is 80 high at least, 18 corner, 14 by 16 padding, 15 type on a 1.4 line. */
const longMetrics = { minHeight: 80, padV: 14, fontSize: 15, leading: 1.4 } as const;

export type LongFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  hint?: string;
  testID?: string;
};

/** The labelled multi-line box. */
export function LongField({ label, value, onChangeText, error, hint, testID }: LongFieldProps) {
  const { colors } = useWawu();
  const [focused, setFocused] = useState(false);
  const border = error ? colors.danger : focused ? colors.accent : colors.borderHairline;
  const message = error ?? hint;
  return (
    <View style={styles.long}>
      <Text variant="secondary" tone="textSecondary" style={styles.longLabel}>
        {label}
      </Text>
      <View style={[styles.box, { backgroundColor: colors.surfaceInput, borderColor: border, borderWidth: focused || error ? fieldMetrics.ring : StyleSheet.hairlineWidth }]}>
        <TextInput
          testID={testID}
          accessibilityLabel={label}
          multiline
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.accent}
          cursorColor={colors.accent}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, Platform.OS === 'web' ? browserOutlineOff : null, { color: colors.textPrimary }]}
        />
      </View>
      {message ? (
        <Text variant="caption" tone={error ? 'danger' : 'textMuted'} accessibilityRole={error ? 'alert' : undefined} style={styles.message}>
          {message}
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
  group: { gap: space.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: chipMetrics.between },
  long: { alignSelf: 'stretch' },
  longLabel: { ...font(600), fontSize: fieldMetrics.label, marginBottom: space.sm },
  box: { minHeight: longMetrics.minHeight, borderRadius: fieldMetrics.radius, paddingVertical: longMetrics.padV, paddingHorizontal: space.lg },
  input: { ...font(400), fontSize: longMetrics.fontSize, lineHeight: longMetrics.fontSize * longMetrics.leading, padding: 0, minHeight: longMetrics.minHeight - 2 * longMetrics.padV, textAlignVertical: 'top' },
  message: { marginTop: space.xs },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: noteMetrics.iconToText, borderRadius: radius.tile, paddingVertical: noteMetrics.padV, paddingHorizontal: space.lg },
  noteIcon: { paddingTop: noteMetrics.nudge },
  noteText: { flex: 1, gap: noteMetrics.inner },
});

export { noteMetrics };
