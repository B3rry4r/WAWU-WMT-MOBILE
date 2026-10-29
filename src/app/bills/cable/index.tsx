import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { BillersScreen } from '@/features/bills/BillersScreen';
import { useSystemBack } from '@/features/professionals/parts';

/** S3 for cable TV (`/bills/cable`): the companies, then S9's packages. Opened from S2; on its own, back goes to S2. */
export default function CableBillersRoute() {
  const router = useRouter();
  const { status } = useSession();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/bills'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return <BillersScreen kind="cable" onBack={leave} onChangeCategory={leave} onPick={() => router.push('/bills/items')} />;
}
