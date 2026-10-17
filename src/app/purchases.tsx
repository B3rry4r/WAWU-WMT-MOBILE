import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useSystemBack } from '@/features/professionals/parts';
import type { PurchaseTarget } from '@/features/purchases/model';
import { PurchasesScreen } from '@/features/purchases/PurchasesScreen';

/**
 * M29 · My purchases (`/purchases`), opened from the Me menu (M7). Signed in only: anyone else is sent to Welcome. A row opens what it
 * bought: a piece (`/content/<id>`), a ticket (its page, E5), My courses for a school fee, a community's room for a pass; Back returns here.
 */
export default function PurchasesRoute() {
  const router = useRouter();
  const { status } = useSession();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  const open = (target: PurchaseTarget) => {
    switch (target.kind) {
      case 'piece':
        return router.push({ pathname: '/content/[id]', params: { id: target.id } });
      case 'ticket':
        return router.push({ pathname: '/events/orders/[orderId]', params: { orderId: target.orderId } });
      case 'courses':
        return router.push('/schools/mine');
      case 'room':
        return router.push({ pathname: '/community/[id]', params: { id: target.id } });
    }
  };
  return <PurchasesScreen onBack={leave} onOpen={open} />;
}
