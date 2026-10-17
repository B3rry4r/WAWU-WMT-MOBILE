import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';

import { useSession } from '@/api/session';
import { queryClient } from '@/api/query';
import { useCreatorGate } from '@/features/create/CreateEntry';
import { CreateScreen } from '@/features/create/CreateScreen';
import { abandonDraft } from '@/features/create/draft';
import { listServicesTarget } from '@/features/pro-listing/door';
import { ProductsFullHost } from '@/features/verify/ProductsFullHost';

/**
 * M19 · Create (`/create`), opened by the Create button on Home, Explore and Me (creator accounts, R-38). Content opens M20 on a
 * fresh draft, Event opens the host form (E13, or E21 without a tick), Service opens P5 or P8 and the draft row opens Your shop (VF2, `/shop`). Community (I32, INBOX-14) is added by the task that builds where it leads (R-47). "Get verified" opens the tiers (VF5) and, at the limit of a running tier, Content opens VF13. Creator accounts only: anyone else who opens it is sent Home.
 */
export default function CreateRoute() {
  const router = useRouter();
  const { status } = useSession();
  const gate = useCreatorGate(status === 'signedIn');
  const [full, setFull] = useState(false);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (gate !== 'creator') return gate === 'checking' ? null : <Redirect href="/" />;

  return (
    <>
    <CreateScreen
      onClose={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      onContent={() => {
        abandonDraft();
        router.push('/create-format');
      }}
      onEvent={() => router.push('/events/host')}
      onService={() => void listServicesTarget(queryClient).then((href) => router.push(href))}
      onShop={() => router.push('/shop')}
      onGetVerified={() => router.push('/tiers')}
      onProductsFull={() => setFull(true)}
    />
    {full ? <ProductsFullHost onClose={() => setFull(false)} /> : null}
    </>
  );
}
