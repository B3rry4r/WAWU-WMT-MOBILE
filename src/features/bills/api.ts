import type { Query } from '@tanstack/react-query';

import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import type { components } from '@/api/schema.generated';

/**
 * S2 to S4, S10 and S13's calls, as the Hub's contract types them (BILLS-01, served on Fintava's bills service):
 * - `GET /bills/electricity/billers`: every electricity company Fintava lists as available, one row per company and plan,
 *   each with its own minimum and maximum in kobo and the quick amounts that fit them. `available: false` is S13;
 * - `POST /bills/electricity/meter-preview`: the name and address on a meter. `422 meter_not_found` is S10;
 *   `502 meter_unconfirmed` is an answer the Hub could not use (S4 says so, never green); `503 bills_unavailable` is S13
 *   again; `503 provider_unreachable` and `429 bills_rate_limited` are a try-again.
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data` (SHARED-CHANGES.md row 11),
 * so each call reads `data` itself. The app never talks to the bills provider.
 */
export type ElectricityBiller = components['schemas']['ElectricityBillerView'];
export type ElectricityBillers = components['schemas']['ElectricityBillersView'];
export type MeterPreview = components['schemas']['MeterPreviewView'];

type Envelope<T> = { data?: T | null };

export const billsKeys = {
  all: ['bills'] as const,
  electricity: ['bills', 'electricity', 'billers'] as const,
  meter: (code: string, meterNumber: string) => ['bills', 'electricity', 'meter', code, meterNumber] as const,
};

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

const isText = (value: unknown): value is string => typeof value === 'string';
const isWhole = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value);

function readBiller(raw: unknown): ElectricityBiller | null {
  const b = raw as Partial<ElectricityBiller> | null;
  if (!b || typeof b !== 'object' || !isText(b.code) || !isText(b.name)) return null;
  if (b.plan !== 'prepaid' && b.plan !== 'postpaid') return null;
  if (!isWhole(b.minimumKobo) || !isWhole(b.maximumKobo) || !Array.isArray(b.presets)) return null;
  if (!b.presets.every((p) => !!p && typeof p === 'object' && isWhole((p as { amountKobo?: unknown }).amountKobo))) return null;
  return b as ElectricityBiller;
}

/** The electricity companies Fintava lists, for S2 (is any available) and S3. */
export async function fetchElectricityBillers(): Promise<ElectricityBillers> {
  const body = (await unwrap(api.GET('/api/hub/bills/electricity/billers'))) as unknown as Envelope<Partial<ElectricityBillers>>;
  const data = body?.data;
  if (!data || typeof data !== 'object' || typeof data.available !== 'boolean' || !Array.isArray(data.billers)) throw unreadable('electricity companies');
  const billers = data.billers.map(readBiller);
  if (billers.some((b) => b === null)) throw unreadable('electricity companies');
  return { available: data.available, billers: billers as ElectricityBiller[] };
}

/** What the list's cache holds: the Hub's answer, or "not available" with `held` once a meter check found bills off. */
export type ElectricityBillersState = ElectricityBillers & { held?: true };

/**
 * How every screen reads the electricity list (S2, S3 and S4 share one cache entry). A list a meter check held as "not
 * available" is never stale: no screen's mount, reconnect or focus refreshes it, so S13 stays until the person pulls to
 * refresh on S2 (R2-U1). Any other list is stale after the app's usual time.
 */
export const electricityBillersQuery = {
  queryKey: billsKeys.electricity,
  queryFn: (): Promise<ElectricityBillersState> => fetchElectricityBillers(),
  staleTime: (query: Query<ElectricityBillersState>): number => {
    if (query.state.data?.held) return Infinity;
    const usual = queryClient.getDefaultOptions().queries?.staleTime;
    return typeof usual === 'number' ? usual : 0;
  },
};

/**
 * A meter check found Fintava's bills service off while its company list still answers: S2 draws S13 and keeps drawing it
 * until the person pulls to refresh (R2-U1). The Hub holds "off" for its own cache window, so the app does not ask the
 * list again at once either. A fetch of the list that is already out is cancelled, so its late answer cannot undo the hold
 * (R3-4).
 */
export function holdBillsOff(): void {
  // A list fetch already out must not undo the hold when it answers (R3-4): the fetch is cancelled first, so a late
  // `available: true` is dropped and the hold is what the cache keeps.
  void queryClient.cancelQueries({ queryKey: billsKeys.electricity });
  queryClient.setQueryData<ElectricityBillersState>(billsKeys.electricity, { available: false, billers: [], held: true });
}

/** The name and address on a meter, for S4. A meter Fintava does not know rejects with code `meter_not_found` (S10). */
export async function previewMeter(code: string, meterNumber: string): Promise<MeterPreview> {
  const body = (await unwrap(
    api.POST('/api/hub/bills/electricity/meter-preview', { body: { code, meterNumber } }),
  )) as unknown as Envelope<MeterPreview>;
  const data = body?.data;
  if (!data || typeof data !== 'object' || !isText(data.meterNumber) || !isText(data.code)) throw unreadable('meter');
  if (data.address !== null && !isText(data.address)) throw unreadable('meter');
  // A found meter has a name (D2). An answer without one is not a meter found: the Hub never sends it, and an older one's
  // is read as a meter that could not be confirmed, never drawn as found.
  if (!isText(data.name) || data.name.trim() === '') throw new ApiError('unknown', 200, 'This meter could not be confirmed. Try again.', billsCodes.meterUnconfirmed);
  return data;
}

/** The reason codes the two routes answer with, as `ApiError.code`. */
export const billsCodes = {
  meterNotFound: 'meter_not_found',
  meterUnconfirmed: 'meter_unconfirmed',
  billerNotFound: 'biller_not_found',
  unavailable: 'bills_unavailable',
  unreachable: 'provider_unreachable',
  rateLimited: 'bills_rate_limited',
} as const;
