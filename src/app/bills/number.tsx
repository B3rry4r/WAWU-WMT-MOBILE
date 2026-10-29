import { Redirect, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useSession } from '@/api/session';
import { NumberScreen } from '@/features/bills/NumberScreen';
import { useBillDraft } from '@/features/bills/draft';
import { kindInfo } from '@/features/bills/kinds';
import { useSystemBack } from '@/features/professionals/parts';

/**
 * S4 · Meter and amount (`/bills/number`), and S10 when the number is not found; the same layout takes a cable smartcard. It reads the
 * bill being put together: with none started it goes back to S2. The X on "Paying for" goes to S2 and the X on "Biller" to the companies.
 */
export default function NumberRoute() {
  const router = useRouter();
  const { status } = useSession();
  const draft = useBillDraft();
  const kindPath = draft ? kindInfo(draft.kind).path : '/bills';
  const leave = useCallback(() => (router.canGoBack() ? router.back() : router.replace(kindPath)), [router, kindPath]);
  useSystemBack(leave);
  const toKinds = useCallback(() => router.dismissTo('/bills'), [router]);
  const toBillers = useCallback(() => router.dismissTo(kindPath), [router, kindPath]);
  const onContinue = useCallback(() => router.push('/bills/review'), [router]);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return <NumberScreen onBack={leave} onChangeCategory={toKinds} onChangeBiller={toBillers} onMissing={toKinds} onContinue={onContinue} />;
}
