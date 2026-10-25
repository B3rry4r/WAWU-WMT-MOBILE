import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { FixedPriceScreen } from '@/features/legal/fixed/FixedPriceScreen';

/** S26 · Fixed-price request (`/legal-fixed?id=<conversation id>`). Signed in only. Continue starts the request and opens its matter, where the letter is signed and the fee paid. */
export default function LegalFixedRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (!id) return <Redirect href="/legal" />;

  return (
    <FixedPriceScreen
      threadId={String(id)}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/legal'))}
      onStarted={(id) => router.replace({ pathname: '/legal-matter', params: { id } })}
    />
  );
}
