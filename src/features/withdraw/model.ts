import { formatMoney } from '@/components/Money';
import { koboOfText, pressKey } from '@/components/amount-entry';
import { BANK_CHARGE, feeLinesOf } from '@/features/send/model';
import { shortReference } from '@/features/send/reference';
import type { FeeQuote, Transfer } from '@/features/send/api';
import { FEE_LABELS } from '@/features/wallet/history/model';
import { clockTime, longDateTime } from '@/features/wallet/history/lagosTime';
import { arrivalMinutesOf, usuallyWithin } from '@/features/wallet/arrival';
import type { PayoutAccount } from '@/features/wallet/api/payoutAccount';

/**
 * The words and the rules of Withdraw (WALLET-05: W17, W19), kept out of the screens so each one is tested by itself.
 *
 * A withdrawal is a bank send to the person's payout account (the Hub's `POST /money/transfers/bank`, `GET /money/payout-account`):
 * the same quote, the same PIN, the same one-key-per-attempt rule as a send to any bank account. Every figure here is the Hub's
 * quote, the bank's balance or the send the Hub holds; the board's literals (₦25 fee, "In a few minutes") are never used.
 */

export const WITHDRAW_TITLE = 'Withdraw';
export const AVAILABLE_LABEL = 'Available in Naira';
export const AMOUNT_LABEL = 'Amount';
export const MAX_LABEL = 'Max';
export const TO_LABEL = 'To';
export const CHANGE_LABEL = 'Change';

/** How often a withdrawal the bank has not settled is read again (`GET /money/transfers/{id}`, the Hub's record). Default (agent), owner may override. */
export const POLL_MS = 4000;
/** The amount's quote is asked for once the person stops typing for this long. Default (agent), owner may override. */
export const SETTLE_MS = 400;

const cash = (kobo: number): string => formatMoney(kobo, { decimals: kobo % 100 !== 0 });

/** A typed or pasted amount as text the keypad's own rules accept: digits and one point, two decimals, no stray "₦" or commas. */
export function sanitizeAmount(typed: string): string {
  return [...typed.replace(/[₦,\s]/g, '')].reduce((text, char) => pressKey(text, char), '');
}

/** "50,000" or "50,000.5": the whole part grouped by thousands as it is typed, the point and decimals kept as typed. */
export function groupedAmount(text: string): string {
  if (text === '') return '';
  const [whole = '', fraction] = text.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}

/** The kobo a typed text stands for. */
export const amountKobo = (text: string): number => koboOfText(sanitizeAmount(text));

/** What W17's "To" card says: "Access Bank · 0987654321", and under it "Lennox Emmanuel · payout account". */
export const destinationLine = (payout: Pick<PayoutAccount, 'bankName' | 'accountNumber'>): string => `${payout.bankName} · ${payout.accountNumber}`;
export const destinationSub = (payout: Pick<PayoutAccount, 'accountName'>): string => `${payout.accountName} · payout account`;

/** The key a withdrawal's payment intent is kept under: stable for the same account, never a send to the same account by hand (that is `bank:...`). */
export const withdrawKey = (payout: Pick<PayoutAccount, 'bankCode' | 'accountNumber'>): string => `withdraw:${payout.bankCode}:${payout.accountNumber}`;

/** The fee lines of a quote, the provider's part named "Bank charge" (R-53), then "Fees" when there are two (the pay sheet's rule). */
export function withdrawFeeRows(quote: Pick<FeeQuote, 'parts'>): { key: string; label: string; kobo: number }[] {
  const lines = feeLinesOf(quote, BANK_CHARGE);
  const rows = lines.map((line) => ({ key: line.label, label: line.label, kobo: line.amountKobo }));
  if (lines.length > 1) rows.push({ key: 'fees', label: 'Fees', kobo: lines.reduce((sum, line) => sum + line.amountKobo, 0) });
  return rows;
}

/** The line under the button: what the bank account gets. */
export const bankGetsLine = (amount: number): string => `Your bank gets ${cash(amount)}`;

/** The button's words: the total that leaves the wallet, fees included (brief rule 5). */
export const withdrawLabel = (totalKobo: number | null): string => (totalKobo === null ? 'Withdraw' : `Withdraw ${cash(totalKobo)}`);

/**
 * Why Withdraw is off, in the order the person can act on it, or null when it is on. Each is a state of W17, entered by its real
 * cause: no payout account saved, a payout account that is not in the person's own name (R-51: the Hub refuses it before the PIN
 * too), no amount, more than the balance, the fees pushing it over, today's limit, a quote whose parts do not make its total.
 */
export type WithdrawBlock =
  | { kind: 'no_account' }
  | { kind: 'not_your_name' }
  | { kind: 'no_amount' }
  | { kind: 'over_balance'; balanceKobo: number }
  | { kind: 'short_with_fees'; balanceKobo: number; totalKobo: number; shortKobo: number }
  | { kind: 'over_limit'; line: string }
  | { kind: 'no_total' };

export type WithdrawInput = {
  payout: Pick<PayoutAccount, 'matchesBvnName'> | null;
  amountKobo: number;
  balanceKobo: number | null;
  quote: FeeQuote | null;
};

/** True when the quote's total is the amount plus its parts (whole kobo), so the button, the PIN line and the send agree. */
export const quoteMakesTotal = (quote: Pick<FeeQuote, 'amountKobo' | 'parts' | 'totalKobo'>): boolean =>
  quote.amountKobo + quote.parts.reduce((sum, part) => sum + part.amountKobo, 0) === quote.totalKobo;

export function withdrawBlock(input: WithdrawInput): WithdrawBlock | null {
  if (input.payout === null) return { kind: 'no_account' };
  if (input.payout.matchesBvnName === false) return { kind: 'not_your_name' };
  if (input.amountKobo <= 0) return { kind: 'no_amount' };
  if (input.balanceKobo !== null && input.amountKobo > input.balanceKobo) return { kind: 'over_balance', balanceKobo: input.balanceKobo };
  const quote = input.quote;
  if (quote === null) return null;
  if (!quoteMakesTotal(quote)) return { kind: 'no_total' };
  if (!quote.withinDailyLimit) {
    const left = quote.remainingTodayKobo;
    return { kind: 'over_limit', line: left === null || left === undefined ? 'This is over your limit for today.' : `This is over your limit for today. You can withdraw ${cash(left)} more today.` };
  }
  if (input.balanceKobo !== null && quote.totalKobo > input.balanceKobo) {
    return { kind: 'short_with_fees', balanceKobo: input.balanceKobo, totalKobo: quote.totalKobo, shortKobo: quote.totalKobo - input.balanceKobo };
  }
  return null;
}

/** The sentence under the field for a block that has one. */
export function blockLine(block: WithdrawBlock): string | null {
  switch (block.kind) {
    case 'over_balance':
      return `Over your balance of ${cash(block.balanceKobo)}`;
    case 'short_with_fees':
      return `This costs ${cash(block.totalKobo)} with the fees, and you have ${cash(block.balanceKobo)}. Take ${cash(block.shortKobo)} off the amount.`;
    case 'over_limit':
      return block.line;
    case 'not_your_name':
      return 'This payout account is not in your name. Change it to withdraw.';
    case 'no_total':
      return 'We couldn’t work out the total. Try again in a moment.';
    default:
      return null;
  }
}

/**
 * The most that can be withdrawn from `balanceKobo`: the amount whose total with its fees is the balance. The fees are the Hub's
 * (`feeAt` asks the fee quote for an amount), asked for at the balance first and then at what is left, until the total fits; a fee that
 * grows with the amount is followed down, never guessed. 0 when the balance does not cover the fees at all.
 */
export async function maxWithdrawKobo(balanceKobo: number, feeAt: (amountKobo: number) => Promise<number>): Promise<number> {
  let candidate = balanceKobo;
  for (let round = 0; round < 4 && candidate > 0; round += 1) {
    const fee = await feeAt(candidate);
    const room = balanceKobo - fee;
    if (room <= 0) return 0;
    if (room >= candidate) return candidate;
    candidate = room;
  }
  return Math.max(candidate, 0);
}

/* ---------------------------------------------------------------------------------------------------------------- */
/* W19 · on its way */

export type StepState = 'done' | 'current' | 'upcoming';
export type Step = { key: 'requested' | 'sent' | 'arrived'; label: string; state: StepState; time: string | null; /** The Hub's usual time, under the last step while it waits (FIX-109). */ note?: string };

type TimelineAt = { step?: string; at?: unknown };

/** The time the Hub stamped on a timeline step. The contract types only `step`, so the stamp is read defensively (G-WALLET-05-1). */
function stamp(transfer: Pick<Transfer, 'timeline'>, step: string): string | null {
  const entry = (transfer.timeline as TimelineAt[]).find((e) => e.step === step);
  return typeof entry?.at === 'string' && entry.at !== '' ? entry.at : null;
}

/**
 * W19's three steps from the Hub's record alone: Requested, "Sent to <bank>" and "In your bank account". A step is done when the
 * Hub stamped it; the first step not done is the one in progress; the rest wait. Times are the Lagos clock. The last step says
 * "Usually within N minutes" only when the Hub sent `arrivalMinutes` (it does while the send is pending and a time is set,
 * FIX-109); otherwise nothing is promised about when it will happen.
 */
export function timelineSteps(transfer: Pick<Transfer, 'timeline' | 'status' | 'createdAt' | 'completedAt' | 'toBankAccount' | 'arrivalMinutes'>): Step[] {
  const bank = transfer.toBankAccount?.bankName ?? 'your bank';
  const requested = stamp(transfer, 'requested') ?? transfer.createdAt;
  const sent = stamp(transfer, 'sent_to_bank');
  const arrived = stamp(transfer, 'completed') ?? (transfer.status === 'completed' ? transfer.completedAt : null);
  const done = [true, sent !== null || arrived !== null, arrived !== null];
  const firstOpen = done.findIndex((d) => !d);
  const state = (i: number): StepState => (done[i] ? 'done' : i === firstOpen ? 'current' : 'upcoming');
  const time = (at: string | null) => (at ? clockTime(at) || null : null);
  const usual = arrivalMinutesOf(transfer.arrivalMinutes);
  return [
    { key: 'requested', label: 'Requested', state: state(0), time: time(requested) },
    { key: 'sent', label: `Sent to ${bank}`, state: state(1), time: time(sent) },
    { key: 'arrived', label: 'In your bank account', state: state(2), time: time(arrived), ...(usual !== null && !done[2] ? { note: usuallyWithin(usual) } : {}) },
  ];
}

/** W19's heading by how the withdrawal stands: on its way, or sent once the bank has it. */
export const receiptHeading = (transfer: Pick<Transfer, 'status'>): string => (transfer.status === 'completed' ? 'sent' : 'on its way');

/** "To Access Bank · 0987654321": the line under the heading. */
export function receiptTo(transfer: Pick<Transfer, 'toBankAccount'>): string {
  const account = transfer.toBankAccount;
  return account ? `To ${account.bankName} · ${account.accountNumber}` : '';
}

/** W19's card: the reference, then the fee as its parts, then what left the wallet (BRIEF W19: ₦40 + ₦25 = ₦65 and Total paid). */
export type ReceiptRow = { key: string; label: string; value?: string; money?: number; strong?: boolean; copy?: boolean };

export function withdrawReceiptRows(transfer: Pick<Transfer, 'reference' | 'fee' | 'totalKobo'>): ReceiptRow[] {
  return [
    { key: 'reference', label: 'Reference', value: shortReference(transfer.reference), copy: true },
    { key: 'provider', label: BANK_CHARGE, money: transfer.fee.providerFeeKobo },
    { key: 'wawu', label: FEE_LABELS.wawu, money: transfer.fee.wawuFeeKobo },
    { key: 'fees', label: 'Fees', money: transfer.fee.providerFeeKobo + transfer.fee.wawuFeeKobo },
    { key: 'total', label: 'Total paid', money: transfer.totalKobo, strong: true },
  ];
}

/** Share receipt (R-33): the phone's share sheet gets the receipt as text. Every figure is the one on screen. */
export function withdrawShareText(transfer: Transfer): string {
  const money = (kobo: number) => formatMoney(kobo, { decimals: kobo % 100 !== 0 });
  const lines = ['Who Made This? receipt', `${money(transfer.amountKobo)} ${transfer.status === 'completed' ? 'withdrawn' : 'on its way'}`, receiptTo(transfer)].filter(Boolean);
  lines.push(`Date: ${longDateTime(transfer.completedAt ?? transfer.createdAt)}`);
  for (const row of withdrawReceiptRows(transfer)) {
    if (row.key === 'reference') continue;
    lines.push(`${row.label}: ${money(row.money ?? 0)}`);
  }
  lines.push(`Reference: ${shortReference(transfer.reference)}`);
  return lines.join('\n');
}
