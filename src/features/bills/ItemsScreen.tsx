import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Button } from '@/components/Button';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { space } from '@/theme';

import { billsKeys, fetchItems, type BillItem } from './api';
import { billDraft, useBillDraft } from './draft';
import { BILLS_TITLE } from './BillsScreen';
import { kindInfo } from './kinds';
import { PackageRow, SectionLabel, StepChip, billMetrics } from './parts';

const PART_GAP = 14;
const LIST_GAP = 6;
const SKELETON_ROWS = 4;

export type ItemsScreenProps = {
  onBack: () => void;
  /** The X on "Paying for": back to the kinds of bill (S2). */
  onChangeCategory: () => void;
  /** The X on "Biller": back to the companies (S3). */
  onChangeBiller: () => void;
  /** Nothing was started (a screen opened on its own): the kinds of bill (S2). */
  onMissing: () => void;
  /** A package is chosen, or the company sells only one (`auto`: the step is passed over, so it leaves no screen behind): the number (S4). */
  onContinue: (auto: boolean) => void;
};

/** The first row for each item code: the provider lists airtime's one code under every network, and a repeat is not a second choice. */
export function distinctItems(items: readonly BillItem[]): BillItem[] {
  const seen = new Set<string>();
  return items.filter((item) => (seen.has(item.item_code) ? false : (seen.add(item.item_code), true)));
}

export const itemOf = (item: BillItem) => ({ code: item.item_code, name: item.name, amount: item.amount, label: item.label_name ?? null });

/**
 * S9 · Cable package, and the same step for an electricity company that sells more than one plan. What the company sells comes from
 * the provider (`GET /bills/billers/{code}/items`): a name and, when it has one, a price in whole naira. A company that sells one
 * thing needs no choice, so this step is passed over (the website does the same). Continue takes the chosen one to the number.
 */
export function ItemsScreen({ onBack, onChangeCategory, onChangeBiller, onMissing, onContinue }: ItemsScreenProps) {
  const draft = useBillDraft();
  const biller = draft?.biller;
  const [chosen, setChosen] = useState<string | null>(null);
  const items = useQuery({ queryKey: billsKeys.items(biller?.code ?? ''), queryFn: () => fetchItems(biller?.code ?? ''), enabled: Boolean(biller) }, queryClient);
  const rows = items.data ? distinctItems(items.data) : null;
  const only = rows && rows.length === 1 ? rows[0] : null;

  useEffect(() => {
    if (!draft || !biller) onMissing();
  }, [draft, biller, onMissing]);
  // One thing for sale: it is the choice, and the step is passed over.
  useEffect(() => {
    if (!only) return;
    billDraft.update({ item: itemOf(only) });
    onContinue(true);
  }, [only, onContinue]);

  if (!draft || !biller) return null;
  const info = kindInfo(draft.kind);

  let list;
  if (items.isError) {
    const offline = isApiError(items.error) && items.error.kind === 'network';
    list = (
      <ErrorState
        testID="items-error"
        title="Couldn't load what they sell"
        message={offline ? 'No connection. Check your internet and try again.' : 'We could not reach the bills service. Try again in a moment.'}
        icon={offline ? 'WifiOff' : 'TriangleAlert'}
        onRetry={() => void items.refetch()}
      />
    );
  } else if (rows && rows.length === 0) {
    list = <EmptyState testID="items-none" icon="Receipt" title="Nothing to pay for here right now" message="Go back and pick another company." />;
  } else if (!rows || only) {
    list = (
      <LoadingView label="Loading" testID="items-loading">
        <View style={styles.skeletons}>
          {Array.from({ length: SKELETON_ROWS }, (_, i) => (
            <Skeleton key={i} height={billMetrics.rowMin - space.sm} radius={12} />
          ))}
        </View>
      </LoadingView>
    );
  } else {
    list = (
      <View testID="items-list">
        {rows.map((item) => (
          <PackageRow
            key={item.item_code}
            testID={`item-${item.item_code}`}
            name={item.name}
            amountKobo={item.amount > 0 ? item.amount * 100 : null}
            chosen={chosen === item.item_code}
            onPress={() => setChosen(item.item_code)}
          />
        ))}
      </View>
    );
  }

  const pick = rows?.find((r) => r.item_code === chosen);
  return (
    <AuthFrame
      testID="items"
      navTitle={BILLS_TITLE}
      onBack={onBack}
      footer={
        <Button
          testID="items-continue"
          label="Continue"
          full
          disabled={!pick}
          onPress={() => {
            if (!pick) return;
            billDraft.update({ item: itemOf(pick) });
            onContinue(false);
          }}
        />
      }
    >
      <View style={styles.body}>
        <StepChip testID="bills-step-category" label="Paying for" value={info.label} clearLabel="Change what you are paying for" onClear={onChangeCategory} />
        <StepChip testID="bills-step-biller" label="Biller" value={biller.name} clearLabel="Change the company" onClear={onChangeBiller} />
        <View style={styles.listPart}>
          <SectionLabel>{info.pickItem}</SectionLabel>
          {list}
        </View>
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: PART_GAP },
  listPart: { gap: LIST_GAP },
  skeletons: { gap: space.sm },
});
