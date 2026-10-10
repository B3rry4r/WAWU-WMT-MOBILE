import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { SentBackScreen } from '@/features/events/host/SentBackScreen';

/** E22 · Sent back (`/events/sent-back/<id>`): My events (EVENTS-08) opens it for a rejected event. Signed in only. */
export default function SentBackRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/events'));
  return <SentBackScreen id={String(id)} onBack={leave} onDone={() => router.replace('/events')} />;
}
