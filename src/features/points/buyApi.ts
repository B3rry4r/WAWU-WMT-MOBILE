import { api, unwrap } from '@/api/client';
import type { components } from '@/api/schema.generated';
import { unreadable, type Envelope } from '@/features/wallet/api/home';

/**
 * The reads behind Buy points (PT4): the Founding Maker's bonus on every pack. The packs themselves are the store's now (R-86): what each
 * gives is `GET /store/products` and its price is the store's own (`@/features/store`).
 *
 * - `GET /plans`: each tier's `packBonusPercent`, the bonus points a running tier adds to every pack.
 * - `GET /me/tier`: the tier the person holds now.
 */
export type PlansView = components['schemas']['PlansView'];
export type PackView = components['schemas']['PlanPackView'];

const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const whole = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

/** GET /me/tier, as Buy points reads it: the tier the person holds now (its id and name), or null for a person with none or an ended one. */
export async function fetchRunningTier(): Promise<{ id: string; name: string | null } | null> {
  const body = (await unwrap(api.GET('/api/hub/me/tier'))) as unknown as Envelope<components['schemas']['MyTierView']>;
  const v = body?.data;
  if (!v || typeof v !== 'object' || !['none', 'active', 'ending', 'ended'].includes(v.state)) throw unreadable('tier');
  if ((v.state !== 'active' && v.state !== 'ending') || !v.tier || !filled(v.tier.id)) return null;
  return { id: v.tier.id, name: filled(v.tier.name) ? v.tier.name.trim() : null };
}

export const runningTierQuery = (owner: string | null) =>
  ({ queryKey: ['plans', 'running-tier', owner ?? ''] as const, queryFn: fetchRunningTier, staleTime: 0, enabled: Boolean(owner), retry: false }) as const;

/** The packs the Hub sells and the tiers' bonus percents, or nothing (an answer that is not whole is refused, never drawn half empty). */
export function readPlans(value: unknown): { currency: 'NGN' | 'USD'; packs: PackView[]; bonusByTier: Record<string, number> } {
  const v = value as Partial<PlansView> | null;
  if (!v || typeof v !== 'object' || (v.currency !== 'NGN' && v.currency !== 'USD') || !Array.isArray(v.packs)) throw unreadable('points packs');
  const packs = v.packs.map((p) => {
    const pack = p as Partial<PackView> | null;
    if (!pack || !filled(pack.id) || !whole(pack.points) || pack.points <= 0 || !whole(pack.priceMinor) || pack.priceMinor <= 0) throw unreadable('points packs');
    return { id: pack.id, points: pack.points, priceMinor: pack.priceMinor };
  });
  const bonusByTier: Record<string, number> = {};
  for (const t of Array.isArray(v.tiers) ? v.tiers : []) if (t && filled(t.id) && whole(t.packBonusPercent)) bonusByTier[t.id] = t.packBonusPercent;
  return { currency: v.currency, packs, bonusByTier };
}

export async function fetchPlans() {
  const body = (await unwrap(api.GET('/api/hub/plans'))) as unknown as Envelope<PlansView>;
  return readPlans(body?.data);
}

export const plansQuery = (owner: string | null) =>
  ({ queryKey: ['plans', owner ?? ''] as const, queryFn: fetchPlans, staleTime: 0, enabled: Boolean(owner) }) as const;
