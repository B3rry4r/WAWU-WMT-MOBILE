import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { addMoneyHref } from '@/features/addmoney/entry';
import { OPEN_WALLET_PIN_PATH, useOpenWalletEntry } from '@/features/open-wallet/entry';
import { PaidThreadScreen } from '@/features/paid-ask/PaidThreadScreen';

/**
 * I4, I5 and I7 · A fan's paid questions to one creator (`/paid-thread/<the creator's WAWU ID>`). Opened from the Inbox's paid row and
 * after a question is paid. Ask a follow-up and Try again open the ask sheet (I3), whose wallet steps lead to Open your wallet (no wallet
 * yet, R-6), A9 (no PIN yet), Forgot PIN and Add money (W15, with what was missing). Signed in only.
 */
export default function PaidThreadRoute() {
  const { wawuId } = useLocalSearchParams<{ wawuId: string }>();
  const router = useRouter();
  const entry = useOpenWalletEntry();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/inbox'));
  return (
    <PaidThreadScreen
      key={String(wawuId)}
      wawuId={String(wawuId)}
      onBack={leave}
      pay={{
        onOpenWallet: entry.open,
        onSetPin: () => router.push(OPEN_WALLET_PIN_PATH),
        onForgotPin: () => router.push('/reset-pin'),
        onAddMoney: (short) => router.push(addMoneyHref(short)),
      }}
    />
  );
}
