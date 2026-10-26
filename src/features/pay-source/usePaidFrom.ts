import { useQuery } from '@tanstack/react-query';

import { api, unwrap } from '@/api/client';
import type { components } from '@/api/schema.generated';
import type { PaidFrom } from '@/components/pay-sheet';

/**
 * Which account a finished payment came from (PAY-FX, R-91), for a screen that only holds the payment's id (an enrolment, a ticket
 * order): the Hub's own record of the payment, `GET /money/payments/{id}`, whose `source` is set when another currency's account paid.
 * `from` is null for a naira payment, and until the read answers or when it cannot be read: the screen then reads as it always did.
 * `settled` says the read is over, so a receipt can hold its money row until it knows which account to name.
 */
export const paidFromKey = (paymentId: string) => ['money', 'payment', 'paid-from', paymentId] as const;

export function usePaidFrom(paymentId: string | null | undefined): { from: PaidFrom | null; settled: boolean } {
  const read = useQuery({
    queryKey: paidFromKey(paymentId ?? ''),
    queryFn: async () => {
      const body = (await unwrap(api.GET('/api/hub/money/payments/{id}', { params: { path: { id: paymentId as string } } }))) as unknown as {
        data?: components['schemas']['PaymentView'] | null;
      };
      return body?.data?.source ?? null;
    },
    enabled: Boolean(paymentId),
    staleTime: 5 * 60_000,
    retry: false,
  });
  return { from: read.data ?? null, settled: !paymentId || !read.isPending };
}
