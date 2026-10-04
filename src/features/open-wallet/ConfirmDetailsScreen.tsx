import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { useSession } from '@/api/session';
import { fetchWalletIdentity, identityProblem, saveOccupation, type BvnPrefill, type WalletIdentity } from '@/api/walletIdentity';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { fieldMetrics } from '@/components/TextField';
import { canvasNormalLineHeight, font, radius, space, useWawu } from '@/theme';

import { AuthField } from '@/features/auth/AuthField';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { Banner } from '@/features/auth/Banner';

import { OPEN_WALLET_KEY } from './api/account';
import { birthDate, CITY_MAX, detailsProblems, fullName, genderWord, OCCUPATION_MAX, openingName, STREET_MAX, tidyDetails, type DetailsProblems } from './details';
import { keepAddress, ticketFor, ticketIsLive, useKeptOpening, type HomeAddress } from './keptCheck';
import { OpenWalletEnd } from './OpenWalletEnd';
import { useSessionAccount } from './sessionAccount';
import { StateField, StateSheet } from './StatePicker';

/** design/_gen/auth.js line 57 (A5): 14 between the body's parts; the A20 row's 10 between City and State (line 49). */
const BODY_GAP = 14;
const ROW_GAP = 10;
/**
 * auth.js line 57, the "From your BVN" card: `card(..., { pad: '12px 16px' })`,
 * 6 between its title and its rows; the title a BadgeCheck 16 at 2.2 beside
 * 12.5 / 700 positive text, 6 apart.
 */
const BVN_CARD = { padV: space.md, stack: 6, badge: 16, badgeStroke: 2.2, titleGap: 6, titleSize: 12.5 } as const;
/** auth.js line 56, `ro`: rows at least 48 high, 12 between key and value, key 13.5 text-secondary, a hairline under each. */
const BVN_ROW = { minHeight: 48, between: space.md, key: 13.5, edge: 1 } as const;
/** auth.js line 57, the consent box: 22 square, 7 radius, a Check 14 at 3; 10 to its line of 13.5 text-secondary. */
const CONSENT = { box: 22, corner: 7, tick: 14, tickStroke: 3, ring: 1.5, between: 10, size: 13.5 } as const;
/** The loading view's blocks: the card, then three field labels and boxes. */
const SKELETON = { card: 176, label: 15, labelWidth: '30%' } as const;

const NAV_TITLE = 'Confirm your details';
/** The server's own sentence for a check it no longer holds (backend CONVENTIONS section 8), for the same case seen here first. */
const CHECK_AGAIN = 'Check your BVN again to continue.';

export type ConfirmDetailsScreenProps = {
  /** Back to A26, which still holds the passed check. */
  onBack: () => void;
  /** On to A6 once the details are saved and kept. */
  onContinue: () => void;
  /** Back to A26 for a new BVN check: nothing kept for this account, or the server holds another check. */
  onRestart: (notice?: string) => void;
  /** Leaves Open your wallet (an end with nowhere further to go). */
  onLeave: () => void;
};

/**
 * A5 · Confirm your details (KYC-03), the step after A26. The "From your BVN"
 * card shows the name, date of birth and gender the BVN check answered (kept
 * in memory by A26, never re-asked, never stored); below it the person types
 * a home address (street, city or town, state: BRIEF A5, in A20's field
 * style) and an occupation, and ticks the consent box. Continue saves the
 * occupation (`PUT /money/identity/occupation`), keeps the address in memory
 * beside the check for A7, and goes on to the selfie (A6).
 */
export function ConfirmDetailsScreen({ onBack, onContinue, onRestart, onLeave }: ConfirmDetailsScreenProps) {
  const { status } = useSession();
  const signedIn = useSessionAccount(undefined);
  const owner = signedIn ?? undefined;
  const kept = useKeptOpening(owner);
  // Its own read of the step, never A26's cached answer: A5 shows nothing until the server confirms the check it holds is the one kept here.
  const identity = useQuery({
    queryKey: [OPEN_WALLET_KEY, 'details', owner ?? ''] as const,
    queryFn: fetchWalletIdentity,
    staleTime: 0,
    gcTime: 0,
    enabled: Boolean(owner) && kept !== null,
  });

  const lost = status === 'signedIn' && owner !== undefined && kept === null;
  // The server holds another check than the one kept here (a newer one, or none): the details are not this check's.
  const stale = Boolean(kept && identity.data && identity.data.bvn?.last4 !== kept.check.identity.bvn?.last4);
  useEffect(() => {
    if (lost) onRestart();
    // A newer check passed elsewhere: this one's details no longer open the account.
    else if (stale) onRestart(CHECK_AGAIN);
  }, [lost, stale, onRestart]);

  if (identity.isError && identity.data === undefined) {
    return (
      <AuthFrame testID="open-wallet-details-error" navTitle={NAV_TITLE} onBack={onBack}>
        <ErrorState
          title="We couldn't open this step"
          message={isApiError(identity.error) ? identity.error.message : 'Something went wrong. Try again.'}
          onRetry={() => void identity.refetch()}
        />
      </AuthFrame>
    );
  }
  if (!owner || !kept || !identity.data || stale) return <Loading onBack={onBack} />;

  const naming = openingName(kept.check.prefill);
  if (!naming) {
    return (
      <OpenWalletEnd
        testID="open-wallet-details-unusable"
        tone="danger"
        icon="CircleAlert"
        title="We can't open an account from this BVN"
        message="Your BVN record didn't give us your name and date of birth in a form we can use, and the bank needs both to open your account."
        actionLabel="Done"
        onAction={onLeave}
      />
    );
  }

  return <DetailsForm owner={owner} prefill={kept.check.prefill} identity={identity.data} address={kept.address} occupation={kept.occupation} onBack={onBack} onContinue={onContinue} onRestart={onRestart} />;
}

function Loading({ onBack }: { onBack: () => void }) {
  return (
    <AuthFrame testID="open-wallet-details-loading" navTitle={NAV_TITLE} onBack={onBack}>
      <LoadingView label="Loading your details">
        <View style={styles.body}>
          <Skeleton height={SKELETON.card} radius={radius.card} />
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.skeletonField}>
              <Skeleton width={SKELETON.labelWidth} height={SKELETON.label} />
              <Skeleton height={fieldMetrics.height} radius={radius.tile} />
            </View>
          ))}
        </View>
      </LoadingView>
    </AuthFrame>
  );
}

/** A5's card, exactly as drawn: what the BVN check answered, read-only. */
function FromYourBvn({ prefill }: { prefill: BvnPrefill }) {
  const { colors } = useWawu();
  const gender = genderWord(prefill.gender);
  return (
    <Card testID="open-wallet-from-bvn" style={styles.card}>
      <View style={styles.cardTitle}>
        <Icon name="BadgeCheck" size={BVN_CARD.badge} color={colors.positive} strokeWidth={BVN_CARD.badgeStroke} />
        <Text variant="body" tone="positive" style={styles.cardTitleText}>
          From your BVN
        </Text>
      </View>
      <View>
        <BvnRow label="Name" value={fullName(prefill)} testID="open-wallet-bvn-name" />
        {prefill.dateOfBirth ? <BvnRow label="Date of birth" value={birthDate(prefill.dateOfBirth)} testID="open-wallet-bvn-dob" /> : null}
        {gender ? <BvnRow label="Gender" value={gender} testID="open-wallet-bvn-gender" /> : null}
      </View>
    </Card>
  );
}

function BvnRow({ label, value, testID }: { label: string; value: string; testID: string }) {
  const { colors } = useWawu();
  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={`${label}, ${value}`}
      style={[styles.bvnRow, { boxShadow: [{ offsetX: 0, offsetY: -BVN_ROW.edge, blurRadius: 0, spreadDistance: 0, color: colors.borderHairline, inset: true }] }]}
    >
      <Text variant="secondary" style={styles.bvnKey}>
        {label}
      </Text>
      <Text variant="kvValue" style={styles.bvnValue}>
        {value}
      </Text>
    </View>
  );
}

type FormProps = {
  owner: string;
  prefill: BvnPrefill;
  identity: WalletIdentity;
  /** The address typed before, when the person comes back from A6 or from a new BVN check. */
  address: HomeAddress | null;
  /** The occupation typed before, kept with the address (the server's, when it has one, wins). */
  occupation: string | null;
  onBack: () => void;
  onContinue: () => void;
  onRestart: (notice?: string) => void;
};

type Failure = { title: string; body: string };

function DetailsForm({ owner, prefill, identity, address, occupation: keptOccupation, onBack, onContinue, onRestart }: FormProps) {
  const { colors } = useWawu();
  const consentRing = useFocusRing();
  const scrollRef = useRef<ScrollView>(null);
  const [street, setStreet] = useState(address?.street ?? '');
  const [city, setCity] = useState(address?.city ?? '');
  const [state, setState] = useState<string | null>(address?.state ?? null);
  const [occupation, setOccupation] = useState(identity.occupation ?? keptOccupation ?? '');
  const [agreed, setAgreed] = useState(false);
  const [picking, setPicking] = useState(false);
  const [problems, setProblems] = useState<DetailsProblems>({});
  const [failure, setFailure] = useState<Failure | null>(null);
  const [busy, setBusy] = useState(false);
  /** Set before the first await, so a second tap in the same frame sends nothing. */
  const inFlight = useRef(false);
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  const edit = (field: keyof DetailsProblems, setter: (value: string) => void) => (value: string) => {
    setter(value);
    setProblems((now) => ({ ...now, [field]: undefined }));
    setFailure(null);
  };

  const submit = async () => {
    if (inFlight.current) return;
    const found = detailsProblems({ street, city, state, occupation, agreed });
    if (Object.values(found).some(Boolean) || !state) {
      setProblems(found);
      return;
    }
    const details = tidyDetails({ street, city, state, occupation, agreed });
    inFlight.current = true;
    setBusy(true);
    setFailure(null);
    // An answer that lands after the session ended, or after anything forgot the check, moves nothing.
    const ticket = ticketFor(owner);
    try {
      await saveOccupation(details.occupation);
      if (!live.current || !keepAddress(ticket, details.address, details.occupation)) return;
      onContinue();
    } catch (error) {
      if (!live.current || !ticketIsLive(ticket)) return;
      const message = isApiError(error) ? error.message : 'Something went wrong. Try again.';
      if (identityProblem(error) === 'not_checked') {
        // What was typed waits for the new check; the server's sentence goes to A26.
        keepAddress(ticket, details.address, details.occupation);
        onRestart(message);
      } else if (isApiError(error) && error.kind === 'validation') setProblems({ occupation: message });
      else if (isApiError(error) && error.kind === 'network') setFailure({ title: 'No connection', body: message });
      else setFailure({ title: "We couldn't save your details", body: message });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <AuthFrame
      testID="open-wallet-details"
      scrollRef={scrollRef}
      navTitle={NAV_TITLE}
      onBack={onBack}
      footer={<Button label="Continue" full loading={busy} onPress={() => void submit()} testID="open-wallet-details-continue" />}
    >
      <View style={styles.body}>
        {failure ? <Banner tone="danger" title={failure.title} body={failure.body} testID="open-wallet-details-banner" /> : null}
        <FromYourBvn prefill={prefill} />
        <AuthField
          scrollRef={scrollRef}
          label="Home address"
          testID="open-wallet-street"
          value={street}
          onChangeText={edit('street', setStreet)}
          error={problems.street}
          maxLength={STREET_MAX}
          autoComplete="street-address"
          textContentType="streetAddressLine1"
          autoCapitalize="words"
          returnKeyType="next"
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
          <StateField value={state} onPress={() => setPicking(true)} error={problems.state} disabled={busy} testID="open-wallet-state" />
        </View>
        <AuthField
          scrollRef={scrollRef}
          label="Occupation"
          testID="open-wallet-occupation"
          value={occupation}
          onChangeText={edit('occupation', setOccupation)}
          error={problems.occupation}
          maxLength={OCCUPATION_MAX}
          autoCapitalize="sentences"
          returnKeyType="done"
        />
        <View style={styles.consentBlock}>
          <Pressable
            testID="open-wallet-consent"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed, disabled: busy }}
            accessibilityLabel="I agree to the terms and privacy policy"
            accessibilityHint={problems.agreed}
            disabled={busy}
            onPress={() => {
              setAgreed((now) => !now);
              setProblems((now) => ({ ...now, agreed: undefined }));
            }}
            {...consentRing.handlers}
            style={[styles.consent, consentRing.style]}
          >
            <View
              style={[
                styles.box,
                agreed
                  ? { backgroundColor: colors.accent }
                  : { borderWidth: CONSENT.ring, borderColor: problems.agreed ? colors.danger : colors.borderStrong },
              ]}
            >
              {agreed ? <Icon name="Check" size={CONSENT.tick} color={colors.textOnAccent} strokeWidth={CONSENT.tickStroke} /> : null}
            </View>
            <Text variant="secondary" style={styles.consentText}>
              {'I agree to the '}
              <Text variant="secondary" tone="accentFg" style={font(700)}>
                terms
              </Text>
              {' and '}
              <Text variant="secondary" tone="accentFg" style={font(700)}>
                privacy policy
              </Text>
            </Text>
          </Pressable>
          {problems.agreed ? (
            <Text variant="caption" tone="danger" accessibilityRole="alert" testID="open-wallet-consent-error">
              {problems.agreed}
            </Text>
          ) : null}
        </View>
      </View>
      <StateSheet
        visible={picking}
        selected={state}
        onClose={() => setPicking(false)}
        onPick={(picked) => {
          setState(picked);
          setPicking(false);
          setProblems((now) => ({ ...now, state: undefined }));
          setFailure(null);
        }}
      />
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: BODY_GAP },
  skeletonField: { gap: space.sm },
  card: { paddingVertical: BVN_CARD.padV, gap: BVN_CARD.stack },
  cardTitle: { flexDirection: 'row', alignItems: 'center', gap: BVN_CARD.titleGap },
  cardTitleText: { ...font(700), fontSize: BVN_CARD.titleSize, lineHeight: canvasNormalLineHeight(BVN_CARD.titleSize) },
  bvnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: BVN_ROW.between, minHeight: BVN_ROW.minHeight },
  bvnKey: { fontSize: BVN_ROW.key, lineHeight: canvasNormalLineHeight(BVN_ROW.key) },
  bvnValue: { flexShrink: 1, textAlign: 'right' },
  row: { flexDirection: 'row', gap: ROW_GAP },
  half: { flex: 1 },
  consentBlock: { gap: space.sm },
  consent: { flexDirection: 'row', alignItems: 'center', gap: CONSENT.between, alignSelf: 'flex-start' },
  box: { width: CONSENT.box, height: CONSENT.box, borderRadius: CONSENT.corner, alignItems: 'center', justifyContent: 'center' },
  consentText: { flexShrink: 1, fontSize: CONSENT.size, lineHeight: canvasNormalLineHeight(CONSENT.size) },
});
