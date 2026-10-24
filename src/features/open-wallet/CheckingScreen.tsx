import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { isApiError } from '@/api/errors';
import { useSession } from '@/api/session';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, space, useWawu } from '@/theme';

import { AuthFrame } from '@/features/auth/AuthFrame';

import { openingProgressQuery, PROGRESS_POLL_MS, type OpeningProgress } from './api/review';
import { forgetSelfieDrop, useSelfieDropped } from './selfieDrop';
import { useSessionAccount } from './sessionAccount';
import { useDocumentsNext } from './useDocumentsNext';
import { FirstAccountProblem, useFirstAccount } from './WorldFirstAccount';

/**
 * design/_gen/auth.js line 67 (A28): an 88 ring, 6 thick, in the sunken
 * surface with the accent along its top right (from 12 o'clock to a little
 * past 3), 14 between it, the title (22 / 700) and the line (13.5 muted),
 * all centred in a body that keeps 120 clear at the bottom.
 */
const RING = { size: 88, stroke: 6, arcDegrees: 101.3, between: 14, title: 22, bottom: 120, turnMs: 1100 } as const;
const RADIUS = (RING.size - RING.stroke) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ARC = (RING.arcDegrees / 360) * CIRCUMFERENCE;

export type CheckingScreenProps = {
  /** The account is open (the number is active): A8 takes this step's place. */
  onOpened: () => void;
  /** The review said no, stopped, or ran out: A29. */
  onRejected: () => void;
  /** The documents are needed again (nothing was sent, or a correction reopened them): A26. */
  onNeedsDocuments: () => void;
  /** Both documents are in and only the hosted selfie is left (DV2-05): A6. Left out, A26 is next. */
  onSelfie?: () => void;
  /** Leaves Open your wallet (the way out beside Try again when the check cannot be read). */
  onLeave: () => void;
};

/** Where A28 goes from what the Hub says, or null while it keeps waiting. Pure, for the tests. */
export function checkingNext(progress: OpeningProgress): 'opened' | 'rejected' | 'documents' | null {
  if (progress.state === 'open' && progress.accountNumberStatus === 'active') return 'opened';
  // WALLET-41: a person outside Nigeria has no account number; their wallet is open once the first account is.
  if (progress.state === 'open' && progress.world?.state === 'open') return 'opened';
  if (progress.state === 'frozen') return 'opened';
  const stage = progress.review?.stage ?? null;
  if (stage === 'rejected' || stage === 'stopped' || stage === 'expired') return 'rejected';
  if (stage === 'needs_documents' || (stage === null && progress.state === 'not_open')) return 'documents';
  return null;
}

/**
 * A28 · Checking your details (KYC-06): the documents are with the bank. It
 * asks `GET /money/wallet` every few seconds and moves on when the Hub says
 * the account number is active (A8, "Approved"), or the review said no (A29).
 */
export function CheckingScreen({ onOpened, onRejected, onNeedsDocuments, onSelfie, onLeave }: CheckingScreenProps) {
  const { status } = useSession();
  const signedIn = useSessionAccount(undefined);
  const owner = signedIn ?? undefined;
  // The Hub's documents say the selfie is left, yet A6 dropped it: the two disagree (DV2-05 round 2). A28 stays,
  // says so, and stops asking; Try again is one more round through A6, started by the person and never by the screen.
  const dropped = useSelfieDropped(owner);
  const progress = useQuery({
    ...openingProgressQuery(owner, true),
    // Not asked again while the screen sits on the clear state: the Hub has nothing new to say until the person tries again.
    refetchInterval: (query) => (dropped && query.state.data && checkingNext(query.state.data) === 'documents' ? false : PROGRESS_POLL_MS),
  });
  const next = progress.data ? checkingNext(progress.data) : null;
  // WALLET-41: a person outside Nigeria, approved: the Hub opens their first account, and is asked to (a notice may never come).
  const first = useFirstAccount(progress.data, () => void progress.refetch());
  const documentsNext = useDocumentsNext(next === 'documents', owner, onSelfie !== undefined);
  const stuck = next === 'documents' && documentsNext === 'selfie' && dropped;
  useEffect(() => {
    if (next === 'opened') onOpened();
    else if (next === 'rejected') onRejected();
    else if (next === 'documents' && documentsNext === 'selfie' && !dropped) onSelfie?.();
    else if (next === 'documents' && documentsNext === 'documents') onNeedsDocuments();
  }, [next, documentsNext, dropped, onOpened, onRejected, onNeedsDocuments, onSelfie]);

  if (progress.data?.world && first.problem !== null) {
    return <FirstAccountProblem country={progress.data.world.country} problem={first.problem} busy={first.busy} onPick={first.pick} onLeave={onLeave} />;
  }

  if (stuck) {
    return (
      <AuthFrame testID="open-wallet-checking-stuck" bare footer={<Button label="Close" variant="secondary" full onPress={onLeave} testID="open-wallet-checking-leave" />}>
        <ErrorState
          title="We could not finish this step"
          message="Try again later."
          // Forgetting the note is the whole of it: the effect above then hands the person to A6, once.
          onRetry={() => forgetSelfieDrop()}
        />
      </AuthFrame>
    );
  }

  if (progress.isError && progress.data === undefined) {
    return (
      <AuthFrame testID="open-wallet-checking-error" bare footer={<Button label="Close" variant="secondary" full onPress={onLeave} testID="open-wallet-checking-leave" />}>
        <ErrorState
          title="We couldn't check just now"
          message={isApiError(progress.error) ? progress.error.message : 'Something went wrong. Try again.'}
          onRetry={() => void progress.refetch()}
        />
      </AuthFrame>
    );
  }
  void status;
  return (
    <AuthFrame testID="open-wallet-checking" bare>
      <View style={styles.centre} accessibilityLiveRegion="polite">
        <Ring />
        <Text variant="h1" style={styles.title}>
          Checking your details
        </Text>
        <Text variant="muted" style={styles.line}>
          This usually takes a few minutes.
        </Text>
      </View>
    </AuthFrame>
  );
}

/** The ring, turning once in 1.1 seconds, held still when the phone asks for less motion. */
function Ring() {
  const { colors } = useWawu();
  const [turn] = useState(() => new Animated.Value(0));
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    let live = true;
    void Promise.resolve(AccessibilityInfo.isReduceMotionEnabled?.())
      .catch(() => false)
      .then((reduced) => {
        if (!live || reduced) return;
        loop = Animated.loop(Animated.timing(turn, { toValue: 1, duration: RING.turnMs, easing: Easing.linear, useNativeDriver: true }));
        loop.start();
      });
    return () => {
      live = false;
      loop?.stop();
    };
  }, [turn]);
  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const middle = RING.size / 2;
  return (
    <Animated.View testID="open-wallet-checking-ring" accessibilityRole="progressbar" accessibilityLabel="Checking your details" style={{ transform: [{ rotate }] }}>
      <Svg width={RING.size} height={RING.size} viewBox={`0 0 ${RING.size} ${RING.size}`}>
        <Circle cx={middle} cy={middle} r={RADIUS} stroke={colors.surfaceSunken} strokeWidth={RING.stroke} fill="none" />
        <Circle
          cx={middle}
          cy={middle}
          r={RADIUS}
          stroke={colors.accent}
          strokeWidth={RING.stroke}
          fill="none"
          strokeDasharray={`${ARC} ${CIRCUMFERENCE - ARC}`}
          rotation={-90}
          origin={`${middle}, ${middle}`}
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: RING.between, paddingBottom: RING.bottom - space.xl },
  title: { ...font(700), fontSize: RING.title, lineHeight: canvasNormalLineHeight(RING.title), textAlign: 'center' },
  line: { textAlign: 'center' },
});
