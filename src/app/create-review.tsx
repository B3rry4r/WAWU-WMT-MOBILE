import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useCreatorGate } from '@/features/create/CreateEntry';
import { useSent } from '@/features/create/details';
import { ReviewScreen } from '@/features/create/ReviewScreen';
import { leaveToHome } from '@/features/navigation/leaveToHome';

/**
 * M25 · Sent for review (`/create-review`). Opened with no piece just sent (a reload, a link) it goes to Create, since there is
 * nothing to say. Done leaves the flow and lands on Home, with the phone's Back doing the same (WALK-FIX M3); View in library leaves it for My content (M28).
 */
export default function CreateReviewRoute() {
  const router = useRouter();
  const { status } = useSession();
  const sent = useSent();
  const gate = useCreatorGate(status === 'signedIn');
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (gate !== 'creator') return gate === 'checking' ? null : <Redirect href="/" />;
  if (!sent) return <Redirect href="/create" />;

  return (
    <ReviewScreen
      title={sent.title}
      onDone={() => leaveToHome(router)}
      onOpenLibrary={() => {
        leaveToHome(router);
        router.push('/library');
      }}
    />
  );
}
