import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { InviteScreen } from '@/features/referral/InviteScreen';

/**
 * RF1 · Invite and earn (`/invite`), and RF3 and RF3a when the Hub says points became available. The gift button on
 * Me (M1) opens it; Back returns there, the help button opens RF4 and Share opens RF2. Signed in only: the route
 * graph does not guard it, so a signed-out visit is sent to the welcome screen here.
 */
export default function InviteRoute() {
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return (
    <InviteScreen
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      onOpenRules={() => router.push('/invite-rules')}
      onOpenCard={() => router.push('/invite-card')}
    />
  );
}
