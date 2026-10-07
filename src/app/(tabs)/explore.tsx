import { useRouter } from 'expo-router';

import { ExploreScreen } from '@/features/explore/ExploreScreen';

/** The Explore tab (X1, X14), inside the tabs so the bottom bar stays. A category tile opens Categories (X2, X3). */
export default function ExploreTab() {
  const router = useRouter();
  return <ExploreScreen onOpenCategory={(category) => router.push({ pathname: '/categories', params: { category } })} />;
}
