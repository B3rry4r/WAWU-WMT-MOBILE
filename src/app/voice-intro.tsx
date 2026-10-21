import { Redirect, useRouter, type Href } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/api/session';
import { useCreatorGate } from '@/features/create/CreateEntry';
import { fetchMyTier, tierKey } from '@/features/me/api';
import { VoiceIntroScreen } from '@/features/verify/VoiceIntroScreen';
import { hearInMyVoiceRoute } from '@/features/verify/voiceModel';

/**
 * VF4 · Write your Voice Intro, with VF4a (empty) and VF4b (too long) as its states (`/voice-intro`). Me's Voice Intro prompt and VF3b's
 * "Write my Voice Intro" open it; Back returns to where it was opened from. "Hear it in my voice" reads the person's tier at that moment
 * (`GET /me/tier`): no tier opens VF5, an ended one Your tier (VF14b, as Publish does), a running one VF8 (`/voice-consent`, VERIFY-03).
 * Creator accounts only, like the shop it belongs to: anyone else who opens it is sent Home. Signed in only.
 */
export default function VoiceIntroRoute() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { status } = useSession();
  const gate = useCreatorGate(status === 'signedIn');
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (gate !== 'creator') return gate === 'checking' ? null : <Redirect href="/" />;

  // A tier that cannot be read is not guessed at: the call throws and the screen says so under the box.
  const hear = async () => {
    const tier = await queryClient.fetchQuery({ queryKey: tierKey, queryFn: fetchMyTier, staleTime: 0 });
    router.push(hearInMyVoiceRoute(tier) as Href);
  };
  return <VoiceIntroScreen onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} onHearInMyVoice={hear} />;
}
