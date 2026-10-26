import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { GroupedList } from '@/components/Card';
import { Icon } from '@/components/icon';
import { KeyValueRow, rowMetrics } from '@/components/ListRow';
import { PoweredByNuvion } from '@/components/PoweredByNuvion';
import { Text } from '@/components/Text';
import { copyText } from '@/features/open-wallet/copy';
import { groupedAccountNumber } from '@/features/open-wallet/pin';
import { font, radius, space, useWawu } from '@/theme';

import type { WalletSettings } from '../api/settings';

/** kit.js line 61, `copyBtn`: 32 high, 12 at the sides, a pill on the sunken surface, the Copy glyph 14, the word 13 / 600, 6 between. */
const COPY = { height: 32, padX: 12, icon: 14, label: 13, iconGap: 6 } as const;
/** How long the button says "Copied" before it reads "Copy" again (A8's own). Default (agent), owner may override. */
const COPIED_MS = 2000;
/** The sheet's rows stand 14 apart (kit `sheet`, as the PIN sheet passes it). */
const SHEET_GAP = 14;

export type AccountDetailsSheetProps = {
  visible: boolean;
  onClose: () => void;
  account: NonNullable<WalletSettings['account']>;
};

/**
 * Account details, opened by W35's row of that name. The canvas draws the row and no screen behind it, so this is the
 * smallest true thing: what the bank gave, as A8 shows it (the holder's name, the number with Copy, the bank), and the
 * licence and deposit insurance wording when the server sends any (R-1: the owner fills it in config, never the app).
 * Every value is the server's. Default (agent), owner may override.
 */
export function AccountDetailsSheet({ visible, onClose, account }: AccountDetailsSheetProps) {
  const { colors } = useWawu();
  return (
    <BottomSheet visible={visible} onClose={onClose} label="Account details" gap={SHEET_GAP} testID="wallet-account-sheet">
      <Text variant="sheetTitleSm" style={styles.title}>
        Account details
      </Text>
      <GroupedList testID="wallet-account-card">
        <KeyValueRow label="Account name" value={account.accountName} testID="wallet-account-name" />
        <KeyValueRow
          label="Account number"
          testID="wallet-account-number"
          value={
            <>
              <Text variant="body" numberOfLines={1} selectable style={[font(600), styles.value]} testID="wallet-account-number-value">
                {groupedAccountNumber(account.accountNumber)}
              </Text>
              <CopyButton value={account.accountNumber} />
            </>
          }
        />
        <KeyValueRow
          label="Bank"
          testID="wallet-account-bank"
          value={
            <Text variant="body" numberOfLines={2} style={[font(600), styles.value, styles.wrapValue, { color: colors.textPrimary }]}>
              {account.bankName}
            </Text>
          }
        />
      </GroupedList>
      {account.licenceLine || account.depositInsuranceLine ? (
        <View style={styles.notes}>
          {[account.licenceLine, account.depositInsuranceLine].map((note) =>
            note ? (
              <Text key={note} variant="meta" tone="textMuted" style={styles.note} testID="wallet-account-note">
                {note}
              </Text>
            ) : null,
          )}
        </View>
      ) : null}
      <PoweredByNuvion />
    </BottomSheet>
  );
}

/** Copy: the account number as sent, digits only, onto the clipboard; it reads "Copied" for a moment after. */
function CopyButton({ value }: { value: string }) {
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
    AccessibilityInfo.announceForAccessibility(done ? 'Account number copied' : "Couldn't copy the account number");
    if (!done) return;
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copied ? 'Copied' : 'Copy account number'}
      onPress={() => void copy()}
      hitSlop={space.sm}
      testID="wallet-account-copy"
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
  value: { fontSize: rowMetrics.pairValue, flexShrink: 1 },
  wrapValue: { textAlign: 'right' },
  copy: { height: COPY.height, paddingHorizontal: COPY.padX, borderRadius: radius.chip, flexDirection: 'row', alignItems: 'center', gap: COPY.iconGap, flexShrink: 0 },
  copyLabel: { fontSize: COPY.label },
  notes: { gap: space.xs },
  note: { textAlign: 'center' },
});
