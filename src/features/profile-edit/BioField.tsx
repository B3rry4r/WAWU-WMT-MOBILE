import { useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { browserOutlineOff } from '@/components/focusRing';
import { Text } from '@/components/Text';
import { fieldMetrics } from '@/components/TextField';
import { font, space, text, useWawu } from '@/theme';

/** design/_gen/me.js line 36 (M8): a 76 high box, 18 corner, 14 by 16 padding, 15 type on a 1.4 line, and a 12 counter under it. */
const bioMetrics = { minHeight: 76, padV: 14, fontSize: 15, leading: 1.4, counter: 12 } as const;

export type BioFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  /** The most characters the Hub keeps (`limits.bio`). */
  max: number;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  testID?: string;
};

/** The labelled multi-line box with its "86 / 500" counter. The count is the Hub's limit, not the canvas's 160. */
export function BioField({ value, onChangeText, max, error, disabled, placeholder, testID }: BioFieldProps) {
  const { colors } = useWawu();
  const [focused, setFocused] = useState(false);
  const over = value.length > max;
  const bad = over || Boolean(error);
  const border = bad ? colors.danger : focused ? colors.accent : colors.borderHairline;
  return (
    <View style={styles.root}>
      <Text variant="secondary" tone="textSecondary" style={styles.label}>
        Bio
      </Text>
      <View
        style={[
          styles.box,
          { backgroundColor: disabled ? colors.surfaceSunken : colors.surfaceInput, borderColor: border, borderWidth: focused || bad ? fieldMetrics.ring : StyleSheet.hairlineWidth },
        ]}
      >
        <TextInput
          testID={testID}
          accessibilityLabel="Bio"
          multiline
          editable={!disabled}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.accent}
          cursorColor={colors.accent}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, Platform.OS === 'web' ? browserOutlineOff : null, { color: disabled ? colors.textDisabled : colors.textPrimary }]}
        />
      </View>
      <View style={styles.footer}>
        {error ? (
          <Text variant="caption" tone="danger" accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : (
          <View style={styles.error} />
        )}
        <Text
          testID={testID ? `${testID}-count` : undefined}
          variant="caption"
          tone={over ? 'danger' : 'textMuted'}
          accessibilityLabel={`${value.length} of ${max} characters`}
          style={{ fontSize: bioMetrics.counter }}
        >
          {`${value.length} / ${max}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: 'stretch', gap: space.sm },
  label: { ...font(600), fontSize: fieldMetrics.label },
  box: { minHeight: bioMetrics.minHeight, borderRadius: fieldMetrics.radius, paddingHorizontal: space.lg, paddingVertical: bioMetrics.padV },
  input: {
    ...text.body,
    ...font(400),
    fontSize: bioMetrics.fontSize,
    lineHeight: bioMetrics.fontSize * bioMetrics.leading,
    padding: 0,
    textAlignVertical: 'top',
  },
  footer: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.md },
  error: { flex: 1 },
});
