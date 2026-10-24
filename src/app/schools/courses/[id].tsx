import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useSystemBack } from '@/features/professionals/parts';
import { CourseScreen } from '@/features/schools/CourseScreen';

/**
 * SC3 · Course (`/schools/courses/<id>`). Opened from a course on SC2; on its own, back goes to SC1 (the on-screen back and Android's).
 * Enroll opens SC4 with the class SC3 tells about; "Or apply on the school's website" opens SC9 over this page.
 */
export default function CourseRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { id } = useLocalSearchParams<{ id: string }>();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/schools'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (typeof id !== 'string' || id === '') return <Redirect href="/schools" />;

  return (
    <CourseScreen
      id={id}
      onBack={leave}
      onEnroll={(intakeId) => router.push({ pathname: '/schools/enrol/[courseId]', params: { courseId: id, intake: intakeId } })}
    />
  );
}
