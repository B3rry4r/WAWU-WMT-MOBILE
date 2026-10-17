import { useRouter } from 'expo-router';

import { addMoneyHref } from '@/features/addmoney/entry';
import { OPEN_WALLET_PIN_PATH } from '@/features/open-wallet/entry';

import { BuyCreditsSheet } from './BuyCreditsSheet';

export type BuyCreditsEntryProps = {
  visible: boolean;
  onClose: () => void;
  /** What I29's button says: "Back to chat" in a room, "Done" anywhere else. */
  doneLabel: string;
  /** The credits were added: the host reads its own copy of the balance again. */
  onAdded?: () => void;
};

/** I28 and I29 wired to the app's routes: A9 for a missing PIN, W37 for a forgotten one, Add money (W15) for a short wallet. */
export function BuyCreditsEntry(props: BuyCreditsEntryProps) {
  const router = useRouter();
  return (
    <BuyCreditsSheet
      {...props}
      onSetPin={() => router.push(OPEN_WALLET_PIN_PATH)}
      onForgotPin={() => router.push('/reset-pin')}
      onAddMoney={(short) => router.push(addMoneyHref(short))}
    />
  );
}
