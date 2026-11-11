import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { OpenWalletEnd } from '@/features/open-wallet/OpenWalletEnd';
import { MIN_LENGTH } from '@/features/settings/passwordFailure';
import { space } from '@/theme';

import { AuthField } from './AuthField';
import { AuthFrame } from './AuthFrame';
import { passwordsMatch, resetPasswordOutcome, resetPasswordProblems } from './resetPassword';
import type { Failure } from './signInFailure';

/** design/_gen/auth.js line 25, `reset`: the body's parts are 16 apart. */
const BODY_GAP = space.lg;
/** The same line, `pt: 14` (the body sits 14 under the bar). */
const BODY_TOP = 14;
/**
 * One sentence to a line. As one run of words it wrapped at 390 with "one." alone on the second line (RESET-APP round 1, L2); each
 * sentence is short enough to sit on a line of its own on every phone from 320 wide.
 */
export const SPENT_LINK_MESSAGE = 'It has expired or was already used.\nAsk for a new one.';

/**
 * The words of this screen, for the other two places the same form is used (APP-RESET): setting a first password from the activation
 * mail, and resetting with a code sent to the phone. Left out, they are the reset link's.
 */
export type ResetPasswordCopy = {
  navTitle?: string;
  /** The read-only first field: the email for a link, "Account" for a phone code (the account may have been named by a phone number). */
  accountLabel?: string;
  saveLabel?: string;
  doneTitle?: string;
  doneMessage?: string;
  invalidTitle?: string;
  invalidMessage?: string;
};

export type ResetPasswordScreenProps = {
  /** The address in the link (lower case). Shown, never edited. */
  email: string;
  /** False when the address held no usable token or email: the screen opens on "This link no longer works". */
  linkUsable?: boolean;
  /** Sends the new password with the link's token. Resolves when it is saved; rejects with an ApiError. */
  onSave: (password: string) => Promise<void>;
  /** The round back button. */
  onBack: () => void;
  /** "Sign in" on the success screen. */
  onSignIn: () => void;
  /** The button on "This link no longer works": back to Forgot password, or out of the screen for someone signed in. */
  onAskForNewLink: () => void;
  /**
   * Called once, right after "Password changed" is shown: the link's token is spent, so the route drops it from its own address at once
   * rather than holding it while the person reads the screen.
   */
  onSaved?: () => void;
  askLabel: string;
  copy?: ResetPasswordCopy;
  /**
   * Looks at a refused save first. Returning true means the caller has taken the person somewhere else (the phone-code path sends a
   * wrong code back to the code boxes), so this screen shows nothing for it.
   */
  onRefused?: (error: unknown) => boolean;
  /** What the fields start with, and which screen the app opens on (previews and tests, never the app). */
  initialPassword?: string;
  initialConfirm?: string;
  initialOutcome?: 'done' | 'invalid';
};

type Missing = { next?: string; confirm?: string };

/**
 * New password (design/_gen/auth.js line 25, `reset`: "New password" and "Confirm password" with "At least 8 characters" and
 * "Passwords match", then "Save password"), opened by the emailed reset link (RESET-APP, R-123). The email the link was
 * mailed to is the first field, read only, so the person sees which account this is for (no board draws it: gap row R-29). A saved
 * password says so and goes on to Sign in; a link that is spent (expired, already used, or never a real one) is one plain
 * screen with the way back to Forgot password. A refusal that is not the link keeps what was typed and says why.
 */
export function ResetPasswordScreen({
  email,
  linkUsable = true,
  onSave,
  onBack,
  onSignIn,
  onAskForNewLink,
  onSaved,
  askLabel,
  copy = {},
  onRefused,
  initialPassword = '',
  initialConfirm = '',
  initialOutcome,
}: ResetPasswordScreenProps) {
  const [next, setNext] = useState(initialPassword);
  const [confirm, setConfirm] = useState(initialConfirm);
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState<Missing>({});
  const [failure, setFailure] = useState<Failure | null>(null);
  const [fieldLine, setFieldLine] = useState<string | undefined>();
  const [outcome, setOutcome] = useState<'done' | 'invalid' | undefined>(initialOutcome);
  /** Set before the first await, so a second tap in the same frame is ignored whatever React has rendered. */
  const inFlight = useRef(false);
  const confirmInput = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setMissing({});
    setFieldLine(undefined);
    setFailure(null);
  };

  /**
   * Once "Password changed" is on screen (an effect runs after that frame is committed), hand the spent token back to the route to
   * drop. After the frame, not in the same tick as the save: the route re-renders without a token, and a frame between the two would
   * draw "This link no longer works" for a moment. A failure here is housekeeping, never a refused save.
   */
  const dropped = useRef(false);
  useEffect(() => {
    if (outcome !== 'done' || dropped.current) return;
    dropped.current = true;
    try {
      onSaved?.();
    } catch {
      // the route is already gone: nothing to drop, and "Password changed" stays up
    }
  }, [outcome, onSaved]);

  const submit = async () => {
    if (inFlight.current) return;
    const gaps = resetPasswordProblems(next, confirm);
    if (gaps.next || gaps.confirm) {
      setMissing(gaps);
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setFailure(null);
    try {
      await onSave(next);
      setOutcome('done');
    } catch (error) {
      if (onRefused?.(error)) return;
      const refused = resetPasswordOutcome(error);
      if (refused.kind === 'invalid') setOutcome('invalid');
      else if (refused.kind === 'field') setFieldLine(refused.message);
      else setFailure(refused.failure);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  if (outcome === 'done') {
    return (
      <OpenWalletEnd
        testID="reset-done"
        tone="in"
        icon="Check"
        title={copy.doneTitle ?? 'Password changed'}
        message={copy.doneMessage ?? 'Sign in with your new password.'}
        actionLabel="Sign in"
        onAction={onSignIn}
      />
    );
  }
  if (outcome === 'invalid' || !linkUsable) {
    return (
      <OpenWalletEnd
        testID="reset-invalid"
        tone="warn"
        icon="Clock"
        title={copy.invalidTitle ?? 'This link no longer works'}
        message={copy.invalidMessage ?? SPENT_LINK_MESSAGE}
        actionLabel={askLabel}
        onAction={onAskForNewLink}
      />
    );
  }

  const matching = passwordsMatch(next, confirm);
  return (
    <AuthFrame
      testID="reset-password"
      scrollRef={scrollRef}
      navTitle={copy.navTitle ?? 'New password'}
      onBack={onBack}
      footer={<Button label={copy.saveLabel ?? 'Save password'} full loading={busy} onPress={() => void submit()} testID="reset-submit" />}
    >
      <View style={styles.body}>
        {failure ? <Banner tone={failure.tone} title={failure.title} body={failure.body} testID="reset-banner" /> : null}
        <AuthField
          scrollRef={scrollRef}
          label={copy.accountLabel ?? 'Email'}
          testID="reset-email"
          value={email}
          disabled
          autoCapitalize="none"
          autoComplete="username"
          textContentType="username"
        />
        <AuthField
          scrollRef={scrollRef}
          label="New password"
          testID="reset-new"
          autoFocus
          value={next}
          onChangeText={edit(setNext)}
          error={fieldLine ?? missing.next}
          hint={`At least ${MIN_LENGTH} characters`}
          secret
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => confirmInput.current?.focus()}
        />
        <AuthField
          scrollRef={scrollRef}
          label="Confirm password"
          testID="reset-confirm"
          inputRef={confirmInput}
          value={confirm}
          onChangeText={edit(setConfirm)}
          error={missing.confirm}
          hint={matching ? 'Passwords match' : undefined}
          tone={matching ? 'ok' : undefined}
          secret
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={() => void submit()}
        />
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: BODY_GAP, paddingTop: BODY_TOP },
});
