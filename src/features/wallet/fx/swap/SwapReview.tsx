import { StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { KeyValueRow } from '@/components/ListRow';
import { Text } from '@/components/Text';
import { font, space } from '@/theme';

import { formatTrim, rateLine } from '../amount';
import type { FxQuote } from '../api';
import { HoldPill } from '../parts';
import { feeRows, type Side } from './model';

export type SwapReviewProps = {
  visible: boolean;
  quote: FxQuote;
  from: Side;
  to: Side;
  /** Seconds the provider still holds this rate, from the quote's own `expiresAt`. */
  secondsLeft: number;
  onConfirm: () => void;
  onCancel: () => void;
};

const SHEET_GAP = 14;

/**
 * W21 · Swap · review: "Swap ₦158,000 for $100.00", From, To, Rate with the hold, the fee as the Hub's breakdown (the provider's charge and
 * WAWU's fee as their own rows), then the button with the total that leaves the account, and Cancel. The PIN sheet (W11) opens next.
 * Everything shown is the quote's: nothing is worked out here.
 */
export function SwapReview({ visible, quote, from, to, secondsLeft, onConfirm, onCancel }: SwapReviewProps) {
  const fromCode = from.code;
  const gives = formatTrim(quote.amountFromMinor, fromCode, quote.fromDecimals);
  const gets = formatTrim(quote.amountToMinor, to.code, quote.toDecimals);
  const total = formatTrim(quote.totalFromMinor, fromCode, quote.fromDecimals);
  const short = from.availableMinor !== null && quote.totalFromMinor > from.availableMinor;
  const held = secondsLeft > 0;
  return (
    <BottomSheet visible={visible} onClose={onCancel} label="Review swap" gap={SHEET_GAP} testID="swap-review-sheet">
      <Text variant="sheetTitle" style={styles.title} testID="swap-review-title">
        Swap {gives} for {gets}
      </Text>
      <GroupedList testID="swap-review-card">
        <KeyValueRow label="From" value={<Value text={from.longLabel} testID="swap-review-from" />} />
        <KeyValueRow label="To" value={<Value text={to.longLabel} testID="swap-review-to" />} />
        <KeyValueRow
          label="Rate"
          value={
            <View style={styles.rate}>
              <Value text={rateLine(quote) ?? 'Not available'} testID="swap-review-rate" />
              <HoldPill left={secondsLeft} />
            </View>
          }
        />
        {feeRows(quote).map((row) => (
          <KeyValueRow key={row.label} label={row.label} value={<Value text={row.value} testID={`swap-review-${row.label.split(' ')[0]?.toLowerCase()}`} />} />
        ))}
      </GroupedList>
      {short ? (
        <Text variant="errorLine" style={styles.title} testID="swap-review-short">
          Your balance does not cover this swap and its fees.
        </Text>
      ) : null}
      <View style={styles.buttons}>
        <Button testID="swap-confirm" label={held ? `Swap ${total}` : 'The rate ran out'} full disabled={!held || short} onPress={onConfirm} />
        <Button testID="swap-cancel" label="Cancel" variant="secondary" full onPress={onCancel} />
      </View>
    </BottomSheet>
  );
}

function Value({ text, testID }: { text: string; testID?: string }) {
  return (
    <Text variant="body" numberOfLines={2} testID={testID} style={[font(700), styles.value]}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: { textAlign: 'center' },
  value: { fontSize: 16, textAlign: 'right', flexShrink: 1 },
  rate: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexShrink: 1 },
  buttons: { gap: space.md },
});
