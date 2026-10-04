import { useRouter } from 'expo-router';

import { PolicyScreen } from '@/features/about/PolicyScreen';

/** Z10 · Terms (`/terms`). Public: the Terms must be readable before anyone has an account. */
export default function TermsRoute() {
  const router = useRouter();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return <PolicyScreen slug="terms" onBack={leave} onOpenOther={() => router.push('/privacy-policy')} />;
}
