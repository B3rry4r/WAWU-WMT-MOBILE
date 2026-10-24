import { APP_NAME } from '@/components/BrandMark';
import { formatMoney } from '@/components/Money';

import type { Card, CardKind, CardTransaction } from './api';

/** The words of the card screens. The board's copy where Nuvion serves what it says; nothing about a Physical card, a card PIN, ATMs or limits (R-47, R-84). */
export const WORDS = {
  title: `${APP_NAME} card`,
  getTitle: `Get your ${APP_NAME} card`,
  getBody: 'A dollar card for online payments. It spends from your Naira balance and is converted when you use it.',
  pendingTitle: 'Your card is being made',
  frozenTitle: 'Card frozen',
  frozenBody: 'Payments are blocked. Your wallet balance isn’t affected.',
  blockedTitle: 'Card blocked',
  blockedBody: 'This card can’t be used again. Get a new card if you still need one.',
  usedTitle: 'Card used',
  usedBody: 'This single-use card was used once and can’t be used again. Get a new card if you still need one.',
  getNew: 'Get a new card',
  spendsFrom: 'Spends from Naira wallet',
  spending: 'Card spending',
  noSpending: 'No payments on this card yet.',
  freeze: 'Freeze',
  unfreeze: 'Unfreeze card',
  details: 'Details',
  hideDetails: 'Hide details',
  block: 'Card lost or stolen? Block it',
  blockSheetTitle: 'Block this card?',
  blockSheetBody: 'A blocked card can’t be used again and can’t be brought back. Your wallet balance isn’t affected.',
  blockConfirm: 'Block card',
  keep: 'Keep card',
  getAnother: 'Get another card',
  feeNote: 'Taken from your Naira wallet when your card is made.',
  bankCharge: 'Bank charge',
  wawuFee: 'WAWU’s fee',
  total: 'Total',
  limitReached: 'You have the most cards one person can hold. Block one to get another.',
  off: 'Cards are not available right now.',
  noFee: 'Cards are not ready yet.',
} as const;

export const KIND_ROWS: readonly {
  kind: CardKind;
  title: string;
  line: string;
  icon: 'CreditCard' | 'Zap';
}[] = [
  {
    kind: 'virtual',
    title: 'Virtual card',
    line: 'For online payments, use it again and again',
    icon: 'CreditCard',
  },
  {
    kind: 'single_use',
    title: 'Single-use card',
    line: 'Stops working after one payment',
    icon: 'Zap',
  },
];

export const kindTitle = (kind: CardKind): string => (kind === 'single_use' ? 'Single-use card' : 'Virtual card');

export function getButtonLabel(kind: CardKind): string {
  return kind === 'single_use' ? 'Get single-use card' : 'Get virtual card';
}

/** The row's second line on the list: what the card is doing. */
export function statusLine(card: Pick<Card, 'status' | 'frozenBySupport'>): string {
  switch (card.status) {
    case 'active':
      return 'Active';
    case 'frozen':
      return card.frozenBySupport ? 'Frozen by support' : 'Frozen';
    case 'blocked':
      return 'Blocked';
    case 'used':
      return 'Used';
    default:
      return 'Being made';
  }
}

/** A card that is, or is about to be, usable: the ones a person still has something to do with. */
export const isLive = (card: Pick<Card, 'status'>): boolean => card.status === 'active' || card.status === 'frozen' || card.status === 'pending';

/**
 * Whether W1's row and W35's Cards row are drawn. While cards are on, always. While they are off (the Hub keeps freeze and block working),
 * only for a person who still holds a live card, so they can stop it from the app (round 1, L5).
 */
export const cardsShown = (list: { enabled: boolean; cards: readonly Pick<Card, 'status'>[] }): boolean => list.enabled || list.cards.some(isLive);

/** The second line of W1's row: the card that matters, or how to get one when none is left (round 1, L4). */
export function summaryLine(cards: readonly Pick<Card, 'kind' | 'status' | 'last4' | 'frozenBySupport'>[], withStatus: boolean): string {
  const first = cards.find(isLive);
  if (!first) return cards.length > 0 ? WORDS.getNew : 'Get your card';
  return [kindTitle(first.kind), first.last4 ? `••${first.last4}` : null, withStatus ? statusLine(first) : null].filter(Boolean).join(' · ');
}

export const usd = (cents: number, sign = false): string => formatMoney(cents, { currency: 'USD', sign });

/** "4111 1111 1111 1234": four by four, as a card prints it. */
export function groupedCardNumber(digits: string): string {
  return digits.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** "09/28". */
export const expiryLine = (month: string, year: string): string => `${month.padStart(2, '0')}/${year.slice(-2).padStart(2, '0')}`;

/** What a card payment row says first: the merchant, else the narration, else the kind of movement. */
export function transactionTitle(t: Pick<CardTransaction, 'kind' | 'merchant' | 'narration'>): string {
  if (t.kind === 'reversal') return 'Payment reversed';
  if (t.kind === 'refund') return 'Refund';
  return t.merchant?.trim() || t.narration?.trim() || 'Card payment';
}

/** Money out is a minus; a reversal or a refund is money back. */
export const transactionAmount = (t: Pick<CardTransaction, 'kind' | 'amountCents'>): string =>
  t.kind === 'purchase' ? usd(-t.amountCents) : usd(t.amountCents, true);

/** "Today", "Yesterday", or the day and month. */
export function whenLine(iso: string | null | undefined, now: Date): string {
  if (!iso) return '';
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return '';
  const day = (d: Date) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
  const ago = day(now) - day(at);
  if (ago === 0) return 'Today';
  if (ago === 1) return 'Yesterday';
  return at.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

/** The fee lines a quote shows: the bank's charge always (even at 0, it is what the issuer takes), WAWU's only when there is one. */
export function feeRows(fee: { providerFeeKobo: number; wawuFeeKobo: number; totalFeeKobo: number }): { label: string; kobo: number }[] {
  const rows: { label: string; kobo: number }[] = [{ label: WORDS.bankCharge, kobo: fee.providerFeeKobo }];
  if (fee.wawuFeeKobo > 0) rows.push({ label: WORDS.wawuFee, kobo: fee.wawuFeeKobo });
  return rows;
}

/** How long the card's number stays on screen after the PIN. Default (agent), owner may override. */
export const REVEAL_MS = 30_000;
