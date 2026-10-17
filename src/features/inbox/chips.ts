import type { ChipItem } from '@/components/FilterChips';

import type { InboxKind } from './api';

/**
 * The filter chips under the title. Each chip beyond All leads to a view built by another task and is
 * added there, as drawn (docs/WORKFLOW.md section 7): Communities by INBOX-05, Money by INBOX-20, and Paid DMs
 * by INBOX-18, which is a creator's (`withPaidChip`). `kind` is what the chip sends to `GET /inbox` as its filter.
 */
export type InboxChip = ChipItem<string> & { kind: InboxKind | 'all' };

export const inboxChips: readonly InboxChip[] = [
  { value: 'all', label: 'All', kind: 'all' },
  { value: 'communities', label: 'Communities', kind: 'community' },
  { value: 'money', label: 'Money', kind: 'money_request' },
];

/** The chip that opens I24, the communities view (INBOX-05). */
export const communitiesChip = 'communities';

/** The chip that opens I9, a creator's waiting questions (INBOX-18). */
export const paidChip = 'paid';

/**
 * The chips a person sees: a creator's has Paid DMs after All, counting the questions waiting on a reply ("Paid DMs · 3", the Hub's
 * count), and everyone else's is the list above. Nobody but a creator is asked a paid question, so nobody else is shown the chip (R-47).
 */
export function withPaidChip(chips: readonly InboxChip[], creator: boolean, waiting: number | undefined): readonly InboxChip[] {
  if (!creator) return chips;
  const label = waiting && waiting > 0 ? `Paid DMs · ${waiting}` : 'Paid DMs';
  const [first, ...rest] = chips;
  return first ? [first, { value: paidChip, label, kind: 'paid_dm' }, ...rest] : chips;
}
