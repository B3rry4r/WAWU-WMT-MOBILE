import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Icon } from '@/components/icon';
import { ListRow } from '@/components/ListRow';
import { SkeletonRows } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { space, useWawu } from '@/theme';

import { banksQuery, failureMessage, type Bank } from './api/payoutAccount';
import { popularBanks } from './popularBanks';
import { filterBanks } from './payoutForm';

/** The list takes at most this share of the window, so the sheet never covers the whole screen. */
const LIST_SHARE = 0.5;
/** kit.js `Check` beside a chosen row: 18 at stroke 2.6. */
const pickedMetrics = { icon: 18, stroke: 2.6 } as const;

type Row = { kind: 'label'; key: string; text: string; testID: string } | { kind: 'bank'; key: string; bank: Bank; testID: string };

export type BankSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** The bank the form holds, ticked in the list. */
  selectedCode: string | null;
  onPick: (bank: Bank) => void;
};

/**
 * The bank list behind A21's Bank field (the canvas draws the field, not the
 * list). Fintava's banks from `GET /money/banks`, searchable by name. The list
 * is asked for only while the sheet is open.
 */
export function BankSheet({ visible, onClose, selectedCode, onPick }: BankSheetProps) {
  const { colors } = useWawu();
  const { height } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const banks = useQuery({ ...banksQuery, enabled: visible });
  const shown = banks.data ? filterBanks(banks.data, search) : [];

  const close = () => {
    setSearch('');
    onClose();
  };

  let body;
  if (banks.isPending) {
    body = <SkeletonRows count={5} testID="bank-sheet-loading" />;
  } else if (banks.isError) {
    body = (
      <ErrorState
        testID="bank-sheet-error"
        title="The bank list did not load"
        message={failureMessage(banks.error)}
        onRetry={() => void banks.refetch()}
      />
    );
  } else if (banks.data.length === 0) {
    body = (
      <EmptyState
        testID="bank-sheet-empty"
        icon="Landmark"
        title="No banks to show"
        message="The bank list came back empty. Try again in a moment."
        action={{ label: 'Try again', onPress: () => void banks.refetch() }}
      />
    );
  } else if (shown.length === 0) {
    body = <EmptyState testID="bank-sheet-no-match" icon="Search" title="No bank by that name" message="Check the spelling, or try part of the name." />;
  } else {
    // WALK-FIX M6: with nothing typed, the popular banks lead and the whole list follows, A to Z. A search shows one plain list.
    const popular = search.trim() === '' ? popularBanks(shown) : [];
    const rows: Row[] =
      popular.length > 0
        ? [
            { kind: 'label', key: 'label-popular', text: 'Popular', testID: 'bank-sheet-popular-label' },
            ...popular.map((bank): Row => ({ kind: 'bank', key: `popular-${bank.code}`, bank, testID: `bank-popular-${bank.code}` })),
            { kind: 'label', key: 'label-all', text: 'All banks', testID: 'bank-sheet-all-label' },
            ...shown.map((bank): Row => ({ kind: 'bank', key: bank.code, bank, testID: `bank-${bank.code}` })),
          ]
        : shown.map((bank): Row => ({ kind: 'bank', key: bank.code, bank, testID: `bank-${bank.code}` }));
    body = (
      <FlatList
        testID="bank-sheet-list"
        data={rows}
        keyExtractor={(row) => row.key}
        keyboardShouldPersistTaps="handled"
        style={{ maxHeight: height * LIST_SHARE }}
        renderItem={({ item }) =>
          item.kind === 'label' ? (
            <Text variant="label" testID={item.testID} accessibilityRole="header" style={styles.label}>
              {item.text}
            </Text>
          ) : (
            <ListRow
              testID={item.testID}
              title={item.bank.name}
              accessibilityLabel={item.bank.code === selectedCode ? `${item.bank.name}, chosen` : item.bank.name}
              trailing={
                item.bank.code === selectedCode ? (
                  <Icon name="Check" size={pickedMetrics.icon} color={colors.accentFg} strokeWidth={pickedMetrics.stroke} />
                ) : (
                  <View />
                )
              }
              onPress={() => {
                setSearch('');
                onPick(item.bank);
              }}
            />
          )
        }
      />
    );
  }

  return (
    <BottomSheet visible={visible} onClose={close} label="Choose your bank" testID="bank-sheet">
      <Text variant="sheetTitleSm" accessibilityRole="header">
        Choose your bank
      </Text>
      <TextField
        label="Search"
        leadingIcon="Search"
        placeholder="Bank name"
        value={search}
        onChangeText={setSearch}
        autoCorrect={false}
        autoCapitalize="none"
        disabled={!banks.data || banks.data.length === 0}
        testID="bank-sheet-search"
      />
      <View style={styles.body}>{body}</View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { flexShrink: 1 },
  label: { paddingTop: space.sm, paddingBottom: space.xs },
});
