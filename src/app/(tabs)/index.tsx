import { useRouter } from 'expo-router';

import { HomeScreen } from '@/features/home/HomeScreen';
import { useClaimPendingReferral } from '@/features/referral/pendingCode';

/**
 * The Home tab: Today (H1, H11, H36), and the Following and For you feed under the same tab row (HOME-01). A creator account
 * also sees the Create button, which opens M19 (ME-04, R-38). Its search buttons open Search (X5) and Today's creators' See all
 * opens All creators (X4), both EXPLORE-02's. A code kept from a `wawu/r/<code>` link is claimed here once the person is signed
 * in, with nothing drawn for it (REF-03, G-812).
 */
export default function HomeTab() {
  const router = useRouter();
  useClaimPendingReferral();
  return (
    <HomeScreen
      onCreate={() => router.push('/create')}
      onSearch={() => router.push('/search')}
      onSeeAllCreators={() => router.push('/creators')}
    />
  );
}
