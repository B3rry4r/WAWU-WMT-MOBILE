import { useQueries, useQuery, type QueryClient } from '@tanstack/react-query';

import { api, unwrap } from '@/api/client';
import type { components } from '@/api/schema.generated';
import type { PaidFrom } from '@/components/pay-sheet';

/**
 * Which account a finished payment came from (PAY-FX, R-91), for a screen that only holds the payment's id (an enrolment, a ticket
 * order, a paid question): the Hub's own record of the payment, `GET /money/payments/{id}`, whose `source` is set when another currency's
 * account paid. The wallet reads of those things (`GET /dm/send/wallet/{id}` and the like) carry the payment but NOT its `source`, so a
 * screen never reads the account from them.
 * `from` is null for a naira payment, and until the read answers or when it cannot be read: the screen then reads as it always did.
 * `settled` says the read is over, so a receipt can hold its money row until it knows which account to name.
 */
export const paidFromKey = (paymentId: string) => ['money', 'payment', 'paid-from', paymentId] as const;

export async function fetchPaidFrom(paymentId: string): Promise<PaidFrom | null> {
  const body = (await unwrap(api.GET('/api/hub/money/payments/{id}', { params: { path: { id: paymentId } } }))) as unknown as {
    data?: components['schemas']['PaymentView'] | null;
  };
  return body?.data?.source ?? null;
}

/** One read per payment, kept five minutes: the same key serves every screen that asks about the same payment. */
const paidFromQuery = (paymentId: string | null | undefined) => ({
  queryKey: paidFromKey(paymentId ?? ''),
  queryFn: () => fetchPaidFrom(paymentId as string),
  enabled: Boolean(paymentId),
  staleTime: 5 * 60_000,
  retry: false,
});

export type PaidFromRead = { from: PaidFrom | null; settled: boolean };

export function usePaidFrom(paymentId: string | null | undefined): PaidFromRead {
  const read = useQuery(paidFromQuery(paymentId));
  return { from: read.data ?? null, settled: !paymentId || !read.isPending };
}

type Read = { data?: PaidFrom | null; isPending: boolean };
const combineReads = (results: Read[]): PaidFromRead[] => results.map((r) => ({ from: r.data ?? null, settled: !r.isPending }));

/**
 * `usePaidFrom` for a list: one read per payment id (a thread of paid questions), in the order of `paymentIds`. An entry that is null
 * or undefined (no payment yet) makes no call and is `settled` with no account.
 */
export function usePaidFromMany(paymentIds: readonly (string | null | undefined)[], client?: QueryClient): PaidFromRead[] {
  return useQueries(
    {
      queries: paymentIds.map(paidFromQuery),
      combine: (results) => combineReads(results.map((r, i) => (paymentIds[i] ? r : { data: null, isPending: false }))),
    },
    client,
  );
}
