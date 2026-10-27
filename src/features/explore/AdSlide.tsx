import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Text } from '@/components/Text';
import { adOpensSomething, type AdCard } from '@/features/ads/api';
import { adInk, adMetrics, shadeAt } from '@/features/ads/look';
import { exploreEventMetrics as ev } from '@/features/events/ExploreEvents';
import { canvasNormalLineHeight, font, radius, useWawu } from '@/theme';
import { darkColors } from '@/theme/tokens.generated';

/**
 * X1 and X17's advert slide (design/_gen/explore.js `adHero`): the same 196 high card at corner 24 as the event slide, the
 * advertiser's picture under a fade (the page colour at 88% along the bottom, 5% from 65% of the way up), the SPONSORED chip
 * 14 in from the top left, and the words 16 in from the sides and 14 up: the headline 20 bold, the line under it 12.5 at 80%,
 * 3 apart. The whole card opens what it is for. Every word but SPONSORED is the advertiser's, from the Hub (R-68). A card that does
 * nothing (R-92, `none`) is the same card with nothing pressable on it, and a screen reader reads it as an ad, not as a button.
 */
export const adSlideMetrics = {
  fadeStrong: 0.88,
  fadeWeak: 0.05,
  /** The fade turns weak 65% of the way up, which is 35% of the way down. */
  fadeTurn: 0.35,
  chipTop: 14,
  chipLeft: 14,
  chipHeight: 26,
  chipPadX: 10,
  chipWords: 11.5,
  chipTracking: 0.06,
  chipFill: 0.2,
  wordsInset: 16,
  wordsBottom: 14,
  headline: 20,
  headlineTracking: -0.02,
  subline: 12.5,
  sublineOpacity: 0.8,
  sublineTop: 3,
  /** The gap between the words and the dots at their right. */
  dotsGap: 10,
  /** The button word on a white pill at the bottom right (Today's slot draws it; the slider's slide does not): 13 at 700 on a 32 high pill, 14 in. */
  pillGap: 10,
} as const;

const m = adSlideMetrics;
const chipFill = darkColors.surfaceGlass.replace(/[\d.]+\)$/, `${m.chipFill})`);

export type AdSlideProps = {
  ad: AdCard;
  /** Opens what the card is for (its web link, or its event). Never called for a card that does nothing. */
  onOpen: () => void;
  /**
   * Draw the campaign's button word on a white pill at the bottom right of the words. Today's slot does (R-92: the Today
   * strip is this same card at this same size, so it is built from this component); the Explore slider's slide does not.
   * A card that does nothing never has one, whatever this says.
   */
  button?: boolean;
  /** The picture is on screen: Today tells the Hub the card was viewed only from here. */
  onPictureLoad?: () => void;
  /** The picture would not load: Today then draws nothing at all, never a card with a bare ground. */
  onPictureError?: () => void;
  /** The width the slider's dots take at the right of the words, so a long headline stops short of them. */
  reserveRight?: number;
  testID?: string;
};

export function AdSlide({ ad, onOpen, button = false, onPictureLoad, onPictureError, reserveRight = 0, testID = 'explore-ad' }: AdSlideProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const said = `Sponsored. ${ad.headline}.${ad.subline ? ` ${ad.subline}.` : ''}`;
  const body = (
    <>
      <Image
        testID={`${testID}-artwork`}
        source={ad.artworkUrl}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        accessibilityElementsHidden
        onLoad={onPictureLoad}
        onError={onPictureError}
      />
      <LinearGradient
        testID={`${testID}-shade`}
        pointerEvents="none"
        colors={[shadeAt(m.fadeWeak), shadeAt(m.fadeWeak), shadeAt(m.fadeStrong)]}
        locations={[0, m.fadeTurn, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.chip}>
        <Text variant="body" style={[font(700), styles.chipWords]}>
          SPONSORED
        </Text>
      </View>
      <View style={[styles.words, reserveRight ? { paddingRight: reserveRight } : null]}>
        <View style={styles.text}>
          <Text testID={`${testID}-headline`} variant="body" numberOfLines={2} style={[font(700), styles.headline]}>
            {ad.headline}
          </Text>
          {ad.subline ? (
            <Text testID={`${testID}-subline`} variant="body" numberOfLines={2} style={styles.subline}>
              {ad.subline}
            </Text>
          ) : null}
        </View>
        {button && ad.ctaDestination !== 'none' ? (
          <View testID={`${testID}-button`} style={styles.pill}>
            <Text testID={`${testID}-cta`} variant="body" numberOfLines={1} style={[font(700), styles.pillWords]}>
              {ad.ctaLabel}
            </Text>
          </View>
        ) : null}
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
  card: { height: ev.heroHeight, borderRadius: ev.heroCorner, overflow: 'hidden' },
  chip: {
    position: 'absolute',
    top: m.chipTop,
    left: m.chipLeft,
    height: m.chipHeight,
    paddingHorizontal: m.chipPadX,
    borderRadius: radius.chip,
    backgroundColor: chipFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipWords: { fontSize: m.chipWords, lineHeight: canvasNormalLineHeight(m.chipWords), letterSpacing: m.chipTracking * m.chipWords, color: adInk },
  words: { position: 'absolute', left: m.wordsInset, right: m.wordsInset, bottom: m.wordsBottom, flexDirection: 'row', alignItems: 'flex-end', gap: m.pillGap },
  text: { flex: 1, minWidth: 0 },
  pill: {
    height: adMetrics.slotButtonHeight,
    paddingHorizontal: adMetrics.slotButtonPadX,
    borderRadius: radius.button,
    backgroundColor: adInk,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
    maxWidth: '45%',
  },
  pillWords: { fontSize: adMetrics.slotButton, lineHeight: canvasNormalLineHeight(adMetrics.slotButton), color: darkColors.textOnLight },
  headline: { fontSize: m.headline, lineHeight: canvasNormalLineHeight(m.headline), letterSpacing: m.headlineTracking * m.headline, color: adInk },
  subline: { fontSize: m.subline, lineHeight: canvasNormalLineHeight(m.subline), marginTop: m.sublineTop, opacity: m.sublineOpacity, color: adInk },
});
