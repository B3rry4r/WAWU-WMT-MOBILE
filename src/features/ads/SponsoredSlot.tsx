import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { pressScale } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { radius, useWawu } from '@/theme';

import type { AdCard } from './api';
import { adMetrics as m, adWords } from './look';

export type SponsoredSlotProps = {
  ad: AdCard;
  /** The whole card opens what it is for (its event). */
  onOpen: () => void;
};

/**
 * H36 · The sponsored card on Today, in TGIF's place when TGIF is off: the artwork, SPONSORED, the headline, the line
 * under it, and the card's button word at the right. Every word but SPONSORED is the advertiser's, from `GET /ads`.
 * Every card has a picture (R-59): a campaign without artwork is never served, so there is no picture-less layout.
 */
export function SponsoredSlot({ ad, onOpen }: SponsoredSlotProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID="today-sponsored"
      accessibilityRole="button"
      accessibilityLabel={`Sponsored. ${ad.headline}.${ad.subline ? ` ${ad.subline}.` : ''} ${ad.ctaLabel}`}
      onPress={onOpen}
      {...ring.handlers}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surfaceCard, transform: [{ scale: pressed ? pressScale : 1 }] },
        ring.style,
      ]}
    >
      {/* The canvas's inset hairline sits under the picture and the words, so it is drawn first and they cover it. */}
      <View pointerEvents="none" style={[styles.hairline, { borderColor: colors.borderHairline }]} />
      <Image testID="today-sponsored-artwork" source={ad.artworkUrl} style={styles.art} contentFit="cover" accessibilityElementsHidden />
      <View style={styles.words}>
        <Text style={[adWords.slotLabel, { color: colors.textMuted }]}>SPONSORED</Text>
        <Text testID="today-sponsored-headline" numberOfLines={1} style={[adWords.slotHeadline, { color: colors.textPrimary }]}>
          {ad.headline}
        </Text>
        {ad.subline ? (
          <Text testID="today-sponsored-subline" numberOfLines={2} style={[adWords.slotSubline, { color: colors.textMuted }]}>
            {ad.subline}
          </Text>
        ) : null}
      </View>
      <Text testID="today-sponsored-cta" numberOfLines={1} style={[adWords.slotAction, styles.action, { color: colors.accentFg }]}>
        {ad.ctaLabel}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: m.slotHeight,
    borderRadius: radius.card,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'stretch',
    flexShrink: 0,
  },
  hairline: { ...StyleSheet.flatten(StyleSheet.absoluteFill), borderRadius: radius.card, borderWidth: 1 },
  art: { width: m.slotHeight },
  words: { flex: 1, minWidth: 0, paddingVertical: m.slotPadY, paddingHorizontal: m.slotPadX, justifyContent: 'center', gap: m.slotGap },
  action: { alignSelf: 'center', marginRight: m.slotActionRight, flexShrink: 1, maxWidth: '35%' },
});
