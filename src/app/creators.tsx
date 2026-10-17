import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { CategoriesScreen } from '@/features/explore/CategoriesScreen';

/**
 * X4 · All creators (`/creators`), opened from "See all" on Featured creators (Explore) and on Home's creators rail. It is the
 * Categories list on All, titled Creators, with a search button that opens Search (X5). Signed in only, like every screen behind
 * the tabs. Back goes to where it was opened from, or to Explore when it was opened on its own.
 */
export default function CreatorsRoute() {
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return (
    <CategoriesScreen
      title="Creators"
      initial="all"
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/explore'))}
      onSearch={() => router.push('/search')}
      onOpenCreator={(id) => router.push({ pathname: '/profile/[wawuId]', params: { wawuId: id } })}
    />
  );
}
