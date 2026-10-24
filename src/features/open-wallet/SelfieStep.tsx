import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { isApiError } from '@/api/errors';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { radius } from '@/theme';

import { AuthFrame } from '@/features/auth/AuthFrame';

import { openingProgressQuery } from './api/review';
import { HostedSelfieScreen } from './HostedSelfieScreen';
import { useOpenWalletWay } from './leave';
import { SelfieScreen } from './SelfieScreen';
import { useSessionAccount } from './sessionAccount';

/**
 * A6 · Selfie, whichever way the Hub opens wallets (DV2-05). Under the review opening (Nuvion) the selfie is Nuvion's
 * hosted page (`HostedSelfieScreen`), reached after A27's Submit. Under the older opening (the BVN check, kept for
 * the rollback to the older provider, R-39) it is the camera step (`SelfieScreen`), reached from A5. The Hub says
 * which with `GET /money/wallet` (`openingFlow`).
 */
export function SelfieStep() {
  const router = useRouter();
  const way = useOpenWalletWay();
  const signedIn = useSessionAccount(undefined);
  const owner = signedIn ?? undefined;
  const progress = useQuery(openingProgressQuery(owner));
  if (!owner || progress.isPending) {
    return (
      <AuthFrame testID="open-wallet-selfie-step-loading" navTitle="Selfie" onBack={way.leave}>
        <LoadingView label="Loading your selfie step">
          <View>
            <Skeleton height={72} radius={radius.tile} />
          </View>
        </LoadingView>
      </AuthFrame>
    );
  }
  if (progress.isError && progress.data === undefined) {
    return (
      <AuthFrame testID="open-wallet-selfie-step-error" navTitle="Selfie" onBack={way.leave}>
        <ErrorState
          title="We couldn't open this step"
          message={isApiError(progress.error) ? progress.error.message : 'Something went wrong. Try again.'}
          onRetry={() => void progress.refetch()}
        />
      </AuthFrame>
    );
  }
  if (progress.data?.flow === 'review') {
    return <HostedSelfieScreen onBack={way.leave} onContinue={way.checking} onDropped={way.checking} onDetails={way.details} />;
  }
  return <SelfieScreen onBack={() => (router.canGoBack() ? router.back() : way.restart())} onLeave={way.leave} onRestart={way.restart} onOpened={way.opened} />;
}
