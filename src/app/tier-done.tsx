import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { OfficialScreen } from '@/features/verify/OfficialScreen';

/**
 * VF7 · You're official, and VF7a for the Founding Maker (`/tier-done?tier=<tier id>`). The checkout opens it in its own place once
 * the Hub has granted the tier. Signed in only. Done goes back to the first screen of the stack (where the person began); "Record my voice" opens VF8 (`/voice-consent`, VERIFY-03).
 */
export default function TierDoneRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { tier } = useLocalSearchParams<{ tier?: string }>();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (!tier) return <Redirect href="/" />;

  return (
    <OfficialScreen
      tierId={tier}
      onDone={() => (router.canDismiss() ? router.dismissAll() : router.replace('/'))}
      onRecordVoice={() => router.push('/voice-consent')}
    />
  );
}
