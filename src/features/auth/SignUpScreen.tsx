import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { CountryPicker, type PickerItem } from '@/components/CountryPicker';
import { PhoneField } from '@/components/PhoneField';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { layout, space } from '@/theme';

import type { SignupChannel } from '@/api/identity';
import { bareHandle } from '@/features/profile-edit/social';
import { limits } from '@/features/profile-edit/limits';

import type { GeoCountry } from '@/features/geo/geoApi';
import { phoneProblem } from '@/features/geo/phone';
import { usePhoneInput } from '@/features/geo/usePhoneInput';

import { AuthField, scrollToSpot } from './AuthField';
import { AuthFrame } from './AuthFrame';
import { Banner } from '@/components/Banner';
import type { UsernameAnswer } from './identityApi';
import { signupFailure, TEXT_REACH_LINE, type SignupFailure } from './signupFailure';
import { UsernameRefused, usernameProblem, useUsernameCheck } from './username';
import { ConsentBox } from '@/features/open-wallet/ConsentBox';

/** The shortest password WAWU ID takes (`contract/identity/openapi.json`, `SignupDto.password.minLength`); A3's hint "At least 8 characters". */
export const MIN_PASSWORD = 8;
/** design/_gen/auth.js line 54: the heading is `h1` at 24 px, the form `gap: 14`; kit.js line 41, h1 tracking -0.03em, line 1.15. */
export const TITLE = { size: 24, tracking: -0.03, leading: 1.15, apart: 6 } as const;
export const BODY_GAP = 14;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The line under A3's heading, by where the code will go (BRIEF, A3 and A4). */
const CHANNEL_LINE: Record<SignupChannel, string> = {
  // MECHANISM: WAWU ID mails the 6-digit code through Resend (EmailSignupService) when its SIGNUP_VERIFY_CHANNEL is email, R-39.
  email: "We'll email you a code to confirm your address.",
  // MECHANISM: WAWU ID texts the 6-digit code (PhoneSignupService) while its SIGNUP_VERIFY_CHANNEL is phone, the default.
  phone: "We'll text a code to your phone.",
};

/** `phone` is in full international form (`+2348031234412`); `countryCode` is the country of residence (ISO alpha-2), left out when the Hub's list did not load. */
export type SignUpValues = { firstName: string; lastName: string; username: string; email: string; phone: string; countryCode?: string; password: string };

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
  /**
   * Asks whether a username is free (`GET /users/handle-available`). The line under the field follows it while the
   * person types, after a pause; left out, the field checks nothing until Continue.
   */
  checkUsername?: (username: string) => Promise<UsernameAnswer>;
  /** The Legal list behind the consent line's "Read them": the owner's nine documents, each readable before sign-up (LEGAL-DOCS). */
  onOpenLegal?: () => void;
  /** The Hub's countries (`GET /geo/countries`): the phone field's list and the country of residence. Undefined while they load. */
  countries?: readonly GeoCountry[];
  /** The list of countries could not be read. */
  countriesFailed?: boolean;
  onRetryCountries?: () => void;
  /** The country this phone is set to (ISO alpha-2), where the phone field starts. Left out, it is read from the system; a test names it. */
  region?: string | null;
  /** What the fields start with (a preview, never the app). */
  initial?: Partial<Omit<SignUpValues, 'countryCode'>>;
  /** A refusal to show at first (a preview, never the app). */
  initialFailure?: SignupFailure;
};

type Missing = { firstName?: string; lastName?: string; username?: string; email?: string; phone?: string; password?: string; agreed?: string };

/** A3's consent line is required: the sign-up goes ahead only with it ticked (R-67; one box for all of the owner's documents, LEGAL-DOCS). */
const AGREE_NEEDS = 'Tick the box to agree before you continue.';

/**
 * A3: First name, Last name, Username, Email, Phone number, Password, the terms line and Continue. The three name fields
 * are not on the artboard (SIGNUP-NAMES, R-82; BACKEND_GAPS DESIGN-SIGNUP-NAMES-1): they are the same fields in the order Edit
 * profile uses, the name and then the @handle. No BVN and no NIBSS line:
 * identity checks happen when someone opens a wallet (R-6, BRIEF A3). A failed
 * Continue keeps what was typed and says why in a banner.
 */
export function SignUpScreen({ onContinue, onBack, onEnterSentCode, onOpenLegal, checkUsername, channel, countries, countriesFailed, onRetryCountries, region, initial, initialFailure }: SignUpScreenProps) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? '');
  const [lastName, setLastName] = useState(initial?.lastName ?? '');
  const [username, setUsername] = useState(initial?.username ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const phone = usePhoneInput(countries, region, initial?.phone);
  // The country of residence follows the phone's country until the person chooses one of their own.
  const [residence, setResidence] = useState<string | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [password, setPassword] = useState(initial?.password ?? '');
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<SignupFailure | null>(initialFailure ?? null);
  const [missing, setMissing] = useState<Missing>({});
  const inFlight = useRef(false);
  const lastNameInput = useRef<TextInput>(null);
  const usernameInput = useRef<TextInput>(null);
  const emailInput = useRef<TextInput>(null);
  const phoneInput = useRef<TextInput>(null);
  const passwordInput = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const phoneSpot = useRef<View>(null);
  const check = useUsernameCheck(username, checkUsername);

  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setFailure(null);
    setMissing({});
  };

  const residenceCode = residence ?? phone.country;
  const residenceRecord = (countries ?? []).find((c) => c.code === residenceCode) ?? null;
  const countryItems: PickerItem[] | undefined = countries?.map((c) => ({ code: c.code, name: c.name, flag: c.flag }));

  const submit = async () => {
    if (inFlight.current) return;
    const typed = { firstName: firstName.trim(), lastName: lastName.trim(), username: bareHandle(username), email: email.trim(), password };
    const gaps: Missing = {
      firstName: !typed.firstName ? 'Enter your first name.' : typed.firstName.length > limits.namePart ? `Use at most ${limits.namePart} characters.` : undefined,
      lastName: !typed.lastName ? 'Enter your last name.' : typed.lastName.length > limits.namePart ? `Use at most ${limits.namePart} characters.` : undefined,
      username: usernameProblem(typed.username) ?? (check.phase === 'refused' ? check.message : undefined),
      email: !typed.email ? 'Enter your email.' : EMAIL_SHAPE.test(typed.email) ? undefined : 'Enter a valid email.',
      phone: phoneProblem(phone.read, phone.record),
      password: typed.password.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters.` : undefined,
      agreed: agreed ? undefined : AGREE_NEEDS,
    };
    if (gaps.firstName || gaps.lastName || gaps.username || gaps.email || gaps.phone || gaps.password || gaps.agreed) {
      setMissing(gaps);
      return;
    }
    if (!phone.read.ok) return;
    const values: SignUpValues = { ...typed, phone: phone.read.e164, ...(residenceRecord ? { countryCode: residenceRecord.code } : {}) };
    inFlight.current = true;
    setBusy(true);
    setFailure(null);
    try {
      await onContinue(values);
    } catch (error) {
      // A name taken since the line under the field last said "free": the Hub's sentence goes under that field.
      if (error instanceof UsernameRefused) setMissing({ username: error.message });
      else setFailure(signupFailure(error, phone.record));
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
          label="First name"
          testID="sign-up-first-name"
          value={firstName}
          onChangeText={edit(setFirstName)}
          error={missing.firstName}
          autoCapitalize="words"
          autoComplete="given-name"
          textContentType="givenName"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => lastNameInput.current?.focus()}
        />
        <AuthField
          scrollRef={scrollRef}
          label="Last name"
          testID="sign-up-last-name"
          inputRef={lastNameInput}
          value={lastName}
          onChangeText={edit(setLastName)}
          error={missing.lastName}
          autoCapitalize="words"
          autoComplete="family-name"
          textContentType="familyName"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => usernameInput.current?.focus()}
        />
        <AuthField
          scrollRef={scrollRef}
          label="Username"
          testID="sign-up-username"
          inputRef={usernameInput}
          // The "@" is part of what is drawn, not of what is kept (Edit profile's handle field).
          value={`@${bareHandle(username)}`}
          onChangeText={edit((typed) => setUsername(bareHandle(typed)))}
          error={missing.username ?? (check.phase === 'refused' ? check.message : undefined)}
          hint={check.phase === 'free' ? 'That username is free.' : check.phase === 'checking' ? 'Checking the username' : undefined}
          tone={check.phase === 'free' ? 'ok' : undefined}
          announce
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => emailInput.current?.focus()}
        />
        <AuthField
          scrollRef={scrollRef}
          label="Email"
          testID="sign-up-email"
          inputRef={emailInput}
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
        <View ref={phoneSpot}>
          <PhoneField
            testID="sign-up-phone"
            countries={countries}
            failed={countriesFailed}
            onRetry={onRetryCountries}
            country={phone.country}
            onCountry={(code) => {
              phone.pick(code);
              setFailure(null);
              setMissing({});
            }}
            inputRef={phoneInput}
            value={phone.value}
            onChangeText={edit(phone.setText)}
            error={missing.phone}
            hint={channel === 'phone' && phone.country !== 'NG' ? TEXT_REACH_LINE : undefined}
            invalid={failure?.field === 'phone'}
            onFocus={() => scrollToSpot(scrollRef, phoneSpot)}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => passwordInput.current?.focus()}
          />
        </View>
        <TextField
          label="Country"
          testID="sign-up-country"
          value={residenceRecord ? `${residenceRecord.flag}  ${residenceRecord.name}` : ''}
          placeholder={countriesFailed ? 'Could not load the countries' : 'Choose your country'}
          trailingIcon="ChevronDown"
          hint="Where you live. It starts as your phone's country."
          invalid={failure?.field === 'country'}
          disabled={!countries}
          onPress={() => setChoosing(true)}
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
        <CountryPicker
          visible={choosing}
          onClose={() => setChoosing(false)}
          title="Where do you live?"
          searchLabel="Search countries"
          items={countryItems}
          selected={residenceCode}
          failed={countriesFailed}
          onRetry={onRetryCountries}
          testID="sign-up-country-sheet"
          onPick={(code) => {
            setChoosing(false);
            setResidence(code);
            setFailure(null);
          }}
        />
        <ConsentBox
          testID="sign-up-consent"
          agreed={agreed}
          busy={busy}
          problem={missing.agreed}
          onOpenAll={onOpenLegal}
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
