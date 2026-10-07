import { useRouter } from 'expo-router';

import { PrivacyScreen } from '@/features/settings/PrivacyScreen';

/** Z4 · Privacy (`/settings/privacy`). */
export default function PrivacyRoute() {
  const router = useRouter();
  return (
    <PrivacyScreen
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/settings'))}
      onOpenBlocked={() => router.push('/settings/blocked')}
      onOpenPolicy={() => router.push('/privacy-policy')}
    />
  );
}
