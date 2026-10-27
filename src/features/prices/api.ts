import { useQuery, type QueryClient } from '@tanstack/react-query';

import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * `GET /prices` (PRICE-LIST, R-101): the prices a person may set, and the six tips. The Hub's success body is
 * `{ statusCode, message, data }` and the contract types only `data`, so the call reads it.
 *
 * A list price may carry `storePriceNaira`, what a buyer pays in the store for it. The Hub does not serve it yet; when it does, the
 * picker's store note appears for that price and for no other (R-47: drawn only when built).
 */
export const pricesKey = ['prices'] as const;

type Wire = components['schemas']['PriceListItem'];
export type PriceItem = { priceNaira: number; priceKobo: number; storePriceNaira: number | null };
export type Prices = { prices: PriceItem[]; tips: PriceItem[] };

const unreadable = (): ApiError => new ApiError('unknown', 200, 'The prices could not be read. Try again.');

function itemsOf(value: unknown): PriceItem[] {
  if (!Array.isArray(value)) throw unreadable();
  return value.map((raw) => {
    const item = raw as Partial<Wire> & { storePriceNaira?: unknown };
    if (!Number.isSafeInteger(item?.priceNaira) || !Number.isSafeInteger(item?.priceKobo)) throw unreadable();
    const store = item.storePriceNaira;
    return {
      priceNaira: item.priceNaira as number,
      priceKobo: item.priceKobo as number,
      storePriceNaira: typeof store === 'number' && Number.isFinite(store) && store > 0 ? store : null,
    };
  });
}

export async function fetchPrices(): Promise<Prices> {
  const body = await unwrap(api.GET('/api/hub/prices'));
  const data = (body as { data?: { prices?: unknown; tips?: unknown } } | undefined)?.data;
  if (!data || typeof data !== 'object') throw unreadable();
  const out = { prices: itemsOf(data.prices), tips: itemsOf(data.tips) };
  if (out.prices.length === 0) throw unreadable();
  return out;
}

/** How long a read list is trusted: the admin changes it rarely, and a refused price refetches it at once. */
export const PRICES_STALE_MS = 5 * 60 * 1000;

export const pricesQuery = { queryKey: pricesKey, queryFn: fetchPrices, staleTime: PRICES_STALE_MS } as const;
export const usePrices = () => useQuery(pricesQuery);

/** The list prices in naira, in the Hub's order (ascending), or an empty list before the Hub has answered. */
export const listOf = (prices: Prices | undefined): number[] => (prices ? prices.prices.map((p) => p.priceNaira) : []);

/** The store price the Hub gave for a list price, or null (today it gives none). */
export const storePriceOf = (prices: Prices | undefined, naira: number | null): number | null =>
  prices?.prices.find((p) => p.priceNaira === naira)?.storePriceNaira ?? null;

/** The Hub's reason code for a price that is not on its list (`400 price_not_on_list`). */
export const PRICE_NOT_ON_LIST = 'price_not_on_list';
export const isNotOnList = (error: unknown): boolean => error instanceof ApiError && error.code === PRICE_NOT_ON_LIST;

/**
 * A price the Hub refused as not on its list means an admin changed the list since this screen read it: read it again, so the picker
 * shows the list as it is now. The screen shows the Hub's own sentence (`error.message`), which names the nearest prices.
 */
export function refetchIfNotOnList(client: QueryClient, error: unknown): void {
  if (isNotOnList(error)) void client.invalidateQueries({ queryKey: pricesKey });
}
