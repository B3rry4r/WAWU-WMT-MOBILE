import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { ContentDetailScreen } from '@/features/content-detail/ContentDetailScreen';
import { OPEN_WALLET_PIN_PATH, useOpenWalletEntry } from '@/features/open-wallet/entry';

/**
 * H19 to H25 · A piece's own page (`/content/<id>`), opened from the feed's caption, a content result on Search (X6) and the
 * page's own link. Signed in only, like every screen behind the tabs (Follow, Like, Save, Rate and the wallet are a signed-in
 * person's). Its wallet payments (an unlock, a tip) lead to Open your wallet (no wallet yet, R-6), A9 (no PIN yet), Forgot PIN
 * and the Wallet tab (add money).
 */
export default function ContentRoute() {
  const router = useRouter();
  const entry = useOpenWalletEntry();
  const { status } = useSession();
  const { id } = useLocalSearchParams<{ id: string }>();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return (
    <ContentDetailScreen
      id={String(id)}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      onOpenCourse={(courseId) => router.push({ pathname: '/content/[id]', params: { id: courseId } })}
      onEditLessons={(courseId) => router.push({ pathname: '/library/[id]/lessons', params: { id: courseId } })}
      pay={{
        onOpenWallet: entry.open,
        onSetPin: () => router.push(OPEN_WALLET_PIN_PATH),
        onForgotPin: () => router.push('/reset-pin'),
        onAddMoney: () => router.navigate('/wallet'),
      }}
    />
  );
}
