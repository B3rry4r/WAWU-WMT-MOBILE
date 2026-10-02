import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { font, layout, radius, space, text, useWawu } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

/**
 * The design's `field` helper (design/_gen/kit.js). The theme has no token for
 * these sizes (SHARED-CHANGES.md, UI-01 row), so they live here and nowhere else.
 */
export const fieldMetrics = {
  height: 54,
  /** The same 18 as `radius.tile`; the design's field uses 18, `radius.input` is 16. */
  radius: radius.tile,
  /** The focus and error outline, the design's 1.5px accent ring. */
  ring: 1.5,
  label: 13,
  value: 15.5,
} as const;

/** The browser draws its own outline on a focused input; the designed ring replaces it. */
const browserOutlineOff = { outlineStyle: 'none', outlineWidth: 0 } as object;

export type TextFieldProps = Omit<TextInputProps, 'style' | 'editable' | 'secureTextEntry'> & {
  label: string;
  /** Guidance under the field, such as "At least 8 characters". Replaced by `error` while one is showing. */
  hint?: string;
  /** What is wrong, in words the user can act on. Turns the field red. */
  error?: string;
  disabled?: boolean;
  /** A check is running against the server (for example the phone check). Typing stays allowed. */
  loading?: boolean;
  /** A password field: dots, with a button to show it. */
  secret?: boolean;
  leadingIcon?: IconName;
};

/** The labelled input every form is built from. */
export function TextField({
  label,
  hint,
  error,
  disabled,
  loading,
  secret,
  leadingIcon,
  onFocus,
  onBlur,
  testID,
  ...rest
}: TextFieldProps) {
  const { colors } = useWawu();
  const [focused, setFocused] = useState(false);
  const [shown, setShown] = useState(false);

  const border = error ? colors.danger : focused ? colors.accent : colors.borderHairline;
  const message = error ?? hint;

  return (
    <View style={styles.root}>
      <Text variant="secondary" tone="textSecondary" style={styles.label}>
        {label}
      </Text>
      <View
        testID={testID ? `${testID}-box` : undefined}
        style={[
          styles.box,
          {
            backgroundColor: disabled ? colors.surfaceSunken : colors.surfaceInput,
            borderColor: border,
            borderWidth: focused || error ? fieldMetrics.ring : StyleSheet.hairlineWidth,
          },
        ]}
      >
        {leadingIcon ? <Icon name={leadingIcon} size={space.xl} color={colors.textMuted} /> : null}
        <TextInput
          testID={testID}
          accessibilityLabel={label}
          accessibilityHint={message}
          editable={!disabled}
          secureTextEntry={secret && !shown}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.accent}
          cursorColor={colors.accent}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, Platform.OS === 'web' ? browserOutlineOff : null, { color: disabled ? colors.textDisabled : colors.textPrimary }]}
          {...rest}
        />
        {loading ? <ActivityIndicator testID="field-spinner" size="small" color={colors.textMuted} /> : null}
        {secret ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={shown ? 'Hide password' : 'Show password'}
            hitSlop={layout.tapMin / 4}
            disabled={disabled}
            onPress={() => setShown((v) => !v)}
          >
            <Icon name={shown ? 'eyeOff' : 'eye'} size={space.xl} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {message ? (
        <View style={styles.message}>
          {error ? <Icon name="alert" size={space.lg} color={colors.danger} stroke={2} /> : null}
          <Text
            variant="caption"
            tone={error ? 'danger' : 'textMuted'}
            accessibilityLiveRegion={error ? 'polite' : 'none'}
            accessibilityRole={error ? 'alert' : undefined}
            style={styles.messageText}
          >
            {message}
          </Text>
        </View>
      ) : null}
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
    gap: space.md,
    paddingHorizontal: space.lg,
    borderRadius: fieldMetrics.radius,
  },
  input: { ...text.body, ...font(500), flex: 1, fontSize: fieldMetrics.value, paddingVertical: 0 },
  message: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm },
  messageText: { flexShrink: 1 },
});
