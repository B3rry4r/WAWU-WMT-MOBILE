import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { ReceiptScreen } from '@/features/send/ReceiptScreen';
import { useSystemBack } from '@/features/professionals/parts';

/** W12 · Send · success receipt (`/send/receipt?id=`). Done, and Android's back button, return to the Wallet tab with the new row on top. */
export default function SendReceiptRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { id } = useLocalSearchParams<{ id: string }>();
  const done = () => router.dismissTo('/wallet');
  useSystemBack(done);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (typeof id !== 'string' || id === '') return <Redirect href="/wallet" />;
  return <ReceiptScreen id={id} onDone={done} />;
}
