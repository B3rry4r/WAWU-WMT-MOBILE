import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { Text } from '@/components/Text';
import { layout, space } from '@/theme';

import { AuthFrame } from './AuthFrame';
import { Banner } from './Banner';
import { signInFailure, type Failure } from './signInFailure';

/** design/_gen/auth.js line 21: the title is `h1` at 28 px, tracking -0.03em, line 1.15. */
const TITLE = { size: 28, tracking: -0.03, leading: 1.15 } as const;
/** design/_gen/auth.js line 21: the title block sits 10 px down, with 6 between title and line. */
const TITLE_TOP = 10;
const TITLE_GAP = 6;
/** The body's gap between title, banner, fields and link (auth.js line 21, `gap: 16`). */
const BODY_GAP = space.lg;

export type SignInScreenProps = {
  /** Signs in with what was typed. Rejects with an ApiError. The route passes the session's `signIn`. */
  onSignIn: (identifier: string, password: string) => Promise<void>;
  /** Opens A23, handing over what was typed in Email. */
  onForgot: (typedEmail: string) => void;
  /** The round back button. Absent when there is no screen behind this one. */
  onBack?: () => void;
  /** What the fields start with (a preview, never the app). */
  initialEmail?: string;
  initialPassword?: string;
};

type Missing = { email?: string; password?: string };

/**
 * A22 and A25: email, password, Forgot password?, Sign in. A failed sign-in
 * keeps what was typed, says why in a banner above the form (A25 for a wrong
 * email or password) and outlines the password field when the credentials are
 * the cause. A successful one changes the session; the route graph then moves
 * the user to Home, so this screen navigates nowhere itself.
 */
export function SignInScreen({ onSignIn, onForgot, onBack, initialEmail = '', initialPassword = '' }: SignInScreenProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [missing, setMissing] = useState<Missing>({});
  /** Set before the first await, so a second tap in the same frame is ignored whatever React has rendered. */
  const inFlight = useRef(false);
  const passwordInput = useRef<TextInput>(null);

  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setFailure(null);
    setMissing({});
  };

  const submit = async () => {
    if (inFlight.current) return;
    const typed = { email: email.trim(), password };
    const gaps: Missing = {
      email: typed.email ? undefined : 'Enter your email.',
      password: typed.password ? undefined : 'Enter your password.',
    };
    if (gaps.email || gaps.password) {
      setMissing(gaps);
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setFailure(null);
    try {
      await onSignIn(typed.email, typed.password);
    } catch (error) {
      setFailure(signInFailure(error));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <AuthFrame
      testID="sign-in"
      onBack={onBack}
      footer={<Button label="Sign in" full loading={busy} onPress={() => void submit()} testID="sign-in-submit" />}
    >
      <View style={styles.body}>
        <View style={styles.titleBlock}>
          <Text
            variant="h1"
            style={{ fontSize: TITLE.size, lineHeight: TITLE.size * TITLE.leading, letterSpacing: TITLE.tracking * TITLE.size }}
          >
            Welcome back
          </Text>
          <Text variant="muted">Sign in with your email.</Text>
        </View>
        {failure ? <Banner tone={failure.tone} title={failure.title} body={failure.body} testID="sign-in-banner" /> : null}
        <TextField
          label="Email"
          testID="sign-in-email"
          value={email}
          onChangeText={edit(setEmail)}
          error={missing.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordInput.current?.focus()}
        />
        <TextField
          label="Password"
          testID="sign-in-password"
          inputRef={passwordInput}
          value={password}
          onChangeText={edit(setPassword)}
          error={missing.password}
          invalid={failure?.credentials}
          secret
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => void submit()}
        />
        <Pressable
          testID="sign-in-forgot"
          accessibilityRole="link"
          accessibilityLabel="Forgot password?"
          hitSlop={layout.tapMin / 4}
          onPress={() => onForgot(email.trim())}
          style={styles.forgot}
        >
          <Text variant="linkStrong">Forgot password?</Text>
        </Pressable>
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: BODY_GAP },
  titleBlock: { gap: TITLE_GAP, paddingTop: TITLE_TOP },
  forgot: { alignSelf: 'flex-end' },
});
