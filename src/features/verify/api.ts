import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';
import type { ProductDraft } from '@/features/me/api';

/**
 * The Verify calls (VERIFY-01, VF1 and VF2) as the Hub's contract types them:
 * - `GET /plans`: the tiers and what each gives (VF1 reads the preselected tier's `bonusPoints`, `firstVoiceIntroIncluded` and `eventPass`).
 * - `POST` and `GET /product-drafts`, `GET`, `PATCH` and `DELETE /product-drafts/{id}`: a draft is a product's details with no file.
 *   Free: no tier is asked and no file is taken. The Hub keeps at most a fixed number per person (G-662) and refuses the next with
 *   `409 draft_limit_reached`; the app states no number of its own.
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data` (SHARED-CHANGES.md row 11), so each call
 * reads `data` itself. The list is `fetchDrafts` and its key `draftsKey`, which Me already reads (`@/features/me/api`).
 */
type Envelope<T> = { statusCode?: number; message?: string; data?: T | null };

export type PlansView = components['schemas']['PlansView'];
export type PlanTier = components['schemas']['PlanTierView'];
export type PlanAction = components['schemas']['PlanActionView'];
export type DraftBody = components['schemas']['CreateProductDraftDto'];
export type DraftChanges = components['schemas']['UpdateProductDraftDto'];
export type { ProductDraft };
export { draftsKey, fetchDrafts } from '@/features/me/api';

export const plansKey = ['plans'] as const;
export const draftKey = (id: string) => ['profile', 'drafts', id] as const;

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `Your ${what} could not be read. Try again.`);
}

/** The plans as the Hub serves them. An answer with no list of tiers is refused, never drawn as "no tiers". */
export async function fetchPlans(): Promise<PlansView> {
  const body = (await unwrap(api.GET('/api/hub/plans'))) as unknown as Envelope<PlansView>;
  const plans = body?.data;
  if (!plans || typeof plans !== 'object' || !Array.isArray(plans.tiers)) throw unreadable('plans');
  return plans;
}

const isDraft = (value: unknown): value is ProductDraft =>
  !!value && typeof value === 'object' && typeof (value as ProductDraft).id === 'string' && typeof (value as ProductDraft).title === 'string';

/** One draft, as the Hub keeps it. A draft that is not the person's own is a 404, which the form reads as "gone". */
export async function fetchDraft(id: string): Promise<ProductDraft> {
  const body = (await unwrap(api.GET('/api/hub/product-drafts/{id}', { params: { path: { id } } }))) as unknown as Envelope<ProductDraft>;
  if (!isDraft(body?.data)) throw unreadable('draft');
  return body.data;
}

/** Saves a new draft. Only the title is required; the rest can come later. */
export async function createDraft(draft: DraftBody): Promise<ProductDraft> {
  const body = (await unwrap(api.POST('/api/hub/product-drafts', { body: draft }))) as unknown as Envelope<ProductDraft>;
  if (!isDraft(body?.data)) throw unreadable('draft');
  return body.data;
}

/** Changes the fields sent and leaves the others as they are. */
export async function updateDraft(id: string, changes: DraftChanges): Promise<ProductDraft> {
  const body = (await unwrap(api.PATCH('/api/hub/product-drafts/{id}', { params: { path: { id } }, body: changes }))) as unknown as Envelope<ProductDraft>;
  if (!isDraft(body?.data)) throw unreadable('draft');
  return body.data;
}

/** Deletes a draft. A draft that is already gone (404) is what the person wanted, so it is not a failure. */
export async function deleteDraft(id: string): Promise<void> {
  try {
    await unwrap(api.DELETE('/api/hub/product-drafts/{id}', { params: { path: { id } } }));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return;
    throw error;
  }
}
