import type { AvatarHue } from '@/components/Avatar';
import type { IconName } from '@/components/icon';
import type { IconTileTone } from '@/components/IconTile';
import type { ChipItem } from '@/components/FilterChips';
import { formatMoney } from '@/components/Money';
import type { PillTone } from '@/components/StatusPill';
import { hueFor } from '@/features/feed/model';
import { APP_NAME_COPY } from '@/lib/appName';

import type { HistoryFilter, Transaction } from '../api/history';
import { clockTime, dayKey, dayLabel, longDateTime } from './lagosTime';

/**
 * What W26, W27 and W28 draw, decided from the server's rows alone (pure, for the tests). Nothing here adds up,
 * rounds or invents an amount: every figure is a field the Hub sent, in kobo, and a debit row's figure is the total
 * that left the wallet, fees included (BRIEF W26, rule 5, R-10).
 */

/** The chips, in the 16 Oct board's order and words (W26): no Bills chip, bills are off (R-52). Their values are the contract's. */
export const FILTER_CHIPS: readonly ChipItem<HistoryFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'money_in', label: 'Money in' },
  { value: 'money_out', label: 'Money out' },
  { value: 'content', label: 'Content' },
];

/** The Hub takes a search of 2 to 60 characters once the spaces around it are dropped. */
export const SEARCH_MIN = 2;
export const SEARCH_MAX = 60;

/** The search the Hub is asked for: the typed text trimmed, or null while it is too short to ask with. */
export function searchOf(typed: string): string | null {
  const text = typed.trim();
  return text.length >= SEARCH_MIN ? text.slice(0, SEARCH_MAX) : null;
}

/** The word after "·" in a row's description: the Hub joins its label, what it was for and the bank with this. */
const SEPARATOR = ' · ';

/**
 * The kind of movement, in the Hub's own word ("Tip", "Transfer", "Unlock"): the description's first part, as the
 * Hub's own receipt reads it (`typeLabelOf` in the Hub's receipt-document.ts), so W27 and the receipt agree.
 */
export function typeLabel(row: Pick<Transaction, 'description'>): string {
  return row.description.split(SEPARATOR)[0].trim() || 'Transaction';
}

function rowIcon(row: Transaction): IconName {
  if (row.category === 'bill' || row.link?.kind === 'bill') return 'Receipt';
  if (row.link?.kind === 'content_unlock') return 'LockOpen';
  if (row.category === 'refund' || row.category === 'reversal') return 'RotateCcw';
  return row.direction === 'in' ? 'ArrowDownLeft' : 'ArrowUpRight';
}

const statusWords: Partial<Record<Transaction['status'], string>> = {
  pending: 'Pending',
  failed: 'Failed',
  reversed: 'Reversed',
};

/** The lead of a row: a person's avatar, or an icon on a tinted circle. */
export type RowLead =
  | { kind: 'avatar'; name: string; hue: AvatarHue; source?: string }
  | { kind: 'icon'; icon: IconName; tone: IconTileTone };

/** One row as W1 and W26 draw it: who or what, the line under it, the signed total and the status when it is not done. */
export type RowFace = {
  id: string;
  title: string;
  subtitle?: string;
  /** Kobo, negative when money left: a debit is the total that left the wallet, fees included (BRIEF W1, W26; rule 5). */
  amountKobo: number;
  /** "Pending", "Failed" or "Reversed"; none for a completed row. */
  status?: string;
  lead: RowLead;
};

/**
 * A grouped row (several unlocks of one piece, W26's "Unlock · Lighting night shoots · 3 buyers") has no one person to
 * name, so its description is its title and its last part, the count the Hub adds ("3 buyers"), is the line under it.
 */
function groupWords(description: string): { title: string; subtitle?: string } {
  const cut = description.lastIndexOf(SEPARATOR);
  if (cut <= 0) return { title: description };
  return { title: description.slice(0, cut), subtitle: description.slice(cut + SEPARATOR.length) };
}

export function rowFace(row: Transaction): RowFace {
  const name = row.counterparty?.name?.trim();
  const words = row.group ? groupWords(row.description) : null;
  const title = words?.title ?? (name || row.description);
  const subtitle = words ? words.subtitle : name && row.description ? row.description : undefined;
  const person = row.counterparty?.kind === 'wawu_user' && name;
  const lead: RowLead = person
    ? { kind: 'avatar', name, hue: hueFor(row.counterparty?.wawuUserId ?? row.id), source: row.counterparty?.avatarUrl ?? undefined }
    : { kind: 'icon', icon: rowIcon(row), tone: row.direction === 'in' ? 'in' : 'neutral' };
  return {
    id: row.id,
    title,
    subtitle,
    amountKobo: row.direction === 'out' ? -row.totalKobo : row.totalKobo,
    status: statusWords[row.status],
    lead,
  };
}

/** What is written at the end of a row: the status and the Lagos clock, "Pending · 10:24", or just "10:24". */
export function clockMeta(row: Transaction): string {
  return [statusWords[row.status], clockTime(row.createdAt)].filter(Boolean).join(' · ');
}

/** A day's label, or a row, in the order the list draws them. */
export type Entry = { kind: 'day'; key: string; label: string } | { kind: 'row'; key: string; row: Transaction };

/**
 * The pages flattened into one list under day labels (W26: "Today", "Yesterday", then dated days), the days in Lagos
 * time. A day continued on the next page keeps its one label. A row seen twice (the Hub documents that a refresh
 * corrects a row whose time moves earlier mid-scroll) is drawn once, where it was first seen.
 */
export function entriesOf(pages: readonly (readonly Transaction[])[], now: Date): Entry[] {
  const out: Entry[] = [];
  const seen = new Set<string>();
  let day: string | null = null;
  for (const row of pages.flat()) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    // A time that cannot be read has no day: the row stands under the label above it.
    const key = dayKey(row.createdAt);
    if (key !== '' && key !== day) {
      day = key;
      out.push({ kind: 'day', key: `day-${key}-${row.id}`, label: dayLabel(row.createdAt, now) });
    }
    out.push({ kind: 'row', key: row.id, row });
  }
  return out;
}

/** How many movements the list holds, without its labels. */
export const rowCount = (entries: readonly Entry[]) => entries.filter((entry) => entry.kind === 'row').length;

/** What a list shows when it has no rows: W28 for a chip, the words for a search, and the first-use words for none at all. */
export type EmptyWords = { icon: IconName; title: string; message: string };

const CHIP_EMPTY: Record<Exclude<HistoryFilter, 'bills'>, EmptyWords> = {
  all: { icon: 'ArrowLeftRight', title: 'No transactions yet', message: 'Money you send, receive and pay shows up here.' },
  money_in: { icon: 'ArrowDownLeft', title: 'No money in yet', message: 'Money you receive shows up here.' },
  money_out: { icon: 'ArrowUpRight', title: 'No money out yet', message: 'Money you send and pay shows up here.' },
  // W28's own words (16 Oct board). The board names the month ("in September"); the list here is the whole history (nothing
  // narrows it to a month), so it says "yet" (Default (agent), owner may override).
  content: { icon: 'Receipt', title: 'No content sales yet', message: 'Sales and unlocks of your work show here.' },
};

export function emptyWords(filter: HistoryFilter, search: string | null): EmptyWords {
  if (search !== null) {
    const where = filter === 'all' ? '' : ` under ${FILTER_CHIPS.find((chip) => chip.value === filter)?.label ?? ''}`;
    return {
      icon: 'Search',
      title: 'No results',
      message: `Nothing${where} matches “${search}”. Try a name, a reference or what it was for.`,
    };
  }
  // `bills` is the contract's filter and no chip offers it (R-52); a list that somehow holds it says what an empty history says.
  return filter === 'bills' ? CHIP_EMPTY.all : CHIP_EMPTY[filter];
}

/* ---------------------------------------------------------------------------------------------------------------- */
/* W27 */

/** The wallet's own side of a movement, as W27 names it (wallet.js line 119: "To  Naira wallet"). */
export const OWN_WALLET = 'Naira wallet';

/**
 * The words of a debit's parts, BRIEF W27: the amount, the provider's charge, WAWU's fee (when there is one) and the
 * total. The provider's part reads "Bank charge", never the provider's name (R-53, DV2-COPY), and WAWU's part keeps
 * "WAWU's fee" (R-10); the send screens and the receipts take both from here.
 */
export const FEE_LABELS = { amount: 'Amount', provider: 'Bank charge', wawu: "WAWU's fee", total: 'Total' } as const;

type StatusLook = { label: string; tone: PillTone; icon: IconName };
const STATUS_LOOK: Record<Transaction['status'], StatusLook> = {
  completed: { label: 'Completed', tone: 'positive', icon: 'Check' },
  pending: { label: 'Pending', tone: 'warning', icon: 'Clock' },
  failed: { label: 'Failed', tone: 'danger', icon: 'X' },
  reversed: { label: 'Reversed', tone: 'neutral', icon: 'RotateCcw' },
};

/** One labelled line of the receipt card. `copy` marks the one the person can put on the clipboard. */
export type ReceiptLine = { key: string; label: string; value: string; copy?: boolean; /** Words a person wrote or a title, which may be long: they wrap instead of being cut. */ wrap?: boolean };

/** One part of what a debit cost, in kobo as the Hub sent it. */
export type CostLine = { key: string; label: string; kobo: number; strong?: boolean };

export type Receipt = {
  /** "Tip from Amaka Nwosu", "Transfer to Chidinma Okoro", or the type alone: the Hub's receipt headline. */
  headline: string;
  /** Kobo, signed: money in is positive, money out is the total that left, negative. */
  amountKobo: number;
  status: StatusLook;
  lead: RowLead;
  lines: ReceiptLine[];
  /** A debit's amount, charges and total; null on money in, which has none (a purchase's WAWU fee is 0 and left out). */
  cost: CostLine[] | null;
  reference: string;
};

/** "GTBank ••6789": the bank and the last four digits the Hub keeps of the other side's account. */
export function accountLine(cp: NonNullable<Transaction['counterparty']>): string | null {
  const parts = [cp.bankName, cp.accountNumberLast4 ? `••${cp.accountNumberLast4}` : null].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : null;
}

export function headlineOf(row: Transaction): string {
  const label = typeLabel(row);
  const name = row.counterparty?.name?.trim();
  return name ? `${label} ${row.direction === 'in' ? 'from' : 'to'} ${name}` : label;
}

/** W27's card and, for a debit, its parts, drawn from the one movement the Hub answered. A line with nothing behind it is left out. */
export function receiptOf(row: Transaction): Receipt {
  const cp = row.counterparty;
  const name = cp?.name?.trim() || undefined;
  const lines: ReceiptLine[] = [{ key: 'type', label: 'Type', value: typeLabel(row) }];
  if (row.link?.title) lines.push({ key: 'on', label: 'On', value: row.link.title, wrap: true });
  const own = OWN_WALLET;
  if (row.direction === 'in') {
    if (name) lines.push({ key: 'from', label: 'From', value: name });
    lines.push({ key: 'to', label: 'To', value: own });
  } else {
    lines.push({ key: 'from', label: 'From', value: own });
    if (name) lines.push({ key: 'to', label: 'To', value: name });
  }
  const account = cp ? accountLine(cp) : null;
  if (account) lines.push({ key: 'account', label: 'Account', value: account });
  if (row.note?.trim()) lines.push({ key: 'note', label: 'Note', value: row.note.trim(), wrap: true });
  lines.push({ key: 'date', label: 'Date', value: longDateTime(row.createdAt) });
  lines.push({ key: 'reference', label: 'Reference', value: row.reference, copy: true });

  const cost: CostLine[] | null =
    row.direction === 'out'
      ? [
          { key: 'amount', label: FEE_LABELS.amount, kobo: row.amountKobo },
          { key: 'provider', label: FEE_LABELS.provider, kobo: row.fee.providerFeeKobo },
          ...(row.fee.wawuFeeKobo > 0 ? [{ key: 'wawu', label: FEE_LABELS.wawu, kobo: row.fee.wawuFeeKobo }] : []),
          { key: 'total', label: FEE_LABELS.total, kobo: row.totalKobo, strong: true },
        ]
      : null;

  return {
    headline: headlineOf(row),
    amountKobo: row.direction === 'out' ? -row.totalKobo : row.totalKobo,
    status: STATUS_LOOK[row.status],
    lead: rowFace(row).lead,
    lines,
    cost,
    reference: row.reference,
  };
}

/**
 * Share receipt (R-33): the receipt as plain text for the phone's share sheet, with its reference. The image and the
 * PDF come after launch (WALLET-12). Every figure is the one on screen.
 */
export function shareText(row: Transaction): string {
  const receipt = receiptOf(row);
  const closing = ['date', 'reference'];
  const out = [`${APP_NAME_COPY} receipt`, receipt.headline, `${formatMoney(receipt.amountKobo)} ${receipt.status.label.toLowerCase()}`];
  for (const line of receipt.lines) if (!closing.includes(line.key)) out.push(`${line.label}: ${line.value}`);
  if (receipt.cost) for (const part of receipt.cost) out.push(`${part.label}: ${formatMoney(part.kobo)}`);
  for (const line of receipt.lines) if (closing.includes(line.key)) out.push(`${line.label}: ${line.value}`);
  return out.join('\n');
}
