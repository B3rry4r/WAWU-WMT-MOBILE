import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { PaidMessagesScreen } from '@/features/paid-messages/PaidMessagesScreen';

/**
 * I21 · Paid message settings (`/paid-message-settings`), and I22 and I23 as its warned and switched-off moments. The
 * Inbox header's settings button (I1), the paid messages row on the Services tab (M2) and the note on Your listings
 * (P8) open it. Signed in only: the route graph does not guard it, so a signed-out visit is sent to the welcome screen here.
 */
export default function PaidMessageSettingsRoute() {
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return <PaidMessagesScreen onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />;
}
