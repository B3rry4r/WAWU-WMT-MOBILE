import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { AbroadHomeScreen } from '@/features/abroad/screens';
import { useSystemBack } from '@/features/professionals/parts';

/** Send abroad (`/send/abroad`, NUV-11): the Abroad tab of W7 and W8. Signed in only. Back goes to where it was opened from. */
export default function SendAbroadRoute() {
  const router = useRouter();
  const { status } = useSession();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/send'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return (
    <AbroadHomeScreen
      onBack={leave}
      onNew={() => router.push('/send/abroad/new')}
      onPick={(r) =>
        router.push({
          pathname: '/send/abroad/amount',
          params: { recipientId: r.id },
        })
      }
    />
  );
}
