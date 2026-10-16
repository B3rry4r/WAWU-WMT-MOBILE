import { useRouter } from 'expo-router';

import { queryClient } from '@/api/query';
import { ExploreScreen } from '@/features/explore/ExploreScreen';
import { listServicesTarget } from '@/features/pro-listing/door';

/**
 * The Explore tab (X1, X14), inside the tabs so the bottom bar stays. It wires the destinations that are built: a category
 * tile opens Categories (X2, X3); the featured event and an event card open E2, Upcoming events' See all opens E1; the
 * "List your services" door opens P5 or P8 (PROS-03), "Find a professional" opens P1 (PROS-01) and "Find a school" opens
 * SC1 (SCHOOLS-03). What X1 draws for screens that are not built (search and Featured creators' See all: EXPLORE-02; the
 * bell: ME-14; a creator card: ME-02) is not drawn (R-47), and the task that builds each one adds it.
 */
export default function ExploreTab() {
  const router = useRouter();
  return (
    <ExploreScreen
      onOpenCategory={(category) => router.push({ pathname: '/categories', params: { category } })}
      onOpenEvent={(id) => router.push({ pathname: '/events/[id]', params: { id } })}
      onSeeAllEvents={() => router.push('/events')}
      onFindProfessional={() => router.push('/professionals')}
      onFindSchool={() => router.push('/schools')}
      onListServices={() => void listServicesTarget(queryClient).then((href) => router.push(href))}
      onCreate={() => router.push('/create')}
    />
  );
}
