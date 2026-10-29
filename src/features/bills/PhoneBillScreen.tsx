import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Button } from '@/components/Button';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { fetchMe, settingsKeys } from '@/features/settings/api/hub';
import { font, space } from '@/theme';

import { billsKeys, fetchBillers, fetchCategories, fetchItems, validateCustomer } from './api';
import { billDraft } from './draft';
import { BILLS_TITLE } from './BillsScreen';
import { distinctItems, itemOf } from './ItemsScreen';
import { categoryCodeOf, categoryOfKind, kindInfo } from './kinds';
import {
  amountBoxText,
  amountKobo,
  amountProblem,
  amountProblemWords,
  groupPhone,
  limitsOf,
  meterLine,
  METER_CHECK_DELAY_MS,
  NAIRA_SIGN,
  ownPhone,
  PHONE_CHECK_MIN_DIGITS,
  phoneDigits,
  presetText,
  takeNaira,
} from './model';
import { AmountPresets, BillField, HintLine, NetworkChips, PackageRow, SectionLabel, StepChip, billMetrics } from './parts';
import { useSettled } from './useSettled';

const PART_GAP = 14;
const LABEL_GAP = 10;
const CHECK_STALE_MS = 5 * 60_000;
/** S8's quick amounts, as the board draws them (₦500, ₦1,000, ₦2,000, ₦5,000): the provider names none. One outside the number's limits is not drawn. */
export const AIRTIME_PRESETS_KOBO: readonly number[] = [50000, 100000, 200000, 500000];

export type PhoneBillScreenProps = {
  kind: 'airtime' | 'data';
  onBack: () => void;
  /** The X on "Paying for": back to the kinds of bill (S2). */
  onChangeCategory: () => void;
  /** The bill is put together: the review (S5). */
  onContinue: () => void;
};

/**
 * S8 · Airtime, and Data on the same layout with the company's bundles in place of the quick amounts (BRIEF S2). The networks are the
 * provider's billers for the kind (`GET /bills/categories/{code}/billers`) and none is chosen for the person: sending airtime to the wrong
 * network is not undone. A network's bundles are what it sells (`GET /bills/billers/{code}/items`); the provider lists airtime as one
 * code under every network, so that one is the item and the person types or taps the amount. The phone number is checked by the Hub
 * once it is eleven digits, and "Mine" fills the account's own number. Buy needs a chosen network, a confirmed number and an amount.
 */
export function PhoneBillScreen({ kind, onBack, onChangeCategory, onContinue }: PhoneBillScreenProps) {
  const info = kindInfo(kind);
  const [network, setNetwork] = useState<string | null>(null);
  const [itemCode, setItemCode] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const settled = useSettled(phone, METER_CHECK_DELAY_MS);

  const categories = useQuery({ queryKey: billsKeys.categories, queryFn: fetchCategories }, queryClient);
  const category = categories.data ? categoryOfKind(kind, categories.data) : undefined;
  const code = category ? categoryCodeOf(category) : '';
  const billers = useQuery({ queryKey: billsKeys.billers(code), queryFn: () => fetchBillers(code), enabled: code !== '' }, queryClient);
  const items = useQuery({ queryKey: billsKeys.items(network ?? ''), queryFn: () => fetchItems(network ?? ''), enabled: network !== null }, queryClient);
  const me = useQuery({ queryKey: settingsKeys.me, queryFn: fetchMe }, queryClient);
  const mine = ownPhone(me.data?.phone);

  const rows = items.data ? distinctItems(items.data) : null;
  const showList = kind === 'data' || (rows !== null && rows.length > 1);
  const item = rows ? (rows.length === 1 && kind === 'airtime' ? rows[0] : rows.find((r) => r.item_code === itemCode)) : undefined;
  const fixed = item !== undefined && item.amount > 0;

  const check = useQuery(
    {
      queryKey: [...billsKeys.all, 'validate', item?.item_code ?? '', settled] as const,
      queryFn: () => validateCustomer(item?.item_code ?? '', settled),
      enabled: item !== undefined && settled.length >= PHONE_CHECK_MIN_DIGITS,
      retry: false,
      staleTime: CHECK_STALE_MS,
    },
    queryClient,
  );

  const failed = categories.isError ? categories : billers.isError ? billers : null;
  if (failed) {
    const offline = isApiError(failed.error) && failed.error.kind === 'network';
    return (
      <AuthFrame testID="phone-bill-error" navTitle={BILLS_TITLE} onBack={onBack}>
        <ErrorState
          title="Couldn't load this"
          message={offline ? 'No connection. Check your internet and try again.' : 'We could not reach the bills service. Try again in a moment.'}
          icon={offline ? 'WifiOff' : 'TriangleAlert'}
          onRetry={() => void failed.refetch()}
        />
      </AuthFrame>
    );
  }
  if (categories.isSuccess && !category) {
    return (
      <AuthFrame testID="phone-bill-none" navTitle={BILLS_TITLE} onBack={onBack}>
        <EmptyState icon="Receipt" title={`No ${info.label.toLowerCase()} to buy right now`} message="Try again in a moment." />
      </AuthFrame>
    );
  }
  if (!billers.isSuccess) {
    return (
      <AuthFrame testID="phone-bill-loading" navTitle={BILLS_TITLE} onBack={onBack}>
        <LoadingView label="Loading networks" testID="phone-bill-skeleton">
          <View style={styles.body}>
            <Skeleton height={billMetrics.chipPadV * 2 + 20} radius={billMetrics.chipRadius} />
            <Skeleton height={billMetrics.networkHeight} radius={billMetrics.chipRadius} />
          </View>
        </LoadingView>
      </AuthFrame>
    );
  }

  const line = meterLine(phone, settled, { isFetching: check.isFetching, isError: check.isError, error: check.error, data: check.data }, PHONE_CHECK_MIN_DIGITS);
  const limits = limitsOf(check.data);
  const kobo = item === undefined ? null : fixed ? item.amount * 100 : amountKobo(amount);
  const problem = item === undefined || fixed ? null : amountProblem(limits, kobo);
  const ready = network !== null && item !== undefined && line.kind === 'found' && phone === settled && kobo !== null && kobo > 0 && problem === null;
  const chosenBiller = billers.data.find((b) => b.biller_code === network);
  const presets = AIRTIME_PRESETS_KOBO.filter((p) => p >= limits.minimumKobo && p <= limits.maximumKobo);

  const buy = () => {
    if (!ready || !category || !chosenBiller || !item || !check.data) return;
    billDraft.start({
      kind,
      categoryName: category.name,
      categoryCode: code,
      biller: { code: chosenBiller.biller_code, name: chosenBiller.name },
      item: itemOf(item),
      customer: phone,
      customerName: check.data.name,
      amount: Math.round((kobo as number) / 100),
    });
    onContinue();
  };
  const buyLabel = kind === 'airtime' ? (kobo ? `Buy ${NAIRA_SIGN}${amountBoxText(String(Math.round(kobo / 100)))} airtime` : 'Buy airtime') : 'Continue';

  return (
    <AuthFrame testID="phone-bill" navTitle={BILLS_TITLE} onBack={onBack} footer={<Button testID="phone-bill-buy" label={buyLabel} full disabled={!ready} onPress={buy} />}>
      <View style={styles.body}>
        <StepChip testID="bills-step-category" label="Paying for" value={info.label} clearLabel="Change what you are paying for" onClear={onChangeCategory} />
        <View style={styles.labelled}>
          <SectionLabel>{info.pickBiller}</SectionLabel>
          <NetworkChips
            testID="networks"
            networks={billers.data.map((b) => ({ code: b.biller_code, name: b.name }))}
            chosen={network}
            onPick={(next) => {
              setNetwork(next);
              setItemCode(null);
            }}
          />
        </View>
        <BillField
          testID="phone-number"
          label={info.numberLabel}
          value={groupPhone(phone)}
          onChangeText={(typed) => setPhone(phoneDigits(typed))}
          keyboardType="number-pad"
          mono
          invalid={line.kind === 'not_found'}
          maxLength={13}
          trail={
            mine ? (
              <Pressable testID="phone-mine" accessibilityRole="button" accessibilityLabel="Use my number" hitSlop={space.md} onPress={() => setPhone(mine)}>
                <Text variant="caption" tone="accentFg" style={font(700)}>
                  Mine
                </Text>
              </Pressable>
            ) : null
          }
        >
          {line.kind === 'found' ? <HintLine testID="phone-line" tone="positive" icon="CircleCheck" strong words={line.words} /> : null}
          {line.kind === 'checking' ? <HintLine testID="phone-line" tone="textMuted" words="Checking this number" /> : null}
          {line.kind === 'not_found' ? <HintLine testID="phone-line" tone="danger" icon="CircleAlert" words="We couldn't confirm this number. Check it." /> : null}
          {line.kind === 'problem' ? (
            <HintLine testID="phone-line" tone="danger" icon="CircleAlert" words={line.message} action={{ label: 'Try again', onPress: () => void check.refetch() }} />
          ) : null}
        </BillField>
        {network !== null && items.isError ? (
          <ErrorState
            testID="items-error"
            title="Couldn't load what they sell"
            message="We could not reach the bills service. Try again in a moment."
            icon="TriangleAlert"
            onRetry={() => void items.refetch()}
          />
        ) : null}
        {network !== null && items.isPending ? <Skeleton height={billMetrics.fieldValue * 3} radius={billMetrics.chipRadius} /> : null}
        {showList && rows ? (
          <View testID="bundles" style={styles.labelled}>
            <SectionLabel>{info.pickItem}</SectionLabel>
            <View>
              {rows.map((r) => (
                <PackageRow
                  key={r.item_code}
                  testID={`item-${r.item_code}`}
                  name={r.name}
                  amountKobo={r.amount > 0 ? r.amount * 100 : null}
                  chosen={itemCode === r.item_code}
                  onPress={() => setItemCode(r.item_code)}
                />
              ))}
            </View>
          </View>
        ) : null}
        {item !== undefined && !fixed ? (
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
        ) : null}
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: PART_GAP, paddingBottom: space.lg },
  labelled: { gap: LABEL_GAP },
});
