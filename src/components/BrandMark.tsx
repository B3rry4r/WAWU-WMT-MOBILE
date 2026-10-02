import { Image } from 'expo-image';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useWawu } from '@/theme';

/** The app's name as a person reads it (R-37). The logo spells it in capitals; the text does not. */
export const APP_NAME = 'Who Made This';

export type BrandLayout = 'horizontal' | 'vertical' | 'submark';

/**
 * The owner's brand pack (R-37, 2 Oct 2026), trimmed to the artwork, in
 * `assets/brand/` with the source SVGs beside them. Light surfaces take the ink
 * artwork; dark surfaces take the white one, which keeps the purple dot. The
 * submark has its own fill, so dark surfaces take the sticker cut (white keyline).
 */
const art = {
  horizontal: {
    light: require('../../assets/brand/horizontal-ink.png') as number,
    dark: require('../../assets/brand/horizontal-white.png') as number,
    /** 1009 x 295 px */
    ratio: 1009 / 295,
  },
  vertical: {
    light: require('../../assets/brand/vertical-ink.png') as number,
    dark: require('../../assets/brand/vertical-white.png') as number,
    /** 784 x 853 px */
    ratio: 784 / 853,
  },
  submark: {
    light: require('../../assets/brand/submark.png') as number,
    dark: require('../../assets/brand/submark-sticker.png') as number,
    /** 1009 x 1100 px; the sticker is 1049 x 1140, the same shape plus its keyline. */
    ratio: 1009 / 1100,
  },
} as const;

export type BrandMarkProps = {
  /** Which lockup. The canvas's square WAWU icon becomes the submark (R-37). */
  layout?: BrandLayout;
  /** Drawn width in points; the height follows the artwork. */
  width: number;
  /**
   * Force a surface when the mark sits on something other than the page, for
   * example the white receipt in either theme. Defaults to the current theme.
   */
  surface?: 'light' | 'dark';
  /** A mark beside the app's name in text is decorative; one standing alone is not. */
  decorative?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** The Who Made This logo (R-37). Every place the canvas draws a WAWU logo or icon uses this. */
export function BrandMark({ layout = 'submark', width, surface, decorative = false, style, testID }: BrandMarkProps) {
  const { dark } = useWawu();
  const tone = surface ?? (dark ? 'dark' : 'light');
  const pick = art[layout];
  const height = width / pick.ratio;

  return (
    <View
      style={[{ width, height }, style]}
      testID={testID}
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : 'image'}
      accessibilityLabel={decorative ? undefined : APP_NAME}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'yes'}
    >
      <Image source={pick[tone]} style={{ width, height }} contentFit="contain" accessible={false} testID={testID ? `${testID}-art` : undefined} />
    </View>
  );
}
