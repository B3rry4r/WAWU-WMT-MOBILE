/**
 * What the price picker decides, kept apart from the drawing so each rule is tested on its own (PRICE-PICKER, R-101).
 * Every price a person sets is a whole naira picked from the Hub's list (`GET /prices`); nothing is typed.
 */

/** R-5: the creator keeps 85% of the list price, on every stream. */
export const CREATOR_SHARE_PCT = 85;

/** The four shortcuts under the strip (the design's). A shortcut the admin took off the list is not drawn. */
export const POPULAR_NAIRA = [1000, 2500, 5000, 10_000] as const;

/** The stop a new price starts on (the design's), or the nearest list price to it when the admin list lacks it. */
export const START_NAIRA = 2500;

/** The one line under the price when a saved price is not on the list. */
export const OFF_LIST_LINE = 'Pick a price from the list.';

/** What the creator keeps of one sale at a list price: 85%, rounded down to the naira (R-5). */
export const earnOf = (listNaira: number): number => Math.floor((listNaira * CREATOR_SHARE_PCT) / 100);

/** The list price nearest to `naira` (the lower one on a tie, as the Hub does), or null when the list is empty. */
export function nearestOf(list: readonly number[], naira: number): number | null {
  let best: number | null = null;
  for (const price of list) {
    if (best === null || Math.abs(price - naira) < Math.abs(best - naira)) best = price;
  }
  return best;
}

/** The lowest list price that is `naira` or more, or the top of the list when nothing is that high. */
export function atOrAbove(list: readonly number[], naira: number): number | null {
  const sorted = [...list].sort((a, b) => a - b);
  return sorted.find((price) => price >= naira) ?? sorted[sorted.length - 1] ?? null;
}

export const isOnList = (list: readonly number[], naira: number | null): boolean => naira !== null && list.includes(naira);

/** The stop the picker opens on: the person's price when it is on the list, else the nearest list price to it (or to the start). */
export const stopOf = (list: readonly number[], naira: number | null): number | null => nearestOf(list, naira ?? START_NAIRA);

/** The popular shortcuts that are on the list. */
export const popularOf = (list: readonly number[]): number[] => POPULAR_NAIRA.filter((price) => list.includes(price));

/** The next list price up (`1`) or down (`-1`) from `naira`, staying at the ends. For a screen reader's increment and decrement. */
export function stepOf(list: readonly number[], naira: number, direction: 1 | -1): number {
  const at = list.indexOf(naira);
  if (at === -1) return naira;
  return list[Math.min(list.length - 1, Math.max(0, at + direction))] ?? naira;
}

/** A whole-naira price as the digits a form holds, and back: the forms keep their price as a string of digits. */
export const digitsOfNaira = (naira: number): string => String(naira);
export const nairaOfDigits = (digits: string): number | null => (/^\d+$/.test(digits) && Number(digits) > 0 ? Number(digits) : null);
