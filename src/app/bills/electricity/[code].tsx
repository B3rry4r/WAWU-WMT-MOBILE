import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useSession } from '@/api/session';
import { MeterAmountScreen } from '@/features/bills/MeterAmountScreen';
import { useSystemBack } from '@/features/professionals/parts';

/**
 * S4 · Meter and amount (`/bills/electricity/<code>`), and S10 when the meter is not found. Opened from S3 with the company's
 * code. Back goes to S3. The X on "Paying for" goes to S2 and the X on "Biller" to S3, wherever this was opened from.
 */
export default function MeterAmountRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { code } = useLocalSearchParams<{ code: string }>();
  const toBillers = useCallback(() => router.dismissTo('/bills/electricity'), [router]);
  const toKinds = useCallback(() => router.dismissTo('/bills'), [router]);
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/bills/electricity'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (typeof code !== 'string' || code === '') return <Redirect href="/bills/electricity" />;

  return (
    <MeterAmountScreen
      code={code}
      onBack={leave}
      onChangeCategory={toKinds}
      onChangeBiller={toBillers}
      onMissing={toBillers}
      onUnavailable={toKinds}
    />
  );
}
