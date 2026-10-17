import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useSystemBack } from '@/features/professionals/parts';
import { FailedScreen } from '@/features/send/FailedScreen';

/**
 * W14 · Send · failed (`/send/failed?id=`): a transfer to a bank account the bank did not take. Done, and Android's back button, return
 * to the Wallet tab. Try again starts the same account again from W8, with its bank, its number and its amount (a new name check, a new
 * quote and a new key: the failed send is never sent again as it was).
 */
export default function SendFailedRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { id } = useLocalSearchParams<{ id: string }>();
  const done = () => router.dismissTo('/wallet');
  useSystemBack(done);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (typeof id !== 'string' || id === '') return <Redirect href="/wallet" />;
  return (
    <FailedScreen
      id={id}
      onDone={done}
      onReceipt={(transferId) => router.replace({ pathname: '/send/receipt', params: { id: transferId } })}
      onTryAgain={(transfer) => {
        const account = transfer.toBankAccount;
        if (!account) {
          router.replace('/send/bank');
          return;
        }
        router.replace({
          pathname: '/send/bank',
          params: { bankCode: account.bankCode, bankName: account.bankName, accountNumber: account.accountNumber, amount: String(transfer.amountKobo) },
        });
      }}
    />
  );
}
