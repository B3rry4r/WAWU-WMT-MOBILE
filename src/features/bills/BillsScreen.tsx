import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { space, useWawu } from '@/theme';

import { billsKeys, fetchCategories, mineQuery } from './api';
import { kindInfo, kindOfRecord, kindsListed, recentNumber, type BillKind } from './kinds';
import { CategoryTile, RecentRow, SectionLabel, billMetrics } from './parts';

export const BILLS_TITLE = 'Pay a bill';

/**
 * design/_gen/services.js `billsHome`: the body stacks its parts 22 apart, and the kinds of bill sit in a two column grid 10
 * apart, Recent under them.
 */
const SECTION_GAP = 22;
const TILE_ROW_H = billMetrics.tilePad * 2 + billMetrics.tileIcon;
/** How many of the person's bills Recent shows. Default (agent), owner may override. */
const RECENT_ROWS = 5;

export type BillsScreenProps = {
  onBack: () => void;
  /** A kind of bill was tapped: its first screen. */
  onOpen: (kind: BillKind) => void;
  /** A recent bill was tapped: its receipt. */
  onOpenBill: (id: string) => void;
};

const categoriesQuery = { queryKey: billsKeys.categories, queryFn: fetchCategories } as const;

/**
 * S2 · Pay a bill (R-102). The kinds are the provider's own list (`GET /bills/categories`) matched to Airtime, Data, Electricity and
 * Cable TV: a kind the provider does not list is not drawn (R-47). Recent is what the person has paid for (`GET /bills/mine`); a
 * list that cannot be read, or is empty, draws no Recent (the board draws no empty state for it). There is no switched-off screen:
 * bills are live, and a provider that cannot be reached is a failure with Try again.
 *
 * What the canvas draws and is added by the task that builds where it leads (R-47): the Bill reminders banner (BILLS-05).
 */
export function BillsScreen({ onBack, onOpen, onOpenBill }: BillsScreenProps) {
  const { colors } = useWawu();
  const categories = useQuery(categoriesQuery, queryClient);
  const mine = useQuery(mineQuery, queryClient);
  const [pulled, setPulled] = useState(false);
  const onRefresh = async () => {
    setPulled(true);
    try {
      await Promise.all([categories.refetch(), mine.refetch()]);
    } finally {
      setPulled(false);
    }
  };

  let body;
  if (categories.isPending) {
    body = (
      <LoadingView label="Loading bill types" testID="bills-loading">
        <View style={styles.part}>
          <Skeleton width="45%" height={14} radius={7} />
          <View style={styles.grid}>
            <Skeleton height={TILE_ROW_H} radius={18} style={styles.cell} />
            <Skeleton height={TILE_ROW_H} radius={18} style={styles.cell} />
          </View>
        </View>
      </LoadingView>
    );
  } else if (categories.isError) {
    const offline = isApiError(categories.error) && categories.error.kind === 'network';
    body = (
      <ErrorState
        testID="bills-error"
        title="Bills didn't load"
        message={offline ? 'No connection. Check your internet and try again.' : 'We could not reach the bills service. Try again in a moment.'}
        icon={offline ? 'WifiOff' : 'TriangleAlert'}
        onRetry={() => void categories.refetch()}
      />
    );
  } else {
    const kinds = kindsListed(categories.data);
    const recent = mine.data?.slice(0, RECENT_ROWS) ?? [];
    body =
      kinds.length === 0 ? (
        <EmptyState testID="bills-none" icon="Receipt" title="No bills to pay right now" message="Pull down to check again in a moment." />
      ) : (
        <>
          <View style={styles.part}>
            <SectionLabel>What are you paying for?</SectionLabel>
            <View style={styles.grid}>
              {kinds.map((k) => (
                <View key={k.kind} style={styles.cell}>
                  <CategoryTile testID={`bills-${k.kind}`} icon={k.icon} label={k.label} onPress={() => onOpen(k.kind)} />
                </View>
              ))}
              {kinds.length % 2 === 1 ? <View style={styles.cell} /> : null}
            </View>
          </View>
          {recent.length > 0 ? (
            <View testID="bills-recent" style={styles.recent}>
              <SectionLabel>Recent</SectionLabel>
              {recent.map((bill) => {
                const kind = kindOfRecord(bill.category);
                return (
                  <RecentRow
                    key={bill.id}
                    testID={`bills-recent-${bill.id}`}
                    icon={kind ? kindInfo(kind).icon : 'Receipt'}
                    title={bill.billerName}
                    line={recentNumber(kind, bill.customerRef)}
                    amountKobo={bill.amount * 100}
                    onPress={() => onOpenBill(bill.id)}
                  />
                );
              })}
            </View>
          ) : null}
        </>
      );
  }

  return (
    <AuthFrame
      testID="bills"
      navTitle={BILLS_TITLE}
      onBack={onBack}
      refreshControl={<RefreshControl refreshing={pulled} onRefresh={() => void onRefresh()} tintColor={colors.accent} />}
    >
      <View style={styles.body}>{body}</View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: SECTION_GAP },
  part: { gap: space.md - 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: billMetrics.tileGap },
  cell: { width: '48%', flexGrow: 1 },
  recent: { gap: space.xs },
});
