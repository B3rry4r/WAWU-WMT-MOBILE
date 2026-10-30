import { useQuery } from '@tanstack/react-query';

import { queryClient } from '@/api/query';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { fetchPrices, PRICES_STALE_MS, storePriceOf } from '@/features/prices/api';

import * as iap from '../iap';

/**
 * What a buyer in the app is shown for a price on the Hub's list (R-101 point 10). In the Android and iOS apps every digital purchase is a
 * store purchase, so the price on a buy screen is the STORE's (`GET /prices?platform=` `storePriceNaira`: the list price plus the store's cut,
 * on the store's price step) and never the list price, which is the website's. The app never says buying elsewhere is cheaper.
 *
 * On the web there is no store: the list price is what the wallet charges, and it is returned as it is.
 *
 * `kobo(list)` is null while the Hub has not answered, and when no store product sells that price: a screen then draws no price (never
 * the list price in its place) and no buy button.
 */
export type ShownPrice = {
  /** This phone has a store; buying here is a store purchase. */
  native: boolean;
  /** The price a buyer sees for `listNaira`, in kobo, or null when there is none to show. */
  kobo: (listNaira: number | null | undefined) => number | null;
  /** The same, for a list price held in kobo (a creator's `dmPrice` or a piece's price). Null when it is not a whole naira price on the list, or no rung sells it. */
  forKobo: (listKobo: number | null | undefined) => number | null;
  /** The Hub has answered. */
  ready: boolean;
};

export function useShownPrice(): ShownPrice {
  const os = iap.storeOs();
  const owner = useSessionAccount(undefined);
  const prices = useQuery(
    { queryKey: ['prices', 'store', os ?? 'none'], queryFn: () => fetchPrices(os ?? undefined), staleTime: PRICES_STALE_MS, enabled: os !== null && Boolean(owner), retry: false },
    queryClient,
  );
  if (os === null) return { native: false, kobo: (list) => (list == null ? null : Math.round(list * 100)), forKobo: (list) => (list == null ? null : list), ready: true };
  const kobo = (list: number | null | undefined): number | null => {
    if (list == null) return null;
    const store = storePriceOf(prices.data, list);
    return store === null ? null : Math.round(store * 100);
  };
  return {
    native: true,
    kobo,
    forKobo: (list) => (list == null || list % 100 !== 0 ? null : kobo(list / 100)),
    ready: prices.isSuccess,
  };
}
