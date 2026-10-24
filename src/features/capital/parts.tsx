import * as Linking from 'expo-linking';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ListRow, KeyValueRow } from '@/components/ListRow';
import { GroupedList } from '@/components/Card';
import { formatMoney } from '@/components/Money';
import { IconTile } from '@/components/IconTile';
import type { IconName } from '@/components/icon';
import { StatusPill } from '@/components/StatusPill';
import { Text } from '@/components/Text';
import { isApprovalStop, notApproved, stopCode, type Settled } from '@/features/device-approval';
import { space } from '@/theme';

import type { CapitalHolding, CapitalOrder, CapitalProduct, MoneyOutcome } from './api';
import { dayText, deductibleText, holdingLine, ORDER_STATUS, rateText, termText, whyNotOrderable } from './model';

/** The gap between the parts of a Capital screen: the wallet's own (14). */
export const GAP = 14;

/** Opens a hosted document or page in the browser (expo-linking). A link that cannot be opened is left alone. */
export function openDocument(url: string): void {
  void Linking.openURL(url).catch(() => undefined);
}

/** A product as a row: its name, the rate and the term (or the offer price), and why it cannot be ordered when it cannot. */
export function ProductRow({ product, onPress }: { product: CapitalProduct; onPress: () => void }) {
  const closed = !product.orderable;
  const line =
    product.kind === 'fixed_return'
      ? [rateText(product.annualRate), termText(product.tenorDays)].filter(Boolean).join(' · ')
      : [product.issuerName, product.offerPriceKobo !== null ? `${formatMoney(product.offerPriceKobo)} a share` : ''].filter(Boolean).join(' · ');
  return (
    <ListRow
      testID={`capital-product-${product.id}`}
      lead={<IconTile icon={product.kind === 'fixed_return' ? 'TrendingUp' : 'BriefcaseBusiness'} tone={closed ? 'neutral' : 'accent'} size={44} />}
      title={product.name}
      subtitle={line}
      trailing={closed ? <StatusPill label={whyNotOrderable(product.notOrderableReason)} tone="neutral" /> : undefined}
      onPress={onPress}
    />
  );
}

/** An investment as a row: the name, what it is doing, its amount and where it stands. */
export function OrderRow({ order, onPress }: { order: CapitalOrder; onPress: () => void }) {
  const status = ORDER_STATUS[order.status];
  return (
    <ListRow
      testID={`capital-order-${order.id}`}
      lead={<IconTile icon={order.kind === 'fixed_return' ? 'TrendingUp' : 'BriefcaseBusiness'} tone="accent" size={44} />}
      title={order.productName}
      subtitle={holdingLine(order)}
      trailing={
        <View style={styles.trailing}>
          <Text variant="body" style={styles.amount}>
            {formatMoney(order.amountKobo)}
          </Text>
          <StatusPill label={status.label} tone={status.tone} />
        </View>
      }
      onPress={onPress}
    />
  );
}

/** The deductions a product states, one row each ("Withholding tax  10% of interest"). */
export function DeductionRows({ list }: { list: readonly { name: string; value: number; valueType: 'flat' | 'percentage'; appliesTo: 'principal' | 'interest' }[] }): ReactNode {
  return list.map((d) => <KeyValueRow key={d.name} label={d.name} value={deductibleText(d)} />);
}

/** The figures of a holding, in rows. Each one is the Hub's; a figure it did not give is not drawn. */
export function HoldingFigures({ order }: { order: CapitalOrder }) {
  const h: CapitalHolding | null = order.holding;
  if (!h) return null;
  const rows: [string, string][] = [];
  if (order.kind === 'fixed_return') {
    if (h.principalKobo !== null) rows.push(['Invested', formatMoney(h.principalKobo)]);
    if (h.lockedRate !== null) rows.push(['Rate', rateText(h.lockedRate)]);
    if (h.tenorDays !== null) rows.push(['Term', termText(h.tenorDays)]);
    if (h.startedAt) rows.push(['Started', dayText(h.startedAt)]);
    if (h.maturesAt) rows.push(['Ends', dayText(h.maturesAt)]);
    if (h.accruedKobo !== null) rows.push(['Interest so far', formatMoney(h.accruedKobo)]);
    if (h.expectedPayoutKobo !== null) rows.push(['Expected at the end', formatMoney(h.expectedPayoutKobo)]);
    if (h.payoutKobo !== null) rows.push(['Payout', formatMoney(h.payoutKobo)]);
  } else {
    if (h.unitsHeld !== null) rows.push(['Shares held', String(h.unitsHeld)]);
    if (h.costKobo !== null) rows.push(['Cost', formatMoney(h.costKobo)]);
    if (h.currentValueKobo !== null) rows.push(['Value now', formatMoney(h.currentValueKobo)]);
    if (h.lockEndsAt) rows.push(['Held until', dayText(h.lockEndsAt)]);
    if (h.pendingRefundKobo !== null && h.pendingRefundKobo > 0) rows.push(['Refund on its way', formatMoney(h.pendingRefundKobo)]);
  }
  if (rows.length === 0) return null;
  return (
    <GroupedList testID="capital-figures">
      {rows.map(([label, value]) => (
        <KeyValueRow key={label} label={label} value={value} />
      ))}
    </GroupedList>
  );
}

/** A result: a mark, a title and a line, centred. */
export function ResultBlock({ icon, tone, title, line, testID }: { icon: IconName; tone: 'in' | 'accent' | 'danger'; title: string; line?: string; testID: string }) {
  return (
    <View testID={testID} accessibilityLiveRegion="polite" style={styles.result}>
      <IconTile icon={icon} tone={tone} size={88} strokeWidth={2.2} />
      <Text variant="title" accessibilityRole="header" style={styles.resultTitle}>
        {title}
      </Text>
      {line ? (
        <Text variant="secondary" style={styles.resultLine}>
          {line}
        </Text>
      ) : null}
    </View>
  );
}

/** What the screen does with each answer of a money call; the one place an outcome becomes a sheet answer. */
export type OutcomeHandlers = {
  /** An earlier try under this key left the phone with no answer that proves anything. */
  earlierTry: boolean;
  /** The Hub gave an answer that proves nothing was taken for this key: it is free for the next try. */
  nothingMoved: () => void;
  done: (order: CapitalOrder) => void;
  expired: (message: string) => void;
  short: (shortfallKobo: number | null, message: string) => void;
  refused: (message: string, code: string | null) => void;
  setLocked: (until: string) => void;
  noPin: () => void;
  noWallet: () => void;
};

export function settleOutcome(outcome: MoneyOutcome, on: OutcomeHandlers): Settled {
  // THE RULE (FIX-108, FIX-112): a closed or refused fingerprint proves nothing about an earlier try; it is settled by `notApproved`.
  if (isApprovalStop(outcome)) return notApproved(stopCode(outcome), on.earlierTry, on.nothingMoved);
  switch (outcome.kind) {
    case 'pin_incorrect':
      on.nothingMoved();
      return { code: 'pin_incorrect', triesLeft: outcome.triesLeft };
    case 'pin_locked':
      on.nothingMoved();
      on.setLocked(outcome.lockedUntil);
      return { code: 'pin_locked', lockedUntil: outcome.lockedUntil };
    case 'unanswered':
      return { code: 'unanswered' };
    case 'pin_not_set':
      on.nothingMoved();
      on.noPin();
      return { code: 'approved' };
    case 'no_wallet':
      on.nothingMoved();
      on.noWallet();
      return { code: 'approved' };
    case 'expired':
      on.nothingMoved();
      on.expired(outcome.message);
      return { code: 'approved' };
    case 'short':
      on.nothingMoved();
      on.short(outcome.shortfallKobo, outcome.message);
      return { code: 'approved' };
    case 'refused':
      on.nothingMoved();
      on.refused(outcome.message, outcome.code);
      return { code: 'approved' };
    case 'done':
      on.done(outcome.order);
      return { code: 'approved' };
  }
}

const styles = StyleSheet.create({
  trailing: { alignItems: 'flex-end', gap: space.xs },
  amount: { fontWeight: '700' },
  result: { alignItems: 'center', gap: space.md, paddingTop: space.s3xl * 3 },
  resultTitle: { textAlign: 'center', marginTop: space.sm },
  resultLine: { textAlign: 'center' },
});
