import { infiniteQueryOptions } from '@tanstack/react-query';

import { api, unwrap } from '@/api/client';
import type { components, operations } from '@/api/schema.generated';

import { readRow, unreadable, type Envelope, type WalletTransaction } from './home';

/**
 * The reads behind W26, W27 and W28 (WALLET-04), all served by MONEY-15 from the ledger:
 *
 * - `GET /money/transactions` (`filter`, `q`, `group`, `cursor`, `limit`): the history, newest first, a page at a time.
 *   The cursor is the server's, opaque, sent back as given;
 * - `GET /money/transactions/summary?month=`: the month's In and Out, the server's sum of that month's completed rows
 *   (nothing is added up here);
 * - `GET /money/transactions/{id}`: one movement, with its fee parts (amount, provider charge, WAWU's fee, total).
 *
 * Every key starts with `money`, so the end of Open your wallet (which asks every `['money']` read again) reaches
 * these too, and carries the signed-in account so one account's answer is never drawn for another's.
 */
export type Transaction = WalletTransaction;
type TransactionPage = components['schemas']['TransactionPage'];
type Summary = components['schemas']['MonthlySummaryView'];
type ListQuery = NonNullable<operations['MoneyHistoryController_list']['parameters']['query']>;

/** The chips' values (W26): the contract's own list. */
export type HistoryFilter = NonNullable<ListQuery['filter']>;

/** What a list shows: a filter chip, a search and, for the rows behind a grouped row, that row's key. */
export type HistoryScope = { filter: HistoryFilter; q: string | null; group: string | null };

/** Rows asked for at a time. The contract allows 1 to 100. */
export const PAGE_SIZE = 20;

export type HistoryPage = { items: Transaction[]; nextCursor: string | null };

const statuses: readonly Transaction['status'][] = ['pending', 'completed', 'failed', 'reversed'];
const whole = (n: unknown): n is number => Number.isSafeInteger(n);

/** GET /money/transactions: one page. A body that is not a page, or a row that cannot be read, is refused, never half drawn. */
export async function fetchHistoryPage(scope: HistoryScope, cursor: string | undefined): Promise<HistoryPage> {
  const body = (await unwrap(
    api.GET('/api/hub/money/transactions', {
      params: {
        query: {
          limit: PAGE_SIZE,
          filter: scope.group ? undefined : scope.filter,
          q: scope.group ? undefined : (scope.q ?? undefined),
          group: scope.group ?? undefined,
          cursor,
        },
      },
    }),
  )) as unknown as Envelope<TransactionPage>;
  const page = body?.data;
  if (!page || !Array.isArray(page.items) || (page.nextCursor !== null && typeof page.nextCursor !== 'string')) {
    throw unreadable('transactions');
  }
  return { items: page.items.map(readRow), nextCursor: page.nextCursor };
}

/** GET /money/transactions/summary: the month's totals, in whole kobo as the server sums them. */
export async function fetchSummary(month: string): Promise<Summary> {
  const body = (await unwrap(
    api.GET('/api/hub/money/transactions/summary', { params: { query: { month } } }),
  )) as unknown as Envelope<Summary>;
  const summary = body?.data;
  if (!summary || !whole(summary.inKobo) || !whole(summary.outKobo)) throw unreadable('totals');
  return summary;
}

/** GET /money/transactions/{id}: one movement. What W27 draws is read here: a figure it cannot read is an error, never a zero. */
export async function fetchTransaction(id: string): Promise<Transaction> {
  const body = (await unwrap(
    api.GET('/api/hub/money/transactions/{id}', { params: { path: { id } } }),
  )) as unknown as Envelope<Transaction>;
  const row = readRow(body?.data);
  const fee = row.fee as Partial<Transaction['fee']> | undefined;
  if (
    !statuses.includes(row.status) ||
    !whole(row.amountKobo) ||
    !fee ||
    !whole(fee.providerFeeKobo) ||
    !whole(fee.wawuFeeKobo) ||
    typeof row.reference !== 'string' ||
    row.reference.trim() === ''
  ) {
    throw unreadable('transaction');
  }
  return row;
}

export const historyKeys = {
  list: (owner: string | null, scope: HistoryScope) =>
    ['money', 'transactions', 'history', owner ?? '', scope.filter, scope.q ?? '', scope.group ?? ''] as const,
  one: (owner: string | null, id: string) => ['money', 'transactions', 'one', owner ?? '', id] as const,
  summary: (owner: string | null, month: string) => ['money', 'transactions', 'summary', owner ?? '', month] as const,
};

/** Never fresh from the cache: a row's status moves as the bank confirms it, so each visit asks again. */
export function historyQuery(owner: string | null, scope: HistoryScope) {
  return infiniteQueryOptions({
    queryKey: historyKeys.list(owner, scope),
    queryFn: ({ pageParam }) => fetchHistoryPage(scope, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: HistoryPage) => last.nextCursor ?? undefined,
    staleTime: 0,
    enabled: Boolean(owner),
  });
}

export function summaryQuery(owner: string | null, month: string, enabled: boolean) {
  return {
    queryKey: historyKeys.summary(owner, month),
    queryFn: () => fetchSummary(month),
    staleTime: 0,
    enabled: Boolean(owner) && enabled,
  };
}

export function transactionQuery(owner: string | null, id: string) {
  return {
    queryKey: historyKeys.one(owner, id),
    queryFn: () => fetchTransaction(id),
    staleTime: 0,
    enabled: Boolean(owner),
  };
}
