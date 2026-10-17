import { api, unwrap } from '@/api/client';
import type { components } from '@/api/schema.generated';
import { readRow, unreadable, type Envelope, type WalletTransaction } from '@/features/wallet/api/home';

import { LANDING_ROWS } from './model';

type TransactionPage = components['schemas']['TransactionPage'];

/**
 * GET /money/transactions, the newest rows (W15's wait, W46): the ledger the Hub writes when a bank transfer lands. Read when the wait
 * begins (the rows the person already has) and again whenever the bank's balance changes (the row that explains it). A page that is
 * not rows is refused, never read as "nothing landed".
 */
export async function fetchLatestRows(): Promise<WalletTransaction[]> {
  const body = (await unwrap(
    api.GET('/api/hub/money/transactions', { params: { query: { limit: LANDING_ROWS } } }),
  )) as unknown as Envelope<TransactionPage>;
  const items = body?.data?.items;
  if (!Array.isArray(items)) throw unreadable('transactions');
  return items.map(readRow);
}
