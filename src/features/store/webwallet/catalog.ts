import { api, unwrap } from '@/api/client';
import { formatNaira } from '@/components/pay-sheet';
import { readPlans } from '@/features/verify/purchaseApi';
import { unreadable, type Envelope } from '@/features/wallet/api/home';

import type { StoreProductView } from '../api';
import type { StoreItem } from '../model';
import type { CreditPack, WebBuySpec } from './api';

/**
 * The web's list of what the phone sells through the stores (WEBAPP-06, R-128): the Hub's own list prices, from `GET /plans` (the tiers, the
 * points packs and the upload pack) and `GET /credits/packs`, drawn as the same items the store screens already draw. A price here is the
 * list price in naira, with no store cut; the bank's charge and WAWU's fee are on the pay sheet's quote, never in this list.
 */
const filled = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const whole = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;

type RawPlans = { currency?: unknown; packs?: unknown; extraProducts?: { count?: unknown; priceMinor?: unknown } | null };

const product = (id: string, kind: StoreProductView['kind'], title: string, grants: StoreProductView['grants'], kobo: number): StoreProductView =>
  ({ id, platform: 'web', storeProductId: id, kind, title, subscription: false, grants, listPriceKobo: kobo, storePriceKobo: kobo }) as unknown as StoreProductView;

/** Every web item the Hub sells from the wallet. Naira only at launch (R-16): a plan list in another currency draws nothing. */
export async function loadWebCatalog(): Promise<StoreItem[]> {
  const raw = ((await unwrap(api.GET('/api/hub/plans'))) as unknown as Envelope<RawPlans>)?.data;
  if (!raw || typeof raw !== 'object') throw unreadable('prices');
  const plans = readPlans(raw);
  if (plans.currency !== 'NGN') return [];
  const items: StoreItem[] = [];
  const add = (p: StoreProductView, kobo: number) => items.push({ product: p, price: formatNaira(kobo), offerToken: null });
  for (const tier of plans.tiers) add(product(`web.tier.${tier.id}`, 'tier', tier.name, { tierId: tier.id } as StoreProductView['grants'], tier.priceMinor), tier.priceMinor);
  const packs = Array.isArray(raw.packs) ? raw.packs : [];
  for (const row of packs) {
    const p = row as { id?: unknown; points?: unknown; priceMinor?: unknown };
    if (filled(p.id) && whole(p.points) && whole(p.priceMinor) && p.priceMinor > 0) add(product(`web.points.${p.id}`, 'points', `${p.points} points`, { points: p.points } as StoreProductView['grants'], p.priceMinor), p.priceMinor);
  }
  const extra = raw.extraProducts;
  if (extra && whole(extra.count) && whole(extra.priceMinor) && extra.priceMinor > 0) {
    add(product('web.extra_products', 'extra_products', 'Add more products', { extraProducts: extra.count } as StoreProductView['grants'], extra.priceMinor), extra.priceMinor);
  }
  const creditBody = (await unwrap(api.GET('/api/hub/credits/packs'))) as unknown as Envelope<{ packs?: unknown }>;
  const credits = Array.isArray(creditBody?.data?.packs) ? (creditBody.data.packs as unknown[]) : [];
  for (const row of credits) {
    const p = row as { pack?: unknown; credits?: unknown; priceKobo?: unknown };
    if (filled(p.pack) && whole(p.credits) && whole(p.priceKobo) && p.priceKobo > 0) add(product(`web.credits.${p.pack}`, 'credits', `${p.credits} credits`, { credits: p.credits } as StoreProductView['grants'], p.priceKobo), p.priceKobo);
  }
  return items;
}

/** What paying for an item asks the Hub for, from the item itself. `kind` is only for a tier (a first purchase, a renewal, an upgrade). */
export function specOf(item: Pick<StoreItem, 'product'>, tierKind: 'tier' | 'renew' | 'upgrade' = 'tier'): Exclude<WebBuySpec, { kind: 'pass' }> | null {
  const p = item.product;
  switch (p.kind) {
    case 'tier':
      return p.grants.tierId ? { kind: tierKind, tierId: p.grants.tierId } : null;
    case 'points':
      return p.storeProductId.startsWith('web.points.') ? { kind: 'points_pack', packId: p.storeProductId.slice('web.points.'.length) } : null;
    case 'extra_products':
      return { kind: 'extra_products' };
    case 'credits':
      return p.storeProductId.startsWith('web.credits.') ? { kind: 'credits', pack: p.storeProductId.slice('web.credits.'.length) as CreditPack } : null;
    default:
      return null;
  }
}
