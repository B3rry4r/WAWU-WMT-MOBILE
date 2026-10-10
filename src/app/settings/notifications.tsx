import { useRouter } from 'expo-router';

import { NotificationsScreen } from '@/features/settings/NotificationsScreen';

/** Z3 · Notifications (`/settings/notifications`). */
export default function NotificationsRoute() {
  const router = useRouter();
  return <NotificationsScreen onBack={() => (router.canGoBack() ? router.back() : router.replace('/settings'))} />;
}
