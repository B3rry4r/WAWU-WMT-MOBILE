import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useRefreshOnFocus } from '@/features/pro-listing/useRefreshOnFocus';
import { ListingsScreen } from '@/features/pro-listing/ListingsScreen';

/** P8 · Your listings (`/professional-listings`), and P9 for a hidden field. Signed in only. */
export default function ProfessionalListingsRoute() {
  const router = useRouter();
  const { status } = useSession();
  useRefreshOnFocus();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <ListingsScreen
      onBack={leave}
      onOpenInboxSettings={() => router.push('/paid-message-settings')}
      onApply={(field) => router.push(field ? { pathname: '/professional-apply', params: { field } } : '/professional-apply')}
    />
  );
}
