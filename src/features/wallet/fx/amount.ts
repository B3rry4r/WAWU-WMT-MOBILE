/**
 * Figures for the accounts that are not naira (WALLET-21, R-83, R-84).
 *
 * The Hub sends every amount that is not naira as an integer in the currency's smallest unit, in a field ending `Minor`, beside a
 * currency field, and says how many places that unit has (`decimals`, per currency). Nothing here uses a float for money: a figure is
 * split and joined by whole-number arithmetic only (a rate is shown with `toFixed`, and it is never used to work out an amount).
 * Naira stays kobo (`Kobo`), with two places.
 */

/** A currency a quote can name: the naira wallet, a foreign currency, or a stablecoin. */
export type QuoteCode = 'NGN' | 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AED' | 'GHS' | 'USDT' | 'USDC' | 'RLUSD';
/** A currency an account is held in (the naira wallet is not one of these accounts). */
export type FxCode = Exclude<QuoteCode, 'NGN'>;
export type FxChain = 'eth' | 'base' | 'matic' | 'sol';

export const NAIRA_DECIMALS = 2;

const COINS: readonly QuoteCode[] = ['USDT', 'USDC', 'RLUSD'];
export const isCoin = (code: QuoteCode): boolean => COINS.includes(code);

/** The sign drawn before a figure; a stablecoin has none and is written with its code after the figure. */
const SIGNS: Record<Exclude<QuoteCode, 'USDT' | 'USDC' | 'RLUSD'>, string> = {
  NGN: '₦',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AED: 'AED ',
  GHS: 'GH₵',
};

/** The person's word for each currency in a tab and a picker. The Hub's own `name` is used where it is served. */
export const SHORT_NAME: Record<QuoteCode, string> = {
  NGN: 'Naira',
  USD: 'Dollar',
  EUR: 'Euro',
  GBP: 'Pound',
  CAD: 'Canadian dollar',
  AED: 'Dirham',
  GHS: 'Cedi',
  USDT: 'Tether',
  USDC: 'USD Coin',
  RLUSD: 'Ripple USD',
};

export function signOf(code: QuoteCode): string {
  return isCoin(code) ? '' : SIGNS[code as keyof typeof SIGNS];
}

const group = (whole: string): string => whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** The whole part (grouped by thousands) and the fraction of an integer in smallest units. */
export function splitMinor(minor: number, decimals: number): { negative: boolean; whole: string; fraction: string } {
  const total = Math.abs(Math.round(minor));
  if (decimals <= 0) return { negative: minor < 0, whole: group(String(total)), fraction: '' };
  const text = String(total).padStart(decimals + 1, '0');
  return { negative: minor < 0, whole: group(text.slice(0, -decimals)), fraction: text.slice(-decimals) };
}

/** "$1,240.50", "−$200.00", "+€12.00", "320.00 USDT", "AED 12.00": a figure as a plain string. */
export function formatMinor(minor: number, code: QuoteCode, decimals: number, opts: { sign?: boolean; places?: boolean } = {}): string {
  const p = splitMinor(minor, decimals);
  const lead = p.negative ? '−' : opts.sign && minor > 0 ? '+' : '';
  const body = `${p.whole}${p.fraction && opts.places !== false ? `.${p.fraction}` : ''}`;
  return isCoin(code) ? `${lead}${body} ${code}` : `${lead}${signOf(code)}${body}`;
}

/** What a screen reader says for a figure: the words of the currency, never the sign. */
export function spokenMinor(minor: number, code: QuoteCode, decimals: number): string {
  const p = splitMinor(minor, decimals);
  return `${p.negative ? 'minus ' : ''}${p.whole}${p.fraction ? ` point ${p.fraction.split('').join(' ')}` : ''} ${SHORT_NAME[code]}`;
}

/** The most whole digits one typed amount takes. */
const MAX_WHOLE_DIGITS = 9;

/** The text after one key on the keypad, with `decimals` places allowed after the point (none: no point key is taken). */
export function pressAmountKey(text: string, key: string, decimals: number): string {
  if (key === '.') {
    if (decimals <= 0 || text.includes('.')) return text;
    return text === '' ? '0.' : `${text}.`;
  }
  if (!/^[0-9]$/.test(key)) return text;
  const point = text.indexOf('.');
  if (point >= 0) return text.length - point - 1 >= decimals ? text : text + key;
  if (text === '0') return key === '0' ? text : key;
  return text.length >= MAX_WHOLE_DIGITS ? text : text + key;
}

export const deleteLastKey = (text: string): string => text.slice(0, -1);

/** The smallest-unit integer a typed text stands for; 0 for no text. Whole numbers only. */
export function minorOfText(text: string, decimals: number): number {
  if (text === '' || text === '.') return 0;
  const [whole = '', fraction = ''] = text.split('.');
  const places = fraction.padEnd(decimals, '0').slice(0, decimals);
  return Number(whole === '' ? '0' : whole) * 10 ** decimals + (places === '' ? 0 : Number(places));
}

/** The text that shows `minor` typed ("120", "120.5"): what Max puts in the field. */
export function textOfMinor(minor: number, decimals: number): string {
  if (!Number.isSafeInteger(minor) || minor <= 0) return '';
  const p = splitMinor(minor, decimals);
  const whole = p.whole.replace(/,/g, '');
  const fraction = p.fraction.replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole;
}

/** The typed text as it reads on the amount line, grouped by thousands ("158,000", "1,240.5"). */
export function typedDisplay(text: string): string {
  const [whole = '', fraction] = text.split('.');
  return `${group(whole === '' ? '0' : whole)}${fraction === undefined ? '' : `.${fraction}`}`;
}

export const CHAIN_NAME: Record<FxChain, string> = { eth: 'Ethereum', base: 'Base', matic: 'Polygon', sol: 'Solana' };
export const chainName = (chain: FxChain): string => CHAIN_NAME[chain];

/** "Ethereum, Base": the chains of one coin's accounts, in the order given. */
export const chainList = (chains: readonly FxChain[]): string => chains.map(chainName).join(', ');

/** m:ss for the seconds a quote is still held; never below 0:00. */
export function holdClock(secondsLeft: number): string {
  const s = Math.max(0, Math.floor(secondsLeft));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Seconds from `now` (ms) to an ISO time; 0 once passed or unreadable. Rounded up, so it never reads 0:00 while the quote still holds. */
export function secondsUntil(iso: string, now: number): number {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return 0;
  return Math.max(0, Math.ceil((at - now) / 1000));
}

type RatedQuote = {
  fromCurrency: QuoteCode;
  toCurrency: QuoteCode;
  fromDecimals: number;
  toDecimals: number;
  rate: string;
};

/**
 * The rate as a person reads it: one unit of the foreign side in the other ("$1 = ₦1,580.00"; from two foreign currencies, one unit of
 * what is given). The Hub's `rate` is units of `toCurrency` per unit of `fromCurrency`, both smallest units. Null when it is not a
 * positive number (the screen then shows no rate rather than a made-up one). The figure is for reading only.
 */
export function rateLine(q: RatedQuote): string | null {
  const r = Number(q.rate);
  if (!Number.isFinite(r) || r <= 0) return null;
  const perFrom = r * 10 ** (q.fromDecimals - q.toDecimals);
  const baseIsFrom = q.fromCurrency !== 'NGN';
  const base = baseIsFrom ? q.fromCurrency : q.toCurrency;
  const other = baseIsFrom ? q.toCurrency : q.fromCurrency;
  const value = baseIsFrom ? perFrom : 1 / perFrom;
  const otherDecimals = baseIsFrom ? q.toDecimals : q.fromDecimals;
  const places = value >= 1 ? Math.min(otherDecimals, 2) : Math.min(Math.max(otherDecimals, 2), 4);
  const [whole = '0', fraction] = value.toFixed(places).split('.');
  const grouped = group(whole) + (fraction === undefined ? '' : `.${fraction}`);
  const one = isCoin(base) ? `1 ${base}` : `${signOf(base)}1`;
  const there = isCoin(other) ? `${grouped} ${other}` : `${signOf(other)}${grouped}`;
  return `${one} = ${there}`;
}

/** The currency as a word in a sentence ("Open a dollar account"), and its plural ("Add dollars"). */
export const WORD: Record<QuoteCode, string> = {
  NGN: 'naira',
  USD: 'dollar',
  EUR: 'euro',
  GBP: 'pound',
  CAD: 'Canadian dollar',
  AED: 'dirham',
  GHS: 'cedi',
  USDT: 'USDT',
  USDC: 'USDC',
  RLUSD: 'RLUSD',
};
export const WORDS: Record<QuoteCode, string> = {
  NGN: 'naira',
  USD: 'dollars',
  EUR: 'euros',
  GBP: 'pounds',
  CAD: 'Canadian dollars',
  AED: 'dirhams',
  GHS: 'cedis',
  USDT: 'USDT',
  USDC: 'USDC',
  RLUSD: 'RLUSD',
};

/**
 * What a button and a title say: the naira without kobo when there are none ("₦158,000", as the PIN sheet writes it), and every other
 * currency with its own places ("$100.00", "120.00 USDT"), as the board draws "Swap ₦158,000 for $100.00".
 */
export function formatTrim(minor: number, code: QuoteCode, decimals: number): string {
  if (code !== 'NGN') return formatMinor(minor, code, decimals);
  const p = splitMinor(minor, decimals);
  const zero = p.fraction === '' || /^0+$/.test(p.fraction);
  return formatMinor(minor, code, decimals, { places: !zero });
}
