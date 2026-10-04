import { useNavigation, useRouter } from 'expo-router';
import { useMemo } from 'react';

import { expireKeptCheck } from './keptCheck';

/** The route names of Open your wallet's screens (`src/app`): A26, A5, and A6 with A7 and A16. */
const FLOW_ROUTES: readonly string[] = ['open-wallet', 'open-wallet-details', 'open-wallet-selfie'];

type StackState = { routes: readonly { name: string }[] };

/**
 * How many of the newest screens on the stack belong to Open your wallet, and
 * whether anything else is under them. Pure, for the tests.
 */
export function flowDepth(state: StackState | undefined): { depth: number; below: boolean } {
  const routes = state?.routes ?? [];
  let depth = 0;
  for (let i = routes.length - 1; i >= 0 && FLOW_ROUTES.includes(routes[i].name); i -= 1) depth += 1;
  return { depth, below: routes.length > depth };
}

export type OpenWalletWay = {
  /** Leaves Open your wallet altogether, back to whatever opened it (Home when nothing did). */
  leave: () => void;
  /**
   * Back to A26 for a new BVN check: the server no longer holds the one this
   * step was taken under, or refused its handle. `notice` is the sentence A26
   * shows on arrival (the server's). What was typed on A5 is kept for the new check.
   */
  restart: (notice?: string) => void;
};

/**
 * The two ways out of A5 and A6 other than their back button. A26 sits under
 * them on the stack (they are pushed on top of it), so leaving dismisses every
 * Open your wallet screen at once (and, with nothing under them, puts Home
 * in their place), and restarting dismisses down to A26 (or
 * opens it, when A5 or A6 was reached without it, such as a reload).
 */
export function useOpenWalletWay(): OpenWalletWay {
  const router = useRouter();
  const navigation = useNavigation();
  return useMemo(
    () => ({
      leave: () => {
        const { depth, below } = flowDepth(navigation.getState() as StackState | undefined);
        if (below && depth > 0) {
          router.dismiss(depth);
          return;
        }
        // Opened with nothing under it (a link, a reload): every screen of the flow goes, not only the top one,
        // so nothing it typed or kept stays mounted under Home.
        if (depth > 1) router.dismiss(depth - 1);
        router.replace('/');
      },
      // The kept check no longer serves (gone, stale, or its handle refused): forget it and its handle, so A26
      // asks for a new check, keeping A5's address and occupation and the sentence that says why.
      restart: (notice?: string) => {
        expireKeptCheck(notice ?? null);
        router.dismissTo('/open-wallet');
      },
    }),
    [router, navigation],
  );
}
