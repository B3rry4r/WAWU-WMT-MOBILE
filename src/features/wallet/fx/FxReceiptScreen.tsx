import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { KeyValueRow, rowMetrics } from '@/components/ListRow';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { StatusPill } from '@/components/StatusPill';
import { Text } from '@/components/Text';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { longDateTime } from '@/features/wallet/history/lagosTime';
import { font, radius, space } from '@/theme';

import { chainName, formatMinor, formatTrim, rateLine, SHORT_NAME, type FxChain, type QuoteCode } from './amount';
import { sendQuery, swapQuery, type FxSend, type FxSwap } from './api';
import { FxAmount } from './parts';

const RECEIPT = { mark: 88, headGap: 12, headTop: 20, figure: 36, poll: 4000 } as const;

export const SWAP_CONFIRMING = 'The provider is still finishing this swap. This page updates by itself. Do not swap again.';
export const SEND_CONFIRMING = 'The network has not confirmed this send yet. This page updates by itself. Do not send it again.';

/** "0x4f2a...9c1d": the start and end of an address, for a line and a share. */
export function shortAddress(address: string): string {
  return address.length <= 14 ? address : `${address.slice(0, 6)}...${address.slice(-4)}`;
}

type Row = { key: string; label: string; value: string; wrap?: boolean };

/** The receipt's rows for a swap: each is the Hub's (the rate and the fees are the quote's, the dates the swap's). */
export function swapRows(s: FxSwap): Row[] {
  const from = s.fromCurrency as QuoteCode;
  const to = s.toCurrency as QuoteCode;
  return [
    { key: 'from', label: 'From', value: SHORT_NAME[from] },
    { key: 'to', label: 'To', value: SHORT_NAME[to] },
    { key: 'gave', label: 'You swapped', value: formatMinor(s.amountFromMinor, from, s.fromDecimals) },
    { key: 'got', label: 'You got', value: formatMinor(s.amountToMinor, to, s.toDecimals) },
    { key: 'rate', label: 'Rate', value: rateLine({ fromCurrency: from, toCurrency: to, fromDecimals: s.fromDecimals, toDecimals: s.toDecimals, rate: s.rate }) ?? 'Not available' },
    { key: 'provider', label: 'Nuvion fee', value: s.providerFeeMinor === null ? 'None stated' : s.providerFeeMinor === 0 ? 'No fee' : formatMinor(s.providerFeeMinor, from, s.fromDecimals) },
    { key: 'wawu', label: 'WAWU fee', value: s.wawuFeeMinor === 0 ? 'No fee' : formatMinor(s.wawuFeeMinor, from, s.fromDecimals) },
    { key: 'date', label: 'Date', value: longDateTime(s.createdAt) },
    { key: 'ref', label: 'Reference', value: s.id, wrap: true },
  ];
}

/** The receipt's rows for a crypto send. The network's fee is what the provider charged on top, named only once it has taken the send. */
export function sendRows(s: FxSend): Row[] {
  const code = s.currency as QuoteCode;
  return [
    { key: 'network', label: 'Network', value: chainName(s.chain as FxChain) },
    { key: 'to', label: 'To', value: s.address, wrap: true },
    { key: 'amount', label: 'Amount', value: formatMinor(s.amountMinor, code, s.decimals) },
    { key: 'provider', label: 'Network fee', value: s.providerFeeMinor === null ? 'None stated' : s.providerFeeMinor === 0 ? 'No fee' : formatMinor(s.providerFeeMinor, code, s.decimals) },
    { key: 'wawu', label: 'WAWU fee', value: s.wawuFeeMinor === 0 ? 'No fee' : formatMinor(s.wawuFeeMinor, code, s.decimals) },
    { key: 'date', label: 'Date', value: longDateTime(s.createdAt) },
    { key: 'ref', label: 'Reference', value: s.id, wrap: true },
  ];
}

export type FxReceiptProps = { kind: 'swap' | 'send'; id: string; onDone: () => void };

/**
 * W12's receipt for a swap and for a crypto send: the mark, the figure, the status, the rows, Share and Done. A swap or send the provider has
 * not finished is Pending, read again by its id until it is decided (never done twice); a failed one says why in the provider's words.
 */
export function FxReceiptScreen({ kind, id, onDone }: FxReceiptProps) {
  const owner = useSessionAccount(undefined);
  const [notice, setNotice] = useState<string | null>(null);
  const swap = useQuery(
    { ...swapQuery(owner, kind === 'swap' ? id : null), refetchInterval: (q) => (q.state.data?.status === 'pending' ? RECEIPT.poll : false) },
    queryClient,
  );
  const send = useQuery(
    { ...sendQuery(owner, kind === 'send' ? id : null), refetchInterval: (q) => (q.state.data?.status === 'pending' ? RECEIPT.poll : false) },
    queryClient,
  );
  const read = kind === 'swap' ? swap : send;
  const op = kind === 'swap' ? swap.data : send.data;

  const share = async () => {
    if (!op) return;
    setNotice(null);
    const rows = kind === 'swap' ? swapRows(op as FxSwap) : sendRows(op as FxSend);
    try {
      await Share.share({ message: [kind === 'swap' ? 'Swap receipt' : 'Crypto send receipt', ...rows.map((r) => `${r.label}: ${r.value}`)].join('\n') });
    } catch {
      setNotice('Sharing isn’t available on this device.');
    }
  };

  let body;
  if (op) {
    body = kind === 'swap' ? <SwapReceipt swap={op as FxSwap} /> : <SendReceipt send={op as FxSend} />;
  } else if (read.isError && isApiError(read.error) && read.error.kind === 'not_found') {
    body = <EmptyState testID="fx-receipt-missing" icon="Receipt" title="We couldn’t find that receipt" message="It may belong to another account." />;
  } else if (read.isError) {
    body = (
      <ErrorState
        testID="fx-receipt-error"
        icon={isApiError(read.error) && read.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
        title="We couldn't load your receipt"
        message={isApiError(read.error) && read.error.message ? read.error.message : 'Check your connection and try again.'}
        onRetry={() => void read.refetch()}
      />
    );
  } else {
    body = (
      <LoadingView label="Loading your receipt" testID="fx-receipt-loading">
        <View style={styles.body}>
          <Skeleton width={RECEIPT.mark} height={RECEIPT.mark} radius={RECEIPT.mark / 2} />
          <Skeleton height={rowMetrics.pairMinHeight * 5} radius={radius.card} />
        </View>
      </LoadingView>
    );
  }

  return (
    <AuthFrame
      testID="fx-receipt-screen"
      bare
      footer={
        <View style={styles.footer}>
          {notice ? (
            <Text variant="errorLine" accessibilityRole="alert">
              {notice}
            </Text>
          ) : null}
          <View style={styles.buttons}>
            {op?.status === 'completed' ? (
              <View style={styles.half}>
                <Button testID="fx-receipt-share" label="Share receipt" icon="Share" variant="secondary" full onPress={() => void share()} />
              </View>
            ) : null}
            <View style={styles.half}>
              <Button testID="fx-receipt-done" label="Done" full onPress={onDone} />
            </View>
          </View>
        </View>
      }
    >
      <View style={styles.body}>{body}</View>
    </AuthFrame>
  );
}

function Head({ status, figure, line, confirming, failure }: { status: 'pending' | 'completed' | 'failed'; figure: React.ReactNode; line: string; confirming: string; failure: string }) {
  const done = status === 'completed';
  const pending = status === 'pending';
  return (
    <View testID="fx-receipt-head" style={styles.head}>
      <IconTile icon={done ? 'Check' : pending ? 'Clock' : 'X'} tone={done ? 'in' : pending ? 'warn' : 'danger'} size={RECEIPT.mark} strokeWidth={2.4} />
      {figure}
      <Text variant="secondary" tone="textSecondary" style={styles.centre} testID="fx-receipt-line">
        {line}
      </Text>
      <StatusPill
        testID="fx-receipt-status"
        label={done ? 'Completed' : pending ? 'Pending' : 'Failed'}
        tone={done ? 'positive' : pending ? 'warning' : 'danger'}
        icon={done ? 'Check' : pending ? 'Clock' : 'X'}
      />
      {pending ? (
        <Text variant="muted" style={styles.centre} testID="fx-receipt-confirming">
          {confirming}
        </Text>
      ) : null}
      {status === 'failed' ? (
        <Text variant="muted" style={styles.centre} testID="fx-receipt-failure">
          {failure}
        </Text>
      ) : null}
    </View>
  );
}

function Rows({ rows }: { rows: Row[] }) {
  return (
    <GroupedList testID="fx-receipt-card">
      {rows.map((row) => (
        <KeyValueRow
          key={row.key}
          testID={`fx-receipt-${row.key}`}
          label={row.label}
          value={
            <Text variant="kvValue" numberOfLines={row.wrap ? 3 : 1} selectable={row.wrap} style={row.wrap ? styles.wrapped : undefined}>
              {row.value}
            </Text>
          }
        />
      ))}
    </GroupedList>
  );
}

function SwapReceipt({ swap }: { swap: FxSwap }) {
  const from = swap.fromCurrency as QuoteCode;
  const to = swap.toCurrency as QuoteCode;
  return (
    <>
      <Head
        status={swap.status}
        figure={
          <View style={styles.figureRow}>
            <FxAmount testID="fx-receipt-figure" minor={swap.amountToMinor} code={to} decimals={swap.toDecimals} size={RECEIPT.figure} weight={700} />
            {swap.status === 'completed' ? (
              <Text variant="title" style={styles.word}>
                got
              </Text>
            ) : null}
          </View>
        }
        line={`From ${formatTrim(swap.amountFromMinor, from, swap.fromDecimals)} of your ${SHORT_NAME[from].toLowerCase()}`}
        confirming={SWAP_CONFIRMING}
        failure={swap.failureReason?.trim() || 'This swap did not go through. Nothing moved.'}
      />
      {swap.status !== 'failed' ? <Rows rows={swapRows(swap)} /> : null}
    </>
  );
}

function SendReceipt({ send }: { send: FxSend }) {
  const code = send.currency as QuoteCode;
  return (
    <>
      <Head
        status={send.status}
        figure={
          <View style={styles.figureRow}>
            <FxAmount testID="fx-receipt-figure" minor={send.amountMinor} code={code} decimals={send.decimals} size={RECEIPT.figure} weight={700} />
            {send.status === 'completed' ? (
              <Text variant="title" style={styles.word}>
                sent
              </Text>
            ) : null}
          </View>
        }
        line={`To ${shortAddress(send.address)} on ${chainName(send.chain as FxChain)}`}
        confirming={SEND_CONFIRMING}
        failure={send.failureReason?.trim() || 'This send did not go through. Nothing left your account.'}
      />
      {send.status !== 'failed' ? <Rows rows={sendRows(send)} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg },
  head: { alignItems: 'center', gap: RECEIPT.headGap, paddingTop: RECEIPT.headTop },
  figureRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  word: { fontSize: RECEIPT.figure * 0.9 },
  centre: { textAlign: 'center' },
  wrapped: { flexShrink: 1, textAlign: 'right', ...font(600) },
  footer: { gap: space.sm },
  buttons: { flexDirection: 'row', gap: space.md },
  half: { flex: 1 },
});
