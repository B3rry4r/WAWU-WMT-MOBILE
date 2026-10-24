import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { FxReceiptScreen } from '@/features/wallet/fx/FxReceiptScreen';

/** W12's receipt for a swap or a crypto send (`/fx-receipt?kind=swap|send&id=`). Done goes to the Wallet tab. Signed in only. */
export default function FxReceiptRoute() {
  const router = useRouter();
  const { status } = useSession();
  const params = useLocalSearchParams<{ kind?: string; id?: string }>();
  const kind = params.kind === 'send' ? 'send' : params.kind === 'swap' ? 'swap' : null;
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (!kind || !id) return <Redirect href="/wallet" />;
  return <FxReceiptScreen kind={kind} id={id} onDone={() => router.dismissTo('/wallet')} />;
}
