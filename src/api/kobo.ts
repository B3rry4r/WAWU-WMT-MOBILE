const KOBO_PER_NAIRA = 100;

/**
 * R-21: a content price comes from the Hub in whole naira (`ContentPiece.price`), and every
 * figure on screen is kobo. This is the one conversion, in the data layer; a route that serves
 * kobo (BACKEND_GAPS G-219) needs none (SHARED-CHANGES HOME-02 #3).
 */
export function nairaToKobo(naira: number): number {
  return Math.round(naira * KOBO_PER_NAIRA);
}
