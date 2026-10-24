import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useCreatorGate } from '@/features/create/CreateEntry';
import { FormatScreen } from '@/features/create/FormatScreen';

/** M20 · What are you making? (`/create-format`), step 1 of 5. Continue opens M21 with the format picked. With every upload used it is M27, whose Open library opens My content (M28). */
export default function CreateFormatRoute() {
  const router = useRouter();
  const { status } = useSession();
  const gate = useCreatorGate(status === 'signedIn');
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (gate !== 'creator') return gate === 'checking' ? null : <Redirect href="/" />;

  return <FormatScreen onBack={() => (router.canGoBack() ? router.back() : router.replace('/create'))} onContinue={() => router.push('/create-upload')} onOpenLibrary={() => router.push('/library')} />;
}
