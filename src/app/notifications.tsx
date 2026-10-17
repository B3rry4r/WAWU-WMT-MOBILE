import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { NotificationFeedScreen } from '@/features/notifications/NotificationFeedScreen';
import { useSystemBack } from '@/features/professionals/parts';

/**
 * M31 and M32 · Notifications (`/notifications`), opened from the bell on Explore (X1) and from the Me menu (M7). The sliders in the bar
 * open Notifications in Settings (Z3, `/settings/notifications`). Signed in only: anyone else is sent to Welcome.
 */
export default function NotificationsFeedRoute() {
  const router = useRouter();
  const { status } = useSession();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return <NotificationFeedScreen onBack={leave} onOpen={(href) => router.push(href)} onOpenSettings={() => router.push('/settings/notifications')} />;
}
