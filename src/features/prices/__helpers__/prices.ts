import { hub, ok, type Answer } from '@/features/create/__helpers__/harness';

/** The launch list (R-101 point 1) and tip list, as `GET /prices` serves them. */
export const LIST = [100, 200, 500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10_000, 15_000, 20_000, 25_000, 30_000, 40_000, 50_000, 75_000, 100_000, 150_000, 200_000, 250_000, 500_000, 1_000_000];
export const TIPS = [200, 500, 1000, 2000, 5000, 10_000];

export const PRICES_PATH = '/api/hub/prices';

const item = (naira: number, store?: Record<number, number>) => ({ priceNaira: naira, priceKobo: naira * 100, ...(store?.[naira] ? { storePriceNaira: store[naira] } : {}) });

/** The Hub's answer to `GET /prices`; `store` maps a list price to the store price the Hub gives for it. */
export const pricesAnswer = (list: readonly number[] = LIST, tips: readonly number[] = TIPS, store?: Record<number, number>): Answer =>
  ok({ prices: list.map((n) => item(n, store)), tips: tips.map((n) => item(n, store)) });

/** Make the stand-in Hub serve the launch list. */
export function servePrices(list: readonly number[] = LIST, tips: readonly number[] = TIPS, store?: Record<number, number>) {
  hub.answers[`GET ${PRICES_PATH}`] = pricesAnswer(list, tips, store);
}
