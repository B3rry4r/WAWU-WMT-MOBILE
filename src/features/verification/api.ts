import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';
import { fetchSelfieMatch } from '@/api/walletIdentity';

/**
 * The reads behind Verification (ME-13), each from the Hub's own answer and keyed by the signed-in account so one
 * person's rows are never answered to another from the shared cache.
 *
 * - `GET /plans/purchases/pending`: the tier purchase still going through, or `purchase: null` (M15). It is the same
 *   view `GET /plans/purchases/{id}` reads, so "Paid, still confirming" is there after a restart, not only in the
 *   session that paid.
 * - `GET /me/tier`: the tier the person holds, with its dates.
 * - `GET /money/identity/selfie`: whether the selfie step has stopped, read only when the wallet is not open and the
 *   Hub's review has nothing to say (M17's cause: three failed matches, KYC-02's retry rule).
 * The wallet's own state and its review come from Open your wallet's read (`openingProgressQuery`), not a second copy.
 */
type MyTier = components['schemas']['MyTierView'];
type Pending = components['schemas']['PendingPlanPurchaseView'];

/** The Hub's success body; the contract types only its `data` (SHARED-CHANGES.md row 11). */
type Envelope<T> = { statusCode: number; message: string; data: T | null };

const unreadable = (what: string) => new ApiError('unknown', 200, `Your ${what} could not be read. Try again.`);
const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export type HeldTier = {
  state: 'active' | 'ending' | 'ended';
  /** The tier's own name as the Hub sends it; null when it names none. */
  name: string | null;
  /** The tier's id as the Hub sends it, from which the step up is worked out; null when it names none. */
  id?: string | null;
  /** ISO 8601, when the tier runs out (or ran out). */
  until: string | null;
};

const tierStates = ['none', 'active', 'ending', 'ended'] as const;

/** GET /me/tier, as this screen reads it: null for a person with no tier. An answer that is not a tier view is refused. */
export async function fetchHeldTier(): Promise<HeldTier | null> {
  const body = (await unwrap(api.GET('/api/hub/me/tier'))) as unknown as Envelope<MyTier>;
  const view = body?.data;
  if (!view || typeof view !== 'object' || !tierStates.includes(view.state as (typeof tierStates)[number])) throw unreadable('tier');
  if (view.state === 'none') return null;
  const name = view.tier && filled(view.tier.name) ? view.tier.name.trim() : null;
  const id = view.tier && filled(view.tier.id) ? view.tier.id : null;
  return { state: view.state as HeldTier['state'], name, id, until: filled(view.activeUntil) ? view.activeUntil : null };
}

export type PendingPurchase = { id: string };

/** GET /plans/purchases/pending: the purchase still confirming (its id), or null when none is going through. */
export async function fetchPendingPurchase(): Promise<PendingPurchase | null> {
  const body = (await unwrap(api.GET('/api/hub/plans/purchases/pending'))) as unknown as Envelope<Pending>;
  const view = body?.data;
  if (!view || typeof view !== 'object' || !('purchase' in view)) throw unreadable('payment');
  if (view.purchase === null) return null;
  if (!filled(view.purchase?.id) || !filled(view.purchase.status)) throw unreadable('payment');
  // The Hub can answer with a purchase it has already decided (refunded when the plan could not be granted, failed or
  // reversed): that is nothing still confirming, not an answer the screen cannot read (SWEEP-APP-3 row 126). A purchase that
  // is paid but whose claim is still open (the plan is not opened yet) is the M15 state itself, "Paid, still confirming":
  // the Hub still holds that person's next buy with payment_in_progress, so the banner stays until the Hub lets it go
  // (SWEEP-APP-4, part 3's low on row 126).
  if (view.purchase.status !== 'pending' && view.purchase.status !== 'paid') return null;
  return { id: view.purchase.id };
}

/** How often a purchase that is still confirming is asked about again, so the banner goes the moment the plan is granted. */
export const PENDING_POLL_MS = 5000;

export function heldTierQuery(owner: string | null) {
  return { queryKey: ['verification', 'tier', owner ?? ''] as const, queryFn: fetchHeldTier, staleTime: 0, enabled: Boolean(owner) };
}

export function pendingPurchaseQuery(owner: string | null) {
  return {
    queryKey: ['verification', 'pending', owner ?? ''] as const,
    queryFn: fetchPendingPurchase,
    staleTime: 0,
    enabled: Boolean(owner),
    refetchInterval: (query: { state: { data: PendingPurchase | null | undefined } }) => (query.state.data ? PENDING_POLL_MS : false),
  };
}

export type SelfieStop = { stopped: boolean };

/** True when the selfie step has used every try and not matched: `checksLeft` 0 with no match on record. */
export async function fetchSelfieStopped(): Promise<SelfieStop> {
  const selfie = await fetchSelfieMatch();
  return { stopped: selfie.matchedAt === null && selfie.checksLeft === 0 };
}

export function selfieStoppedQuery(owner: string | null, enabled: boolean) {
  return { queryKey: ['verification', 'selfie', owner ?? ''] as const, queryFn: fetchSelfieStopped, staleTime: 0, enabled: Boolean(owner) && enabled, retry: false };
}
