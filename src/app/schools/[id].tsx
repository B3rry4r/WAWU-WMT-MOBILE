import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useSystemBack } from '@/features/professionals/parts';
import { SchoolScreen } from '@/features/schools/SchoolScreen';

/** SC2 · School (`/schools/<id>`). Opened from SC1; on its own, back goes to SC1 (the on-screen back and Android's). */
export default function SchoolRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { id } = useLocalSearchParams<{ id: string }>();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/schools'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (typeof id !== 'string' || id === '') return <Redirect href="/schools" />;

  return <SchoolScreen id={id} onBack={leave} onOpenCourse={(courseId) => router.push({ pathname: '/schools/courses/[id]', params: { id: courseId } })} />;
}
