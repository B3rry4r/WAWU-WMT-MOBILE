import { useOpenWalletWay } from '@/features/open-wallet/leave';
import { RejectedScreen } from '@/features/open-wallet/RejectedScreen';

/** A29 · Rejected (KYC-06): the bank's reasons and what to fix. Upload again goes to A26 or A27. */
export default function OpenWalletRejectedRoute() {
  const way = useOpenWalletWay();
  return <RejectedScreen onUploadAgain={way.uploadAgain} onLeave={way.leave} onOpened={way.opened} onChecking={way.checking} />;
}
