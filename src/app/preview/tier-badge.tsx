import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Text';
import { TierBadge } from '@/components/TierBadge';
import { LeaveDevRoute } from '@/features/shell/LeaveDevRoute';
import { layout, space, useWawu } from '@/theme';

/**
 * Development-only gallery of the tier badge, for pictures beside M1 (the name row), VF14 (the tier card) and VF7a (the numbered
 * badge): /preview/tier-badge?state=<name>, or no state for every one. The names and the number are the brief's example values,
 * not tiers: the app reads them from the Hub. A release build redirects home.
 */
const cases: Record<string, { name: string; number?: number | null; note: string }> = {
  verify: { name: 'Verify', note: 'Verify (soft)' },
  plus: { name: 'Verify Plus', note: 'Verify Plus (soft)' },
  founding: { name: 'Founding Maker', note: 'Founding Maker, no number yet (soft)' },
  numbered: { name: 'Founding Maker', number: 128, note: 'Founding Maker, numbered (dark)' },
  long: { name: 'Founding Maker', number: 12840, note: 'A long number still fits one line' },
};

export default function TierBadgePreview() {
  const { colors } = useWawu();
  const { state } = useLocalSearchParams<{ state?: string }>();
  if (!__DEV__) return <LeaveDevRoute />;

  const keys = state && cases[state] ? [state] : Object.keys(cases);
  return (
    <ScrollView style={{ backgroundColor: colors.surfacePage }} contentContainerStyle={styles.page}>
      {keys.map((key) => (
        <View key={key} style={styles.item}>
          <Text variant="meta">{cases[key].note}</Text>
          <TierBadge name={cases[key].name} number={cases[key].number} testID={`tier-${key}`} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingTop: layout.tapMin * 2, paddingHorizontal: layout.gutter, paddingBottom: space.s3xl, gap: space.s2xl },
  item: { gap: space.sm },
});
