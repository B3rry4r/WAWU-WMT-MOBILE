import { useQuery } from '@tanstack/react-query';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { font, layout, radius, space, useWawu } from '@/theme';

import { fetchReferrals, referralsKey } from './api';
import { rulesOf } from './model';
import { NavBar } from './parts';

/** design/_gen/referral.js `rule` and `rf4`: 16 apart, 14 under the bar; a 28 round number on the accent tint (13 / 700), 12 beside the words (14.5 at 1.45, 4 down). */
const rule = { number: 28, numberFont: 13, beside: 12, between: 16, top: 14, word: 14.5, wordLead: 1.45, wordTop: 4 } as const;
/** The loading view stands in for the rules: this many lines of skeleton, a little shorter each. */
const SKELETON_LINES = [1, 0.8, 0.9, 0.6];

export type RulesScreenProps = { onBack: () => void };

/** RF4 · How it works. The hold days are the Hub's (`holdDays`), not written here (R-65). */
export function RulesScreen({ onBack }: RulesScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const referrals = useQuery({ queryKey: referralsKey, queryFn: fetchReferrals });
  const rules = referrals.data ? rulesOf(referrals.data) : null;
  return (
    <View testID="invite-rules" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <NavBar title="How it works" onBack={onBack} idPrefix="invite-rules" />
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + space.s3xl }]} testID="invite-rules-scroll">
        {rules ? (
          rules.map((line, at) => (
            <View key={line} style={styles.rule} testID={`invite-rule-${at + 1}`}>
              <View style={[styles.number, { backgroundColor: colors.accentTint }]}>
                <Text variant="body" tone="accentFg" style={[font(700), styles.numberText]}>
                  {at + 1}
                </Text>
              </View>
              <Text variant="body" style={styles.words}>
                {line}
              </Text>
            </View>
          ))
        ) : referrals.isError ? (
          <ErrorState title="Couldn't load the rules" message="Check your connection and try again." onRetry={() => void referrals.refetch()} testID="invite-rules-error" />
        ) : (
          <LoadingView label="Loading the rules" testID="invite-rules-loading">
            <View style={styles.skeletons}>
              {SKELETON_LINES.map((share, at) => (
                <Skeleton key={at} width={`${share * 100}%`} height={rule.number} radius={radius.chip} />
              ))}
            </View>
          </LoadingView>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  body: { paddingTop: rule.top, paddingHorizontal: layout.gutter, gap: rule.between },
  rule: { flexDirection: 'row', alignItems: 'flex-start', gap: rule.beside },
  number: { width: rule.number, height: rule.number, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  numberText: { fontSize: rule.numberFont },
  words: { flex: 1, fontSize: rule.word, lineHeight: rule.word * rule.wordLead, paddingTop: rule.wordTop },
  skeletons: { gap: rule.between },
});
