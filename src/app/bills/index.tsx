import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { BillsScreen } from '@/features/bills/BillsScreen';
import { kindInfo } from '@/features/bills/kinds';
import { useSystemBack } from '@/features/professionals/parts';

/**
 * S2 · Pay a bill (`/bills`). Opened from Home (the balance card's Bills) and from the Wallet tab's Bills action (R-103). Signed in only, like
 * every screen behind the tabs. Back goes to where it was opened from, or to Home when it was opened on its own; Android's back button
 * does the same.
 */
export default function BillsRoute() {
  const router = useRouter();
  const { status } = useSession();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return <BillsScreen onBack={leave} onOpen={(kind) => router.push(kindInfo(kind).path)} onOpenBill={(id) => router.push({ pathname: '/bills/receipt/[id]', params: { id } })} />;
}
