import { nairaToKobo } from '@/api/kobo';
import { accountNameOf, formatNaira, paidFromBackText, paidFromText, type PaidFrom } from '@/components/pay-sheet';
import { APP_NAME_COPY } from '@/lib/appName';

import type { Availability, QuestionView, ThreadQuestion } from './api';

/**
 * What I2 to I8 say, decided from the Hub's answers and kept apart from the drawing so each rule is tested on its own. Every price,
 * window, time and amount here is the Hub's; the app adds nothing up and never works out a share (R-5, R-21). A figure the Hub did not
 * send leaves its line out or says it without the figure.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** The first word of a name, for the lines that speak of the person ("Chidi has 24 hours to reply"). */
export function firstName(name: string | null | undefined): string {
  return (name ?? '').trim().split(/\s+/)[0] ?? '';
}

/** "this creator" until the Hub has given a name. */
export const whoOf = (name: string | null | undefined): string => firstName(name) || 'This creator';

/** The time left, as the design writes it: "17h 52m", "2d 3h", "40m", and "under a minute" for the last seconds. */
export function leftLong(ms: number): string {
  if (ms < MINUTE) return 'under a minute';
  const days = Math.floor(ms / DAY);
  const hours = Math.floor((ms % DAY) / HOUR);
  const minutes = Math.floor((ms % HOUR) / MINUTE);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/** "18h", "2d", "40m": the time left on a row of the Inbox, rounded down. Null once the window has closed. */
export function rowLeft(deadlineAt: string, now: number): string | null {
  const ms = Date.parse(deadlineAt) - now;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  if (ms >= DAY) return `${Math.floor(ms / DAY)}d`;
  if (ms >= HOUR) return `${Math.floor(ms / HOUR)}h`;
  return `${Math.max(1, Math.floor(ms / MINUTE))}m`;
}

/** The creator's window in words: "24 hours", "1 hour", "2 days". */
export function windowWords(hours: number): string {
  if (hours >= 48 && hours % 24 === 0) return `${hours / 24} days`;
  return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
}

/** The same window as a describing word, as the board writes it: "24-hour", "1-hour", "2-day" ("its own 24-hour window"). */
export function windowAdjective(hours: number): string {
  if (hours >= 48 && hours % 24 === 0) return `${hours / 24}-day`;
  return `${hours}-hour`;
}

/** The window of a question the Hub already sent, from its two timestamps, in whole hours (null when they are not readable). */
export function windowHoursOf(question: Pick<ThreadQuestion, 'sentAt' | 'deadlineAt'>): number | null {
  const hours = Math.round((Date.parse(question.deadlineAt) - Date.parse(question.sentAt)) / HOUR);
  return Number.isFinite(hours) && hours > 0 ? hours : null;
}

/** "Usually replies in about 3 hours": the Hub's median (G-146), or nothing until it has one. */
export function usualReplyLine(minutes: number | null | undefined): string | null {
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) return null;
  if (minutes < 60) return `Usually replies in about ${Math.max(1, Math.round(minutes))} ${Math.round(minutes) === 1 ? 'minute' : 'minutes'}`;
  const hours = Math.round(minutes / 60);
  if (hours >= 48) return `Usually replies in about ${Math.round(hours / 24)} days`;
  return `Usually replies in about ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
}

/** I3's three lines under the question. The refund line names what the Hub gives back: every naira, the charge too (backend B3a round 2). */
export const windowLine = (name: string | null | undefined, hours: number | null): string => `${whoOf(name)} has ${hours === null ? 'a set time' : windowWords(hours)} to reply`;
export const refundLine = (totalKobo: number | null, from?: PaidFrom | null): string =>
  // PAY-FX (R-91): a buyer paying from another currency's account is told what comes back to that account, in its currency.
  from
    ? `No reply in time, your ${paidFromText(from)} comes back to your ${accountNameOf(from.currency)}`
    : totalKobo === null
      ? 'No reply in time, your money comes back'
      : `No reply in time, your ${formatNaira(totalKobo)} comes back`;

/** Where a refund lands: the buyer's own account when another currency paid, else the wallet. */
const backTo = (from?: PaidFrom | null): string => (from ? `your ${accountNameOf(from.currency)}` : 'your wallet');
export const heldLine = (name: string | null | undefined): string => `Held by ${APP_NAME_COPY} until ${whoOf(name)} answers`;

/** What the pay sheet says when the wallet is short (I6). */
export const SHORT_TITLE = 'Not enough in your Naira wallet';
export const shortLine = (totalKobo: number, balanceKobo: number): string => `You need ${formatNaira(totalKobo, 'always')}. You have ${formatNaira(balanceKobo, 'always')}.`;

/** The price on Message · ₦1,500: the visitor route sends naira, so it is made kobo in the one place (R-21). Null when paid messages have no price. */
export function priceKoboOf(dmPrice: number | null | undefined): number | null {
  return typeof dmPrice === 'number' && Number.isFinite(dmPrice) && dmPrice > 0 ? nairaToKobo(dmPrice) : null;
}

/** Whether a creator takes paid questions now, and on what terms (I2, I8): their own switch, then the Hub's pause. */
export type AskTerms =
  | { kind: 'on'; priceKobo: number; windowHours: number | null }
  | { kind: 'off'; why: 'switched_off' | 'paused'; pausedUntil: string | null };

export function askTerms(
  profile: { dmEnabled?: boolean | null; dmPrice?: number | null; dmResponseHours?: number | null },
  availability: Pick<Availability, 'paused' | 'pausedUntil'> | null | undefined,
): AskTerms {
  const priceKobo = priceKoboOf(profile.dmPrice);
  if (!profile.dmEnabled || priceKobo === null) return { kind: 'off', why: 'switched_off', pausedUntil: null };
  if (availability?.paused) return { kind: 'off', why: 'paused', pausedUntil: availability.pausedUntil ?? null };
  const hours = profile.dmResponseHours;
  return { kind: 'on', priceKobo, windowHours: typeof hours === 'number' && hours > 0 ? hours : null };
}

/** The message button's words: "Message · ₦1,500" (I2), "Ask a question · ₦1,500" on a professional's page (P2). */
export const askButtonLabel = (priceKobo: number, verb = 'Message'): string => `${verb} · ${formatNaira(priceKobo)}`;

/** I8: the note under a creator who is not taking paid messages (R-2, R-9: no shop, so their work). */
export const offTitle = (name: string | null | undefined): string => `${whoOf(name)} isn't taking paid messages right now`;
export const offBody = (name: string | null | undefined): string => `You can still follow, tip and buy ${whoOf(name)}'s work.`;

/* ---------- the thread (I4, I5, I7) ---------- */

const pad = (n: number) => String(n).padStart(2, '0');
const clock = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const dayGap = (d: Date, now: Date) => Math.round((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / DAY);

/** The label above a day of messages: "Today", "Yesterday", "Monday" inside the week, then "12 Oct". */
export function dayLabel(iso: string, now: number): string {
  const d = new Date(iso);
  const gap = dayGap(d, new Date(now));
  if (gap === 0) return 'Today';
  if (gap === 1) return 'Yesterday';
  if (gap > 1 && gap < 7) return WEEKDAYS[d.getDay()];
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** The word for a day in a sentence: "today", "tomorrow", "yesterday", "on Tuesday", "on 12 Oct". */
function dayWord(d: Date, now: Date): string {
  const gap = dayGap(d, now);
  if (gap === 0) return 'today';
  if (gap === -1) return 'tomorrow';
  if (gap === 1) return 'yesterday';
  if (gap > 1 && gap < 7) return `on ${WEEKDAYS[d.getDay()]}`;
  return `on ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "tomorrow 09:51", "today 21:30": when the window closes. */
export function deadlineWords(iso: string, now: number): string {
  const d = new Date(iso);
  return `${dayWord(d, new Date(now))} ${clock(d)}`;
}

/** "Tuesday at 14:10", "today at 09:00": when a refund landed (the Hub's own time). */
export function atWords(iso: string, now: number): string {
  const d = new Date(iso);
  const word = dayWord(d, new Date(now)).replace(/^on /, '');
  return `${word} at ${clock(d)}`;
}

/**
 * Which account paid a question, as the screen knows it: the account, none (the Naira wallet), or `SOURCE_PENDING` while the reads that say
 * which are still on their way. Until they are over, the lines that name the money (the stamp, the waiting card's words) are held, so a
 * buyer in another currency never sees naira wording flash before their own (SWEEP-1026 row 3).
 */
export const SOURCE_PENDING = 'pending' as const;
export type PaidFromState = PaidFrom | null | typeof SOURCE_PENDING;

/** The small line under a question bubble: "09:51 · ₦1,500 paid", and the weekday on another day ("Mon 14:10 · ₦200 paid"). Held to the time alone while the account is not known. */
export function paidStamp(iso: string, amountKobo: number, now: number, from?: PaidFromState): string {
  const d = new Date(iso);
  const when = sameDay(d, new Date(now)) ? clock(d) : `${WEEKDAYS[d.getDay()].slice(0, 3)} ${clock(d)}`;
  if (from === SOURCE_PENDING) return when;
  return `${when} · ${from ? paidFromText(from) : formatNaira(amountKobo)} paid`;
}

/** The time under a reply bubble: "12:05". */
export const replyStamp = (iso: string): string => clock(new Date(iso));

/** "2h 14m", "49m", "under a minute": how long the creator took. */
export function tookLong(sentAt: string, respondedAt: string): string | null {
  const ms = Date.parse(respondedAt) - Date.parse(sentAt);
  if (!Number.isFinite(ms) || ms < 0) return null;
  return leftLong(ms);
}

export type CardTone = 'waiting' | 'answered' | 'refunded' | 'late';

/** `body` is null while its words are not known yet (I5, before the creator's terms are here): the card draws a loading line, never a guess. */
export type StatusCard = { tone: CardTone; title: string; body: string | null };

/**
 * A question the Hub still has open: the countdown and where the money is (I4). Past its deadline the Hub has not yet paid it back.
 * The lines say "your money" and no figure: the thread carries the question's price, and what the person paid (and gets back, every
 * naira) is the price and the bank's charge, which the thread does not carry (I3 and I7 say the Hub's own total).
 */
export function waitingCard(q: Pick<ThreadQuestion, 'deadlineAt'>, name: string | null | undefined, now: number, from?: PaidFromState): StatusCard {
  const left = Date.parse(q.deadlineAt) - now;
  // Where the money is held, and where it goes back to, depend on the account that paid: the words wait for it (a loading line, never a guess).
  if (left <= 0) {
    return { tone: 'late', title: 'No reply in time', body: from === SOURCE_PENDING ? null : `Your money is on its way back to ${backTo(from)}.` };
  }
  return {
    tone: 'waiting',
    title: `${whoOf(name)} has ${leftLong(left)} left to reply`,
    body: from === SOURCE_PENDING ? null : `Your money is held by ${APP_NAME_COPY} No reply by ${deadlineWords(q.deadlineAt, now)} and it comes back to ${backTo(from)}.`,
  };
}

/** The next question's terms: its price and window, said only when the Hub says paid messages are on. */
export type FollowUp = { priceKobo: number; windowHours: number | null };

/**
 * What the newest answered question's card may say about asking again. The terms come from the creator's profile and then the Hub's pause,
 * two reads after the thread, so until both are here nothing is known: `'pending'`, never a guess that the question is closed. When the
 * profile read failed (`failed`) nothing is known either, and the card says so instead of loading for good: `'failed'`. Switched off
 * or paused is `null` (closed); on is the terms.
 */
export const followUpOf = (terms: AskTerms | null, failed = false): FollowUp | 'pending' | 'failed' | null =>
  terms === null ? (failed ? 'failed' : 'pending') : terms.kind === 'on' ? { priceKobo: terms.priceKobo, windowHours: terms.windowHours } : null;

/** What the card says when the creator's terms could not be read: it does not guess "closed" or an offer, and points at the Try again under the thread. */
export const TERMS_FAILED_LINE = "We couldn't check if you can ask a follow-up. Try again below.";

/**
 * A question the creator answered (I5). `followUp` is the next question's terms, said only when the Hub says paid messages are on; `null`
 * says the question is closed (an older answer, or the creator is not taking paid messages); `'pending'` says nothing yet (the body is null);
 * `'failed'` says the terms could not be read.
 */
export function answeredCard(name: string | null | undefined, followUp: FollowUp | 'pending' | 'failed' | null): StatusCard {
  const lead = `${whoOf(name)} answered, so they've been paid`;
  if (followUp === 'pending') return { tone: 'answered', title: lead, body: null };
  if (followUp === 'failed') return { tone: 'answered', title: lead, body: TERMS_FAILED_LINE };
  if (!followUp) return { tone: 'answered', title: lead, body: 'This question is closed.' };
  const window = followUp.windowHours === null ? '' : ` Each paid message gets its own ${windowAdjective(followUp.windowHours)} window.`;
  return { tone: 'answered', title: lead, body: `Ask a follow-up for ${formatNaira(followUp.priceKobo)}.${window}` };
}

/**
 * A question that went unanswered (I7). The amount and the time are the wallet's own record of the refund (the hold's
 * `refundedKobo` and `settledAt`); a question that has no wallet record says only that it was refunded. `from` is the account that paid
 * (null for the Naira wallet).
 */
export function refundedCard(
  q: Pick<ThreadQuestion, 'sentAt' | 'deadlineAt'>,
  name: string | null | undefined,
  wallet: QuestionView | null,
  now: number,
  from?: PaidFrom | null,
): StatusCard {
  const hours = windowHoursOf(q);
  const within = hours === null ? 'No reply in time' : `No reply in ${windowWords(hours)}`;
  const hold = wallet?.payment?.hold ?? null;
  const back = hold?.refundedKobo;
  // PAY-FX (R-91): a question paid from another currency's account goes back to that account, in its currency. `from` is the payment
  // record's `source` (GET /money/payments/{id}); the wallet's record of the question carries none.
  const dest = from ? `your ${accountNameOf(from.currency)}` : 'your Naira wallet';
  if (wallet && typeof back === 'number' && back > 0) {
    const sum = from ? paidFromBackText(from) : formatNaira(back);
    if (wallet.status === 'refunding' || !hold?.settledAt) {
      return { tone: 'refunded', title: `${within}, so ${sum} is coming back`, body: `It is on its way to ${dest}. ${whoOf(name)} earned nothing.` };
    }
    return { tone: 'refunded', title: `${within}, so you got ${sum} back`, body: `It went back to ${dest} ${atWords(hold.settledAt, now)}. ${whoOf(name)} earned nothing.` };
  }
  // INBOX-10 N1: while the refund is still moving the hold has no figure yet (it is written when the refund settles), so there is
  // nothing to print; say the money is on its way instead of saying it was refunded.
  if (wallet && (wallet.status === 'refunding' || (hold !== null && !hold.settledAt))) {
    return { tone: 'refunded', title: `${within}, so your money is on its way back`, body: `It is on its way to ${dest}. ${whoOf(name)} earned nothing.` };
  }
  return { tone: 'refunded', title: `${within}, so this question was refunded`, body: `${whoOf(name)} earned nothing.` };
}

/** One thing in the thread, oldest first, for the list to draw. */
export type ThreadEntry =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'question'; key: string; text: string; stamp: string }
  | { kind: 'reply'; key: string; text: string; stamp: string }
  | { kind: 'card'; key: string; questionId: string; status: ThreadQuestion['status']; question: ThreadQuestion; last: boolean };

/** The thread as the Hub sends it (newest first) turned around: a day label, the question, its replies, its card. */
export function threadEntries(questions: readonly ThreadQuestion[], now: number, fromOf?: (questionId: string) => PaidFromState): ThreadEntry[] {
  const ordered = [...questions].filter((q) => q.mine).sort((a, b) => Date.parse(a.sentAt) - Date.parse(b.sentAt));
  const out: ThreadEntry[] = [];
  let lastDay = '';
  ordered.forEach((q, i) => {
    const label = dayLabel(q.sentAt, now);
    const dayKey = new Date(q.sentAt).toDateString();
    if (dayKey !== lastDay) {
      out.push({ kind: 'day', key: `day-${q.id}`, label });
      lastDay = dayKey;
    }
    out.push({ kind: 'question', key: `q-${q.id}`, text: q.text, stamp: paidStamp(q.sentAt, q.amountKobo, now, fromOf?.(q.id)) });
    for (const reply of q.replies) out.push({ kind: 'reply', key: `r-${reply.id}`, text: reply.text, stamp: replyStamp(reply.createdAt) });
    out.push({ kind: 'card', key: `c-${q.id}`, questionId: q.id, status: q.status, question: q, last: i === ordered.length - 1 });
  });
  return out;
}

/** The thread's header line (I4, I5, I7): the latest question's state. */
export function headerLine(latest: ThreadQuestion | null): { text: string; tone: 'muted' | 'positive' } {
  if (!latest) return { text: 'Paid DM', tone: 'muted' };
  if (latest.status === 'responded' && latest.respondedAt) {
    const took = tookLong(latest.sentAt, latest.respondedAt);
    return took ? { text: `Replied in ${took}`, tone: 'positive' } : { text: 'Paid DM · replied', tone: 'positive' };
  }
  if (latest.status === 'refunded') return { text: 'Paid DM · refunded', tone: 'muted' };
  const hours = windowHoursOf(latest);
  return { text: hours === null ? 'Paid DM' : `Paid DM · replies within ${hours}h`, tone: 'muted' };
}

/** True while a question of theirs is still open at the Hub, also past its time (the Hub pays it back after that): the thread is read again until it is. */
export function isOpen(questions: readonly ThreadQuestion[]): boolean {
  return questions.some((q) => q.mine && q.status === 'awaiting_response');
}

/** True while the person cannot ask again: a question is open and its window has not closed (I4's locked composer). */
export function isWaiting(questions: readonly ThreadQuestion[], now: number): boolean {
  return questions.some((q) => q.mine && q.status === 'awaiting_response' && Date.parse(q.deadlineAt) > now);
}

/**
 * What the composer offers once nothing is waiting: "Ask a follow-up · ₦1,500" after an answer, "Try again · ₦200" after a refund, and
 * "Ask a question · ₦1,500" in a thread with no question yet (the board draws no empty thread; this is the lead default, as the sheet
 * and the profile button say "question").
 */
export function composerLabel(latest: ThreadQuestion | null, priceKobo: number): string {
  const verb = latest === null ? 'Ask a question' : latest.status === 'refunded' ? 'Try again' : 'Ask a follow-up';
  return `${verb} · ${formatNaira(priceKobo)}`;
}
