import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useCreatorGate } from '@/features/create/CreateEntry';
import { ShopScreen } from '@/features/verify/ShopScreen';

/**
 * VF2, VF2a and VF2b · Your shop (`/shop`): the person's drafts under a "Shop ready" ring. The plus and "Add a product" open the
 * draft form on a new draft, a draft opens it on that draft; Back returns to where the shop was opened (Me, Create or VF1).
 * Creator accounts only: anyone else who opens it is sent Home. Signed in only: a signed-out visit is sent to the welcome screen.
 */
export default function ShopRoute() {
  const router = useRouter();
  const { status } = useSession();
  const gate = useCreatorGate(status === 'signedIn');
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (gate !== 'creator') return gate === 'checking' ? null : <Redirect href="/" />;

  return (
    <ShopScreen
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      onAdd={() => router.push('/shop-product')}
      onOpenDraft={(id) => router.push({ pathname: '/shop-product', params: { id } })}
    />
  );
}
