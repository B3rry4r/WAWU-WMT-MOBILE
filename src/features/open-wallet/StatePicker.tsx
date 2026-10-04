import { FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { ListRow } from '@/components/ListRow';
import { Text } from '@/components/Text';
import { fieldMetrics } from '@/components/TextField';
import { font, space, useWawu } from '@/theme';

import { NIGERIAN_STATES } from './details';

/** kit.js `field` with `trail: I('ChevronDown', 18, 'var(--text-muted)')` (A5 line 57, A20 line 49): the chevron, 10 from the value. */
const pickerMetrics = { trail: 18, between: 10, errorIcon: 16 } as const;
/** The list takes at most this share of the window, so the sheet never covers the whole screen. */
const LIST_SHARE = 0.5;
/** kit.js `Check` beside a chosen row: 18 at stroke 2.6. */
const pickedMetrics = { icon: 18, stroke: 2.6 } as const;

export type StateFieldProps = {
  /** The chosen state, or null before one is chosen. */
  value: string | null;
  onPress: () => void;
  error?: string;
  disabled?: boolean;
  testID?: string;
};

/**
 * A5's "State" field, the state part of the home address (BRIEF A5; A20's
 * field with a ChevronDown). It looks like the form's other fields and opens
 * the list of states instead of a keyboard. `TextField` has no tap-to-choose
 * mode (SHARED-CHANGES WALLET-11 #1 asks for one); A21's Bank field is the
 * same case.
 */
export function StateField({ value, onPress, error, disabled, testID }: StateFieldProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <View style={styles.root}>
      <Text variant="secondary" tone="textSecondary" style={styles.label}>
        State
      </Text>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={value ? `State, ${value}` : 'State, choose your state'}
        accessibilityHint={error ?? 'Opens the list of states'}
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

export type StateSheetProps = {
  visible: boolean;
  onClose: () => void;
  selected: string | null;
  onPick: (state: string) => void;
};

/** The list behind the State field (the canvas draws the field, not the list): Nigeria's 36 states and the FCT. */
export function StateSheet({ visible, onClose, selected, onPick }: StateSheetProps) {
  const { colors } = useWawu();
  const { height } = useWindowDimensions();
  return (
    <BottomSheet visible={visible} onClose={onClose} label="Choose your state" testID="state-sheet">
      <Text variant="sheetTitleSm" accessibilityRole="header">
        Choose your state
      </Text>
      <FlatList
        testID="state-sheet-list"
        data={NIGERIAN_STATES}
        keyExtractor={(state) => state}
        // 37 short rows: drawn at once, so a screen reader and a quick scroll find every state.
        initialNumToRender={NIGERIAN_STATES.length}
        style={{ maxHeight: height * LIST_SHARE }}
        renderItem={({ item }) => (
          <ListRow
            testID={`state-${item}`}
            title={item}
            accessibilityLabel={item === selected ? `${item}, chosen` : item}
            trailing={
              item === selected ? <Icon name="Check" size={pickedMetrics.icon} color={colors.accentFg} strokeWidth={pickedMetrics.stroke} /> : <View />
            }
            onPress={() => onPick(item)}
          />
        )}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
