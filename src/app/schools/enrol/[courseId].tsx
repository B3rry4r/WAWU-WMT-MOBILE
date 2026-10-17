import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useSystemBack } from '@/features/professionals/parts';
import { EnrolScreen } from '@/features/schools/EnrolScreen';

/**
 * SC4 · Your details, and SC11 when the class fills at Continue (`/schools/enrol/<courseId>?intake=<intakeId>`). Opened from SC3's
 * Enroll with the class it offered. Continue holds a place and replaces this page with SC5, so Back from the payment lands on the
 * course and not on a Continue that has nothing left to do. Signed in only.
 */
export default function EnrolRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { courseId, intake } = useLocalSearchParams<{ courseId: string; intake?: string }>();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/schools'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (typeof courseId !== 'string' || courseId === '') return <Redirect href="/schools" />;

  return (
    <EnrolScreen
      courseId={courseId}
      intakeId={typeof intake === 'string' && intake !== '' ? intake : undefined}
      onBack={leave}
      onHeld={(id) => router.replace({ pathname: '/schools/enrolments/[id]', params: { id } })}
      onOpen={(id) => router.replace({ pathname: '/schools/enrolments/[id]', params: { id } })}
    />
  );
}
