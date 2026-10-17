import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { layout, space } from '@/theme';

import type { SignupChannel } from '@/api/identity';

import { AuthField } from './AuthField';
import { AuthFrame } from './AuthFrame';
import { Banner } from '@/components/Banner';
import { signupFailure, type SignupFailure } from './signupFailure';
import { ConsentBox } from '@/features/open-wallet/ConsentBox';

/** The shortest password WAWU ID takes (`contract/identity/openapi.json`, `SignupDto.password.minLength`); A3's hint "At least 8 characters". */
export const MIN_PASSWORD = 8;
/** The shortest phone WAWU ID takes (same file, `SignupDto.phone.minLength`). */
const MIN_PHONE = 7;

/** design/_gen/auth.js line 54: the heading is `h1` at 24 px, the form `gap: 14`; kit.js line 41, h1 tracking -0.03em, line 1.15. */
const TITLE = { size: 24, tracking: -0.03, leading: 1.15, apart: 6 } as const;
const BODY_GAP = 14;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The line under A3's heading, by where the code will go (BRIEF, A3 and A4). */
const CHANNEL_LINE: Record<SignupChannel, string> = {
  // MECHANISM: WAWU ID mails the 6-digit code through Resend (EmailSignupService) when its SIGNUP_VERIFY_CHANNEL is email, R-39.
  email: "We'll email you a code to confirm your address.",
  // MECHANISM: WAWU ID texts the 6-digit code (PhoneSignupService) while its SIGNUP_VERIFY_CHANNEL is phone, the default.
  phone: "We'll text a code to your phone.",
};

export type SignUpValues = { email: string; phone: string; password: string };

export type SignUpScreenProps = {
  /** Starts the sign-up. Resolves when the code has been sent (the route opens A4); rejects with an ApiError. */
  onContinue: (values: SignUpValues) => Promise<void>;
  onBack?: () => void;
  /** A sign-up is waiting for its code: A3 offers to go back and enter it. */
  onEnterSentCode?: () => void;
  /**
   * Which way WAWU ID will send the code (`GET /auth/signup/channel`), so the line under the heading names the channel
   * A4 will then name. Null or left out while it is not known: the line is not drawn, never guessed.
   */
  channel?: SignupChannel | null;
  /** The terms and the privacy policy behind the consent line's two words (public screens, readable before sign-up). */
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
  /** What the fields start with (a preview, never the app). */
  initial?: Partial<SignUpValues>;
  /** A refusal to show at first (a preview, never the app). */
  initialFailure?: SignupFailure;
};

type Missing = { email?: string; phone?: string; password?: string; agreed?: string };

/** A3's consent line is required: the sign-up goes ahead only with it ticked (R-67). */
const AGREE_NEEDS = 'Tick the box to agree before you continue.';

/**
 * A3: Email, Phone number, Password, the terms line and Continue. No BVN and no NIBSS line:
 * identity checks happen when someone opens a wallet (R-6, BRIEF A3). A failed
 * Continue keeps what was typed and says why in a banner.
 */
export function SignUpScreen({ onContinue, onBack, onEnterSentCode, onOpenTerms, onOpenPrivacy, channel, initial, initialFailure }: SignUpScreenProps) {
  const [email, setEmail] = useState(initial?.email ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [password, setPassword] = useState(initial?.password ?? '');
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<SignupFailure | null>(initialFailure ?? null);
  const [missing, setMissing] = useState<Missing>({});
  const inFlight = useRef(false);
  const phoneInput = useRef<TextInput>(null);
  const passwordInput = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setFailure(null);
    setMissing({});
  };

  const submit = async () => {
    if (inFlight.current) return;
    const typed = { email: email.trim(), phone: phone.trim(), password };
    const gaps: Missing = {
      email: !typed.email ? 'Enter your email.' : EMAIL_SHAPE.test(typed.email) ? undefined : 'Enter a valid email.',
      phone: typed.phone.replace(/\D/g, '').length < MIN_PHONE ? 'Enter your phone number.' : undefined,
      password: typed.password.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters.` : undefined,
      agreed: agreed ? undefined : AGREE_NEEDS,
    };
    if (gaps.email || gaps.phone || gaps.password || gaps.agreed) {
      setMissing(gaps);
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setFailure(null);
    try {
      await onContinue(typed);
    } catch (error) {
      setFailure(signupFailure(error));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <AuthFrame
      testID="sign-up"
      scrollRef={scrollRef}
      onBack={onBack}
      navTitle="Create your account"
      footer={
        <>
          <Button label="Continue" full loading={busy} onPress={() => void submit()} testID="sign-up-submit" />
          {onEnterSentCode ? (
            <Pressable testID="sign-up-sent-code" accessibilityRole="link" accessibilityLabel="Enter the code we sent" hitSlop={layout.tapMin / 4} onPress={onEnterSentCode} style={styles.sent}>
              <Text variant="linkStrong">Enter the code we sent</Text>
            </Pressable>
          ) : null}
        </>
      }
    >
      <View style={styles.body}>
        <View style={styles.titleBlock}>
          <Text variant="h1" style={{ fontSize: TITLE.size, lineHeight: TITLE.size * TITLE.leading, letterSpacing: TITLE.tracking * TITLE.size }}>
            Create your account
          </Text>
          <Text variant="muted">Free. Takes a minute.</Text>
          {/* MECHANISM: WAWU ID POST /auth/signup sends the 6-digit code the way its SIGNUP_VERIFY_CHANNEL says (GET /auth/signup/channel): texted by default, mailed through Resend with `email` (EmailSignupService, R-39). */}
          {channel ? <Text variant="muted">{CHANNEL_LINE[channel]}</Text> : null}
        </View>
        {failure ? <Banner tone={failure.tone} title={failure.title} body={failure.body} testID="sign-up-banner" /> : null}
        <AuthField
          scrollRef={scrollRef}
          label="Email"
          testID="sign-up-email"
          value={email}
          onChangeText={edit(setEmail)}
          error={missing.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => phoneInput.current?.focus()}
        />
        <AuthField
          scrollRef={scrollRef}
          label="Phone number"
          testID="sign-up-phone"
          inputRef={phoneInput}
          value={phone}
          onChangeText={edit(setPhone)}
          error={missing.phone}
          invalid={failure?.field === 'phone'}
          keyboardType="phone-pad"
          autoCorrect={false}
          autoComplete="tel"
          textContentType="telephoneNumber"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordInput.current?.focus()}
        />
        <AuthField
          scrollRef={scrollRef}
          label="Password"
          testID="sign-up-password"
          inputRef={passwordInput}
          value={password}
          onChangeText={edit(setPassword)}
          hint={`At least ${MIN_PASSWORD} characters`}
          error={missing.password}
          secret
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={() => void submit()}
        />
        <ConsentBox
          testID="sign-up-consent"
          agreed={agreed}
          busy={busy}
          problem={missing.agreed}
          onOpenTerms={onOpenTerms}
          onOpenPrivacy={onOpenPrivacy}
          onToggle={() => {
            setAgreed((now) => !now);
            setMissing((now) => ({ ...now, agreed: undefined }));
          }}
        />
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: BODY_GAP, paddingTop: space.sm },
  titleBlock: { gap: TITLE.apart },
  sent: { alignSelf: 'center' },
});
