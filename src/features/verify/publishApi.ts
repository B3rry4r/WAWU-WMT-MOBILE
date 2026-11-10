import { api } from '@/api/client';
import type { components } from '@/api/schema.generated';
import { contentLink } from '@/features/content-detail/model';

/**
 * Publishing a draft (VERIFY-04, VF12): `POST /product-drafts/{id}/publish` takes the full file that went up under the draft's format
 * (`fullAsset`), its cover and its preview (R-118: nobody uploads a preview, see `PublishFiles`) and turns the draft into a product waiting
 * for review, exactly as `POST /content` would. The Hub refuses it, with the person's own numbers, when no tier is running (`402 tier_required`), when every
 * place is used (`402 product_limit_reached`, with the offers), when the identity check is paused (`403 identity_paused`, with the Hub's own
 * sentence), when the draft still lacks something (`400 draft_incomplete`), or when
 * the draft is gone (a first answer that was lost: `404`, or `409` for a publish a moment ago).
 *
 * The call never rejects: the screen branches on one `PublishOutcome`.
 */
type Piece = components['schemas']['ContentPieceResponse'];
type Envelope<T> = { statusCode?: number; message?: string; data?: T | null };

export type Published = { id: string; title: string; slug: string | null; creatorWawuId: string | null; status: 'pending' | 'live' };

export type PublishOutcome =
  | { kind: 'done'; piece: Published }
  /** No tier is running: VF5. */
  | { kind: 'tier_required'; message: string }
  /** Every place is used: VF13, with the Hub's own sentence. */
  | { kind: 'limit_reached'; message: string }
  /** The person's identity check is paused (`403 identity_paused`): VF15b, with the Hub's own sentence. */
  | { kind: 'identity_paused'; message: string }
  /** The draft lacks something: the Hub names it. */
  | { kind: 'incomplete'; message: string }
  /** The draft is gone: published a moment ago (a lost first answer), or deleted elsewhere. */
  | { kind: 'gone' }
  | { kind: 'unanswered' }
  | { kind: 'refused'; message: string };

const HTTP_CREATED = 201;
const HTTP_SERVER_MIN = 500;
const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

type Wire = { reason?: { code?: unknown; message?: unknown }; message?: unknown };

function messageOf(error: unknown, fallback: string): string {
  const e = (typeof error === 'object' && error !== null ? error : {}) as Wire;
  if (filled(e.reason?.message)) return e.reason.message.trim();
  if (Array.isArray(e.message)) return e.message.filter(filled).join('. ') || fallback;
  return filled(e.message) ? e.message.trim() : fallback;
}

/**
 * What a publish takes (R-118, as `POST /content` does): the full file, the cover when there is one, and the preview of a PAID piece, which
 * is either `previewFromFile: true` (the Hub makes it from the full file) or, for a picture, `previewAsset` (the smaller copy the phone made).
 * A free piece sends neither.
 */
export type PublishFiles = Pick<components['schemas']['PublishProductDraftDto'], 'fullAsset' | 'coverAsset' | 'previewAsset' | 'previewFromFile'>;

export async function publishDraft(id: string, files: PublishFiles): Promise<PublishOutcome> {
  let result;
  try {
    result = await api.POST('/api/hub/product-drafts/{id}/publish', { params: { path: { id } }, body: files });
  } catch {
    return { kind: 'unanswered' };
  }
  const { data, error, response } = result;
  if (response.status === HTTP_CREATED) {
    const piece = (data as unknown as Envelope<Piece> | undefined)?.data;
    if (!piece || !filled(piece.id)) return { kind: 'unanswered' };
    return { kind: 'done', piece: { id: piece.id, title: piece.title, slug: filled(piece.slug) ? piece.slug : null, creatorWawuId: filled(piece.creatorWawuId) ? piece.creatorWawuId : null, status: piece.status === 'live' ? 'live' : 'pending' } };
  }
  if (response.status >= HTTP_SERVER_MIN) return { kind: 'unanswered' };
  const code = (error as Wire | undefined)?.reason?.code;
  if (code === 'tier_required') return { kind: 'tier_required', message: messageOf(error, 'You need a tier to publish.') };
  if (code === 'product_limit_reached') return { kind: 'limit_reached', message: messageOf(error, 'You have used all your places.') };
  if (code === 'identity_paused') return { kind: 'identity_paused', message: messageOf(error, 'Publishing is paused until your identity check passes.') };
  if (code === 'draft_incomplete') return { kind: 'incomplete', message: messageOf(error, 'Finish your draft first.') };
  if (response.status === 404 || response.status === 409) return { kind: 'gone' };
  return { kind: 'refused', message: messageOf(error, 'We could not publish this. Try again.') };
}

/** The link a published product is shared by: the piece's own page, `https://wawuafrica.com/content/<id>`, a full address a person can send and the app opens (SWEEP-FLOWS B12). Null when the Hub gave no id. */
export const productLink = (piece: Pick<Published, 'id'>): string | null => (piece.id ? contentLink(piece.id) : null);

/** The names of the Hub's product categories (`CreateContentDto.category`), for the picker that asks before the first publish. */
export const CATEGORIES: readonly { id: components['schemas']['UpdateProductDraftDto']['category'] & string; label: string }[] = [
  { id: 'agriculture_food', label: 'Agriculture and food' },
  { id: 'trade_commerce', label: 'Trade and commerce' },
  { id: 'business_entrepreneurship', label: 'Business' },
  { id: 'finance', label: 'Finance' },
  { id: 'technology', label: 'Technology' },
  { id: 'education', label: 'Education' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'employment', label: 'Employment' },
  { id: 'entertainment_creative', label: 'Entertainment and creative' },
  { id: 'beauty', label: 'Beauty' },
  { id: 'family_lifestyle', label: 'Family and lifestyle' },
  { id: 'culture_heritage', label: 'Culture and heritage' },
  { id: 'religion_faith', label: 'Religion and faith' },
  { id: 'travel_tourism', label: 'Travel and tourism' },
  { id: 'real_estate', label: 'Real estate' },
  { id: 'transport_logistics', label: 'Transport and logistics' },
  { id: 'manufacturing', label: 'Manufacturing' },
  { id: 'energy_utilities', label: 'Energy and utilities' },
  { id: 'media_communications', label: 'Media and communications' },
  { id: 'professional_services', label: 'Professional services' },
  { id: 'legal_services', label: 'Legal services' },
  { id: 'insurance_pensions', label: 'Insurance and pensions' },
  { id: 'sports_fitness', label: 'Sports and fitness' },
  { id: 'government_public', label: 'Government and public' },
  { id: 'social_impact', label: 'Social impact' },
];
