import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { KeyValueRow, ListRow } from '@/components/ListRow';
import { formatMoney } from '@/components/Money';
import { ScreenFrame } from '@/components/ScreenFrame';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { SwitchRow } from '@/components/SwitchRow';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { Toast } from '@/components/Toast';
import { useOpenWalletEntry } from '@/features/open-wallet/entry';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { newRequestKey } from '@/features/wallet/api/settings';
import { radius, space } from '@/theme';

import { productQuery, reserveOrder, type CapitalProductDetail } from './api';
import { amountProblem, cleanAmountText, dayText, earlyLine, koboFromText, rateText, termText, whyNotOrderable, WORDS } from './model';
import { DeductionRows, GAP, openDocument } from './parts';

export type ProductScreenProps = {
  productId: string;
  onBack: () => void;
  /** The reservation was made: its review (and the PIN) is next. */
  onReserved: (orderId: string) => void;
  onSetPin: () => void;
};

/**
 * A product, with every term the provider states as a fact (rate, term, least and most, what leaving early means), its documents, and
 * the amount to invest. The provider's own description is not drawn: it is marketing, and it can promise what the app does not. Fixed returns can be locked for the whole
 * term (no early exit); the person must say they opened and agree to the documents. Review reserves the product for a few minutes at
 * the provider's quote (no money moves, no PIN): the quote on the next screen is the one that will be paid. One Idempotency-Key per
 * intent, so a double tap reserves once; a different amount or choice takes a new one.
 */
export function ProductScreen({ productId, onBack, onReserved }: ProductScreenProps) {
  const owner = useSessionAccount(undefined);
  const entry = useOpenWalletEntry();
  const product = useQuery({ ...productQuery(owner, productId) }, queryClient);
  const [amountText, setAmountText] = useState('');
  const [lock, setLock] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const attempt = useRef<{ key: string; amountKobo: number; lock: boolean } | null>(null);

  if (product.isPending) {
    return (
      <ScreenFrame title="Product" onBack={onBack} gap={GAP} idPrefix="capital-product" testID="capital-product-screen">
        <LoadingView label="Loading the product" testID="capital-product-loading">
          <Skeleton height={120} radius={radius.card} />
          <Skeleton height={200} radius={radius.card} />
        </LoadingView>
      </ScreenFrame>
    );
  }
  if (product.isError || !product.data) {
    const error = product.error;
    return (
      <ScreenFrame title="Product" onBack={onBack} gap={GAP} idPrefix="capital-product" testID="capital-product-screen">
        <ErrorState
          testID="capital-product-error"
          icon={isApiError(error) && error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
          title="We could not load this product"
          message={isApiError(error) ? error.message : 'Something went wrong. Try again.'}
          onRetry={() => void product.refetch()}
        />
      </ScreenFrame>
    );
  }

  const p: CapitalProductDetail = product.data;
  const kobo = koboFromText(amountText);
  const range = amountProblem(kobo, p, p.terms.wawuMinKobo, p.terms.wawuMaxKobo);
  const canReview = p.orderable && kobo !== null && range === null && agreed && !busy;
  const fee = kobo === null ? 0 : p.terms.wawuFeeFlatKobo + Math.floor((kobo * p.terms.wawuFeeBasisPoints) / 10_000);

  const review = async () => {
    if (!canReview || kobo === null) return;
    setBusy(true);
    setProblem(null);
    // A new amount or choice is a new intent; the same intent sends the same key again.
    if (!attempt.current || attempt.current.amountKobo !== kobo || attempt.current.lock !== lock) attempt.current = { key: newRequestKey(), amountKobo: kobo, lock };
    const outcome = await reserveOrder({ productId: p.id, amountKobo: kobo, lockInvestment: lock && p.kind === 'fixed_return', key: attempt.current.key });
    setBusy(false);
    switch (outcome.kind) {
      case 'done':
        onReserved(outcome.order.id);
        return;
      case 'no_wallet':
        entry.open();
        return;
      case 'short':
        setProblem(outcome.message || 'You need more money in your wallet for this.');
        return;
      case 'unanswered':
        setNotice('We did not hear back. Tap Review to try again.');
        return;
      case 'refused':
        attempt.current = null;
        setProblem(outcome.message || 'We could not hold this for you. Nothing was taken.');
        return;
      default:
        attempt.current = null;
        setProblem('We could not hold this for you. Nothing was taken.');
    }
  };

  return (
    <>
      <ScreenFrame title={p.name} titleLines={2} onBack={onBack} gap={GAP} keyboard idPrefix="capital-product" testID="capital-product-screen">
        {!p.orderable ? <Banner testID="capital-product-closed" tone="info" title={whyNotOrderable(p.notOrderableReason)} body="This cannot be ordered right now." /> : null}
        <GroupedList testID="capital-product-terms">
          {p.kind === 'fixed_return' ? (
            <>
              <KeyValueRow label="Rate" value={rateText(p.annualRate)} />
              <KeyValueRow label="Term" value={termText(p.tenorDays)} />
            </>
          ) : (
            <>
              {p.issuerName ? <KeyValueRow label="Issuer" value={p.issuerName} /> : null}
              {p.offerPriceKobo !== null ? <KeyValueRow label="Price a share" value={formatMoney(p.offerPriceKobo)} /> : null}
              {p.lockPeriodDays !== null ? <KeyValueRow label="Held for" value={termText(p.lockPeriodDays)} /> : null}
            </>
          )}
          {p.minKobo !== null ? <KeyValueRow label="Least" value={formatMoney(p.minKobo)} /> : null}
          {p.maxKobo !== null ? <KeyValueRow label="Most" value={formatMoney(p.maxKobo)} /> : null}
          {p.opensAt ? <KeyValueRow label="Opens" value={dayText(p.opensAt)} /> : null}
          {p.closesAt ? <KeyValueRow label="Closes" value={dayText(p.closesAt)} /> : null}
          <DeductionRows list={p.deductibles} />
        </GroupedList>
        <Text variant="secondary" tone="textMuted" testID="capital-product-early">
          {earlyLine(p)}
        </Text>

        {p.orderable ? (
          <>
            <TextField
              testID="capital-amount"
              label="Amount in naira"
              value={amountText}
              onChangeText={(t) => {
                setAmountText(cleanAmountText(t));
                setProblem(null);
              }}
              keyboardType="decimal-pad"
              placeholder="0.00"
              error={range ?? undefined}
              hint={fee > 0 ? `WAWU's fee on top: ${formatMoney(fee)}` : undefined}
            />
            {p.kind === 'fixed_return' && p.allowEarlyWithdrawal !== false ? (
              <GroupedList>
                <SwitchRow testID="capital-lock" title="Lock my money" subtitle="No early exit until the term ends" on={lock} onChange={setLock} />
              </GroupedList>
            ) : null}
            {p.documents.length > 0 ? (
              <GroupedList testID="capital-documents">
                {p.documents.map((d) => (
                  <ListRow key={d.url} testID="capital-document" title={d.name} subtitle="Opens in your browser" onPress={() => openDocument(d.url)} />
                ))}
              </GroupedList>
            ) : null}
            <GroupedList>
              <SwitchRow testID="capital-agree" title={WORDS.agree} on={agreed} onChange={setAgreed} />
            </GroupedList>
            {problem ? <Banner testID="capital-product-problem" tone="danger" title="We could not hold this for you" body={problem} /> : null}
            <View style={styles.foot}>
              <Button testID="capital-review" label={WORDS.review} onPress={() => void review()} size="lg" full disabled={!canReview} loading={busy} />
            </View>
          </>
        ) : null}
      </ScreenFrame>
      {notice ? <Toast message={notice} tone="alert" placement="top" lines={2} onHide={() => setNotice(null)} testID="capital-notice" /> : null}
    </>
  );
}

const styles = StyleSheet.create({ foot: { marginTop: space.sm } });
