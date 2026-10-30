import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { browserOutlineOff } from '@/components/focusRing';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, space, useWawu } from '@/theme';

import { clampText, countLine } from './voiceoverModel';

/** PT2's box (20 corner, 14 by 16 padding, 15 on 1.5, a 1.5 accent ring while it has focus and a 1 hairline after) as a labelled field, for the screens that have several: the Receptionist's set-up and the voice clone's name. No board draws them (R-29). */
const BOX = { radius: 20, padV: 14, padH: 16, font: 15, leading: 1.5, ringOn: 1.5, ringOff: 1, label: 11, tracking: 0.08, multiLine: 96 } as const;

export function FieldBox({
  label,
  value,
  onChange,
  max,
  multiline = false,
  placeholder,
  editable = true,
  testID,
  url = false,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  max?: number;
  multiline?: boolean;
  placeholder?: string;
  editable?: boolean;
  testID: string;
  /** A web address: no capital letters, no corrections, the address keyboard. */
  url?: boolean;
}) {
  const { colors } = useWawu();
  const [focused, setFocused] = useState(false);
  const ring = focused ? { width: BOX.ringOn, color: colors.accent } : { width: BOX.ringOff, color: colors.borderHairline };
  return (
    <View style={styles.wrap}>
      <Text variant="body" tone="textMuted" accessibilityRole="header" style={[font(700), { fontSize: BOX.label, letterSpacing: BOX.tracking * BOX.label, textTransform: 'uppercase' }]}>
        {label}
      </Text>
      <View style={[styles.box, multiline ? { minHeight: BOX.multiLine } : null, { backgroundColor: colors.surfaceInput, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: ring.width, color: ring.color, inset: true }] }]}>
        <TextInput
          testID={testID}
          accessibilityLabel={label}
          editable={editable}
          multiline={multiline}
          value={value}
          onChangeText={(next) => onChange(max ? clampText(next, max) : next)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...(url ? { autoCapitalize: 'none' as const, autoCorrect: false, keyboardType: 'url' as const } : {})}
          style={[styles.input, { color: colors.textPrimary }, font(400), browserOutlineOff]}
        />
      </View>
      {max ? (
        <Text variant="body" tone="textMuted" testID={`${testID}-count`} style={styles.count}>
          {countLine(Array.from(value).length, max)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  box: { borderRadius: BOX.radius, paddingVertical: BOX.padV, paddingHorizontal: BOX.padH },
  input: { fontSize: BOX.font, lineHeight: BOX.font * BOX.leading, padding: 0, margin: 0 },
  count: { fontSize: 12.5, lineHeight: canvasNormalLineHeight(12.5), textAlign: 'right' },
});
