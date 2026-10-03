import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { space, useWawu } from '@/theme';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { CodeScreen } from '@/features/auth/CodeScreen';
import { confirmEmailCode, putOffEmail, startEmailCode } from '@/features/auth/signupFlow';
import { emailOutcome } from '@/features/auth/signupFailure';
import { refreshSignupGate } from '@/features/auth/signupGate';

type Sent = { email: string | null; resendIn: number };
type Phase = { kind: 'sending' } | { kind: 'sent'; sent: Sent } | { kind: 'failed'; offline: boolean };

/**
 * The email step (SHARED-CHANGES AUTH-05 F2): a code mailed to the account's own
 * address, or "Later". Only reachable signed in, and only while the server's
 * progress says `email` (the root layout's guard). Opening it mails a code; a
 * code mailed a moment ago answers with the wait, and the screen counts that down.
 */
export default function EmailCodeRoute() {
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
      if (isApiError(error) && error.code === 'EMAIL_ALREADY_PROVEN') {
        await refreshSignupGate();
        return { kind: 'sending' };
      }
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

  if (phase.kind === 'failed') {
    return (
      <AuthFrame testID="email-code" navTitle="Check your email">
        <ErrorState
          title={phase.offline ? 'No connection' : "We couldn't send the code"}
          message={phase.offline ? 'Check your internet and try again.' : 'Try again in a moment.'}
          onRetry={() => {
            setPhase({ kind: 'sending' });
            void load().then(setPhase);
          }}
          testID="email-code-failed"
        />
      </AuthFrame>
    );
  }
  if (phase.kind === 'sending') {
    return (
      <AuthFrame testID="email-code" navTitle="Check your email">
        <View style={styles.sending} accessibilityLiveRegion="polite">
          <ActivityIndicator testID="email-code-sending" color={colors.textMuted} />
          <Text variant="muted">Sending your code</Text>
        </View>
      </AuthFrame>
    );
  }
  const sent = phase.sent;
  return (
    <CodeScreen
      key={sent.resendIn + (sent.email ?? '')}
      testID="email-code"
      navTitle="Check your email"
      subtitle={sent.email ? `Sent to ${sent.email}` : 'Sent to your email address'}
      resendIn={sent.resendIn}
      onSubmit={(code) => confirmEmailCode(code)}
      onResend={async () => {
        const answer = await startEmailCode();
        email.current = answer.email;
        return answer.resendIn;
      }}
      classify={emailOutcome}
      later={{ label: 'Later', onPress: putOffEmail }}
    />
  );
}

const styles = StyleSheet.create({
  sending: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
});
