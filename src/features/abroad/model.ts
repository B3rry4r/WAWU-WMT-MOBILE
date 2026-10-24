import type { components } from '@/api/schema.generated';

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
export const WALLET_FEE_NOTE = 'Nuvion names its fee only when it takes the send, so the receipt shows what was charged.';
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

/** The kobo parser of the keypad reads two decimals; so does every currency Nuvion pays (`decimals` 2). */
export const KEYPAD_DECIMALS = 2;

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
    typeof q.expiresAt !== 'string' ||
    typeof q.speed !== 'string' ||
    typeof q.converted !== 'boolean'
  ) {
    return null;
  }
  return q as Quote;
}
