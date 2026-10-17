import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { RulesScreen } from '@/features/referral/RulesScreen';

/** RF4 · How it works (`/invite-rules`). The help button on RF1 opens it. Signed in only, as RF1 is. */
export default function InviteRulesRoute() {
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return <RulesScreen onBack={() => (router.canGoBack() ? router.back() : router.replace('/invite'))} />;
}
