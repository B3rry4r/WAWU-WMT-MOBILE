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
const cases: Record<string, { props: PointsFigureProps; note: string; width?: number }> = {
  hero: { props: { count: 1240, size: 'hero' }, note: 'Balance (PT5)' },
  zero: { props: { count: 0, size: 'hero' }, note: 'No points yet' },
  one: { props: { count: 1, size: 'hero' }, note: 'One point (singular)' },
  large: { props: { count: 1250000, size: 'hero' }, note: 'Commas in a long count' },
  row: { props: { count: 2750, size: 'row' }, note: 'A pack (PT4)' },
  line: { props: { count: 400, size: 'line' }, note: 'A lot in "When they end" (PT5)' },
  chip: { props: { count: 1250, size: 'chip' }, note: 'Studio card count (M19)' },
  tile: { props: { count: 1240, size: 'tile' }, note: 'Points tile (W1), the number alone' },
  ...fitCases(),
};

/**
 * A long balance in a narrow place: the 7, 9 and 12 digit counts in a parent 120, 150, 182 (PT5's column beside "Buy points" on a 360 px
 * phone) and 200 wide. The outline is the parent; the figure shrinks to sit inside it and never wraps or clips. Where one line would go
 * under half size (9 digits in 120 px, 12 in 150), the word "points" moves under the count and every digit stays.
 */
function fitCases() {
  const out: Record<string, { props: PointsFigureProps; note: string; width: number }> = {};
  for (const [digits, count] of [[7, 1250000], [9, 123456789], [12, 123456789012]] as const) {
    for (const width of [120, 150, 182, 200]) {
      out[`fit-${digits}-${width}`] = { props: { count, size: 'hero' }, width, note: `${digits} digits in ${width} px` };
    }
  }
  return out;
}

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
          {cases[key].width ? (
            <View style={[styles.parent, { width: cases[key].width, borderColor: colors.borderStrong }]}>
              <PointsFigure {...cases[key].props} testID={`points-${key}`} />
            </View>
          ) : (
            <PointsFigure {...cases[key].props} testID={`points-${key}`} />
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingTop: layout.tapMin * 2, paddingHorizontal: layout.gutter, paddingBottom: space.s3xl, gap: space.s2xl },
  item: { gap: space.sm },
  parent: { borderWidth: 1, borderStyle: 'dashed' },
});
