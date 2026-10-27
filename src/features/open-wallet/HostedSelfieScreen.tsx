import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { AppState, Linking, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { IconTile } from '@/components/IconTile';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { radius } from '@/theme';

import { AuthFrame } from '@/features/auth/AuthFrame';

import { isSecurePage, livenessProblem, LIVENESS_KEY, fetchLiveness, startLiveness, type Liveness } from './api/liveness';
import { OpenWalletEnd } from './OpenWalletEnd';
import { CameraPage, Words } from './CameraPage';
import { forgetSelfieDrop, noteSelfieDropped } from './selfieDrop';
import { useSessionAccount } from './sessionAccount';

/**
 * Board A6 (design/Auth Flow.sections.json, "Selfie hand-off"): the body keeps 8 above and 120 below, the block is
 * centred with 12 between its parts: a 72 circle (accent tint, the ShieldCheck glyph 32 at 2), the title 22 / 700
 * (tracking -0.03em, line 1.15), the line 13.5 secondary (line 1.45). Board A7 is the kit's result layout, which
 * `OpenWalletEnd` draws (120 down, 88 circle, title 30).
 */
/** `clearBelow`: the board keeps 120 below the block and the footer there is about 100 high, so 20 is left clear above the footer. */
const HAND_OFF = { circle: 72, between: 12, bodyGap: 14, clearBelow: 20, title: 22, titleTracking: -0.03, titleLeading: 1.15, line: 13.5, lineLeading: 1.45, lift: 120 } as const;
const NAV_TITLE = 'Selfie';
/** While the secure page is open the screen asks the Hub again at this pace, so a result is seen without leaving the app. */
const WATCH_MS = 5000;

const HAND_OFF_TITLE = "You'll finish this on a secure page";
/**
 * The words claim only what Nuvion's hosted check does (DV2-05 round 2): it takes a selfie and says approved or not
 * approved, with no match against the BVN photo (docs/PAYMENTS-PLAN.md, "No selfie match under Nuvion"; the Hub reads
 * only the two status words, wawu-backend src/nuvion/areas/liveness.ts). The board's "It must match your BVN photo"
 * and "Your face matched your BVN" are left out.
 */
const HAND_OFF_LINE = 'Our banking partner, Nuvion, takes your selfie. You come straight back here.';
const RETRY_TITLE = "Your selfie wasn't approved";
const RETRY_LINE = 'Good light, no glasses or cap. Try again on a new page.';
const DONE_TITLE = 'Selfie done';
const DONE_LINE = 'Back from the secure page. Your selfie is approved.';

type Failure = { title: string; body: string };

/** What a refused start says, in the Hub's own sentence where it sent one. */
function startFailure(error: unknown): Failure {
  const said = isApiError(error) && error.message ? error.message : null;
  switch (livenessProblem(error)) {
    case 'in_progress':
      return { title: 'One moment', body: said ?? 'Your selfie page is being made. Try again in a moment.' };
    case 'rate_limited':
      return { title: 'Too many tries', body: said ?? 'Wait a little, then try again.' };
    case 'unreachable':
      return { title: "We couldn't reach the secure page", body: said ?? 'Check your internet and try again.' };
    default:
      return { title: "We couldn't open the secure page", body: said ?? 'Something went wrong. Try again.' };
  }
}

export type HostedSelfieScreenProps = {
  /** The back button: leaves Open your wallet (the documents are already sent; this step is the last one before the check). */
  onBack: () => void;
  /** A7's Continue: the documents and the selfie are in, the bank's check is next (A28). */
  onContinue: () => void;
  /**
   * The selfie is not part of this opening (the Hub says `enabled: false`, or Nuvion will not start one for this
   * person, R-39), or the opening was sent without it: the step is dropped and the check is next.
   */
  onDropped: () => void;
  /** The Hub has no opening for this person (a reload, a link): the first step collects the details again. */
  onDetails: () => void;
};

/**
 * A6 · Selfie hand-off, A7 · Back from the secure page (DV2-05): Nuvion's own page takes the selfie, so nothing here
 * opens the camera or sees the face. "Continue to secure page" starts the selfie at the Hub
 * (`POST /money/identity/liveness`) and opens the page it returns; coming back to the app (or the page finishing
 * while this screen is open) reads the result (`GET`), and a pass is A7. A refused selfie says so and offers a new
 * page. The step exists only while the Hub says it is part of the opening (`enabled`): otherwise it is dropped.
 */
export function HostedSelfieScreen({ onBack, onContinue, onDropped, onDetails }: HostedSelfieScreenProps) {
  const signedIn = useSessionAccount(undefined);
  const owner = signedIn ?? undefined;
  const queryClient = useQueryClient();
  // A page this screen opened: its result is asked for again by itself while the Hub says the page is pending.
  const [pageOpened, setPageOpened] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const inFlight = useRef(false);
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  const key = [...LIVENESS_KEY, owner ?? ''] as const;
  const liveness = useQuery({
    queryKey: key,
    queryFn: fetchLiveness,
    enabled: Boolean(owner),
    staleTime: 0,
    // Never answered from an earlier visit: a stale "pending" would hide a result.
    gcTime: 0,
    retry: false,
    // Only while the page is pending: a final result (passed, not passed, expired, dropped) ends the asking, and so does
    // the screen going (its query stops with it). A page the Hub already holds as pending is asked about from the first read,
    // not from a tap: after an app restart the person may be finishing it in the browser (SWEEP-APP row DV2-05 L1).
    refetchInterval: (query) => (query.state.data?.state === 'pending' ? WATCH_MS : false),
  });
  const { refetch } = liveness;
  const view: Liveness | undefined = liveness.data;
  const problem = liveness.isError ? livenessProblem(liveness.error) : null;

  // Back from the secure page: the app comes to the front, and the result is read.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && live.current) void refetch();
    });
    return () => subscription.remove();
  }, [refetch]);

  const dropped = view !== undefined && (!view.enabled || view.state === 'not_in_use');
  const noOpening = problem === 'not_open';
  const closed = problem === 'closed';
  useEffect(() => {
    if (dropped || closed) {
      // A28 may hand the person straight back when the documents still say the selfie is left: it is told once, so
      // the two screens never send a person to each other without end (a Hub fault, a deploy half-way through).
      noteSelfieDropped(owner);
      onDropped();
    } else if (noOpening) {
      onDetails();
    }
  }, [dropped, closed, noOpening, owner, onDropped, onDetails]);

  // The Hub and its own switch agree again (the step is part of the opening), so a drop is forgotten.
  const state = view?.state;
  const enabled = view?.enabled;
  useEffect(() => {
    if (enabled && state !== undefined && state !== 'not_in_use') forgetSelfieDrop();
  }, [state, enabled]);

  const start = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    // The page is open already: a tap opens the same page again, and no new one is asked for.
    if (pageOpened && view?.state === 'pending' && isSecurePage(view.url)) {
      try {
        await Linking.openURL(view.url);
        // The page may have run out since: the Hub is asked, so the next tap starts a new one.
        void refetch();
      } catch {
        // A page that will not open again leaves the first one as it was.
      } finally {
        inFlight.current = false;
      }
      return;
    }
    setBusy(true);
    setFailure(null);
    try {
      const started = await startLiveness();
      if (!live.current) return;
      queryClient.setQueryData(key, started);
      if (started.state === 'passed') return;
      if (!isSecurePage(started.url)) {
        setFailure({ title: "We couldn't open the secure page", body: 'Try again in a moment.' });
        return;
      }
      setPageOpened(true);
      await Linking.openURL(started.url);
    } catch (error) {
      if (!live.current) return;
      const why = livenessProblem(error);
      if (why === 'not_available' || why === 'closed') {
        noteSelfieDropped(owner);
        onDropped();
      } else if (why === 'not_open') {
        onDetails();
      } else {
        setFailure(startFailure(error));
      }
    } finally {
      inFlight.current = false;
      if (live.current) setBusy(false);
    }
  };

  if (!owner || liveness.isPending || dropped || closed || noOpening) return <Loading onBack={onBack} />;
  if (liveness.isError && view === undefined) {
    return (
      <AuthFrame testID="open-wallet-selfie-error" navTitle={NAV_TITLE} onBack={onBack}>
        <ErrorState
          title="We couldn't open this step"
          message={isApiError(liveness.error) ? liveness.error.message : 'Something went wrong. Try again.'}
          onRetry={() => void refetch()}
        />
      </AuthFrame>
    );
  }
  if (view?.state === 'passed') {
    return (
      <OpenWalletEnd
        testID="open-wallet-selfie-done"
        tone="in"
        icon="Check"
        title={DONE_TITLE}
        message={DONE_LINE}
        actionLabel="Continue"
        onAction={onContinue}
        onBack={onBack}
        navTitle={NAV_TITLE}
        top={HAND_OFF.lift}
      />
    );
  }
  const refused = view?.state === 'not_passed';
  if (refused) {
    // A16 (RELEASE-02 second pass, M-4): the board's dark page, the red-ringed oval and a Try again button. The words claim only what the
    // Hub's answer says: Nuvion's check says approved or not approved, so there is no "couldn't match your face" and no BVN photo here.
    return (
      <CameraPage
        testID="open-wallet-selfie-not-passed"
        onClose={onBack}
        ring="refused"
        words={<Words title={failure?.title ?? RETRY_TITLE} line={failure?.body ?? RETRY_LINE} live />}
        foot={<Button label="Try again" variant="white" full loading={busy} onPress={() => void start()} testID="open-wallet-selfie-continue" />}
      />
    );
  }
  return (
    <AuthFrame
      testID="open-wallet-selfie-hand-off"
      poweredBy
      navTitle={NAV_TITLE}
      onBack={onBack}
      footer={<Button label="Continue to secure page" full loading={busy} onPress={() => void start()} testID="open-wallet-selfie-continue" />}
    >
      <View style={styles.body}>
        {failure ? <Banner tone="danger" title={failure.title} body={failure.body} testID="open-wallet-selfie-banner" /> : null}
        <View style={styles.centre}>
          <IconTile icon="ShieldCheck" tone="accent" size={HAND_OFF.circle} />
          <Text
            variant="h1"
            style={[styles.title, { fontSize: HAND_OFF.title, lineHeight: HAND_OFF.title * HAND_OFF.titleLeading, letterSpacing: HAND_OFF.titleTracking * HAND_OFF.title }]}
          >
            {HAND_OFF_TITLE}
          </Text>
          <Text variant="secondary" style={styles.line}>
            {HAND_OFF_LINE}
          </Text>
        </View>
      </View>
    </AuthFrame>
  );
}

function Loading({ onBack }: { onBack: () => void }) {
  return (
    <AuthFrame testID="open-wallet-selfie-loading" navTitle={NAV_TITLE} onBack={onBack}>
      <LoadingView label="Loading your selfie step">
        <View style={styles.loading}>
          <Skeleton width={HAND_OFF.circle} height={HAND_OFF.circle} radius={radius.chip} />
          <Skeleton width="70%" height={HAND_OFF.title * HAND_OFF.titleLeading} />
          <Skeleton width="85%" height={HAND_OFF.line * HAND_OFF.lineLeading} />
        </View>
      </LoadingView>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, gap: HAND_OFF.bodyGap, paddingBottom: HAND_OFF.clearBelow },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: HAND_OFF.between },
  title: { textAlign: 'center' },
  line: { textAlign: 'center', fontSize: HAND_OFF.line, lineHeight: HAND_OFF.line * HAND_OFF.lineLeading },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: HAND_OFF.between },
});
