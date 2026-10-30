import { Redirect } from 'expo-router';

/**
 * The cards list (`/cards`) is not in the app (R-104, owner, 30 Oct 2026: Nuvion has suspended cards; they stay off until Nuvion says they are back and
 * they have been tested on dev). Nothing opens the cards screens, and an old link or a stale notification lands on the Wallet. The screens
 * themselves are still in `src/features/cards/` for the day cards come back; the Hub's card routes are not touched.
 */
export default function CardsRoute() {
  return <Redirect href="/wallet" />;
}
