import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { queryClient } from '@/api/query';
import { CreateScreen } from '@/features/create/CreateScreen';
import { resetDraft } from '@/features/create/draft';
import { listServicesTarget } from '@/features/pro-listing/door';

/**
 * M19 · Create (`/create`), opened by the Create button on Home, Explore and Me (creator accounts, R-38). Content opens M20 on a
 * fresh draft, Event opens the host form (E13, or E21 without a tick) and Service opens P5 or P8. Community (I32, INBOX-14) and
 * "Get verified" (M11, ME-12) are added by the tasks that build where they lead (R-47). Signed in only.
 */
export default function CreateRoute() {
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return (
    <CreateScreen
      onClose={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      onContent={() => {
        resetDraft();
        router.push('/create-format');
      }}
      onEvent={() => router.push('/events/host')}
      onService={() => void listServicesTarget(queryClient).then((href) => router.push(href))}
    />
  );
}
