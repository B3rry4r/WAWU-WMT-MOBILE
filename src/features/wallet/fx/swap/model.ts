import { chainName, formatMinor, NAIRA_DECIMALS, SHORT_NAME, type FxChain, type QuoteCode } from '../amount';
import type { FxAccount, FxCurrencies, FxQuote } from '../api';
import { COIN_ORDER, FIAT_ORDER, isCoinCode } from '../model';

/** One end of a swap: the naira wallet, or one of the person's accounts. */
export type Side = {
  key: string;
  code: QuoteCode;
  /** The account's id; null for the naira wallet. */
  accountId: string | null;
  chain: FxChain | null;
  /** "Naira", "Dollar", "USDT · Ethereum". */
  label: string;
  /** What the review says: "Naira wallet", "Dollar account", "USDT on Ethereum". */
  longLabel: string;
  decimals: number;
  /** The provider's balance; null when it could not be read. */
  availableMinor: number | null;
};

export const NAIRA_SIDE_KEY = 'NGN';

const sideOfAccount = (a: FxAccount): Side => {
  const code = a.currency as QuoteCode;
  const chain = a.chain as FxChain | null;
  const coin = isCoinCode(code);
  return {
    key: a.id,
    code,
    accountId: a.id,
    chain,
    label: coin && chain ? `${code} · ${chainName(chain)}` : SHORT_NAME[code],
    longLabel: coin && chain ? `${code} on ${chainName(chain)}` : `${SHORT_NAME[code]} account`,
    decimals: a.decimals,
    availableMinor: a.balance?.availableMinor ?? null,
  };
};

/**
 * The ends a swap can have: the naira wallet first, then each open account, currencies before coins, in the Hub's order. A person who
 * opened from outside Nigeria has no naira account (WALLET-41), so for them (`withNaira` false) a swap is between their own accounts.
 */
export function sidesOf(currencies: FxCurrencies | null, accounts: readonly FxAccount[] | null, nairaKobo: number | null, withNaira = true): Side[] {
  const naira: Side = {
    key: NAIRA_SIDE_KEY,
    code: 'NGN',
    accountId: null,
    chain: null,
    label: 'Naira',
    longLabel: 'Naira wallet',
    decimals: currencies?.naira.decimals ?? NAIRA_DECIMALS,
    availableMinor: nairaKobo,
  };
  const order = [...FIAT_ORDER, ...COIN_ORDER];
  const open = (accounts ?? []).filter((a) => a.status === 'open').sort((a, b) => order.indexOf(a.currency as never) - order.indexOf(b.currency as never));
  return [...(withNaira ? [naira] : []), ...open.map(sideOfAccount)];
}

/** The side a route's `from` or `to` code names: the first account in that currency (the naira wallet for NGN). */
export const sideForCode = (sides: readonly Side[], code: string | undefined): Side | undefined => (code ? sides.find((s) => s.code === code) : undefined);

/** What each end starts as: what the route named, else naira to the first account (or, with naira already taken, naira). */
export function startingSides(sides: readonly Side[], from: string | undefined, to: string | undefined): { from: Side | undefined; to: Side | undefined } {
  const naira = sides[0]?.code === 'NGN' ? sides[0] : undefined;
  if (!naira) {
    const a = sideForCode(sides, from) ?? sides[0];
    return { from: a, to: sideForCode(sides, to) && sideForCode(sides, to)?.key !== a?.key ? sideForCode(sides, to) : sides.find((s) => s.key !== a?.key) };
  }
  const first = sides.find((s) => s.code !== 'NGN');
  const a = sideForCode(sides, from) ?? (to && to !== 'NGN' ? naira : first && to === 'NGN' ? first : naira);
  const b = sideForCode(sides, to) ?? (a?.code === 'NGN' ? first : naira);
  return { from: a, to: b && b.key !== a?.key ? b : sides.find((s) => s.key !== a?.key) };
}

type FeeQuote = Pick<FxQuote, 'providerFeeMinor' | 'wawuFeeMinor' | 'fromCurrency' | 'fromDecimals'>;

/**
 * What the person pays for a swap, as the one line on W20: the two parts added up, in what they give, and never "No fee" (BRIEF rules 3 and 4):
 * a zero is the figure "₦0.00". The bank's part is unnamed until the Hub names it, and then it is said to be coming ("+ bank charge"). The
 * parts are the line under it (`feeSplit`). The provider's part is "Bank charge", never its name (R-53).
 */
export function feeSummary(q: FeeQuote): string {
  const code = q.fromCurrency as QuoteCode;
  if (q.providerFeeMinor === null) return `${formatMinor(q.wawuFeeMinor, code, q.fromDecimals)} + bank charge`;
  return formatMinor(q.providerFeeMinor + q.wawuFeeMinor, code, q.fromDecimals);
}

/** The small line under W20's fee: the bank's charge + WAWU's fee, each a figure. */
export function feeSplit(q: FeeQuote): string {
  const code = q.fromCurrency as QuoteCode;
  const wawu = formatMinor(q.wawuFeeMinor, code, q.fromDecimals);
  return q.providerFeeMinor === null ? `Bank charge on your receipt + WAWU fee ${wawu}` : `Bank charge ${formatMinor(q.providerFeeMinor, code, q.fromDecimals)} + WAWU fee ${wawu}`;
}

export type FeeRow = { label: string; value: string };

/** The review's fee breakdown (R-10, R-23): the bank's charge and WAWU's fee as their own rows, Fees, then the Total that leaves the account. Every figure is the quote's. */
export function feeRows(q: FeeQuote & Pick<FxQuote, 'totalFromMinor'>): FeeRow[] {
  const code = q.fromCurrency as QuoteCode;
  const money = (minor: number) => formatMinor(minor, code, q.fromDecimals);
  if (q.providerFeeMinor === null) {
    return [
      { label: 'Bank charge', value: 'Shown on your receipt' },
      { label: 'WAWU fee', value: money(q.wawuFeeMinor) },
      { label: 'Total', value: `${money(q.totalFromMinor)} + bank charge` },
    ];
  }
  return [
    { label: 'Bank charge', value: money(q.providerFeeMinor) },
    { label: 'WAWU fee', value: money(q.wawuFeeMinor) },
    { label: 'Fees', value: money(q.providerFeeMinor + q.wawuFeeMinor) },
    { label: 'Total', value: money(q.totalFromMinor) },
  ];
}

/** True when the quote's hold has run out at `now` (ms). */
export const quoteHeld = (q: Pick<FxQuote, 'expiresAt'>, now: number): boolean => Date.parse(q.expiresAt) > now;

export type SwapProblem = { title: string; message: string };

/** What W20 says when the provider gives no rate. The provider's text and its error code stay in the Hub's logs, never on a screen. */
export const SWAP_DECLINED = "We can't offer this swap right now. Try another amount or pair, or try again later.";
/** What W21 says when the provider refuses after the PIN. Nothing moved. */
export const SWAP_NOT_TAKEN = "We couldn't make this swap right now. Your money did not move. Try again later.";

const BY_CODE: Record<string, string> = {
  amount_out_of_range: 'This amount is outside what a swap can be.',
  fx_switched_off: 'Swaps are switched off right now. Try again later.',
  fx_account_not_open: 'One of these accounts is not open yet.',
  provider_unreachable: 'The bank did not answer. Your money is safe. Try again in a moment.',
};

/** The words for a quote that could not be had, by its cause. A refusal from the provider is drawn as the plain refusal it is. */
export function quoteProblem(code: string | undefined, message: string): SwapProblem {
  // M-02: a provider's refusal carries the provider's own words (a name, an endpoint): they are never drawn, one plain sentence stands in.
  if (code === 'provider_declined') return { title: 'This swap was not offered', message: SWAP_DECLINED };
  if (code && BY_CODE[code]) return { title: code === 'provider_unreachable' ? 'We couldn’t reach the bank' : 'We couldn’t get a rate', message: message && code === 'amount_out_of_range' ? message : BY_CODE[code] };
  return { title: 'We couldn’t get a rate', message: message || 'Check your connection and try again.' };
}
