import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ProductsMeter, type MeterTier, type ProductsMeterProps } from '@/components/ProductsMeter';
import { Text } from '@/components/Text';
import { LeaveDevRoute } from '@/features/shell/LeaveDevRoute';
import { layout, space, useWawu } from '@/theme';

/**
 * Development-only gallery of the products meter, for pictures beside M1 and M19 ("2 of 3 products"):
 * /preview/products-meter?state=<name>, or no state for every one. The figures and the date are the brief's example values, not
 * allowances: the app reads them from the Hub (`GET /me/tier`). A release build redirects home.
 */
// The gallery's own end day (26 Nov 2026): "Until 26 Nov" while the tier is active. The year is read against the day it is opened on.
const tier: MeterTier = { name: 'Verify', state: 'active', endsAt: '2026-11-26T12:00:00Z' };

const cases: Record<string, { props: ProductsMeterProps; note: string }> = {
  partial: { props: { used: 2, allowed: 3, tier }, note: 'Partway (M1, M19)' },
  empty: { props: { used: 0, allowed: 3, tier }, note: 'None used yet (0 of 3)' },
  full: { props: { used: 3, allowed: 3, tier }, note: 'All used (a full bar)' },
  single: { props: { used: 0, allowed: 1, tier }, note: 'One allowed (0 of 1)' },
  over: { props: { used: 4, allowed: 3, tier: { name: 'Verify', state: 'ending', endsAt: null } }, note: 'Over the allowance (a tier ended): the bar stops at full, no date' },
  loading: { props: { used: 0, allowed: 0, loading: true }, note: 'Figures on their way' },
  none: { props: { used: 0, allowed: 0 }, note: 'No tier: the meter draws nothing, and this note is all there is' },
};

export default function ProductsMeterPreview() {
  const { colors } = useWawu();
  const { state } = useLocalSearchParams<{ state?: string }>();
  if (!__DEV__) return <LeaveDevRoute />;

  const keys = state && cases[state] ? [state] : Object.keys(cases);
  return (
    <ScrollView style={{ backgroundColor: colors.surfacePage }} contentContainerStyle={styles.page}>
      {keys.map((key) => (
        <View key={key} style={styles.item}>
          <Text variant="meta">{cases[key].note}</Text>
          <ProductsMeter {...cases[key].props} testID={`meter-${key}`} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingTop: layout.tapMin * 2, paddingHorizontal: layout.gutter, paddingBottom: space.s3xl, gap: space.s2xl },
  item: { gap: space.sm },
});
