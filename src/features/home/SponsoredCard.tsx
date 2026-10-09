import { Pressable, StyleSheet, Text, View } from 'react-native';

import { pressScale } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { unbuilt } from '@/lib/unbuilt';
import { radius, useWawu } from '@/theme';

import { todayMetrics as m, todayWords } from './look';
import { NeutralFrame } from './parts';

/**
 * H36's sponsored card, in TGIF's place on Today when TGIF is off (design/_gen/home.js `adSlot`): 104 high at the card
 * corner on the card colour with a hairline, a 104 wide picture, then SPONSORED over the campaign's words and its button.
 *
 * Serving a campaign into it (and counting each view and tap) is ADS-01's. Until that is built no campaign is served, so
 * the card is drawn as the empty slot: the picture is the neutral frame, the SPONSORED kicker stays, and there is no
 * advertiser, headline, line or button, because each is the campaign's own words. The card is drawn as one entry that
 * opens nothing (its destination is the campaign's event, E2): ADS-01 wires it.
 */
export function SponsoredCard() {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID="today-sponsored"
      accessibilityRole="button"
      accessibilityLabel="Sponsored"
      onPress={unbuilt('ADS-01')}
      {...ring.handlers}
      style={({ pressed }) => [styles.card, { backgroundColor: colors.surfaceCard, transform: [{ scale: pressed ? pressScale : 1 }] }, ring.style]}
    >
      <NeutralFrame icon="Image" style={styles.picture} />
      <View style={styles.words}>
        <Text style={[todayWords.adKicker, { color: colors.textMuted }]}>SPONSORED</Text>
      </View>
      <View pointerEvents="none" style={[styles.edge, { borderColor: colors.borderHairline }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { height: m.adHeight, borderRadius: radius.card, overflow: 'hidden', flexDirection: 'row' },
  picture: { width: m.adPicture, alignSelf: 'stretch' },
  words: { flex: 1, minWidth: 0, justifyContent: 'center', gap: m.adGap, paddingVertical: m.adPadY, paddingHorizontal: m.adPadX },
  edge: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth },
});
