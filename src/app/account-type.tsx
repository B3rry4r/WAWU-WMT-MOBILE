import { useRouter } from 'expo-router';

import { AccountTypeScreen } from '@/features/auth/AccountTypeScreen';

/** A2. Only reachable signed out. Continue (to A3) is added by AUTH-04, which passes `onContinue`. */
export default function AccountTypeRoute() {
  const router = useRouter();
  return <AccountTypeScreen onBack={router.canGoBack() ? () => router.back() : undefined} />;
}
