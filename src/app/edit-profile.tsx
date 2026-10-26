import { useLocalSearchParams, useRouter } from 'expo-router';

import { postProfileSaved } from '@/features/me/savedNotice';
import { EditProfileScreen } from '@/features/profile-edit/EditProfileScreen';

/**
 * M8 · Edit profile (`/edit-profile`). Signed in only: the route graph lists it
 * under the signed-in guard (SHARED-05), so a signed-out visit never reaches it. Back and a finished save both return
 * to where the person came from. "Profile saved" shows once: opened from the Me tab
 * (`?from=me`) and going back to it, the Me tab shows it (M10) and M8 does not; opened cold (nothing to go back to), a save lands on the
 * Me tab, which shows it; opened from anywhere else (Settings' header), M8 shows its own before it closes.
 */
export default function EditProfileRoute() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const canGoBack = router.canGoBack();
  // A person going back to the Me tab sees M10 there.
  const toMeTab = from === 'me' && canGoBack;
  // A cold open (a reload, a link) has nothing to go back to: the person lands on their profile, where M10 draws the notice, not over M8.
  const toProfile = !canGoBack;
  return (
    <EditProfileScreen
      onBack={leave}
      onOpenSocial={() => router.push('/social-links')}
      onPositionPhoto={(kind) => router.push({ pathname: '/photo-position', params: { kind } })}
      onOpenRole={(id) => router.push(id ? { pathname: '/role', params: { id } } : '/role')}
      ownNotice={!toMeTab && !toProfile}
      onSaved={() => {
        if (toProfile) {
          postProfileSaved();
          router.replace('/me');
          return;
        }
        if (toMeTab) postProfileSaved();
        leave();
      }}
    />
  );
}
