import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Text } from '@/components/Text';
import { adOpensSomething, type AdCard } from '@/features/ads/api';
import { adInk, shadeAt } from '@/features/ads/look';
import { exploreEventMetrics as ev } from '@/features/events/ExploreEvents';
import { canvasNormalLineHeight, font, radius, useWawu } from '@/theme';

/**
 * The advert card on Explore's slider and on Today (R-116, owner, 31 Oct 2026: "the ads on the app both explore and home should
 * be reduced to this orientation", with his 1350 x 400 banner). It replaces R-92's 196 high landscape card at both places: the
 * card is the banner's own shape, 27 by 8, at the full width the screen gives it, and it shows the WHOLE picture (`contain` on the
 * exact shape, so nothing is cropped). The banners carry their own title, steps and button painted in, so the app draws the
 * picture and only the small SPONSORED chip in the top right corner (the top left is where the banners paint their logo). The
 * headline and the line are not drawn over the art; they are the card's accessibility label. The chip is a dark chip (the page
 * colour at 55%, white words), because the picture under it may be light or dark.
 *
 * The whole card opens what it is for (R-92). A `link` card has no drawn pill: the painted button is the call. A card that does
 * nothing (`none`) is the same card with nothing pressable on it, and a screen reader reads it as an ad, not as a button.
 * The TGIF reader's card is the tall portrait and is not this component (R-92 stands there).
 */
export const adSlideMetrics = {
  /** The owner's banner: 1350 x 400, which is 27 by 8. The card is this shape at whatever width it is given. */
  bannerWidth: 1350,
  bannerHeight: 400,
  chipTop: 6,
  chipRight: 6,
  chipHeight: 18,
  chipPadX: 6,
  chipWords: 9,
  chipTracking: 0.06,
  /** The chip's ground: the page colour at this strength, so white words read on a light picture and on a dark one. */
  chipFill: 0.55,
} as const;

const m = adSlideMetrics;

/** The card's height at a width: the banner's own shape (R-116). */
export const adSlideHeight = (width: number) => (width * m.bannerHeight) / m.bannerWidth;

export type AdSlideProps = {
  ad: AdCard;
  /** Opens what the card is for (its web link, or its event). Never called for a card that does nothing. */
  onOpen: () => void;
  /** The picture is on screen: Today tells the Hub the card was viewed only from here. */
  onPictureLoad?: () => void;
  /** The picture would not load: Today then draws nothing at all, never a card with a bare ground. */
  onPictureError?: () => void;
  testID?: string;
};

export function AdSlide({ ad, onOpen, onPictureLoad, onPictureError, testID = 'explore-ad' }: AdSlideProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const said = `Sponsored. ${ad.headline}.${ad.subline ? ` ${ad.subline}.` : ''}`;
  const body = (
    <>
      <Image
        testID={`${testID}-artwork`}
        source={ad.artworkUrl}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        accessibilityElementsHidden
        onLoad={onPictureLoad}
        onError={onPictureError}
      />
      <View style={styles.chip}>
        <Text variant="body" style={[font(700), styles.chipWords]}>
          SPONSORED
        </Text>
      </View>
    </>
  );
  if (!adOpensSomething(ad)) {
    return (
      <View testID={testID} accessible accessibilityLabel={said} style={[styles.card, { backgroundColor: colors.surfaceCardInk }]}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${said}${ad.ctaDestination !== 'none' ? ` ${ad.ctaLabel}` : ''}`}
      onPress={onOpen}
      {...ring.handlers}
      style={[styles.card, { backgroundColor: colors.surfaceCardInk }, ring.style]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { aspectRatio: m.bannerWidth / m.bannerHeight, borderRadius: ev.heroCorner, overflow: 'hidden' },
  chip: {
    position: 'absolute',
    top: m.chipTop,
    right: m.chipRight,
    height: m.chipHeight,
    paddingHorizontal: m.chipPadX,
    borderRadius: radius.chip,
    backgroundColor: shadeAt(m.chipFill),
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipWords: { fontSize: m.chipWords, lineHeight: canvasNormalLineHeight(m.chipWords), letterSpacing: m.chipTracking * m.chipWords, color: adInk },
});
