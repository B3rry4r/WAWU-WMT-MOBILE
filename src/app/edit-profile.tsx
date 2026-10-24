import { useLocalSearchParams, useRouter } from 'expo-router';

import { postProfileSaved } from '@/features/me/savedNotice';
import { EditProfileScreen } from '@/features/profile-edit/EditProfileScreen';

/**
 * M8 · Edit profile (`/edit-profile`). Signed in only: the route graph lists it
 * under the signed-in guard (SHARED-05), so a signed-out visit never reaches it. Back and a finished save both return
 * to where the person came from. "Profile saved" shows once: opened from the Me tab
 * (`?from=me`) and going back to it, the Me tab shows it (M10) and M8 does not;
 * opened from anywhere else (Settings' header), M8 shows its own before it closes.
 */
export default function EditProfileRoute() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  // Only a person going back to the Me tab sees M10 there; a cold open with nothing to go back to does not.
  const toMeTab = from === 'me' && router.canGoBack();
  return (
    <EditProfileScreen
      onBack={leave}
      onOpenSocial={() => router.push('/social-links')}
      ownNotice={!toMeTab}
      onSaved={() => {
        if (toMeTab) postProfileSaved();
        leave();
      }}
    />
  );
}
