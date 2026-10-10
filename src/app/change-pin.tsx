import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { OPEN_WALLET_PIN_PATH, useOpenWalletEntry } from '@/features/open-wallet/entry';
import { ChangePinScreen } from '@/features/wallet/settings/ChangePinScreen';

/**
 * W36 · Change the transaction PIN (`/change-pin`), pushed on top of W35. Done, it goes back to W35, which reads the
 * wallet again. "Forgot PIN?" replaces it with W37 (`/reset-pin`), so a finished reset lands on W35 too. No PIN yet
 * leads to A9; no wallet to Open your wallet. Signed in only (SHARED-CHANGES WALLET-06 #2).
 */
export default function ChangePinRoute() {
  const router = useRouter();
  const entry = useOpenWalletEntry();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  const back = () => (router.canGoBack() ? router.back() : router.replace('/wallet-settings'));
  return (
    <ChangePinScreen
      onBack={back}
      onChanged={back}
      onForgotPin={() => router.replace('/reset-pin')}
      onNoPin={() => router.replace(OPEN_WALLET_PIN_PATH)}
      onNoWallet={() => {
        back();
        entry.open();
      }}
    />
  );
}
