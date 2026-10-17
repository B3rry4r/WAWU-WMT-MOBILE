import { useQuery } from '@tanstack/react-query';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { queryClient } from '@/api/query';
import { useSession } from '@/api/session';
import { fetchMe, meKey } from '@/features/profile-edit/api';
import { HANDLE_PATTERN, limits } from '@/features/profile-edit/limits';

/**
 * `https://wawuafrica.com/u/<handle>` opened in the installed app (LINKS-01, A2): a profile, as Share on Me sends it. Nothing is
 * drawn here. Signed out lands on the welcome screen. Signed in, a person's own handle opens the Me tab; anyone else's opens that
 * person's works (M34, `/works/<handle>`, which takes a handle), the one page of another person the app has built: a full
 * profile of someone else is not built yet, and when it is this route points there. A handle that cannot be one (wrong
 * characters, too long) opens Home. If the Hub cannot say who the person is, the handle is taken as someone else's: nothing waits
 * on a retry.
 */
export default function ProfileLinkRoute() {
  const { status } = useSession();
  const { handle } = useLocalSearchParams<{ handle?: string }>();
  const wanted = typeof handle === 'string' ? handle.replace(/^@+/, '') : '';
  const valid = wanted.length <= limits.handle && HANDLE_PATTERN.test(wanted) && /[A-Za-z0-9_]/.test(wanted);
  const signedIn = status === 'signedIn';
  const me = useQuery({ queryKey: meKey, queryFn: fetchMe, enabled: signedIn && valid, retry: false }, queryClient);

  if (status === 'restoring') return null;
  if (!signedIn) return <Redirect href="/welcome" />;
  if (!valid) return <Redirect href="/" />;
  if (me.isPending) return null;
  const own = me.data?.handle?.toLowerCase() === wanted.toLowerCase();
  return own ? <Redirect href="/me" /> : <Redirect href={{ pathname: '/profile/[wawuId]', params: { wawuId: wanted } }} />;
}
