import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useSystemBack } from '@/features/professionals/parts';
import { PurchasesScreen } from '@/features/purchases/PurchasesScreen';

/** M29 · My purchases (`/purchases`), opened from the Me menu (M7). Signed in only: anyone else is sent to Welcome. */
export default function PurchasesRoute() {
  const router = useRouter();
  const { status } = useSession();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return <PurchasesScreen onBack={leave} />;
}
