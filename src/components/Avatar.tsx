import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { font, useWawu, type ColorToken } from '@/theme';

import { Text } from './Text';

export type AvatarHue = 'lilac' | 'lemon' | 'green' | 'sky' | 'pink' | 'coral' | 'sand';

const hueToken: Record<AvatarHue, ColorToken> = {
  lilac: 'hueLilac',
  lemon: 'hueLemon',
  green: 'hueGreen',
  sky: 'hueSky',
  pink: 'huePink',
  coral: 'hueCoral',
  sand: 'hueSand',
};

/** The design draws initials at 36% of the circle, tracked -0.02em (design/_gen/kit.js `Av`). */
const initialsScale = 0.36;
const initialsTracking = -0.02;

/** Up to two initials, "AN" for "Amaka Nwosu"; "W" when there is no name. */
export function initialsOf(name?: string): string {
  const letters = (name ?? '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
  return letters || 'W';
}

export type AvatarProps = {
  name?: string;
  hue?: AvatarHue;
  size?: number;
  /** A photo. Without one the avatar shows the initials on its hue. */
  source?: string;
  /** Inside a row that already says the name, the avatar adds nothing for a screen reader. */
  decorative?: boolean;
  testID?: string;
};

/** A person's circle: their photo, or their initials on a colour. */
export function Avatar({ name, hue = 'lilac', size = 44, source, decorative = false, testID }: AvatarProps) {
  const { colors } = useWawu();
  const hidden = decorative
    ? ({ accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' } as const)
    : ({ accessible: true, accessibilityRole: 'image', accessibilityLabel: name ?? 'WAWU' } as const);
  return (
    <View
      testID={testID}
      {...hidden}
      style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors[hueToken[hue]] }]}
    >
      {source ? (
        <Image source={{ uri: source }} style={{ width: size, height: size }} contentFit="cover" />
      ) : (
        <Text
          variant="body"
          tone="textOnLight"
          style={[font(700), { fontSize: Math.round(size * initialsScale), letterSpacing: initialsTracking * size * initialsScale, lineHeight: size }]}
        >
          {initialsOf(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
});
