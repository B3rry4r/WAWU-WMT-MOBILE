import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useCreatorGate } from '@/features/create/CreateEntry';
import { ReplaceFileScreen } from '@/features/library/ReplaceFileScreen';

/** Replace the file (`/library/<id>/replace`), opened from M26. Back, and a new file put on the piece, return to M26. Creator accounts only. */
export default function ReplaceFileRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status } = useSession();
  const gate = useCreatorGate(status === 'signedIn');
  const leave = () => (router.canGoBack() ? router.back() : router.replace({ pathname: '/library/[id]', params: { id: String(id) } }));
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (gate !== 'creator') return gate === 'checking' ? null : <Redirect href="/" />;

  return <ReplaceFileScreen id={String(id)} onBack={leave} onReplaced={leave} />;
}
