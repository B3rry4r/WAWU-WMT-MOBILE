import { api } from '@/api/client';
import type { components } from '@/api/schema.generated';
import { filled, isKobo, readData, readPaymentQuote, sendPayment, unreadable, type PayOutcome } from '@/features/feedpay/payCall';

/**
 * The calls behind tipping a creator from the wallet (HOME-13: H26, H27, H28), as the Hub's contract types them (HOME-14):
 * - `GET /tips/wallet/quote?creatorWawuId=&amountKobo=`: H26's breakdown before the PIN: the tip, the bank's charge, the total,
 *   the wallet's balance and the signed quote the payment must carry. Nothing is reserved. Asked again on every tap of Tip.
 * - `POST /tips/wallet`: sends the tip once, with an optional note. The PIN is the `X-Transaction-Pin` header and nothing else
 *   keeps it; the `Idempotency-Key` is one per attempt and travels again, unchanged, on every retry.
 * - `GET /tips/wallet/{id}`: the tip as it stands now: what the app polls after `pending`.
 */
export type TipQuote = components['schemas']['TipWalletQuoteView'];
export type Tip = components['schemas']['TipWalletView'];

const STATUSES: readonly Tip['status'][] = ['pending', 'failed', 'reversed', 'refunded', 'paid'];

export const tipKey = (id: string) => ['money', 'tips', 'wallet', id] as const;

/** A quote the sheet can draw and the payment can carry: the creator, a whole-kobo amount and a readable payment quote. */
export function readTipQuote(value: unknown): TipQuote {
  const q = value as Partial<TipQuote> | null;
  if (!q || typeof q !== 'object' || !q.creator || !filled(q.creator.wawuUserId) || !isKobo(q.amountKobo)) throw unreadable('price');
  return { creator: q.creator, amountKobo: q.amountKobo, payment: readPaymentQuote(q.payment) };
}

/** A tip as the screens read it: a known status, the creator, a whole-kobo amount and the payment under it. */
export function readTip(value: unknown): Tip {
  const t = value as Partial<Tip> | null;
  const ok =
    t &&
    typeof t === 'object' &&
    filled(t.id) &&
    STATUSES.includes(t.status as Tip['status']) &&
    !!t.creator &&
    isKobo(t.amountKobo) &&
    !!t.payment &&
    filled(t.payment.status) &&
    typeof t.payment.delivered === 'boolean' &&
    isKobo(t.payment.totalKobo) &&
    isKobo(t.payment.priceKobo) &&
    !!t.payment.fee;
  if (!ok) throw unreadable('tip');
  return t as Tip;
}

/** GET /tips/wallet/quote. Rejects with the shared `ApiError`: `wallet_not_open` leads to Open your wallet, the rest carry the Hub's sentence. */
export async function askTipQuote(input: { creatorWawuId: string; amountKobo: number }): Promise<TipQuote> {
  return readTipQuote(
    await readData(api.GET('/api/hub/tips/wallet/quote', { params: { query: { creatorWawuId: input.creatorWawuId, amountKobo: input.amountKobo } } }), 'price'),
  );
}

/** GET /tips/wallet/{id}: our own records only; the Hub never asks the provider. */
export async function fetchTip(id: string): Promise<Tip> {
  return readTip(await readData(api.GET('/api/hub/tips/wallet/{id}', { params: { path: { id } } }), 'tip'));
}

export type SendTipInput = {
  creatorWawuId: string;
  amountKobo: number;
  /** Left out when empty. */
  note: string;
  /** The quote's `payment.totalKobo` and `payment.quoteToken`, as the person saw them. */
  expectedTotalKobo: number;
  quoteToken: string;
  key: string;
  pin: string;
};

/** POST /tips/wallet. Never rejects: whatever came back (or did not) is a `PayOutcome`. */
export function sendTip(input: SendTipInput): Promise<PayOutcome<Tip>> {
  const note = input.note.trim();
  return sendPayment(
    () =>
      api.POST('/api/hub/tips/wallet', {
        params: { header: { 'X-Transaction-Pin': input.pin, 'Idempotency-Key': input.key } },
        body: {
          creatorWawuId: input.creatorWawuId,
          amountKobo: input.amountKobo,
          ...(note ? { note } : {}),
          expectedTotalKobo: input.expectedTotalKobo,
          quoteToken: input.quoteToken,
        },
      }),
    readTip,
    'There is not enough in your wallet for this tip.',
  );
}
