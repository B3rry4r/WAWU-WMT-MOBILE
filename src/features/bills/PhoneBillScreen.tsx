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

import { billsKeys, fetchBillers, fetchCategories, fetchItems } from './api';
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
  NAIRA_SIGN,
  ownPhone,
  PHONE_INVALID_WORDS,
  PHONE_OK_WORDS,
  phoneDigits,
  phoneLine,
  presetText,
  takeNaira,
} from './model';
import { AmountPresets, BillField, HintLine, NetworkChips, PackageRow, SectionLabel, StepChip, billMetrics } from './parts';

const PART_GAP = 14;
const LABEL_GAP = 10;
/** The box holds "+234 808 992 5524" (17 characters) before it is read as the local number: a paste is never cut. */
const PHONE_BOX_MAX = 20;
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
 * provider's billers for the kind (`GET /bills/categories/{code}/billers`, by the category's CODE) and none is chosen for the person:
 * sending airtime to the wrong network is not undone. A network's bundles are what it sells (`GET /bills/billers/{code}/items`); the
 * provider lists airtime as the same code (AT099) under every network, so when the items have one distinct code it is the item and
 * the person types or taps the amount; a genuine choice (data bundles) is a list with prices. The phone number is checked on the
 * phone and not by the provider (BILLS-10: the provider's validation is for meters and smartcards, and answers "not found" for a
 * phone number): a Nigerian mobile number is eleven digits from 07, 08 or 09, and "Mine" fills the account's own number. Buy needs a
 * chosen network, a Nigerian mobile number and an amount.
 */
export function PhoneBillScreen({ kind, onBack, onChangeCategory, onContinue }: PhoneBillScreenProps) {
  const info = kindInfo(kind);
  const [network, setNetwork] = useState<string | null>(null);
  const [itemCode, setItemCode] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');

  const categories = useQuery({ queryKey: billsKeys.categories, queryFn: fetchCategories }, queryClient);
  const category = categories.data ? categoryOfKind(kind, categories.data) : undefined;
  const code = category ? categoryCodeOf(category) : '';
  const billers = useQuery({ queryKey: billsKeys.billers(code), queryFn: () => fetchBillers(code), enabled: code !== '' }, queryClient);
  const items = useQuery({ queryKey: billsKeys.items(network ?? ''), queryFn: () => fetchItems(network ?? ''), enabled: network !== null }, queryClient);
  const me = useQuery({ queryKey: settingsKeys.me, queryFn: fetchMe }, queryClient);
  const mine = ownPhone(me.data?.phone);

  const rows = items.data ? distinctItems(items.data) : null;
  // The web's rule: one distinct item code is no choice, so it selects itself (airtime's AT099 under every network); a genuine choice is a list.
  const showList = rows !== null && rows.length > 1;
  const item = rows ? (rows.length === 1 ? rows[0] : rows.find((r) => r.item_code === itemCode)) : undefined;
  const fixed = item !== undefined && item.amount > 0;

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

  const line = phoneLine(phone);
  const limits = limitsOf(undefined);
  const kobo = item === undefined ? null : fixed ? item.amount * 100 : amountKobo(amount);
  const problem = item === undefined || fixed ? null : amountProblem(limits, kobo);
  const ready = network !== null && item !== undefined && line.kind === 'ok' && kobo !== null && kobo > 0 && problem === null;
  const chosenBiller = billers.data.find((b) => b.biller_code === network);
  const presets = AIRTIME_PRESETS_KOBO.filter((p) => p >= limits.minimumKobo && p <= limits.maximumKobo);

  const buy = () => {
    if (!ready || !category || !chosenBiller || !item) return;
    billDraft.start({
      kind,
      categoryName: category.name,
      categoryCode: code,
      biller: { code: chosenBiller.biller_code, name: chosenBiller.name },
      item: itemOf(item),
      customer: phone,
      customerName: null,
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
          invalid={line.kind === 'invalid'}
          maxLength={PHONE_BOX_MAX}
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
          {line.kind === 'ok' ? <HintLine testID="phone-line" tone="positive" icon="CircleCheck" strong words={PHONE_OK_WORDS} /> : null}
          {line.kind === 'invalid' ? <HintLine testID="phone-line" tone="danger" icon="CircleAlert" words={PHONE_INVALID_WORDS} /> : null}
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
        {rows !== null && rows.length === 0 ? (
          <EmptyState testID="items-none" icon="Receipt" title="Nothing to buy from this network right now" message="Pick another network, or try again in a moment." />
        ) : null}
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
