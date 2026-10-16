import type { PayFeeLine } from '@/components/pay-sheet';
import { formatMoney } from '@/components/Money';
import { hueFor } from '@/features/feed/model';
import { FEE_LABELS, OWN_WALLET } from '@/features/wallet/history/model';
import { longDateTime } from '@/features/wallet/history/lagosTime';

import type { FeeQuote, Recipient, Transfer } from './api';

/** The wallet a send comes from, as W10 and W12 name it. */
export const WALLET_NAME = OWN_WALLET;

/** The line under W9's amount: "Naira balance ₦485,250.75". */
export const BALANCE_LABEL = 'Naira balance';

/** A person on the way through the screens: what the route carries from W7 to W12 (everything but the id is for drawing). */
export type Payee = {
  wawuUserId: string;
  name: string;
  handle: string | null;
  avatarUrl: string | null;
  tick: Recipient['tick'];
};

export const payeeOf = (r: Recipient): Payee => ({ wawuUserId: r.wawuUserId, name: r.displayName, handle: r.handle, avatarUrl: r.avatarUrl, tick: r.tick });

/** The route params that carry a payee (strings only). */
export function payeeParams(p: Payee): Record<string, string> {
  return { id: p.wawuUserId, name: p.name, ...(p.handle ? { handle: p.handle } : {}), ...(p.avatarUrl ? { avatar: p.avatarUrl } : {}), ...(p.tick ? { tick: p.tick } : {}) };
}

type Param = string | string[] | undefined;
const one = (value: Param): string | undefined => (Array.isArray(value) ? value[0] : value);

/** The payee a route carries; null when the id or the name is missing (the screen then goes back to W7). */
export function payeeFromParams(params: Record<string, Param>): Payee | null {
  const id = one(params.id);
  const name = one(params.name);
  if (!id || !name) return null;
  const tick = one(params.tick);
  return {
    wawuUserId: id,
    name,
    handle: one(params.handle) || null,
    avatarUrl: one(params.avatar) || null,
    tick: tick === 'creator' || tick === 'professional' ? tick : null,
  };
}

export const hueOfPayee = (p: Pick<Payee, 'wawuUserId'>) => hueFor(p.wawuUserId);

/** The tick's kind as `VerifiedTick` names it. */
export const tickKind = (tick: Payee['tick']): 'creator' | 'pro' | undefined => (tick === 'creator' ? 'creator' : tick === 'professional' ? 'pro' : undefined);

/** "@amaka · Creator", "@chidieze · Professional", "@kemi.designs": the line under a name. The word is the tick's own meaning. */
export function payeeLine(p: Pick<Payee, 'handle' | 'tick'>): string {
  const handle = p.handle ? `@${p.handle.replace(/^@/, '')}` : '';
  const role = p.tick === 'creator' ? 'Creator' : p.tick === 'professional' ? 'Professional' : '';
  return [handle, role].filter(Boolean).join(' · ');
}

/** The first word of a name: "Amaka" under a recent avatar, "Save Amaka as a beneficiary". */
export const firstName = (name: string): string => name.trim().split(/\s+/)[0] ?? name;

/** What a search text is asked as: spaces trimmed. A pasted phone keeps its digits and its +; the Hub reads the rest. */
export const searchText = (raw: string): string => raw.trim();

/**
 * The quote's parts as lines, each charge as its own part (R-10): Fintava's charge, then WAWU's fee. A part that is zero stays
 * (any part can be zero, the sheet shows ₦0.00). Two provider parts would share a label, so they are added into one line.
 */
export function feeLinesOf(quote: Pick<FeeQuote, 'parts'>): PayFeeLine[] {
  const lines: PayFeeLine[] = [];
  const add = (label: string, kobo: number) => {
    const found = lines.find((l) => l.label === label);
    if (found) found.amountKobo += kobo;
    else lines.push({ label, amountKobo: kobo });
  };
  for (const part of quote.parts) add(part.source === 'wawu' ? FEE_LABELS.wawu : FEE_LABELS.provider, part.amountKobo);
  return lines;
}

/** True when the quote's total is the amount plus its parts (whole kobo), so the button, the PIN line and the send agree. */
export function quoteAddsUp(quote: Pick<FeeQuote, 'amountKobo' | 'parts' | 'totalKobo'>): boolean {
  return quote.amountKobo + quote.parts.reduce((sum, p) => sum + p.amountKobo, 0) === quote.totalKobo;
}

/** The sentence W10 shows when today's limit is the reason the send cannot go (the quote's own figures; the Hub's limit check is the authority). */
export function limitLine(quote: Pick<FeeQuote, 'withinDailyLimit' | 'remainingTodayKobo' | 'totalKobo'>): string | null {
  if (quote.withinDailyLimit) return null;
  if (quote.remainingTodayKobo === null || quote.remainingTodayKobo === undefined) return 'This send is over your limit for today.';
  const left = formatMoney(quote.remainingTodayKobo, { decimals: quote.remainingTodayKobo % 100 !== 0 });
  return `This send is over your limit for today. You can send ${left} more today.`;
}

/** When a quote can no longer be used, as the Hub gave it. A quote with no readable time is treated as spent. */
export function quoteSpent(quote: Pick<FeeQuote, 'expiresAt'>, now: number): boolean {
  const at = Date.parse(quote.expiresAt);
  return Number.isNaN(at) || at <= now;
}

/** Words for a send that did not complete, from the Hub's own sentence when it sent one. */
export function failureLine(transfer: Pick<Transfer, 'statusMessage' | 'failureReason'>): string {
  return transfer.statusMessage?.trim() || transfer.failureReason?.trim() || 'This send did not go through. Nothing left your wallet.';
}

/**
 * The still-confirming sentence W12 draws while the provider has not said (G-710). Never "failed", never "sent again". It points
 * at Wallet activity, the one place the result shows: the Hub sends the person who sent no notice when a send is decided.
 */
export const CONFIRMING_LINE = "We're still confirming this send. Don't send it again. Check Wallet activity for the result.";

/** W10's still-confirming sentence: the sheet's own words, pointing to Wallet activity as W12 does. It never says "failed" or "send again". */
export const reviewConfirmingLine = (totalKobo: number): string =>
  `Your payment of ${formatMoney(totalKobo, { decimals: totalKobo % 100 !== 0 })} hasn't been confirmed yet. Don't send it again. Check Wallet activity for the result.`;

/** W10 when the last try at this send got no answer: sending again asks the Hub about that try first (the same Idempotency-Key). */
export const RETRY_LINE = 'Your last try got no answer. Sending again checks it first, so you are not charged twice.';

/**
 * W10 when the phone still held an earlier send for this person and amount and the Hub had already decided it (WALLET-02 round 3).
 * It is not this send: no receipt, nothing saved for it, and the person can send again with a new key. Wallet activity has the row.
 */
export function earlierSendLine(amountKobo: number, name: string, went: boolean): string {
  const money = formatMoney(amountKobo, { decimals: amountKobo % 100 !== 0 });
  return `Your earlier send of ${money} to ${firstName(name)} ${went ? 'went through' : 'did not go through'}. See Wallet activity.`;
}

/** W10 when the intent could not be written to the phone's store: nothing is sent, because a send the phone cannot remember cannot be protected. */
export const NOT_READY_LINE = 'We could not get this payment ready. Try again.';

/** W10's blocked states (nothing was tried, so nothing "didn't go through"): the title above the sentence. */
export const OVER_LIMIT_TITLE = 'Over today’s limit';
export const NO_TOTAL_TITLE = 'We couldn’t work out the total';

/** One row of W12's card. */
export type ReceiptRow = { key: string; label: string; value: string; money?: number; strong?: boolean; copy?: boolean; wrap?: boolean };

/** W12's card: the reference, the date (Lagos time), where it came from, the note, then the charges and the total paid (BRIEF W12). */
export function receiptRows(t: Transfer): ReceiptRow[] {
  const rows: ReceiptRow[] = [
    { key: 'reference', label: 'Reference', value: t.reference, copy: true },
    { key: 'date', label: 'Date', value: longDateTime(t.completedAt ?? t.createdAt) },
    { key: 'from', label: 'From', value: WALLET_NAME },
  ];
  if (t.note?.trim()) rows.push({ key: 'note', label: 'Note', value: t.note.trim(), wrap: true });
  rows.push({ key: 'provider', label: FEE_LABELS.provider, value: '', money: t.fee.providerFeeKobo });
  rows.push({ key: 'wawu', label: FEE_LABELS.wawu, value: '', money: t.fee.wawuFeeKobo });
  rows.push({ key: 'fees', label: 'Fees', value: '', money: t.fee.providerFeeKobo + t.fee.wawuFeeKobo });
  rows.push({ key: 'total', label: 'Total paid', value: '', money: t.totalKobo, strong: true });
  return rows;
}

/** The person a send went to, as W12's line reads: "To Amaka Nwosu · @amaka". */
export function toLine(t: Pick<Transfer, 'toWawuUser'>): string {
  const who = t.toWawuUser;
  if (!who) return '';
  return ['To ' + who.displayName, who.handle ? `@${who.handle.replace(/^@/, '')}` : ''].filter(Boolean).join(' · ');
}

/** Share receipt (R-33): the phone's share sheet gets the receipt as text, with its reference. Every figure is the one on screen. */
export function shareText(t: Transfer): string {
  const money = (kobo: number) => formatMoney(kobo, { decimals: kobo % 100 !== 0 });
  const out = ['Who Made This receipt', `${money(t.amountKobo)} sent`, toLine(t)].filter(Boolean);
  for (const row of receiptRows(t)) {
    if (row.key === 'reference') continue;
    out.push(`${row.label}: ${row.money !== undefined ? formatMoney(row.money) : row.value}`);
  }
  out.push(`Reference: ${t.reference}`);
  return out.join('\n');
}
