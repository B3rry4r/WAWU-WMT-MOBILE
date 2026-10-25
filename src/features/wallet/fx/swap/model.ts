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

/** What the person pays Nuvion and WAWU for a swap, as one line on W20: the sum of the fees the Hub named, in what they give. */
export function feeSummary(q: Pick<FxQuote, 'providerFeeMinor' | 'wawuFeeMinor' | 'fromCurrency' | 'fromDecimals'>): string {
  const total = (q.providerFeeMinor ?? 0) + q.wawuFeeMinor;
  if (total === 0) return q.providerFeeMinor === null ? 'No fee from WAWU' : 'No fee';
  const known = formatMinor(total, q.fromCurrency as QuoteCode, q.fromDecimals);
  return q.providerFeeMinor === null ? `${known} and Nuvion's charge` : known;
}

export type FeeRow = { label: string; value: string };

/** The review's fee breakdown (R-10: the provider's charge and WAWU's fee as their own rows). */
export function feeRows(q: Pick<FxQuote, 'providerFeeMinor' | 'wawuFeeMinor' | 'fromCurrency' | 'fromDecimals'>): FeeRow[] {
  const code = q.fromCurrency as QuoteCode;
  return [
    {
      label: 'Nuvion fee',
      value: q.providerFeeMinor === null ? 'Shown on your receipt' : q.providerFeeMinor === 0 ? 'No fee' : formatMinor(q.providerFeeMinor, code, q.fromDecimals),
    },
    { label: 'WAWU fee', value: q.wawuFeeMinor === 0 ? 'No fee' : formatMinor(q.wawuFeeMinor, code, q.fromDecimals) },
  ];
}

/** True when the quote's hold has run out at `now` (ms). */
export const quoteHeld = (q: Pick<FxQuote, 'expiresAt'>, now: number): boolean => Date.parse(q.expiresAt) > now;

export type SwapProblem = { title: string; message: string };

const BY_CODE: Record<string, string> = {
  amount_out_of_range: 'This amount is outside what a swap can be.',
  fx_switched_off: 'Swaps are switched off right now. Try again later.',
  fx_account_not_open: 'One of these accounts is not open yet.',
  provider_unreachable: 'The bank did not answer. Your money is safe. Try again in a moment.',
};

/** The words for a quote that could not be had, by its cause. A refusal from the provider is drawn as the plain refusal it is. */
export function quoteProblem(code: string | undefined, message: string): SwapProblem {
  if (code === 'provider_declined') return { title: 'This swap was not offered', message: message || 'The provider did not give a rate for this.' };
  if (code && BY_CODE[code]) return { title: code === 'provider_unreachable' ? 'We couldn’t reach the bank' : 'We couldn’t get a rate', message: message && code === 'amount_out_of_range' ? message : BY_CODE[code] };
  return { title: 'We couldn’t get a rate', message: message || 'Check your connection and try again.' };
}
