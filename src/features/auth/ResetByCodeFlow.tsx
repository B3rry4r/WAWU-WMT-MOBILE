import { useState } from 'react';

import { CodeScreen } from './CodeScreen';
import { codeWasRefused, resetCodeOutcome } from './resetPassword';
import { ResetPasswordScreen, type ResetPasswordCopy } from './ResetPasswordScreen';

/** The words of the new-password step when it follows a code: the first field names the account, not "Email" (it may be a number). */
const COPY: ResetPasswordCopy = { accountLabel: 'Account' };

export type ResetByCodeFlowProps = {
  /** The email or +234 number the code was asked for, exactly as it was sent to WAWU ID. */
  identifier: string;
  /** Asks for another code. Rejects with an ApiError. */
  onResend: () => Promise<void>;
  /** Sends the code and the new password. Rejects with an ApiError; a 401 is a wrong or expired code. */
  onSave: (code: string, password: string) => Promise<void>;
  /** Back from the code boxes: to the Forgot password form. */
  onBack: () => void;
  /** "Sign in" on the success screen. */
  onSignIn: () => void;
  /** What the flow starts in (a preview, never the app). */
  initialStep?: 'code' | 'password';
  initialCode?: string;
  initialWrong?: boolean;
};

/**
 * The phone-code way back in (APP-RESET, R-133 point 4), after Forgot password sent a code: six boxes (the sign-up's own code
 * screen), then the new password, then "Password changed". The code is sent with the password, because WAWU ID checks it only
 * there. A wrong or expired code sends the person back to the boxes with "That code isn't right" and the password they typed is
 * dropped with the screen; the rest of a refusal is the New password screen's own.
 */
export function ResetByCodeFlow({ identifier, onResend, onSave, onBack, onSignIn, initialStep = 'code', initialCode = '', initialWrong = false }: ResetByCodeFlowProps) {
  const [step, setStep] = useState(initialStep);
  const [code, setCode] = useState(initialCode);
  const [wrong, setWrong] = useState(initialWrong);
  /** Counts the times the boxes are opened afresh, so a wrong code starts a clean set of boxes. */
  const [round, setRound] = useState(0);

  if (step === 'code') {
    return (
      <CodeScreen
        key={round}
        testID="reset-code"
        navTitle="Reset password"
        subtitle="If that account has a phone we can reach, a 6-digit code is on its way."
        resendIn={0}
        initialWrong={wrong}
        onBack={onBack}
        onSubmit={async (entered) => {
          setCode(entered);
          setWrong(false);
          setStep('password');
        }}
        onResend={async () => {
          await onResend();
          // WAWU ID names no wait for the next code; a too-early ask is answered with a 429 and its own figure.
          return 0;
        }}
        classify={resetCodeOutcome}
      />
    );
  }
  return (
    <ResetPasswordScreen
      email={identifier}
      copy={COPY}
      onSave={(password) => onSave(code, password)}
      onBack={() => setStep('code')}
      onSignIn={onSignIn}
      onAskForNewLink={onBack}
      askLabel="Back to Forgot password"
      onRefused={(error) => {
        if (!codeWasRefused(error)) return false;
        setWrong(true);
        setRound((n) => n + 1);
        setStep('code');
        return true;
      }}
    />
  );
}
