import type { PayFeeLine } from '@/components/pay-sheet';
import { formatMoney } from '@/components/Money';
import { hueFor } from '@/features/feed/model';
import { APP_NAME_COPY } from '@/lib/appName';
import { FEE_LABELS, OWN_WALLET } from '@/features/wallet/history/model';
import { longDateTime } from '@/features/wallet/history/lagosTime';

import type { FeeQuote, Recipient, Transfer } from './api';

/** The wallet a send comes from, as W10 and W12 name it. */
export const WALLET_NAME = OWN_WALLET;

/** The line under W9's amount: "Naira balance ₦485,250.75". */
export const BALANCE_LABEL = 'Naira balance';

/**
 * A bank account a send goes to (WALLET-03): the bank and the ten digits, the name the BANK gave for them (never a typed one),
 * the `nameToken` that name check came with (null for a saved account, which the Hub compares with its kept name) and whether
 * the account is already saved.
 */
export type BankPayee = {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  nameToken: string | null;
  saved: boolean;
};

/** A person or a bank account on the way through the screens: what the route carries from W7 or W8 to W12 (everything but the id is for drawing). */
export type Payee = {
  /** A WAWU user's id; for a bank account the key `bank:<code>:<number>` that its intent and its fee quote are kept under. */
  wawuUserId: string;
  name: string;
  handle: string | null;
  avatarUrl: string | null;
  tick: Recipient['tick'];
  /** Set when the send goes to a bank account (W8 to W14); a WAWU user has none. */
  bank?: BankPayee;
};

/** The key a bank account is kept under in a payment intent: stable for the same bank and number, never a WAWU user's id. */
export const bankKey = (bankCode: string, accountNumber: string): string => `bank:${bankCode}:${accountNumber}`;

/** The payee a bank account makes: the name is the bank's, and the avatar is the name's initials. */
export function bankPayeeOf(name: string, bank: BankPayee): Payee {
  return { wawuUserId: bankKey(bank.bankCode, bank.accountNumber), name, handle: null, avatarUrl: null, tick: null, bank };
}

/** "GTBank · 0123456789": the line under a bank account's name (W13). */
export const bankLine = (bank: Pick<BankPayee, 'bankName' | 'accountNumber'>): string => `${bank.bankName} · ${bank.accountNumber}`;

/** The provider's part of a bank send's fee, as every fee breakdown names it (R-53): never the provider's own name. */
export const BANK_CHARGE = 'Bank charge';

export const payeeOf = (r: Recipient): Payee => ({ wawuUserId: r.wawuUserId, name: r.displayName, handle: r.handle, avatarUrl: r.avatarUrl, tick: r.tick });

/** The route params that carry a payee (strings only). */
export function payeeParams(p: Payee): Record<string, string> {
  return {
    id: p.wawuUserId,
    name: p.name,
    ...(p.handle ? { handle: p.handle } : {}),
    ...(p.avatarUrl ? { avatar: p.avatarUrl } : {}),
    ...(p.tick ? { tick: p.tick } : {}),
    ...(p.bank
      ? { bankCode: p.bank.bankCode, bankName: p.bank.bankName, accountNumber: p.bank.accountNumber, saved: p.bank.saved ? '1' : '0', ...(p.bank.nameToken ? { nameToken: p.bank.nameToken } : {}) }
      : {}),
  };
}

type Param = string | string[] | undefined;
const one = (value: Param): string | undefined => (Array.isArray(value) ? value[0] : value);

/** The payee a route carries; null when the id or the name is missing (the screen then goes back to W7). */
export function payeeFromParams(params: Record<string, Param>): Payee | null {
  const id = one(params.id);
  const name = one(params.name);
  if (!id || !name) return null;
  const tick = one(params.tick);
  const bankCode = one(params.bankCode);
  const bankName = one(params.bankName);
  const accountNumber = one(params.accountNumber);
  // A bank account needs all three, or it is not a bank account (the screen then goes back to W7).
  const bank: BankPayee | undefined =
    bankCode && bankName && accountNumber && /^[0-9]{3,6}$/.test(bankCode) && /^[0-9]{10}$/.test(accountNumber)
      ? { bankCode, bankName, accountNumber, nameToken: one(params.nameToken) || null, saved: one(params.saved) === '1' }
      : undefined;
  if (id.startsWith('bank:') && !bank) return null;
  return {
    wawuUserId: id,
    name,
    handle: one(params.handle) || null,
    avatarUrl: one(params.avatar) || null,
    tick: tick === 'creator' || tick === 'professional' ? tick : null,
    ...(bank ? { bank } : {}),
  };
}

export const hueOfPayee = (p: Pick<Payee, 'wawuUserId'>) => hueFor(p.wawuUserId);

/** The tick's kind as `VerifiedTick` names it. */
export const tickKind = (tick: Payee['tick']): 'creator' | 'pro' | undefined => (tick === 'creator' ? 'creator' : tick === 'professional' ? 'pro' : undefined);

/** "@amaka · Creator", "@chidieze · Professional", "@kemi.designs": the line under a name. The word is the tick's own meaning. */
export function payeeLine(p: Pick<Payee, 'handle' | 'tick'> & { bank?: BankPayee }): string {
  if (p.bank) return bankLine(p.bank);
  const handle = p.handle ? `@${p.handle.replace(/^@/, '')}` : '';
  const role = p.tick === 'creator' ? 'Creator' : p.tick === 'professional' ? 'Professional' : '';
  return [handle, role].filter(Boolean).join(' · ');
}

/** The first word of a name: "Amaka" under a recent avatar, "Save Amaka as a beneficiary". */
export const firstName = (name: string): string => name.trim().split(/\s+/)[0] ?? name;

/** What a search text is asked as: spaces trimmed. A pasted phone keeps its digits and its +; the Hub reads the rest. */
export const searchText = (raw: string): string => raw.trim();

/**
 * The quote's parts as lines, each charge as its own part (R-10): Bank charge (R-53), then WAWU's fee. A part that is zero stays
 * (any part can be zero, the sheet shows ₦0.00). Two provider parts would share a label, so they are added into one line.
 */
export function feeLinesOf(quote: Pick<FeeQuote, 'parts'>, providerLabel: string = FEE_LABELS.provider): PayFeeLine[] {
  const lines: PayFeeLine[] = [];
  const add = (label: string, kobo: number) => {
    const found = lines.find((l) => l.label === label);
    if (found) found.amountKobo += kobo;
    else lines.push({ label, amountKobo: kobo });
  };
  for (const part of quote.parts) add(part.source === 'wawu' ? FEE_LABELS.wawu : providerLabel, part.amountKobo);
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
  const providerLabel = t.kind === 'bank_account' ? BANK_CHARGE : FEE_LABELS.provider;
  const rows: ReceiptRow[] = [
    { key: 'reference', label: 'Reference', value: t.reference, copy: true },
    { key: 'date', label: 'Date', value: longDateTime(t.completedAt ?? t.createdAt) },
    { key: 'from', label: 'From', value: WALLET_NAME },
  ];
  if (t.note?.trim()) rows.push({ key: 'note', label: 'Note', value: t.note.trim(), wrap: true });
  rows.push({ key: 'provider', label: providerLabel, value: '', money: t.fee.providerFeeKobo });
  rows.push({ key: 'wawu', label: FEE_LABELS.wawu, value: '', money: t.fee.wawuFeeKobo });
  rows.push({ key: 'fees', label: 'Fees', value: '', money: t.fee.providerFeeKobo + t.fee.wawuFeeKobo });
  rows.push({ key: 'total', label: 'Total paid', value: '', money: t.totalKobo, strong: true });
  return rows;
}

/** The person a send went to, as W12's line reads: "To Amaka Nwosu · @amaka". */
export function toLine(t: Pick<Transfer, 'toWawuUser'> & Partial<Pick<Transfer, 'toBankAccount'>>): string {
  const account = t.toBankAccount;
  if (account) return `To ${account.accountName} · ${account.bankName} ${account.accountNumber}`;
  const who = t.toWawuUser;
  if (!who) return '';
  return ['To ' + who.displayName, who.handle ? `@${who.handle.replace(/^@/, '')}` : ''].filter(Boolean).join(' · ');
}

/** Share receipt (R-33): the phone's share sheet gets the receipt as text, with its reference. Every figure is the one on screen. */
export function shareText(t: Transfer): string {
  const money = (kobo: number) => formatMoney(kobo, { decimals: kobo % 100 !== 0 });
  const out = [`${APP_NAME_COPY} receipt`, `${money(t.amountKobo)} sent`, toLine(t)].filter(Boolean);
  for (const row of receiptRows(t)) {
    if (row.key === 'reference') continue;
    out.push(`${row.label}: ${row.money !== undefined ? formatMoney(row.money) : row.value}`);
  }
  out.push(`Reference: ${t.reference}`);
  return out.join('\n');
}

/* ---------------------------------------------------------------------------------------------------------------- */
/* W14 · a send to a bank account the bank did not take */

/** W14's headline, as the board draws it. */
export const FAILED_TITLE = "Transfer didn't go through";
/** Under the headline when the Hub gave no sentence of its own: it says only that the bank did not take it (nothing about money). */
export const FAILED_FALLBACK = 'The bank did not take this transfer.';

/** How a failed bank send stands (BRIEF W14, rule 6): money back as the Hub recorded it, or not recorded yet. Nothing here is promised. */
export type FailedView = {
  title: string;
  /** The Hub's own sentence for why, or the plain fallback. */
  reason: string;
  /** `reversed`: the Hub has the reversal on record (`reversal`); `open`: it has not, so no word about the money is written. */
  stands: 'reversed' | 'open';
  /** The reversal's own figures when it is on record. */
  returnedKobo: number | null;
  keptKobo: number | null;
  /** The note under the card: what came back, or where to look. */
  note: { title: string; body: string };
};

const cash = (kobo: number): string => formatMoney(kobo, { decimals: kobo % 100 !== 0 });

/**
 * What W14 says about a failed send, from the Hub's record alone. "Returned to your wallet" is the reversal's `returnedKobo`, and a
 * charge that was kept is its own row (`keptKobo`): never "full" or "nothing was taken" (rule 6). Without a reversal on record the
 * screen says nothing about the money beyond where to look.
 */
export function failedView(t: Pick<Transfer, 'status' | 'statusMessage' | 'failureReason' | 'reversal'>): FailedView {
  const reason = t.statusMessage?.trim() || t.failureReason?.trim() || FAILED_FALLBACK;
  const r = t.reversal;
  if (r) {
    return {
      title: FAILED_TITLE,
      reason,
      stands: 'reversed',
      returnedKobo: r.returnedKobo,
      keptKobo: r.keptKobo,
      note: { title: 'Your money is back', body: `${cash(r.returnedKobo)} is back in your Naira wallet.` },
    };
  }
  return {
    title: FAILED_TITLE,
    reason,
    stands: 'open',
    returnedKobo: null,
    keptKobo: null,
    note: { title: 'Your wallet shows where it stands', body: 'Wallet activity has this transfer and what became of it.' },
  };
}

/** W14's card: what came back (and a charge that was kept), the reference and the date in Lagos time. An open failure shows the amount asked for. */
export function failedRows(t: Pick<Transfer, 'amountKobo' | 'reference' | 'createdAt' | 'completedAt' | 'reversal'>): ReceiptRow[] {
  const r = t.reversal;
  const rows: ReceiptRow[] = r ? [{ key: 'returned', label: 'Returned to your wallet', value: '', money: r.returnedKobo }] : [{ key: 'amount', label: 'Amount', value: '', money: t.amountKobo }];
  if (r && r.keptKobo > 0) rows.push({ key: 'kept', label: 'Charge kept', value: '', money: r.keptKobo });
  rows.push({ key: 'reference', label: 'Reference', value: t.reference, copy: true });
  rows.push({ key: 'date', label: 'Date', value: longDateTime((r ? r.reversedAt : null) ?? t.completedAt ?? t.createdAt) });
  return rows;
}
