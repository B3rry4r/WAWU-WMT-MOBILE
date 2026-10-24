import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { limits } from '@/features/profile-edit/limits';
import { bareHandle } from '@/features/profile-edit/social';
import { space } from '@/theme';

import { AuthField } from './AuthField';
import { AuthFrame } from './AuthFrame';
import type { UsernameAnswer } from './identityApi';
import type { IdentityNeed, IdentityValues } from './identityStep';
import { BODY_GAP, TITLE } from './SignUpScreen';
import { usernameProblem, useUsernameCheck } from './username';

export type IdentityScreenProps = {
  /** What the account lacks: only these fields are drawn. */
  need: IdentityNeed;
  /** Saves them. Rejects with an ApiError; a 409 is a username someone else has, and its message is the Hub's. */
  onSave: (values: IdentityValues) => Promise<void>;
  checkUsername?: (username: string) => Promise<UsernameAnswer>;
};

type Missing = { firstName?: string; lastName?: string; username?: string };

/** The title by what is asked, so it never names a field that is not on the screen. */
function titleOf(need: IdentityNeed): string {
  const names = need.firstName || need.lastName;
  if (names && need.handle) return 'Your name and username';
  return names ? 'Your name' : 'Choose a username';
}

/**
 * The step an account sees once, on the next open, when it has no first name, last name or username (SIGNUP-NAMES, R-82).
 * Built from the sign-up form's own fields, so it matches A3 and Edit profile; the design draws neither the fields nor this
 * step (BACKEND_GAPS DESIGN-SIGNUP-NAMES-1). It has no Back and no Skip: it ends when the Hub has what it asked for.
 */
export function IdentityScreen({ need, onSave, checkUsername }: IdentityScreenProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [missing, setMissing] = useState<Missing>(need.notice ? { username: need.notice } : {});
  const inFlight = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const lastNameInput = useRef<TextInput>(null);
  const usernameInput = useRef<TextInput>(null);
  const check = useUsernameCheck(need.handle ? username : '', checkUsername);

  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setBanner(null);
    setMissing({});
  };

  const submit = async () => {
    if (inFlight.current) return;
    const typed = { firstName: firstName.trim(), lastName: lastName.trim(), username: bareHandle(username) };
    const gaps: Missing = {
      firstName: need.firstName ? (!typed.firstName ? 'Enter your first name.' : typed.firstName.length > limits.namePart ? `Use at most ${limits.namePart} characters.` : undefined) : undefined,
      lastName: need.lastName ? (!typed.lastName ? 'Enter your last name.' : typed.lastName.length > limits.namePart ? `Use at most ${limits.namePart} characters.` : undefined) : undefined,
      username: need.handle ? (usernameProblem(typed.username) ?? (check.phase === 'refused' ? check.message : undefined)) : undefined,
    };
    if (gaps.firstName || gaps.lastName || gaps.username) {
      setMissing(gaps);
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setBanner(null);
    try {
      await onSave(typed);
    } catch (error) {
      if (isApiError(error) && error.status === 409) setMissing({ username: error.message });
      else setBanner(isApiError(error) ? error.message : 'Something went wrong. Try again.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <AuthFrame
      testID="your-details"
      scrollRef={scrollRef}
      navTitle="Your details"
      footer={<Button label="Continue" full loading={busy} onPress={() => void submit()} testID="your-details-submit" />}
    >
      <View style={styles.body}>
        <View style={styles.titleBlock}>
          <Text variant="h1" style={{ fontSize: TITLE.size, lineHeight: TITLE.size * TITLE.leading, letterSpacing: TITLE.tracking * TITLE.size }}>
            {titleOf(need)}
          </Text>
          {need.handle ? <Text variant="muted">Your username is how people find you.</Text> : null}
        </View>
        {banner ? <Banner tone="danger" title="That did not work" body={banner} testID="your-details-banner" /> : null}
        {need.firstName ? (
          <AuthField
            scrollRef={scrollRef}
            label="First name"
            testID="your-details-first-name"
            value={firstName}
            onChangeText={edit(setFirstName)}
            error={missing.firstName}
            autoCapitalize="words"
            autoComplete="given-name"
            textContentType="givenName"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => (need.lastName ? lastNameInput.current : usernameInput.current)?.focus()}
          />
        ) : null}
        {need.lastName ? (
          <AuthField
            scrollRef={scrollRef}
            label="Last name"
            testID="your-details-last-name"
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
        ) : null}
        {need.handle ? (
          <AuthField
            scrollRef={scrollRef}
            label="Username"
            testID="your-details-username"
            inputRef={usernameInput}
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
            returnKeyType="go"
            onSubmitEditing={() => void submit()}
          />
        ) : null}
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: BODY_GAP, paddingTop: space.sm },
  titleBlock: { gap: TITLE.apart },
});
