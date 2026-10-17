import type { PillTone } from '@/components/StatusPill';

import type { PaidEarning, PaidQuestion } from './api';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
/** Under this long to go, the time left is drawn red (I9: "red under 2 hours"). */
export const URGENT_BELOW_MS = 2 * HOUR;

const two = (n: number) => String(n).padStart(2, '0');

/** The time to the Hub's deadline, in whole minutes counted down (never up): null once it has passed. */
export function msLeft(deadlineAt: string, now: number): number | null {
  const at = new Date(deadlineAt).getTime();
  if (Number.isNaN(at)) return null;
  const ms = at - now;
  return ms > 0 ? ms : null;
}

/** "1h 12m", "9h 04m", "42m": how long is left, as the pills and the banner write it. Under a minute reads "under 1m". */
export function leftWords(ms: number): string {
  const total = Math.floor(ms / MINUTE);
  if (total < 1) return 'under 1m';
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return hours > 0 ? `${hours}h ${two(minutes)}m` : `${minutes}m`;
}

/** The inbox row's shorter form: "18h left to reply", "42m left to reply". */
export function leftShort(ms: number): string {
  const total = Math.floor(ms / MINUTE);
  if (total < 1) return 'under 1m';
  return total >= 60 ? `${Math.floor(total / 60)}h` : `${total}m`;
}

/** I9's pill: "1h 12m left", in the danger tone under 2 hours and the warning tone above. */
export function leftPill(ms: number): { label: string; tone: Extract<PillTone, 'danger' | 'warning'> } {
  return { label: `${leftWords(ms)} left`, tone: ms < URGENT_BELOW_MS ? 'danger' : 'warning' };
}

/** "Replied in 49 minutes" from the Hub's two times: the question's and the first reply's. */
export function repliedIn(sentAt: string, respondedAt: string | null): string | null {
  if (!respondedAt) return null;
  const ms = new Date(respondedAt).getTime() - new Date(sentAt).getTime();
  if (Number.isNaN(ms)) return null;
  const minutes = Math.max(0, Math.round(ms / MINUTE));
  if (minutes < 1) return 'Replied in under a minute';
  if (minutes < 60) return `Replied in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `Replied in ${hours}h${rest ? ` ${two(rest)}m` : ''}`;
}

/** What the card under a question says, and in which tone. Every figure in it is passed in: the Hub's. */
export type QuestionCard = { tone: 'warning' | 'positive' | 'neutral'; icon: 'Clock' | 'CircleCheck' | 'RotateCcw'; title: string; body: string };

/** The state of one question, as the screen draws it: open, answered, or out of time (the Hub's `refunded`, or a deadline that has passed). */
export type QuestionState = 'open' | 'answered' | 'closed';

export function stateOf(question: Pick<PaidQuestion, 'status' | 'deadlineAt'>, now: number): QuestionState {
  if (question.status === 'responded') return 'answered';
  if (question.status === 'refunded') return 'closed';
  return msLeft(question.deadlineAt, now) === null ? 'closed' : 'open';
}

type Money = (kobo: number) => string;

/**
 * I10, I11 and the missed question: the card under a question.
 * - Open: "Reply in 1h 12m to earn ₦1,275", "That's 85% of ₦1,500. Miss it and Bisi gets her ₦1,500 back." With no share from the Hub
 *   (a question that holds none) the card says the time and the refund only.
 * - Answered (R-11, R-55): where the share is, in the Hub's words for it: in the wallet, on its way (earnings reach the wallet once a
 *   day), or waiting for a wallet to open.
 * - Closed: the time ran out and the price goes back to the person who asked.
 */
export function cardOf(question: PaidQuestion, asker: string | null, now: number, money: Money): QuestionCard {
  const state = stateOf(question, now);
  const earning: PaidEarning | null = question.creatorEarning;
  const price = money(question.amountKobo);
  if (state === 'open') {
    const left = leftWords(msLeft(question.deadlineAt, now) ?? 0);
    // The Hub serves no pronoun for a person, so the refund line says "their" (the brief's "her" is for the one asker it drew).
    const refund = asker ? `Miss it and ${asker} gets their ${price} back.` : `Miss it and they get their ${price} back.`;
    return earning
      ? { tone: 'warning', icon: 'Clock', title: `Reply in ${left} to earn ${money(earning.amountKobo)}`, body: `That's ${earning.sharePct}% of ${price}. ${refund}` }
      : { tone: 'warning', icon: 'Clock', title: `Reply in ${left}`, body: refund };
  }
  if (state === 'answered') {
    const replied = repliedIn(question.sentAt, question.respondedAt) ?? 'Answered';
    if (!earning) return { tone: 'positive', icon: 'CircleCheck', title: 'Answered', body: `${replied}.` };
    const share = money(earning.amountKobo);
    if (earning.state === 'in_wallet') return { tone: 'positive', icon: 'CircleCheck', title: `${share} is in your wallet`, body: `${replied}.` };
    if (earning.state === 'waiting_for_wallet') return { tone: 'positive', icon: 'CircleCheck', title: `${share} is waiting for you`, body: `${replied}. It lands when you open your wallet.` };
    return { tone: 'positive', icon: 'CircleCheck', title: `${share} is on its way to your wallet`, body: `${replied}. Earnings reach your wallet once a day.` };
  }
  return { tone: 'neutral', icon: 'RotateCcw', title: 'The time to reply ran out', body: asker ? `${asker}'s ${price} goes back to them.` : `The ${price} goes back to the person who asked.` };
}
