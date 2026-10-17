import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';
import { HTTP_CREATED, filled, isKobo, readRefusal, type Refusal } from '@/features/money-attempt/refusal';

/**
 * The calls behind Buy WAWU Credits (INBOX-13: I28, I29), as the Hub's contract types them (INBOX-16):
 * - `GET /credits/packs`: the server's table, each pack's credits and price. Needs no wallet, so the sheet opens before one exists.
 * - `GET /credits/purchase/wallet/quote?pack=`: the pack's price, the bank's charge on top, the total, the wallet's balance and the
 *   signed quote the purchase must carry. Asked for again on every tap that buys (a fresh quote per tap).
 * - `POST /credits/purchase/wallet`: the purchase. The PIN is the `X-Transaction-Pin` header and nothing keeps it; the
 *   `Idempotency-Key` is one per attempt and travels again, unchanged, after a wrong PIN or an answer that never came.
 * - `GET /credits/purchase/wallet/{id}`: what the app reads after `pending`, never paying again.
 * Credits are a count, never naira (R-5).
 */
export type CreditPack = components['schemas']['CreditPackView'];
export type PackId = CreditPack['pack'];
export type PackQuote = components['schemas']['CreditWalletQuoteView'];
export type PackPurchase = components['schemas']['CreditWalletPurchaseView'];

type Envelope<T> = { data?: T | null };

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

export const packsKey = ['credits', 'packs'] as const;
export const packQuoteKey = (pack: PackId) => ['credits', 'quote', pack] as const;
export const purchaseKey = (id: string) => ['credits', 'purchase', id] as const;

/** GET /credits/packs. A pack with a price that is not whole kobo, or credits that are not a count, is refused, never drawn. */
export async function fetchPacks(): Promise<CreditPack[]> {
  const body = (await unwrap(api.GET('/api/hub/credits/packs'))) as unknown as Envelope<{ packs: CreditPack[] }>;
  const packs = body?.data?.packs;
  if (!Array.isArray(packs) || packs.length === 0) throw unreadable('credit packs');
  for (const pack of packs) {
    if (!filled(pack?.pack) || !isKobo(pack.priceKobo) || !Number.isSafeInteger(pack.credits) || pack.credits <= 0) throw unreadable('credit packs');
  }
  return packs.map((pack) => ({ pack: pack.pack, credits: pack.credits, priceKobo: pack.priceKobo, badge: pack.badge ?? null }));
}

/** What a quote must hold for a purchase to carry it: whole-kobo parts that add up, and the token. */
export function readPackQuote(value: unknown): PackQuote {
  const q = value as Partial<PackQuote> | null;
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
    filled(q.pack) &&
    Number.isSafeInteger(q.credits);
  if (!ok) throw unreadable('price');
  return q as PackQuote;
}

/** GET /credits/purchase/wallet/quote for one pack. Rejects with the money reason (`wallet_not_open` leads to Open your wallet). */
export async function fetchPackQuote(pack: PackId): Promise<PackQuote> {
  const body = (await unwrap(api.GET('/api/hub/credits/purchase/wallet/quote', { params: { query: { pack } } }))) as unknown as Envelope<PackQuote>;
  return readPackQuote(body?.data);
}

const PURCHASE_STATUSES = ['pending', 'paid', 'failed', 'reversed'] as const;

/** A purchase as the screens read it: a known status and the pack. Anything else is refused, never drawn half empty. */
export function readPurchase(value: unknown): PackPurchase {
  const v = value as Partial<PackPurchase> | null;
  const ok =
    v &&
    typeof v === 'object' &&
    filled(v.id) &&
    PURCHASE_STATUSES.includes(v.status as (typeof PURCHASE_STATUSES)[number]) &&
    Number.isSafeInteger(v.credits) &&
    isKobo(v.priceKobo) &&
    v.payment &&
    isKobo(v.payment.totalKobo);
  if (!ok) throw unreadable('purchase');
  return v as PackPurchase;
}

/** GET /credits/purchase/wallet/{id}. */
export async function fetchPurchase(id: string): Promise<PackPurchase> {
  const body = (await unwrap(api.GET('/api/hub/credits/purchase/wallet/{id}', { params: { path: { id } } }))) as unknown as Envelope<PackPurchase>;
  return readPurchase(body?.data);
}

/** What the purchase call came to. A `done` carries the purchase as the Hub holds it (paid, pending or failed). */
export type BuyOutcome = { kind: 'done'; purchase: PackPurchase } | Refusal;

export type BuyInput = {
  pack: PackId;
  /** The quote's `payment.totalKobo` and `payment.quoteToken`, as the person saw them. */
  quote: PackQuote;
  /** One per attempt, kept across a wrong PIN and an answer that never came. */
  key: string;
  pin: string;
};

/** POST /credits/purchase/wallet. Never rejects: whatever came back (or did not) is a `BuyOutcome`, so the screen decides in one place. */
export async function buyPack(input: BuyInput): Promise<BuyOutcome> {
  let result;
  try {
    result = await api.POST('/api/hub/credits/purchase/wallet', {
      params: { header: { 'X-Transaction-Pin': input.pin, 'Idempotency-Key': input.key } },
      body: { pack: input.pack, expectedTotalKobo: input.quote.payment.totalKobo, quoteToken: input.quote.payment.quoteToken },
    });
  } catch {
    return { kind: 'unanswered' };
  }
  const { data, error, response } = result;
  if (response.status === HTTP_CREATED) {
    try {
      return { kind: 'done', purchase: readPurchase((data as unknown as Envelope<PackPurchase> | undefined)?.data) };
    } catch {
      // The Hub said created and the answer cannot be read: the purchase may exist, so it is not a refusal.
      return { kind: 'unanswered' };
    }
  }
  return readRefusal(response.status, error, 'This purchase was not taken. Nothing left your wallet.', 'There is not enough in your wallet for this pack.');
}
