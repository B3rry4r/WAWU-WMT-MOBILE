import { Redirect } from 'expo-router';

import { useSession } from '@/api/session';

/**
 * `https://wawuafrica.com/content/<id>` (or `wawu://content/<id>`) opened in the installed app (FIX-60, G-HOME-03-2): a piece of
 * content, as its Share sends it. Nothing is drawn here. Signed out lands on the welcome screen, like `/u/<handle>` and `/receipt/<code>`.
 * Signed in lands on Home until the content page itself is merged: HOME-03 (branch `wmt/S1b`) builds this same file as the page
 * (H19 to H25), also sending a signed-out person to the welcome screen, and its file replaces this one at the merge.
 */
export default function ContentLinkRoute() {
  const { status } = useSession();
  if (status === 'restoring') return null;
  return <Redirect href={status === 'signedIn' ? '/' : '/welcome'} />;
}
