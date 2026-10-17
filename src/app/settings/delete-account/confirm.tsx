import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { ConfirmDeletionScreen } from '@/features/delete-account/ConfirmDeletionScreen';
import { useSystemBack } from '@/features/professionals/parts';

/**
 * Z7 · Confirm (`/settings/delete-account/confirm`). A scheduled deletion replaces this screen with Z8, so Back from there never lands on a
 * form that has already been sent. Signed in only.
 */
export default function ConfirmDeletionRoute() {
  const router = useRouter();
  const { status } = useSession();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/settings/delete-account'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return (
    <ConfirmDeletionScreen
      onBack={leave}
      onScheduled={(at) => router.replace({ pathname: '/settings/delete-account/scheduled', params: { on: at } })}
      onWithdraw={() => router.push('/withdraw')}
    />
  );
}
