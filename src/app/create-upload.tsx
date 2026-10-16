import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useDraft } from '@/features/create/draft';
import { UploadScreen } from '@/features/create/UploadScreen';

/** M21 · Upload (`/create-upload`), step 2 of 5. Opened with no format picked it goes back to M20. Continue opens M22. */
export default function CreateUploadRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { format } = useDraft();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (!format) return <Redirect href="/create-format" />;

  return <UploadScreen format={format} onBack={() => (router.canGoBack() ? router.back() : router.replace('/create-format'))} onContinue={() => router.push('/create-preview')} />;
}
