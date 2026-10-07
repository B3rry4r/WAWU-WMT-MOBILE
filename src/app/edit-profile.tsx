import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { postProfileSaved } from '@/features/me/savedNotice';
import { EditProfileScreen } from '@/features/profile-edit/EditProfileScreen';

/**
 * M8 · Edit profile (`/edit-profile`). Signed in only. The route graph does not
 * list it under the signed-in guard yet (SHARED-CHANGES.md, ME-06), so a signed-out
 * visit is sent to the welcome screen here. Back and a finished save both return
 * to where the person came from; a finished save also leaves "Profile saved" for
 * the Me tab to show (M10).
 */
export default function EditProfileRoute() {
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <EditProfileScreen
      onBack={leave}
      onOpenSocial={() => router.push('/social-links')}
      onSaved={() => {
        postProfileSaved();
        leave();
      }}
    />
  );
}
