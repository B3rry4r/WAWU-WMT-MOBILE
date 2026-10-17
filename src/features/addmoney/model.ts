import { formatMoney } from '@/components/Money';
import { groupedAccountNumber } from '@/features/open-wallet/pin';
import type { WalletTransaction } from '@/features/wallet/api/home';

/**
 * The words and the rules of Add money (WALLET-05: W15, W45, W46), kept out of the screen so each one is tested by itself.
 *
 * Add money is a bank transfer to the person's own wallet account (R-42). The account is the Hub's (`GET /money/wallet`), the
 * balance is the bank's (`GET /money/wallet/balance`), and a landing is a ledger row (`GET /money/transactions`): nothing here
 * is a figure of the canvas, and nothing here adds up our own records into a balance.
 */

export const ADD_TITLE = 'Add money';
export const ACCOUNT_HEAD = 'Your wallet account';
export const ACCOUNT_LINE = 'Send money here from any Nigerian bank app.';
/*
 * Not drawn: the board's "Free" pill (the Hub serves no inflow fee, G-WALLET-05-5) and its "arrives in a few minutes" and "Usually a
 * few minutes" lines (nothing the Hub serves says how long a transfer in takes, G-WALLET-05-3). Each is drawn when the Hub serves it.
 */
export const WAITING_TITLE = 'Waiting for your transfer';
export const SHARE_LABEL = 'Share details';

/** How often the balance is asked for while a transfer is awaited. Default (agent), owner may override. */
export const POLL_MS = 5000;
/** The newest ledger rows read when the balance rises, and when the wait starts: a top-up is always among the newest few. */
export const LANDING_ROWS = 10;
/** How long a balance change with no transfer in on the ledger is waited on: the Hub writes the row when the bank's notice reaches it. Default (agent), owner may override. */
export const LEDGER_GRACE_MS = 3 * 60 * 1000;

/** The three rows of the card, in the board's order. */
export type AccountRow = { key: 'name' | 'number' | 'bank'; label: string; value: string; copy: string; copyLabel: string };

export type AccountDetails = { accountName: string; accountNumber: string; bankName: string };

/** The rows as the board draws them: the number is grouped for reading, and Copy takes it as the bank gave it. */
export function accountRows(account: AccountDetails): AccountRow[] {
  return [
    { key: 'name', label: 'Account name', value: account.accountName, copy: account.accountName, copyLabel: 'Copy account name' },
    { key: 'number', label: 'Account number', value: groupedAccountNumber(account.accountNumber), copy: account.accountNumber, copyLabel: 'Copy account number' },
    { key: 'bank', label: 'Bank', value: account.bankName, copy: account.bankName, copyLabel: 'Copy bank name' },
  ];
}

/** What Share details hands the phone's share sheet (R-33): the three values, the number as the bank gave it. */
export function shareText(account: AccountDetails): string {
  return ['Who Made This? account details', `Account name: ${account.accountName}`, `Account number: ${account.accountNumber}`, `Bank: ${account.bankName}`].join('\n');
}

/** The shortfall a pay sheet carried here: whole kobo, more than none. Anything else is not a shortfall. */
export function shortfallOf(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string' || !/^[0-9]+$/.test(value)) return null;
  const kobo = Number(value);
  return Number.isSafeInteger(kobo) && kobo > 0 ? kobo : null;
}

/** The note above the card when a pay sheet sent the person here: what is missing, as the sheet itself named it ("Top up at least"). */
export function shortfallNote(kobo: number): { title: string; body: string } {
  return {
    title: `Top up at least ${formatMoney(kobo, { decimals: kobo % 100 !== 0 })}`,
    body: 'Send it to the account below, then go back to finish.',
  };
}

/** A ledger row that is a transfer in: money from a bank account, settled. */
const isTopUp = (row: WalletTransaction): boolean => row.direction === 'in' && row.category === 'top_up' && row.status === 'completed';

/**
 * The transfers that landed while the screen waited: every top-up the screen had not seen when the wait began, newest first, as the
 * Hub sends the rows. A row the person already had (`known`) is never "this transfer". Two close together are both here, so W46 never
 * names one while the balance holds both.
 */
export function landingsOf(rows: readonly WalletTransaction[], known: ReadonlySet<string>): WalletTransaction[] {
  return rows.filter((row) => isTopUp(row) && !known.has(row.id));
}

/** W46's head when more than one transfer landed: how many. The Hub serves no total of them, so each row is listed under it and none is added up here. */
export function manyReceived(count: number): string {
  return `${count} transfers received`;
}

/** W46's line under the amount: "From GTBank ••0921". The bank's own words; a sender with neither bank nor name has no line. */
export function senderLine(row: Pick<WalletTransaction, 'counterparty'>): string | null {
  const who = row.counterparty;
  if (!who) return null;
  const bank = who.bankName?.trim();
  const last4 = who.accountNumberLast4?.trim();
  if (bank) return `From ${bank}${last4 ? ` ••${last4}` : ''}`;
  const name = who.name?.trim();
  return name ? `From ${name}` : null;
}
