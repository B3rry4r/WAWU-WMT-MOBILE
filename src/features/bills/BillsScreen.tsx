import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { Banner } from '@/features/auth/Banner';
import { space, useWawu } from '@/theme';

import { electricityBillersQuery } from './api';
import { CategoryTile, SectionLabel, billMetrics } from './parts';

export const BILLS_TITLE = 'Pay a bill';

/**
 * design/_gen/services.js `billsHome` and `notOn`: the body stacks its parts 22 apart, and the kinds of bill sit in a two
 * column grid 10 apart. S13 greys the whole group to 45% and puts the info note above it.
 */
const SECTION_GAP = 22;
const NOT_LIVE_FADE = 0.45;
const TILE_ROW_H = billMetrics.tilePad * 2 + billMetrics.tileIcon;

export type BillsScreenProps = {
  onBack: () => void;
  /** Electricity was tapped: the companies (S3). */
  onOpenElectricity: () => void;
};

/**
 * S2 · Pay a bill, and S13 when the bills service says it is not on. It reads the electricity list from the Hub, so whether
 * the tile opens or is greyed is Fintava's answer, never a switch: no company listed as available, or a bills service
 * that cannot be used, draws S13. Fintava not answering is a failure with Try again, not S13.
 *
 * S13 reached from a meter check (the service is off while the company list still answers) is held: nothing refreshes the
 * list on its own, and the person pulls to refresh to ask again (R2-U1; the Hub keeps "off" for its cache window).
 *
 * What the canvas draws and is added by the task that builds where it leads (R-47): the Bill reminders banner (BILLS-05),
 * the Airtime, Data and Cable TV tiles (BILLS-03), and the Recent list, which has no source until a bill can be paid
 * (BILLS-04 writes the bills a person has paid; BACKEND_GAPS G-bills recent).
 */
export function BillsScreen({ onBack, onOpenElectricity }: BillsScreenProps) {
  const { colors } = useWawu();
  const billers = useQuery(electricityBillersQuery, queryClient);
  const [pulled, setPulled] = useState(false);
  const onRefresh = async () => {
    setPulled(true);
    try {
      await billers.refetch();
    } finally {
      setPulled(false);
    }
  };

  let body;
  if (billers.isPending) {
    body = (
      <LoadingView label="Loading bill types" testID="bills-loading">
        <View style={styles.part}>
          <Skeleton width="55%" height={billMetrics.rowLine} />
          <View style={styles.grid}>
            <View style={styles.cell}>
              <Skeleton height={TILE_ROW_H} radius={billMetrics.chipRadius + 4} />
            </View>
            <View style={styles.cell} />
          </View>
        </View>
      </LoadingView>
    );
  } else if (billers.isError) {
    const offline = isApiError(billers.error) && billers.error.kind === 'network';
    body = (
      <ErrorState
        testID="bills-error"
        title="Bills didn't load"
        message={offline ? 'No connection. Check your internet and try again.' : 'We could not reach the bills service. Try again in a moment.'}
        icon={offline ? 'WifiOff' : 'TriangleAlert'}
        onRetry={() => void billers.refetch()}
      />
    );
  } else if (!billers.data.available) {
    body = (
      <>
        <Banner
          tone="info"
          title="Bill payments aren't switched on yet"
          body="You'll be able to pay airtime, data, electricity and cable from your wallet here soon."
          testID="bills-not-live"
        />
        <View style={[styles.part, { opacity: NOT_LIVE_FADE }]} testID="bills-not-live-tiles">
          <SectionLabel>What are you paying for?</SectionLabel>
          <View style={styles.grid}>
            <View style={styles.cell}>
              <CategoryTile icon="Zap" label="Electricity" testID="bills-electricity" />
            </View>
            <View style={styles.cell} />
          </View>
        </View>
      </>
    );
  } else {
    body = (
      <View style={styles.part}>
        <SectionLabel>What are you paying for?</SectionLabel>
        <View style={styles.grid}>
          <View style={styles.cell}>
            <CategoryTile icon="Zap" label="Electricity" onPress={onOpenElectricity} testID="bills-electricity" />
          </View>
          <View style={styles.cell} />
        </View>
      </View>
    );
  }

  return (
    <AuthFrame
      testID="bills-home"
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
  grid: { flexDirection: 'row', gap: billMetrics.tileGap },
  cell: { flex: 1 },
});
