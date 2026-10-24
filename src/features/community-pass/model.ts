/**
 * The words of I30 and I31 (INBOX-14, R-86). A pass is bought in the store sheet and renews through the store until the person cancels there,
 * so no line speaks of the wallet or of naira: the price is the store's own, in the person's own currency. The days, the end date and the
 * member count are the Hub's.
 */

/** What I30 says about the room: that members pay the host to join and that reading is free. The credits by kind (R-62, `GET /communities/message-cost`) are shown in the room's own strip (I24), not here, so this line says only what is always true (R-47). */
export const GATE_LINE = 'Members pay the host to join. Reading inside is free.';

/** The same sentence the Hub gives when a member the host removed tries to buy a pass (`store_pass_not_available`). */
export const BLOCKED_LINE = 'The host has removed you from this room. Ask the host to let you back in.';

/** For a member the host removed who still holds the store subscription: the store keeps billing them, and a renewal gives them nothing. */
export const CANCEL_IN_STORE_LINE = 'You still have this pass in the store, and it keeps billing you until you cancel it there. Cancel it in the store.';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;

/** "16 November", on the phone's own clock, with the year when it is not this year. Empty when the date cannot be read. */
export function endDay(iso: string | null, now: Date = new Date()): string {
  if (!iso) return '';
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return '';
  const day = `${at.getDate()} ${MONTHS[at.getMonth()] ?? ''}`;
  return at.getFullYear() === now.getFullYear() ? day : `${day} ${at.getFullYear()}`;
}

/** I31's line after buying: the day the pass runs to, and that the store renews it until it is cancelled there. */
export function joinedLine(passUntil: string | null): string {
  const day = endDay(passUntil);
  return day ? `Your pass runs to ${day}. The store renews it until you cancel there.` : 'The store renews it until you cancel there.';
}

/** I31 for a member who opens the room's pass page with time left: the end day and that the store keeps it going. */
export function runningLine(passUntil: string | null): string {
  const day = endDay(passUntil);
  return day ? `Your pass runs to ${day}. The store renews it until you cancel there.` : 'The store renews your pass until you cancel there.';
}

/** I30 for a member whose pass ended. */
export function endedLine(passUntil: string | null): string {
  const day = endDay(passUntil);
  return day ? `Your pass ended on ${day}. Join again to come back in.` : 'Your pass ended. Join again to come back in.';
}
