import { useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { balanceProblem } from '@/api/money';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { browserOutlineOff } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Money } from '@/components/Money';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { useOpenWalletEntry } from '@/features/open-wallet/entry';
import { radius, space, useWawu } from '@/theme';

import { serverSentence, stateWords } from '../home/model';

/**
 * design/_gen/kit.js line 50, `search`: 50 high, a full pill on the card colour with a 1 hairline ring, 10 between the glyph
 * and the words, 18 in at the sides, the glyph 20 and the words 15.5 (the placeholder in the muted colour). Focused, the
 * ring is the accent's 1.5, as the schools search draws it (`srch`'s focus state).
 */
export const searchMetrics = { height: 50, between: 10, padH: 18, icon: 20, text: 15.5, ring: 1, focusRing: 1.5 } as const;

export type HistorySearchProps = {
  value: string;
  maxLength: number;
  onChange: (text: string) => void;
  /** The search key on the keyboard. */
  onSubmit?: () => void;
  testID?: string;
};

/** W26's "Search transactions". Typing and clearing are the person's; the screen decides what is asked of the Hub. */
export function HistorySearch({ value, maxLength, onChange, onSubmit, testID }: HistorySearchProps) {
  const { colors } = useWawu();
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        styles.search,
        {
          backgroundColor: colors.surfaceCard,
          boxShadow: [
            {
              offsetX: 0,
              offsetY: 0,
              blurRadius: 0,
              spreadDistance: focused ? searchMetrics.focusRing : searchMetrics.ring,
              color: focused ? colors.accent : colors.borderHairline,
              inset: true,
            },
          ],
        },
      ]}
    >
      <Icon name="Search" size={searchMetrics.icon} color={colors.textMuted} />
      <TextInput
        testID={testID}
        value={value}
        maxLength={maxLength}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search transactions"
        placeholderTextColor={colors.textMuted}
        accessibilityLabel="Search transactions"
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        selectionColor={colors.accent}
        cursorColor={colors.accent}
        style={[styles.input, Platform.OS === 'web' ? browserOutlineOff : null, { color: colors.textPrimary }]}
      />
    </View>
  );
}

/**
 * design/_gen/wallet.js line 118, the summary card: padded 14 by 16, two halves 14 apart split by a 1 hairline rule, each
 * a 12.5 muted label and, 4 under it, a figure at 18 (In in the positive colour, Out in the text colour); the right half
 * is padded 4 at its start.
 */
export const summaryMetrics = { padV: 14, padH: 16, between: 14, label: 12.5, figureTop: 4, figure: 18, rightPad: 4, rule: 1 } as const;

export type MonthCardProps = {
  /** "September": the month the totals are for, in Lagos time. */
  month: string;
  /** The server's sums for that month, in kobo; undefined while they load or when the read failed. */
  totals: { inKobo: number; outKobo: number } | undefined;
  failed: boolean;
  onRetry: () => void;
};

/**
 * W26's In and Out for the month. The figures are the Hub's sum of the month's completed rows (`GET /money/transactions/summary`):
 * money in as it arrived, money out as it left with its charges. A figure that has not arrived is a bar, never a zero, and a
 * failed read says so with Try again instead of a figure.
 */
export function MonthCard({ month, totals, failed, onRetry }: MonthCardProps) {
  const { colors } = useWawu();
  if (failed && !totals) {
    return (
      <Card testID="history-summary-error" style={styles.card}>
        <View style={styles.failed}>
          <Text variant="secondary" tone="textSecondary" accessibilityRole="alert" style={styles.failedText}>
            Couldn’t load this month’s totals.
          </Text>
          <Button label="Try again" icon="RotateCw" variant="secondary" size="sm" onPress={onRetry} testID="history-summary-retry" />
        </View>
      </Card>
    );
  }
  return (
    <Card testID="history-summary" style={styles.card}>
      <View style={styles.pair}>
        <View style={styles.half}>
          <Text variant="caption" style={styles.label}>{`In · ${month}`}</Text>
          <View style={styles.figure}>
            {totals ? (
              <Money testID="history-in" minorUnits={totals.inKobo} size={summaryMetrics.figure} tone="positive" />
            ) : (
              <Money testID="history-in-loading" loading minorUnits={0} size={summaryMetrics.figure} />
            )}
          </View>
        </View>
        <View style={[styles.rule, { backgroundColor: colors.borderHairline }]} />
        <View style={[styles.half, styles.right]}>
          <Text variant="caption" style={styles.label}>{`Out · ${month}`}</Text>
          <View style={styles.figure}>
            {totals ? (
              <Money testID="history-out" minorUnits={totals.outKobo} size={summaryMetrics.figure} />
            ) : (
              <Money testID="history-out-loading" loading minorUnits={0} size={summaryMetrics.figure} />
            )}
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  search: { height: searchMetrics.height, borderRadius: radius.chip, flexDirection: 'row', alignItems: 'center', gap: searchMetrics.between, paddingHorizontal: searchMetrics.padH },
  input: { flex: 1, fontSize: searchMetrics.text, padding: 0 },
  card: { paddingVertical: summaryMetrics.padV, paddingHorizontal: summaryMetrics.padH },
  pair: { flexDirection: 'row', alignItems: 'stretch', gap: summaryMetrics.between },
  half: { flex: 1 },
  right: { paddingLeft: summaryMetrics.rightPad },
  rule: { width: summaryMetrics.rule },
  label: { fontSize: summaryMetrics.label },
  figure: { marginTop: summaryMetrics.figureTop },
  failed: { alignItems: 'flex-start', gap: space.sm },
  failedText: { alignSelf: 'stretch' },
});

export type LoadFailedProps = {
  error: unknown;
  /** What was being read, for the title: "transactions", "this transaction". */
  what: string;
  onRetry: () => void;
  testID: string;
};

/**
 * A read that failed, in the words of what failed. The wallet gate answers first (MONEY-13): no wallet yet leads to Open your
 * wallet, one still opening says to check again, a frozen one says so, in the same words as the Wallet tab (`stateWords`).
 * Anything else is the usual error: offline, or the server's own sentence, with Try again.
 */
export function LoadFailed({ error, what, onRetry, testID }: LoadFailedProps) {
  const entry = useOpenWalletEntry();
  const problem = balanceProblem(error);
  if (problem === 'no_wallet') {
    return <EmptyState testID={testID} icon="Wallet" {...stateWords({ kind: 'no_wallet' })} action={{ label: 'Open your wallet', onPress: entry.open }} />;
  }
  if (problem === 'opening') {
    return <EmptyState testID={testID} icon="Clock" {...stateWords({ kind: 'opening' })} action={{ label: 'Check again', onPress: onRetry }} />;
  }
  if (problem === 'frozen') {
    return <ErrorState testID={testID} icon="Snowflake" {...stateWords({ kind: 'frozen', message: serverSentence(error, '') })} onRetry={onRetry} />;
  }
  const offline = isApiError(error) && error.kind === 'network';
  return (
    <ErrorState
      testID={testID}
      icon={offline ? 'WifiOff' : 'TriangleAlert'}
      title={`Couldn’t load ${what}`}
      message={offline ? 'No connection. Check your internet and try again.' : serverSentence(error, 'Something went wrong. Try again.')}
      onRetry={onRetry}
    />
  );
}
