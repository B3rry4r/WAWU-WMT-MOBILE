import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';

import { fetchCatalog, type StoreCatalog, type StoreKind, type StorePurchaseView } from './api';
import { purchase, recover, type BuyOptions, type PurchaseResult } from './buy';
import * as iap from './iap';
import { restoredLine, type StoreItem, type StoreState } from './model';
import { said, type Said } from './words';

/**
 * The store's side of a buy screen (IAP-02, R-86). `useStoreCatalog` asks the Hub what is on sale in this phone's store and the store for
 * its own price of each, so a product is drawn only when both have it; `useStoreBuyer` carries one purchase at a time and finishes any the
 * store still holds. Both are for the phone: on the web they report that buying happens in the app.
 */
type Loaded = { catalog: StoreCatalog; items: StoreItem[]; storeFailed: boolean };

async function load(os: 'android' | 'ios'): Promise<Loaded> {
  const catalog = await fetchCatalog(os);
  if (!catalog.available || catalog.products.length === 0) return { catalog, items: [], storeFailed: false };
  try {
    const prices = await iap.fetchPrices({
      packs: catalog.products.filter((p) => !p.subscription).map((p) => p.storeProductId),
      subscriptions: catalog.products.filter((p) => p.subscription).map((p) => p.storeProductId),
    });
    const items = catalog.products.flatMap((product) => {
      const price = prices.get(product.storeProductId);
      return price ? [{ product, price: price.price, offerToken: price.offerToken }] : [];
    });
    return { catalog, items, storeFailed: false };
  } catch {
    return { catalog, items: [], storeFailed: true };
  }
}

export type StoreCatalogResult = {
  state: StoreState;
  /** The Hub's whole catalog for this store (for Restore purchases and recovery), whatever the store priced. */
  catalog: StoreCatalog | null;
  refetch: () => void;
  os: 'android' | 'ios' | null;
};

/** The items of the given kinds the Hub sells and the store prices, in the Hub's order. */
export function useStoreCatalog(kinds: readonly StoreKind[]): StoreCatalogResult {
  const owner = useSessionAccount(undefined);
  const os = iap.storeOs();
  const query = useQuery(
    {
      queryKey: ['store', 'catalog', os ?? 'none', owner ?? ''],
      queryFn: () => load(os as 'android' | 'ios'),
      enabled: os !== null && Boolean(owner),
      staleTime: 0,
      retry: false,
    },
    queryClient,
  );
  const refetch = useCallback(() => void query.refetch(), [query]);
  if (os === null) return { state: { kind: 'store_unavailable', web: true }, catalog: null, refetch, os };
  if (query.isError && !query.data) {
    return { state: { kind: 'error', message: isApiError(query.error) && query.error.message ? query.error.message : 'Check your connection and try again.' }, catalog: null, refetch, os };
  }
  const data = query.data;
  if (!data) return { state: { kind: 'loading' }, catalog: null, refetch, os };
  if (!data.catalog.available) return { state: { kind: 'not_open', why: data.catalog.reason === 'store_disabled' ? 'disabled' : 'not_configured' }, catalog: data.catalog, refetch, os };
  if (data.storeFailed) return { state: { kind: 'store_unavailable', web: false }, catalog: data.catalog, refetch, os };
  return { state: { kind: 'ready', items: data.items.filter((i) => kinds.includes(i.product.kind)) }, catalog: data.catalog, refetch, os };
}

/** Everything a grant can change on screen reads the Hub again (the points, the credits, the tier, the rooms). The catalog itself is left alone. */
function refreshAfterGrant(): void {
  void queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'store' });
}

export type StoreBuyer = {
  /** A purchase is on its way: the store sheet is open, or the Hub is being asked. */
  busy: boolean;
  /** How the last buy came to a stop that was not a grant, in words. */
  said: Said | null;
  /** The last grant. */
  granted: StorePurchaseView | null;
  /** Earlier purchases the store held and the Hub has now granted (finished when the screen opened). */
  recovered: StorePurchaseView[];
  restoring: boolean;
  restoreLine: string | null;
  buy: (item: StoreItem, options?: Pick<BuyOptions, 'communityId' | 'replace'>) => Promise<PurchaseResult | null>;
  restore: () => Promise<void>;
  clear: () => void;
};

/**
 * One purchase at a time. On opening, whatever the store still holds that the Hub was not given (a payment taken before the app was closed,
 * a slow payment that has since cleared) is handed over and finished, so nothing paid for is lost.
 */
export function useStoreBuyer(catalog: StoreCatalog | null): StoreBuyer {
  const owner = useSessionAccount(undefined);
  const os = iap.storeOs();
  const [busy, setBusy] = useState(false);
  const [line, setLine] = useState<Said | null>(null);
  const [granted, setGranted] = useState<StorePurchaseView | null>(null);
  const [recovered, setRecovered] = useState<StorePurchaseView[]>([]);
  const [restoring, setRestoring] = useState(false);
  const [restoreLine, setRestoreLine] = useState<string | null>(null);
  const running = useRef(false);
  const recovering = useRef<string | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const products = catalog?.available ? catalog.products : null;
  // The person's account token from the Hub: the stores bind every purchase to it (never the user id).
  const token = catalog?.accountToken ? catalog.accountToken : null;
  useEffect(() => {
    if (!products || !os || !owner || products.length === 0) return;
    const once = `${owner}:${products.map((p) => p.storeProductId).join(',')}`;
    if (recovering.current === once) return;
    recovering.current = once;
    void recover(products, { platform: os, all: false, accountToken: token }).then((found) => {
      if (!alive.current || found.granted.length === 0) return;
      setRecovered(found.granted);
      refreshAfterGrant();
    });
  }, [products, os, owner, token]);

  const buy = useCallback<StoreBuyer['buy']>(
    async (item, options) => {
      if (running.current || !os) return null;
      running.current = true;
      setBusy(true);
      setLine(null);
      setGranted(null);
      try {
        const result = await purchase(item, { platform: os, accountToken: token, communityId: options?.communityId ?? null, replace: options?.replace ?? null });
        if (!alive.current) return result;
        if (result.kind === 'granted') {
          setGranted(result.purchase);
          refreshAfterGrant();
        } else {
          setLine(said(result, os, item.product.subscription));
          if (result.kind === 'unreachable' || result.kind === 'grant_failed') refreshAfterGrant();
        }
        return result;
      } finally {
        running.current = false;
        if (alive.current) setBusy(false);
      }
    },
    [os, token],
  );

  const restore = useCallback(async () => {
    if (running.current || !os || !products) return;
    running.current = true;
    setRestoring(true);
    setRestoreLine(null);
    setLine(null);
    try {
      const transactions = await iap.restore();
      const found = await recover(products, { platform: os, all: true, transactions, accountToken: token });
      if (!alive.current) return;
      if (found.notOpen) setLine(said({ kind: 'not_open', why: 'not_configured' }, os, true));
      else setRestoreLine(found.left > 0 ? said({ kind: 'unreachable' }, os, true)?.line ?? null : restoredLine(found.granted.length, found.already));
      if (found.granted.length > 0) {
        setRecovered(found.granted);
        refreshAfterGrant();
      }
    } catch {
      if (alive.current) setLine(said({ kind: 'store_unavailable' }, os, true));
    } finally {
      running.current = false;
      if (alive.current) setRestoring(false);
    }
  }, [os, products, token]);

  const clear = useCallback(() => {
    setLine(null);
    setGranted(null);
    setRestoreLine(null);
  }, []);

  return { busy, said: line, granted, recovered, restoring, restoreLine, buy, restore, clear };
}
