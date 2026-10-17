import { CheckingScreen } from '@/features/open-wallet/CheckingScreen';
import { useOpenWalletWay } from '@/features/open-wallet/leave';

/** A28 · Checking your details (KYC-06): waits for the bank's decision; A8 or A29 takes its place. */
export default function OpenWalletCheckingRoute() {
  const way = useOpenWalletWay();
  return <CheckingScreen onOpened={way.opened} onRejected={way.rejected} onNeedsDocuments={way.needsDocuments} />;
}
