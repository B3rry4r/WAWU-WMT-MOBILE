import { SegmentedTabs, type SegmentItem } from '@/components/SegmentedTabs';
import { unbuilt } from '@/lib/unbuilt';

/** wallet.js line 41: `Seg(['Naira', 'Dollar', 'Crypto'], 0)`. */
type Account = 'naira' | 'dollar' | 'crypto';
const ACCOUNTS: readonly SegmentItem<Account>[] = [
  { value: 'naira', label: 'Naira' },
  { value: 'dollar', label: 'Dollar' },
  { value: 'crypto', label: 'Crypto' },
];

/**
 * The account tabs on W1, W5 and W6 (and their loading shape on W4): Naira is the account this screen shows,
 * so it stays selected. The Dollar account (W2) and Crypto (W3) are WALLET-21's: those tabs are drawn and
 * tapping one does nothing, the selection included (R-46; BRIEF "Not built at launch").
 */
export function AccountTabs() {
  return <SegmentedTabs testID="wallet-tabs" label="Account" items={ACCOUNTS} value="naira" onChange={unbuilt('WALLET-21')} />;
}
