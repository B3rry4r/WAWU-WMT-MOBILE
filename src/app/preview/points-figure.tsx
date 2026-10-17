import { useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PointsFigure, type PointsFigureProps } from '@/components/PointsFigure';
import { Text } from '@/components/Text';
import { LeaveDevRoute } from '@/features/shell/LeaveDevRoute';
import { layout, radius, space, useWawu, type ColorToken } from '@/theme';

/**
 * Development-only gallery of the points figure, for pictures beside PT5 (the balance and "When they end"), M19 (the Studio count)
 * and W1 (the Points tile): /preview/points-figure?state=<name>, or no state for every one. The counts are the brief's example
 * values, not balances: the app reads them from the Hub. Points are a count: nothing here is naira. A release build redirects home.
 *
 * The figure hugs its content unless a screen sets `fit`. The plain cases above are hugging figures; the `fit-` cases are fitted to a
 * parent of a known width; the `place-` cases put a hugging figure where the boards put one (M19's card, a PT3 value, centred, at the
 * end, in a pill), and a fitted one beside "Buy points" (PT5).
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
 * A long balance in a narrow place: the 7, 9, 12 and 15 digit counts at the hero size in a parent 120, 150, 182 (PT5's column beside "Buy
 * points" on a 360 px phone) and 200 wide, and the Studio chip's 9, 12 and 15 digits in 120 and 150. The outline is the parent; the figure
 * fits inside it, never past it and never cut. Where one line would go under the floor (11 px for the count, 10 px for the word) the word
 * "points" moves under the count, and a count still wider than its room at the floor breaks only between its digit groups.
 */
function fitCases() {
  const out: Record<string, { props: PointsFigureProps; note: string; width: number }> = {};
  for (const [digits, count] of [[7, 1250000], [9, 123456789], [12, 123456789012], [15, 123456789012345]] as const) {
    for (const width of [120, 150, 182, 200]) {
      out[`fit-${digits}-${width}`] = { props: { count, size: 'hero', fit: true }, width, note: `${digits} digits in ${width} px` };
    }
  }
  for (const [digits, count] of [[9, 123456789], [12, 123456789012], [15, 123456789012345]] as const) {
    for (const width of [120, 150]) {
      out[`fit-chip-${digits}-${width}`] = { props: { count, size: 'chip', fit: true }, width, note: `Studio count, ${digits} digits in ${width} px` };
    }
  }
  return out;
}

/**
 * A hugging figure where the boards put one. The parent decides: the Studio card's count is a row item at the end beside a title that
 * keeps its width (M19), a value sits at the end of its row (PT3), a parent centres it or end-aligns it, a pill wraps it. The balance
 * (PT5) is the one fitted place: a column beside "Buy points" with a width of its own.
 */
function places(colors: Record<ColorToken, string>): Record<string, { note: string; node: ReactNode }> {
  const card = { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline };
  return {
    'place-studio': {
      note: 'Studio card (M19): the count at the end, the title keeps its width',
      node: (
        <View style={[styles.studio, card]}>
          <View style={[styles.mark, { backgroundColor: colors.accentTint }]} />
          <View style={styles.title}>
            <Text variant="body">Studio</Text>
            <Text variant="meta">3 products</Text>
          </View>
          <PointsFigure count={1250} size="chip" testID="points-place-studio" />
        </View>
      ),
    },
    'place-kv': {
      note: 'A value at the end of its row (PT3)',
      node: (
        <View style={[styles.kv, card]}>
          <Text variant="body">Points</Text>
          <PointsFigure count={250} size="row" testID="points-place-kv" />
        </View>
      ),
    },
    'place-center': {
      note: 'Centred by its parent',
      node: (
        <View style={[styles.stack, card, { alignItems: 'center' }]}>
          <PointsFigure count={1240} size="hero" testID="points-place-center" />
        </View>
      ),
    },
    'place-end': {
      note: 'End-aligned by its parent',
      node: (
        <View style={[styles.stack, card, { alignItems: 'flex-end' }]}>
          <PointsFigure count={1240} size="hero" testID="points-place-end" />
        </View>
      ),
    },
    'place-pill': {
      note: 'In a pill that hugs it',
      node: (
        <View style={[styles.pill, { backgroundColor: colors.accentTint }]}>
          <PointsFigure count={1250} size="chip" testID="points-place-pill" />
        </View>
      ),
    },
    'place-balance': {
      note: 'PT5 balance: fitted to its column beside "Buy points"',
      node: (
        <View style={[styles.balance, card]}>
          <View style={styles.column}>
            <Text variant="meta">Balance</Text>
            <PointsFigure count={98765432} size="hero" fit testID="points-place-balance" />
          </View>
          <View style={[styles.buy, { backgroundColor: colors.accent }]}>
            <Text variant="body" tone="textOnAccent">
              Buy points
            </Text>
          </View>
        </View>
      ),
    },
  };
}

export default function PointsFigurePreview() {
  const { colors } = useWawu();
  const { state } = useLocalSearchParams<{ state?: string }>();
  if (!__DEV__) return <LeaveDevRoute />;

  const placed = places(colors);
  if (state && placed[state]) {
    return (
      <ScrollView style={{ backgroundColor: colors.surfacePage }} contentContainerStyle={styles.page}>
        <View style={styles.item}>
          <Text variant="meta">{placed[state].note}</Text>
          {placed[state].node}
        </View>
      </ScrollView>
    );
  }
  const keys = state && cases[state] ? [state] : [...Object.keys(cases), ...Object.keys(placed)];
  return (
    <ScrollView style={{ backgroundColor: colors.surfacePage }} contentContainerStyle={styles.page}>
      {keys.map((key) => placed[key] ? (
        <View key={key} style={styles.item}>
          <Text variant="meta">{placed[key].note}</Text>
          {placed[key].node}
        </View>
      ) : (
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
  studio: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderWidth: 1, borderRadius: radius.tile },
  mark: { width: 40, height: 40, borderRadius: radius.input },
  title: { flex: 1, gap: space.xs },
  kv: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: space.lg, borderWidth: 1, borderRadius: radius.tile },
  stack: { padding: space.lg, borderWidth: 1, borderRadius: radius.tile },
  pill: { alignSelf: 'flex-start', paddingHorizontal: space.md, paddingVertical: space.xs, borderRadius: radius.chip },
  balance: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderWidth: 1, borderRadius: radius.tile },
  column: { flex: 1, gap: space.xs },
  buy: { paddingHorizontal: space.lg, height: layout.tapMin, borderRadius: radius.button, justifyContent: 'center' },
});
