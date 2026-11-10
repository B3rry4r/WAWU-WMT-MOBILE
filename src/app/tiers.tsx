import { Redirect, useFocusEffect, useNavigation, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { useSession } from '@/api/session';
import { useStartHref } from '@/features/shell/startHref';
import { TiersScreen } from '@/features/verify/TiersScreen';
import { dropColdPath } from '@/lib/returnPath';

/**
 * VF5 · Make it official, and VF5b · Upgrade (`/tiers`). "See tiers" on the host form's needs-a-tier page (E21), "Get verified" on the
 * Create hub (M19), the tier badge on Me, "Publish" for a person with no tier (VERIFY-04) and "Upgrade" on Your tier (VF14) open it.
 * Signed in only. Continue closes the sheet first and opens the checkout (VF6) with the tier chosen once the sheet is closed: the sheet
 * is a Modal, which sits above every screen, so a checkout pushed under an open one cannot be paid or tapped. Coming back from the
 * checkout opens the sheet again with the choice as it was. Closing returns to where it was opened from.
 * WEBAPP-09 W2: opened cold on the web (a refresh, a typed or shared address) nothing sits below the sheet, so the screen the person would
 * have been on (Home, or the sign-up step or offer they have not finished: `useStartHref`) is put there first, and Close always leads back to it.
 */
export default function TiersRoute() {
  const router = useRouter();
  const { status } = useSession();
  const [going, setGoing] = useState<{ kind: 'tier' | 'upgrade'; tier: string } | null>(null);
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  });
  const navigation = useNavigation();
  const start = useStartHref();
  // Nothing below this screen: the browser opened it cold. Read once, before anything moves.
  const [cold] = useState(() => Platform.OS === 'web' && (navigation.getState()?.routes.length ?? 0) <= 1);
  useEffect(() => {
    if (!cold || status !== 'signedIn') return;
    // The address asked for is reached here, so the tier offer's "take them to the page they asked for" has nothing left to do.
    dropColdPath();
    routerRef.current.replace(start as Href);
    // This screen is gone once the step below is in; the sheet is pushed on top of it by a timer that outlives it.
    setTimeout(() => routerRef.current.push('/tiers'), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one move, on the first signed-in render
  }, [cold, status]);

  // The sheet is open whenever this screen is the one in front; the checkout it left for is on top while `going` is set.
  useFocusEffect(
    useCallback(() => {
      setGoing(null);
    }, []),
  );
  // Runs after the render that closed the sheet, so the checkout is pushed with the sheet already closing.
  useEffect(() => {
    if (going) routerRef.current.push({ pathname: '/checkout', params: { kind: going.kind, tier: going.tier } });
  }, [going]);

  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (cold) return null;

  return (
    <TiersScreen
      open={going === null}
      onClose={() => (router.canGoBack() ? router.back() : router.replace(start as Href))}
      // A second tap while the sheet is closing keeps the first choice: one push, never two.
      onContinue={(kind, tier) => setGoing((already) => already ?? { kind, tier })}
    />
  );
}
