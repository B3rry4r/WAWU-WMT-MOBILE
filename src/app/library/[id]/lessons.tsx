import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useCreatorGate } from '@/features/create/CreateEntry';
import { LessonsEditScreen } from '@/features/library/LessonsEditScreen';

/** Edit lessons (`/library/<id>/lessons`), opened from the creator's own course (H25). Back and Save return to the course. Creator accounts only. */
export default function LessonsEditRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status } = useSession();
  const gate = useCreatorGate(status === 'signedIn');
  const leave = () => (router.canGoBack() ? router.back() : router.replace({ pathname: '/content/[id]', params: { id: String(id) } }));
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (gate !== 'creator') return gate === 'checking' ? null : <Redirect href="/" />;

  return <LessonsEditScreen id={String(id)} onBack={leave} onSaved={leave} />;
}
