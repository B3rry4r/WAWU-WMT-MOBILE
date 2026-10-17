import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { queryClient } from '@/api/query';
import { useSession } from '@/api/session';
import { useCreatorGate } from '@/features/create/CreateEntry';
import { fetchMyTier, tierKey } from '@/features/me/api';
import { DraftFormScreen } from '@/features/verify/DraftFormScreen';

/**
 * The draft form (`/shop-product`): a new draft, or the draft named by `?id=` to edit or delete. Saving or deleting returns to the
 * shop (VF2). Creator accounts only: anyone else who opens it is sent Home. Signed in only: a signed-out visit is sent to the welcome screen.
 */
export default function ShopProductRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { status } = useSession();
  const gate = useCreatorGate(status === 'signedIn');
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (gate !== 'creator') return gate === 'checking' ? null : <Redirect href="/" />;

  const toShop = () => (router.canGoBack() ? router.back() : router.replace('/shop'));
  // Publish (VERIFY-04): a person with no tier is sent to VF5, one whose tier ended to Your tier (VF14b, where it is renewed), and
  // everyone else to the publish step. A read that fails goes to the publish step, which says why.
  const publish = async (draft: string) => {
    const tier = await queryClient.fetchQuery({ queryKey: tierKey, queryFn: fetchMyTier, staleTime: 0 }).catch(() => null);
    if (tier?.state === 'none') router.push('/tiers');
    else if (tier?.state === 'ended') router.push('/your-tier');
    else router.push({ pathname: '/publish', params: { id: draft } });
  };
  return <DraftFormScreen draftId={typeof id === 'string' && id.length > 0 ? id : undefined} onBack={toShop} onSaved={toShop} onDeleted={toShop} onPublish={publish} />;
}
