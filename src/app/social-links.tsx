import { Redirect, useRouter } from 'expo-router';

import { useDraft } from '@/features/profile-edit/draft';
import { SocialLinksScreen } from '@/features/profile-edit/SocialLinksScreen';

/**
 * M9 · Social links (`/social-links`). It edits the form M8 holds, so it opens
 * only from M8: a visit with no form open (a link, a reload) goes to M8, which
 * reads the profile and starts one. Signed in only, by the route graph (SHARED-05).
 */
export default function SocialLinksRoute() {
  const router = useRouter();
  const draft = useDraft();
  if (!draft) return <Redirect href="/edit-profile" />;

  return <SocialLinksScreen onClose={() => (router.canGoBack() ? router.back() : router.replace('/edit-profile'))} />;
}
