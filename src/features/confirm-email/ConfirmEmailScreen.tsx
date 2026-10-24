import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { CodeScreen } from '@/features/auth/CodeScreen';
import { emailOutcome } from '@/features/auth/signupFailure';
import { startEmailCode } from '@/features/auth/signupFlow';
import { space, useWawu } from '@/theme';

import { alreadyProven, confirmAccountEmail, noEmail } from './api';

type Sent = { email: string | null; resendIn: number };
type Phase = { kind: 'sending' } | { kind: 'sent'; sent: Sent } | { kind: 'failed'; offline: boolean } | { kind: 'none' } | { kind: 'proven' };

export type ConfirmEmailScreenProps = {
  onBack: () => void;
  /** The email is proven (a right code, or it was proven already): the screen that sent the person here reads again. */
  onConfirmed: () => void;
};

const TITLE = 'Confirm your email';

/**
 * Confirm your email (G-486): a 6-digit code mailed to the account's own address, then the Hub knows it is proven. Opened from
 * W38 when a statement cannot be sent because no email was ever confirmed. Opening it mails a code; a code mailed a moment ago
 * answers with the wait, and the screen counts that down. It has no "Later": the person came here to confirm, and Back leaves.
 */
export function ConfirmEmailScreen({ onBack, onConfirmed }: ConfirmEmailScreenProps) {
  const { colors } = useWawu();
  const [phase, setPhase] = useState<Phase>({ kind: 'sending' });
  const email = useRef<string | null>(null);

  const load = useCallback(async (): Promise<Phase> => {
    try {
      const answer = await startEmailCode();
      email.current = answer.email;
      return { kind: 'sent', sent: { email: answer.email, resendIn: answer.resendIn } };
    } catch (error) {
      if (isApiError(error) && error.code === 'EMAIL_CODE_RESEND_TOO_SOON') {
        return { kind: 'sent', sent: { email: email.current, resendIn: error.retryAfterSeconds ?? 0 } };
      }
      if (alreadyProven(error)) return { kind: 'proven' };
      if (noEmail(error)) return { kind: 'none' };
      return { kind: 'failed', offline: isApiError(error) && error.kind === 'network' };
    }
  }, []);

  useEffect(() => {
    let alive = true;
    void load().then((next) => alive && setPhase(next));
    return () => {
      alive = false;
    };
  }, [load]);

  const proven = phase.kind === 'proven';
  useEffect(() => {
    if (proven) onConfirmed();
  }, [proven, onConfirmed]);

  if (phase.kind === 'failed') {
    return (
      <AuthFrame testID="confirm-email" navTitle={TITLE} onBack={onBack}>
        <ErrorState
          title={phase.offline ? 'No connection' : "We couldn't send the code"}
          message={phase.offline ? 'Check your internet and try again.' : 'Try again in a moment.'}
          onRetry={() => {
            setPhase({ kind: 'sending' });
            void load().then(setPhase);
          }}
          testID="confirm-email-failed"
        />
      </AuthFrame>
    );
  }
  if (phase.kind === 'none') {
    return (
      <AuthFrame testID="confirm-email" navTitle={TITLE} onBack={onBack}>
        <EmptyState testID="confirm-email-none" icon="Mail" title="No email address on your account" message="There is no address here to send a code to." />
      </AuthFrame>
    );
  }
  if (phase.kind === 'sending' || phase.kind === 'proven') {
    return (
      <AuthFrame testID="confirm-email" navTitle={TITLE} onBack={onBack}>
        <View style={styles.sending} accessibilityLiveRegion="polite">
          <ActivityIndicator testID="confirm-email-sending" color={colors.textMuted} />
          <Text variant="muted">Sending your code</Text>
        </View>
      </AuthFrame>
    );
  }
  const sent = phase.sent;
  return (
    <CodeScreen
      key={sent.resendIn + (sent.email ?? '')}
      testID="confirm-email"
      navTitle={TITLE}
      onBack={onBack}
      subtitle={sent.email ? `Sent to ${sent.email}` : 'Sent to your email address'}
      resendIn={sent.resendIn}
      onSubmit={async (code) => {
        await confirmAccountEmail(code);
        onConfirmed();
      }}
      onResend={async () => {
        const answer = await startEmailCode();
        email.current = answer.email;
        return answer.resendIn;
      }}
      classify={emailOutcome}
    />
  );
}

const styles = StyleSheet.create({
  sending: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
});
