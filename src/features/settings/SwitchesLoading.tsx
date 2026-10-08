import { StyleSheet, View } from 'react-native';

import { LoadingView, Skeleton } from '@/components/Skeleton';
import { radius, space } from '@/theme';

import { switchRowMetrics } from './SwitchRow';

/** One card's worth of switches, as high as that many `SwitchRow`s, plus the label above it. */
const LABEL_H = 14;
const LABEL_W = '30%';

export type SwitchesLoadingProps = {
  /** How many switches each card holds, in the order Z3 or Z4 draws them. */
  cards: readonly number[];
  testID: string;
};

/** What Z3 and Z4 show while their settings are on the way: the cards, empty, where the switches will be. */
export function SwitchesLoading({ cards, testID }: SwitchesLoadingProps) {
  return (
    <LoadingView testID={testID}>
      <View style={styles.cards}>
        {cards.map((count, i) => (
          <View key={i} style={styles.card}>
            <Skeleton width={LABEL_W} height={LABEL_H} radius={radius.chip} />
            <Skeleton height={count * switchRowMetrics.minHeight} radius={radius.card} />
          </View>
        ))}
      </View>
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  cards: { gap: space.lg },
  card: { gap: space.sm },
});
