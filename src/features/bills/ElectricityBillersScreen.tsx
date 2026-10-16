import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { space } from '@/theme';

import { electricityBillersQuery } from './api';
import { BILLS_TITLE } from './BillsScreen';
import { billerInitials, planWord } from './model';
import { BillerRow, SectionLabel, StepChip, billMetrics } from './parts';

/** design/_gen/services.js `billerPick`: the body stacks the chip and the list 16 apart, the label 6 above the rows. */
const PART_GAP = space.lg;
const LIST_GAP = 6;
const SKELETON_ROWS = 5;

export type ElectricityBillersScreenProps = {
  onBack: () => void;
  /** The X on "Paying for": back to the kinds of bill (S2). */
  onChangeCategory: () => void;
  /** A company and plan was tapped: its meter and amount (S4). */
  onPick: (code: string) => void;
  /** The list says bills are not on now: S2 draws S13. */
  onUnavailable: () => void;
};

/**
 * S3 · Biller: every electricity company Fintava lists as available, one row for each company and plan, saying which plan
 * it is. A company whose code Fintava lists as not available is not here. The row's code goes on to S4.
 */
export function ElectricityBillersScreen({ onBack, onChangeCategory, onPick, onUnavailable }: ElectricityBillersScreenProps) {
  const billers = useQuery(electricityBillersQuery, queryClient);
  const unavailable = billers.isSuccess && !billers.data.available;
  useEffect(() => {
    if (unavailable) onUnavailable();
  }, [unavailable, onUnavailable]);

  let list;
  if (billers.isPending || unavailable) {
    list = (
      <LoadingView label="Loading electricity companies" testID="billers-loading">
        <View style={styles.skeletons}>
          {Array.from({ length: SKELETON_ROWS }, (_, i) => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton width={billMetrics.badge} height={billMetrics.badge} radius={billMetrics.badgeRadius} />
              <View style={styles.skeletonLines}>
                <Skeleton width="50%" height={billMetrics.rowTitle} radius={8} />
                <Skeleton width="30%" height={billMetrics.rowLine} radius={8} />
              </View>
            </View>
          ))}
        </View>
      </LoadingView>
    );
  } else if (billers.isError) {
    const offline = isApiError(billers.error) && billers.error.kind === 'network';
    list = (
      <ErrorState
        testID="billers-error"
        title="Couldn't load electricity companies"
        message={offline ? 'No connection. Check your internet and try again.' : 'We could not reach the bills service. Try again in a moment.'}
        icon={offline ? 'WifiOff' : 'TriangleAlert'}
        onRetry={() => void billers.refetch()}
      />
    );
  } else {
    list = (
      <View testID="billers-list">
        {billers.data.billers.map((biller) => (
          <BillerRow
            key={biller.code}
            testID={`biller-${biller.code}`}
            name={biller.name}
            initials={billerInitials(biller.name)}
            plan={planWord(biller.plan)}
            onPress={() => onPick(biller.code)}
          />
        ))}
      </View>
    );
  }

  return (
    <AuthFrame testID="billers" navTitle={BILLS_TITLE} onBack={onBack}>
      <View style={styles.body}>
        <StepChip testID="bills-step-category" label="Paying for" value="Electricity" clearLabel="Change what you are paying for" onClear={onChangeCategory} />
        <View style={styles.listPart}>
          <SectionLabel>Who are you paying?</SectionLabel>
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
