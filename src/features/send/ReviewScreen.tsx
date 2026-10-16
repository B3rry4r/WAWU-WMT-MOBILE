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
import { useSystemBack } from '@/features/professionals/parts';
import { newRequestKey } from '@/features/wallet/api/settings';
import { font, layout, space, type, useWawu } from '@/theme';

import { fetchFeeQuote, sendToWawuUser, transferQuery, type FeeQuote, type Transfer } from './api';
import { dropIntent, findIntent, putIntent, type SendIntent } from './intent';
import { failureLine, feeLinesOf, hueOfPayee, limitLine, NO_TOTAL_TITLE, OVER_LIMIT_TITLE, quoteAddsUp, quoteSpent, RETRY_LINE, WALLET_NAME, type Payee } from './model';

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

/**
 * The fee quote is asked for once per review (`round` makes Try again ask afresh). A quote that has run out is replaced when the
 * person taps Send (`pay`), not when the window gets focus or the network returns.
 */
const feeQuoteQuery = (owner: string | null, amountKobo: number, round: number, enabled: boolean) =>
  ({
    queryKey: ['money', 'fee-quote', 'wawu_transfer', owner ?? '', amountKobo, round] as const,
    queryFn: () => fetchFeeQuote(amountKobo),
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: Boolean(owner) && enabled,
  }) as const;

/**
 * What this screen is sending. It is made when the first request leaves the phone and kept (in the secure store too, while the
 * Hub has not given a final answer) so the same request can be sent again, or the send read by its id.
 * `ready`: nothing sent yet, or the Hub refused it before any money moved (the key is free). `unknown`: sent, no answer.
 * `pending`: the Hub took it and the provider has not decided. `settled`: the Hub decided (the screen is leaving or shows why).
 */
type Request = Omit<SendIntent, 'phase' | 'at'> & { phase: 'ready' | 'unknown' | 'pending' | 'settled'; at: number };

/**
 * W10 · Send · review, with W11 (the PIN sheet) over it. The review is `PaySheet`'s send variant: the person, the amount, Fintava's
 * charge and WAWU's fee as their own rows with Fees and Total (R-10), the note, "Pay from wallet", "They get ₦X" and a button that
 * shows the total (BRIEF W10). Every figure is the Hub's quote or the bank's balance.
 *
 * One Idempotency-Key per payment intent: a wrong PIN, a request that got no answer and a PIN typed again all send the SAME key, so
 * the money moves once. A new intent (the fees changed, a send that failed, a new total) takes a new key.
 *
 * The intent outlives the screen (`./intent`). A request that got no answer is kept on the phone with its key and body; the next
 * Send for the same person and amount, here or after Back, a reload or the app being closed, sends that same request first, never
 * a new key and never a new quote (the Hub answers a known key before it checks the PIN or the quote). Only when the Hub says no
 * payment exists for the key (`quote_changed`) does the next send take a new key and the quote it gave. A send the Hub took and the
 * provider has not decided is kept with its id: the review shows it pending, reads it by id, and offers no Send for it.
 *
 * The send's own answers: completed goes to the receipt; `pending` (the provider has not said, G-710) is "still confirming"; failed
 * says why in the Hub's words; short of money shows the bank's figures; no PIN yet opens A9; over today's limit is a blocked review.
 */
export function ReviewScreen(props: ReviewScreenProps) {
  const { payee, amountKobo, note } = props;
  const owner = useSessionAccount(undefined);
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const entry = useOpenWalletEntry();

  // What this screen is sending: undefined while the phone is asked, null when nothing has been sent for this person and amount.
  const [request, setRequest] = useState<Request | null | undefined>(undefined);
  const key = useRef(newRequestKey());
  const [fresh, setFresh] = useState<FeeQuote | null>(null);
  const [round, setRound] = useState(0);
  const quoted = useQuery(feeQuoteQuery(owner, amountKobo, round, request === null && fresh === null), queryClient);
  const balance = useQuery({ ...walletBalanceQuery, enabled: Boolean(owner) }, queryClient);
  const quote = request?.quote ?? fresh ?? quoted.data ?? null;
  const [shortOf, setShortOf] = useState<number | null>(null);

  const [status, setStatus] = useState<PayStatus>({ kind: 'review' });
  const [pinOpen, setPinOpen] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const newIntent = useCallback(() => {
    key.current = newRequestKey();
  }, []);

  // The phone is asked once, for this person and amount: an intent left by an earlier screen, Back, a reload or a closed app.
  useEffect(() => {
    if (!owner) return undefined;
    let current = true;
    void findIntent(owner, payee.wawuUserId, amountKobo).then((found) => {
      if (!current) return;
      if (found) key.current = found.key;
      setRequest(found);
    });
    return () => {
      current = false;
    };
  }, [owner, payee.wawuUserId, amountKobo]);

  // Nobody has a wallet until they open one (R-6).
  const led = useRef(false);
  const noWallet = isNoWallet(quoted.error) || (balance.isError && balanceProblem(balance.error) === 'no_wallet');
  useEffect(() => {
    if (noWallet && !led.current) {
      led.current = true;
      entry.open();
    }
  }, [noWallet, entry]);

  const keep = useCallback(
    (next: Request) => {
      setRequest(next);
      if (owner && (next.phase === 'unknown' || next.phase === 'pending')) {
        const { phase, ...rest } = next;
        return putIntent(owner, { ...rest, phase });
      }
      return owner ? dropIntent(owner, next.key) : Promise.resolve();
    },
    [owner],
  );

  /** The Hub gave a send back: `from` is the request that asked for it. */
  const finish = useCallback(
    (transfer: Transfer, from: Request) => {
      // The fee quote is not read again: it belongs to this review, and a new one is asked for only when Send is tapped.
      void queryClient.invalidateQueries({ queryKey: ['money'], predicate: (q) => q.queryKey[1] !== 'fee-quote' });
      if (transfer.status === 'completed') {
        queryClient.setQueryData(transferQuery(owner, transfer.id).queryKey, transfer);
        void keep({ ...from, phase: 'settled', transferId: transfer.id });
        props.onSent(transfer.id);
      } else if (transfer.status === 'pending') {
        void keep({ ...from, phase: 'pending', transferId: transfer.id });
      } else {
        void keep({ ...from, phase: 'settled', transferId: transfer.id });
        setStatus({ kind: 'failed', message: failureLine(transfer) });
      }
    },
    [owner, props, keep],
  );

  // A send the provider has not confirmed is read again by id until it is decided.
  const pendingId = request?.phase === 'pending' ? request.transferId : null;
  const polled = useQuery({ ...transferQuery(owner, pendingId ?? ''), enabled: Boolean(owner && pendingId), refetchInterval: POLL_MS }, queryClient);
  const seen = useRef<string | null>(null);
  useEffect(() => {
    const t = polled.data;
    if (!pendingId || !t || t.id !== pendingId || t.status === 'pending' || seen.current === `${t.id}:${t.status}`) return;
    seen.current = `${t.id}:${t.status}`;
    // Settled after this render, as a callback: the decision moves the screen on, it is not part of drawing it.
    if (request) queueMicrotask(() => finish(t, request));
  }, [polled.data, pendingId, finish, request]);

  const submitPin = async (pin: string): Promise<PinCheckResult> => {
    if (!quote || !owner || request === undefined) return { code: 'unanswered' };
    // The request this send carries: the one already sent (same key, same body) or the first one, made now from what is on screen.
    const sending: Request = request ?? {
      key: key.current,
      payeeId: payee.wawuUserId,
      amountKobo,
      note: note.trim(),
      quote,
      phase: 'ready',
      transferId: null,
      at: Date.now(),
    };
    // Written before it leaves the phone, so a screen that goes away mid-send still finds it.
    await keep({ ...sending, phase: 'unknown' });
    const outcome = await sendToWawuUser({ recipientWawuUserId: sending.payeeId, amountKobo: sending.amountKobo, quote: sending.quote, note: sending.note, key: sending.key, pin });
    // The Hub gave an answer that proves no payment exists for the key: the intent is not kept, the key is free for the next try.
    const nothingMoved = (next: Request['phase'] = 'ready') => keep({ ...sending, phase: next });
    switch (outcome.kind) {
      case 'pin_incorrect':
        void nothingMoved();
        return { code: 'pin_incorrect', triesLeft: outcome.triesLeft };
      case 'pin_locked':
        void nothingMoved();
        setLockedUntil(outcome.lockedUntil);
        return { code: 'pin_locked', lockedUntil: outcome.lockedUntil };
      case 'unanswered':
        return { code: 'unanswered' };
      case 'done':
        setPinOpen(false);
        finish(outcome.transfer, sending);
        return { code: 'approved' };
      case 'pin_not_set':
        void nothingMoved();
        setPinOpen(false);
        props.onSetPin();
        return { code: 'approved' };
      case 'no_wallet':
        void nothingMoved();
        setPinOpen(false);
        entry.open();
        return { code: 'approved' };
      case 'insufficient_funds':
        // The bank's own figures now: the sheet's "not enough" reads them, and the key is spent on nothing.
        void nothingMoved();
        setPinOpen(false);
        setShortOf(outcome.balanceKobo);
        return { code: 'approved' };
      case 'quote_changed':
        // No payment exists for the key: the fees moved, so this is a new intent with the quote the Hub gave.
        void dropIntent(owner, sending.key);
        setPinOpen(false);
        setRequest(null);
        setFresh(outcome.quote);
        newIntent();
        setNotice('The fees changed. Check the new total before you send.');
        return { code: 'approved' };
      case 'refused':
        void nothingMoved('settled');
        setPinOpen(false);
        setStatus({ kind: 'failed', message: outcome.message });
        return { code: 'approved' };
    }
  };

  const confirming = request?.phase === 'pending';
  // Back from a send that is only waiting for the provider goes to the wallet, not to the amount.
  const goBack = confirming ? props.onLeave : props.onBack;
  useSystemBack(goBack);

  const nav = (
    <View style={[styles.nav, { paddingTop: insets.top, height: layout.controlH + space.sm + insets.top }]}>
      <IconButton testID="review-back" icon="ChevronLeft" label="Back" onPress={goBack} size={BACK} />
      <Text style={[styles.navTitle, { color: colors.textPrimary }]} accessibilityRole="header">
        Review
      </Text>
      <View style={styles.backSpace} />
    </View>
  );

  if (!quote || request === undefined) {
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
  // A send the Hub would refuse is never offered, and nothing is tried: today's limit (Cancel only), or a quote whose parts do not
  // make its total (Try again asks for a new quote). These are blocked states, not failed payments.
  const limit = limitLine(quote);
  const blocked: PayStatus | null =
    limit !== null
      ? { kind: 'blocked', title: OVER_LIMIT_TITLE, message: limit }
      : quoteAddsUp(quote)
        ? null
        : { kind: 'blocked', title: NO_TOTAL_TITLE, message: 'Try again to ask for the fees once more.', tryAgain: true };
  const shown: PayStatus = confirming ? { kind: 'confirming' } : blocked !== null && status.kind === 'review' ? blocked : status;
  const handle = payee.handle ? `@${payee.handle.replace(/^@/, '')}` : null;
  const sentNote = request?.note ?? note.trim();

  const pay = async () => {
    // A quote past its time is asked for again before the PIN, so the sheet never approves a total the Hub will refuse. Not for a
    // request that already went out with no answer: that one is sent again as it was (same key, same quote), because the Hub
    // answers a key it knows before it looks at the quote, and a new key could pay twice.
    if (request?.phase !== 'unknown' && quoteSpent(quote, Date.now())) {
      const again = await quoted.refetch();
      if (again.data) {
        setFresh(again.data);
        setRequest(null);
        newIntent();
        if (again.data.totalKobo !== quote.totalKobo) {
          setNotice('The fees changed. Check the new total before you send.');
          return;
        }
      }
    }
    setPinOpen(true);
  };

  return (
    <View testID="send-review-screen" style={[styles.page, { backgroundColor: colors.surfacePage }]}>
      {nav}
      {request?.phase === 'unknown' && status.kind === 'review' && blocked === null ? (
        <Text variant="muted" testID="send-review-retry" style={styles.line}>
          {RETRY_LINE}
        </Text>
      ) : null}
      <PaySheet
        variant="send"
        item={{ title: payee.name, displayName: payee.name, avatar: { hue: hueOfPayee(payee), source: payee.avatarUrl ?? undefined } }}
        amountKobo={amountKobo}
        details={handle ? [{ label: 'Handle', value: handle }] : undefined}
        fees={feeLinesOf(quote)}
        notes={sentNote ? [{ label: 'Note', value: sentNote }] : undefined}
        wallet={walletState}
        walletName={WALLET_NAME}
        actionLabel="Send"
        recipientGetsKobo={amountKobo}
        status={shown}
        onPay={pay}
        onAddMoney={props.onAddMoney}
        onCancel={goBack}
        onRetry={() => {
          // A send that did not go through starts again as a new intent, from a new quote.
          newIntent();
          setRequest(null);
          setFresh(null);
          setRound((r) => r + 1);
          setStatus({ kind: 'review' });
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
