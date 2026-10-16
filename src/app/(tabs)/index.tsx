import { useRouter } from 'expo-router';

import { HomeScreen } from '@/features/home/HomeScreen';

/**
 * The Home tab: Today (H1, H11, H36), and the Following and For you feed under the same tab row (HOME-01). A creator account
 * also sees the Create button, which opens M19 (ME-04, R-38).
 */
export default function HomeTab() {
  const router = useRouter();
  return <HomeScreen onCreate={() => router.push('/create')} />;
}
