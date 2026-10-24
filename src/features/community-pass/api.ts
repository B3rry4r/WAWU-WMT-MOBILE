import { api, resendsUnderKey, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';
import { approvalRefused, credentialHeader, part, type ApprovalStopped, type Credential } from '@/features/device-approval/credential';
import { HTTP_CREATED, filled, isKobo, readRefusal, type Refusal } from '@/features/money-attempt/refusal';

/**
 * The calls behind a private community's monthly pass (INBOX-14: I30, I31), as the Hub's contract types them (INBOX-24, R-63):
 * - `GET /communities/{id}/pass`: where the person stands with the room's pass: the host's price, when their pass ends, whether they
 *   can buy or renew. Needs no wallet, so the landing opens before one exists.
 * - `GET /communities/{id}/pass/quote`: the price, the bank's charge and WAWU's fee on top, the total, the wallet's balance, when the
 *   pass would end and the signed quote the purchase must carry. Asked for again on every tap on Join or Renew (a fresh quote per tap).
 * - `POST /communities/{id}/pass`: the purchase. The PIN is the `X-Transaction-Pin` header and nothing keeps it; the `Idempotency-Key`
 *   is one per attempt and travels again, unchanged, after a wrong PIN or an answer that never came.
 * - `GET /communities/{id}/pass/{paymentId}`: what the app reads after `pending`, never paying again.
 * - `GET /users/{wawuId}/public-profile`: the host's handle (the room carries only the host's id).
 * Nothing is debited by time or by a reminder: a pass is paid for only by this request (R-63).
 */
export type PassView = components['schemas']['CommunityPassView'];
export type PassQuote = components['schemas']['CommunityPassQuoteView'];
export type PassPurchase = components['schemas']['CommunityPassPurchaseView'];

type Envelope<T> = { data?: T | null };

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

export const passKey = (id: string) => ['community', id, 'pass'] as const;
export const passQuoteKey = (id: string) => ['community', id, 'pass', 'quote'] as const;
export const passPurchaseKey = (id: string, paymentId: string) => ['community', id, 'pass', 'purchase', paymentId] as const;
export const hostKey = (wawuId: string) => ['community', 'host', wawuId] as const;

/** GET /communities/{id}/pass. A body without the price rule, the end date rule or the flags is refused, never drawn half empty. */
export async function fetchPass(id: string): Promise<PassView> {
  const body = (await unwrap(api.GET('/api/hub/communities/{id}/pass', { params: { path: { id } } }))) as unknown as Envelope<PassView>;
  const v = body?.data;
  const ok =
    v &&
    typeof v === 'object' &&
    typeof v.sellsPass === 'boolean' &&
    typeof v.active === 'boolean' &&
    typeof v.canRenew === 'boolean' &&
    typeof v.canBuy === 'boolean' &&
    typeof v.isHost === 'boolean' &&
    (v.priceKobo === null || isKobo(v.priceKobo)) &&
    (v.passUntil === null || filled(v.passUntil));
  if (!ok) throw unreadable('pass');
  return v as PassView;
}

/** What a quote must hold for a purchase to carry it: whole-kobo parts, the token, the day the pass would end. */
export function readPassQuote(value: unknown): PassQuote {
  const q = value as Partial<PassQuote> | null;
  const p = q?.payment;
  const ok =
    q &&
    typeof q === 'object' &&
    p &&
    isKobo(p.priceKobo) &&
    isKobo(p.totalKobo) &&
    p.fee &&
    isKobo(p.fee.providerFeeKobo) &&
    isKobo(p.fee.wawuFeeKobo) &&
    filled(p.quoteToken) &&
    filled(p.expiresAt) &&
    filled(q.newPassUntil) &&
    isKobo(q.priceKobo);
  if (!ok) throw unreadable('price');
  return q as PassQuote;
}

/** GET /communities/{id}/pass/quote. Rejects with the money reason (`wallet_not_open` leads to Open your wallet). */
export async function fetchPassQuote(id: string): Promise<PassQuote> {
  const body = (await unwrap(api.GET('/api/hub/communities/{id}/pass/quote', { params: { path: { id } } }))) as unknown as Envelope<PassQuote>;
  return readPassQuote(body?.data);
}

const PURCHASE_STATUSES = ['pending', 'paid', 'failed', 'reversed', 'refunded'] as const;

/** A purchase as the screens read it: a known status. Anything else is refused, never drawn half empty. */
export function readPassPurchase(value: unknown): PassPurchase {
  const v = value as Partial<PassPurchase> | null;
  const ok =
    v &&
    typeof v === 'object' &&
    filled(v.id) &&
    PURCHASE_STATUSES.includes(v.status as (typeof PURCHASE_STATUSES)[number]) &&
    isKobo(v.priceKobo) &&
    v.payment &&
    isKobo(v.payment.totalKobo);
  if (!ok) throw unreadable('purchase');
  return v as PassPurchase;
}

/** GET /communities/{id}/pass/{paymentId}. */
export async function fetchPassPurchase(id: string, paymentId: string): Promise<PassPurchase> {
  const body = (await unwrap(
    api.GET('/api/hub/communities/{id}/pass/{paymentId}', { params: { path: { id, paymentId } } }),
  )) as unknown as Envelope<PassPurchase>;
  return readPassPurchase(body?.data);
}

/** What the purchase call came to. A `done` carries the purchase as the Hub holds it (paid, pending, failed or refunded). */
export type PassOutcome = { kind: 'done'; purchase: PassPurchase } | Refusal | ApprovalStopped;

export type BuyPassInput = {
  id: string;
  /** The quote's `payment.totalKobo` and `payment.quoteToken`, as the person saw them. */
  quote: PassQuote;
  /** One per attempt, kept across a wrong PIN and an answer that never came. */
  key: string;
} & Credential;

/** POST /communities/{id}/pass. Never rejects: whatever came back (or did not) is a `PassOutcome`, so the screen decides in one place. */
export async function buyPass(input: BuyPassInput): Promise<PassOutcome> {
  const body = { expectedTotalKobo: input.quote.payment.totalKobo, quoteToken: input.quote.payment.quoteToken };
  const headed = await credentialHeader(input, { method: 'POST', path: `/api/hub/communities/${part(input.id)}/pass`, body });
  if ('outcome' in headed) return headed.outcome;
  let result;
  try {
    result = await api.POST('/api/hub/communities/{id}/pass', {
      params: { path: { id: input.id }, header: { ...headed.header, 'Idempotency-Key': input.key } },
      body,
      fetch: resendsUnderKey,
    });
  } catch {
    return { kind: 'unanswered' };
  }
  const { data, error, response } = result;
  if (response.status === HTTP_CREATED) {
    try {
      return { kind: 'done', purchase: readPassPurchase((data as unknown as Envelope<PassPurchase> | undefined)?.data) };
    } catch {
      // The Hub said created and the answer cannot be read: the purchase may exist, so it is not a refusal.
      return { kind: 'unanswered' };
    }
  }
  if (approvalRefused(error)) return { kind: 'approval_failed' };
  return readRefusal(response.status, error, 'This pass was not taken. Nothing left your wallet.', 'There is not enough in your wallet for this pass.');
}

/** The host's handle for the line "hosted by", from their public profile. Null when it cannot be read: the line is then left out. */
export async function fetchHostHandle(wawuId: string): Promise<string | null> {
  const body = (await unwrap(api.GET('/api/hub/users/{wawuId}/public-profile', { params: { path: { wawuId } } }))) as unknown as Envelope<{
    handle?: unknown;
  }>;
  const handle = body?.data?.handle;
  return filled(handle) ? handle.replace(/^@/, '') : null;
}
