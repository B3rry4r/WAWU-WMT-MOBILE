import { api, unwrap } from '@/api/client';
import { isApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';
import type { Envelope } from '@/features/wallet/api/home';

import type { Platform } from '../api';

/**
 * The two Hub calls behind buying a piece, a tip, a community pass or a paid question in the store (R-101, STORE-BUY-HUB, STORE-QUESTION):
 *
 * - `POST /store/intents`: says what a payment is FOR before the store sheet opens. The answer is the store product to buy
 *   (`wawu.buy.<naira>`), the person's account token and the intent's id, which `POST /store/purchases` then carries. With
 *   `payWith: credit` a store credit that covers the price is spent whole and the purchase is granted at once (no store sheet).
 * - `GET /store/credits`: the credits the person can spend. A credit is a promise to give something at that price on Who Made This. It
 *   is never cash and never leaves the app.
 *
 * Neither call rejects: whatever came back (or did not) is one outcome, so the buyer decides in one place what to say.
 */
export type IntentView = components['schemas']['StoreIntentView'];
export type CreditView = components['schemas']['StoreCreditView'];
export type LadderKind = 'content' | 'tip' | 'pass' | 'question';

/** What a payment is for, with the list price (whole naira, on the Hub's price list) the person was shown. */
export type LadderSpec =
  | { kind: 'content'; contentId: string; listPriceNaira: number }
  | { kind: 'tip'; creatorWawuId: string; listPriceNaira: number }
  | { kind: 'pass'; communityId: string; listPriceNaira: number }
  | { kind: 'question'; creatorWawuId: string; text: string; listPriceNaira: number };

export type PayWith = 'store' | 'credit';

export type IntentOutcome =
  | { kind: 'made'; intent: IntentView }
  | { kind: 'not_open'; why: 'not_configured' | 'disabled' }
  /** The Hub refused: the code is the Hub's `reason.code`, the message its own sentence. */
  | { kind: 'refused'; code: string; message: string }
  /** The Hub could not be reached. Nothing was charged. */
  | { kind: 'unreachable' };

const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

function bodyOf(platform: Platform, spec: LadderSpec, payWith: PayWith) {
  const base = { platform, kind: spec.kind, listPriceNaira: spec.listPriceNaira, ...(payWith === 'credit' ? { payWith } : {}) };
  switch (spec.kind) {
    case 'content':
      return { ...base, contentId: spec.contentId };
    case 'tip':
      return { ...base, creatorWawuId: spec.creatorWawuId };
    case 'pass':
      return { ...base, communityId: spec.communityId };
    case 'question':
      return { ...base, creatorWawuId: spec.creatorWawuId, text: spec.text };
  }
}

/** POST /store/intents. Never rejects. */
export async function postIntent(platform: Platform, spec: LadderSpec, payWith: PayWith = 'store'): Promise<IntentOutcome> {
  try {
    const data = (await unwrap(api.POST('/api/hub/store/intents', { body: bodyOf(platform, spec, payWith) }))) as unknown as Envelope<IntentView>;
    const v = data?.data;
    // A body that cannot be read may still have made an intent; nothing was charged, so the person can try again.
    return v && filled(v.intentId) && filled(v.productId) && filled(v.accountToken) ? { kind: 'made', intent: v } : { kind: 'unreachable' };
  } catch (error) {
    if (!isApiError(error)) return { kind: 'unreachable' };
    if (error.code === 'store_not_configured') return { kind: 'not_open', why: 'not_configured' };
    if (error.code === 'store_disabled') return { kind: 'not_open', why: 'disabled' };
    if (error.kind === 'network' || error.kind === 'server' || error.status === 0 || error.status >= 500) return { kind: 'unreachable' };
    return { kind: 'refused', code: error.code ?? 'refused', message: error.message || '' };
  }
}

/** GET /store/credits: the credits the person can spend, smallest first as the Hub lists them. A body that cannot be read is no credits. */
export async function fetchCredits(): Promise<CreditView[]> {
  const body = (await unwrap(api.GET('/api/hub/store/credits'))) as unknown as Envelope<{ credits?: CreditView[] }>;
  const list = body?.data?.credits;
  if (!Array.isArray(list)) return [];
  return list.filter((c) => c && filled(c.id) && Number.isSafeInteger(c.amountKobo) && c.amountKobo > 0);
}

export const creditsKey = (owner: string | null) => ['store', 'credits', owner ?? ''] as const;

/**
 * The open credit that pays for a purchase, if the person holds one: the Hub spends the smallest that covers the price whole. A credit made
 * by an unanswered question (`scope: question`) pays for a question at that price or less and for nothing else; a credit with no scope pays
 * for a piece, a tip or a pass and never for a question.
 */
export function creditFor(credits: readonly CreditView[] | undefined, kind: LadderKind, listPriceNaira: number): CreditView | null {
  const scope = kind === 'question' ? 'question' : null;
  const fits = (credits ?? []).filter((c) => (c.scope ?? null) === scope && c.amountKobo >= listPriceNaira * 100);
  return fits.sort((a, b) => a.amountKobo - b.amountKobo)[0] ?? null;
}
