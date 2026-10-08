import { useLocalSearchParams, useRouter } from 'expo-router';

import { CategoriesScreen } from '@/features/explore/CategoriesScreen';

/**
 * X2, X3 and X13 · Categories (`/categories?category=<id>`), opened from Explore's category tiles. Signed in only:
 * the route graph lists it under the signed-in guard (SHARED-CHANGES EXPLORE-01 #2), so a signed-out visit never
 * reaches it. The chip in use is kept in the route.
 */
export default function CategoriesRoute() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();
  return (
    <CategoriesScreen
      initial={category}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/explore'))}
      onChange={(next) => router.setParams({ category: next })}
    />
  );
}
