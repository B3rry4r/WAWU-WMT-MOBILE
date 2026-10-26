import { useRouter } from 'expo-router';

import { useHasWallet } from '@/features/wallet/accounts/useHasWallet';
import { SettingsScreen } from '@/features/settings/SettingsScreen';

/**
 * Z2 · Settings (`/settings`). The Me menu's Settings row opens it (ME-03). Notifications, Privacy and
 * Password are screens of this task; About, Terms and Privacy policy are SETTINGS-02's (Z9 to Z11); Wallet and PIN opens
 * W35 (WALLET-06); Accounts and currencies (`/accounts`, FX-POLISH M1) is drawn only for a person with a wallet; Delete account opens Z6 (SETTINGS-05). Access code (`/claim-code`) is JOIN-03's: the one row Z2 does not draw, because the plan screen it belongs
 * beside is not built.
 */
export default function SettingsRoute() {
  const router = useRouter();
  const hasWallet = useHasWallet();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <SettingsScreen
      onBack={leave}
      onOpenProfile={() => router.push('/edit-profile')}
      onOpenNotifications={() => router.push('/settings/notifications')}
      onOpenPrivacy={() => router.push('/settings/privacy')}
      onOpenPassword={() => router.push('/settings/password')}
      onOpenTier={() => router.push('/your-tier')}
      onOpenClaimCode={() => router.push('/claim-code')}
      onOpenWallet={() => router.push('/wallet-settings')}
      onOpenAccounts={hasWallet ? () => router.push('/accounts') : undefined}
      onOpenDeleteAccount={() => router.push('/settings/delete-account')}
      onOpenAbout={() => router.push('/about')}
      onOpenTerms={() => router.push('/terms')}
      onOpenPolicy={() => router.push('/privacy-policy')}
      onOpenLegal={() => router.push('/legal-documents')}
      onSignedOut={() => router.replace('/welcome')}
    />
  );
}
