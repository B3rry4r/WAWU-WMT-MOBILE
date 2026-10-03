import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { fieldMetrics } from '@/components/TextField';
import { font, space, useWawu } from '@/theme';

import type { Bank } from './api/payoutAccount';

/**
 * design/_gen/auth.js line 50 (A21) and kit.js `field`: the Bank field leads
 * with Landmark 19 in text-secondary and ends with ChevronDown 18 in
 * text-muted; the box's parts sit 10 apart.
 */
const bankFieldMetrics = { lead: 19, trail: 18, between: 10 } as const;

export type BankFieldProps = {
  /** The chosen bank, or null before one is chosen. */
  bank: Pick<Bank, 'code' | 'name'> | null;
  /** Opens the bank list. */
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
};

/**
 * A21's "Bank" field: it looks like the form's other fields and opens the bank
 * list instead of a keyboard. `TextField` has no tap-to-choose mode yet
 * (SHARED-CHANGES WALLET-11 #1); this goes once it has.
 */
export function BankField({ bank, onPress, disabled, testID }: BankFieldProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <View style={styles.root}>
      <Text variant="secondary" tone="textSecondary" style={styles.label}>
        Bank
      </Text>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={bank ? `Bank, ${bank.name}` : 'Bank, choose your bank'}
        accessibilityHint="Opens the list of banks"
        accessibilityState={{ disabled: Boolean(disabled) }}
        disabled={disabled}
        onPress={onPress}
        {...ring.handlers}
        style={({ pressed }) => [
          styles.box,
          {
            backgroundColor: disabled ? colors.surfaceSunken : pressed ? colors.surfaceSunken : colors.surfaceInput,
            borderColor: colors.borderHairline,
          },
          ring.style,
        ]}
      >
        <Icon name="Landmark" size={bankFieldMetrics.lead} color={colors.textSecondary} />
        <Text
          variant="body"
          numberOfLines={1}
          tone={bank ? 'textPrimary' : 'textMuted'}
          style={[styles.value, bank ? font(500) : font(400)]}
        >
          {bank ? bank.name : 'Choose your bank'}
        </Text>
        <Icon name="ChevronDown" size={bankFieldMetrics.trail} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: 'stretch' },
  label: { ...font(600), fontSize: fieldMetrics.label, marginBottom: space.sm },
  box: {
    height: fieldMetrics.height,
    flexDirection: 'row',
    alignItems: 'center',
    gap: bankFieldMetrics.between,
    paddingHorizontal: space.lg,
    borderRadius: fieldMetrics.radius,
    borderWidth: StyleSheet.hairlineWidth,
  },
  value: { flex: 1, fontSize: fieldMetrics.value },
});
