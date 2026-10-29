import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { ReceiptScreen } from '@/features/bills/ReceiptScreen';
import { billDraft } from '@/features/bills/draft';
import { useSystemBack } from '@/features/professionals/parts';

/**
 * S7 · the receipt, and S12 when the bill was not delivered (`/bills/receipt/<id>`). Opened when a payment settles and from S2's Recent.
 * Back and Done go to S2. Try again goes back to the review while the bill is still being put together, else to S2.
 */
export default function BillReceiptRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { id } = useLocalSearchParams<{ id: string }>();
  const toKinds = () => router.dismissTo('/bills');
  useSystemBack(toKinds);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (typeof id !== 'string' || id === '') return <Redirect href="/bills" />;

  return <ReceiptScreen id={id} onDone={toKinds} onTryAgain={() => (billDraft.get() ? router.replace('/bills/review') : toKinds())} />;
}
