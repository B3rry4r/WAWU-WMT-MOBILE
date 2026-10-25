import { StyleSheet, View } from 'react-native';

import { AmountKeypad } from '@/components/amount-entry';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { FilterChips } from '@/components/FilterChips';
import { IconTile } from '@/components/IconTile';
import { KeyValueRow, ListRow } from '@/components/ListRow';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { SkeletonRows } from '@/components/Skeleton';
import { StatusPill } from '@/components/StatusPill';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { space } from '@/theme';

import type { Refusal } from './api';
import {
  formatMinor,
  PROVIDER_FEE_LINE,
  rateLine,
  SCREEN_TITLE,
  speedLine,
  statusLook,
  totalFromAccount,
  wawuFeeText,
  type AbroadSend,
  type Quote,
  type Recipient,
  type Source,
} from './model';

/** The Hub's pieces a screen needs, each as it is read: loading, failed, or the data. */
export type Read<T> = {
  data: T | undefined;
  loading: boolean;
  failed: boolean;
  retry: () => void;
};

// -- home ---------------------------------------------------------------------

export type AbroadHomeViewProps = {
  recipients: Read<Recipient[]>;
  onBack: () => void;
  onNew: () => void;
  onPick: (r: Recipient) => void;
};

/** Send abroad · the people saved (NUV-11): pick one to send, or add a new recipient. */
export function AbroadHomeView({ recipients, onBack, onNew, onPick }: AbroadHomeViewProps) {
  let body;
  if (recipients.loading) {
    body = <SkeletonRows count={3} testID="abroad-recipients-loading" />;
  } else if (recipients.failed) {
    body = (
      <ErrorState
        testID="abroad-recipients-error"
        icon="TriangleAlert"
        title="We couldn't load your recipients"
        message="Check your connection and try again."
        onRetry={recipients.retry}
      />
    );
  } else if ((recipients.data ?? []).length === 0) {
    body = (
      <EmptyState
        testID="abroad-recipients-empty"
        icon="Globe"
        title="Send money abroad"
        message="Pay a bank account or a mobile money wallet in another country. Add a recipient to start."
      />
    );
  } else {
    body = (
      <View style={styles.section}>
        <Text variant="label">Recipients</Text>
        <GroupedList>
          {(recipients.data ?? []).map((r) => (
            <ListRow
              key={r.id}
              testID={`abroad-recipient-${r.id}`}
              lead={<IconTile icon={r.method === 'mobile_money' ? 'Smartphone' : 'Landmark'} tone="accent" size={44} />}
              title={r.holderName}
              subtitle={r.summary}
              onPress={() => onPick(r)}
            />
          ))}
        </GroupedList>
      </View>
    );
  }
  return (
    <AuthFrame
      testID="abroad-home-screen"
      navTitle={SCREEN_TITLE}
      onBack={onBack}
      footer={<Button testID="abroad-new" label="New recipient" icon="Plus" full onPress={onNew} />}
    >
      <View style={styles.body}>{body}</View>
    </AuthFrame>
  );
}

// -- amount -------------------------------------------------------------------

export type QuoteRead =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'ready'; quote: Quote }
  | { state: 'refused'; refusal: Refusal }
  | { state: 'unanswered' };

export type AbroadAmountViewProps = {
  recipient: Recipient;
  sources: Read<Source[]>;
  /** Null until the Hub has listed the accounts to send from (nothing is typed, quoted or shown in a currency before then). */
  fromCurrency: string | null;
  onFromCurrency: (currency: string) => void;
  side: 'send' | 'receive';
  onSide: (side: 'send' | 'receive') => void;
  /** The typed amount as text, in the currency the side names. */
  text: string;
  amountMinor: number;
  onKey: (key: string) => void;
  onDelete: () => void;
  onClear: () => void;
  quote: QuoteRead;
  onBack: () => void;
  onContinue: () => void;
};

const SIDE_ITEMS = [
  { value: 'send', label: 'You send' },
  { value: 'receive', label: 'They receive' },
] as const;

function refusalLine(r: Refusal, fallback: string): string {
  const money = (minor: number) => formatMinor(minor, r.currency ?? fallback);
  if (r.code === 'amount_out_of_range' && r.minimumMinor !== null)
    return `${r.message || 'That amount is out of range.'} The least is ${money(r.minimumMinor)}.`;
  if (r.code === 'amount_out_of_range' && r.maximumMinor !== null)
    return `${r.message || 'That amount is out of range.'} The most is ${money(r.maximumMinor)}.`;
  return r.message || 'This could not be quoted. Nothing was taken.';
}

/**
 * Send abroad · the amount (NUV-11): which account to send from, how much, and the Hub's quote under it: what they get, the rate and
 * what it costs. The quote is asked for as the amount is typed (the screen's container waits for a pause); nothing here computes a rate.
 */
export function AbroadAmountView(p: AbroadAmountViewProps) {
  const sendCurrency = p.fromCurrency;
  const typedCurrency = p.side === 'send' && sendCurrency !== null ? sendCurrency : p.recipient.currency;
  const shown = `${formatMinor(0, typedCurrency).replace(/[0-9.,]+$/, '')}${p.text === '' ? '0' : p.text}`;
  const q = p.quote.state === 'ready' ? p.quote.quote : null;
  const chosen = p.sources.data?.find((s) => s.currency === sendCurrency);

  let quoteBlock;
  if (p.quote.state === 'loading') {
    quoteBlock = <SkeletonRows count={1} testID="abroad-quote-loading" />;
  } else if (q) {
    const rate = rateLine(q);
    quoteBlock = (
      <GroupedList testID="abroad-quote">
        <KeyValueRow
          testID="abroad-quote-send"
          label="You send"
          value={<Text variant="kvValue">{formatMinor(q.amountFromMinor, q.fromCurrency, q.fromDecimals)}</Text>}
        />
        <KeyValueRow
          testID="abroad-quote-get"
          label={`${p.recipient.holderName} gets`}
          value={<Text variant="kvValue">{formatMinor(q.amountToMinor, q.toCurrency, q.toDecimals)}</Text>}
        />
        {rate ? <KeyValueRow testID="abroad-quote-rate" label="Rate" value={<Text variant="kvValue">{rate}</Text>} /> : null}
        {q.providerFeeMinor === null ? null : (
          <KeyValueRow
            testID="abroad-quote-fee"
            label="Partner fee"
            value={<Text variant="kvValue">{formatMinor(q.providerFeeMinor, q.fromCurrency, q.fromDecimals)}</Text>}
          />
        )}
        <KeyValueRow
          testID="abroad-quote-speed"
          label="Arrives"
          value={
            <Text variant="kvValue">
              {speedLine(q.speed)
                .replace(/^Arrives: ?/, '')
                .replace(/^Arrives in /, 'In ')}
            </Text>
          }
        />
      </GroupedList>
    );
  } else if (p.quote.state === 'refused') {
    quoteBlock = (
      <Banner testID="abroad-quote-refused" tone="warning" title="This can't be quoted" body={refusalLine(p.quote.refusal, typedCurrency)} />
    );
  } else if (p.quote.state === 'unanswered') {
    quoteBlock = (
      <Banner
        testID="abroad-quote-unanswered"
        tone="warning"
        title="No quote yet"
        body="We could not reach the payment partner. Nothing was taken. Change the amount or try again."
      />
    );
  } else {
    quoteBlock = (
      <Text variant="meta" tone="textMuted" testID="abroad-quote-hint">
        Enter an amount to see what {p.recipient.holderName} gets.
      </Text>
    );
  }

  return (
    <AuthFrame
      testID="abroad-amount-screen"
      navTitle={SCREEN_TITLE}
      onBack={p.onBack}
      footer={<Button testID="abroad-continue" label="Continue" full disabled={q === null} onPress={p.onContinue} />}
    >
      <View style={styles.body}>
        <ListRow
          testID="abroad-amount-to"
          lead={<IconTile icon={p.recipient.method === 'mobile_money' ? 'Smartphone' : 'Landmark'} tone="accent" size={44} />}
          title={`To ${p.recipient.holderName}`}
          subtitle={p.recipient.summary}
        />
        {p.sources.loading ? (
          <SkeletonRows count={1} testID="abroad-sources-loading" />
        ) : p.sources.failed ? (
          <ErrorState
            testID="abroad-sources-error"
            icon="TriangleAlert"
            title="We couldn't load your accounts"
            message="Check your connection and try again."
            onRetry={p.sources.retry}
          />
        ) : (
          <View style={styles.section}>
            <Text variant="label">Send from</Text>
            <FilterChips<string>
              testID="abroad-sources"
              label="Send from"
              variant="option"
              items={(p.sources.data ?? []).map((s) => ({
                value: s.currency,
                label: s.currency,
              }))}
              value={sendCurrency ?? ''}
              onChange={p.onFromCurrency}
            />
            {chosen ? (
              <Text variant="meta" tone="textMuted" testID="abroad-source-balance">
                {chosen.availableMinor === null
                  ? `${chosen.name}`
                  : `${chosen.name}: ${formatMinor(chosen.availableMinor, chosen.currency, chosen.decimals)} available`}
              </Text>
            ) : null}
          </View>
        )}
        {sendCurrency === null ? (
          // No account is listed yet (loading or failed above), or the person holds none to send from: no amount is drawn in a guessed currency.
          !p.sources.loading && !p.sources.failed ? (
            <Text variant="secondary" tone="textMuted" testID="abroad-no-source">
              You have no account to send from yet.
            </Text>
          ) : null
        ) : (
          <>
            <SegmentedTabs<'send' | 'receive'> testID="abroad-side" label="Which amount" items={SIDE_ITEMS} value={p.side} onChange={p.onSide} />
            <Text variant="display" testID="abroad-amount" accessibilityLiveRegion="polite" style={styles.amount}>
              {shown}
            </Text>
            {quoteBlock}
            <AmountKeypad onKey={p.onKey} onDelete={p.onDelete} onClear={p.onClear} />
          </>
        )}
      </View>
    </AuthFrame>
  );
}

// -- review -------------------------------------------------------------------

export type AbroadReviewViewProps = {
  recipient: Recipient;
  quote: Quote;
  narration: string;
  onNarration: (v: string) => void;
  /** Whole seconds the quote is still held; 0 once it has run out. */
  secondsLeft: number;
  notice: string | null;
  failure: string | null;
  waiting: boolean;
  onBack: () => void;
  onSend: () => void;
  onNewQuote: () => void;
};

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** Send abroad · review before the PIN (NUV-11): every figure is the quote's; the PIN or the fingerprint opens over this. */
export function AbroadReviewView(p: AbroadReviewViewProps) {
  const q = p.quote;
  const total = totalFromAccount(q);
  const expired = p.secondsLeft <= 0;
  return (
    <AuthFrame
      testID="abroad-review-screen"
      navTitle="Review"
      onBack={p.onBack}
      footer={
        expired ? (
          <Button testID="abroad-new-quote" label="Get a new quote" full onPress={p.onNewQuote} />
        ) : (
          <Button
            testID="abroad-send"
            label={`Send ${formatMinor(q.amountFromMinor, q.fromCurrency, q.fromDecimals)}`}
            full
            loading={p.waiting}
            onPress={p.onSend}
          />
        )
      }
    >
      <View style={styles.body}>
        <Text variant="display" testID="abroad-review-get" style={styles.amount}>
          {formatMinor(q.amountToMinor, q.toCurrency, q.toDecimals)}
        </Text>
        <Text variant="secondary" tone="textMuted" style={styles.center}>{`to ${p.recipient.holderName}, ${p.recipient.summary}`}</Text>
        <GroupedList testID="abroad-review-rows">
          <KeyValueRow label="You send" value={<Text variant="kvValue">{formatMinor(q.amountFromMinor, q.fromCurrency, q.fromDecimals)}</Text>} />
          {q.rate ? <KeyValueRow label="Rate" value={<Text variant="kvValue">{rateLine(q) ?? ''}</Text>} /> : null}
          {q.providerFeeMinor === null ? null : (
            <KeyValueRow
              testID="abroad-review-partner-fee"
              label="Partner fee"
              value={<Text variant="kvValue">{formatMinor(q.providerFeeMinor, q.fromCurrency, q.fromDecimals)}</Text>}
            />
          )}
          <KeyValueRow label="WAWU fee" value={<Text variant="kvValue">{wawuFeeText(q)}</Text>} />
          {total === null ? null : (
            <KeyValueRow
              testID="abroad-review-total"
              label={`Total from your ${q.fromCurrency} account`}
              value={<Text variant="kvValue">{formatMinor(total, q.fromCurrency, q.fromDecimals)}</Text>}
            />
          )}
          <KeyValueRow
            label="Arrives"
            value={
              <Text variant="kvValue">
                {speedLine(q.speed)
                  .replace(/^Arrives: ?/, '')
                  .replace(/^Arrives in /, 'In ')}
              </Text>
            }
          />
        </GroupedList>
        {q.providerFeeMinor === null ? (
          <Text variant="meta" tone="textMuted" testID="abroad-provider-fee">
            {PROVIDER_FEE_LINE}
          </Text>
        ) : null}
        <TextField
          testID="abroad-narration"
          label="Note for their statement (optional)"
          value={p.narration}
          onChangeText={p.onNarration}
          maxLength={100}
        />
        <Text variant="meta" tone={expired ? 'danger' : 'textMuted'} testID="abroad-hold" accessibilityLiveRegion="polite">
          {expired ? 'This quote has run out.' : `This rate is held for ${clock(p.secondsLeft)}.`}
        </Text>
        {p.notice ? <Banner testID="abroad-notice" tone="info" title="Still confirming" body={p.notice} /> : null}
        {p.failure ? <Banner testID="abroad-failure" tone="danger" title="This was not sent" body={p.failure} /> : null}
      </View>
    </AuthFrame>
  );
}

// -- receipt ------------------------------------------------------------------

export type AbroadReceiptViewProps = {
  send: AbroadSend | undefined;
  loading: boolean;
  failed: boolean;
  retry: () => void;
  onDone: () => void;
  onAgain: () => void;
};

/** Send abroad · the receipt (NUV-11): where the send stands, from the Hub's record; read again until it is decided. */
export function AbroadReceiptView({ send, loading, failed, retry, onDone, onAgain }: AbroadReceiptViewProps) {
  if (!send) {
    return (
      <AuthFrame testID="abroad-receipt-screen" navTitle="Receipt" onBack={onDone}>
        {loading ? (
          <SkeletonRows count={4} testID="abroad-receipt-loading" />
        ) : failed ? (
          <ErrorState
            testID="abroad-receipt-error"
            icon="TriangleAlert"
            title="We couldn't load this send"
            message="Check your connection and try again."
            onRetry={retry}
          />
        ) : null}
      </AuthFrame>
    );
  }
  const look = statusLook(send.status);
  return (
    <AuthFrame
      testID="abroad-receipt-screen"
      navTitle="Receipt"
      onBack={onDone}
      footer={
        <View style={styles.footer}>
          <Button testID="abroad-done" label="Done" full onPress={onDone} />
          <Button testID="abroad-again" label="Send again" variant="secondary" full onPress={onAgain} />
        </View>
      }
    >
      <View style={styles.body}>
        <View style={styles.center}>
          <StatusPill testID="abroad-status" label={look.label} tone={look.tone} />
        </View>
        <Text variant="display" testID="abroad-receipt-get" style={styles.amount}>
          {formatMinor(send.amountToMinor, send.toCurrency, send.toDecimals)}
        </Text>
        <Text variant="secondary" tone="textMuted" style={styles.center} testID="abroad-status-line">
          {send.failureReason ?? look.line}
        </Text>
        <GroupedList testID="abroad-receipt-rows">
          <KeyValueRow label="To" value={<Text variant="kvValue">{send.recipient.holderName}</Text>} />
          <KeyValueRow label="Where" value={<Text variant="kvValue">{send.recipient.summary}</Text>} />
          <KeyValueRow
            label="You sent"
            value={<Text variant="kvValue">{formatMinor(send.amountFromMinor, send.fromCurrency, send.fromDecimals)}</Text>}
          />
          {send.rate ? (
            <KeyValueRow label="Rate" value={<Text variant="kvValue">{`1 ${send.fromCurrency} = ${send.rate} ${send.toCurrency}`}</Text>} />
          ) : null}
          <KeyValueRow
            label="Partner fee"
            value={
              <Text variant="kvValue" testID="abroad-receipt-fee">
                {send.providerFeeMinor === null ? 'Not named yet' : formatMinor(send.providerFeeMinor, send.fromCurrency, send.fromDecimals)}
              </Text>
            }
          />
          <KeyValueRow label="WAWU fee" value={<Text variant="kvValue">{wawuFeeText(send)}</Text>} />
          <KeyValueRow label="Arrives" value={<Text variant="kvValue">{send.speed}</Text>} />
        </GroupedList>
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg },
  section: { gap: space.sm },
  amount: { textAlign: 'center' },
  center: { alignItems: 'center', textAlign: 'center' },
  footer: { gap: space.sm },
});
