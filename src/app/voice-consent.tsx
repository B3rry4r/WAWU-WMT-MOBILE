import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useCreatorGate } from '@/features/create/CreateEntry';
import { VoiceConsentScreen } from '@/features/verify/VoiceConsentScreen';

/**
 * VF8 · Your voice, your consent (`/voice-consent`), the one route of the recording flow: VF9 (record), VF10 and VF10a (making, failed)
 * and VF11 (hear yourself) are its stages. "Hear it in my voice" opens it for a person with a running tier and VF7's "Record my voice"
 * for one who just got a tier. Back returns to where it was opened from; Edit text on VF11 opens VF4; Use this ends the flow on Me, where
 * the intro is the person's Bio. Creator accounts only, like the Voice Intro it belongs to: anyone else is sent Home. Signed in only.
 */
export default function VoiceConsentRoute() {
  const router = useRouter();
  const { status } = useSession();
  const gate = useCreatorGate(status === 'signedIn');
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (gate !== 'creator') return gate === 'checking' ? null : <Redirect href="/" />;

  return (
    <VoiceConsentScreen
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      onWriteText={() => router.push('/voice-intro')}
      onUse={() => router.dismissTo('/me')}
    />
  );
}
