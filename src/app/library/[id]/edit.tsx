import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useCreatorGate } from '@/features/create/CreateEntry';
import { EditDetailsScreen } from '@/features/library/EditDetailsScreen';

/** Edit details (`/library/<id>/edit`), opened from M26. Save and Back both return to M26. Creator accounts only. */
export default function EditDetailsRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status } = useSession();
  const gate = useCreatorGate(status === 'signedIn');
  const leave = () => (router.canGoBack() ? router.back() : router.replace({ pathname: '/library/[id]', params: { id: String(id) } }));
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (gate !== 'creator') return gate === 'checking' ? null : <Redirect href="/" />;

  return <EditDetailsScreen id={String(id)} onBack={leave} onSaved={leave} />;
}
