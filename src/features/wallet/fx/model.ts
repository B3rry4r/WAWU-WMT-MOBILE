import { ApiError, isApiError } from '@/api/errors';

import type { FxChain, FxCode, QuoteCode } from './amount';
import { NAIRA_DECIMALS, SHORT_NAME } from './amount';
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

/**
 * The tabs the Hub's answers draw (R-47): Naira always (the wallet is open), then one for each currency the person holds or can open,
 * then Crypto when they hold a stablecoin or can open one. Nothing is drawn for a currency an admin switched off that the person has no
 * account in. `accounts` is null while they are unread or could not be read: the tabs then follow what can be opened.
 */
export function tabsOf(currencies: FxCurrencies | null, accounts: readonly FxAccount[] | null): WalletTab[] {
  if (!currencies) return [];
  const tabs: WalletTab[] = [{ key: NAIRA_TAB, label: SHORT_NAME.NGN }];
  for (const code of FIAT_ORDER) {
    if (accountsIn(accounts, code).length > 0 || canOpen(currencies, code)) tabs.push({ key: code, label: TAB_LABEL[code] ?? code });
  }
  const coins = COIN_ORDER.filter((code) => accountsIn(accounts, code).length > 0 || canOpen(currencies, code));
  if (coins.length > 0) tabs.push({ key: CRYPTO_TAB, label: 'Crypto' });
  return tabs;
}

/** How many places a currency's smallest unit has: the naira's two, or what the Hub says for that currency. */
export function decimalsFor(currencies: FxCurrencies | null, accounts: readonly FxAccount[] | null, code: QuoteCode): number {
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

/** The Hub's own sentence for a refusal, or the line given. */
export function sentenceOf(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.message.trim() ? error.message : fallback;
}

export const NOT_NAIRA_NAME = (code: QuoteCode): string => SHORT_NAME[code];
