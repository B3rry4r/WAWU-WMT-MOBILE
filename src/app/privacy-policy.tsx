import { useRouter } from 'expo-router';

import { PolicyScreen } from '@/features/about/PolicyScreen';

/** Z11 · Privacy policy (`/privacy-policy`). Public, like the Terms. */
export default function PrivacyPolicyRoute() {
  const router = useRouter();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return <PolicyScreen slug="privacy" onBack={leave} />;
}
