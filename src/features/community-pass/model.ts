import { formatMoney } from '@/components/Money';

/**
 * The words and figures of I30 and I31 (INBOX-14, R-63). Every price, total and date is the Hub's: nothing here is a literal of the
 * board's. R-63 says a pass is paid for by the person each time and nothing is debited by itself, so no line says it "renews" on its own.
 */

export const PRICE_CHANGED_LINE = 'The price changed. Check the new total before you pay.';
export const STILL_CONFIRMING_LINE = 'We’re still confirming this pass. Don’t pay again. You’re in the moment it is done.';
/** What I30 says about the room. The board also says text and emoji are free and media uses credits; the Hub charges a credit per message until INBOX-22 serves costs by kind (R-47, R-62), so only what is always true is said. */
export const GATE_LINE = 'Members pay the host to join. Reading inside is free.';

/** "₦2,000", with kobo only when there are some. */
export const naira = (kobo: number): string => formatMoney(kobo, { decimals: kobo % 100 !== 0 });

/** "₦2,000 a month": the host's price for one pass (30 days, R-63). */
export const priceLine = (priceKobo: number): string => `${naira(priceKobo)} a month`;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;

/** "16 November", on the phone's own clock, with the year when it is not this year. Empty when the date cannot be read. */
export function endDay(iso: string | null, now: Date = new Date()): string {
  if (!iso) return '';
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return '';
  const day = `${at.getDate()} ${MONTHS[at.getMonth()] ?? ''}`;
  return at.getFullYear() === now.getFullYear() ? day : `${day} ${at.getFullYear()}`;
}

/** I31's line after paying: what was paid, from the wallet, and the day the pass ends. The total is the Hub's, fees included (BRIEF rule 5). */
export function joinedLine(totalKobo: number, passUntil: string | null): string {
  const paid = `Paid ${naira(totalKobo)} from your wallet.`;
  const day = endDay(passUntil);
  return day ? `${paid} Your pass ends on ${day}.` : paid;
}

/** I31 for a member who opens the room's pass page with time left: the end day and that renewing is a tap, never automatic. */
export function runningLine(passUntil: string | null): string {
  const day = endDay(passUntil);
  return day ? `Your pass ends on ${day}. Renew any time to add 30 days.` : 'Renew any time to add 30 days.';
}

/** I30 for a member whose pass ended. */
export function endedLine(passUntil: string | null): string {
  const day = endDay(passUntil);
  return day ? `Your pass ended on ${day}. Renew to come back in.` : 'Your pass ended. Renew to come back in.';
}

/** The pay button: "Join · ₦2,030" or "Renew · ₦2,030", the total the payer pays, fees included (BRIEF rule 5). */
export function payLabel(verb: 'Join' | 'Renew', totalKobo: number | null): string {
  return totalKobo === null ? verb : `${verb} · ${naira(totalKobo)}`;
}

/** What a refunded pass says: it names the price that comes back and no more (BRIEF rule 6). */
export function refundedLine(priceKobo: number): string {
  return `This pass could not be given. Your ${naira(priceKobo)} is on its way back to your wallet.`;
}
