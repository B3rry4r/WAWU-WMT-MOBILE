import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useSystemBack } from '@/features/professionals/parts';
import { MyCoursesScreen } from '@/features/schools/MyCoursesScreen';

/**
 * SC8 · My courses (`/schools/mine`). Opened from the Me menu and from SC7's My courses; a row opens its enrolment (SC7, or SC5 for
 * a place not paid yet). Back goes to where it was opened from, or to Me when it was opened on its own. Signed in only.
 */
export default function MyCoursesRoute() {
  const router = useRouter();
  const { status } = useSession();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/me'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return (
    <MyCoursesScreen
      onBack={leave}
      onOpen={(id) => router.push({ pathname: '/schools/enrolments/[id]', params: { id } })}
      onFindSchools={() => router.push('/schools')}
    />
  );
}
