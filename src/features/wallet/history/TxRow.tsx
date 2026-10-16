import { Avatar } from '@/components/Avatar';
import { TransactionRow } from '@/components/TransactionRow';

import type { RowLead } from './model';

export type TxRowProps = {
  title: string;
  subtitle?: string;
  /** Kobo, negative when money left. */
  amountKobo: number;
  /** The end line: "10:24", or "Pending · 10:24". */
  meta: string;
  lead: RowLead;
  /** Opens the movement's detail (W27). */
  onPress?: () => void;
  testID?: string;
};

/**
 * One movement as the Wallet tab (W1) and the history (W26) draw it: the shared `TransactionRow` with the lead the model
 * chose, a person's avatar or an icon on a tinted circle. One home for it, so the two screens never draw a row differently.
 */
export function TxRow({ title, subtitle, amountKobo, meta, lead, onPress, testID }: TxRowProps) {
  return (
    <TransactionRow
      testID={testID}
      title={title}
      subtitle={subtitle}
      amountMinor={amountKobo}
      time={meta}
      lead={lead.kind === 'avatar' ? <Avatar name={lead.name} hue={lead.hue} source={lead.source} decorative /> : undefined}
      icon={lead.kind === 'icon' ? lead.icon : undefined}
      tone={lead.kind === 'icon' ? lead.tone : undefined}
      onPress={onPress}
    />
  );
}
