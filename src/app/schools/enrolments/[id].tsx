import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { OPEN_WALLET_PIN_PATH, useOpenWalletEntry } from '@/features/open-wallet/entry';
import { useSystemBack } from '@/features/professionals/parts';
import { EnrolmentScreen } from '@/features/schools/EnrolmentScreen';

/**
 * SC5 · Pay and SC6 · PIN while a place is held, still-confirming while the Hub has a payment it has not finished, and SC7 · Enrolled
 * once paid (`/schools/enrolments/<id>`). It is opened by SC4's Continue, by a row of My courses (SC8) and by an enrolment the
 * student already has. Paying leads to Open your wallet (no wallet yet, R-6), A9 (no PIN yet), the Wallet tab (add money) and Forgot
 * PIN. My courses opens SC8. Signed in only.
 */
export default function EnrolmentRoute() {
  const router = useRouter();
  const entry = useOpenWalletEntry();
  const { status } = useSession();
  const { id } = useLocalSearchParams<{ id: string }>();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/schools'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (typeof id !== 'string' || id === '') return <Redirect href="/schools" />;

  return (
    <EnrolmentScreen
      id={id}
      onBack={leave}
      onMyCourses={() => router.dismissTo('/schools/mine')}
      onCourse={(courseId) => router.replace({ pathname: '/schools/courses/[id]', params: { id: courseId } })}
      onOpenWallet={entry.open}
      onSetPin={() => router.push(OPEN_WALLET_PIN_PATH)}
      onForgotPin={() => router.push('/reset-pin')}
      onAddMoney={() => router.dismissTo('/wallet')}
    />
  );
}
