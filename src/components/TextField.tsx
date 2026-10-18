import { useState, type Ref } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { canvasNormalLineHeight, font, layout, radius, space, text, type, useWawu } from '@/theme';

import { browserOutlineOff, useFocusRing } from './focusRing';
import { Icon, type IconName } from './icon';
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
  /** `letter-spacing: .04em` on the value of a `mono` field (kit.js line 45, `field`'s `mono` option). */
  monoTracking: 0.04,
} as const;

/** The kit's multi-line box (design/_gen/me.js line 36, M8): 76 high at least, 14 above and below, 15 type on a 1.4 line, a 12 counter. */
const multilineMetrics = { minHeight: 76, padV: 14, fontSize: 15, leading: 1.4, counter: 12 } as const;

/** A field that opens a picker (A21's Bank): a 19 lead in text-secondary, a 18 chevron, the parts 10 apart (design/_gen/auth.js line 50). */
const pickMetrics = { lead: 19, trail: 18, between: 10 } as const;

/** The hint under a field when it reports a result (A21's name line): 12.5, 600, a 15 mark at stroke 2.2, 6 between. */
const toneMetrics = { icon: 15, stroke: 2.2, iconGap: 6, weight: 600 } as const;

export type TextFieldProps = Omit<TextInputProps, 'style' | 'editable' | 'secureTextEntry'> & {
  label: string;
  /** Guidance under the field, such as "At least 8 characters". Replaced by `error` while one is showing. */
  hint?: string;
  /** What is wrong, in words the user can act on. Turns the field red. */
  error?: string;
  /** The red outline alone, with no sentence under the field (a sign-in that was refused says it once, in a banner above). */
  invalid?: boolean;
  /** The text input itself, so a form can move focus to its next field. */
  inputRef?: Ref<TextInput>;
  disabled?: boolean;
  /** A check is running against the server (for example the phone check). Typing stays allowed. */
  loading?: boolean;
  /** A password field: dots, with a button to show it. */
  secret?: boolean;
  leadingIcon?: IconName;
  /** The mark at the field's end (a chevron on a field that opens a picker). */
  trailingIcon?: IconName;
  /**
   * The field opens a picker instead of a keyboard (kit `field` with `onPress`): the box is one button that shows
   * `value`, or `placeholder` in the muted colour while there is none, and nothing can be typed.
   */
  onPress?: () => void;
  /** Draws the hint as a result: `ok` in the positive colour with a CircleCheck, `warning` with a TriangleAlert, 600. */
  tone?: 'ok' | 'warning';
  /** Reads the hint out as it changes (a polite live region) though it is a plain hint: A21's "Checking the account with the bank" (SWEEP-APP-3 row 91). */
  announce?: boolean;
  /** Track the value out by .04em (phone, BVN, NIN and account numbers, as the kit's `mono` field). */
  mono?: boolean;
  /** With `multiline`: the most characters allowed; a "12 / 500" counter shows under the box and turns red above it. */
  max?: number;
};

/** The labelled input every form is built from. */
export function TextField({
  label,
  hint,
  error,
  invalid,
  inputRef,
  disabled,
  loading,
  secret,
  leadingIcon,
  trailingIcon,
  onPress,
  tone,
  announce,
  mono,
  max,
  onFocus,
  onBlur,
  testID,
  ...rest
}: TextFieldProps) {
  const { colors } = useWawu();
  const [focused, setFocused] = useState(false);
  const [shown, setShown] = useState(false);
  const eyeRing = useFocusRing();
  const pickRing = useFocusRing();
  const multiline = Boolean(rest.multiline);
  const typed = typeof rest.value === 'string' ? rest.value : '';
  const over = max !== undefined && typed.length > max;

  const bad = Boolean(error) || Boolean(invalid) || over;
  const border = bad ? colors.danger : focused ? colors.accent : colors.borderHairline;
  const message = error ?? hint;

  return (
    <View style={styles.root}>
      <Text variant="secondary" tone="textSecondary" style={styles.label}>
        {label}
      </Text>
      {onPress ? (
        <Pressable
          testID={testID}
          accessibilityRole="button"
          accessibilityLabel={rest.accessibilityLabel ?? `${label}, ${typed || rest.placeholder || ''}`}
          accessibilityHint={rest.accessibilityHint ?? message}
          accessibilityState={{ disabled: Boolean(disabled) }}
          disabled={disabled}
          onPress={onPress}
          {...pickRing.handlers}
          style={({ pressed }) => [
            styles.box,
            styles.pickBox,
            {
              backgroundColor: disabled || pressed ? colors.surfaceSunken : colors.surfaceInput,
              borderColor: bad ? colors.danger : colors.borderHairline,
              borderWidth: bad ? fieldMetrics.ring : StyleSheet.hairlineWidth,
            },
            pickRing.style,
          ]}
        >
          {leadingIcon ? <Icon name={leadingIcon} size={pickMetrics.lead} color={colors.textSecondary} /> : null}
          <Text variant="body" numberOfLines={1} tone={typed ? 'textPrimary' : 'textMuted'} style={[styles.pickValue, typed ? font(500) : font(400)]}>
            {typed || rest.placeholder}
          </Text>
          {trailingIcon ? <Icon name={trailingIcon} size={pickMetrics.trail} color={colors.textMuted} /> : null}
        </Pressable>
      ) : (
      <View
        testID={testID ? `${testID}-box` : undefined}
        style={[
          styles.box,
          multiline && styles.multilineBox,
          {
            backgroundColor: disabled ? colors.surfaceSunken : colors.surfaceInput,
            borderColor: border,
            borderWidth: focused || bad ? fieldMetrics.ring : StyleSheet.hairlineWidth,
          },
        ]}
      >
        {leadingIcon ? <Icon name={leadingIcon} size={space.xl} color={colors.textMuted} /> : null}
        <TextInput
          ref={inputRef}
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
          style={[
            styles.input,
            multiline && styles.multilineInput,
            mono && { letterSpacing: fieldMetrics.monoTracking * fieldMetrics.value },
            Platform.OS === 'web' ? browserOutlineOff : null,
            { color: disabled ? colors.textDisabled : colors.textPrimary },
          ]}
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
            {...eyeRing.handlers}
            style={eyeRing.style}
          >
            <Icon name={shown ? 'EyeOff' : 'Eye'} size={space.xl} color={colors.textMuted} />
          </Pressable>
        ) : null}
        {trailingIcon ? <Icon name={trailingIcon} size={space.xl} color={colors.textMuted} /> : null}
      </View>
      )}
      {message || max !== undefined ? (
        <View style={[styles.message, tone && !error && styles.toneMessage]}>
          {error ? <Icon name="CircleAlert" size={space.lg} color={colors.danger} strokeWidth={2} /> : null}
          {tone && !error ? (
            <Icon
              name={tone === 'ok' ? 'CircleCheck' : 'TriangleAlert'}
              size={toneMetrics.icon}
              color={tone === 'ok' ? colors.positive : colors.warning}
              strokeWidth={toneMetrics.stroke}
            />
          ) : null}
          {message ? (
            <Text
              variant="caption"
              tone={error ? 'danger' : tone ? (tone === 'ok' ? 'positive' : 'warning') : 'textMuted'}
              accessibilityLiveRegion={error || tone || announce ? 'polite' : 'none'}
              accessibilityRole={error ? 'alert' : undefined}
              style={[styles.messageText, max !== undefined && styles.messageGrow, tone && !error && styles.toneText]}
            >
              {message}
            </Text>
          ) : (
            <View style={styles.messageGrow} />
          )}
          {max !== undefined ? (
            <Text
              testID={testID ? `${testID}-count` : undefined}
              variant="caption"
              tone={over ? 'danger' : 'textMuted'}
              accessibilityLabel={`${typed.length} of ${max} characters`}
              style={{ fontSize: multilineMetrics.counter }}
            >
              {`${typed.length} / ${max}`}
            </Text>
          ) : null}
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
  messageGrow: { flex: 1 },
  toneMessage: { gap: toneMetrics.iconGap },
  toneText: { ...font(toneMetrics.weight), lineHeight: canvasNormalLineHeight(type.size.caption) },
  pickBox: { gap: pickMetrics.between },
  pickValue: { flex: 1, fontSize: fieldMetrics.value },
  multilineBox: { height: undefined, minHeight: multilineMetrics.minHeight, alignItems: 'flex-start', paddingVertical: multilineMetrics.padV },
  multilineInput: {
    ...font(400),
    fontSize: multilineMetrics.fontSize,
    lineHeight: multilineMetrics.fontSize * multilineMetrics.leading,
    padding: 0,
    textAlignVertical: 'top',
  },
});
