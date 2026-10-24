import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';

import { useSession } from '@/api/session';
import { useCreatorGate } from '@/features/create/CreateEntry';
import { useDraft } from '@/features/create/draft';
import { LessonsScreen } from '@/features/create/LessonsScreen';
import { UploadScreen } from '@/features/create/UploadScreen';
import { ProductsFullHost } from '@/features/verify/ProductsFullHost';

/** M21 · Upload (`/create-upload`), step 2 of 5; for a course, the lessons (FIX-111). Opened with no format picked it goes back to M20. Continue opens M22. */
export default function CreateUploadRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { format } = useDraft();
  const gate = useCreatorGate(status === 'signedIn');
  const [full, setFull] = useState(false);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (gate !== 'creator') return gate === 'checking' ? null : <Redirect href="/" />;
  if (!format) return <Redirect href="/create-format" />;

  const common = {
    onBack: () => (router.canGoBack() ? router.back() : router.replace('/create-format')),
    onContinue: () => router.push('/create-preview'),
    onOpenLibrary: () => router.push('/library'),
    onGetVerified: () => router.push('/tiers'),
    onNeedTier: () => router.push('/tiers'),
    onProductsFull: () => setFull(true),
  };

  return (
    <>
      {/* A course is lessons added one by one (FIX-111); every other format is one file. */}
      {format === 'course' ? <LessonsScreen {...common} /> : <UploadScreen format={format} {...common} />}
      {full ? <ProductsFullHost onClose={() => setFull(false)} /> : null}
    </>
  );
}
