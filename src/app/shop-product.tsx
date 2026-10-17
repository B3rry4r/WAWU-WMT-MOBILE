import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useCreatorGate } from '@/features/create/CreateEntry';
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
  return <DraftFormScreen draftId={typeof id === 'string' && id.length > 0 ? id : undefined} onBack={toShop} onSaved={toShop} onDeleted={toShop} />;
}
