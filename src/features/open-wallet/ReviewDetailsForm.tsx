import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';

import { AuthField } from '@/features/auth/AuthField';
import { AuthFrame } from '@/features/auth/AuthFrame';

import { ChoiceField, ChoiceSheet } from './ChoiceField';
import { ConsentBox } from './ConsentBox';
import { CITY_MAX } from './details';
import { keepPerson, ticketFor, ticketIsLive, type HeldNumbers, type HeldPerson, type HomeAddress } from './keptCheck';
import { GENDERS, groupBirth, isoToBirth, NAME_MAX, personProblems, tidyPerson, type Gender, type PersonProblems } from './reviewDetails';
import { StateField, StateSheet } from './StatePicker';
import { labelOf } from './documentFields';

const NAV_TITLE = 'Confirm your details';
/** design/_gen/auth.js line 57 (A5): 14 between the body's parts; A20's 10 between City and State. */
const BODY_GAP = 14;
const ROW_GAP = 10;

export type ReviewDetailsFormProps = {
  owner: string;
  held: { numbers: HeldNumbers; person: HeldPerson | null; address: HomeAddress | null };
  onBack: () => void;
  /** The details are kept: on to A26. */
  onContinue: () => void;
};

/**
 * A5 under the review opening (KYC-07). The Hub reads no name from the BVN there (`step_not_used`, G-460), so the
 * person types the name, date of birth and gender the open call needs, beside the town and state, and ticks the
 * consent box. Nothing is saved to the Hub here and nothing is sent: Continue keeps them in memory beside the
 * numbers A31 holds (`keepPerson`), and A27's Submit sends them all in the one open call. The street line is A27's.
 */
export function ReviewDetailsForm({ owner, held, onBack, onContinue }: ReviewDetailsFormProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [firstName, setFirstName] = useState(held.person?.firstName ?? '');
  const [lastName, setLastName] = useState(held.person?.lastName ?? '');
  const [birth, setBirth] = useState(held.person ? isoToBirth(held.person.dateOfBirth) : '');
  const [gender, setGender] = useState<Gender | null>(held.person?.gender ?? null);
  const [city, setCity] = useState(held.address?.city ?? '');
  const [state, setState] = useState<string | null>(held.address?.state ?? null);
  const [agreed, setAgreed] = useState(false);
  const [pickingState, setPickingState] = useState(false);
  const [pickingGender, setPickingGender] = useState(false);
  const [problems, setProblems] = useState<PersonProblems & { city?: string; state?: string; agreed?: string }>({});
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  const edit = (field: keyof typeof problems, setter: (value: string) => void, shape: (value: string) => string = (v) => v) => (value: string) => {
    setter(shape(value));
    setProblems((now) => ({ ...now, [field]: undefined }));
  };

  const submit = () => {
    const found: typeof problems = personProblems({ firstName, lastName, birth, gender });
    const town = city.replace(/\s+/g, ' ').trim();
    if (!town) found.city = 'Enter your city or town.';
    else if (!/\p{L}/u.test(town)) found.city = 'Enter the name of your city or town.';
    if (!state) found.state = 'Choose your state.';
    if (!agreed) found.agreed = 'Tick the box to agree before you continue.';
    if (Object.values(found).some(Boolean) || !gender || !state) {
      setProblems(found);
      return;
    }
    const ticket = ticketFor(owner);
    const person = tidyPerson({ firstName, lastName, birth, gender });
    if (!keepPerson(ticket, person, { street: '', city: town, state })) {
      // Something forgot the numbers while the form was open (the session ended): nothing is kept, and the form stays put.
      if (live.current && !ticketIsLive(ticket)) onBack();
      return;
    }
    onContinue();
  };

  return (
    <AuthFrame
      testID="open-wallet-details"
      scrollRef={scrollRef}
      navTitle={NAV_TITLE}
      onBack={onBack}
      footer={<Button label="Continue" full onPress={submit} testID="open-wallet-details-continue" />}
    >
      <View style={styles.body}>
        <AuthField
          scrollRef={scrollRef}
          label="First name"
          testID="open-wallet-first-name"
          value={firstName}
          onChangeText={edit('firstName', setFirstName)}
          error={problems.firstName}
          maxLength={NAME_MAX}
          autoComplete="given-name"
          textContentType="givenName"
          autoCapitalize="words"
          returnKeyType="next"
        />
        <AuthField
          scrollRef={scrollRef}
          label="Last name"
          testID="open-wallet-last-name"
          value={lastName}
          onChangeText={edit('lastName', setLastName)}
          error={problems.lastName}
          maxLength={NAME_MAX}
          autoComplete="family-name"
          textContentType="familyName"
          autoCapitalize="words"
          returnKeyType="next"
        />
        <AuthField
          scrollRef={scrollRef}
          label="Date of birth"
          testID="open-wallet-birth"
          value={birth}
          onChangeText={edit('birth', setBirth, groupBirth)}
          error={problems.birth}
          hint="Day, month and year, as on your BVN"
          keyboardType="number-pad"
          inputMode="numeric"
          autoComplete="off"
          autoCorrect={false}
          spellCheck={false}
          returnKeyType="done"
        />
        <ChoiceField
          label="Gender"
          value={labelOf(GENDERS, gender)}
          onPress={() => setPickingGender(true)}
          error={problems.gender}
          testID="open-wallet-gender"
        />
        <View style={styles.row}>
          <View style={styles.half}>
            <AuthField
              scrollRef={scrollRef}
              label="City or town"
              testID="open-wallet-city"
              value={city}
              onChangeText={edit('city', setCity)}
              error={problems.city}
              maxLength={CITY_MAX}
              autoComplete="postal-address-locality"
              textContentType="addressCity"
              autoCapitalize="words"
            />
          </View>
          <StateField value={state} onPress={() => setPickingState(true)} error={problems.state} testID="open-wallet-state" />
        </View>
        <ConsentBox
          agreed={agreed}
          busy={false}
          problem={problems.agreed}
          onToggle={() => {
            setAgreed((now) => !now);
            setProblems((now) => ({ ...now, agreed: undefined }));
          }}
        />
      </View>
      <ChoiceSheet
        visible={pickingGender}
        onClose={() => setPickingGender(false)}
        title="Gender"
        options={GENDERS}
        selected={gender}
        onPick={(picked) => {
          setGender(picked);
          setPickingGender(false);
          setProblems((now) => ({ ...now, gender: undefined }));
        }}
        testID="open-wallet-gender"
      />
      <StateSheet
        visible={pickingState}
        selected={state}
        onClose={() => setPickingState(false)}
        onPick={(picked) => {
          setState(picked);
          setPickingState(false);
          setProblems((now) => ({ ...now, state: undefined }));
        }}
      />
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: BODY_GAP },
  row: { flexDirection: 'row', gap: ROW_GAP },
  half: { flex: 1 },
});
