import { useMemo, useState, type Ref } from 'react';
import { Pressable, StyleSheet, type TextInput, type TextInputProps } from 'react-native';

import { font, layout, space, useWawu } from '@/theme';

import { CountryPicker, type PickerItem } from './CountryPicker';
import { useFocusRing } from './focusRing';
import { Icon } from './icon';
import { Text } from './Text';
import { TextField } from './TextField';

/** One country the field can dial from: the Hub's list, with only what the field draws. */
export type DialCountry = {
  code: string;
  name: string;
  flag: string;
  /** "+234". Countries with no calling code are not offered. */
  dialCode: string | null;
  /** A real number as people write it at home ("0802 123 4567"): the box's placeholder. */
  exampleNational?: string | null;
};

export type PhoneFieldProps = {
  /** The Hub's countries. Undefined while they load. */
  countries: readonly DialCountry[] | undefined;
  /** The list could not be read. */
  failed?: boolean;
  onRetry?: () => void;
  /** The country dialled from, ISO alpha-2. */
  country: string | null;
  onCountry: (code: string) => void;
  /** The number as the field shows it, in the country's own grouping. */
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  hint?: string;
  error?: string;
  invalid?: boolean;
  disabled?: boolean;
  inputRef?: Ref<TextInput>;
  testID?: string;
} & Pick<TextInputProps, 'onFocus' | 'onSubmitEditing' | 'returnKeyType' | 'submitBehavior' | 'autoComplete' | 'textContentType'>;

/**
 * The one phone field (GEO-03, R-85): a country button (flag and calling code, opening a searchable list of every country the
 * Hub serves) beside the number. The number is shown in the chosen country's format; the screen reads it with `readPhone`
 * and sends it in full international form. Built on `TextField`, so it looks and behaves like the fields around it.
 */
export function PhoneField({
  countries,
  failed,
  onRetry,
  country,
  onCountry,
  value,
  onChangeText,
  label = 'Phone number',
  hint,
  error,
  invalid,
  disabled,
  inputRef,
  testID = 'phone-field',
  ...input
}: PhoneFieldProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const [open, setOpen] = useState(false);
  const dialable = useMemo(() => (countries ?? []).filter((c) => c.dialCode), [countries]);
  const chosen = dialable.find((c) => c.code === country) ?? null;
  const items: PickerItem[] | undefined = useMemo(
    () => (countries ? dialable.map((c) => ({ code: c.code, name: c.name, flag: c.flag, note: c.dialCode })) : undefined),
    [countries, dialable],
  );

  const button = (
    <Pressable
      testID={`${testID}-country`}
      accessibilityRole="button"
      accessibilityLabel={chosen ? `Country code, ${chosen.name} ${chosen.dialCode}` : 'Country code, choose a country'}
      accessibilityHint="Opens the list of countries"
      disabled={disabled}
      hitSlop={layout.tapMin / 4}
      onPress={() => setOpen(true)}
      {...ring.handlers}
      style={[styles.button, ring.style]}
    >
      <Text style={styles.flag} accessibilityElementsHidden importantForAccessibility="no">
        {chosen?.flag ?? ''}
      </Text>
      <Text variant="body" style={[font(500), styles.dial]} tone={chosen ? 'textPrimary' : 'textMuted'}>
        {chosen?.dialCode ?? 'Code'}
      </Text>
      <Icon name="ChevronDown" size={16} color={colors.textMuted} />
    </Pressable>
  );

  return (
    <>
      <TextField
        {...input}
        label={label}
        testID={testID}
        inputRef={inputRef}
        leading={button}
        value={value}
        onChangeText={onChangeText}
        placeholder={chosen?.exampleNational ?? undefined}
        hint={hint}
        error={error}
        invalid={invalid}
        disabled={disabled}
        keyboardType="phone-pad"
        autoCorrect={false}
        autoComplete={input.autoComplete ?? 'tel'}
        textContentType={input.textContentType ?? 'telephoneNumber'}
      />
      <CountryPicker
        visible={open}
        onClose={() => setOpen(false)}
        title="Choose a country"
        searchLabel="Search countries or codes"
        items={items}
        selected={country}
        failed={failed}
        onRetry={onRetry}
        testID={`${testID}-sheet`}
        onPick={(code) => {
          setOpen(false);
          onCountry(code);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: layout.tapMin, justifyContent: 'center' },
  flag: { fontSize: 20, lineHeight: 24 },
  dial: { fontSize: 15.5 },
});
