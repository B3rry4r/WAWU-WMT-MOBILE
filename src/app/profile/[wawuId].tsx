import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { OPEN_WALLET_PIN_PATH, useOpenWalletEntry } from '@/features/open-wallet/entry';
import { VisitorProfileScreen } from '@/features/visitor/VisitorProfileScreen';

/**
 * M5, M6 and M33 · Someone else's profile (`/profile/<WAWU ID or handle>`), opened from a creator's card or row (Home, Explore,
 * Search, a work's creator, a notification) and from `wawuafrica.com/u/<handle>`. Signed in only, like every screen behind the
 * tabs. Their own profile is the Me tab, so a person who lands on theirs is sent there. The tip's wallet steps lead to Open your
 * wallet (no wallet yet, R-6), A9 (no PIN yet), Forgot PIN and the Wallet tab.
 */
export default function ProfileRoute() {
  const router = useRouter();
  const entry = useOpenWalletEntry();
  const { status } = useSession();
  const { wawuId } = useLocalSearchParams<{ wawuId: string }>();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  const id = String(wawuId);
  return (
    <VisitorProfileScreen
      wawuId={id}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      onOwn={() => router.replace('/me')}
      onOpenAllWorks={(who) => router.push({ pathname: '/works/[wawuId]', params: { wawuId: who } })}
      onOpenWork={(who, workId) => router.push({ pathname: '/works/[wawuId]/[workId]', params: { wawuId: who, workId } })}
      onOpenListing={(listingId) => router.push({ pathname: '/professionals/[id]', params: { id: listingId } })}
      onBlocked={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      pay={{
        onOpenWallet: entry.open,
        onSetPin: () => router.push(OPEN_WALLET_PIN_PATH),
        onForgotPin: () => router.push('/reset-pin'),
        onAddMoney: () => router.navigate('/wallet'),
      }}
    />
  );
}
