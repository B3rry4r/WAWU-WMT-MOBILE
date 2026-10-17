import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { space, useWawu } from '@/theme';

import { requestDeletion, type LeavingReason } from './api';
import { CONFIRM_WORD, isConfirmed, problemOf, reasonLabel } from './model';
import { ReasonSheet } from './ReasonSheet';
import { WalletNotice } from './WalletNotice';

/** design/_gen/settings.js line 16 (Z7): the two fields 16 apart, 14 below the bar. */
const LOOK = { parts: space.lg, top: 14 } as const;

export type ConfirmDeletionScreenProps = {
  onBack: () => void;
  /** The Hub scheduled it: Z8 with the Hub's date. */
  onScheduled: (at: string) => void;
  /** Withdraw: W17, offered when the Hub says the wallet holds money. */
  onWithdraw: () => void;
};

/** What the Hub refused with, shown as it said it. */
type Refusal = { message: string; withdraw: boolean };

/**
 * Z7 · Confirm. The reason is optional (the Hub keeps it with the deletion); the button opens once DELETE is typed. One tap sends one request:
 * a second tap while it is out does nothing, and the Hub answers a repeat with the same date. The Hub decides whether the money allows it:
 * a refusal (money in the wallet, a sale or hold still settling) is shown in the Hub's own words, with Withdraw when the wallet holds money;
 * any other failure keeps what was typed and says why, and the same button tries again.
 */
export function ConfirmDeletionScreen({ onBack, onScheduled, onWithdraw }: ConfirmDeletionScreenProps) {
  const { colors } = useWawu();
  const [reason, setReason] = useState<LeavingReason | null>(null);
  const [picking, setPicking] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  /** Set before the first await, so a second tap in the same frame is ignored whatever React has rendered. */
  const inFlight = useRef(false);

  const submit = async () => {
    if (inFlight.current || !isConfirmed(typed)) return;
    inFlight.current = true;
    setBusy(true);
    setRefusal(null);
    setProblem(null);
    try {
      const answer = await requestDeletion(reason);
      if (answer.kind === 'scheduled') onScheduled(answer.at);
      else setRefusal({ message: answer.message, withdraw: answer.withdraw });
    } catch (error) {
      setProblem(problemOf(error));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <AuthFrame
      testID="confirm-deletion-screen"
      navTitle="Delete account"
      onBack={onBack}
      contentTop={LOOK.top}
      footer={
        <View style={styles.foot}>
          {problem ? (
            <Text variant="errorLine" tone="danger" accessibilityRole="alert" accessibilityLiveRegion="polite" testID="confirm-problem" style={styles.problem}>
              {problem}
            </Text>
          ) : null}
          <Button
            testID="confirm-delete"
            label="Delete my account"
            full
            loading={busy}
            disabled={!isConfirmed(typed)}
            onPress={() => void submit()}
            style={isConfirmed(typed) && !busy ? { backgroundColor: colors.danger } : undefined}
          />
        </View>
      }
    >
      <View style={styles.body}>
        {refusal ? (
          <WalletNotice
            testID="confirm-refused"
            title="We can't delete your account yet"
            body={refusal.message}
            action={refusal.withdraw ? { testID: 'confirm-withdraw', label: 'Withdraw', onPress: onWithdraw } : undefined}
          />
        ) : null}
        <TextField
          testID="confirm-reason"
          label="Why are you leaving? (optional)"
          placeholder="Choose a reason"
          value={reason ? reasonLabel(reason) : ''}
          onPress={() => setPicking(true)}
        />
        <TextField
          testID="confirm-typed"
          label={`Type ${CONFIRM_WORD} to confirm`}
          value={typed}
          onChangeText={(text) => {
            setTyped(text);
            setProblem(null);
          }}
          mono
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          returnKeyType="go"
          onSubmitEditing={() => void submit()}
        />
      </View>
      <ReasonSheet
        visible={picking}
        value={reason}
        onPick={(next) => {
          setReason(next);
          setPicking(false);
        }}
        onClose={() => setPicking(false)}
      />
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: LOOK.parts },
  foot: { gap: space.sm },
  problem: { textAlign: 'center' },
});
