import { Redirect, useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { addMoneyHref } from '@/features/addmoney/entry';
import { OPEN_WALLET_PIN_PATH, useOpenWalletEntry } from '@/features/open-wallet/entry';
import { paidThreadHref } from '@/features/paid-ask/routes';
import { ProfileScreen } from '@/features/professionals/ProfileScreen';
import { useSystemBack } from '@/features/professionals/parts';

/**
 * P2 · Profile and P3 · Not taking messages (`/professionals/<id>`). Opened from P1; on its own, back goes to P1. "Ask a question"
 * opens the paid question (I3); its wallet steps lead to Open your wallet (no wallet yet, R-6), A9 (no PIN yet), Forgot PIN and Add
 * money, and a paid question opens its thread (I4), the same as on a creator's profile.
 */
export default function ProfessionalRoute() {
  const router = useRouter();
  const entry = useOpenWalletEntry();
  const focused = useIsFocused();
  const { status } = useSession();
  const { id } = useLocalSearchParams<{ id: string }>();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/professionals'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (typeof id !== 'string' || id === '') return <Redirect href="/professionals" />;

  return (
    <ProfileScreen
      id={id}
      onBack={leave}
      pay={{
        onOpenWallet: entry.open,
        onSetPin: () => router.push(OPEN_WALLET_PIN_PATH),
        onForgotPin: () => router.push('/reset-pin'),
        onAddMoney: (short) => router.push(addMoneyHref(short)),
      }}
      onOpenPaidThread={(who) => router.push(paidThreadHref(who))}
      focused={focused}
    />
  );
}
