import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useCreatorGate } from '@/features/create/CreateEntry';
import { useDraft } from '@/features/create/draft';
import { PreviewScreen } from '@/features/create/PreviewScreen';

/**
 * M22 · Preview (`/create-preview`), step 3 of 5. Opened without a format and a full file it goes back to the step it is missing.
 * Continue opens the details step (M23).
 */
export default function CreatePreviewRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { format, full } = useDraft();
  const gate = useCreatorGate(status === 'signedIn');
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (gate !== 'creator') return gate === 'checking' ? null : <Redirect href="/" />;
  if (!format) return <Redirect href="/create-format" />;
  if (!full) return <Redirect href="/create-upload" />;

  return (
    <PreviewScreen
      format={format}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/create-upload'))}
      onContinue={() => router.push('/create-details')}
    />
  );
}
