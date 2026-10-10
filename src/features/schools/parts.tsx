import { Image } from 'expo-image';
import { useState } from 'react';
import { Platform, StyleSheet, Text as NativeText, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

import { initialsOf } from '@/components/Avatar';
import { browserOutlineOff } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { hueFor } from '@/features/feed/model';
import { font, radius, useWawu, type ColorToken } from '@/theme';

/**
 * design/_gen/schools.js `sSearch`: a 46 high pill on the input colour with a 1 hairline ring, an 18 search glyph, 10 to
 * the words, 16 at the sides, the words 15 (the placeholder in the muted colour). Focused, the ring is the accent's 1.5
 * (`srch`'s focus state).
 */
export const searchMetrics = { height: 46, gap: 10, padH: 16, icon: 18, text: 15, ring: 1, focusRing: 1.5 } as const;

export type SearchPillProps = {
  value: string;
  /** The most characters the box takes (the Hub's limit on a search). */
  maxLength?: number;
  onChange: (text: string) => void;
  /** The search key on the keyboard. */
  onSubmit?: () => void;
  testID?: string;
};

/** SC1 and SC10's search box: "Search schools or courses". Typing and the clear are the person's; the screen decides what is sent. */
export function SearchPill({ value, maxLength, onChange, onSubmit, testID }: SearchPillProps) {
  const { colors } = useWawu();
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: colors.surfaceInput,
          boxShadow: [
            {
              offsetX: 0,
              offsetY: 0,
              blurRadius: 0,
              spreadDistance: focused ? searchMetrics.focusRing : searchMetrics.ring,
              color: focused ? colors.accent : colors.borderHairline,
              inset: true,
            },
          ],
        },
      ]}
    >
      <Icon name="Search" size={searchMetrics.icon} color={colors.textMuted} />
      <TextInput
        testID={testID}
        value={value}
        maxLength={maxLength}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search schools or courses"
        placeholderTextColor={colors.textMuted}
        accessibilityLabel="Search schools or courses"
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

export type SchoolLogoProps = {
  school: { id: string; name: string; logo: string | null };
  size: number;
  /** The rounded square's corner. */
  corner: number;
  /** The initials' size. */
  initials: number;
  /** The ring round it, in the colour the logo sits on (the card, or the page). It takes no room: the logo's box is `size`. */
  ring: { width: number; color: ColorToken };
  /** How far the logo is pulled up over what is above it (SC1's logo overlaps the picture). */
  rise?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * A school's logo as a rounded square (SC1 `sch`, SC2 `profile`): the picture the school uploaded, or its initials on a
 * colour that is always the same one for the same school. The shared `Avatar` is a circle; a `square` shape on it is
 * SHARED-CHANGES SCHOOLS-03 #1, and this stands in until it exists.
 */
export function SchoolLogo({ school, size, corner, initials, ring, rise = 0, style, testID }: SchoolLogoProps) {
  const { colors } = useWawu();
  const name = hueFor(school.id);
  const hue = `hue${name.charAt(0).toUpperCase()}${name.slice(1)}` as ColorToken;
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${school.name} logo`}
      style={[
        styles.ring,
        {
          borderRadius: corner + ring.width,
          padding: ring.width,
          marginTop: -(ring.width + rise),
          marginRight: -ring.width,
          marginBottom: -ring.width,
          marginLeft: -ring.width,
          backgroundColor: colors[ring.color],
        },
        style,
      ]}
    >
      <View style={[styles.logo, { width: size, height: size, borderRadius: corner, backgroundColor: colors[hue] }]}>
        {school.logo ? (
          <Image testID={testID ? `${testID}-image` : undefined} source={{ uri: school.logo }} contentFit="cover" style={StyleSheet.absoluteFill} />
        ) : (
          <NativeText numberOfLines={1} style={[font(800), { fontSize: initials, letterSpacing: -0.02 * initials, color: colors.textOnLight }]}>
            {initialsOf(school.name)}
          </NativeText>
        )}
      </View>
    </View>
  );
}

/**
 * The picture a school or a course has at the top of its card and page (SC1, SC2, SC3). The Hub serves no cover picture
 * (BACKEND_GAPS G-624), so a quiet block holds its place and the layout does not change when one is served.
 */
export function Cover({ height, style, testID }: { height: number; style?: StyleProp<ViewStyle>; testID?: string }) {
  const { colors } = useWawu();
  return <View testID={testID} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{ height, backgroundColor: colors.surfaceSunken }, style]} />;
}

const styles = StyleSheet.create({
  pill: { height: searchMetrics.height, flexDirection: 'row', alignItems: 'center', gap: searchMetrics.gap, paddingHorizontal: searchMetrics.padH, borderRadius: radius.chip, flexShrink: 0 },
  input: { flex: 1, minWidth: 0, fontSize: searchMetrics.text, paddingVertical: 0, ...font(400) },
  ring: { flexShrink: 0 },
  logo: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
