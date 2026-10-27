import { useQuery } from '@tanstack/react-query';

import { queryClient } from '@/api/query';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';

import * as iap from '../iap';
import type { StoreItem, StoreState } from '../model';
import { useStoreBuyer, useStoreCatalog, type StoreBuyer } from '../useStore';

import { creditFor, creditsKey, fetchCredits, type CreditView, type LadderKind } from './api';

/**
 * The store's side of buying a piece, a tip, a pass or a question (R-101). The ladder is the Hub's `wawu.buy.<naira>` consumables: one per
 * price on the list, each priced by the store. `itemFor` finds the one for a list price; its `price` is the store's own text (what the sheet
 * will charge, in the person's currency). The credits are the person's open store credits.
 *
 * Both reads wait for a signed-in person on a phone with a store; on the web nothing is asked and `native` is false, so the caller keeps the
 * wallet path.
 */
export type Ladder = {
  native: boolean;
  state: StoreState;
  refetch: () => void;
  buyer: StoreBuyer;
  /** The ladder item for a list price in whole naira, once the Hub and the store have both answered; else null. */
  itemFor: (listNaira: number | null | undefined) => StoreItem | null;
  /** The open credit that would pay for this, if the person holds one. */
  creditFor: (kind: LadderKind, listNaira: number | null | undefined) => CreditView | null;
};

export function useLadder(): Ladder {
  const owner = useSessionAccount(undefined);
  const os = iap.storeOs();
  const store = useStoreCatalog(['buy']);
  const buyer = useStoreBuyer(store.catalog);
  const credits = useQuery({ queryKey: creditsKey(owner), queryFn: fetchCredits, enabled: os !== null && Boolean(owner), staleTime: 0, retry: false }, queryClient);
  const items = store.state.kind === 'ready' ? store.state.items : [];
  return {
    native: os !== null,
    state: store.state,
    refetch: store.refetch,
    buyer,
    itemFor: (list) => (list == null ? null : (items.find((i) => i.product.listPriceKobo === list * 100) ?? null)),
    creditFor: (kind, list) => (list == null ? null : creditFor(credits.data, kind, list)),
  };
}
