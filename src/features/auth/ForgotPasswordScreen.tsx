import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Icon } from '@/components/icon';
import { readPhone } from '@/features/geo/phone';
import { Text } from '@/components/Text';
import { useWawu } from '@/theme';

import { AuthField } from './AuthField';
import { AuthFrame } from './AuthFrame';
import { Banner } from '@/components/Banner';
import { describeExpiry } from './expiry';
import { resetFailure, type Failure } from './signInFailure';

/** design/_gen/auth.js line 22: the title block sits 10 px down, with 6 between title and line; the body gap is 18. */
const TITLE_TOP = 10;
const TITLE_GAP = 6;
const BODY_GAP = 18;
/** design/_gen/kit.js line 38, `foot`: 10 between the buttons. */
const FOOT_GAP = 10;
/** design/_gen/auth.js line 23: the sent screen's content sits 120 px down (below the 50 px status bar the phone draws itself), with 16 between the result and the expiry line. */
const SENT_TOP = 120;
const SENT_GAP = 16;
/** design/_gen/kit.js line 67, `result`: an 88 px circle, a 42 px glyph at 2.2, a 30 px title, a 14.5 px line and the title pushed 8 further than the 10 px gap. */
/** The result title sits 8 px lower than its neighbours (kit.js line 67, `margin-top:8px`). */
const SENT_TITLE_TOP = 8;
const RESULT = { circle: 88, glyph: 42, stroke: 2.2, line: 14.5, between: 10 } as const;
/** The same address pattern WAWU ID's DTO would accept: something, an at sign, something with a dot. */
const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ForgotPasswordScreenProps = {
  /** Asks WAWU ID to email a reset link. Resolves with the link's lifetime in seconds, or null when the server does not say. */
  onSend: (email: string) => Promise<{ expiresInSeconds: number | null }>;
  /** Back to A22 (the back button on A23 and "Back to sign in" on A24). */
  onBackToSignIn: () => void;
  /**
   * Asks WAWU ID to send a 6-digit code to the account's phone (APP-RESET, R-133 point 4). Given, the screen offers "Send a code to
   * my phone" under the email path, for the person whose email was never proven and so is mailed nothing.
   */
  onSendCode?: (identifier: string) => Promise<void>;
  /** The code is on its way: the route opens the code boxes for this identifier (the email or the +234 number as it was sent). */
  onCodeSent?: (identifier: string) => void;
  /** Email already typed on A22. */
  initialEmail?: string;
  /** Opens on A24 straight away (a preview, never the app). */
  initialSent?: { email: string; expiresInSeconds: number | null };
  /** Opens on the phone-code path (a preview, never the app). */
  initialByPhone?: boolean;
};

/**
 * A23 (ask for the link) and A24 (the link was sent). The address shown on A24
 * is the one the user typed and the server accepted, and the expiry is the
 * server's own figure: when it sends none, the line is left out.
 */
export function ForgotPasswordScreen({ onSend, onSendCode, onCodeSent, onBackToSignIn, initialEmail = '', initialSent, initialByPhone = false }: ForgotPasswordScreenProps) {
  const { colors } = useWawu();
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [problem, setProblem] = useState<string | undefined>();
  const [sent, setSent] = useState(initialSent ?? null);
  /** The phone-code path: the same field, taking the email or the phone number, and a code sent instead of a link. */
  const [byPhone, setByPhone] = useState(initialByPhone);
  const inFlight = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  const switchTo = (phone: boolean) => {
    if (inFlight.current) return;
    setByPhone(phone);
    setProblem(undefined);
    setFailure(null);
  };

  const submit = async () => {
    if (inFlight.current) return;
    const typed = email.trim();
    // The phone path takes the account's email or its phone number; a number is written as +234... the way WAWU ID stores it.
    let identifier = typed;
    if (byPhone) {
      if (!typed) {
        setProblem('Enter your email or phone number.');
        return;
      }
      if (!typed.includes('@')) {
        const read = readPhone(typed, 'NG');
        if (!read.ok) {
          setProblem('Enter your email, or your phone number with its country code, like +234 801 234 5678.');
          return;
        }
        identifier = read.e164;
      } else if (!LOOKS_LIKE_EMAIL.test(typed)) {
        setProblem('Enter your email, or your phone number with its country code, like +234 801 234 5678.');
        return;
      }
    } else if (!LOOKS_LIKE_EMAIL.test(typed)) {
      setProblem(typed ? 'Enter the email you signed up with, like name@example.com.' : 'Enter your email.');
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setFailure(null);
    try {
      if (byPhone) {
        await onSendCode?.(identifier);
        onCodeSent?.(identifier);
      } else {
        const answer = await onSend(typed);
        setSent({ email: typed, expiresInSeconds: answer.expiresInSeconds });
      }
    } catch (error) {
      setFailure(resetFailure(error));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  if (sent) {
    const expiry = describeExpiry(sent.expiresInSeconds);
    return (
      <AuthFrame
        testID="check-email"
        bare
        contentTop={SENT_TOP}
        footer={<Button label="Back to sign in" variant="secondary" full onPress={onBackToSignIn} testID="check-email-back" />}
      >
        <View style={styles.sent}>
          <View style={styles.result}>
            <View style={[styles.circle, { backgroundColor: colors.accentTint }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Icon name="Mail" size={RESULT.glyph} color={colors.accent} strokeWidth={RESULT.stroke} />
            </View>
            <Text variant="title" accessibilityRole="header" style={styles.sentTitle}>
              Check your email
            </Text>
            <Text variant="body" tone="textSecondary" style={styles.sentLine} testID="check-email-address">
              {`We sent a link to ${sent.email}`}
            </Text>
          </View>
          {expiry ? (
            <Text variant="muted" style={styles.centerText} testID="check-email-expiry">
              {`It expires in ${expiry}.`}
            </Text>
          ) : null}
        </View>
      </AuthFrame>
    );
  }

  const canUsePhone = onSendCode !== undefined;
  return (
    <AuthFrame
      testID="forgot-password"
      scrollRef={scrollRef}
      navTitle="Reset password"
      onBack={onBackToSignIn}
      footer={
        <View style={styles.footer}>
          <Button
            label={byPhone ? 'Send code' : 'Send reset link'}
            full
            loading={busy}
            onPress={() => void submit()}
            testID="forgot-submit"
          />
          {canUsePhone ? (
            <Button
              label={byPhone ? 'Email me a link instead' : 'Send a code to my phone'}
              variant="secondary"
              full
              onPress={() => switchTo(!byPhone)}
              testID="forgot-switch"
            />
          ) : null}
        </View>
      }
    >
      <View style={styles.body}>
        <View style={styles.titleBlock}>
          <Text variant="h1">Forgot your password?</Text>
          {/* MECHANISM: WAWU ID POST /auth/forgot-password with method 'email' mails the link, with method 'sms' sends a code (auth.service.ts forgotPassword). */}
          <Text variant="muted" testID="forgot-line">
            {byPhone
              ? "We'll send a 6-digit code to the phone on your account. Type your email or your phone number."
              : // MECHANISM: WAWU ID POST /auth/forgot-password with method 'email' mails the link (auth.service.ts forgotPassword).
                "We'll email you a link to set a new one."}
          </Text>
        </View>
        {failure ? <Banner tone={failure.tone} title={failure.title} body={failure.body} testID="forgot-banner" /> : null}
        <AuthField
          scrollRef={scrollRef}
          label={byPhone ? 'Email or phone number' : 'Email'}
          autoFocus
          testID="forgot-email"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setProblem(undefined);
            setFailure(null);
          }}
          error={problem}
          keyboardType={byPhone ? 'default' : 'email-address'}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={byPhone ? 'off' : 'email'}
          textContentType={byPhone ? 'none' : 'emailAddress'}
          returnKeyType="send"
          onSubmitEditing={() => void submit()}
        />
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  footer: { gap: FOOT_GAP },
  body: { gap: BODY_GAP },
  titleBlock: { gap: TITLE_GAP, paddingTop: TITLE_TOP },
  sent: { alignItems: 'center', gap: SENT_GAP },
  result: { alignItems: 'center', gap: RESULT.between },
  circle: { width: RESULT.circle, height: RESULT.circle, borderRadius: RESULT.circle / 2, alignItems: 'center', justifyContent: 'center' },
  sentTitle: { marginTop: SENT_TITLE_TOP, textAlign: 'center' },
  sentLine: { textAlign: 'center', fontSize: RESULT.line },
  centerText: { textAlign: 'center' },
});
