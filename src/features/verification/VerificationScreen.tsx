import { useQuery } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Banner } from '@/components/Banner';
import { GroupedList } from '@/components/Card';
import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { ListRow, ListSection } from '@/components/ListRow';
import { ScreenFrame } from '@/components/ScreenFrame';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { StatusPill } from '@/components/StatusPill';
import { openingProgressQuery } from '@/features/open-wallet/api/review';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { ROW_TILE } from '@/features/settings/metrics';
import { useWawu } from '@/theme';

import { heldTierQuery, pendingPurchaseQuery, selfieStoppedQuery } from './api';
import { asksSelfie, identityRow, STILL_CONFIRMING_BODY, STILL_CONFIRMING_TITLE, tierRow } from './model';

/** design/_gen/me.js line 55 (`verifBody`): the parts of the page stand 20 apart; the rows of a part, 10. */
const BODY_GAP = 20;
const SKELETON = { rowHeight: 76, labelHeight: 14 } as const;

export type VerificationScreenProps = {
  onBack: () => void;
  /** The identity row leads into Open your wallet (A31), which resumes where the Hub says the opening stands. */
  onOpenWallet: () => void;
};

/**
 * Verification (M15, M16, M17). Two parts, each read from the Hub and each drawn only when it has something true to say
 * (R-47):
 *
 * - **Getting paid**: the identity check as the wallet's state (R-6), never a flag kept here. No wallet yet is M16
 *   ("Needed to get paid", Not started); an opening the Hub's review turned down, or one whose selfie step used every
 *   try, is M17 ("Send your ID again", Not approved). The row opens Open your wallet, which the Hub resumes.
 * - **Your tier**: M15's "Paid, still confirming" while a tier payment is still going through (read from the Hub, so
 *   it is there after a restart), and the tier the person holds. M11 to M14 are replaced by the tier checkout (R-43,
 *   ME-12), so there is no "Get it" here: that screen adds its own way in.
 */
export function VerificationScreen({ onBack, onOpenWallet }: VerificationScreenProps) {
  const owner = useSessionAccount(undefined);
  const progress = useQuery(openingProgressQuery(owner ?? undefined), queryClient);
  const tier = useQuery(heldTierQuery(owner), queryClient);
  const pending = useQuery(pendingPurchaseQuery(owner), queryClient);
  const wantsSelfie = progress.data ? asksSelfie(progress.data.state, progress.data.review?.stage ?? null) : false;
  const selfie = useQuery(selfieStoppedQuery(owner, wantsSelfie), queryClient);

  const failed = [progress, tier, pending].find((q) => q.data === undefined && q.isError);
  const waiting = [progress, tier, pending].some((q) => q.data === undefined && !q.isError) || (wantsSelfie && selfie.isPending);
  const retryAll = () => {
    void progress.refetch();
    void tier.refetch();
    void pending.refetch();
    if (wantsSelfie) void selfie.refetch();
  };

  // Open your wallet is pushed on top of this page: when the person comes back, the rows are asked about again.
  const focused = useIsFocused();
  const wasFocused = useRef(focused);
  const { refetch: askProgress } = progress;
  const { refetch: askTier } = tier;
  const { refetch: askPending } = pending;
  const { refetch: askSelfie } = selfie;
  useEffect(() => {
    if (focused && !wasFocused.current) {
      void askProgress();
      void askTier();
      void askPending();
      if (wantsSelfie) void askSelfie();
    }
    wasFocused.current = focused;
  }, [focused, wantsSelfie, askProgress, askTier, askPending, askSelfie]);

  let body: React.ReactNode;
  if (failed) {
    body = (
      <ErrorState
        testID="verification-error"
        icon={isApiError(failed.error) && failed.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
        title="We couldn't load this page"
        message={isApiError(failed.error) ? failed.error.message : 'Something went wrong. Try again.'}
        onRetry={retryAll}
      />
    );
  } else if (waiting || !progress.data) {
    body = <Loading />;
  } else {
    const row = identityRow({ wallet: progress.data.state, review: progress.data.review?.stage ?? null, selfieStopped: selfie.data?.stopped ?? null });
    const held = tier.data ? tierRow(tier.data) : null;
    const confirming = Boolean(pending.data);
    body = (
      <>
        <ListSection title="Getting paid" testID="verification-paying">
          <GroupedList>
            <ListRow
              testID="verification-identity"
              lead={<IconTile icon="Landmark" tone={row.tile} size={ROW_TILE} />}
              title="Identity check"
              subtitle={row.line}
              accessibilityLabel={`Identity check, ${row.line}, ${row.pill}`}
              trailing={<Trailing label={row.pill} tone={row.pillTone} chevron={row.opensWallet} />}
              onPress={row.opensWallet ? onOpenWallet : undefined}
            />
          </GroupedList>
        </ListSection>
        {confirming || held ? (
          <ListSection title="Your tier" testID="verification-tier">
            {confirming ? <Banner testID="verification-confirming" tone="warning" icon="Clock" title={STILL_CONFIRMING_TITLE} body={STILL_CONFIRMING_BODY} /> : null}
            {held ? (
              <GroupedList>
                <ListRow
                  testID="verification-held"
                  lead={<IconTile icon="BadgeCheck" tone="accent" size={ROW_TILE} />}
                  title={held.title}
                  subtitle={held.line ?? undefined}
                  trailing={<Trailing label={held.pill} tone={held.pillTone} icon={held.pillTone === 'positive' ? 'Check' : undefined} />}
                />
              </GroupedList>
            ) : null}
          </ListSection>
        ) : null}
      </>
    );
  }

  return (
    <ScreenFrame idPrefix="verification" title="Verification" onBack={onBack} gap={BODY_GAP} testID="verification-screen">
      {body}
    </ScreenFrame>
  );
}

function Trailing({ label, tone, icon, chevron }: { label: string; tone: React.ComponentProps<typeof StatusPill>['tone']; icon?: React.ComponentProps<typeof StatusPill>['icon']; chevron?: boolean }) {
  const { colors } = useWawu();
  return (
    <View style={styles.trailing}>
      <StatusPill label={label} tone={tone} icon={icon} />
      {chevron ? <Icon name="ChevronRight" size={16} color={colors.textMuted} /> : null}
    </View>
  );
}

function Loading() {
  return (
    <LoadingView label="Loading verification" testID="verification-loading">
      <Skeleton width={96} height={SKELETON.labelHeight} />
      <Skeleton height={SKELETON.rowHeight} />
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  trailing: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
