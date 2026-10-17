import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useSystemBack } from '@/features/professionals/parts';
import { BankRecipientScreen } from '@/features/send/BankRecipientScreen';
import { payeeParams } from '@/features/send/model';

/**
 * W8 · Send · to a bank account (`/send/bank`), the Bank account tab of W7. Signed in only. Back goes to where it was opened from; the
 * other tab replaces this screen with W7, so the two tabs never pile up. A bank, a number and an amount may ride in the params (Try
 * again after W14 starts here with the account and the amount it had).
 */
export default function SendBankRoute() {
  const router = useRouter();
  const { status } = useSession();
  const params = useLocalSearchParams<{ bankCode?: string; bankName?: string; accountNumber?: string; amount?: string }>();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/wallet'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  const start =
    typeof params.bankCode === 'string' && typeof params.bankName === 'string' && typeof params.accountNumber === 'string'
      ? { bankCode: params.bankCode, bankName: params.bankName, accountNumber: params.accountNumber }
      : undefined;
  const amount = typeof params.amount === 'string' && /^[0-9]+$/.test(params.amount) ? params.amount : undefined;
  return (
    <BankRecipientScreen
      onBack={leave}
      onWawuUser={() => router.replace('/send')}
      initial={start}
      onPick={(payee) => router.push({ pathname: '/send/amount', params: { ...payeeParams(payee), ...(amount ? { amount } : {}) } })}
    />
  );
}
