import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { queryClient } from '@/api/query';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { space } from '@/theme';

import { billsKeys, fetchBillers, fetchCategories } from './api';
import { billDraft } from './draft';
import { BILLS_TITLE } from './BillsScreen';
import { categoryCodeOf, categoryOfKind, kindInfo, type BillKind } from './kinds';
import { billerInitials, billsLoadFailure } from './model';
import { BillerRow, SectionLabel, StepChip, billMetrics } from './parts';

/** design/_gen/services.js `billerPick`: the body stacks the chip and the list 16 apart, the label 6 above the rows. */
const PART_GAP = space.lg;
const LIST_GAP = 6;
const SKELETON_ROWS = 5;

export type BillersScreenProps = {
  /** Electricity or cable TV: the two kinds that start by choosing a company (airtime and data choose a network on their own screen). */
  kind: Extract<BillKind, 'electricity' | 'cable'>;
  onBack: () => void;
  /** The X on "Paying for": back to the kinds of bill (S2). */
  onChangeCategory: () => void;
  /** A company was tapped and the bill started: what it sells, or its number (S9, S4). */
  onPick: () => void;
};

/**
 * S3 · Biller: every company the provider lists in this kind's category (`GET /bills/categories/{code}/billers`). A row's code
 * starts the bill and goes on. The provider says nothing about a company's plan, so a row carries only its name.
 */
export function BillersScreen({ kind, onBack, onChangeCategory, onPick }: BillersScreenProps) {
  const info = kindInfo(kind);
  const categories = useQuery({ queryKey: billsKeys.categories, queryFn: fetchCategories }, queryClient);
  const category = categories.data ? categoryOfKind(kind, categories.data) : undefined;
  const code = category ? categoryCodeOf(category) : '';
  const billers = useQuery({ queryKey: billsKeys.billers(code), queryFn: () => fetchBillers(code), enabled: code !== '' }, queryClient);
  const failed = categories.isError ? categories : billers.isError ? billers : null;

  let list;
  if (failed) {
    const failure = billsLoadFailure(failed.error);
    list = (
      <ErrorState
        testID="billers-error"
        title="Couldn't load the companies"
        message={failure.message}
        icon={failure.offline ? 'WifiOff' : 'TriangleAlert'}
        onRetry={failure.canRetry ? () => void failed.refetch() : undefined}
      />
    );
  } else if (categories.isSuccess && !category) {
    list = <EmptyState testID="billers-none" icon="Receipt" title={`No ${info.label.toLowerCase()} companies right now`} message="Try again in a moment." />;
  } else if (billers.isSuccess && billers.data.length === 0) {
    list = <EmptyState testID="billers-none" icon="Receipt" title={`No ${info.label.toLowerCase()} companies right now`} message="Try again in a moment." />;
  } else if (!billers.isSuccess || !category) {
    list = (
      <LoadingView label="Loading companies" testID="billers-loading">
        <View style={styles.skeletons}>
          {Array.from({ length: SKELETON_ROWS }, (_, i) => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton width={billMetrics.badge} height={billMetrics.badge} radius={billMetrics.badgeRadius} />
              <View style={styles.skeletonLines}>
                <Skeleton width="50%" height={billMetrics.rowTitle} radius={8} />
              </View>
            </View>
          ))}
        </View>
      </LoadingView>
    );
  } else {
    list = (
      <View testID="billers-list">
        {billers.data.map((biller) => (
          <BillerRow
            key={biller.biller_code}
            testID={`biller-${biller.biller_code}`}
            name={biller.name}
            initials={billerInitials(biller.name)}
            onPress={() => {
              billDraft.start({ kind, categoryName: category.name, categoryCode: code, biller: { code: biller.biller_code, name: biller.name } });
              onPick();
            }}
          />
        ))}
      </View>
    );
  }

  return (
    <AuthFrame testID="billers" navTitle={BILLS_TITLE} onBack={onBack}>
      <View style={styles.body}>
        <StepChip testID="bills-step-category" label="Paying for" value={info.label} clearLabel="Change what you are paying for" onClear={onChangeCategory} />
        <View style={styles.listPart}>
          <SectionLabel>{info.pickBiller}</SectionLabel>
          {list}
        </View>
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: PART_GAP },
  listPart: { gap: LIST_GAP },
  skeletons: { gap: space.lg },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  skeletonLines: { flex: 1, gap: space.sm },
});
