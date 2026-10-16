import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { DirectoryScreen } from '@/features/professionals/DirectoryScreen';
import { useSystemBack } from '@/features/professionals/parts';

/**
 * P1 · Professionals (`/professionals`), and P4 when a field has nobody listed. `?field=` opens on one field and follows
 * the chips, so a back step lands on the same field. Signed in only: the Hub leaves out people the viewer blocked, which
 * it can only do for a signed-in viewer.
 */
export default function ProfessionalsRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { field } = useLocalSearchParams<{ field?: string }>();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/explore'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return (
    <DirectoryScreen
      initial={field}
      onBack={leave}
      onOpen={(id) => router.push({ pathname: '/professionals/[id]', params: { id } })}
      onOfferServices={(chosen) => router.push(chosen ? { pathname: '/professional-apply', params: { field: chosen } } : '/professional-apply')}
      onChange={(chosen) => router.setParams({ field: chosen === 'all' ? undefined : chosen })}
    />
  );
}
