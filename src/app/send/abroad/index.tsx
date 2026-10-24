import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { AbroadHomeScreen } from '@/features/abroad/screens';
import { useSystemBack } from '@/features/professionals/parts';

/** Send abroad (`/send/abroad`, NUV-11): the Abroad tab of W7 and W8. Signed in only. Back goes to where it was opened from. */
export default function SendAbroadRoute() {
  const router = useRouter();
  const { status } = useSession();
  // The account the person chose to send from on the Wallet tab (WALLET-42), carried to the amount.
  const { from } = useLocalSearchParams<{ from?: string }>();
  const fromParam = typeof from === 'string' && /^[A-Z]{3}$/.test(from) ? { from } : {};
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/send'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return (
    <AbroadHomeScreen
      onBack={leave}
      onNew={() => router.push({ pathname: '/send/abroad/new', params: fromParam })}
      onPick={(r) =>
        router.push({
          pathname: '/send/abroad/amount',
          params: { recipientId: r.id, ...fromParam },
        })
      }
    />
  );
}
