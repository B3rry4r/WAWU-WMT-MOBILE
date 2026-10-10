import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useRefreshOnFocus } from '@/features/pro-listing/useRefreshOnFocus';
import { ApplyScreen } from '@/features/pro-listing/ApplyScreen';

/**
 * P5 · Offer your services (`/professional-apply`), and P6 and P7 which follow it in the same screen. Signed in
 * only. `?field=` starts from one field (P8's Apply again); a value that is not a field's id starts empty.
 */
export default function ProfessionalApplyRoute() {
  const router = useRouter();
  const { status } = useSession();
  useRefreshOnFocus();
  const { field } = useLocalSearchParams<{ field?: string }>();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return <ApplyScreen initialField={typeof field === 'string' ? field : undefined} onBack={leave} onDone={leave} onMyListings={() => router.replace('/professional-listings')} />;
}
