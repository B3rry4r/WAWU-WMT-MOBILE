import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';

import { useSession } from '@/api/session';
import { useCreatorGate } from '@/features/create/CreateEntry';
import { FormatScreen } from '@/features/create/FormatScreen';
import { ProductsFullHost } from '@/features/verify/ProductsFullHost';

/** M20 · What are you making? (`/create-format`), step 1 of 5. Continue opens M21 with the format picked. With every upload used it is M27, whose Open library opens My content (M28); a person who holds a tier is shown VF13 over it. */
export default function CreateFormatRoute() {
  const router = useRouter();
  const { status } = useSession();
  const gate = useCreatorGate(status === 'signedIn');
  const [full, setFull] = useState(false);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (gate !== 'creator') return gate === 'checking' ? null : <Redirect href="/" />;

  return (
    <>
      <FormatScreen
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/create'))}
        onContinue={() => router.push('/create-upload')}
        onOpenLibrary={() => router.push('/library')}
        onProductsFull={() => setFull(true)}
      />
      {full ? <ProductsFullHost onClose={() => setFull(false)} /> : null}
    </>
  );
}
