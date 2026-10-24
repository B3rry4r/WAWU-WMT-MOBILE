import { useOpenWalletWay } from '@/features/open-wallet/leave';
import { RejectedScreen } from '@/features/open-wallet/RejectedScreen';

/** A29 · Rejected (KYC-06): the bank's reasons and what to fix. Upload again goes to A26 or A27, or to the step that collects the details when nothing holds them. */
export default function OpenWalletRejectedRoute() {
  const way = useOpenWalletWay();
  return <RejectedScreen onUploadAgain={(to) => (to === 'details' ? way.details() : way.uploadAgain(to))} onLeave={way.leave} onOpened={way.opened} onChecking={way.checking} />;
}
