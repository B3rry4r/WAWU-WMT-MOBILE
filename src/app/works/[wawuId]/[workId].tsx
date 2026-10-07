import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { WorkScreen } from '@/features/works/WorkScreen';

/**
 * M35 · A work (`/works/<WAWU ID or handle>/<work id>`). Signed in only; the route graph does not list it
 * under the signed-in guard yet (SHARED-CHANGES.md, ME-11), so a signed-out visit is sent to the welcome
 * screen here. The creator row only becomes a way into the creator's profile once that screen exists
 * (ME-02 passes `onOpenCreator`).
 */
export default function WorkRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { wawuId, workId } = useLocalSearchParams<{ wawuId: string; workId: string }>();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return <WorkScreen wawuId={wawuId} workId={workId} onBack={leave} />;
}
