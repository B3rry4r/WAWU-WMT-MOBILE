import { api, resendsUnderKey, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';
import { approvalRefused, credentialHeader, part, type ApprovalStopped, type Credential } from '@/features/device-approval/credential';
import { filled, HTTP_CREATED, isKobo, readRefusal, type Refusal } from '@/features/money-attempt/refusal';

/**
 * The calls behind the WAWU card (WALLET-31 serves them, WALLET-22 draws them; R-84): virtual and single-use dollar cards funded from the person's
 * Naira wallet, converted when the card is used. As the Hub's contract types them:
 * - `GET /money/cards`: the person's cards and whether the product is on (`enabled`).
 * - `GET /money/cards/quote`: the fee (the bank's charge plus WAWU's, from settings), the limits and whether a card can be asked for.
 * - `POST /money/cards`: makes one. The PIN is the `X-Transaction-Pin` header, or the phone's fingerprint or face approval is
 *   `X-Device-Approval` in its place; the `Idempotency-Key` is one per attempt and travels again, unchanged, after a wrong PIN or an answer
 *   that never came. The answer carries no number, expiry or CVV.
 * - `POST /money/cards/{id}/reveal`: the number, expiry and CVV, read from the issuer now, behind the PIN or a fingerprint, every time. They are
 *   shown and held in memory only while they are on screen: nothing here stores them.
 * - `POST .../freeze` and `DELETE /money/cards/{id}` (block for good) need no PIN; `POST .../unfreeze` needs one.
 * - `GET /money/cards/{id}/transactions`: payments, reversals and refunds on a card, in dollars.
 */
export type Card = components['schemas']['CardView'];
export type CardList = components['schemas']['CardListView'];
export type CardQuote = components['schemas']['CardQuoteView'];
export type CardDetails = components['schemas']['CardDetailsView'];
export type CardTransaction = components['schemas']['CardTransactionView'];
export type CardTransactionPage = components['schemas']['CardTransactionPage'];

export type CardKind = Card['kind'];

type Envelope<T> = { data?: T | null };

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `Your ${what} could not be read. Try again.`);
}

export const cardsKey = ['money', 'cards'] as const;
export const cardKey = (id: string) => ['money', 'cards', id] as const;
export const cardQuoteKey = ['money', 'cards', 'quote'] as const;
export const cardTransactionsKey = (id: string) => ['money', 'cards', id, 'transactions'] as const;

const KINDS: readonly string[] = ['virtual', 'single_use'];
const STATUSES: readonly string[] = ['pending', 'active', 'frozen', 'blocked'];

/** A card as the screens read it: a known kind and status. Anything else is refused, never drawn half empty. */
export function readCard(value: unknown): Card {
  const c = value as Partial<Card> | null;
  const ok =
    c &&
    typeof c === 'object' &&
    filled(c.id) &&
    KINDS.includes(String(c.kind)) &&
    STATUSES.includes(String(c.status)) &&
    filled(c.name) &&
    filled(c.createdAt);
  if (!ok) throw unreadable('card');
  return {
    ...(c as Card),
    last4: filled(c.last4) ? c.last4 : null,
    statusMessage: filled(c.statusMessage) ? c.statusMessage : null,
    frozenBySupport: c.frozenBySupport === true,
  };
}

/** GET /money/cards. */
export async function fetchCards(): Promise<CardList> {
  const body = (await unwrap(api.GET('/api/hub/money/cards'))) as unknown as Envelope<CardList>;
  const data = body?.data;
  if (!data || typeof data.enabled !== 'boolean' || !Array.isArray(data.cards)) throw unreadable('cards');
  return { enabled: data.enabled, cards: data.cards.map(readCard) };
}

/** GET /money/cards/quote. Whole-kobo fee parts that add up, or it is refused. */
export async function fetchCardQuote(): Promise<CardQuote> {
  const body = (await unwrap(api.GET('/api/hub/money/cards/quote'))) as unknown as Envelope<CardQuote>;
  const q = body?.data;
  const ok =
    q &&
    typeof q.enabled === 'boolean' &&
    typeof q.canCreate === 'boolean' &&
    q.fee &&
    isKobo(q.fee.providerFeeKobo) &&
    isKobo(q.fee.wawuFeeKobo) &&
    isKobo(q.fee.totalFeeKobo) &&
    q.fee.totalFeeKobo === q.fee.providerFeeKobo + q.fee.wawuFeeKobo &&
    Array.isArray(q.kinds);
  if (!ok) throw unreadable('card fee');
  return q as CardQuote;
}

/** GET /money/cards/{id}. */
export async function fetchCard(id: string): Promise<Card> {
  const body = (await unwrap(api.GET('/api/hub/money/cards/{id}', { params: { path: { id } } }))) as unknown as Envelope<Card>;
  return readCard(body?.data);
}

/** GET /money/cards/{id}/transactions. A row with no whole-cent amount is left out, never drawn as 0. */
export async function fetchCardTransactions(id: string, cursor?: string): Promise<CardTransactionPage> {
  const body = (await unwrap(
    api.GET('/api/hub/money/cards/{id}/transactions', {
      params: {
        path: { id },
        query: { limit: 20, ...(cursor ? { cursor } : {}) },
      },
    }),
  )) as unknown as Envelope<CardTransactionPage>;
  const page = body?.data;
  if (!page || !Array.isArray(page.items)) throw unreadable('card payments');
  return {
    items: page.items.filter((t) => filled(t?.id) && typeof t.amountCents === 'number' && Number.isSafeInteger(t.amountCents) && t.amountCents >= 0),
    nextCursor: filled(page.nextCursor) ? page.nextCursor : null,
  };
}

/** What a call that needs the person's approval came to: its answer, one of the Hub's refusals, or the phone's own stop. */
export type CardOutcome<T> = { kind: 'done'; value: T } | Refusal | ApprovalStopped;

const FALLBACK = 'That was not done. Nothing was taken from your wallet.';
const FUNDS = 'There is not enough in your wallet for the card fee.';

export type CreateCardInput = {
  kind: CardKind;
  name?: string;
  key: string;
} & Credential;

/**
 * POST /money/cards. Never rejects: whatever came back (or did not) is a `CardOutcome`. A request that got no answer, and every 5xx, is
 * `unanswered`: the card may exist, so only the SAME key and body are sent again (the Hub finds a card it already made, never a second).
 */
export async function createCard(input: CreateCardInput): Promise<CardOutcome<Card>> {
  const body = {
    kind: input.kind,
    ...(input.name?.trim() ? { name: input.name.trim() } : {}),
  };
  const headed = await credentialHeader(input, {
    method: 'POST',
    path: '/api/hub/money/cards',
    body,
  });
  if ('outcome' in headed) return headed.outcome;
  let result;
  try {
    result = await api.POST('/api/hub/money/cards', {
      params: { header: { ...headed.header, 'Idempotency-Key': input.key } },
      body,
      fetch: resendsUnderKey,
    });
  } catch {
    return { kind: 'unanswered' };
  }
  const { data, error, response } = result;
  if (response.status === HTTP_CREATED) {
    try {
      return {
        kind: 'done',
        value: readCard((data as unknown as Envelope<Card> | undefined)?.data),
      };
    } catch {
      // The Hub said created and the answer cannot be read: the card may exist, so it is not a refusal.
      return { kind: 'unanswered' };
    }
  }
  if (approvalRefused(error)) return { kind: 'approval_failed' };
  return readRefusal(response.status, error, FALLBACK, FUNDS);
}

function readDetails(value: unknown): CardDetails | null {
  const d = value as Partial<CardDetails> | null;
  if (!d || typeof d !== 'object') return null;
  if (!filled(d.number) || !/^\d{12,19}$/.test(d.number) || !filled(d.cvv) || !filled(d.expiryMonth) || !filled(d.expiryYear)) return null;
  return d as CardDetails;
}

/** POST /money/cards/{id}/reveal. Never rejects. The answer is for the screen to show and forget; it is never put in a query cache. */
export async function revealCard(id: string, credential: Credential): Promise<CardOutcome<CardDetails>> {
  const headed = await credentialHeader(credential, {
    method: 'POST',
    path: `/api/hub/money/cards/${part(id)}/reveal`,
  });
  if ('outcome' in headed) return headed.outcome;
  let result;
  try {
    result = await api.POST('/api/hub/money/cards/{id}/reveal', {
      params: { path: { id }, header: { ...headed.header } },
    });
  } catch {
    return { kind: 'unanswered' };
  }
  const { data, error, response } = result;
  if (response.status === 200) {
    const details = readDetails((data as unknown as Envelope<CardDetails> | undefined)?.data);
    return details ? { kind: 'done', value: details } : { kind: 'unanswered' };
  }
  if (approvalRefused(error)) return { kind: 'approval_failed' };
  return readRefusal(response.status, error, 'Your card details could not be shown. Try again.', FUNDS);
}

/** POST /money/cards/{id}/unfreeze, behind the PIN or a fingerprint. Never rejects. */
export async function unfreezeCard(id: string, credential: Credential): Promise<CardOutcome<Card>> {
  const headed = await credentialHeader(credential, {
    method: 'POST',
    path: `/api/hub/money/cards/${part(id)}/unfreeze`,
  });
  if ('outcome' in headed) return headed.outcome;
  let result;
  try {
    result = await api.POST('/api/hub/money/cards/{id}/unfreeze', {
      params: { path: { id }, header: { ...headed.header } },
    });
  } catch {
    return { kind: 'unanswered' };
  }
  const { data, error, response } = result;
  if (response.status === 200) {
    try {
      return {
        kind: 'done',
        value: readCard((data as unknown as Envelope<Card> | undefined)?.data),
      };
    } catch {
      return { kind: 'unanswered' };
    }
  }
  if (approvalRefused(error)) return { kind: 'approval_failed' };
  return readRefusal(response.status, error, 'The card was not unfrozen. Try again.', FUNDS);
}

/** POST /money/cards/{id}/freeze. Needs no PIN. Rejects with the Hub's reason. */
export async function freezeCard(id: string): Promise<Card> {
  const body = (await unwrap(api.POST('/api/hub/money/cards/{id}/freeze', { params: { path: { id } } }))) as unknown as Envelope<Card>;
  return readCard(body?.data);
}

/** DELETE /money/cards/{id}: blocks the card for good. Needs no PIN. Rejects with the Hub's reason. */
export async function blockCard(id: string): Promise<Card> {
  const body = (await unwrap(api.DELETE('/api/hub/money/cards/{id}', { params: { path: { id } } }))) as unknown as Envelope<Card>;
  return readCard(body?.data);
}
