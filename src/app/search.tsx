import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { openRoom } from '@/features/communities/routes';
import { SearchScreen } from '@/features/search/SearchScreen';

/**
 * X5 to X12 · Search (`/search`), opened from Explore's search bar, Home's search button and All creators' search button.
 * Signed in only, like every screen behind the tabs (Follow, Join and the recent searches are a signed-in person's). Cancel goes to
 * where it was opened from, or to Explore when it was opened on its own.
 */
export default function SearchRoute() {
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return <SearchScreen onCancel={() => (router.canGoBack() ? router.back() : router.replace('/explore'))} onOpenRoom={(id) => openRoom(router, id)} />;
}
