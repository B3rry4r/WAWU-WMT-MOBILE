import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { canvasNormalLineHeight, layout, radius, space } from '@/theme';

import type { AdCard } from './api';
import { adMetrics, adWords, chipFill, shadeAt } from './look';

export type SponsoredBackdropProps = {
  ad: AdCard;
  /** The picture would not load: the reader leaves this card out rather than show a bare dark ground. */
  onFail?: () => void;
};

/**
 * H33's picture: the advertiser's artwork over the whole card, under the shade that keeps the words readable. Every
 * card has artwork (R-59), so there is no picture-less layout.
 */
export function SponsoredBackdrop({ ad, onFail }: SponsoredBackdropProps) {
  const { colors, locations } = adMetrics.shade;
  return (
    <View testID="sponsored-backdrop" pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image
        testID="sponsored-artwork"
        source={ad.artworkUrl}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        accessibilityElementsHidden
        onError={onFail}
      />
      <LinearGradient
        testID="sponsored-shade"
        colors={colors.map(shadeAt) as unknown as readonly [string, string, ...string[]]}
        locations={locations as unknown as readonly [number, number, ...number[]]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

export type SponsoredStepProps = {
  ad: AdCard;
  /** The button: opens what the card is for (its event). */
  onOpen: () => void;
  /** Skip: on to the next card. */
  onSkip: () => void;
  /** The room the phone keeps clear at the bottom (the home bar). */
  bottomInset: number;
};

/**
 * H33 · The sponsored card in the TGIF reader, before the takeaway: SPONSORED, the headline, the line under it, the
 * button and Skip. Every word but SPONSORED and Skip is the advertiser's, from `GET /ads`. Nothing else on the card
 * moves on: a tap outside the button or Skip does nothing, so the card is never skipped by accident.
 */
export function SponsoredStep({ ad, onOpen, onSkip, bottomInset }: SponsoredStepProps) {
  return (
    <View
      testID="sponsored-step"
      style={[styles.step, { paddingBottom: Math.max(adMetrics.stepPadBottom, bottomInset + space.lg) }]}
    >
      <View style={styles.chip}>
        <Text style={adWords.chip}>SPONSORED</Text>
      </View>
      <Text testID="sponsored-headline" accessibilityRole="header" style={adWords.headline}>
        {ad.headline}
      </Text>
      {ad.subline ? (
        <Text testID="sponsored-subline" style={adWords.subline}>
          {ad.subline}
        </Text>
      ) : null}
      <Button testID="sponsored-cta" label={ad.ctaLabel} variant="white" size="lg" full onPress={onOpen} />
      <View style={styles.row}>
        <Pressable testID="sponsored-skip" accessibilityRole="button" accessibilityLabel="Skip" onPress={onSkip} hitSlop={skipSlop}>
          <Text style={adWords.skip}>{'Skip ›'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** The canvas's Skip is one 13 line high; the phone's minimum tap size is reached by reaching past it, so the stack keeps the canvas's spacing. */
const skipSlop = {
  top: Math.ceil((layout.tapMin - canvasNormalLineHeight(adMetrics.skip)) / 2),
  bottom: Math.ceil((layout.tapMin - canvasNormalLineHeight(adMetrics.skip)) / 2),
  left: space.xl,
  right: space.sm,
};

const styles = StyleSheet.create({
  step: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: adMetrics.stepGap,
    paddingHorizontal: adMetrics.stepPadX,
  },
  chip: {
    alignSelf: 'flex-start',
    height: adMetrics.chipHeight,
    paddingHorizontal: adMetrics.chipPadX,
    borderRadius: radius.chip,
    backgroundColor: chipFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', justifyContent: 'flex-end' },
});
