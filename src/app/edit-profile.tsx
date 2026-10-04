import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { EditProfileScreen } from '@/features/profile-edit/EditProfileScreen';

/**
 * M8 · Edit profile (`/edit-profile`). Signed in only. The route graph does not
 * list it under the signed-in guard yet (SHARED-CHANGES.md, ME-06), so a signed-out
 * visit is sent to the welcome screen here. Back and a finished save both return
 * to where the person came from.
 */
export default function EditProfileRoute() {
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return <EditProfileScreen onBack={leave} onOpenSocial={() => router.push('/social-links')} onSaved={leave} />;
}
