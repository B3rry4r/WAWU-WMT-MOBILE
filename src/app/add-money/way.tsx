import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';

import { useSession } from '@/api/session';
import { WayScreen } from '@/features/addmoney/WayScreen';
import { OPEN_WALLET_PIN_PATH } from '@/features/open-wallet/entry';
import { useSystemBack } from '@/features/professionals/parts';
import type { AddMoneyRail } from '@/features/addmoney/ways';

const RAILS: readonly string[] = ['card', 'apple_pay', 'ussd', 'open_banking'];

/**
 * One of the other ways to add money (`/add-money/way?rail=`): card, Apple Pay, USSD or the bank checkout (WALLET-25, WALLET-26). Signed
 * in only. A hosted page (3-D Secure, Apple Pay, the bank checkout) is opened in the browser with `expo-linking`, and the status screen
 * takes over here; the browser comes back through `wawu://add-money/status`.
 */
export default function AddMoneyWayRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { rail } = useLocalSearchParams<{ rail?: string }>();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/add-money'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (typeof rail !== 'string' || !RAILS.includes(rail)) return <Redirect href="/add-money" />;
  return (
    <WayScreen
      rail={rail as AddMoneyRail}
      onBack={leave}
      onStarted={(attempt) => {
        if (attempt.status === 'awaiting_user' && attempt.checkoutUrl) void Linking.openURL(attempt.checkoutUrl);
        router.replace({ pathname: '/add-money/status', params: { id: attempt.id } });
      }}
      onForgotPin={() => router.push('/reset-pin')}
      onSetPin={() => router.push(OPEN_WALLET_PIN_PATH)}
    />
  );
}
