import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { pressScale } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { radius } from '@/theme';

import type { AdCard } from './api';
import { adInk, adMetrics as m, adWords, shadeAt, slotChipFill } from './look';

export type SponsoredSlotProps = {
  ad: AdCard;
  /** The whole card opens what it is for (its event). */
  onOpen: () => void;
  /** The picture is on screen: Today tells the Hub the card was viewed only from here, never for a card whose picture failed (SWEEP-APP row 62/106). */
  onPictureLoad?: () => void;
};

/**
 * H1 and H36 · The ad card on Today, always in TGIF's old place when the Hub serves a campaign (R-59): the artwork across the
 * whole card under a shade, the AD chip at the top left, the headline and the line under it at the bottom left and the
 * campaign's button word on a white pill at the bottom right. Every word but AD is the advertiser's, from `GET /ads`. The card
 * is dark in both themes (a picture under a shade, white words), as the board draws it. Every card has a picture (R-59): a
 * campaign without artwork is never served, so there is no picture-less layout. The board's three dots mean a rotation of
 * adverts; the Hub serves one card for the place, so no dots are drawn (R-47). The pill is the card's own button word, not a
 * second control: the whole card is the one button. A picture that will not load draws nothing at all, as a campaign without
 * artwork does (SWEEP-APP rows ADS-01 L5, DV2-01 L5), never a card with a bare ground.
 */
export function SponsoredSlot({ ad, onOpen, onPictureLoad }: SponsoredSlotProps) {
  const ring = useFocusRing();
  // The address that failed, so a new campaign with a new picture is tried again.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (failedUrl === ad.artworkUrl) return null;
  return (
    <Pressable
      testID="today-sponsored"
      accessibilityRole="button"
      accessibilityLabel={`Ad. ${ad.headline}.${ad.subline ? ` ${ad.subline}.` : ''} ${ad.ctaLabel}`}
      onPress={onOpen}
      {...ring.handlers}
      style={({ pressed }) => [styles.card, { transform: [{ scale: pressed ? pressScale : 1 }] }, ring.style]}
    >
      <Image
        testID="today-sponsored-artwork"
        source={ad.artworkUrl}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        accessibilityElementsHidden
        onLoad={onPictureLoad}
        onError={() => setFailedUrl(ad.artworkUrl)}
      />
      <LinearGradient
        testID="today-sponsored-shade"
        pointerEvents="none"
        colors={m.slotShade.colors.map(shadeAt) as unknown as readonly [string, string]}
        locations={m.slotShade.locations as unknown as readonly [number, number]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.chip}>
        <Text style={adWords.slotChip}>AD</Text>
      </View>
      <View style={styles.words}>
        <View style={styles.text}>
          <Text testID="today-sponsored-headline" numberOfLines={1} style={adWords.slotHeadline}>
            {ad.headline}
          </Text>
          {ad.subline ? (
            <Text testID="today-sponsored-subline" numberOfLines={2} style={[adWords.slotSubline, styles.subline]}>
              {ad.subline}
            </Text>
          ) : null}
        </View>
        <View testID="today-sponsored-button" style={styles.button}>
          <Text testID="today-sponsored-cta" numberOfLines={1} style={adWords.slotButton}>
            {ad.ctaLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: m.slotHeight,
    borderRadius: radius.card,
    overflow: 'hidden',
    paddingVertical: m.slotPadY,
    paddingHorizontal: m.slotPadX,
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  chip: {
    alignSelf: 'flex-start',
    height: m.slotChipHeight,
    paddingHorizontal: m.slotChipPadX,
    borderRadius: radius.chip,
    backgroundColor: slotChipFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  words: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: m.slotWordsGap },
  text: { flex: 1, minWidth: 0 },
  subline: { marginTop: m.slotSublineAbove },
  button: {
    height: m.slotButtonHeight,
    paddingHorizontal: m.slotButtonPadX,
    borderRadius: radius.button,
    backgroundColor: adInk,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
    maxWidth: '45%',
  },
});
