import { useLocalSearchParams } from 'expo-router';

import { WalletScreen } from '@/features/wallet/home/WalletScreen';

/**
 * The Wallet tab (W1, with W4, W5 and W6 as its states), inside the tabs so the bottom bar stays. `add` is a currency account the person
 * was sent here to add ("Add a dollar account" on /tiers, R-87): the first account asked for when there is no wallet yet, or the place
 * to add it when there is one.
 */
export default function WalletTab() {
  const { add } = useLocalSearchParams<{ add?: string }>();
  return <WalletScreen add={add} />;
}
