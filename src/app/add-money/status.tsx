import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';

import { useSession } from '@/api/session';
import { StatusScreen } from '@/features/addmoney/StatusScreen';
import { useSystemBack } from '@/features/professionals/parts';

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Where an add-money attempt stands (`/add-money/status?id=`), the screen a hosted page and the USSD prompt come back to
 * (`wawu://add-money/status?id=`). Signed in only; an id that is not an attempt's goes to Add money.
 */
export default function AddMoneyStatusRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const done = () => router.dismissTo('/wallet');
  useSystemBack(done);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (typeof id !== 'string' || !ID.test(id)) return <Redirect href="/add-money" />;
  return (
    <StatusScreen
      id={id}
      onBack={done}
      onDone={done}
      onTryAgain={(rail) => router.replace({ pathname: '/add-money/way', params: { rail } })}
      onOpenPage={(url) => void Linking.openURL(url)}
    />
  );
}
