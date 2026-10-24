import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { NewRecipientScreen } from '@/features/abroad/screens';
import { useSystemBack } from '@/features/professionals/parts';

/** Send abroad · a new recipient (`/send/abroad/new`, NUV-11). Saving goes on to the amount. */
export default function SendAbroadNewRoute() {
  const router = useRouter();
  const { status } = useSession();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/send/abroad'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return (
    <NewRecipientScreen
      onBack={leave}
      onSaved={(r) =>
        router.replace({
          pathname: '/send/abroad/amount',
          params: { recipientId: r.id },
        })
      }
    />
  );
}
