import type { ChipItem } from '@/components/FilterChips';

import type { InboxKind } from './api';

/**
 * The filter chips under the title. Each chip beyond All leads to a view built by another task and is
 * added there, as drawn (docs/WORKFLOW.md section 7): Paid DMs by INBOX-18, Communities by INBOX-05,
 * Money by INBOX-20. `kind` is what the chip sends to `GET /inbox` as its filter.
 */
export type InboxChip = ChipItem<string> & { kind: InboxKind | 'all' };

export const inboxChips: readonly InboxChip[] = [{ value: 'all', label: 'All', kind: 'all' }];
