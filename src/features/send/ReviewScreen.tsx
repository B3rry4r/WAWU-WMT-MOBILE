import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { balanceProblem, walletBalanceQuery } from '@/api/money';
import { queryClient } from '@/api/query';
import { IconButton } from '@/components/Button';
import { PaySheet, type PayStatus, type PayWallet } from '@/components/pay-sheet';
import { PinSheet, type PinCheckResult } from '@/components/pin-sheet';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { isNoWallet, useOpenWalletEntry } from '@/features/open-wallet/entry';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { newRequestKey } from '@/features/wallet/api/settings';
import { font, layout, space, type, useWawu } from '@/theme';

import { fetchFeeQuote, sendToWawuUser, transferQuery, type FeeQuote, type Transfer } from './api';
import { CONFIRMING_LINE, failureLine, feeLinesOf, hueOfPayee, limitLine, quoteAddsUp, quoteSpent, WALLET_NAME, type Payee } from './model';

/** How often a send the provider has not confirmed is read again (`GET /money/transfers/{id}`, our record). Default (agent), owner may override. */
const POLL_MS = 4000;
const BACK = layout.tapMin - space.xs / 2;

export type ReviewScreenProps = {
  payee: Payee;
  /** What the person gets, kobo. */
  amountKobo: number;
  note: string;
  onBack: () => void;
  /** The send completed: the receipt (W12). */
  onSent: (transferId: string) => void;
  /** Leave without a receipt: the wallet. */
  onLeave: () => void;
  /** Add money for the shortfall (kobo). */
  onAddMoney: (shortfallKobo: number) => void;
  /** Forgot PIN? (W37). */
  onForgotPin: () => void;
  /** No PIN is set yet: A9 sets one and comes back here. */
  onSetPin: () => void;
};

const feeQuoteQuery = (owner: string | null, amountKobo: number) =>
  ({
    queryKey: ['money', 'fee-quote', 'wawu_transfer', owner ?? '', amountKobo] as const,
    queryFn: () => fetchFeeQuote(amountKobo),
    staleTime: 0,
    gcTime: 0,
    enabled: Boolean(owner),
  }) as const;

/**
 * W10 · Send · review, with W11 (the PIN sheet) over it. The review is `PaySheet`'s send variant: the person, the amount, Fintava's
 * charge and WAWU's fee as their own rows with Fees and Total (R-10), the note, "Pay from wallet", "They get ₦X" and a button that
 * shows the total (BRIEF W10). Every figure is the Hub's quote or the bank's balance.
 *
 * One Idempotency-Key per payment intent: a wrong PIN, a request that got no answer and a PIN typed again all send the SAME key, so
 * the money moves once. A new intent (the fees changed, a send that failed, a new total) takes a new key.
 *
 * The send's own answers: completed goes to the receipt; `pending` (the provider has not said, G-710) is "still confirming", read
 * again by id and never sent again; failed says why in the Hub's words; short of money shows the bank's figures; no PIN yet opens A9.
 */
export function ReviewScreen(props: ReviewScreenProps) {
  const { payee, amountKobo, note } = props;
  const owner = useSessionAccount(undefined);
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const entry = useOpenWalletEntry();

  const quoted = useQuery(feeQuoteQuery(owner, amountKobo), queryClient);
  const balance = useQuery({ ...walletBalanceQuery, enabled: Boolean(owner) }, queryClient);
  const [fresh, setFresh] = useState<FeeQuote | null>(null);
  const quote = fresh ?? quoted.data ?? null;
  const [shortOf, setShortOf] = useState<number | null>(null);

  const [status, setStatus] = useState<PayStatus>({ kind: 'review' });
  const [pinOpen, setPinOpen] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [pending, setPending] = useState<Transfer | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const key = useRef(newRequestKey());
  const newIntent = useCallback(() => {
    key.current = newRequestKey();
  }, []);

  // Nobody has a wallet until they open one (R-6).
  const led = useRef(false);
  const noWallet = isNoWallet(quoted.error) || (balance.isError && balanceProblem(balance.error) === 'no_wallet');
  useEffect(() => {
    if (noWallet && !led.current) {
      led.current = true;
      entry.open();
    }
  }, [noWallet, entry]);

  const finish = useCallback(
    (transfer: Transfer) => {
      void queryClient.invalidateQueries({ queryKey: ['money'] });
      if (transfer.status === 'completed') {
        queryClient.setQueryData(transferQuery(owner, transfer.id).queryKey, transfer);
        props.onSent(transfer.id);
      } else if (transfer.status === 'pending') {
        setPending(transfer);
        setStatus({ kind: 'confirming' });
      } else {
        setPending(null);
        setStatus({ kind: 'failed', message: failureLine(transfer) });
      }
    },
    [owner, props],
  );

  // A send the provider has not confirmed is read again by id until it is decided.
  const polled = useQuery({ ...transferQuery(owner, pending?.id ?? ''), enabled: Boolean(owner && pending), refetchInterval: POLL_MS }, queryClient);
  const seen = useRef<string | null>(null);
  useEffect(() => {
    const t = polled.data;
    if (!pending || !t || t.id !== pending.id || t.status === 'pending' || seen.current === `${t.id}:${t.status}`) return;
    seen.current = `${t.id}:${t.status}`;
    finish(t);
  }, [polled.data, pending, finish]);

  const submitPin = async (pin: string): Promise<PinCheckResult> => {
    if (!quote) return { code: 'unanswered' };
    const outcome = await sendToWawuUser({ recipientWawuUserId: payee.wawuUserId, amountKobo, quote, note, key: key.current, pin });
    switch (outcome.kind) {
      case 'pin_incorrect':
        return { code: 'pin_incorrect', triesLeft: outcome.triesLeft };
      case 'pin_locked':
        setLockedUntil(outcome.lockedUntil);
        return { code: 'pin_locked', lockedUntil: outcome.lockedUntil };
      case 'unanswered':
        return { code: 'unanswered' };
      case 'done':
        setPinOpen(false);
        finish(outcome.transfer);
        return { code: 'approved' };
      case 'pin_not_set':
        setPinOpen(false);
        props.onSetPin();
        return { code: 'approved' };
      case 'no_wallet':
        setPinOpen(false);
        entry.open();
        return { code: 'approved' };
      case 'insufficient_funds':
        // The bank's own figures now: the sheet's "not enough" reads them, and the key is spent on nothing.
        setPinOpen(false);
        setShortOf(outcome.balanceKobo);
        return { code: 'approved' };
      case 'quote_changed':
        setPinOpen(false);
        setFresh(outcome.quote);
        newIntent();
        setNotice('The fees changed. Check the new total before you send.');
        return { code: 'approved' };
      case 'refused':
        setPinOpen(false);
        setStatus({ kind: 'failed', message: outcome.message });
        return { code: 'approved' };
    }
  };

  const nav = (
    <View style={[styles.nav, { paddingTop: insets.top, height: layout.controlH + space.sm + insets.top }]}>
      <IconButton testID="review-back" icon="ChevronLeft" label="Back" onPress={props.onBack} size={BACK} />
      <Text style={[styles.navTitle, { color: colors.textPrimary }]} accessibilityRole="header">
        Review
      </Text>
      <View style={styles.backSpace} />
    </View>
  );

  if (!quote) {
    return (
      <View testID="send-review-screen" style={[styles.page, { backgroundColor: colors.surfacePage }]}>
        {nav}
        {quoted.isError && !isNoWallet(quoted.error) ? (
          <View style={styles.state}>
            <ErrorState
              testID="send-review-error"
              icon={isApiError(quoted.error) && quoted.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
              title="We couldn't work out the fees"
              message={isApiError(quoted.error) && quoted.error.message ? quoted.error.message : 'Check your connection and try again.'}
              onRetry={() => void quoted.refetch()}
            />
          </View>
        ) : (
          <LoadingView label="Working out the fees" testID="send-review-loading">
            <View style={styles.skeleton}>
              <Skeleton width={64} height={64} radius={32} />
              <Skeleton width="60%" height={20} />
              <Skeleton height={190} radius={24} />
            </View>
          </LoadingView>
        )}
      </View>
    );
  }

  const balanceKobo = shortOf ?? balance.data?.availableKobo;
  const walletState: PayWallet =
    balance.isError && balanceProblem(balance.error) === 'no_wallet'
      ? { kind: 'none' }
      : balanceKobo !== undefined
        ? { kind: 'open', balanceKobo }
        : { kind: 'loading' };
  // A send the Hub would refuse is never offered: today's limit, or a quote whose parts do not make its total. The sheet says why and
  // offers Try again (a new quote) and Cancel (back to the amount).
  const blocked = limitLine(quote) ?? (quoteAddsUp(quote) ? null : "We couldn't work out the total for this send. Try again.");
  const shown: PayStatus = blocked !== null && status.kind === 'review' ? { kind: 'failed', message: blocked } : status;
  const handle = payee.handle ? `@${payee.handle.replace(/^@/, '')}` : null;

  const pay = async () => {
    // A quote past its time is asked for again before the PIN, so the sheet never approves a total the Hub will refuse.
    if (quoteSpent(quote, Date.now())) {
      const again = await quoted.refetch();
      if (again.data) {
        setFresh(again.data);
        newIntent();
        if (again.data.totalKobo !== quote.totalKobo) setNotice('The fees changed. Check the new total before you send.');
        return;
      }
    }
    setPinOpen(true);
  };

  return (
    <View testID="send-review-screen" style={[styles.page, { backgroundColor: colors.surfacePage }]}>
      {nav}
      {status.kind === 'confirming' ? (
        <Text variant="muted" testID="send-review-confirming" style={styles.line}>
          {CONFIRMING_LINE}
        </Text>
      ) : null}
      <PaySheet
        variant="send"
        item={{ title: payee.name, displayName: payee.name, avatar: { hue: hueOfPayee(payee), source: payee.avatarUrl ?? undefined } }}
        amountKobo={amountKobo}
        details={handle ? [{ label: 'Handle', value: handle }] : undefined}
        fees={feeLinesOf(quote)}
        notes={note ? [{ label: 'Note', value: note }] : undefined}
        wallet={walletState}
        walletName={WALLET_NAME}
        actionLabel="Send"
        recipientGetsKobo={amountKobo}
        status={shown}
        onPay={pay}
        onAddMoney={props.onAddMoney}
        onCancel={status.kind === 'confirming' ? props.onLeave : props.onBack}
        onRetry={() => {
          // A send that did not go through starts again as a new intent, from a new quote.
          newIntent();
          setPending(null);
          setFresh(null);
          setStatus({ kind: 'review' });
          void quoted.refetch();
        }}
        onRefresh={() => void polled.refetch()}
      />
      <PinSheet
        visible={pinOpen}
        onClose={() => setPinOpen(false)}
        approval={{ totalKobo: quote.totalKobo, payee: payee.name }}
        onSubmit={submitPin}
        onForgotPin={() => {
          setPinOpen(false);
          props.onForgotPin();
        }}
        lockedUntil={lockedUntil}
      />
      {notice ? <Toast message={notice} tone="alert" placement="top" lines={2} onHide={() => setNotice(null)} testID="send-review-notice" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  nav: { paddingHorizontal: layout.gutter, flexDirection: 'row', alignItems: 'center', gap: space.md },
  backSpace: { width: BACK },
  navTitle: { ...font(700), flex: 1, textAlign: 'center', fontSize: type.size.h3 + 1, letterSpacing: -0.02 * (type.size.h3 + 1) },
  line: { paddingHorizontal: layout.gutter, textAlign: 'center' },
  state: { flex: 1, paddingHorizontal: layout.gutter },
  skeleton: { alignItems: 'center', gap: space.lg, paddingHorizontal: layout.gutter },
});
