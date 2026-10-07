import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { AddWorkScreen } from '@/features/works/AddWorkScreen';

/**
 * M36 · Add a work (`/add-work`). Signed in only; the route graph does not list it under the signed-in
 * guard yet (SHARED-CHANGES.md, ME-11), so a signed-out visit is sent to the welcome screen here. Back and
 * a saved work both return to where the person came from (the About tab, where the work now shows).
 */
export default function AddWorkRoute() {
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return <AddWorkScreen onBack={leave} onSaved={leave} />;
}
