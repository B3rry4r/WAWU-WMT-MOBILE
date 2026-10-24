import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { AbroadAmountScreen } from '@/features/abroad/screens';
import { useSystemBack } from '@/features/professionals/parts';

/** Send abroad · the amount and the quote (`/send/abroad/amount?recipientId=`, NUV-11). */
export default function SendAbroadAmountRoute() {
  const router = useRouter();
  const { status } = useSession();
  const params = useLocalSearchParams<{ recipientId?: string }>();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/send/abroad'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (typeof params.recipientId !== 'string' || params.recipientId === '') return <Redirect href="/send/abroad" />;
  return (
    <AbroadAmountScreen
      recipientId={params.recipientId}
      onBack={leave}
      onContinue={(quote) =>
        router.push({
          pathname: '/send/abroad/review',
          params: { quote: JSON.stringify(quote) },
        })
      }
    />
  );
}
