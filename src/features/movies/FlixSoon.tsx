import { Pressable, StyleSheet } from 'react-native';

import { Banner } from '@/components/Banner';
import { useFocusRing } from '@/components/focusRing';
import { radius } from '@/theme';

import type { MoviesHome } from './api';

/** The words of the "not live yet" state (R-77), the same two lines on the movies screen and on the rail's card. */
export const SOON_TITLE = "Flix movies aren't switched on yet";
export const SOON_LINE = "You'll be able to watch movies here soon.";

/** True when the Hub answers `enabled: false` with `soon: true` (`MOVIE_PARTNER=soon`): movies stay drawn, as "not live yet". `enabled: false` alone still hides them. */
export function isSoon(home: Pick<MoviesHome, 'enabled' | 'soon'> | undefined): boolean {
  return home?.enabled === false && home.soon === true;
}

/** S13's note, the shared info Banner (a Clock, the title, the line): what the movies screen shows in place of the catalog. */
export function FlixSoonNote({ testID = 'flix-soon' }: { testID?: string }) {
  return <Banner tone="info" title={SOON_TITLE} body={SOON_LINE} testID={testID} />;
}

/** The same note as the rail's one card: it opens the movies screen. */
export function FlixSoonCard({ onPress, testID = 'flix-soon-card' }: { onPress: () => void; testID?: string }) {
  const ring = useFocusRing();
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={`${SOON_TITLE}. ${SOON_LINE}`} onPress={onPress} {...ring.handlers} style={[styles.card, ring.style]}>
      <FlixSoonNote testID={`${testID}-note`} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.tile },
});
