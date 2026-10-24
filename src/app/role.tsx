import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { RoleScreen } from '@/features/profile-edit/RoleScreen';

/**
 * Add a role, or change one (`/role`, `/role?id=<role id>`; FIX-113, G-292). It opens from M8's Experience. A role saves on its
 * own, so back and a finished save both return to M8. Signed in only: the route graph lists it under the signed-in guard
 * (SHARED-CHANGES FIX-113 #1), and a signed-out visit is sent to welcome here as well, as `add-work` does.
 */
export default function RoleRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { id } = useLocalSearchParams<{ id?: string }>();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/edit-profile'));
  return <RoleScreen roleId={id || undefined} onBack={leave} onDone={leave} />;
}
