import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useDraft } from '@/features/profile-edit/draft';
import { SocialLinksScreen } from '@/features/profile-edit/SocialLinksScreen';

/**
 * M9 · Social links (`/social-links`). It edits the form M8 holds, so it opens
 * only from M8: a visit with no form open (a link, a reload) goes to M8, which
 * reads the profile and starts one.
 */
export default function SocialLinksRoute() {
  const router = useRouter();
  const { status } = useSession();
  const draft = useDraft();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (!draft) return <Redirect href="/edit-profile" />;

  return <SocialLinksScreen onClose={() => (router.canGoBack() ? router.back() : router.replace('/edit-profile'))} />;
}
