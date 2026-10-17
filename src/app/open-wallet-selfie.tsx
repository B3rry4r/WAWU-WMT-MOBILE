import { SelfieStep } from '@/features/open-wallet/SelfieStep';

/**
 * A6 · Selfie: Open your wallet's step for the selfie (R-6). Under the review opening it is the hand-off to Nuvion's
 * hosted page with A7 (back from the secure page) as its state, after A27's Submit (DV2-05); under the older opening
 * it is the camera with A7 (matched, the account opening) and A16 (no match) as its states, pushed on top of A5.
 * Once the account opens, A8 takes the place of every step so far (`useOpenWalletWay().opened`). Signed in only,
 * by the route graph (SHARED-05).
 */
export default function OpenWalletSelfieRoute() {
  return <SelfieStep />;
}
