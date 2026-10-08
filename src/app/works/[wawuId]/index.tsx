import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { AllWorksScreen } from '@/features/works/AllWorksScreen';

/**
 * M34 · All works (`/works/<WAWU ID or handle>`). Signed in only (the Hub's works routes need a signed-in
 * caller); the route graph does not list it under the signed-in guard yet (SHARED-CHANGES.md, ME-11), so a
 * signed-out visit is sent to the welcome screen here. A work opens M35, and the person's own empty page
 * offers M36.
 */
export default function AllWorksRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { wawuId } = useLocalSearchParams<{ wawuId: string }>();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <AllWorksScreen
      wawuId={wawuId}
      onBack={leave}
      onOpenWork={(workId) => router.push({ pathname: '/works/[wawuId]/[workId]', params: { wawuId, workId } })}
      onAddWork={() => router.push('/add-work')}
    />
  );
}
