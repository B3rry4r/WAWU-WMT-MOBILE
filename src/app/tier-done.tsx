import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { OfficialScreen } from '@/features/verify/OfficialScreen';

/**
 * VF7 · You're official, and VF7a for the Founding Maker (`/tier-done?id=<purchase id>`). The checkout opens it in its own place once
 * the Hub has granted the tier. Signed in only. Done goes back to the first screen of the stack (where the person began); "Record my voice" opens VF8 (`/voice-consent`, VERIFY-03).
 */
export default function TierDoneRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { id } = useLocalSearchParams<{ id?: string }>();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (!id) return <Redirect href="/" />;

  return (
    <OfficialScreen
      purchaseId={id}
      onDone={() => (router.canDismiss() ? router.dismissAll() : router.replace('/'))}
      onRecordVoice={() => router.push('/voice-consent')}
    />
  );
}
