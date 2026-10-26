import type { components } from '@/api/schema.generated';

import type { Refusal } from './api';

/**
 * Send abroad (NUV-11, R-84): the words and the pure rules of the screens. No board draws this flow, so it is built from naira Send's
 * parts (W7 to W12) and filed for the designer (R-29, BACKEND_GAPS G-NUV-11-1). Every figure is the Hub's: a `...Minor` amount beside
 * its currency and `decimals`; the app never invents a rate, a fee or a field.
 */

export type Corridors = components['schemas']['AbroadCorridorsView'];
export type Country = components['schemas']['AbroadCountryView'];
export type Rail = components['schemas']['AbroadRailView'];
export type Scheme = components['schemas']['AbroadSchemeView'];
export type Field = components['schemas']['AbroadFieldView'];
export type Bank = components['schemas']['AbroadBankView'];
export type Source = components['schemas']['AbroadSourceView'];
export type Recipient = components['schemas']['AbroadRecipientView'];
export type Quote = components['schemas']['AbroadQuoteView'];
export type AbroadSend = components['schemas']['AbroadSendView'];

export const SCREEN_TITLE = 'Send abroad';
/** Shown only when the Hub has no partner fee for the route (`providerFeeMinor` null); otherwise the fee is a row of its own (R-10). */
export const PROVIDER_FEE_LINE = "The payment partner's fee is shown on the receipt once it takes the send.";

const SYMBOLS: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
  CAD: 'CA$',
  AUD: 'A$',
  GHS: 'GH₵',
  ZAR: 'R',
};

/** "$100.00", "GH₵1,003.61", "KES 6,328.44": the Hub's integer in the currency's smallest unit, with the decimals it names. */
export function formatMinor(minor: number, currency: string, decimals = 2): string {
  const negative = minor < 0;
  const total = Math.abs(Math.round(minor));
  const unit = 10 ** decimals;
  const whole = Math.floor(total / unit)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fraction = decimals > 0 ? `.${String(total % unit).padStart(decimals, '0')}` : '';
  const symbol = SYMBOLS[currency];
  return `${negative ? '-' : ''}${symbol ?? `${currency} `}${whole}${fraction}`;
}

/**
 * What leaves the account the money is sent from (R-10: the person pays the partner's fee and WAWU's on top). The amount, the partner's
 * fee and, for a person with no naira wallet (WALLET-42), WAWU's fee are in the sending currency; the naira fee joins the total only
 * when the money comes from the naira wallet, and is its own row otherwise. Null when the Hub names no partner fee for the route: no
 * total is drawn from a guess.
 */
export function totalFromAccount(
  quote: Pick<Quote, 'amountFromMinor' | 'providerFeeMinor' | 'wawuFeeKobo' | 'fromCurrency'> & { wawuFeeMinor?: number },
): number | null {
  if (quote.providerFeeMinor === null) return null;
  return quote.amountFromMinor + quote.providerFeeMinor + (quote.fromCurrency === 'NGN' ? quote.wawuFeeKobo : 0) + (quote.wawuFeeMinor ?? 0);
}

/**
 * WAWU's fee as the review and the receipt say it, in the currency it is taken in: the sending currency when the Hub took it from the
 * foreign account (`wawuFeeMinor`, WALLET-42), naira when it comes from the naira wallet, and a zero in the account the money leaves
 * when there is none (a person with no naira wallet is never shown a naira figure).
 */
export function wawuFeeText(fee: { wawuFeeKobo: number; wawuFeeMinor?: number; fromCurrency: string; fromDecimals: number }): string {
  const minor = fee.wawuFeeMinor ?? 0;
  if (minor > 0) return formatMinor(minor, fee.fromCurrency, fee.fromDecimals);
  if (fee.wawuFeeKobo > 0) return formatMinor(fee.wawuFeeKobo, 'NGN');
  return fee.fromCurrency === 'NGN' ? formatMinor(0, 'NGN') : formatMinor(0, fee.fromCurrency, fee.fromDecimals);
}

/** The places a typed amount takes when a currency's own are not known yet: two, as every currency Nuvion pays today has. */
export const KEYPAD_DECIMALS = 2;

/**
 * The amount as it is being typed, in the currency's own sign: the whole part grouped by thousands ("£1,250") and, once a point is
 * typed, the places padded to the currency's decimals ("£0.50"), as the figures in the quote read. Nothing typed is "0".
 */
export function typedAmountLine(currency: string, text: string, decimals: number): string {
  const sign = formatMinor(0, currency, decimals).replace(/[0-9.,]+$/, '');
  const [whole = '', fraction] = text.split('.');
  const grouped = (whole === '' ? '0' : whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}${grouped}${fraction === undefined || decimals <= 0 ? '' : `.${fraction.padEnd(decimals, '0')}`}`;
}

/**
 * The sentence for an amount the corridor will not take. The Hub always sends the least a corridor delivers, and the most when it has
 * one, so the tail must follow which way the amount went: under the least says the least, over the most says the most. Which way is
 * read from what was typed when they receive that amount, else from the Hub's own first sentence ("less than" or "more than"); a corridor
 * with no most can only have been under its least. With no word on the way, the whole range is given. Figures are the recipient's currency.
 */
export function rangeLine(r: Refusal, side: 'send' | 'receive', amountMinor: number, fallbackCurrency: string, decimals = 2): string {
  const money = (minor: number) => formatMinor(minor, r.currency ?? fallbackCurrency, decimals);
  const said = r.message.toLowerCase();
  let way: 'under' | 'over' | null = null;
  if (side === 'receive' && r.minimumMinor !== null && amountMinor < r.minimumMinor) way = 'under';
  else if (side === 'receive' && r.maximumMinor !== null && amountMinor > r.maximumMinor) way = 'over';
  else if (said.includes('less than')) way = 'under';
  else if (said.includes('more than')) way = 'over';
  else if (r.maximumMinor === null) way = 'under';
  const first = (word: string) => (r.message.trim() ? r.message.trim() : `That is ${word} this corridor can deliver.`);
  if (way === 'under' && r.minimumMinor !== null) return `${r.message.trim() && said.includes('less than') ? r.message.trim() : 'That is less than this corridor can deliver.'} The least they can get is ${money(r.minimumMinor)}.`;
  if (way === 'over') {
    const head = r.message.trim() && said.includes('more than') ? r.message.trim() : 'That is more than this corridor can deliver.';
    return r.maximumMinor === null ? head : `${head} The most they can get is ${money(r.maximumMinor)}.`;
  }
  if (r.minimumMinor !== null && r.maximumMinor !== null) return `${first('outside what')} This corridor delivers from ${money(r.minimumMinor)} to ${money(r.maximumMinor)}.`;
  return first('outside what');
}

/** An amount typed in the sending currency that is more than the account holds: said before the Hub is asked. */
export function overBalanceLine(accountName: string, availableMinor: number, currency: string, decimals: number): string {
  return `That is more than the ${formatMinor(availableMinor, currency, decimals)} in your ${accountName}.`;
}

export function speedLine(speed: string): string {
  return speed === 'Instant' ? 'Arrives in minutes' : `Arrives: ${speed.charAt(0).toLowerCase()}${speed.slice(1)}`;
}

export type StatusLook = {
  label: string;
  tone: 'positive' | 'warning' | 'danger' | 'neutral';
  line: string;
};

/** What a send's status says to a person, in words that never name the provider. */
export function statusLook(status: AbroadSend['status']): StatusLook {
  switch (status) {
    case 'completed':
      return {
        label: 'Delivered',
        tone: 'positive',
        line: 'The money has reached the recipient.',
      };
    case 'pending':
      return {
        label: 'On its way',
        tone: 'warning',
        line: 'The payment partner has your send and is delivering it.',
      };
    case 'sending':
      return {
        label: 'Sending',
        tone: 'warning',
        line: 'We are still confirming this send. You do not need to send it again.',
      };
    case 'needs_review':
      return {
        label: 'Being checked',
        tone: 'warning',
        line: 'We are checking this send with the payment partner. You do not need to send it again.',
      };
    case 'reversed':
      return {
        label: 'Returned',
        tone: 'neutral',
        line: 'This send was returned to your account.',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        tone: 'neutral',
        line: 'This send was cancelled before it left. Nothing was taken.',
      };
    case 'failed':
      return {
        label: 'Did not go through',
        tone: 'danger',
        line: 'This send did not go through.',
      };
  }
}

export const isSettled = (status: AbroadSend['status']): boolean => ['completed', 'failed', 'reversed', 'cancelled'].includes(status);

/** A field's value fits its pattern (the Hub's own, sent with the field); the same text the Hub checks again. */
export function fieldProblem(field: Field, raw: string): string | null {
  const value = raw.trim();
  if (value === '') return `Enter the ${field.label.toLowerCase()}.`;
  const squeezed =
    field.kind === 'digits' || field.kind === 'phone' || field.key === 'iban' || field.key === 'swift_bic' ? value.replace(/[\s\-()]/g, '') : value;
  if (field.pattern && !new RegExp(field.pattern).test(squeezed)) {
    return field.hint ? `${field.label}: ${field.hint}.` : `Check the ${field.label.toLowerCase()}.`;
  }
  if (field.options && !field.options.some((o) => o.value === value)) return `Choose the ${field.label.toLowerCase()}.`;
  return null;
}

/** The fields of a chosen country, way and scheme, as the Hub drew them. */
export function fieldsOf(rail: Rail, scheme: string | null): Field[] {
  const s = rail.schemes.find((x) => x.id === scheme) ?? rail.schemes[0];
  return s ? s.fields : [];
}

export function methodLabel(rail: Rail): string {
  return rail.method === 'mobile_money' ? 'Mobile money' : 'Bank account';
}

/** The sentence under the amount: what they get, to whom. */
export function approvalPurpose(
  quote: Pick<Quote, 'amountFromMinor' | 'fromCurrency' | 'fromDecimals'>,
  recipient: Pick<Recipient, 'holderName' | 'countryName'>,
): string {
  return `Send ${formatMinor(quote.amountFromMinor, quote.fromCurrency, quote.fromDecimals)} to ${recipient.holderName} in ${recipient.countryName}`;
}

export function rateLine(quote: Pick<Quote, 'rate' | 'fromCurrency' | 'toCurrency'>): string | null {
  return quote.rate ? `1 ${quote.fromCurrency} = ${quote.rate} ${quote.toCurrency}` : null;
}

/** A quote read from a route param. Anything that is not a whole quote is refused: the Hub checks it again at the send anyway. */
export function readHeldQuote(raw: unknown): Quote | null {
  if (typeof raw !== 'string') return null;
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return null;
  }
  const q = v as Partial<Quote> | null;
  const whole = (n: unknown) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
  if (
    !q ||
    typeof q.id !== 'string' ||
    typeof q.recipientId !== 'string' ||
    typeof q.fromCurrency !== 'string' ||
    typeof q.toCurrency !== 'string' ||
    !whole(q.amountFromMinor) ||
    !whole(q.amountToMinor) ||
    !whole(q.fromDecimals) ||
    !whole(q.toDecimals) ||
    !whole(q.wawuFeeKobo) ||
    !(q.wawuFeeMinor === undefined || whole(q.wawuFeeMinor)) ||
    !(q.providerFeeMinor === null || whole(q.providerFeeMinor)) ||
    typeof q.expiresAt !== 'string' ||
    typeof q.speed !== 'string' ||
    typeof q.converted !== 'boolean'
  ) {
    return null;
  }
  return q as Quote;
}
