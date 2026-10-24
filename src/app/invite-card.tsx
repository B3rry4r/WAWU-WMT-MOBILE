import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { ShareCardScreen } from '@/features/referral/ShareCardScreen';

/** RF2 · Share card (`/invite-card`). Share on RF1 opens it; the cross returns there. Signed in only, as RF1 is. */
export default function InviteCardRoute() {
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return <ShareCardScreen onClose={() => (router.canGoBack() ? router.back() : router.replace('/invite'))} />;
}
