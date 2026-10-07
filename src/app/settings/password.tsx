import { useRouter } from 'expo-router';

import { ChangePasswordScreen } from '@/features/settings/ChangePasswordScreen';

/** Change password (`/settings/password`), the screen Z2's Password row opens. */
export default function PasswordRoute() {
  const router = useRouter();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/settings'));
  return <ChangePasswordScreen onBack={leave} onDone={leave} />;
}
