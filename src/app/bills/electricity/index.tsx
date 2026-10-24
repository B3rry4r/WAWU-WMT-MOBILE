import { Redirect, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useSession } from '@/api/session';
import { ElectricityBillersScreen } from '@/features/bills/ElectricityBillersScreen';
import { useSystemBack } from '@/features/professionals/parts';

/** S3 · Biller (`/bills/electricity`). Opened from S2; on its own, back goes to S2 (the on-screen back and Android's). */
export default function ElectricityBillersRoute() {
  const router = useRouter();
  const { status } = useSession();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/bills'));
  useSystemBack(leave);
  // The list says bills are not on: S2 draws S13 (the list is already in the cache, so it draws at once).
  const notOn = useCallback(() => router.replace('/bills'), [router]);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return (
    <ElectricityBillersScreen
      onBack={leave}
      onChangeCategory={leave}
      onPick={(code) => router.push({ pathname: '/bills/electricity/[code]', params: { code } })}
      onUnavailable={notOn}
    />
  );
}
