import { Redirect, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { queryClient } from '@/api/query';
import { useSession } from '@/api/session';
import { ConfirmEmailScreen } from '@/features/confirm-email/ConfirmEmailScreen';

/**
 * Confirm your email (`/confirm-email`): a mailed code that proves the account's own address. W38 opens it when a statement cannot
 * be sent for want of a confirmed email (G-486). When the address is proven, the person is back where they came from, which reads
 * again where it can send the statement. Signed in only.
 */
export default function ConfirmEmailRoute() {
  const router = useRouter();
  const { status } = useSession();
  const back = useCallback(() => (router.canGoBack() ? router.back() : router.replace('/wallet-statement')), [router]);
  const confirmed = useCallback(() => {
    // W38 asked where a statement can go; the answer changed (its `canEmail` and masked address).
    void queryClient.invalidateQueries({ queryKey: ['money', 'statement-delivery'] });
    back();
  }, [back]);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return <ConfirmEmailScreen onBack={back} onConfirmed={confirmed} />;
}
