import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useCreatorGate } from '@/features/create/CreateEntry';
import { RejectedScreen } from '@/features/library/RejectedScreen';
import { useSystemBack } from '@/features/professionals/parts';

/**
 * M26 · Rejected (`/library/<id>`), opened by "see why" on My content. Replace the file and Edit details open their own screens and come
 * back here; Delete returns to My content; Send again opens M25 in this screen's place, so Back never returns to a piece that is no
 * longer turned down. Creator accounts only.
 */
export default function RejectedRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status } = useSession();
  const gate = useCreatorGate(status === 'signedIn');
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/library'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (gate !== 'creator') return gate === 'checking' ? null : <Redirect href="/" />;

  return (
    <RejectedScreen
      id={String(id)}
      onBack={leave}
      onReplace={() => router.push({ pathname: '/library/[id]/replace', params: { id: String(id) } })}
      onEdit={() => router.push({ pathname: '/library/[id]/edit', params: { id: String(id) } })}
      onDeleted={() => (router.canGoBack() ? router.back() : router.replace('/library'))}
      onSent={() => router.replace('/create-review')}
    />
  );
}
