import { useRouter } from 'expo-router';

import { SettingsScreen } from '@/features/settings/SettingsScreen';

/**
 * Z2 · Settings (`/settings`). The Me menu's Settings row opens it (ME-03). Notifications, Privacy and
 * Password are screens of this task; About, Terms and Privacy policy are SETTINGS-02's (Z9 to Z11).
 */
export default function SettingsRoute() {
  const router = useRouter();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <SettingsScreen
      onBack={leave}
      onOpenProfile={() => router.push('/edit-profile')}
      onOpenNotifications={() => router.push('/settings/notifications')}
      onOpenPrivacy={() => router.push('/settings/privacy')}
      onOpenPassword={() => router.push('/settings/password')}
      onOpenAbout={() => router.push('/about')}
      onOpenTerms={() => router.push('/terms')}
      onOpenPolicy={() => router.push('/privacy-policy')}
      onSignedOut={() => router.replace('/welcome')}
    />
  );
}
