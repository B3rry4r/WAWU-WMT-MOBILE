import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PointsFigure, type PointsFigureProps } from '@/components/PointsFigure';
import { Text } from '@/components/Text';
import { LeaveDevRoute } from '@/features/shell/LeaveDevRoute';
import { layout, space, useWawu } from '@/theme';

/**
 * Development-only gallery of the points figure, for pictures beside PT5 (the balance and "When they end"), M19 (the Studio count)
 * and W1 (the Points tile): /preview/points-figure?state=<name>, or no state for every one. The counts are the brief's example
 * values, not balances: the app reads them from the Hub. Points are a count: nothing here is naira. A release build redirects home.
 */
const cases: Record<string, { props: PointsFigureProps; note: string }> = {
  hero: { props: { count: 1240, size: 'hero' }, note: 'Balance (PT5)' },
  zero: { props: { count: 0, size: 'hero' }, note: 'No points yet' },
  one: { props: { count: 1, size: 'hero' }, note: 'One point (singular)' },
  large: { props: { count: 1250000, size: 'hero' }, note: 'Commas in a long count' },
  row: { props: { count: 2750, size: 'row' }, note: 'A pack (PT4)' },
  line: { props: { count: 400, size: 'line' }, note: 'A lot in "When they end" (PT5)' },
  chip: { props: { count: 1250, size: 'chip' }, note: 'Studio card count (M19)' },
  tile: { props: { count: 1240, size: 'tile' }, note: 'Points tile (W1), the number alone' },
};

export default function PointsFigurePreview() {
  const { colors } = useWawu();
  const { state } = useLocalSearchParams<{ state?: string }>();
  if (!__DEV__) return <LeaveDevRoute />;

  const keys = state && cases[state] ? [state] : Object.keys(cases);
  return (
    <ScrollView style={{ backgroundColor: colors.surfacePage }} contentContainerStyle={styles.page}>
      {keys.map((key) => (
        <View key={key} style={styles.item}>
          <Text variant="meta">{cases[key].note}</Text>
          <PointsFigure {...cases[key].props} testID={`points-${key}`} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingTop: layout.tapMin * 2, paddingHorizontal: layout.gutter, paddingBottom: space.s3xl, gap: space.s2xl },
  item: { gap: space.sm },
});
