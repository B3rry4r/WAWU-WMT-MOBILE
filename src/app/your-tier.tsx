import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { YourTierScreen } from '@/features/verify/YourTierScreen';

/**
 * VF14 · Your tier (`/your-tier`), with VF14a (ending soon) and VF14b (ended). The tier badge on Me and the Your tier row in Settings
 * open it. Signed in only. Renew opens the checkout for the tier held; Upgrade opens VF5 (the step up, paying the difference).
 */
export default function YourTierRoute() {
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return (
    <YourTierScreen
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      onRenew={(tier) => router.push({ pathname: '/checkout', params: { kind: 'renew', tier } })}
      onUpgrade={() => router.push('/tiers')}
      onSeeTiers={() => router.push('/tiers')}
    />
  );
}
