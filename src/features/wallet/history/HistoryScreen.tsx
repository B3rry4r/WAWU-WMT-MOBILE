import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { queryClient } from '@/api/query';
import { Button, IconButton } from '@/components/Button';
import { Card } from '@/components/Card';
import { FilterChips } from '@/components/FilterChips';
import { LoadingView, Skeleton, SkeletonRows } from '@/components/Skeleton';
import { EmptyState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { ProsNav } from '@/features/professionals/parts';
import { SEARCH_DELAY_MS, useDebounced } from '@/features/schools/useDebounced';
import { layout, radius, space, useWawu } from '@/theme';

import { historyQuery, summaryQuery, type HistoryFilter } from '../api/history';
import { HistorySearch, LoadFailed, MonthCard } from './HistoryParts';
import { monthKey, monthName } from './lagosTime';
import { clockMeta, emptyWords, entriesOf, FILTER_CHIPS, rowCount, rowFace, SEARCH_MAX, searchOf, type Entry } from './model';
import { TxRow } from './TxRow';

/**
 * design/_gen/wallet.js lines 116 to 118 (W26, W28): the bar, then a body 8 below it with its parts 18 apart (the search, the
 * chips, the summary, each day); a day's label and its rows are 16 apart, and the rows 16 apart. W28's card is padded 12 by 16.
 */
const HISTORY = { bodyTop: space.sm, partGap: 18, rowStack: 16, bottom: 40, emptyPadV: 12, emptyPadH: 16, skeletonRows: 5, summaryHeight: 76 } as const;

export type HistoryScreenProps = {
  /** A grouped row's key: lists the movements that row stands for, with no search, chips or totals. */
  group?: string;
  onBack: () => void;
  /** A row: that movement's detail (W27). */
  onOpenTransaction: (id: string) => void;
  /** A grouped row ("Unlock, 3 buyers"): the movements it stands for. */
  onOpenGroup: (key: string) => void;
  /** The export icon beside the title (W26): Statements (W38). Left out, the icon is not drawn. */
  onOpenStatements?: () => void;
};

/**
 * W26 · Transaction history, with W28 (a chip or a search with nothing in it). Rows are the Hub's ledger (`GET
 * /money/transactions`), newest first under day labels in Lagos time, a page at a time; the chips and the search ask the Hub
 * (`filter`, `q`), so every row on screen is a row the Hub sent. In and Out are the Hub's sums for this month (`GET
 * /money/transactions/summary`), never a sum made here.
 *
 * The export icon beside the title opens Statements (W38, WALLET-35), as W26 draws it (R2-MONEY D-10); it is not drawn on a grouped row's list.
 *
 * Default (agent), owner may override: the list is the whole history, so a chip with nothing says "yet" where the canvas says
 * "in September"; a grouped row opens the movements it stands for, the same list without its search, chips and totals.
 */
export function HistoryScreen({ group, onBack, onOpenTransaction, onOpenGroup, onOpenStatements }: HistoryScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useWawu();
  const owner = useSessionAccount(undefined);
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [typed, setTyped] = useState('');
  const { settled, flush } = useDebounced(typed, SEARCH_DELAY_MS);
  const search = group ? null : searchOf(settled);
  const scope = useMemo(() => ({ filter: group ? ('all' as const) : filter, q: search, group: group ?? null }), [filter, search, group]);

  const list = useInfiniteQuery(historyQuery(owner, scope), queryClient);
  const now = new Date();
  const month = monthKey(now);
  const summary = useQuery(summaryQuery(owner, month, !group), queryClient);

  const entries = useMemo(() => entriesOf(list.data?.pages.map((page) => page.items) ?? [], new Date()), [list.data]);
  const rows = rowCount(entries);
  const [pulled, setPulled] = useState(false);

  const { refetch, fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError } = list;
  const refetchSummary = summary.refetch;
  const onRefresh = useCallback(async () => {
    setPulled(true);
    try {
      await Promise.all([refetch(), group ? Promise.resolve() : refetchSummary()]);
    } finally {
      setPulled(false);
    }
  }, [refetch, refetchSummary, group]);

  // Set the moment the next page is asked for and cleared when it settles: `isFetchingNextPage` is state and lags the ask by a
  // render, so a second end-reached in the same tick would ask again.
  const asking = useRef(false);
  const onEndReached = useCallback(() => {
    if (asking.current || !hasNextPage || isFetchingNextPage || isFetchNextPageError) return;
    asking.current = true;
    void fetchNextPage().finally(() => {
      asking.current = false;
    });
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  const loading = list.isPending;
  const failed = list.isError && !list.data;
  const empty = !loading && !failed && rows === 0;
  const refreshFailed = list.isRefetchError && !isFetchNextPageError && rows > 0;
  const words = emptyWords(scope.filter, search);

  let state = null;
  if (loading) {
    state = (
      <LoadingView label="Loading transactions" testID="history-loading">
        <View style={styles.loading}>
          {group ? null : <Skeleton height={HISTORY.summaryHeight} radius={radius.card} />}
          <SkeletonRows count={HISTORY.skeletonRows} />
        </View>
      </LoadingView>
    );
  } else if (failed) {
    state = <LoadFailed testID="history-error" error={list.error} what="your transactions" onRetry={() => void refetch()} />;
  } else if (empty) {
    state = (
      <Card testID="history-empty" style={styles.empty}>
        <EmptyState icon={words.icon} title={words.title} message={words.message} />
      </Card>
    );
  }

  const header =
    group || state ? null : (
      <View style={styles.summary}>
        <MonthCard
          month={monthName(now)}
          totals={summary.data}
          failed={summary.isError}
          onRetry={() => void refetchSummary()}
        />
        {refreshFailed ? (
          <View testID="history-refresh-failed" style={styles.refreshFailed} accessibilityLiveRegion="polite">
            <Text variant="meta" tone="textSecondary" accessibilityRole="alert" style={styles.refreshText}>
              Could not check for updates.
            </Text>
            <Button label="Try again" variant="secondary" size="sm" icon="RotateCw" onPress={() => void refetch()} testID="history-refresh-retry" />
          </View>
        ) : null}
      </View>
    );

  const renderItem = ({ item, index }: { item: Entry; index: number }) => {
    // A label has 18 above it (none at the very top without a card over it); a row, 16.
    const top = item.kind === 'day' ? (index === 0 && !header ? 0 : HISTORY.partGap) : HISTORY.rowStack;
    if (item.kind === 'day') {
      return (
        <Text variant="label" accessibilityRole="header" style={{ marginTop: top }}>
          {item.label}
        </Text>
      );
    }
    const face = rowFace(item.row);
    const groupKey = item.row.group?.key;
    return (
      <View style={{ marginTop: top }}>
        <TxRow
          testID={`history-row-${item.row.id}`}
          title={face.title}
          subtitle={face.subtitle}
          amountKobo={face.amountKobo}
          meta={clockMeta(item.row)}
          lead={face.lead}
          onPress={() => (groupKey ? onOpenGroup(groupKey) : onOpenTransaction(item.row.id))}
        />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView testID="history-screen" behavior="padding" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <ProsNav
        title="Transactions"
        onBack={onBack}
        right={
          onOpenStatements && !group ? <IconButton icon="FileDown" label="Statements" onPress={onOpenStatements} testID="history-statements" /> : undefined
        }
      />
      {group ? null : (
        <View style={styles.head}>
          <View style={styles.gutter}>
            <HistorySearch testID="history-search" value={typed} maxLength={SEARCH_MAX} onChange={setTyped} onSubmit={flush} />
          </View>
          <FilterChips testID="history-chips" label="Filter transactions" items={FILTER_CHIPS} value={filter} onChange={setFilter} />
        </View>
      )}
      <FlatList
        testID="history-list"
        data={state ? [] : entries}
        keyExtractor={(entry) => entry.key}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={state}
        ListFooterComponent={
          isFetchNextPageError ? (
            <View style={styles.more} testID="history-more-error">
              <Text variant="secondary" accessibilityRole="alert">
                Couldn’t load more transactions.
              </Text>
              <Button label="Try again" variant="secondary" size="sm" icon="RotateCw" onPress={() => void fetchNextPage()} testID="history-more-retry" />
            </View>
          ) : isFetchingNextPage ? (
            <View style={styles.more}>
              <SkeletonRows count={2} testID="history-loading-more" />
            </View>
          ) : null
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={pulled} onRefresh={() => void onRefresh()} tintColor={colors.accent} />}
        style={styles.list}
        contentContainerStyle={[styles.content, { paddingTop: group ? HISTORY.bodyTop : HISTORY.partGap, paddingBottom: insets.bottom + HISTORY.bottom }]}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: { paddingTop: HISTORY.bodyTop, gap: HISTORY.partGap },
  gutter: { paddingHorizontal: layout.gutter },
  list: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: layout.gutter },
  loading: { gap: HISTORY.partGap },
  summary: { gap: space.md },
  empty: { paddingVertical: HISTORY.emptyPadV, paddingHorizontal: HISTORY.emptyPadH },
  more: { paddingTop: HISTORY.rowStack, gap: space.sm, alignItems: 'flex-start' },
  refreshFailed: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  refreshText: { flex: 1 },
});
