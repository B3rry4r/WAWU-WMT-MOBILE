import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

import { readRequest, type LegalRequest } from '../matter/api';

/**
 * The calls behind a fixed-price request (S24, S26; LEGAL-06):
 * - `GET /legal/catalogue`: the services and, for a fixed-price one, the price WAWU set in admin (R-14);
 * - `GET /money/fees/quote?kind=purchase&amountKobo=`: what the bank charges on that price, before anything exists to pay;
 * - `POST /legal/requests`: starts the request. It is quoted at the fixed price, the letter is signed on the matter (S21) and the fee paid (S22).
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data` (SHARED-CHANGES.md row 11).
 */
export type CatalogueService = components['schemas']['LegalService'];
export type FeeQuote = components['schemas']['FeeQuoteView'];

type Envelope<T> = { data?: T | null };

export const fixedKeys = {
  catalogue: ['legal', 'catalogue'] as const,
  fee: (kobo: number) => ['legal', 'fixed-fee', kobo] as const,
};

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

export async function fetchServices(): Promise<CatalogueService[]> {
  const body = (await unwrap(api.GET('/api/hub/legal/catalogue'))) as unknown as Envelope<{ services?: CatalogueService[] }>;
  const services = body?.data?.services;
  if (!Array.isArray(services)) throw unreadable('services');
  return services;
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

/** Starts the request for a fixed-price service with the first name choice the person typed. Answers the matter. */
export async function startRequest(serviceCode: string, details: Record<string, string>): Promise<LegalRequest> {
  const body = (await unwrap(api.POST('/api/hub/legal/requests', { body: { serviceCode, details } }))) as unknown as Envelope<LegalRequest>;
  return readRequest(body?.data);
}
