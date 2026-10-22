import { useRouter } from 'expo-router';

import { queryClient } from '@/api/query';
import { ExploreScreen } from '@/features/explore/ExploreScreen';
import { listServicesTarget } from '@/features/pro-listing/door';

/**
 * The Explore tab (X1, X16, X17, X14), inside the tabs so the bottom bar stays. It wires the destinations that are built: a category
 * tile opens Categories (X2, X3); a slide of the slider (an advert's event, a featured event) and an event card open E2, Upcoming events' See all opens E1; the
 * "List your services" door opens P5 or P8 (PROS-03), "Find a professional" opens P1 (PROS-01) and "Find a school" opens
 * SC1 (SCHOOLS-03); the TGIF card opens today's reader (H29); the search pill opens Search (X5) and Featured creators' See all
 * opens All creators (X4), both EXPLORE-02's. The bell opens Notifications (M31, ME-14, `/notifications`). What X1 draws for screens
 * that are not built (a creator card: ME-02) is not drawn (R-47), and the task that builds each one adds it.
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
      onOpenTgif={() => router.push('/tgif')}
      onSearch={() => router.push('/search')}
      onSeeAllCreators={() => router.push('/creators')}
      onOpenNotifications={() => router.push('/notifications')}
      onOpenCreator={(id) => router.push({ pathname: '/profile/[wawuId]', params: { wawuId: id } })}
      onSeeAllMovies={() => router.push('/movies')}
      onOpenMovie={(id) => router.push({ pathname: '/movies/[id]', params: { id } })}
    />
  );
}
