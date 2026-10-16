import { useRouter } from 'expo-router';

import { HomeScreen } from '@/features/home/HomeScreen';

/**
 * The Home tab: Today (H1, H11, H36), and the Following and For you feed under the same tab row (HOME-01). Its search buttons open
 * Search (X5) and Today's creators' See all opens All creators (X4), both EXPLORE-02's.
 */
export default function HomeTab() {
  const router = useRouter();
  return <HomeScreen onSearch={() => router.push('/search')} onSeeAllCreators={() => router.push('/creators')} />;
}
