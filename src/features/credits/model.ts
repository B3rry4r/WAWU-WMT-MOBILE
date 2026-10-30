/** The word on I28's title. The instrument's name stays "WAWU Credits" (R-37, "where WAWU stays"). */
export const SHEET_TITLE = 'Buy WAWU Credits';
/**
 * I28's line. The 16 Oct board also says what each kind of message costs ("A photo is 1 credit, a video or voice note 3"); the sheet draws
 * that line above this one from the Hub's costs by kind (`creditCostLine`, R2-SOCIAL 2), and only once they are known (R-47, R-62).
 */
export const SHEET_LINE = 'Credits don’t expire and can’t be cashed out.';
/** I27's words. The 16 Oct board says "Text and emoji stay free ... photos, video and voice notes"; today the Hub charges every message (INBOX-22). */
export const OUT_TITLE = 'You’re out of credits';
export const OUT_LINE = 'Reading stays free. Buy credits to send messages here.';

/** "50", "1,250": a count, never naira. */
export const creditCount = (credits: number): string => String(Math.max(0, Math.floor(credits))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** "Buy 120 credits": the sheet's button before a pack is chosen. */
export const buyWords = (credits: number): string => (credits > 0 ? `Buy ${creditCount(credits)} credits` : 'Buy credits');

/** I29's line: what the person has now, a count. Nothing about money: the store took the payment (R-86). */
export function addedLine(balance: number | null): string {
  return balance === null ? 'Added to your credits.' : `You have ${creditCount(balance)} ${balance === 1 ? 'credit' : 'credits'}.`;
}

/** The pack drawn selected when the sheet opens: the middle of three or more (the board's popular one), else the first. */
export function startingCredits<T>(packs: readonly T[]): T | null {
  return packs.length === 0 ? null : (packs[packs.length >= 3 ? 1 : 0] ?? null);
}
