import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { CapitalScreen } from '@/features/capital/CapitalScreen';

/** Capital (`/capital`, NUV-12): the portfolio, the products and what the person holds. */
export default function CapitalRoute() {
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return (
    <CapitalScreen
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/wallet'))}
      onProduct={(id) => router.push({ pathname: '/capital/product', params: { id } })}
      onOrder={(id) => router.push({ pathname: '/capital/order', params: { id } })}
    />
  );
}
