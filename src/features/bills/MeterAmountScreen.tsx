import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { fieldMetrics } from '@/components/TextField';
import { space } from '@/theme';

import { billsCodes, billsKeys, electricityBillersQuery, holdBillsOff, previewMeter, type ElectricityBiller } from './api';
import { BILLS_TITLE } from './BillsScreen';
import {
  amountBoxText,
  amountKobo,
  amountProblem,
  amountProblemWords,
  billerChipWords,
  groupMeter,
  meterDigits,
  meterLine,
  METER_CHECK_DELAY_MS,
  METER_CHECK_MIN_DIGITS,
  METER_MAX_DIGITS,
  NAIRA_SIGN,
  presetText,
  takeAmountChange,
} from './model';
import { AmountPresets, BillField, HintLine, StepChip, billMetrics } from './parts';
import { useSettled } from './useSettled';

/** design/_gen/services.js `meterBody`: the body stacks the two chips, the two fields and the chips 14 apart. */
const PART_GAP = 14;
const CHECK_STALE_MS = 5 * 60_000;

export type MeterAmountScreenProps = {
  /** The disco code from S3's row. */
  code: string;
  onBack: () => void;
  /** The X on "Paying for": back to the kinds of bill (S2). */
  onChangeCategory: () => void;
  /** The X on "Biller": back to the companies (S3). */
  onChangeBiller: () => void;
  /** The code is not on the list now (Fintava stopped listing it): the companies again (S3). */
  onMissing: () => void;
  /** The list or the check says bills are not on: S2 draws S13. */
  onUnavailable: () => void;
};

/**
 * S4 · Meter and amount, and S10 when Fintava does not know the number. The person types the meter number; once they stop,
 * the Hub asks Fintava for the name and address on it, and S4 says them under the box (S10 says "We couldn't find this
 * meter. Check the number." and reddens the box). Then they pick an amount: one of the quick amounts that fit this company's
 * own minimum and maximum, or their own, which must fit them too. A meter found and an amount that fits are what
 * Continue will need (BILLS-02 adds Continue, which opens S5; R-47: it is not drawn here).
 */
export function MeterAmountScreen({ code, onBack, onChangeCategory, onChangeBiller, onMissing, onUnavailable }: MeterAmountScreenProps) {
  const billers = useQuery(electricityBillersQuery, queryClient);
  const biller = billers.data?.billers.find((b) => b.code === code);
  const gone = billers.isSuccess && billers.data.available && biller === undefined;
  const unavailable = billers.isSuccess && !billers.data.available;

  useEffect(() => {
    if (unavailable) onUnavailable();
    else if (gone) onMissing();
  }, [unavailable, gone, onUnavailable, onMissing]);

  if (billers.isPending || unavailable || gone || !biller) {
    if (billers.isError) {
      const offline = isApiError(billers.error) && billers.error.kind === 'network';
      return (
        <AuthFrame testID="meter-error" navTitle={BILLS_TITLE} onBack={onBack}>
          <ErrorState
            title="Couldn't load this company"
            message={offline ? 'No connection. Check your internet and try again.' : 'We could not reach the bills service. Try again in a moment.'}
            icon={offline ? 'WifiOff' : 'TriangleAlert'}
            onRetry={() => void billers.refetch()}
          />
        </AuthFrame>
      );
    }
    return (
      <AuthFrame testID="meter-loading" navTitle={BILLS_TITLE} onBack={onBack}>
        <LoadingView label="Loading" testID="meter-skeleton">
          <View style={styles.body}>
            <Skeleton height={billMetrics.chipPadV * 2 + 20} radius={billMetrics.chipRadius} />
            <Skeleton height={billMetrics.chipPadV * 2 + 20} radius={billMetrics.chipRadius} />
            <Skeleton height={fieldMetrics.height} radius={fieldMetrics.radius} />
            <Skeleton height={fieldMetrics.height} radius={fieldMetrics.radius} />
          </View>
        </LoadingView>
      </AuthFrame>
    );
  }

  return <MeterAmountForm biller={biller} onBack={onBack} onChangeCategory={onChangeCategory} onChangeBiller={onChangeBiller} />;
}

type FormProps = Pick<MeterAmountScreenProps, 'onBack' | 'onChangeCategory' | 'onChangeBiller'> & { biller: ElectricityBiller };

function MeterAmountForm({ biller, onBack, onChangeCategory, onChangeBiller }: FormProps) {
  const [meter, setMeter] = useState('');
  const [amount, setAmount] = useState('');
  const settled = useSettled(meter, METER_CHECK_DELAY_MS);

  const check = useQuery(
    {
      queryKey: billsKeys.meter(biller.code, settled),
      queryFn: () => previewMeter(biller.code, settled),
      enabled: settled.length >= METER_CHECK_MIN_DIGITS,
      // An answer is final for that number: a refused one is not asked again by the cache, a person asks again by editing.
      retry: false,
      staleTime: CHECK_STALE_MS,
    },
    queryClient,
  );
  const line = meterLine(meter, settled, { isFetching: check.isFetching, isError: check.isError, error: check.error, data: check.data });

  // The bills service stopped being usable while the person was on this screen: the list S2 will draw is replaced by "not
  // available" at once, so S2 opens as S13 and never as the normal screen for a moment. That answer is held (R2-U1): the Hub's
  // company list may still answer, and nothing asks it again on its own; the person pulls to refresh on S2 to ask. The Hub
  // keeps "off" for its cache window, so a pull straight away still says off. The screen above this form sees the list change
  // and hands over to S2 (once).
  const told = useRef(false);
  const stopped = check.isError && isApiError(check.error) && check.error.code === billsCodes.unavailable;
  useEffect(() => {
    if (stopped && !told.current) {
      told.current = true;
      holdBillsOff();
    }
  }, [stopped]);

  const kobo = amountKobo(amount);
  const problem = amountProblem(biller, kobo);

  return (
    <AuthFrame testID="meter-amount" navTitle={BILLS_TITLE} onBack={onBack}>
      <View style={styles.body}>
        <StepChip testID="bills-step-category" label="Paying for" value="Electricity" clearLabel="Change what you are paying for" onClear={onChangeCategory} />
        <StepChip testID="bills-step-biller" label="Biller" value={billerChipWords(biller)} clearLabel="Change the company" onClear={onChangeBiller} />
        <BillField
          testID="meter-number"
          label="Meter number"
          value={groupMeter(meter)}
          onChangeText={(typed) => setMeter(meterDigits(typed))}
          keyboardType="number-pad"
          mono
          invalid={line.kind === 'not_found'}
          maxLength={METER_MAX_DIGITS + Math.floor((METER_MAX_DIGITS - 1) / 4)}
        >
          {line.kind === 'found' ? <HintLine testID="meter-line" tone="positive" icon="CircleCheck" strong words={line.words} /> : null}
          {line.kind === 'checking' ? <HintLine testID="meter-line" tone="textMuted" words="Checking this meter" /> : null}
          {line.kind === 'not_found' ? <HintLine testID="meter-line" tone="danger" icon="CircleAlert" words="We couldn't find this meter. Check the number." /> : null}
          {line.kind === 'unconfirmed' ? (
            <HintLine testID="meter-line" tone="danger" icon="CircleAlert" words="We couldn't confirm this meter." action={{ label: 'Try again', onPress: () => void check.refetch() }} />
          ) : null}
          {line.kind === 'problem' ? (
            <HintLine testID="meter-line" tone="danger" icon="CircleAlert" words={line.message} action={{ label: 'Try again', onPress: () => void check.refetch() }} />
          ) : null}
        </BillField>
        <BillField
          testID="amount"
          label="Amount"
          value={amountBoxText(amount)}
          onChangeText={(typed) => setAmount((was) => takeAmountChange(amountBoxText(was), typed, was))}
          keepCaret
          placeholder="Amount"
          keyboardType="decimal-pad"
          prefix={NAIRA_SIGN}
          prefixTestID="amount-glyph"
          valueSize={billMetrics.amountValue}
          invalid={problem !== null}
        >
          {problem ? <HintLine testID="amount-line" tone="danger" icon="CircleAlert" words={amountProblemWords(problem)} /> : null}
        </BillField>
        <AmountPresets testID="amount-presets" presetsKobo={biller.presets.map((p) => p.amountKobo)} chosenKobo={kobo} onPick={(picked) => setAmount(presetText(picked))} />
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: PART_GAP, paddingBottom: space.lg },
});
