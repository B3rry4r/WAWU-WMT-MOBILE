import { useRouter } from 'expo-router';

import { SuspendedScreen } from '@/features/suspension/SuspendedScreen';

/**
 * `/suspended` (USER-SUSPEND, R-121). Opened by the root layout when the Hub refuses a suspended person's write, and by the banner
 * on Me. Back returns to where they were, else to the home tab.
 */
export default function SuspendedRoute() {
  const router = useRouter();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return <SuspendedScreen onBack={leave} />;
}
