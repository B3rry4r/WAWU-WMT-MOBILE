import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { useSession } from '@/api/session';
import { codeFromLink } from '@/features/referral/model';
import { claimPendingReferral, rememberCode } from '@/features/referral/pendingCode';

/**
 * A `wawu/r/<code>` link opened in the installed app (G-812, V10). No board draws a place to type a code, so nothing is
 * drawn here either: the code is kept, and once the person is signed in it is claimed with the Hub (`pendingCode.ts`).
 * Signed out, the visitor is sent to the welcome screen and the claim is made when the sign-up they finish lands on Home.
 * Signed in, it is claimed now and the person is sent Home. Whatever the Hub answers, nothing is told.
 */
export default function ReferralLinkRoute() {
  const { status } = useSession();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const kept = codeFromLink(typeof code === 'string' ? code : null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!kept || status === 'restoring') return;
    let live = true;
    void (async () => {
      await rememberCode(kept);
      if (status === 'signedIn') await claimPendingReferral();
      if (live) setDone(true);
    })();
    return () => {
      live = false;
    };
  }, [kept, status]);

  if (status === 'restoring') return null;
  const next = status === 'signedIn' ? '/' : '/welcome';
  if (!kept || done) return <Redirect href={next} />;
  return null;
}
