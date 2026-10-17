import { useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { browserOutlineOff } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { font, radius, useWawu } from '@/theme';

import { SEARCH_MAX } from './api';

/** design/_gen/kit.js `search`: a 50 high pill on the card colour with a 1 hairline ring, a 20 glyph, 10 to the words, 18 at the sides, the words 15.5. Focused, the ring is the accent's 1.5. */
export const searchMetrics = { height: 50, iconGap: 10, padH: 18, icon: 20, text: 15.5, ring: 1, focusRing: 1.5 } as const;

export type PurchaseSearchProps = { value: string; onChange: (text: string) => void; testID?: string };

/** M29's box: "Search what you've bought". Typing is the person's; the screen decides what is sent. */
export function PurchaseSearch({ value, onChange, testID }: PurchaseSearchProps) {
  const { colors } = useWawu();
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: colors.surfaceCard,
          boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: focused ? searchMetrics.focusRing : searchMetrics.ring, color: focused ? colors.accent : colors.borderHairline, inset: true }],
        },
      ]}
    >
      <Icon name="Search" size={searchMetrics.icon} color={colors.textMuted} />
      <TextInput
        testID={testID}
        value={value}
        maxLength={SEARCH_MAX}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search what you've bought"
        placeholderTextColor={colors.textMuted}
        accessibilityLabel="Search what you've bought"
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        selectionColor={colors.accent}
        cursorColor={colors.accent}
        style={[styles.input, Platform.OS === 'web' ? browserOutlineOff : null, { color: colors.textPrimary }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { height: searchMetrics.height, flexDirection: 'row', alignItems: 'center', gap: searchMetrics.iconGap, paddingHorizontal: searchMetrics.padH, borderRadius: radius.chip, flexShrink: 0 },
  input: { flex: 1, minWidth: 0, fontSize: searchMetrics.text, paddingVertical: 0, ...font(400) },
});
