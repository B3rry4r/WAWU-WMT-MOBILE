import { useRouter } from 'expo-router';

import { AboutScreen } from '@/features/about/AboutScreen';

/**
 * Z9 · About (`/about`). Public on purpose: it shows the app's version and what the owner
 * has filled in, nothing personal. Settings opens it (SETTINGS-01 adds the row).
 */
export default function AboutRoute() {
  const router = useRouter();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return <AboutScreen onBack={leave} onOpenTerms={() => router.push('/terms')} onOpenPrivacy={() => router.push('/privacy-policy')} />;
}
