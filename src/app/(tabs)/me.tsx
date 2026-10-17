import { useRouter } from 'expo-router';

import { MeScreen } from '@/features/me/MeScreen';

/**
 * The Me tab (M1, M2, M4, M10), inside the tabs so the bottom bar stays. Edit profile opens M8 (marked
 * `from=me`, so its save shows "Profile saved" here, M10, and not on M8 as well), a featured
 * work opens M35, "Add" opens M36, a listing on Services opens P8 (Your listings) and the paid messages row opens I21; each returns here with Back.
 * The Menu button raises Z1, whose Settings row opens Z2 (`/settings`); Back returns here. The gift button opens Invite and
 * earn (RF1, `/invite`, REF-03); Back returns here. A draft tile in the Content grid opens Your shop (VF2, `/shop`, VERIFY-01); Back returns here.
 */
export default function MeTab() {
  const router = useRouter();
  return (
    <MeScreen
      onEditProfile={() => router.push({ pathname: '/edit-profile', params: { from: 'me' } })}
      onOpenListings={() => router.push('/professional-listings')}
      onOpenPaid={() => router.push('/paid-message-settings')}
      onOpenSettings={() => router.push('/settings')}
      onOpenInvite={() => router.push('/invite')}
      onOpenVerification={() => router.push('/verification')}
      onOpenTier={() => router.push('/your-tier')}
      onOpenShop={() => router.push('/shop')}
      onCreate={() => router.push('/create')}
      onAddWork={() => router.push('/add-work')}
      onOpenWork={(wawuId, workId) => router.push({ pathname: '/works/[wawuId]/[workId]', params: { wawuId, workId } })}
    />
  );
}
