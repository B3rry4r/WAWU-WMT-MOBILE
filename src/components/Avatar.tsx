import { Image } from 'expo-image';
import { StyleSheet, Text as NativeText, View, type StyleProp, type ViewStyle } from 'react-native';

import { font, useWawu, type ColorToken } from '@/theme';

import { APP_NAME, BrandMark } from './BrandMark';

type HueToken = Extract<ColorToken, `hue${string}`>;
/** The design's avatar palette, read from the `--hue-*` tokens: 'lilac', 'coral', ... */
export type AvatarHue = HueToken extends `hue${infer Name}` ? Uncapitalize<Name> : never;

const hueToken = (hue: AvatarHue) => `hue${hue.charAt(0).toUpperCase()}${hue.slice(1)}` as HueToken;

/** Every hue an avatar can take, in token order. */
export const hues: readonly AvatarHue[] = ['lilac', 'lemon', 'green', 'sky', 'pink', 'coral', 'sand'];

/** design/_gen/kit.js line 17, `Av`: `s = 44`, initials at `Math.round(s * 0.36)`, 700, `letter-spacing:-0.02em`. */
const defaultSize = 44;
const initialsScale = 0.36;
const initialsTracking = -0.02;
/** kit.js line 17: an avatar with no name shows "W". */
const fallbackInitials = 'W';
/**
 * inbox.js line 8, `wawuAv`: the app's own avatar is its mark on the sunken surface,
 * 30 wide in a 52 circle. R-37 swaps the WAWU icon for the Who Made This submark.
 */
const brandScale = 30 / 52;

/** Up to two initials, "AN" for "Amaka Nwosu"; "W" when there is no name. */
export function initialsOf(name?: string): string {
  const letters = (name ?? '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
  return letters || fallbackInitials;
}

export type AvatarProps = {
  /** The person's name; the initials and the screen-reader label come from it. */
  name?: string;
  hue?: AvatarHue;
  size?: number;
  /** A photo, as a URL or a bundled image. Without one the avatar shows the initials on its hue. */
  source?: string | number;
  /** Inside a row that already says the name, the avatar adds nothing for a screen reader. */
  decorative?: boolean;
  /** The app's own avatar (system messages, R-37): the submark on the sunken surface, no hue or initials. */
  brand?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** A person's circle: their photo, or their initials on a hue (kit `Av`). */
export function Avatar({ name, hue = 'lilac', size = defaultSize, source, decorative = false, brand = false, style, testID }: AvatarProps) {
  const { colors } = useWawu();
  const fontSize = Math.round(size * initialsScale);
  const a11y = decorative
    ? // react-native-web reads only `aria-hidden`; the two native props hide it on iOS and Android.
      ({ 'aria-hidden': true, accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' } as const)
    : ({ accessible: true, accessibilityRole: 'image', accessibilityLabel: name ?? APP_NAME } as const);

  return (
    <View
      testID={testID}
      {...a11y}
      style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: brand ? colors.surfaceSunken : colors[hueToken(hue)] }, style]}
    >
      {brand ? (
        <BrandMark width={Math.round(size * brandScale)} decorative testID={testID ? `${testID}-brand` : undefined} />
      ) : source ? (
        <Image
          testID={testID ? `${testID}-image` : undefined}
          source={typeof source === 'string' ? { uri: source } : source}
          contentFit="cover"
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <NativeText
          style={[font(700), { fontSize, letterSpacing: initialsTracking * fontSize, color: colors.textOnLight }]}
          numberOfLines={1}
        >
          {initialsOf(name)}
        </NativeText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
});
