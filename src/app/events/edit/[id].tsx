import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { isEventId } from '@/features/events/door/doorApi';
import { EditEventScreen } from '@/features/events/host/EditEventScreen';

/** E18's Edit event (`/events/edit/<event id>`), the wizard's first two steps in edit mode. Signed in only. The Hub decides whose event it is. */
export default function EditEventRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (!isEventId(String(id))) return <Redirect href="/events/mine" />;

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/events/mine'));
  return <EditEventScreen id={String(id)} onBack={leave} onDone={() => router.replace('/events')} onMine={() => router.replace('/events/mine')} onSeeTiers={() => router.push('/tiers')} />;
}
