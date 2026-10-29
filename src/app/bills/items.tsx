import { Redirect, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useSession } from '@/api/session';
import { ItemsScreen } from '@/features/bills/ItemsScreen';
import { useBillDraft } from '@/features/bills/draft';
import { kindInfo } from '@/features/bills/kinds';
import { useSystemBack } from '@/features/professionals/parts';

/**
 * S9 · Cable package (`/bills/items`): what the chosen company sells (a cable package, or an electricity plan). It reads the bill being
 * put together, so a link cannot open it on a company: with none started it goes back to S2. A company that sells one thing passes it by.
 */
export default function ItemsRoute() {
  const router = useRouter();
  const { status } = useSession();
  const draft = useBillDraft();
  const kindPath = draft ? kindInfo(draft.kind).path : '/bills';
  const leave = useCallback(() => (router.canGoBack() ? router.back() : router.replace(kindPath)), [router, kindPath]);
  useSystemBack(leave);
  const toKinds = useCallback(() => router.dismissTo('/bills'), [router]);
  const toBillers = useCallback(() => router.dismissTo(kindPath), [router, kindPath]);
  const onContinue = useCallback((auto: boolean) => (auto ? router.replace('/bills/number') : router.push('/bills/number')), [router]);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return <ItemsScreen onBack={leave} onChangeCategory={toKinds} onChangeBiller={toBillers} onMissing={toKinds} onContinue={onContinue} />;
}
