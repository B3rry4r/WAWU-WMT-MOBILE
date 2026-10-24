import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { balanceProblem, walletBalanceQuery } from '@/api/money';
import { Avatar } from '@/components/Avatar';
import { AmountKeypad, deleteLast, koboOfText, pressKey } from '@/components/amount-entry';
import { Button } from '@/components/Button';
import { browserOutlineOff } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { formatMoney, Money } from '@/components/Money';
import { PaySheet, type PayStatus } from '@/components/pay-sheet';
import { PAYMENT_UNANSWERED_LINE, PinSheet } from '@/components/pin-sheet';
import { approvalLine } from '@/components/pin-sheet/format';
import { approveRequest, asBiometricResult, asPinResult, notApproved, useApprovalKind, type Settled } from '@/features/device-approval';
import { fieldMetrics } from '@/components/TextField';
import { Text } from '@/components/Text';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { feeLinesFromParts } from '@/features/money-attempt/fees';
import { WALLET_LABEL } from '@/features/money-attempt/refusal';
import { useOpenWalletEntry } from '@/features/open-wallet/entry';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { fetchFeeQuote, sendToWawuUser, transferQuery, type Credential, type FeeQuote } from '@/features/send/api';
import { dropIntent, findIntent, putIntent, type SendIntent } from '@/features/send/intent';
import {
  BALANCE_LABEL,
  failureLine,
  firstName,
  hueOfPayee,
  limitLine,
  NOT_READY_LINE,
  quoteAddsUp,
  type Payee,
} from '@/features/send/model';
import { PayeeTick, useSettled } from '@/features/send/parts';
import { newRequestKey } from '@/features/wallet/api/settings';
import { canvasNormalLineHeight, space, useWawu } from '@/theme';

import { addChatSend, chatSends } from './sends';

/** `WawuTransferDto.note` takes 100 characters (the contract). */
const NOTE_MAX = 100;
/** I14's amount is the figure of the screen: 52 as the canvas draws it. Balance line 14. */
const AMOUNT = { size: 52, balanceSize: 14, noteIcon: 17, noteText: 14.5, noteGap: 12, settleMs: 350, feeLines: 2 } as const;
const PRICE_CHANGED_LINE = 'The fees changed. Check the new total before you send.';

const naira = (kobo: number) => formatMoney(kobo, { decimals: kobo % 100 !== 0 });

export const chatSendsKey = (owner: string | null, chatId: string) => ['chat', chatId, 'sends', owner ?? ''] as const;
export const chatSendsQuery = (owner: string | null, chatId: string) =>
  ({ queryKey: chatSendsKey(owner, chatId), queryFn: () => chatSends(owner as string, chatId), enabled: Boolean(owner), staleTime: 0 }) as const;

export type ChatSendScreenProps = {
  chatId: string;
  payee: Payee;
  onBack: () => void;
  /** The send is with the Hub (done, or taken and still confirming): back to the chat, whose bubble says which. */
  onDone: () => void;
  /** No PIN is set yet: A9 sets one. */
  onSetPin: () => void;
  /** Forgot PIN? (W37). */
  onForgotPin: () => void;
  /** Add money for the shortfall (kobo). Opens Add money (W15) with the shortfall. A caller that leaves it out shows the short notice without the button. */
  onAddMoney?: (shortfallKobo: number) => void;
};

/**
 * I14 · Amount (send money in a chat): who it goes to, the amount typed on W9's keypad, the wallet's balance (the bank's figure), a note,
 * and, above the button, what it costs (BRIEF I14): the bank's charge plus WAWU's fee, the total, "Femi gets ₦25,000", and a button that
 * carries the total. Then the PIN (W11), and the chat shows I15's bubble. Every figure is the Hub's quote.
 *
 * A fresh quote is asked for on every tap on Send, and the PIN opens only when its total is the one on screen. One Idempotency-Key per
 * payment intent: a wrong PIN, a request that got no answer and a PIN typed again send the SAME key, so the money moves once; the intent
 * is kept on the phone (`send/intent`) until the Hub has the last word, shared with W10's review, so the same person and amount are
 * never sent twice from either. A send the provider has not confirmed is the bubble's to follow.
 */
export function ChatSendScreen({ chatId, payee, onBack, onDone, onSetPin, onForgotPin, onAddMoney }: ChatSendScreenProps) {
  const owner = useSessionAccount(undefined);
  const { colors } = useWawu();
  const client = useQueryClient();
  const entry = useOpenWalletEntry();
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const amountKobo = koboOfText(text);
  const settled = Number(useSettled(String(amountKobo), AMOUNT.settleMs));

  const balance = useQuery({ ...walletBalanceQuery, enabled: Boolean(owner) });
  const problem = balance.isError ? balanceProblem(balance.error) : null;
  const led = useRef(false);
  useEffect(() => {
    if (problem === 'no_wallet' && !led.current) {
      led.current = true;
      entry.open();
    }
  }, [problem, entry]);

  // The phone is asked for a send already made for this person and amount: undefined while it is asked, null when none is kept.
  const sig = `${payee.wawuUserId}:${amountKobo}`;
  const [keptFor, setKeptFor] = useState<{ sig: string; intent: SendIntent | null } | null>(null);
  const kept: SendIntent | null | undefined = !owner || amountKobo <= 0 ? null : keptFor?.sig === sig ? keptFor.intent : undefined;
  useEffect(() => {
    if (!owner || amountKobo <= 0) return undefined;
    let current = true;
    void findIntent(owner, payee.wawuUserId, amountKobo).then((found) => {
      if (current) setKeptFor({ sig, intent: found });
    });
    return () => {
      current = false;
    };
  }, [owner, payee.wawuUserId, amountKobo, sig]);
  const setKept = (intent: SendIntent | null) => setKeptFor({ sig, intent });

  const [round, setRound] = useState(0);
  const [fresh, setFresh] = useState<FeeQuote | null>(null);
  const quoted = useQuery({
    queryKey: ['money', 'fee-quote', 'wawu_transfer', owner ?? '', settled, round] as const,
    queryFn: () => fetchFeeQuote(settled),
    enabled: Boolean(owner) && settled > 0 && kept === null,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
  const quote: FeeQuote | null = (kept?.phase === 'unknown' ? kept.quote : null) ?? (fresh && fresh.amountKobo === amountKobo ? fresh : null) ?? (quoted.data && quoted.data.amountKobo === amountKobo ? quoted.data : null);
  const quoteNoWallet = quoted.isError && isApiError(quoted.error) && quoted.error.code === 'wallet_not_open';
  useEffect(() => {
    if (quoteNoWallet && !led.current) {
      led.current = true;
      entry.open();
    }
  }, [quoteNoWallet, entry]);

  const [status, setStatus] = useState<PayStatus>({ kind: 'review' });
  const [pinOpen, setPinOpen] = useState(false);
  const [tapping, setTapping] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [shortOf, setShortOf] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showShort, setShowShort] = useState(false);
  const key = useRef(newRequestKey());

  const afterMoney = () => {
    void client.invalidateQueries({ queryKey: ['money'], predicate: (q) => q.queryKey[1] !== 'fee-quote' });
    void client.invalidateQueries({ queryKey: ['inbox'] });
  };

  const edited = () => {
    setFresh(null);
    setNotice(null);
    setShortOf(null);
    setShowShort(false);
  };

  const balanceKobo = shortOf ?? balance.data?.availableKobo ?? null;
  const limit = quote ? limitLine(quote) : null;
  const blockedLine = quote && !quoteAddsUp(quote) ? 'We couldn’t work out the total. Change the amount to ask again.' : limit;

  /** Send: a fresh quote for this tap, then the PIN when its total is the one on screen. A send already made and not answered is asked again as it was. */
  const press = async () => {
    if (tapping || amountKobo <= 0 || kept === undefined || !quote) return;
    setNotice(null);
    if (kept?.phase === 'pending') return;
    if (kept?.phase === 'unknown') {
      setPinOpen(true);
      return;
    }
    setTapping(true);
    try {
      const again = await fetchFeeQuote(amountKobo);
      setFresh(again);
      if (again.totalKobo !== quote.totalKobo) {
        setNotice(PRICE_CHANGED_LINE);
        return;
      }
      if (balanceKobo !== null && balanceKobo < again.totalKobo) {
        setShowShort(true);
        return;
      }
      setPinOpen(true);
    } catch (error) {
      if (isApiError(error) && error.code === 'wallet_not_open') entry.open();
      else setNotice(isApiError(error) && error.message ? error.message : 'Check your connection and try again.');
    } finally {
      setTapping(false);
    }
  };

  /** Sends with the PIN, or with the phone's fingerprint or face approval of exactly this request (FIX-108): one path for both. */
  const run = async (credential: Credential): Promise<Settled> => {
    const use = (kept?.phase === 'unknown' ? kept.quote : quote) as FeeQuote | null;
    if (!use || !owner || kept === undefined) return { code: 'unanswered' };
    // An earlier try under this key that the Hub may have taken (its answer was lost): this try repeats it.
    const earlierTry = kept?.phase === 'unknown';
    const sending: SendIntent =
      kept?.phase === 'unknown' ? kept : { key: key.current, payeeId: payee.wawuUserId, amountKobo, note: note.trim(), quote: use, phase: 'unknown', transferId: null, at: Date.now() };
    // Written before it leaves the phone, so a screen that goes away mid-send still finds it. A first send the store cannot keep is not
    // sent at all: the phone could not protect it from being paid twice.
    const wrote = await putIntent(owner, sending);
    if (!wrote && sending !== kept) {
      setPinOpen(false);
      setNotice(NOT_READY_LINE);
      return { code: 'approved' };
    }
    setKept(sending);
    setStatus({ kind: 'paying' });
    const outcome = await sendToWawuUser({ recipientWawuUserId: sending.payeeId, amountKobo: sending.amountKobo, quote: sending.quote, note: sending.note, key: sending.key, ...credential });
    const nothingMoved = () => {
      void dropIntent(owner, sending.key);
      key.current = newRequestKey();
      setKept(null);
      setStatus({ kind: 'review' });
    };
    // The record this try wrote itself, with the key kept: the PIN that follows is the same payment.
    const forgetFirstTry = () => {
      void dropIntent(owner, sending.key);
      setKept(null);
    };
    switch (outcome.kind) {
      case 'pin_incorrect':
        nothingMoved();
        return { code: 'pin_incorrect', triesLeft: outcome.triesLeft };
      case 'pin_locked':
        nothingMoved();
        setLockedUntil(outcome.lockedUntil);
        return { code: 'pin_locked', lockedUntil: outcome.lockedUntil };
      case 'unanswered':
        setStatus({ kind: 'review' });
        return { code: 'unanswered' };
      // A closed or refused fingerprint proves nothing about an earlier try under this key (a PIN whose answer was lost): the key and the
      // stored intent stay, and only a first try lets go of the record it just wrote.
      case 'approval_cancelled':
        setStatus({ kind: 'review' });
        return notApproved('cancelled', earlierTry, forgetFirstTry);
      case 'approval_failed':
        setStatus({ kind: 'review' });
        return notApproved('failed', earlierTry, forgetFirstTry);
      case 'done': {
        const transfer = outcome.transfer;
        setPinOpen(false);
        if (transfer.status === 'failed' || transfer.status === 'reversed') {
          void dropIntent(owner, sending.key);
          key.current = newRequestKey();
          setKept(null);
          setStatus({ kind: 'failed', message: failureLine(transfer) });
          afterMoney();
          return { code: 'approved' };
        }
        client.setQueryData(transferQuery(owner, transfer.id).queryKey, transfer);
        if (transfer.status === 'completed') void dropIntent(owner, sending.key);
        else void putIntent(owner, { ...sending, phase: 'pending', transferId: transfer.id });
        await addChatSend(owner, chatId, transfer.id);
        await client.invalidateQueries({ queryKey: chatSendsKey(owner, chatId) });
        afterMoney();
        onDone();
        return { code: 'approved' };
      }
      case 'pin_not_set':
        nothingMoved();
        setPinOpen(false);
        onSetPin();
        return { code: 'approved' };
      case 'no_wallet':
        nothingMoved();
        setPinOpen(false);
        entry.open();
        return { code: 'approved' };
      case 'insufficient_funds':
        nothingMoved();
        setPinOpen(false);
        setShortOf(outcome.balanceKobo);
        setShowShort(true);
        return { code: 'approved' };
      case 'quote_changed':
        void dropIntent(owner, sending.key);
        key.current = newRequestKey();
        setKept(null);
        setStatus({ kind: 'review' });
        setPinOpen(false);
        setFresh(outcome.quote);
        setNotice(PRICE_CHANGED_LINE);
        return { code: 'approved' };
      case 'refused':
        nothingMoved();
        setPinOpen(false);
        setStatus({ kind: 'failed', message: outcome.message });
        return { code: 'approved' };
    }
  };

  const submitPin = async (pin: string) => asPinResult(await run({ pin }));
  const approvalKind = useApprovalKind();
  const approvePrompt = quote ? approvalLine({ totalKobo: quote.totalKobo, payee: payee.name }) : 'Approve this payment';
  const approveWithBiometric = async () => asBiometricResult(await run({ approve: (signed) => approveRequest(signed, approvePrompt) }));

  let balanceLine;
  if (balance.data) {
    balanceLine = (
      <Text variant="secondary" tone="textMuted" testID="send-balance" style={styles.centre}>
        {BALANCE_LABEL} <Money minorUnits={balance.data.availableKobo} size={AMOUNT.balanceSize} weight={600} tone="textSecondary" />
      </Text>
    );
  } else if (balance.isError) {
    balanceLine = (
      <Pressable testID="send-balance-retry" accessibilityRole="button" accessibilityLabel="Try reading your balance again" onPress={() => void balance.refetch()}>
        <Text variant="secondary" tone="textMuted" style={styles.centre}>
          We couldn’t read your balance. Tap to try again.
        </Text>
      </Pressable>
    );
  } else {
    balanceLine = <Money testID="send-balance-loading" minorUnits={0} loading size={AMOUNT.balanceSize} />;
  }

  const name = firstName(payee.name);
  const fees = quote ? feeLinesFromParts(quote.parts) : [];
  const confirming = kept?.phase === 'pending';
  const overlay = status.kind === 'failed' || showShort;

  return (
    <>
      <AuthFrame
        testID="chat-send-screen"
        navTitle={`Send to ${name}`}
        onBack={onBack}
        footer={
          <View style={styles.foot}>
            {quote ? (
              <View style={styles.fees} testID="chat-send-fees">
                <Text variant="meta" tone="textMuted" style={styles.centre}>
                  {`${fees.map((line) => `${line.label} ${naira(line.amountKobo)}`).join(' + ')} = ${naira(quote.totalKobo - quote.amountKobo)}`}
                </Text>
                <Text variant="kvValue" style={styles.centre} testID="chat-send-total">
                  {`Total ${naira(quote.totalKobo)}`}
                </Text>
              </View>
            ) : quoted.isError && amountKobo > 0 ? (
              <Pressable testID="chat-send-quote-retry" accessibilityRole="button" onPress={() => setRound((n) => n + 1)}>
                <Text variant="errorLine" tone="danger" style={styles.centre}>
                  We couldn’t get the fees. Tap to try again.
                </Text>
              </Pressable>
            ) : null}
            {quote ? (
              <Text variant="muted" style={styles.centre} testID="chat-send-gets">
                {`${name} gets ${naira(quote.amountKobo)}`}
              </Text>
            ) : null}
            {notice ? (
              <Text variant="errorLine" tone="danger" accessibilityRole="alert" style={styles.centre} testID="chat-send-notice">
                {notice}
              </Text>
            ) : null}
            {blockedLine ? (
              <Text variant="errorLine" tone="danger" accessibilityRole="alert" style={styles.centre} testID="chat-send-blocked">
                {blockedLine}
              </Text>
            ) : null}
            {confirming ? (
              <Text variant="errorLine" tone="warning" style={styles.centre} testID="chat-send-confirming">
                Your earlier send of this amount is still confirming. Don’t send it again. The chat shows when it is done.
              </Text>
            ) : null}
            <Button
              testID="chat-send"
              label={quote ? `Send ${naira(quote.totalKobo)}` : 'Send'}
              full
              loading={tapping || status.kind === 'paying'}
              disabled={!quote || amountKobo <= 0 || blockedLine !== null || confirming || kept === undefined}
              onPress={() => void press()}
            />
          </View>
        }
      >
        <View style={styles.body}>
          <View style={styles.head}>
            <Avatar name={payee.name} hue={hueOfPayee(payee)} size={52} source={payee.avatarUrl ?? undefined} decorative />
            <View style={styles.nameLine}>
              <Text variant="cardTitle" testID="chat-send-payee">
                {payee.name}
              </Text>
              <PayeeTick payee={payee} />
            </View>
          </View>
          <View style={styles.figure}>
            <Money testID="send-amount" minorUnits={amountKobo} size={AMOUNT.size} weight={700} decimals={text.includes('.')} tone={amountKobo === 0 ? 'textMuted' : 'textPrimary'} />
            {balanceLine}
          </View>
          <View style={[styles.note, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]}>
            <Icon name="SquarePen" size={AMOUNT.noteIcon} color={colors.textMuted} />
            <TextInput
              testID="send-note"
              value={note}
              onChangeText={setNote}
              maxLength={NOTE_MAX}
              placeholder="Add a note (optional)"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Note, optional"
              selectionColor={colors.accent}
              cursorColor={colors.accent}
              style={[styles.noteInput, Platform.OS === 'web' ? browserOutlineOff : null, { color: colors.textPrimary }]}
            />
          </View>
          <AmountKeypad
            onKey={(k) => {
              setText((was) => pressKey(was, k));
              edited();
            }}
            onDelete={() => {
              setText(deleteLast);
              edited();
            }}
            onClear={() => {
              setText('');
              edited();
            }}
          />
        </View>
      </AuthFrame>
      {quote && overlay ? (
        <PaySheet
          visible
          item={{ title: `Send to ${payee.name}`, displayName: payee.name }}
          amountKobo={quote.amountKobo}
          amountLabel="Amount"
          fees={fees}
          wallet={balanceKobo === null ? { kind: 'loading' } : { kind: 'open', balanceKobo }}
          walletName={WALLET_LABEL}
          actionLabel="Send"
          recipientGetsKobo={quote.amountKobo}
          status={status.kind === 'failed' ? status : { kind: 'review' }}
          onPay={() => void press()}
          onAddMoney={onAddMoney}
          onCancel={() => {
            setShowShort(false);
            setStatus({ kind: 'review' });
          }}
          onRetry={() => setStatus({ kind: 'review' })}
        />
      ) : null}
      {quote ? (
        <PinSheet
          visible={pinOpen}
          onClose={() => setPinOpen(false)}
          approval={{ totalKobo: quote.totalKobo, payee: payee.name }}
          onSubmit={submitPin}
          biometric={approvalKind ? { kind: approvalKind, onPress: approveWithBiometric } : undefined}
          unansweredLine={PAYMENT_UNANSWERED_LINE}
          onForgotPin={() => {
            setPinOpen(false);
            onForgotPin();
          }}
          lockedUntil={lockedUntil}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg },
  head: { alignItems: 'center', gap: space.xs },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  figure: { alignItems: 'center', gap: space.sm },
  centre: { textAlign: 'center' },
  foot: { gap: space.sm },
  fees: { gap: AMOUNT.feeLines },
  note: {
    height: fieldMetrics.height,
    borderRadius: fieldMetrics.radius,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: AMOUNT.noteGap,
    paddingHorizontal: space.lg,
  },
  noteInput: { flex: 1, minWidth: 0, fontSize: AMOUNT.noteText, lineHeight: canvasNormalLineHeight(AMOUNT.noteText), padding: 0 },
});
