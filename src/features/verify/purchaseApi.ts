import { api, unwrap } from '@/api/client';
import type { components } from '@/api/schema.generated';
import { unreadable, type Envelope } from '@/features/wallet/api/home';

/**
 * The Hub's plans, as the screens read them (ME-12: VF5 to VF7a):
 *
 * - `GET /plans`: the tiers (`id`, `name`, `priceMinor`, `days`, `products`, `bonusPoints`, `eventPass`, `preselected`), the checkout
 *   offer (`checkoutBump`) and the five-more offer (`extraProducts`). What a tier gives and how long it lasts are read from here, never
 *   typed. The naira `priceMinor` figures are the website's: a tier, the upload pack and every other store-bought item is bought in the
 *   store sheet at the STORE's price (R-86, IAP-02, IAP-03), so no screen draws a plan price.
 *
 * The wallet purchase calls that used to live here (`GET /plans/purchases/quote`, `POST /plans/purchases`, `GET /plans/purchases/{id}`)
 * were unreachable once R-86 moved the app to the store sheet, and were removed by IAP-03. The Hub's routes stay for the website.
 */
export type PlansView = components['schemas']['PlansView'];
export type PlanTier = components['schemas']['PlanTierView'];
export type PlanEventPass = components['schemas']['PlanEventPassView'];

const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const whole = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

/** The plans, the checkout offer and the five-more offer. An answer that is not whole is refused, never drawn as "no tiers". */
export type Plans = {
  currency: 'NGN' | 'USD';
  tiers: PlanTier[];
  extraProducts: { count: number; priceMinor: number };
  checkoutBump: { points: number; priceMinor: number };
};

export function readPlans(value: unknown): Plans {
  const v = value as Partial<PlansView> | null;
  if (!v || typeof v !== 'object' || (v.currency !== 'NGN' && v.currency !== 'USD') || !Array.isArray(v.tiers)) throw unreadable('tiers');
  const tiers = v.tiers.map((t) => {
    const tier = t as Partial<PlanTier> | null;
    if (!tier || !filled(tier.id) || !filled(tier.name) || !whole(tier.priceMinor) || tier.priceMinor <= 0 || !whole(tier.days) || !whole(tier.products) || !whole(tier.bonusPoints)) throw unreadable('tiers');
    return tier as PlanTier;
  });
  const extra = v.extraProducts;
  const bump = v.checkoutBump;
  if (!extra || !whole(extra.count) || !whole(extra.priceMinor) || !bump || !whole(bump.points) || !whole(bump.priceMinor)) throw unreadable('tiers');
  return { currency: v.currency, tiers, extraProducts: { count: extra.count, priceMinor: extra.priceMinor }, checkoutBump: { points: bump.points, priceMinor: bump.priceMinor } };
}

export async function fetchPlans(): Promise<Plans> {
  const body = (await unwrap(api.GET('/api/hub/plans'))) as unknown as Envelope<PlansView>;
  return readPlans(body?.data);
}

export const plansQuery = (owner: string | null) => ({ queryKey: ['plans', 'tiers', owner ?? ''] as const, queryFn: fetchPlans, staleTime: 0, enabled: Boolean(owner) }) as const;

/** What a tier grant gave, as `OfficialScreen` (VF7) draws it. */
export type PurchaseGrant = {
  tierName: string | null;
  /** The tier's badge: `numbered` is true for the Founding Maker (the number is on the profile details, `GET /users/me/profile-fields`). */
  numbered: boolean;
  activeUntil: string;
  productsAllowed: number;
  bonusPoints: number;
  bumpPoints: number;
  eventPass: PlanEventPass | null;
};
