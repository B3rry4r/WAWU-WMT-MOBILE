import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { useSession } from '@/api/session';
import { Card } from '@/components/Card';
import { Icon } from '@/components/icon';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, radius, space, useWawu } from '@/theme';

import { AuthFrame } from '@/features/auth/AuthFrame';

import { openingProgressQuery, type OpeningProgress, type ReviewReason } from './api/review';
import { OpenWalletEnd } from './OpenWalletEnd';
import { useSessionAccount } from './sessionAccount';
import { waitPhrase } from './wait';

/** design/_gen/auth.js line 68 (A29): the card's 14 and 16 padding, 8 between "What to do" and each line; each line a Check 15 at 2.6 beside 14 text, 8 apart. */
const CARD = { padV: 14, between: 8, check: 15, checkStroke: 2.6, line: 14 } as const;
/** The result sits 100 down with 20 between its parts (auth.js line 68). */
const TOP = 100;
const BETWEEN = 20;
const SKELETON = { circle: 88, title: 34, card: 96 } as const;

export type RejectedScreenProps = {
  /** Upload again: A27 when only the proof of address was refused, else A26. */
  onUploadAgain: (to: 'id' | 'address') => void;
  /** The review is not open to a new try (stopped, or the day's tries are used): leaves Open your wallet. */
  onLeave: () => void;
  /** The account turned out to be open, or the bank is checking again: where that goes. */
  onOpened: () => void;
  onChecking: () => void;
};

/** Which step "Upload again" returns to: A27 when every reason names the proof of address, A26 otherwise. Pure, for the tests. */
export function uploadAgainTarget(reasons: readonly ReviewReason[]): 'id' | 'address' {
  return reasons.length > 0 && reasons.every((reason) => reason.code === 'proof_of_address_not_verified') ? 'address' : 'id';
}

/** Seconds from now to an ISO time, or null when it is not one or has passed. */
function secondsUntil(iso: string | null, now: number): number | null {
  if (!iso) return null;
  const at = Date.parse(iso);
  return Number.isFinite(at) && at > now ? Math.ceil((at - now) / 1000) : null;
}

/**
 * A29 · Rejected (KYC-06): the Hub's reasons (`review.reasons[].message`) under
 * "We couldn't open your wallet", what to do about each (`.fix`) in the card,
 * and Upload again once `review.canResubmit` is true. While it is not (the
 * day's tries are used up, or the review is stopped for good) there is no
 * Upload again: the screen says when the tries open again, from the Hub's own
 * time, and offers Done.
 */
export function RejectedScreen({ onUploadAgain, onLeave, onOpened, onChecking }: RejectedScreenProps) {
  const { status } = useSession();
  const signedIn = useSessionAccount(undefined);
  const owner = signedIn ?? undefined;
  const progress = useQuery(openingProgressQuery(owner));
  const data = progress.data;
  const stage = data?.review?.stage;
  const opened = data?.state === 'open' || data?.state === 'frozen';
  const checking = stage === 'checking' || stage === 'approved';
  useEffect(() => {
    if (opened) onOpened();
    else if (checking) onChecking();
  }, [opened, checking, onOpened, onChecking]);

  if (progress.isError && data === undefined) {
    return (
      <AuthFrame testID="open-wallet-rejected-error" bare>
        <ErrorState
          title="We couldn't open this step"
          message={isApiError(progress.error) ? progress.error.message : 'Something went wrong. Try again.'}
          onRetry={() => void progress.refetch()}
        />
      </AuthFrame>
    );
  }
  if (!data || opened || checking || (status === 'signedIn' && !owner)) return <Loading />;
  return <Reasons progress={data} onUploadAgain={onUploadAgain} onLeave={onLeave} />;
}

function Reasons({ progress, onUploadAgain, onLeave }: { progress: OpeningProgress; onUploadAgain: RejectedScreenProps['onUploadAgain']; onLeave: () => void }) {
  const { colors } = useWawu();
  const [now] = useState(() => Date.now());
  const review = progress.review;
  const reasons = review?.reasons ?? [];
  const fixes = reasons.filter((reason) => reason.fix !== '');
  const canTry = review?.canResubmit === true;
  const wait = canTry ? null : secondsUntil(review?.canResubmitAt ?? null, now);
  return (
    <OpenWalletEnd
      testID="open-wallet-rejected"
      tone="danger"
      icon="X"
      title="We couldn't open your wallet"
      message={reasons.map((reason) => reason.message).join(' ')}
      actionLabel={canTry ? 'Upload again' : 'Done'}
      onAction={canTry ? () => onUploadAgain(uploadAgainTarget(reasons)) : onLeave}
      top={TOP}
      between={BETWEEN}
    >
      {fixes.length > 0 ? (
        <Card testID="open-wallet-rejected-fixes" style={styles.card}>
          <Text variant="muted">What to do</Text>
          {fixes.map((reason, index) => (
            <View key={`${reason.code}-${index}`} style={styles.fix}>
              <Icon name="Check" size={CARD.check} color={colors.positive} strokeWidth={CARD.checkStroke} />
              <Text variant="body" style={styles.fixText}>
                {reason.fix}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}
      {!canTry && wait !== null ? (
        <Text variant="muted" style={styles.wait} testID="open-wallet-rejected-wait">
          {`You can try again ${waitPhrase(wait)}.`}
        </Text>
      ) : null}
    </OpenWalletEnd>
  );
}

function Loading() {
  return (
    <AuthFrame testID="open-wallet-rejected-loading" bare contentTop={TOP}>
      <LoadingView label="Loading what to fix">
        <View style={styles.loading}>
          <Skeleton width={SKELETON.circle} height={SKELETON.circle} radius={radius.chip} />
          <Skeleton height={SKELETON.title} />
          <Skeleton height={SKELETON.card} radius={radius.card} />
        </View>
      </LoadingView>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: CARD.padV, gap: CARD.between },
  fix: { flexDirection: 'row', alignItems: 'center', gap: CARD.between },
  fixText: { flex: 1, fontSize: CARD.line, lineHeight: canvasNormalLineHeight(CARD.line) },
  wait: { textAlign: 'center' },
  loading: { alignItems: 'center', gap: space.lg },
});
