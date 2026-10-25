import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * The calls behind a fixed-price request (S24, S26; LEGAL-06, R2-LEGAL2):
 * - `GET /legal/assistant/{id}`: the conversation, whose `fixedPrice` is the service and the price WAWU set in admin (R-14);
 * - `GET /money/fees/quote?kind=purchase&amountKobo=`: what the bank charges on that price, before anything exists to pay;
 * - `POST /legal/assistant/{id}/start` (in `../api`): starts the request. It is quoted at the fixed price, the letter is signed on the matter (S21) and the fee paid (S22).
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data` (SHARED-CHANGES.md row 11).
 */
export type FeeQuote = components['schemas']['FeeQuoteView'];

type Envelope<T> = { data?: T | null };

export const fixedKeys = {
  thread: (id: string) => ['legal', 'fixed-thread', id] as const,
  fee: (kobo: number) => ['legal', 'fixed-fee', kobo] as const,
};

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

/** The fee on a purchase of this size. Rejects when the Hub has no figure (`fees_not_set`): the screen then draws no bank charge. */
export async function fetchPurchaseFee(amountKobo: number): Promise<FeeQuote> {
  const body = (await unwrap(
    api.GET('/api/hub/money/fees/quote', { params: { query: { kind: 'purchase', amountKobo } } }),
  )) as unknown as Envelope<FeeQuote>;
  const q = body?.data;
  if (!q || typeof q.totalKobo !== 'number' || !q.fee || typeof q.fee.providerFeeKobo !== 'number' || typeof q.fee.wawuFeeKobo !== 'number') throw unreadable('fee');
  return q;
}
