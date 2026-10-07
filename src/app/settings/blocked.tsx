import { useRouter } from 'expo-router';

import { BlockedScreen } from '@/features/settings/BlockedScreen';

/** Z5 · Blocked accounts, and Z12 when nobody is (`/settings/blocked`). */
export default function BlockedRoute() {
  const router = useRouter();
  return <BlockedScreen onBack={() => (router.canGoBack() ? router.back() : router.replace('/settings/privacy'))} />;
}
