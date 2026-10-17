import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { KeyValueRow } from '@/components/ListRow';
import { Text } from '@/components/Text';
import { layout, space, useWawu } from '@/theme';

import { allowanceKey, fetchAllowance, type Allowance } from './api';
import { footMetrics } from './CreateFrame';

/** kit.js `result`: a mark 88 across at stroke 2.2, the title at 30 with its tracking, the line at 14.5, 10 between; me.js `inReview` starts the page 80 down, 20 between its parts. */
const resultMetrics = { top: 80, mark: 88, stroke: 2.2, between: 10, title: 30, titleTracking: -0.035, titleTop: space.sm, line: 14.5, parts: 20 } as const;

/** "5 of 5 free used": the Hub's own count and limit, and the word "free" only while the account has no tick (the way M19 and M27 read). */
export const usedLine = (a: Allowance): string => `${a.uploads.used} of ${a.uploads.allowed} ${a.tickHeld ? '' : 'free '}used`;

export type ReviewScreenProps = {
  /** The title the Hub filed the piece under. */
  title: string;
  /** Leaves the Create flow. */
  onDone: () => void;
};

/**
 * M25 · Sent for review. Shown once `POST /content` has said yes, so every line is true of the piece just sent: the Hub files it
 * as pending, tells the person when it goes live, and it takes its place in the uploads (read again from `GET /uploads/allowance`,
 * never counted here). "Usually takes" and "View in library" are not drawn: nothing the Hub serves says how long a review takes
 * (G-ME-08-3), and the library (M28) is ME-07's. The phone's back button is Done, since there is no step behind this one.
 */
export function ReviewScreen({ title, onDone }: ReviewScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const allowance = useQuery({ queryKey: allowanceKey, queryFn: fetchAllowance });

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onDone();
      return true;
    });
    return () => subscription.remove();
  }, [onDone]);

  const counted = allowance.data && !allowance.isFetching ? allowance.data : null;

  return (
    <View testID="review-screen" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingLeft: layout.gutter + insets.left, paddingRight: layout.gutter + insets.right }]}
      >
        <View testID="review-result" accessibilityLiveRegion="polite" style={styles.result}>
          <IconTile icon="Clock" tone="warn" size={resultMetrics.mark} strokeWidth={resultMetrics.stroke} />
          <Text variant="title" accessibilityRole="header" style={styles.resultTitle}>
            Sent for review
          </Text>
          <Text variant="secondary" numberOfLines={2} testID="review-title" style={styles.resultLine}>
            {title}
          </Text>
        </View>
        <GroupedList testID="review-card">
          {counted ? <KeyValueRow testID="review-uploads" label="Uploads" value={usedLine(counted)} /> : null}
          <KeyValueRow testID="review-notify" label="We'll tell you" value="When it goes live" />
        </GroupedList>
        <Text variant="muted" testID="review-note" style={styles.note}>
          You can edit it while it waits. It goes live on its own once approved.
        </Text>
      </ScrollView>
      <View style={[styles.foot, { backgroundColor: colors.surfacePage, paddingBottom: footMetrics.bottom + insets.bottom, paddingLeft: layout.gutter + insets.left, paddingRight: layout.gutter + insets.right }]}>
        <Button testID="review-done" label="Done" full onPress={onDone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingTop: resultMetrics.top, gap: resultMetrics.parts },
  result: { alignItems: 'center', gap: resultMetrics.between },
  resultTitle: { textAlign: 'center', fontSize: resultMetrics.title, letterSpacing: resultMetrics.titleTracking * resultMetrics.title, marginTop: resultMetrics.titleTop },
  resultLine: { textAlign: 'center', fontSize: resultMetrics.line },
  note: { textAlign: 'center' },
  foot: { paddingTop: footMetrics.top },
});
