import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { ProductScreen } from '@/features/capital/ProductScreen';
import { OPEN_WALLET_PIN_PATH } from '@/features/open-wallet/entry';

/** A Capital product (`/capital/product?id=`), with its terms, documents and the amount to invest. */
export default function CapitalProductRoute() {
  const router = useRouter();
  const { status } = useSession();
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (!id) return <Redirect href="/capital" />;
  return (
    <ProductScreen
      productId={id}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/capital'))}
      onReserved={(orderId) => router.push({ pathname: '/capital/review', params: { id: orderId } })}
      onSetPin={() => router.push(OPEN_WALLET_PIN_PATH)}
    />
  );
}
