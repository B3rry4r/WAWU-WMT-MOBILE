import { Image } from 'expo-image';
import { StyleSheet, Text as NativeText, View, type StyleProp, type ViewStyle } from 'react-native';

import { font, useWawu, type ColorToken } from '@/theme';

type HueToken = Extract<ColorToken, `hue${string}`>;
/** The design's avatar palette, read from the `--hue-*` tokens: 'lilac', 'coral', ... */
export type Hue = HueToken extends `hue${infer Name}` ? Uncapitalize<Name> : never;

const hueToken = (hue: Hue) => `hue${hue.charAt(0).toUpperCase()}${hue.slice(1)}` as HueToken;

/** Every hue an avatar can take, in token order. */
export const hues: readonly Hue[] = ['lilac', 'lemon', 'green', 'sky', 'pink', 'coral', 'sand'];

/** design/_gen/kit.js line 17, `Av`: `s = 44`, initials at `Math.round(s * 0.36)`, 700, `letter-spacing:-0.02em`. */
const defaultSize = 44;
const initialsScale = 0.36;
const initialsTracking = -0.02;
/** kit.js line 17: an avatar with no name shows "W". */
const fallbackInitials = 'W';

/** The first letters of up to two words, as the kit's `Av` takes them: "Chidinma Okoro" is "CO". */
export function initials(name?: string): string {
  const words = (name ?? '').split(' ').filter(Boolean);
  return words.length ? words.map((w) => w.charAt(0)).slice(0, 2).join('') : fallbackInitials;
}

export type AvatarProps = {
  /** The person's name; the initials come from it. */
  name?: string;
  hue?: Hue;
  size?: number;
  /** A photo, as a URL or a bundled image. Drawn over the hue, cropped to fill the circle. */
  src?: string | number;
  /**
   * What a screen reader says. Most avatars sit beside the name already, so
   * they are hidden by default; give a label when the avatar stands alone.
   */
  label?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** A person or business: a photo, or their initials on a hue circle (kit `Av`). */
export function Avatar({ name, hue = 'lilac', size = defaultSize, src, label, style, testID }: AvatarProps) {
  const { colors } = useWawu();
  const fontSize = Math.round(size * initialsScale);
  const a11y = label
    ? ({ accessible: true, accessibilityRole: 'image', accessibilityLabel: label } as const)
    : ({ accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' } as const);

  return (
    <View
      testID={testID}
      {...a11y}
      style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors[hueToken(hue)] }, style]}
    >
      {src ? (
        <Image testID={testID ? `${testID}-image` : undefined} source={typeof src === 'string' ? { uri: src } : src} contentFit="cover" style={StyleSheet.absoluteFill} />
      ) : (
        <NativeText
          style={[font(700), { fontSize, letterSpacing: initialsTracking * fontSize, color: colors.textOnLight }]}
          numberOfLines={1}
        >
          {initials(name)}
        </NativeText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
});
