import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { balanceProblem, walletBalanceQuery } from '@/api/money';
import { queryClient } from '@/api/query';
import { IconButton } from '@/components/Button';
import { PaySheet, type PayStatus, type PayWallet } from '@/components/pay-sheet';
import { PAYMENT_UNANSWERED_LINE, PinSheet, type BiometricKind } from '@/components/pin-sheet';
import { approvalLine } from '@/components/pin-sheet/format';
import { approveRequest, asBiometricResult, asPinResult, notApproved, useApprovalKind, type Settled } from '@/features/device-approval';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { isNoWallet, useOpenWalletEntry } from '@/features/open-wallet/entry';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { useSystemBack } from '@/features/professionals/parts';
import { newRequestKey } from '@/features/wallet/api/settings';
import { font, layout, space, type, useWawu } from '@/theme';

import { fetchFeeQuote, sendToBankAccount, sendToWawuUser, transferQuery, type Credential, type FeeQuote, type SendKind, type SendOutcome, type Transfer } from './api';
import { dropIntent, findIntent, putIntent, rereadIntent, type SendIntent } from './intent';
import {
  BANK_CHARGE,
  earlierSendLine,
  failureLine,
  feeLinesOf,
  hueOfPayee,
  limitLine,
  NO_TOTAL_TITLE,
  NOT_READY_LINE,
  OVER_LIMIT_TITLE,
  quoteAddsUp,
  quoteSpent,
  RETRY_LINE,
  reviewConfirmingLine,
  WALLET_NAME,
  type Payee,
} from './model';

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
  /**
   * A send to a bank account the bank did not take, decided after the Hub accepted it: W14, which says what came back. A send to a
   * WAWU user that fails shows its words on this review, as WALLET-02 built it.
   */
  onFailed?: (transferId: string) => void;
  /** Leave without a receipt: the wallet. */
  onLeave: () => void;
  /** Add money for the shortfall (kobo). Opens Add money (W15) with the shortfall. A caller that leaves it out shows the short notice without the button. */
  onAddMoney?: (shortfallKobo: number) => void;
  /** Forgot PIN? (W37). */
  onForgotPin: () => void;
  /** No PIN is set yet: A9 sets one and comes back here. */
  onSetPin: () => void;
};

/**
 * The fee quote is asked for once per review (`round` makes Try again ask afresh). A quote that has run out is replaced when the
 * person taps Send (`pay`), not when the window gets focus or the network returns.
 */
const feeQuoteQuery = (owner: string | null, kind: SendKind, amountKobo: number, round: number, enabled: boolean) =>
  ({
    queryKey: ['money', 'fee-quote', kind, owner ?? '', amountKobo, round] as const,
    queryFn: () => fetchFeeQuote(amountKobo, kind),
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
 * shows the total (BRIEF W10, rule 5). Every figure is the Hub's quote or the bank's balance.
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
 * A stored intent is only this send's while this review started it or watched it. When the review opens on a stored `pending` intent and
 * the Hub's first answer is already `completed` or `failed`, that send was decided before this review existed: it is dropped, one
 * line says how it ended and points to Wallet activity, and the person sends fresh with a new key (no receipt, nothing saved for the
 * old send). A stored intent the Hub still has as pending keeps blocking, and when this review has seen it pending and the Hub then
 * decides it, the review goes on to the receipt as before. At Send the store is read again, so a second tab opened before the first
 * send takes the key that tab wrote. If the store cannot keep the new intent, nothing is sent.
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
  const kind: SendKind = payee.bank ? 'bank_transfer' : 'wawu_transfer';
  const quoted = useQuery(feeQuoteQuery(owner, kind, amountKobo, round, request === null && fresh === null), queryClient);
  const balance = useQuery({ ...walletBalanceQuery, enabled: Boolean(owner) }, queryClient);
  const quote = request?.quote ?? fresh ?? quoted.data ?? null;
  const [shortOf, setShortOf] = useState<number | null>(null);

  const [status, setStatus] = useState<PayStatus>({ kind: 'review' });
  const [pinOpen, setPinOpen] = useState(false);
  // True from the moment the request leaves the phone until the Hub answers or the app's own limit ends it (`WRITE_TIMEOUT_MS`). The
  // retry line is for a request that got no answer, never for one still being waited on.
  const [waiting, setWaiting] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // How an earlier send for this person and amount ended, when the Hub had decided it before this review looked (null: none).
  const [earlier, setEarlier] = useState<'went' | 'not' | null>(null);
  // True once this review started the send, or has seen the Hub say it is still pending: only then is a decision this review's to show.
  const watching = useRef(false);
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
    (next: Request): Promise<unknown> => {
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
        watching.current = true;
        void keep({ ...from, phase: 'pending', transferId: transfer.id });
      } else if (props.onFailed && transfer.kind === 'bank_account') {
        // The bank did not take it after the Hub accepted it: W14 says what came back (its own words, from the Hub's record).
        void keep({ ...from, phase: 'settled', transferId: transfer.id });
        props.onFailed(transfer.id);
      } else {
        void keep({ ...from, phase: 'settled', transferId: transfer.id });
        setStatus({ kind: 'failed', message: failureLine(transfer) });
      }
    },
    [owner, props, keep],
  );

  /** The Hub had decided a stored send before this review looked: it is not this send. Drop it and let the person send fresh. */
  const settleEarlier = useCallback(
    (transfer: Transfer, from: Request) => {
      void queryClient.invalidateQueries({ queryKey: ['money'], predicate: (q) => q.queryKey[1] !== 'fee-quote' });
      if (owner) void dropIntent(owner, from.key);
      newIntent();
      setFresh(null);
      setStatus({ kind: 'review' });
      setEarlier(transfer.status === 'completed' ? 'went' : 'not');
      setRequest(null);
    },
    [owner, newIntent],
  );

  // A send the provider has not confirmed is read again by id until it is decided. Only an answer read after this review opened counts.
  const pendingId = request?.phase === 'pending' ? request.transferId : null;
  const polled = useQuery({ ...transferQuery(owner, pendingId ?? ''), enabled: Boolean(owner && pendingId), refetchInterval: POLL_MS }, queryClient);
  const seen = useRef<string | null>(null);
  useEffect(() => {
    const t = polled.data;
    if (!pendingId || !t || t.id !== pendingId || !polled.isFetchedAfterMount) return;
    if (t.status === 'pending') {
      watching.current = true;
      return;
    }
    if (seen.current === `${t.id}:${t.status}`) return;
    seen.current = `${t.id}:${t.status}`;
    // Settled after this render, as a callback: the decision moves the screen on, it is not part of drawing it.
    if (request) queueMicrotask(() => (watching.current ? finish(t, request) : settleEarlier(t, request)));
  }, [polled.data, polled.isFetchedAfterMount, pendingId, finish, settleEarlier, request]);

  /**
   * The intent for this person and amount as the store holds it now, read again at Send: a second tab of the web build may have
   * written one since this review opened, and its key is the one to use. A send found pending is shown pending and not sent.
   */
  const latestRequest = async (): Promise<Request | null> => {
    if (!owner) return request ?? null;
    const found = await rereadIntent(owner, payee.wawuUserId, amountKobo);
    if (found && (found.key !== request?.key || found.phase !== request?.phase)) {
      key.current = found.key;
      if (found.phase === 'pending') watching.current = true;
      setRequest(found);
      return found;
    }
    return request ?? null;
  };

  /** Sends the request with the PIN, or with the phone's fingerprint or face approval of exactly this request (W11, FIX-108): one path for both. */
  const run = async (credential: Credential): Promise<Settled> => {
    if (!quote || !owner || request === undefined) return { code: 'unanswered' };
    const latest = await latestRequest();
    if (latest?.phase === 'pending') {
      setPinOpen(false);
      return { code: 'approved' };
    }
    const current = latest ?? request;
    // The request this send carries: the one already sent (same key, same body) or the first one, made now from what is on screen.
    const sending: Request = current ?? {
      key: key.current,
      payeeId: payee.wawuUserId,
      amountKobo,
      note: note.trim(),
      quote,
      phase: 'ready',
      transferId: null,
      at: Date.now(),
      ...(payee.bank?.nameToken ? { nameToken: payee.bank.nameToken } : {}),
    };
    // Written before it leaves the phone, so a screen that goes away mid-send still finds it. A first send the store cannot keep is
    // not sent at all: the phone could not protect it from being paid twice. (A repeat of one already kept has its entry.)
    const kept = await putIntent(owner, { ...sending, phase: 'unknown' });
    if (!kept && sending.phase !== 'unknown') {
      setPinOpen(false);
      setNotice(NOT_READY_LINE);
      return { code: 'approved' };
    }
    setRequest({ ...sending, phase: 'unknown' });
    setWaiting(true);
    let outcome: SendOutcome;
    try {
      outcome = payee.bank
        ? await sendToBankAccount({
            bankCode: payee.bank.bankCode,
            accountNumber: payee.bank.accountNumber,
            amountKobo: sending.amountKobo,
            quote: sending.quote,
            nameToken: sending.nameToken ?? payee.bank.nameToken,
            note: sending.note,
            key: sending.key,
            ...credential,
          })
        : await sendToWawuUser({ recipientWawuUserId: sending.payeeId, amountKobo: sending.amountKobo, quote: sending.quote, note: sending.note, key: sending.key, ...credential });
    } finally {
      setWaiting(false);
    }
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
      // A closed or refused fingerprint proves nothing about an earlier try under this key (a PIN whose answer was lost): the key and the
      // stored intent stay, and only a first try lets go of the record it just wrote. The sheet is back on its keypad.
      case 'approval_cancelled':
        return notApproved('cancelled', sending.phase === 'unknown', () => void nothingMoved());
      case 'approval_failed':
        return notApproved('failed', sending.phase === 'unknown', () => void nothingMoved());
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

  const submitPin = async (pin: string) => asPinResult(await run({ pin }));
  const approvalKind = useApprovalKind();
  const prompt = quote ? approvalLine({ totalKobo: quote.totalKobo, payee: payee.name }) : 'Approve this payment';
  const approveWithBiometric = async (_kind: BiometricKind) => asBiometricResult(await run({ approve: (signed) => approveRequest(signed, prompt) }));

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
  const shown: PayStatus = confirming ? { kind: 'confirming', line: reviewConfirmingLine(quote.totalKobo) } : blocked !== null && status.kind === 'review' ? blocked : status;
  const handle = payee.handle ? `@${payee.handle.replace(/^@/, '')}` : null;
  const sentNote = request?.note ?? note.trim();

  const pay = async () => {
    // The store is read again first: another tab may have sent this one already (a pending send is then shown, not offered again).
    const latest = await latestRequest();
    if (latest?.phase === 'pending') return;
    // A quote past its time is asked for again before the PIN, so the sheet never approves a total the Hub will refuse. Not for a
    // request that already went out with no answer: that one is sent again as it was (same key, same quote), because the Hub
    // answers a key it knows before it looks at the quote, and a new key could pay twice.
    if (latest?.phase !== 'unknown' && quoteSpent(latest?.quote ?? quote, Date.now())) {
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
      {request?.phase === 'unknown' && !waiting && status.kind === 'review' && blocked === null ? (
        <Text variant="muted" testID="send-review-retry" style={styles.line}>
          {RETRY_LINE}
        </Text>
      ) : null}
      {earlier !== null && request === null && status.kind === 'review' ? (
        <Text variant="muted" testID="send-review-earlier" style={styles.line}>
          {earlierSendLine(amountKobo, payee.name, earlier === 'went')}
        </Text>
      ) : null}
      <PaySheet
        variant="send"
        item={{ title: payee.name, displayName: payee.name, avatar: { hue: hueOfPayee(payee), source: payee.avatarUrl ?? undefined } }}
        amountKobo={amountKobo}
        details={
          payee.bank
            ? [
                { label: 'Bank', value: payee.bank.bankName },
                { label: 'Account', value: payee.bank.accountNumber },
              ]
            : handle
              ? [{ label: 'Handle', value: handle }]
              : undefined
        }
        fees={feeLinesOf(quote, payee.bank ? BANK_CHARGE : undefined)}
        notes={sentNote ? [{ label: 'Note', value: sentNote }] : undefined}
        wallet={walletState}
        walletName={WALLET_NAME}
        actionLabel="Send"
        recipientGetsKobo={amountKobo}
        status={shown}
        onPay={pay}
        onAddMoney={props.onAddMoney}
        onOpenWallet={entry.open}
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
        biometric={approvalKind ? { kind: approvalKind, onPress: approveWithBiometric } : undefined}
        unansweredLine={PAYMENT_UNANSWERED_LINE}
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
