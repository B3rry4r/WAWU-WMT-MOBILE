import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, Share, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { Icon } from '@/components/icon';
import { rowMetrics } from '@/components/ListRow';
import { PoweredByNuvion } from '@/components/PoweredByNuvion';
import { Text } from '@/components/Text';
import { copyText } from '@/features/open-wallet/copy';
import { font, radius, space, useWawu } from '@/theme';

import type { FxAccount, FxDetails } from './api';

const COPY = { height: 32, padX: 12, icon: 14, label: 13, iconGap: 6 } as const;
const COPIED_MS = 2000;
const SHEET_GAP = 14;

type Field = { key: keyof FxDetails; label: string };
/** What payers are asked for, in the order a payer fills it in. Only the ones Nuvion issued for this account are drawn. */
const FIELDS: readonly Field[] = [
  { key: 'beneficiaryName', label: 'Account name' },
  { key: 'accountNumber', label: 'Account number' },
  { key: 'routingNumber', label: 'Routing number' },
  { key: 'sortCode', label: 'Sort code' },
  { key: 'iban', label: 'IBAN' },
  { key: 'swiftCode', label: 'SWIFT code' },
  { key: 'bankName', label: 'Bank' },
  { key: 'bankAddress', label: 'Bank address' },
];

const squeezed = (value: string): string => value.replace(/\s/g, '').toUpperCase();

/**
 * The rows of the sheet: each field the Hub filled in, with its label. A bank that gives one number as both the account number and the
 * IBAN shows it once, under both names, so a payer never reads the same long number twice.
 */
export function detailRows(details: FxDetails | null): { key: string; label: string; value: string }[] {
  if (!details || details.status !== 'active') return [];
  const same = typeof details.accountNumber === 'string' && typeof details.iban === 'string' && details.accountNumber.trim() !== '' && squeezed(details.accountNumber) === squeezed(details.iban);
  return FIELDS.flatMap((f) => {
    const value = details[f.key];
    if (typeof value !== 'string' || !value.trim()) return [];
    if (same && f.key === 'iban') return [];
    return [{ key: f.key, label: same && f.key === 'accountNumber' ? 'Account number (IBAN)' : f.label, value: value.trim() }];
  });
}

/** What Share sends: the same rows as plain lines, so a client can paste them into their payment form. */
export function shareText(name: string, rows: readonly { label: string; value: string }[]): string {
  return [`${name} account details`, ...rows.map((r) => `${r.label}: ${r.value}`)].join('\n');
}

export type FxDetailsSheetProps = { visible: boolean; onClose: () => void; account: Pick<FxAccount, 'currency' | 'details'>; name: string };

/**
 * W2's "Get paid from abroad": the account details Nuvion issued, each with Copy, and Share for the whole set. Every value is the
 * Hub's; a field Nuvion did not issue is not drawn. No claim is made about who can pay into it (R-47).
 */
export function FxDetailsSheet({ visible, onClose, account, name }: FxDetailsSheetProps) {
  const rows = detailRows(account.details);
  return (
    <BottomSheet visible={visible} onClose={onClose} label={`${name} account details`} gap={SHEET_GAP} testID="fx-details-sheet">
      <Text variant="sheetTitleSm" style={styles.title}>
        {account.currency} account details
      </Text>
      <GroupedList testID="fx-details-card">
        {rows.map((r) => (
          <View key={r.key} testID={`fx-detail-${r.key}`} accessible style={styles.detail}>
            <View style={styles.detailWords}>
              <Text variant="secondary" tone="textMuted" style={styles.detailLabel}>
                {r.label}
              </Text>
              <Text variant="body" selectable style={[font(600), styles.value]}>
                {r.value}
              </Text>
            </View>
            <CopyButton value={r.value} label={r.label} />
          </View>
        ))}
      </GroupedList>
      <Button
        label="Share details"
        icon="Share2"
        variant="secondary"
        onPress={() => void Share.share({ message: shareText(account.currency, rows) })}
        testID="fx-details-share"
      />
      <PoweredByNuvion />
    </BottomSheet>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const { colors } = useWawu();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const copy = async () => {
    const done = await copyText(value);
    AccessibilityInfo.announceForAccessibility(done ? `${label} copied` : `Couldn't copy the ${label.toLowerCase()}`);
    if (!done) return;
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copied ? 'Copied' : `Copy ${label.toLowerCase()}`}
      onPress={() => void copy()}
      hitSlop={space.sm}
      style={({ pressed }) => [styles.copy, { backgroundColor: pressed ? colors.borderHairline : colors.surfaceSunken }]}
    >
      <Icon name={copied ? 'Check' : 'Copy'} size={COPY.icon} color={colors.textPrimary} />
      <Text variant="body" style={[font(600), styles.copyLabel]}>
        {copied ? 'Copied' : 'Copy'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { textAlign: 'center' },
  // A label over its value, Copy beside them: a long IBAN or address has the whole width under its label to wrap in, and never meets it.
  detail: { flexDirection: 'row', alignItems: 'center', gap: rowMetrics.pairGap, minHeight: rowMetrics.pairMinHeight, paddingVertical: rowMetrics.padV },
  detailWords: { flex: 1, minWidth: 0, gap: space.xs },
  detailLabel: { fontSize: rowMetrics.pairLabel },
  value: { fontSize: rowMetrics.pairValue },
  copy: { height: COPY.height, paddingHorizontal: COPY.padX, borderRadius: radius.chip, flexDirection: 'row', alignItems: 'center', gap: COPY.iconGap, flexShrink: 0 },
  copyLabel: { fontSize: COPY.label },
});

