import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useCreatorGate } from '@/features/create/CreateEntry';
import { DetailsScreen } from '@/features/create/DetailsScreen';
import { fullFileOf, useDraft, useLessons } from '@/features/create/draft';

/**
 * M23 · Details (`/create-details`), step 4 of 5. Opened without a format and both files it goes back to the step it is missing.
 * Continue opens the price step (M24).
 */
export default function CreateDetailsRoute() {
  const router = useRouter();
  const { status } = useSession();
  const draft = useDraft();
  const { format, preview } = draft;
  const lessons = useLessons();
  const full = fullFileOf(draft, lessons);
  const gate = useCreatorGate(status === 'signedIn');
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (gate !== 'creator') return gate === 'checking' ? null : <Redirect href="/" />;
  if (!format) return <Redirect href="/create-format" />;
  if (!full) return <Redirect href="/create-upload" />;
  if (!preview) return <Redirect href="/create-preview" />;

  return <DetailsScreen format={format} onBack={() => (router.canGoBack() ? router.back() : router.replace('/create-preview'))} onContinue={() => router.push('/create-price')} />;
}
