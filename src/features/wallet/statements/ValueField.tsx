import { Pressable, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/Text';
import { fieldMetrics } from '@/components/TextField';
import { font, space, useWawu } from '@/theme';

/** design/_gen/kit.js `field`: the lead and the trailing icon sit 10 from the words; the leading flag is 26, the trailing icon 17 or 18. */
const valueFieldMetrics = { between: 10, trail: 17 } as const;
/** A section label (kit.js `label`) sits 10 above what it names. */
const sectionGap = 10;

export type ValueFieldProps = {
  label: string;
  value: string;
  /** Drawn before the value (W38's currency flag). */
  lead?: ReactNode;
  /** Drawn after the value in text-muted (W38's calendar). With `onPress` the whole box is the button. */
  trailIcon?: IconName;
  /** Opens a chooser instead of a keyboard. Without it the field only shows its value. */
  onPress?: () => void;
  disabled?: boolean;
  /** The label is a section label ("FORMAT": small capitals, 10 above the box) and not a field label (13 at 600, 8 above). */
  section?: boolean;
  /** What a screen reader says for a button field, after the label and value. */
  hint?: string;
  testID?: string;
};

/**
 * W38's `field` boxes (Account, From, To, Send to): the form's field look around a value the person does not type.
 * `TextField` has no tap-to-choose or read-only mode yet (SHARED-CHANGES WALLET-11 #1, the same ask `BankField` is
 * waiting on), so this goes once it has.
 */
export function ValueField({ label, value, lead, trailIcon, onPress, disabled, section, hint, testID }: ValueFieldProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const inner = (
    <>
      {lead}
      <Text variant="body" numberOfLines={1} style={[styles.value, font(500)]}>
        {value}
      </Text>
      {trailIcon ? <Icon name={trailIcon} size={valueFieldMetrics.trail} color={colors.textMuted} /> : null}
    </>
  );
  return (
    <View style={styles.root}>
      {section ? (
        <Text variant="label" tone="textMuted" style={styles.sectionLabel}>
          {label}
        </Text>
      ) : (
        <Text variant="secondary" tone="textSecondary" style={styles.label}>
          {label}
        </Text>
      )}
      {onPress ? (
        <Pressable
          testID={testID}
          accessibilityRole="button"
          accessibilityLabel={`${label}, ${value}`}
          accessibilityHint={hint}
          accessibilityState={{ disabled: Boolean(disabled) }}
          disabled={disabled}
          onPress={onPress}
          {...ring.handlers}
          style={({ pressed }) => [
            styles.box,
            { backgroundColor: disabled || pressed ? colors.surfaceSunken : colors.surfaceInput, borderColor: colors.borderHairline },
            ring.style,
          ]}
        >
          {inner}
        </Pressable>
      ) : (
        <View
          testID={testID}
          accessible
          accessibilityLabel={`${label}, ${value}`}
          style={[styles.box, { backgroundColor: colors.surfaceInput, borderColor: colors.borderHairline }]}
        >
          {inner}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: 'stretch' },
  label: { ...font(600), fontSize: fieldMetrics.label, marginBottom: space.sm },
  sectionLabel: { marginBottom: sectionGap },
  box: {
    height: fieldMetrics.height,
    flexDirection: 'row',
    alignItems: 'center',
    gap: valueFieldMetrics.between,
    paddingHorizontal: space.lg,
    borderRadius: fieldMetrics.radius,
    borderWidth: StyleSheet.hairlineWidth,
  },
  value: { flex: 1, fontSize: fieldMetrics.value },
});
