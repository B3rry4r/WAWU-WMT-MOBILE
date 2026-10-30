import type { Bank } from './api/payoutAccount';

/**
 * WALK-FIX M6 (lead ruling, 29 Oct 2026): the bank list has 539 banks A to Z, so the nine most people use were buried. A "Popular" group
 * leads the list. A bank is matched by the provider's BANK CODE, never by the words of its name. The provider's list carries a bank by the
 * code its own scheme uses (the CBN's three digits for the commercial banks, the NIBSS six digits for the microfinance banks and wallets), so
 * each bank here has the codes it is known by, in the order tried; the first one the provider's list holds is the one shown. A bank the list
 * does not hold is skipped. DEFAULT (lead), owner may override: if a live read of `GET /money/banks` shows a bank under a code not named
 * here, that code is added to the bank's line below.
 */
export const POPULAR_BANKS: readonly { key: string; codes: readonly string[] }[] = [
  { key: 'opay', codes: ['100004', '999992'] },
  { key: 'palmpay', codes: ['100033', '999991'] },
  { key: 'moniepoint', codes: ['090405', '50515'] },
  { key: 'kuda', codes: ['090267', '50211'] },
  { key: 'gtbank', codes: ['058', '000013'] },
  { key: 'access', codes: ['044', '063', '000014'] },
  { key: 'zenith', codes: ['057', '000015'] },
  { key: 'first', codes: ['011', '000016'] },
  { key: 'uba', codes: ['033', '000004'] },
];

/** The popular banks the provider's list holds, in the order above, each as the provider's own row. A code is used once. */
export function popularBanks(banks: readonly Bank[]): Bank[] {
  const byCode = new Map<string, Bank>();
  for (const bank of banks) if (!byCode.has(bank.code)) byCode.set(bank.code, bank);
  const used = new Set<string>();
  const found: Bank[] = [];
  for (const popular of POPULAR_BANKS) {
    const code = popular.codes.find((candidate) => byCode.has(candidate) && !used.has(candidate));
    if (code === undefined) continue;
    used.add(code);
    found.push(byCode.get(code) as Bank);
  }
  return found;
}
