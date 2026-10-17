import { useNavigation, useRouter, type Href } from 'expo-router';
import { useEffect, useMemo } from 'react';

import { forgetDraft } from './draft';
import {
  OPEN_WALLET_ACCOUNT_PATH,
  OPEN_WALLET_ADDRESS_PATH,
  OPEN_WALLET_CHECKING_PATH,
  OPEN_WALLET_DETAILS_AGAIN,
  OPEN_WALLET_ID_PATH,
  OPEN_WALLET_REJECTED_PATH,
} from './entry';
import { expireKeptCheck } from './keptCheck';

/** The route names of Open your wallet's screens (`src/app`): the BVN step, A5, A6 with A7 and A16, A26 to A29 (KYC-06), A8, and A9 with A10. */
const FLOW_ROUTES: readonly string[] = [
  'open-wallet',
  'open-wallet-details',
  'open-wallet-selfie',
  'open-wallet-id',
  'open-wallet-address',
  'open-wallet-checking',
  'open-wallet-rejected',
  'open-wallet-account',
  'open-wallet-pin',
];

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

/**
 * True when the newest screen on the stack is not one of Open your wallet's: the person has left the flow
 * (a screen of the app was opened over A26 or A27, or the flow is gone), so what A26 and A27 held goes. Pure, for the tests.
 */
export function leavesFlow(state: StackState | undefined): boolean {
  return flowDepth(state).depth === 0;
}

/**
 * Drops what A26 and A27 hold the moment another screen takes the front (route files of A26 and A27 call it):
 * the screens' own unmount covers the person going back, the browser's back and the flow closing (`useDraftLifetime`);
 * this covers a screen opened over them that leaves them mounted underneath.
 */
export function useDropDraftOnExit(): void {
  const navigation = useNavigation();
  useEffect(
    () =>
      navigation.addListener('blur', () => {
        if (leavesFlow(navigation.getState() as StackState | undefined)) forgetDraft();
      }),
    [navigation],
  );
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
  /**
   * The account is open (A7): every earlier step goes and A8 takes their place,
   * on top of whatever opened the flow. Nothing of A26 to A7 is wanted again,
   * and a back from A8 never lands on a step that would ask for them.
   */
  opened: () => void;
  /** The documents are sent (A27's Submit): A28 takes the place of every step so far. */
  checking: () => void;
  /** The review said no (A28): A29 takes the place of every step so far. */
  rejected: () => void;
  /** Upload again (A29): A26 or A27 takes the place of A29. */
  uploadAgain: (to: 'id' | 'address') => void;
  /** The documents are needed (A28 found nothing sent, or a correction reopened them): A26. */
  needsDocuments: () => void;
  /**
   * The Hub asks for the details again and nothing holds them (a refusal, an expired opening, a cold start):
   * the first step, which collects them, takes the place of every screen so far and does not send the person back to A29.
   */
  details: () => void;
};

/**
 * The ways out of A5, A6, A8 and A9 other than their back button. A26 sits under
 * them on the stack (they are pushed on top of it), so leaving dismisses every
 * Open your wallet screen at once (and, with nothing under them, puts Home
 * in their place), and restarting dismisses down to A26 (or
 * opens it, when A5 or A6 was reached without it, such as a reload).
 */
export function useOpenWalletWay(): OpenWalletWay {
  const router = useRouter();
  const navigation = useNavigation();
  return useMemo(() => {
    // Every Open your wallet screen on the stack goes and `path` takes their place, on top of whatever opened the flow:
    // nothing of the steps before it is wanted again, and a back from it never lands on one that would ask for them.
    const replaceFlow = (path: Href) => {
      const { depth, below } = flowDepth(navigation.getState() as StackState | undefined);
      if (below && depth > 0) {
        router.dismiss(depth);
        router.push(path);
        return;
      }
      if (depth > 1) router.dismiss(depth - 1);
      router.replace(path);
    };
    return {
      leave: () => {
        forgetDraft();
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
      opened: () => {
        forgetDraft();
        replaceFlow(OPEN_WALLET_ACCOUNT_PATH);
      },
      checking: () => replaceFlow(OPEN_WALLET_CHECKING_PATH),
      rejected: () => replaceFlow(OPEN_WALLET_REJECTED_PATH),
      uploadAgain: (to) => replaceFlow(to === 'address' ? OPEN_WALLET_ADDRESS_PATH : OPEN_WALLET_ID_PATH),
      needsDocuments: () => replaceFlow(OPEN_WALLET_ID_PATH),
      details: () => {
        forgetDraft();
        replaceFlow(OPEN_WALLET_DETAILS_AGAIN);
      },
    };
  }, [router, navigation]);
}
