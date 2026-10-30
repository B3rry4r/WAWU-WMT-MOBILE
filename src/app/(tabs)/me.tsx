import { useIsFocused, useRouter } from 'expo-router';

import { MeScreen } from '@/features/me/MeScreen';

/**
 * The Me tab (M1, M2, M4, M10), inside the tabs so the bottom bar stays. Edit profile opens M8 (marked
 * `from=me`, so its save shows "Profile saved" here, M10, and not on M8 as well), a featured
 * work opens M35, "Add" opens M36, a listing on Services opens P8 (Your listings) and the paid messages row opens I21; each returns here with Back.
 * The Menu button raises Z1, whose Settings row opens Z2 (`/settings`) and whose My courses row opens SC8 (`/schools/mine`); Back returns here. The gift button opens Invite and
 * earn (RF1, `/invite`, REF-03); Back returns here. The menu's My purchases, Saved and Notifications rows open M29, M30 and M31 (`/purchases`, `/saved`, `/notifications`), and its Your tier row opens VF14 (`/your-tier`); Back returns here. For a creator account the menu's first two rows open the Creator dashboard (M18, `/creator`) and My content (M28, `/library`); Back returns here. A draft tile in the Content grid opens Your shop (VF2, `/shop`, VERIFY-01), a published tile opens its page (`/content/<id>`, WALK-FIX H1); Back returns here. A creator with no Voice Intro yet sees its prompt under the name, which opens VF4 (`/voice-intro`, VERIFY-02); Back returns here; one with a Voice Intro sees its Bio player under the bio (FIX-103).
 */
export default function MeTab() {
  const router = useRouter();
  // The tab stays mounted behind the others: its Bio clip stops when another tab or a screen is in front.
  const focused = useIsFocused();
  return (
    <MeScreen
      focused={focused}
      onEditProfile={() => router.push({ pathname: '/edit-profile', params: { from: 'me' } })}
      onOpenListings={() => router.push('/professional-listings')}
      onOpenPaid={() => router.push('/paid-message-settings')}
      onOpenSettings={() => router.push('/settings')}
      onOpenInvite={() => router.push('/invite')}
      onOpenCourses={() => router.push('/schools/mine')}
      onOpenVerification={() => router.push('/verification')}
      onOpenTier={() => router.push('/your-tier')}
      onOpenShop={() => router.push('/shop')}
      onOpenPiece={(id) => router.push({ pathname: '/content/[id]', params: { id } })}
      onOpenVoiceIntro={() => router.push('/voice-intro')}
      onCreate={() => router.push('/create')}
      onOpenDashboard={() => router.push('/creator')}
      onOpenLibrary={() => router.push('/library')}
      onOpenPurchases={() => router.push('/purchases')}
      onOpenSaved={() => router.push('/saved')}
      onOpenNotifications={() => router.push('/notifications')}
      onAddWork={() => router.push('/add-work')}
      onOpenWork={(wawuId, workId) => router.push({ pathname: '/works/[wawuId]/[workId]', params: { wawuId, workId } })}
    />
  );
}
