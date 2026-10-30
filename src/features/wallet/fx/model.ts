import { ApiError, isApiError } from '@/api/errors';

import type { FxChain, FxCode, QuoteCode } from './amount';
import { NAIRA_DECIMALS, SHORT_NAME, WORDS } from './amount';
import type { FxAccount, FxCurrencies, FxCurrency } from './api';
import type { WalletTab } from './parts';

/** The foreign currencies in the order their tabs stand, after Naira and before Crypto. */
export const FIAT_ORDER: readonly FxCode[] = ['USD', 'EUR', 'GBP', 'CAD', 'AED', 'GHS'];
/** The stablecoins in the order W3 and W22 list them. */
export const COIN_ORDER: readonly FxCode[] = ['USDT', 'USDC', 'RLUSD'];

export const NAIRA_TAB = 'naira';
export const CRYPTO_TAB = 'crypto';

const TAB_LABEL: Record<string, string> = { USD: 'Dollar', EUR: 'Euro', GBP: 'Pound', CAD: 'CAD', AED: 'Dirham', GHS: 'Cedi' };

export const isCoinCode = (code: string): boolean => COIN_ORDER.includes(code as FxCode);

/** The tab key of a currency's account: its code, or the one Crypto tab for every stablecoin. */
export const tabOf = (code: QuoteCode): string => (code === 'NGN' ? NAIRA_TAB : isCoinCode(code) ? CRYPTO_TAB : code);

export function currencyOf(currencies: FxCurrencies | null, code: QuoteCode): FxCurrency | undefined {
  return currencies?.currencies.find((c) => c.code === code);
}

/** True when the Hub lets a new account be opened in this currency (the currency and "open account" are both switched on). */
export function canOpen(currencies: FxCurrencies | null, code: FxCode): boolean {
  const c = currencyOf(currencies, code);
  return Boolean(currencies?.products.openAccount && c?.enabled);
}

export const accountsIn = (accounts: readonly FxAccount[] | null, code: FxCode): FxAccount[] => (accounts ?? []).filter((a) => a.currency === code);

const NO_CODES: ReadonlySet<string> = new Set();

/**
 * The tabs W1's strip draws (R-106, owner, 30 Oct 2026, amending R-87 and R-93): Naira, then one for each currency the person has actually
 * added (an account in it, whatever its state), then Crypto when they hold or are opening a stablecoin. A currency they have not added is
 * never a tab: it is reached from "+ Add" at the end of the strip, which opens the add-a-currency choice. A currency picked there and still
 * being opened (`opening`) counts as added and shows its tab at once. `accounts` is null while they are unread or could not be read: the
 * strip is then Naira alone.
 */
export function tabsOf(accounts: readonly FxAccount[] | null, opening: ReadonlySet<string> = NO_CODES): WalletTab[] {
  const tabs: WalletTab[] = [{ key: NAIRA_TAB, label: SHORT_NAME.NGN }];
  const held = (code: FxCode) => accountsIn(accounts, code).length > 0 || opening.has(code);
  for (const code of FIAT_ORDER) {
    if (held(code)) tabs.push({ key: code, label: TAB_LABEL[code] ?? code });
  }
  if (COIN_ORDER.some(held)) tabs.push({ key: CRYPTO_TAB, label: 'Crypto' });
  return tabs;
}

export type AddOption = { value: FxCode; label: string; coin: boolean };

/**
 * What the add-a-currency choice offers (R-83, R-84, R-87): every currency and every coin the Hub lists as on, that the person has no
 * account in yet, in the Hub's own order and words. Nothing is offered while the Hub has opening accounts switched off. A coin the person
 * already holds is not listed again: another network for it is opened from its own Receive screen.
 */
export function addOptions(currencies: FxCurrencies | null, held: ReadonlySet<string>): AddOption[] {
  if (!currencies?.products.openAccount) return [];
  return currencies.currencies.flatMap((c) => {
    if (!c.enabled || held.has(c.code)) return [];
    const coin = c.kind === 'stablecoin';
    return [{ value: c.code as FxCode, label: coin ? `${c.name} (${c.code})` : c.name, coin }];
  });
}

/**
 * The currencies in a sentence, from what the Hub offers this person and in its order: "dollars, euros and crypto". Every coin the Hub offers
 * is one word, "crypto", at the end. Nothing is named that the Hub did not offer.
 */
export function offerWords(options: readonly AddOption[]): string {
  const words = options.filter((o) => !o.coin).map((o) => WORDS[o.value]);
  if (options.some((o) => o.coin)) words.push('crypto');
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

export type OtherBalance = { code: FxCode; minor: number; decimals: number };

/**
 * The balances a person holds besides naira, one for each currency in its own sign, for Home's money card. Each is the provider's own
 * figure for that account; none is added to another (a coin held on two networks is one coin, its networks' figures together). An account
 * whose balance could not be read, or is not open, is left out: a 0 the provider did not say is never drawn.
 */
export function otherBalances(accounts: readonly FxAccount[] | null): OtherBalance[] {
  const open = (accounts ?? []).filter((a) => a.status === 'open');
  const fiat = FIAT_ORDER.flatMap((code) => {
    const a = open.find((x) => x.currency === code && x.balance !== null);
    return a?.balance ? [{ code, minor: a.balance.availableMinor, decimals: a.decimals }] : [];
  });
  const coins = COIN_ORDER.flatMap((code) => {
    const own = open.filter((x) => x.currency === code);
    if (own.length === 0 || own.some((x) => x.balance === null)) return [];
    return [{ code, minor: own.reduce((sum, x) => sum + (x.balance?.availableMinor ?? 0), 0), decimals: own[0]?.decimals ?? NAIRA_DECIMALS }];
  });
  return [...fiat, ...coins];
}

/** How many places a currency's smallest unit has: the naira's two, or what the Hub says for that currency. */
export function decimalsFor(currencies: FxCurrencies | null, accounts: readonly { currency: string; decimals: number }[] | null, code: QuoteCode): number {
  if (code === 'NGN') return currencies?.naira.decimals ?? NAIRA_DECIMALS;
  return currencyOf(currencies, code)?.decimals ?? (accounts ?? []).find((a) => a.currency === code)?.decimals ?? NAIRA_DECIMALS;
}

/** Swap is offered if the Hub has it on and the person holds an open account: there is a side to move money to or from. */
export function swapOffered(currencies: FxCurrencies | null, accounts: readonly FxAccount[] | null): boolean {
  return Boolean(currencies?.products.swap && (accounts ?? []).some((a) => a.status === 'open'));
}

export type CoinGroup = {
  code: FxCode;
  name: string;
  decimals: number;
  accounts: FxAccount[];
  /** The sum of the provider's own balances of this coin's accounts; null when one of them could not be read. */
  availableMinor: number | null;
  chains: FxChain[];
};

/** A stablecoin account is one chain's wallet: they are grouped by coin, each coin one holding (W3). */
export function coinGroups(currencies: FxCurrencies | null, accounts: readonly FxAccount[] | null): CoinGroup[] {
  const groups: CoinGroup[] = [];
  for (const code of COIN_ORDER) {
    const own = accountsIn(accounts, code);
    if (own.length === 0) continue;
    const readable = own.every((a) => a.balance !== null);
    groups.push({
      code,
      name: currencyOf(currencies, code)?.name ?? SHORT_NAME[code],
      decimals: own[0]?.decimals ?? NAIRA_DECIMALS,
      accounts: own,
      availableMinor: readable ? own.reduce((sum, a) => sum + (a.balance?.availableMinor ?? 0), 0) : null,
      chains: own.map((a) => a.chain).filter((c): c is FxChain => c !== null),
    });
  }
  return groups;
}

/** The number a payer needs most, for the card's masked line and its Copy: an account number, else an IBAN. */
export function primaryNumber(account: FxAccount): string | null {
  const d = account.details;
  if (!d || d.status !== 'active') return null;
  return d.accountNumber?.trim() || d.iban?.trim() || null;
}

/** "•••• 4410": the last four, never the whole number. */
export function maskedNumber(value: string): string {
  const tail = value.replace(/\s/g, '').slice(-4);
  return `•••• ${tail}`;
}

/** What went wrong reading an account or the Hub's switches, so the screen picks its state. */
export type FxProblem = 'unreachable' | 'no_wallet' | 'opening' | 'frozen' | 'other';

export function fxProblem(error: unknown): FxProblem {
  if (!isApiError(error) || !error.code) return 'other';
  switch (error.code) {
    case 'provider_unreachable':
      return 'unreachable';
    case 'wallet_not_open':
      return 'no_wallet';
    case 'wallet_opening':
      return 'opening';
    case 'wallet_frozen':
      return 'frozen';
    default:
      return 'other';
  }
}

/** The Hub's own sentence for a refusal, or the line given. A provider's refusal (`provider_declined`) carries the provider's words, which are never drawn (M-02): the line given stands in. */
export function sentenceOf(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.code !== 'provider_declined' && error.message.trim() ? error.message : fallback;
}

export const NOT_NAIRA_NAME = (code: QuoteCode): string => SHORT_NAME[code];
