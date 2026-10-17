import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { onSessionEnd, useSession } from '@/api/session';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { KeyValueRow } from '@/components/ListRow';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { fieldMetrics } from '@/components/TextField';
import { Icon } from '@/components/icon';
import { canvasNormalLineHeight, radius, space, type, useWawu } from '@/theme';

import { AuthField } from '@/features/auth/AuthField';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { Banner } from '@/features/auth/Banner';

import { identityQuery, OPEN_WALLET_KEY, ownAccountQuery, walletStateQuery, type OwnAccount } from './api/account';
import { openingProgressQuery } from './api/review';
import { checkBvn } from '@/api/walletIdentity';
import { checkFailure, type CheckFailure } from './checkFailure';
import { forgetKeptCheck, isKeptFor, keepCheck, keepNumbers, ticketFor, ticketIsLive, useCheckNotice, useKeptCheck, type KeptCheck } from './keptCheck';
import { groupIdNumber, idDigits, isWholeIdNumber, maskedIdNumber } from './numbers';
import { OpenWalletEnd } from './OpenWalletEnd';
import { useSessionAccount } from './sessionAccount';

/** design/_gen/auth.js line 54 (A3 and A14): `h1` at 24 (the theme's h1), line 1.15; 6 between title and line; 14 between the parts. */
const TITLE_LEADING = 1.15;
const TITLE_GAP = 6;
const BODY_GAP = 14;
/** The loading view's title and line blocks, the height of the 24 px title and the 13.5 px line they stand in for. */
const SKELETON = { title: 28, line: 19, titleWidth: '70%', lineWidth: '50%', label: 15, labelWidth: '30%' } as const;

/** A30's flag opens this step under the header "Complete your account", the first of four (A31). */
const NAV_TITLE = 'Complete your account';
const NAV_STEP = '1 of 4';
/** auth.js line 84 (A31): the lock row, a Lock 15 at 2 and a 13 px line, 8 apart. */
const LOCK = { icon: 15, stroke: 2, size: 13, between: 8 } as const;
/** auth.js line 84: the BVN and NIN hints, and the lock line. */
const BVN_HINT = 'Dial *565*0# to get it';
const NIN_HINT = 'Dial *346# to get it';
const LOCK_LINE = 'Checked with NIBSS. Never shown on your profile.';

let visits = 0;
const nextVisit = () => {
  visits += 1;
  return visits;
};

export type OpenWalletScreenProps = {
  /** Leaves Open your wallet: the back button, and Done on an end. */
  onClose: () => void;
  /**
   * The next step, A5 (KYC-03): called as soon as a check passes, and by
   * Continue when the person comes back to a check that passed. A5 is pushed
   * on top of A26, so A26 stays mounted and the kept details with it.
   */
  onContinue: () => void;
};

type Ended = { end: 'not_available'; message: string } | { end: 'wallet_open' };

/**
 * A26, the first step of Open your wallet (R-6), with A14 as its state: the
 * account's phone, the BVN and the NIN, then Continue runs the BVN check
 * (KYC-01). A pass keeps the BVN's name, date of birth and gender in memory
 * for A5 (`keepCheck`) and goes on to A5 (`onContinue`). A BVN registered to another phone puts A14's sentence
 * under the phone; an unknown BVN puts the server's under the BVN. An account
 * without a Nigerian BVN ends at "Not available yet", never an error.
 */
export function OpenWalletScreen({ onClose, onContinue }: OpenWalletScreenProps) {
  const queryClient = useQueryClient();
  // One visit of the step: its account read is never answered from a cache
  // another session filled (the app keeps one query cache for every account).
  const [visit, setVisit] = useState(nextVisit);
  // A session can end with A26 still drawn and the status still signed in (a
  // sign-in that replaces it, a refresh answering another account). Then the
  // step starts over as a new visit: new keys, so it reads again as whoever
  // is signed in now, whatever the cache did with the old reads.
  useEffect(
    () =>
      onSessionEnd(() => {
        queryClient.removeQueries({ queryKey: [OPEN_WALLET_KEY] });
        setVisit(nextVisit());
      }),
    [queryClient],
  );
  const { status } = useSession();
  const [me] = useQueries({ queries: [ownAccountQuery(visit, status === 'signedIn')] });
  const owner = me.data?.wawuUserId;
  // The opening's flow decides what Continue does (KYC-07): the review opening has no BVN check to run.
  const [wallet, identity, progress] = useQueries({ queries: [walletStateQuery(owner), identityQuery(owner), openingProgressQuery(owner)] });
  const account = me;
  const [ended, setEnded] = useState<Ended | null>(null);
  const kept = useKeptCheck(owner);
  const signedInAs = useSessionAccount(owner);

  // A26's reads go with it: when it closes and when the session ends.
  useEffect(() => {
    if (status === 'signedOut') queryClient.removeQueries({ queryKey: [OPEN_WALLET_KEY] });
  }, [status, queryClient]);
  useEffect(() => () => queryClient.removeQueries({ queryKey: [OPEN_WALLET_KEY] }), [queryClient]);

  // The BVN's name, date of birth and gender live no longer than this step:
  // gone when the session ends (sign-out, a refused refresh), when another
  // account is signed in, and when Open your wallet is left (KYC-03's A5 is
  // pushed on top of A26, so it reads them while A26 is still mounted).
  useEffect(() => {
    if (status === 'signedOut') forgetKeptCheck();
  }, [status]);
  useEffect(() => {
    // Another account's kept details go; this account's (A5's address waiting for a new check) stay.
    if (owner && !isKeptFor(owner)) forgetKeptCheck();
  }, [owner]);
  useEffect(() => () => forgetKeptCheck(), []);

  if (ended) return <Ending ended={ended} onClose={onClose} />;

  // Only a read that never answered is a failed load. A later refetch that
  // fails keeps the data it had, so a refused check never becomes this view.
  const failed = [account, wallet, identity].find((query) => query.isError && query.data === undefined);
  if (failed) {
    const retry = () => {
      void account.refetch();
      void wallet.refetch();
      void identity.refetch();
    };
    return (
      <AuthFrame testID="open-wallet-error" navTitle={NAV_TITLE} navStep={NAV_STEP} onBack={onClose}>
        <ErrorState
          title="We couldn't open this step"
          message={isApiError(failed.error) ? failed.error.message : 'Something went wrong. Try again.'}
          onRetry={retry}
        />
      </AuthFrame>
    );
  }

  // Nothing is shown until the account read is known to be the signed-in one.
  // A progress read that failed leaves the older opening (the BVN check), which asks the Hub itself.
  const flowKnown = progress.data !== undefined || progress.isError;
  if (!account.data || !wallet.data || !identity.data || !flowKnown || signedInAs !== account.data.wawuUserId) return <Loading onClose={onClose} />;

  if (wallet.data === 'open' || wallet.data === 'frozen') {
    return <Ending ended={{ end: 'wallet_open' }} onClose={onClose} />;
  }
  if (wallet.data === 'opening') {
    return (
      <OpenWalletEnd
        testID="open-wallet-opening"
        tone="warn"
        icon="Clock"
        title="Your account is opening"
        message="Check again in a moment."
        actionLabel="Done"
        onAction={onClose}
      />
    );
  }

  const confirmed = kept && kept.identity.bvn && identity.data.bvn?.last4 === kept.identity.bvn.last4 ? kept : null;
  if (confirmed) return <Confirmed check={confirmed} onClose={onClose} onContinue={onContinue} />;

  return (
    <BvnNinForm
      account={account.data}
      review={progress.data?.flow === 'review'}
      onClose={onClose}
      onEnded={setEnded}
      onPassed={onContinue}
    />
  );
}

function Loading({ onClose }: { onClose: () => void }) {
  return (
    <AuthFrame testID="open-wallet-loading" navTitle={NAV_TITLE} navStep={NAV_STEP} onBack={onClose}>
      <LoadingView label="Loading your details">
        <View style={styles.body}>
          <View style={styles.titleBlock}>
            <Skeleton width={SKELETON.titleWidth} height={SKELETON.title} />
            <Skeleton width={SKELETON.lineWidth} height={SKELETON.line} />
          </View>
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

function Ending({ ended, onClose }: { ended: Ended; onClose: () => void }) {
  if (ended.end === 'wallet_open') {
    return (
      <OpenWalletEnd
        testID="open-wallet-already-open"
        tone="in"
        icon="Wallet"
        title="Your wallet is open"
        message="Go back and pay from it."
        actionLabel="Done"
        onAction={onClose}
      />
    );
  }
  return (
    <OpenWalletEnd
      testID="open-wallet-not-available"
      tone="neutral"
      icon="Globe"
      title="Not available yet"
      message={`${ended.message} Wallets for people without a Nigerian BVN are not available yet.`}
      actionLabel="Done"
      onAction={onClose}
    />
  );
}

/** A check that passed, seen again on coming back from A5: the masked numbers, Continue to A5, or back out. */
function Confirmed({ check, onClose, onContinue }: { check: KeptCheck; onClose: () => void; onContinue: () => void }) {
  const bvnLast4 = check.identity.bvn?.last4;
  const ninLast4 = check.identity.ninLast4;
  return (
    <OpenWalletEnd
      testID="open-wallet-confirmed"
      tone="in"
      icon="Check"
      title="BVN confirmed"
      message="Your name, date of birth and gender come from your BVN."
      actionLabel="Continue"
      onAction={onContinue}
      navTitle={NAV_TITLE}
      onBack={onClose}
    >
      {bvnLast4 || ninLast4 ? (
        <Card>
          {bvnLast4 ? <KeyValueRow label="BVN" value={maskedIdNumber(bvnLast4)} testID="open-wallet-bvn-masked" /> : null}
          {ninLast4 ? <KeyValueRow label="NIN" value={maskedIdNumber(ninLast4)} testID="open-wallet-nin-masked" /> : null}
        </Card>
      ) : null}
    </OpenWalletEnd>
  );
}

type Missing = { bvn?: string; nin?: string };

type FormProps = {
  account: OwnAccount;
  /** The Hub reviews the person itself (Nuvion): no BVN check runs, the numbers are held for the open call (KYC-07). */
  review: boolean;
  onClose: () => void;
  onEnded: (ended: Ended) => void;
  /** A check passed and was kept: on to A5. */
  onPassed: () => void;
};

/** A26's form. The BVN and NIN live only in its two fields, and are cleared as soon as a check passes. */
function BvnNinForm({ account, review, onClose, onEnded, onPassed }: FormProps) {
  const queryClient = useQueryClient();
  const { colors } = useWawu();
  const [bvn, setBvn] = useState('');
  const [nin, setNin] = useState('');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<CheckFailure | null>(null);
  const [missing, setMissing] = useState<Missing>({});
  /** Set before the first await, so a second tap in the same frame sends nothing (each check is charged). */
  const inFlight = useRef(false);
  // A check can answer after this form has gone (header Back mid-check) or
  // after the session that sent it has ended: such an answer is dropped here,
  // and the store refuses it too (its ticket is void once anything forgot).
  const { status } = useSession();
  const session = useRef(status);
  useEffect(() => {
    session.current = status;
  }, [status]);
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  // Back from A6 or A7 because the server refused the check's handle: its sentence, until a new check passes.
  const notice = useCheckNotice(account.wawuUserId);
  const ninInput = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  const edit = (setter: (value: string) => void, field: 'bvn' | 'nin') => (value: string) => {
    setter(groupIdNumber(value));
    setMissing((now) => ({ ...now, [field]: undefined }));
    // A new BVN answers A14 afresh, so the phone's error goes with the BVN's.
    setFailure((now) => (now && (now.kind === 'banner' || field === 'bvn') ? null : now));
  };

  const submit = async () => {
    if (inFlight.current) return;
    const gaps: Missing = {
      bvn: isWholeIdNumber(bvn) ? undefined : 'Enter the 11 digits of your BVN.',
      nin: isWholeIdNumber(nin) ? undefined : 'Enter the 11 digits of your NIN.',
    };
    if (gaps.bvn || gaps.nin) {
      setMissing(gaps);
      return;
    }
    const ticket = ticketFor(account.wawuUserId);
    if (review) {
      // The review opening has no BVN check (the Hub answers `step_not_used`): the numbers stay in memory for the
      // open call and the Hub's review checks them. They stay in these fields too, so back from the next step they are still here.
      if (keepNumbers(ticket, { bvn: idDigits(bvn), nin: idDigits(nin) })) onPassed();
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setFailure(null);
    try {
      const check = await checkBvn({ bvn: idDigits(bvn), nin: idDigits(nin) });
      // An answer whose session has ended (its ticket void) writes nothing at
      // all: not the kept details, not the cache, not the screen.
      if (!live.current || session.current !== 'signedIn' || !keepCheck(ticket, check)) return;
      setBvn('');
      setNin('');
      queryClient.setQueryData(identityQuery(account.wawuUserId).queryKey, check.identity);
      onPassed();
    } catch (error) {
      // A refusal under an ended session is the old account's: it moves no screen state either.
      if (!live.current || !ticketIsLive(ticket)) return;
      const next = checkFailure(error);
      if (next.kind === 'end') {
        setBvn('');
        setNin('');
        onEnded(next.end === 'wallet_open' ? { end: 'wallet_open' } : { end: 'not_available', message: next.message });
      } else {
        setFailure(next);
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const bvnError = failure?.kind === 'field' && failure.field === 'bvn' ? failure.message : undefined;
  // A14: the BVN is registered to another phone. The board draws it as a banner over the form, in its own words.
  const phoneMismatch = failure?.kind === 'field' && failure.field === 'phone';

  return (
    <AuthFrame
      testID="open-wallet"
      scrollRef={scrollRef}
      navTitle={NAV_TITLE}
      navStep={NAV_STEP}
      onBack={onClose}
      footer={<Button label="Continue" full loading={busy} onPress={() => void submit()} testID="open-wallet-continue" />}
    >
      <View style={styles.body}>
        <View style={styles.titleBlock}>
          <Text variant="h1" style={styles.title}>
            Verify your identity
          </Text>
          <Text variant="muted">Needed for your account number. Your phone number must match your BVN record.</Text>
        </View>
        {failure?.kind !== 'banner' && !phoneMismatch && notice ? (
          <Banner
            tone="warning"
            title="We need a new BVN check"
            body={notice.addressKept ? `${notice.notice} Your home address and occupation are kept.` : notice.notice}
            testID="open-wallet-check-again"
          />
        ) : null}
        {failure?.kind === 'banner' ? (
          <Banner tone={failure.tone} title={failure.title} body={failure.body} testID="open-wallet-banner" />
        ) : null}
        {phoneMismatch ? (
          <Banner
            tone="danger"
            title="Your phone doesn't match your BVN record"
            body="Use the number on your BVN, or update it with your bank."
            testID="open-wallet-phone-mismatch"
          />
        ) : null}
        <AuthField
          scrollRef={scrollRef}
          label="BVN"
          testID="open-wallet-bvn"
          value={bvn}
          onChangeText={edit(setBvn, 'bvn')}
          hint={BVN_HINT}
          error={missing.bvn ?? bvnError}
          invalid={phoneMismatch}
          keyboardType="number-pad"
          inputMode="numeric"
          autoComplete="off"
          importantForAutofill="no"
          textContentType="none"
          autoCorrect={false}
          spellCheck={false}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => ninInput.current?.focus()}
        />
        <AuthField
          scrollRef={scrollRef}
          label="NIN"
          testID="open-wallet-nin"
          inputRef={ninInput}
          value={nin}
          onChangeText={edit(setNin, 'nin')}
          hint={NIN_HINT}
          error={missing.nin}
          keyboardType="number-pad"
          inputMode="numeric"
          autoComplete="off"
          importantForAutofill="no"
          textContentType="none"
          autoCorrect={false}
          spellCheck={false}
          returnKeyType="go"
          onSubmitEditing={() => void submit()}
        />
        <View style={styles.lock} testID="open-wallet-lock-line">
          <Icon name="Lock" size={LOCK.icon} color={colors.textMuted} strokeWidth={LOCK.stroke} />
          <Text variant="secondary" style={styles.lockText}>
            {LOCK_LINE}
          </Text>
        </View>
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: BODY_GAP },
  titleBlock: { gap: TITLE_GAP },
  title: { lineHeight: type.size.h1 * TITLE_LEADING },
  skeletonField: { gap: space.sm },
  lock: { flexDirection: 'row', alignItems: 'center', gap: LOCK.between },
  lockText: { flex: 1, fontSize: LOCK.size, lineHeight: canvasNormalLineHeight(LOCK.size) },
});
