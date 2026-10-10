import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useSystemBack } from '@/features/professionals/parts';
import { SchoolsScreen } from '@/features/schools/SchoolsScreen';

/**
 * SC1 · Schools (`/schools`), and SC10 when a search or category matches none. Opened from Explore's "Find a school"
 * door (X15) and Home's Schools tile (H1). Signed in only, like every screen behind the tabs. Back goes to where it was
 * opened from, or to Explore when it was opened on its own; Android's back button does the same.
 */
export default function SchoolsRoute() {
  const router = useRouter();
  const { status } = useSession();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/explore'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return <SchoolsScreen onBack={leave} onOpen={(id) => router.push({ pathname: '/schools/[id]', params: { id } })} />;
}
