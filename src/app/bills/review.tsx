import { Redirect, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useSession } from '@/api/session';
import { ReviewScreen } from '@/features/bills/ReviewScreen';
import { useSystemBack } from '@/features/professionals/parts';

/**
 * S5 · Review (`/bills/review`) for every kind of bill. It reads the bill being put together, so a link cannot name an amount: with none
 * started it goes back to S2. Pay opens the payment window; a paid bill goes to its receipt, which replaces this screen.
 */
export default function ReviewRoute() {
  const router = useRouter();
  const { status } = useSession();
  const leave = useCallback(() => (router.canGoBack() ? router.back() : router.replace('/bills')), [router]);
  useSystemBack(leave);
  const toKinds = useCallback(() => router.dismissTo('/bills'), [router]);
  const settled = useCallback((id: string) => router.replace({ pathname: '/bills/receipt/[id]', params: { id } }), [router]);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return <ReviewScreen onBack={leave} onMissing={toKinds} onSettled={settled} />;
}
