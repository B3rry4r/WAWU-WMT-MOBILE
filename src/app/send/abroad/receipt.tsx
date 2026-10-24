import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { AbroadReceiptScreen } from '@/features/abroad/screens';
import { useSystemBack } from '@/features/professionals/parts';

/** Send abroad · the receipt (`/send/abroad/receipt?id=`, NUV-11). Done goes to the wallet. */
export default function SendAbroadReceiptRoute() {
  const router = useRouter();
  const { status } = useSession();
  const params = useLocalSearchParams<{ id?: string }>();
  const done = () => router.dismissTo('/wallet');
  useSystemBack(done);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (typeof params.id !== 'string' || params.id === '') return <Redirect href="/send/abroad" />;
  return <AbroadReceiptScreen id={params.id} onDone={done} onAgain={() => router.replace('/send/abroad')} />;
}
