import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { CategoriesScreen } from '@/features/explore/CategoriesScreen';

/**
 * X2, X3 and X13 · Categories (`/categories?category=<id>`), opened from Explore's category tiles. Signed in only,
 * like the tab it opens from; the route graph does not list it under the signed-in guard, so a signed-out visit is
 * sent to the welcome screen here (as `/add-work` does). The chip in use is kept in the route.
 */
export default function CategoriesRoute() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return (
    <CategoriesScreen
      initial={category}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/explore'))}
      onChange={(next) => router.setParams({ category: next })}
    />
  );
}
