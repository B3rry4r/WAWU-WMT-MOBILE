import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { AddWorkScreen } from '@/features/works/AddWorkScreen';
import { EditWorkScreen } from '@/features/works/EditWorkScreen';

/**
 * M36 · Add a work (`/add-work`). Signed in only; the route graph does not list it under the signed-in
 * guard yet (SHARED-CHANGES.md, ME-11), so a signed-out visit is sent to the welcome screen here. Back and
 * a saved work both return to where the person came from (the About tab, where the work now shows). When the
 * profile is full, "Open your works" goes to M34, where a work's Remove makes room.
 * With `?workId=` and `?wawuId=` (M35's Edit, FIX-113) the same route edits that work instead of adding one; for a work that is not the
 * signed-in person's it opens M35 instead (SWEEP-APP-8 L5).
 */
export default function AddWorkRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { workId, wawuId } = useLocalSearchParams<{ workId?: string; wawuId?: string }>();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  // Somebody else's work (a link typed or shared): the edit is never drawn, the work's own page (M35) opens in its place.
  if (workId && wawuId) {
    return (
      <EditWorkScreen
        wawuId={wawuId}
        workId={workId}
        onBack={leave}
        onSaved={leave}
        onNotOwner={() => router.replace({ pathname: '/works/[wawuId]/[workId]', params: { wawuId, workId } })}
      />
    );
  }
  return (
    <AddWorkScreen
      onBack={leave}
      onSaved={leave}
      onOpenWorks={(id) => router.dismissTo({ pathname: '/works/[wawuId]', params: { wawuId: id } })}
    />
  );
}
