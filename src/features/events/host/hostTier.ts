import { toApiError, ApiError } from '@/api/errors';
import type { Currency } from '@/components/Money';
import { tierItemOf, type StoreState } from '@/features/store/model';
import type { Plans } from '@/features/verify/purchaseApi';

/**
 * Hosting needs a tier (EVENTS-12, R-43). The Hub answers `403` with `reason.code` `tier_required` on `POST /events`,
 * `PATCH /events/{id}` and `PUT /events/{id}/tickets`, and `account_type_required` for an account that is neither a creator nor a
 * professional and holds no tier. Both end at E21 ("Hosting needs a tier"): a tier of any account type hosts, so See tiers is the way on.
 * The app switches on `reason.code`, never on the words.
 *
 * `ApiError` keeps only the code and the words, so this reads the refusal's own body for the rest: `reason.tierState` (`none` or
 * `ended`), the `currency` and the `lowestTier` of `GET /plans` in that currency.
 */
export const HOST_TIER_REQUIRED = 'tier_required';
const HOST_ACCOUNT_TYPE_REQUIRED = 'account_type_required';
const HTTP_FORBIDDEN = 403;

export type HostTierState = 'none' | 'ended';
export type LowestTier = { id: string; name: string; priceMinor: number };

/** What the Hub said about the missing tier. It is an `ApiError`, so every handler that reads one still works. */
export class HostTierRefusal extends ApiError {
  /** `none`: never had a tier. `ended`: the period is over. Absent on `account_type_required`. */
  readonly tierState?: HostTierState;
  readonly currency?: Currency;
  /** The cheapest tier on `GET /plans` for this person, when the Hub could read the plan. */
  readonly lowestTier?: LowestTier | null;

  constructor(base: ApiError, extra: { tierState?: HostTierState; currency?: Currency; lowestTier?: LowestTier | null }) {
    super(base.kind, base.status, base.message, base.code, base.retryAfterSeconds, base.detail);
    this.name = 'HostTierRefusal';
    this.tierState = extra.tierState;
    this.currency = extra.currency;
    this.lowestTier = extra.lowestTier;
  }
}

const recordOf = (value: unknown): Record<string, unknown> => (typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {});

function lowestTierOf(value: unknown): LowestTier | null | undefined {
  if (value === null) return null;
  const tier = recordOf(value);
  return typeof tier.id === 'string' && typeof tier.name === 'string' && typeof tier.priceMinor === 'number' && Number.isSafeInteger(tier.priceMinor) && tier.priceMinor > 0
    ? { id: tier.id, name: tier.name, priceMinor: tier.priceMinor }
    : undefined;
}

/** The refusal as the Hub sent it, or the plain `ApiError` for any other answer. */
export function hostFailure(status: number, body: unknown, headers?: Headers): ApiError {
  const base = toApiError(status, body, headers);
  if (status !== HTTP_FORBIDDEN || (base.code !== HOST_TIER_REQUIRED && base.code !== HOST_ACCOUNT_TYPE_REQUIRED)) return base;
  const reason = recordOf(recordOf(body).reason);
  const state = reason.tierState;
  const currency = reason.currency;
  return new HostTierRefusal(base, {
    tierState: state === 'none' || state === 'ended' ? state : undefined,
    currency: currency === 'NGN' || currency === 'USD' ? currency : undefined,
    lowestTier: lowestTierOf(reason.lowestTier),
  });
}

type Result<T, E> = { data?: T; error?: E; response: Response };

/** `unwrap` for the three host calls: the same success, and a missing tier arrives as a `HostTierRefusal`. */
export async function hostUnwrap<T, E>(request: Promise<Result<T, E>>): Promise<T> {
  const { data, error, response } = await request;
  if (!response.ok) throw hostFailure(response.status, error, response.headers);
  return data as T;
}

/** Whether a host action was refused for want of a tier: E21 is the answer, never a generic error (G-EVENTS-12-1). */
export const isHostTierRefusal = (error: unknown): error is ApiError =>
  error instanceof ApiError && error.status === HTTP_FORBIDDEN && (error.code === HOST_TIER_REQUIRED || error.code === HOST_ACCOUNT_TYPE_REQUIRED);

/** The tier names the gate lists ("Verify, Verify Plus or Founding Maker"), cheapest first, from `GET /plans`. */
export function tierNamesLine(plans: Pick<Plans, 'tiers'> | null | undefined): string | null {
  const names = [...(plans?.tiers ?? [])].sort((a, b) => a.priceMinor - b.priceMinor).map((t) => t.name.trim()).filter(Boolean);
  if (names.length === 0) return null;
  return `${names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`}.`;
}

/**
 * "From $2.99.": the STORE's own price for the lowest tier (IAP-03, R-86), in the person's own currency. The lowest tier is the one the Hub
 * names in the refusal when it carries one, else the cheapest tier of `GET /plans` that the store sells. Null (no line) until the store has
 * answered, and when it sells none: the Hub's plan price is never drawn.
 */
export function fromLine(store: StoreState, plans: Pick<Plans, 'tiers'> | null | undefined, refusal?: HostTierRefusal | null): string | null {
  const named = tierItemOf(store, refusal?.lowestTier?.id);
  const cheapest = [...(plans?.tiers ?? [])].sort((a, b) => a.priceMinor - b.priceMinor).find((t) => tierItemOf(store, t.id) !== null);
  const item = named ?? (cheapest ? tierItemOf(store, cheapest.id) : null);
  return item ? `From ${item.price}.` : null;
}

/** A tier is running while it is `active` or `ending` (the Hub's own rule); `none` and `ended` do not host. */
export const tierRunning = (tier: { state: string } | null | undefined): boolean => tier?.state === 'active' || tier?.state === 'ending';
