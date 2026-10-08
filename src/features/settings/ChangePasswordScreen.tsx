import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { adoptSession } from '@/api/session';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { AuthField } from '@/features/auth/AuthField';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { Banner } from '@/features/auth/Banner';
import { space } from '@/theme';

import { changePassword } from './api/identity';
import { MIN_LENGTH, passwordFailure, passwordProblems, SIGNED_OUT_FIRST, type PasswordFailure } from './passwordFailure';
import { startedInThisSession } from './sessionGuard';

/** design/_gen/auth.js line 21 (A22): the title is `h1` at 28, tracking -0.03em, line 1.15; 10 down, 6 between title and line, parts 16 apart. */
const TITLE = { size: 28, tracking: -0.03, leading: 1.15 } as const;
const TITLE_TOP = 10;
const TITLE_GAP = 6;
const BODY_GAP = space.lg;
/** How long "Password changed" stays up before the screen closes. */
const TOAST_MS = 1200;

export type ChangePasswordScreenProps = {
  onBack: () => void;
  /** After "Password changed" has been shown. The route decides where to go. */
  onDone: () => void;
};

type Missing = { current?: string; next?: string };

/**
 * Change password (SETTINGS-01, in A22's field style): the current password and the new one, then Save.
 * WAWU ID answers with a new session for this phone and ends every other phone's, so the screen keeps
 * the new tokens before it says anything. A refusal keeps what was typed and says why, on the field
 * that caused it where there is one.
 */
export function ChangePasswordScreen({ onBack, onDone }: ChangePasswordScreenProps) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failure, setFailure] = useState<PasswordFailure | null>(null);
  const [missing, setMissing] = useState<Missing>({});
  /** Set before the first await, so a second tap in the same frame is ignored whatever React has rendered. */
  const inFlight = useRef(false);
  const newInput = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!saved) return undefined;
    const timer = setTimeout(onDone, TOAST_MS);
    return () => clearTimeout(timer);
  }, [saved, onDone]);

  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setFailure(null);
    setMissing({});
  };

  const submit = async () => {
    if (inFlight.current || saved) return;
    const gaps = passwordProblems(current, next);
    if (gaps.current || gaps.next) {
      setMissing(gaps);
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setFailure(null);
    const sameSession = startedInThisSession();
    try {
      const pair = await changePassword(current, next);
      // The person signed out (or another account signed in) while this was on its way: the new tokens are not
      // adopted, or the phone would be signed back in as the account that left.
      if (!sameSession()) {
        setFailure(SIGNED_OUT_FIRST);
        return;
      }
      try {
        await adoptSession(pair);
      } catch {
        // The new session is already in memory; only a listener's cleanup failed. The password did change.
      }
      setSaved(true);
    } catch (error) {
      setFailure(passwordFailure(error));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const onCurrent = failure?.where === 'current' ? failure.message : missing.current;
  const onNew = failure?.where === 'new' ? failure.message : missing.next;

  return (
    <View style={styles.root}>
      <AuthFrame
        testID="password-screen"
        scrollRef={scrollRef}
        onBack={onBack}
        footer={<Button label="Save" full loading={busy} disabled={saved} onPress={() => void submit()} testID="password-save" />}
      >
        <View style={styles.body}>
          <View style={styles.titleBlock}>
            <Text variant="h1" style={{ fontSize: TITLE.size, lineHeight: TITLE.size * TITLE.leading, letterSpacing: TITLE.tracking * TITLE.size }}>
              Change password
            </Text>
            <Text variant="muted">Your other devices will be signed out.</Text>
          </View>
          {failure?.where === 'banner' ? <Banner tone={failure.tone} title={failure.title} body={failure.body} testID="password-banner" /> : null}
          <AuthField
            scrollRef={scrollRef}
            label="Current password"
            testID="password-current"
            value={current}
            onChangeText={edit(setCurrent)}
            error={onCurrent}
            secret
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => newInput.current?.focus()}
          />
          <AuthField
            scrollRef={scrollRef}
            label="New password"
            testID="password-new"
            inputRef={newInput}
            value={next}
            onChangeText={edit(setNext)}
            error={onNew}
            hint={`At least ${MIN_LENGTH} characters`}
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
      <Toast message={saved ? 'Password changed' : null} testID="password-changed" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { gap: BODY_GAP },
  titleBlock: { gap: TITLE_GAP, paddingTop: TITLE_TOP },
});
