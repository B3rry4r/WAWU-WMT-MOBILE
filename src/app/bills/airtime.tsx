import { Redirect, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useSession } from '@/api/session';
import { PhoneBillScreen } from '@/features/bills/PhoneBillScreen';
import { useSystemBack } from '@/features/professionals/parts';

/** S8 · Airtime (`/bills/airtime`): the network, the phone number and what to buy; Buy goes to the review (S5). Opened from S2; on its own, back goes to S2. */
export default function AirtimeRoute() {
  const router = useRouter();
  const { status } = useSession();
  const leave = useCallback(() => (router.canGoBack() ? router.back() : router.replace('/bills')), [router]);
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return <PhoneBillScreen kind="airtime" onBack={leave} onChangeCategory={leave} onContinue={() => router.push('/bills/review')} />;
}
