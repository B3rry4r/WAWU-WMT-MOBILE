import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useCreatorGate } from '@/features/create/CreateEntry';
import { HearNameScreen } from '@/features/verify/HearNameScreen';

/**
 * VF3 · Hear your name, with VF3a (the spelling) and VF3b (saved) as its states (`/hear-name`). Your shop's "Hear your name" row opens it;
 * "Sounds right" and "Write my Voice Intro" open VF4 (`/voice-intro`); Back returns to where it was opened from. Creator accounts only, like
 * the shop it belongs to: anyone else who opens it is sent Home. Signed in only: a signed-out visit is sent to the welcome screen.
 */
export default function HearNameRoute() {
  const router = useRouter();
  const { status } = useSession();
  const gate = useCreatorGate(status === 'signedIn');
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (gate !== 'creator') return gate === 'checking' ? null : <Redirect href="/" />;

  return <HearNameScreen onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} onWriteIntro={() => router.push('/voice-intro')} />;
}
