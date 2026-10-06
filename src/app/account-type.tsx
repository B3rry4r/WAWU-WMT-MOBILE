import { useRouter } from 'expo-router';

import { AccountTypeScreen } from '@/features/auth/AccountTypeScreen';

/** A2. Only reachable signed out. Continue opens A3, which sends the pick with the sign-up. */
export default function AccountTypeRoute() {
  const router = useRouter();
  return (
    <AccountTypeScreen
      onBack={router.canGoBack() ? () => router.back() : undefined}
      onContinue={() => router.push('/sign-up')}
    />
  );
}
