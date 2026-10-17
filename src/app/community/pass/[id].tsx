import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { PassScreen } from '@/features/community-pass/PassScreen';

/**
 * I30 and I31 · A private community's monthly pass (`/community/pass/<id>`, INBOX-14, R-63). Opened from I24's Join on a private room, from a
 * private room a person is not in, and from the reminder 3 days before a pass ends (its renew tap). Signed in only: the route graph does not
 * guard it, so a signed-out visit is sent to the welcome screen here, as the other wallet routes do.
 */
export default function CommunityPassRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return <PassScreen key={String(id)} id={String(id)} onBack={() => (router.canGoBack() ? router.back() : router.replace('/inbox'))} />;
}
