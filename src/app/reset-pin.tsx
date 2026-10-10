import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { OPEN_WALLET_PIN_PATH, useOpenWalletEntry } from '@/features/open-wallet/entry';
import { ResetPinScreen } from '@/features/wallet/settings/ResetPinScreen';

/**
 * W37 · Transaction PIN, reset (`/reset-pin`), then W36's two steps. Opened by "Forgot PIN?" on W36's current-PIN step and
 * on A10's "You already have a transaction PIN"; done or back, it returns to whatever opened it. From A10 (`from=open-wallet-pin`)
 * a finished reset returns to A10 with `reset=done`, so its end names the new PIN and not an earlier one that no longer
 * approves (WALLET-06 round 2, D5). No PIN yet leads to A9; no wallet to Open your wallet. Signed in only (SHARED-CHANGES
 * WALLET-06 R1).
 */
export default function ResetPinRoute() {
  const router = useRouter();
  const entry = useOpenWalletEntry();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  const back = () => (router.canGoBack() ? router.back() : router.replace('/wallet-settings'));
  return (
    <ResetPinScreen
      onBack={back}
      onDone={() => (from === 'open-wallet-pin' ? router.dismissTo({ pathname: '/open-wallet-pin', params: { reset: 'done' } }) : back())}
      onNoPin={() => router.replace(OPEN_WALLET_PIN_PATH)}
      onNoWallet={() => {
        back();
        entry.open();
      }}
    />
  );
}
