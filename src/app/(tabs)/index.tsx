import { useRouter } from 'expo-router';

import { addMoneyHref } from '@/features/addmoney/entry';
import { OPEN_WALLET_PIN_PATH, useOpenWalletEntry } from '@/features/open-wallet/entry';
import { HomeScreen } from '@/features/home/HomeScreen';
import { useClaimPendingReferral } from '@/features/referral/pendingCode';

/**
 * The Home tab: Today (H1, H11, H36), and the Following and For you feed under the same tab row (HOME-01). A creator account
 * also sees the Create button, which opens M19 (ME-04, R-38). Its search buttons open Search (X5) and Today's creators' See all
 * opens All creators (X4), both EXPLORE-02's. A code kept from a `wawu/r/<code>` link is claimed here once the person is signed
 * in, with nothing drawn for it (REF-03, G-812). The feed's wallet payments (a tip from the rail, HOME-13) lead to
 * Open your wallet (no wallet yet, R-6), A9 (no PIN yet), Forgot PIN and Add money (W15, with what was missing). A post's caption opens that
 * piece's own page (H19, HOME-03), and so does a piece in a creator card's strip (H9); a professional card's Profile opens their page (P2).
 * An empty Following has "Find people to follow" (H12), which opens All creators (X4).
 */
export default function HomeTab() {
  const router = useRouter();
  const entry = useOpenWalletEntry();
  useClaimPendingReferral();
  return (
    <HomeScreen
      onCreate={() => router.push('/create')}
      pay={{
        onOpenWallet: entry.open,
        onSetPin: () => router.push(OPEN_WALLET_PIN_PATH),
        onForgotPin: () => router.push('/reset-pin'),
        onAddMoney: (short) => router.push(addMoneyHref(short)),
      }}
      onSearch={() => router.push('/search')}
      onSeeAllCreators={() => router.push('/creators')}
      onOpenCreator={(id) => router.push({ pathname: '/profile/[wawuId]', params: { wawuId: id } })}
      onOpenProfessional={(id) => router.push({ pathname: '/professionals/[id]', params: { id } })}
      onOpenPiece={(item) => router.push({ pathname: '/content/[id]', params: { id: item.id } })}
    />
  );
}
