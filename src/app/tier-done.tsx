import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useCreatorGate } from '@/features/create/CreateEntry';
import { OfficialScreen } from '@/features/verify/OfficialScreen';

/**
 * VF7 · You're official, and VF7a for the Founding Maker (`/tier-done?tier=<tier id>`). The checkout opens it in its own place once
 * the Hub has granted the tier. Signed in only. Done goes back to the first screen of the stack (where the person began); "Record my voice" opens VF8 (`/voice-consent`, VERIFY-03).
 * A tier is sold to any account (it opens hosting events and points as well as publishing), but the Voice Intro is a creator account's bio
 * and its screens send anyone else Home. So "Record my voice" is drawn for a creator account only; every other account ends on Done, and
 * money is never taken and then led to a screen that bounces (RELEASE-02, CHECK-3 D-2).
 */
export default function TierDoneRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { tier } = useLocalSearchParams<{ tier?: string }>();
  const gate = useCreatorGate(status === 'signedIn');
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (!tier) return <Redirect href="/" />;
  // The profile says whether this is a creator account; the button is not drawn first and taken away after.
  if (gate === 'checking') return null;

  return (
    <OfficialScreen
      tierId={tier}
      onDone={() => (router.canDismiss() ? router.dismissAll() : router.replace('/'))}
      onRecordVoice={gate === 'creator' ? () => router.push('/voice-consent') : undefined}
    />
  );
}
