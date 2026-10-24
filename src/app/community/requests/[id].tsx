import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { JoinRequestsScreen } from '@/features/community-host/JoinRequestsScreen';

/** I34 · Join requests (`/community/requests/<id>`, INBOX-14): the host's queue of a private room that already holds requests. */
export default function CommunityRequestsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return <JoinRequestsScreen id={String(id)} onBack={() => (router.canGoBack() ? router.back() : router.replace('/inbox'))} />;
}
