import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { formatMoney } from '@/components/Money';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { Text } from '@/components/Text';
import { koboOfText } from '@/components/amount-entry';
import { newClientMessageId, type ChatMessage } from './api';
import { createMoneyRequest } from './requestApi';

const SHEET_GAP = 16;
/** `CreateMoneyRequestDto.memo` takes 100 characters (the contract). */
const MEMO_MAX = 100;
const MAX_WHOLE_DIGITS = 9;

/** The digits and at most one point with two kobo digits: what the field keeps of what was typed. */
export function cleanAmount(raw: string): string {
  const only = raw.replace(/[^0-9.]/g, '');
  const point = only.indexOf('.');
  if (point === -1) return only.replace(/^0+(?=\d)/, '').slice(0, MAX_WHOLE_DIGITS);
  const whole = only.slice(0, point).replace(/^0+(?=\d)/, '').slice(0, MAX_WHOLE_DIGITS);
  const fraction = only.slice(point + 1).replace(/\./g, '').slice(0, 2);
  return `${whole === '' ? '0' : whole}.${fraction}`;
}

/** "₦12,000", "₦12,000.5": the field as the board draws it, from what was kept. */
export function shownAmount(text: string): string {
  if (text === '') return '';
  const [whole = '', fraction] = text.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `₦${grouped}${fraction !== undefined ? `.${fraction}` : ''}`;
}

export type RequestSheetProps = {
  chatId: string;
  /** The other person's first name: "Request from Femi". */
  name: string;
  visible: boolean;
  onClose: () => void;
  /** The request is in the chat: its message goes into the thread. */
  onSent: (message: ChatMessage) => void;
  /** The asker has no wallet yet (R-6): Open your wallet. */
  onOpenWallet: () => void;
};

/**
 * I16 · Request from Femi: an amount, what it is for, "Nothing moves until they tap Pay", and a button that carries the amount. The
 * request is one `clientRequestId` per sheet, so a tap whose answer was lost and the next tap ask once; the other person gets it in
 * this chat. The asker needs an open wallet to receive what they ask for (R-6): without one they are led to Open your wallet.
 */
export function RequestSheet({ chatId, name, visible, onClose, onSent, onOpenWallet }: RequestSheetProps) {
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One id per request: a retry of the same amount and words sends the same one, a change makes a new one.
  const id = useRef<{ sig: string; value: string } | null>(null);
  const kobo = koboOfText(amount);

  const reset = () => {
    setAmount('');
    setMemo('');
    setError(null);
    id.current = null;
  };
  const close = () => {
    if (sending) return;
    onClose();
    reset();
  };

  const send = async () => {
    if (sending || kobo <= 0) return;
    const sig = `${kobo}|${memo.trim()}`;
    if (id.current?.sig !== sig) id.current = { sig, value: newClientMessageId() };
    setSending(true);
    setError(null);
    try {
      const outcome = await createMoneyRequest(chatId, { amountKobo: kobo, memo, clientRequestId: id.current.value });
      if (outcome.kind === 'done') {
        onSent(outcome.message);
        onClose();
        reset();
      } else if (outcome.kind === 'no_wallet') {
        onClose();
        onOpenWallet();
      } else if (outcome.kind === 'unanswered') {
        setError('Check your connection and try again.');
      } else {
        setError(outcome.message);
      }
    } catch (failure) {
      setError(isApiError(failure) && failure.message ? failure.message : 'Check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={close} label={`Request from ${name}`} gap={SHEET_GAP} dismissible={!sending} testID="request-sheet">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.body}>
        <Text variant="sheetTitleSm">{`Request from ${name}`}</Text>
        <TextField
          testID="request-amount"
          label="Amount"
          value={shownAmount(amount)}
          onChangeText={(text) => setAmount(cleanAmount(text))}
          keyboardType="decimal-pad"
          placeholder="₦0"
          autoFocus
        />
        <TextField testID="request-memo" label="What it’s for" value={memo} onChangeText={setMemo} maxLength={MEMO_MAX} placeholder="Optional" />
        <Text variant="muted">{`${name} gets a request in this chat and pays from their wallet. Nothing moves until they tap Pay.`}</Text>
        {error ? (
          <Text variant="errorLine" tone="danger" accessibilityRole="alert" testID="request-error">
            {error}
          </Text>
        ) : null}
        <View>
          <Button
            testID="request-send"
            label={kobo > 0 ? `Request ${formatMoney(kobo, { decimals: kobo % 100 !== 0 })}` : 'Request'}
            full
            loading={sending}
            disabled={kobo <= 0}
            onPress={() => void send()}
          />
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({ body: { gap: SHEET_GAP } });
