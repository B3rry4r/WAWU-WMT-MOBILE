import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { queryClient } from '@/api/query';
import { Button } from '@/components/Button';
import { formatMoney } from '@/components/Money';
import { Text } from '@/components/Text';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { font, space } from '@/theme';

import { billsKeys, validateCustomer } from './api';
import { billDraft, useBillDraft } from './draft';
import { BILLS_TITLE } from './BillsScreen';
import { kindInfo } from './kinds';
import {
  amountBoxText,
  amountKobo,
  amountProblem,
  amountProblemWords,
  groupMeter,
  limitsOf,
  meterDigits,
  meterLine,
  METER_CHECK_DELAY_MS,
  METER_CHECK_MIN_DIGITS,
  METER_MAX_DIGITS,
  NAIRA_SIGN,
  presetText,
  takeNaira,
} from './model';
import { AmountPresets, BillField, HintLine, StepChip, billMetrics } from './parts';
import { useSettled } from './useSettled';

/** design/_gen/services.js `meterBody`: the body stacks the chips, the fields and the quick amounts 14 apart. */
const PART_GAP = 14;
const CHECK_STALE_MS = 5 * 60_000;
/** S4's quick amounts, as the board draws them (₦2,000, ₦5,000, ₦10,000, ₦20,000): the provider names none. A quick amount outside the company's limits is not drawn. */
export const METER_PRESETS_KOBO: readonly number[] = [200000, 500000, 1000000, 2000000];

export type NumberScreenProps = {
  onBack: () => void;
  /** The X on "Paying for": back to the kinds of bill (S2). */
  onChangeCategory: () => void;
  /** The X on "Biller": back to the companies (S3). */
  onChangeBiller: () => void;
  /** Nothing was started: the kinds of bill (S2). */
  onMissing: () => void;
  /** The number is confirmed and the amount fits: the review (S5). */
  onContinue: () => void;
};

/**
 * S4 · Meter and amount, S10 when the provider does not know the number, and the cable smartcard step in S4's layout. The person
 * types the number; once they stop, the Hub asks the provider for the name on it (`POST /bills/validate`) and S4 says it under the box
 * (S10 says "We couldn't find this meter. Check the number." and reddens the box). An electricity bill then takes an amount: one of
 * the quick amounts, or their own, in whole naira, which must fit the company's limits when the provider named any. A package with a
 * price (cable) is that amount, and is shown as such. Continue needs a confirmed number and an amount that fits.
 */
export function NumberScreen({ onBack, onChangeCategory, onChangeBiller, onMissing, onContinue }: NumberScreenProps) {
  const draft = useBillDraft();
  const item = draft?.item;
  const biller = draft?.biller;
  const [number, setNumber] = useState('');
  const [amount, setAmount] = useState('');
  const settled = useSettled(number, METER_CHECK_DELAY_MS);

  useEffect(() => {
    if (!draft || !biller || !item) onMissing();
  }, [draft, biller, item, onMissing]);

  const check = useQuery(
    {
      queryKey: [...billsKeys.all, 'validate', item?.code ?? '', settled] as const,
      queryFn: () => validateCustomer(item?.code ?? '', settled),
      enabled: Boolean(item) && settled.length >= METER_CHECK_MIN_DIGITS,
      // An answer is final for that number: a refused one is not asked again by the cache, a person asks again by editing.
      retry: false,
      staleTime: CHECK_STALE_MS,
    },
    queryClient,
  );

  if (!draft || !biller || !item) return null;
  const info = kindInfo(draft.kind);
  const line = meterLine(number, settled, { isFetching: check.isFetching, isError: check.isError, error: check.error, data: check.data });
  const fixed = item.amount > 0;
  const limits = limitsOf(check.data);
  const kobo = fixed ? item.amount * 100 : amountKobo(amount);
  const problem = fixed ? null : amountProblem(limits, kobo);
  const ready = line.kind === 'found' && kobo !== null && kobo > 0 && problem === null && number === settled;
  const presets = METER_PRESETS_KOBO.filter((p) => p >= limits.minimumKobo && p <= limits.maximumKobo);

  const next = () => {
    if (!ready || !check.data) return;
    billDraft.update({ customer: number, customerName: check.data.name, amount: Math.round((kobo as number) / 100) });
    onContinue();
  };

  return (
    <AuthFrame
      testID="number"
      navTitle={BILLS_TITLE}
      onBack={onBack}
      footer={<Button testID="number-continue" label="Continue" full disabled={!ready} onPress={next} />}
    >
      <View style={styles.body}>
        <StepChip testID="bills-step-category" label="Paying for" value={info.label} clearLabel="Change what you are paying for" onClear={onChangeCategory} />
        <StepChip testID="bills-step-biller" label="Biller" value={biller.name} clearLabel="Change the company" onClear={onChangeBiller} />
        <BillField
          testID="meter-number"
          label={info.numberLabel}
          value={groupMeter(number)}
          onChangeText={(typed) => setNumber(meterDigits(typed))}
          keyboardType="number-pad"
          mono
          invalid={line.kind === 'not_found'}
          maxLength={METER_MAX_DIGITS + Math.floor((METER_MAX_DIGITS - 1) / 4)}
        >
          {line.kind === 'found' ? <HintLine testID="meter-line" tone="positive" icon="CircleCheck" strong words={line.words} /> : null}
          {line.kind === 'checking' ? <HintLine testID="meter-line" tone="textMuted" words={`Checking this ${info.numberWord}`} /> : null}
          {line.kind === 'not_found' ? <HintLine testID="meter-line" tone="danger" icon="CircleAlert" words={`We couldn't find this ${info.numberWord}. Check the number.`} /> : null}
          {line.kind === 'problem' ? (
            <HintLine testID="meter-line" tone="danger" icon="CircleAlert" words={line.message} action={{ label: 'Try again', onPress: () => void check.refetch() }} />
          ) : null}
        </BillField>
        {fixed ? (
          <View testID="number-package" style={styles.package}>
            <Text variant="secondary" tone="textMuted">
              {item.name}
            </Text>
            <Text variant="body" style={font(700)}>
              {formatMoney(item.amount * 100, { decimals: false })}
            </Text>
          </View>
        ) : (
          <>
            <BillField
              testID="amount"
              label="Amount"
              value={amountBoxText(amount)}
              onChangeText={(typed) => setAmount((was) => takeNaira(typed, was))}
              keepCaret
              placeholder="Amount"
              keyboardType="number-pad"
              prefix={NAIRA_SIGN}
              prefixTestID="amount-glyph"
              valueSize={billMetrics.amountValue}
              invalid={problem !== null}
            >
              {problem ? <HintLine testID="amount-line" tone="danger" icon="CircleAlert" words={amountProblemWords(problem)} /> : null}
            </BillField>
            <AmountPresets testID="amount-presets" presetsKobo={presets} chosenKobo={kobo} onPick={(picked) => setAmount(presetText(picked))} />
          </>
        )}
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: PART_GAP, paddingBottom: space.lg },
  package: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.xs },
});
