import { useRouter } from 'expo-router';

import { MeScreen } from '@/features/me/MeScreen';

/**
 * The Me tab (M1, M2, M4, M10), inside the tabs so the bottom bar stays. Edit profile opens M8, a featured
 * work opens M35 and "Add" opens M36; each returns here with Back.
 */
export default function MeTab() {
  const router = useRouter();
  return (
    <MeScreen
      onEditProfile={() => router.push('/edit-profile')}
      onAddWork={() => router.push('/add-work')}
      onOpenWork={(wawuId, workId) => router.push({ pathname: '/works/[wawuId]/[workId]', params: { wawuId, workId } })}
    />
  );
}
