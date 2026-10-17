import { Pressable, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { ListRow } from '@/components/ListRow';
import { Text } from '@/components/Text';
import { fieldMetrics } from '@/components/TextField';
import { font, space, useWawu } from '@/theme';

/** The same field as A5's State (kit.js `field` with a ChevronDown, A5 line 57): the chevron 18, 10 from the value. */
const pickerMetrics = { trail: 18, between: 10, errorIcon: 16 } as const;
/** kit.js `Check` beside a chosen row: 18 at stroke 2.6. */
const pickedMetrics = { icon: 18, stroke: 2.6 } as const;

export type ChoiceOption<T extends string> = { value: T; label: string };

export type ChoiceFieldProps = {
  label: string;
  /** The chosen option's label, or null before one is chosen. */
  value: string | null;
  onPress: () => void;
  error?: string;
  disabled?: boolean;
  testID?: string;
};

/**
 * A field that opens a short list instead of a keyboard (KYC-06, G-820: the ID's
 * type on A26, the bill's type on A27). It looks like the form's other fields
 * (A5's State is the same field with a longer list); `TextField` has no
 * tap-to-choose mode (SHARED-CHANGES WALLET-11 #1 asks for one).
 */
export function ChoiceField({ label, value, onPress, error, disabled, testID }: ChoiceFieldProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <View style={styles.root}>
      <Text variant="secondary" tone="textSecondary" style={styles.label}>
        {label}
      </Text>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={value ? `${label}, ${value}` : `${label}, choose one`}
        accessibilityHint={error ?? 'Opens the list'}
        accessibilityState={{ disabled: Boolean(disabled) }}
        disabled={disabled}
        onPress={onPress}
        {...ring.handlers}
        style={({ pressed }) => [
          styles.box,
          {
            backgroundColor: disabled || pressed ? colors.surfaceSunken : colors.surfaceInput,
            borderColor: error ? colors.danger : colors.borderHairline,
            borderWidth: error ? fieldMetrics.ring : StyleSheet.hairlineWidth,
          },
          ring.style,
        ]}
      >
        <Text variant="body" numberOfLines={1} tone={value ? 'textPrimary' : 'textMuted'} style={[styles.value, value ? font(500) : font(400)]}>
          {value ?? 'Choose'}
        </Text>
        <Icon name="ChevronDown" size={pickerMetrics.trail} color={colors.textMuted} />
      </Pressable>
      {error ? (
        <View style={styles.message}>
          <Icon name="CircleAlert" size={pickerMetrics.errorIcon} color={colors.danger} strokeWidth={2} />
          <Text variant="caption" tone="danger" accessibilityRole="alert" style={styles.messageText}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export type ChoiceSheetProps<T extends string> = {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: readonly ChoiceOption<T>[];
  selected: T | null;
  onPick: (value: T) => void;
  /** The field's test id: each option is `<testID>-<value>`. */
  testID: string;
};

/** The list behind a ChoiceField: a few rows, the chosen one marked. */
export function ChoiceSheet<T extends string>({ visible, onClose, title, options, selected, onPick, testID }: ChoiceSheetProps<T>) {
  const { colors } = useWawu();
  return (
    <BottomSheet visible={visible} onClose={onClose} label={title} testID={`${testID}-sheet`}>
      <Text variant="sheetTitleSm" accessibilityRole="header">
        {title}
      </Text>
      <View>
        {options.map((option) => (
          <ListRow
            key={option.value}
            testID={`${testID}-${option.value}`}
            title={option.label}
            accessibilityLabel={option.value === selected ? `${option.label}, chosen` : option.label}
            trailing={
              option.value === selected ? <Icon name="Check" size={pickedMetrics.icon} color={colors.accentFg} strokeWidth={pickedMetrics.stroke} /> : <View />
            }
            onPress={() => onPick(option.value)}
          />
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  root: {},
  label: { ...font(600), fontSize: fieldMetrics.label, marginBottom: space.sm },
  box: {
    height: fieldMetrics.height,
    flexDirection: 'row',
    alignItems: 'center',
    gap: pickerMetrics.between,
    paddingHorizontal: space.lg,
    borderRadius: fieldMetrics.radius,
  },
  value: { flex: 1, fontSize: fieldMetrics.value },
  message: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm },
  messageText: { flexShrink: 1 },
});
