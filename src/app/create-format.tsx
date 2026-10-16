import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { FormatScreen } from '@/features/create/FormatScreen';

/** M20 · What are you making? (`/create-format`), step 1 of 5. Continue opens M21 with the format picked. */
export default function CreateFormatRoute() {
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return <FormatScreen onBack={() => (router.canGoBack() ? router.back() : router.replace('/create'))} onContinue={() => router.push('/create-upload')} />;
}
