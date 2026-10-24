import { api, resendsUnderKey } from '@/api/client';
import type { components } from '@/api/schema.generated';
import { part, type Credential } from '@/features/device-approval/credential';
import { filled, isKobo, readData, readPaymentQuote, sendPayment, unreadable, type PayOutcome } from '@/features/feedpay/payCall';

/**
 * The calls behind unlocking a piece from the wallet (HOME-12: H14 to H18), as the Hub's contract types them (HOME-15):
 * - `GET /content/{id}/unlock/wallet/quote`: H14's price, the bank's charge, the total, the wallet's balance and the signed quote
 *   the payment must carry. Nothing is reserved. Asked again on every tap of Pay.
 * - `POST /content/{id}/unlock/wallet`: unlocks once. The PIN is the `X-Transaction-Pin` header and nothing else keeps it; the
 *   `Idempotency-Key` is one per attempt and travels again, unchanged, on every retry.
 * - `GET /content/{id}/unlock/wallet/{paymentId}`: the unlock as it stands now: what the app polls after `pending`.
 * - `GET /content/{id}/media`: the piece's frames and files as THIS viewer may see them (a photo set's frames after an unlock).
 */
export type UnlockQuote = components['schemas']['UnlockWalletQuoteView'];
export type Unlock = components['schemas']['UnlockWalletView'];
export type MediaDetails = components['schemas']['MediaDetails'];

const STATUSES: readonly Unlock['status'][] = ['pending', 'failed', 'reversed', 'refunded', 'paid'];

export const unlockKey = (contentId: string, paymentId: string) => ['money', 'unlock', 'wallet', contentId, paymentId] as const;

/**
 * A quote the sheet can draw and the payment can carry: the piece, its creator and a readable payment quote. A creator with no display
 * name is still a valid quote (every new creator starts without one): `unlockPayee` gives the name the sheet draws.
 */
export function readUnlockQuote(value: unknown): UnlockQuote {
  const q = value as Partial<UnlockQuote> | null;
  if (!q || typeof q !== 'object' || !filled(q.contentId) || !filled(q.title) || !q.creator || typeof q.creator !== 'object' || !isKobo(q.priceKobo)) {
    throw unreadable('price');
  }
  return { contentId: q.contentId, title: q.title, creator: q.creator, priceKobo: q.priceKobo, payment: readPaymentQuote(q.payment) };
}

/** An unlock as the screens read it: a known status, whole-kobo money and the payment under it. */
export function readUnlock(value: unknown): Unlock {
  const u = value as Partial<Unlock> | null;
  const ok =
    u &&
    typeof u === 'object' &&
    filled(u.id) &&
    filled(u.contentId) &&
    STATUSES.includes(u.status as Unlock['status']) &&
    isKobo(u.priceKobo) &&
    typeof u.purchased === 'boolean' &&
    !!u.payment &&
    filled(u.payment.status) &&
    typeof u.payment.delivered === 'boolean' &&
    isKobo(u.payment.totalKobo) &&
    isKobo(u.payment.priceKobo) &&
    !!u.payment.fee;
  if (!ok) throw unreadable('unlock');
  return u as Unlock;
}

/** GET the quote. Rejects with the shared `ApiError`: `wallet_not_open` leads to Open your wallet, `target_not_payable` and the rest carry the Hub's sentence. */
export async function askUnlockQuote(contentId: string): Promise<UnlockQuote> {
  return readUnlockQuote(await readData(api.GET('/api/hub/content/{id}/unlock/wallet/quote', { params: { path: { id: contentId } } }), 'price'));
}

/** GET one unlock: our own records only; the Hub never asks the provider. */
export async function fetchUnlock(contentId: string, paymentId: string): Promise<Unlock> {
  return readUnlock(await readData(api.GET('/api/hub/content/{id}/unlock/wallet/{paymentId}', { params: { path: { id: contentId, paymentId } } }), 'unlock'));
}

export type SendUnlockInput = {
  contentId: string;
  /** The quote's `payment.totalKobo` and `payment.quoteToken`, as the person saw them. */
  expectedTotalKobo: number;
  quoteToken: string;
  key: string;
} & Credential;

/** POST the unlock. Never rejects: whatever came back (or did not) is a `PayOutcome`. */
export function sendUnlock(input: SendUnlockInput): Promise<PayOutcome<Unlock>> {
  const body = { expectedTotalKobo: input.expectedTotalKobo, quoteToken: input.quoteToken };
  return sendPayment(
    input,
    { method: 'POST', path: `/api/hub/content/${part(input.contentId)}/unlock/wallet`, body },
    (header) =>
      api.POST('/api/hub/content/{id}/unlock/wallet', {
        params: { path: { id: input.contentId }, header: { ...header, 'Idempotency-Key': input.key } },
        body,
        fetch: resendsUnderKey,
      }),
    readUnlock,
    'There is not enough in your wallet to unlock this.',
  );
}

/** GET /content/{id}/media: the frames and files this viewer may see. Best effort: a failure leaves the feed's own media as it is. */
export async function fetchMedia(contentId: string): Promise<MediaDetails | null> {
  try {
    const media = await readData<MediaDetails>(api.GET('/api/hub/content/{id}/media', { params: { path: { id: contentId } } }), 'media');
    return Array.isArray(media.frames) ? media : null;
  } catch {
    return null;
  }
}
