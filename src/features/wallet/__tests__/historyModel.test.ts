import type { Transaction } from '../api/history';
import { clockTime, dayKey, dayLabel, longDateTime, monthKey, monthName, rowTime } from '../history/lagosTime';
import {
  accountLine,
  clockMeta,
  emptyWords,
  entriesOf,
  FILTER_CHIPS,
  headlineOf,
  receiptOf,
  rowCount,
  rowFace,
  searchOf,
  shareText,
  typeLabel,
} from '../history/model';

/** A made-up movement in the contract's shape (MONEY-15), none of the canvas's samples. */
function row(over: Partial<Transaction> = {}): Transaction {
  return {
    id: 'row-1',
    direction: 'out',
    category: 'transfer',
    status: 'completed',
    amountKobo: 2_500_000,
    fee: { providerFeeKobo: 4_000, wawuFeeKobo: 2_500, totalFeeKobo: 6_500 },
    totalKobo: 2_506_500,
    description: 'Transfer · GTBank',
    counterparty: { kind: 'bank_account', name: 'Ngozi Test', avatarUrl: null, wawuUserId: null, bankName: 'GTBank', accountNumberLast4: '6789' },
    link: null,
    note: null,
    reference: 'REF-TEST-0001',
    transferId: null,
    paymentId: null,
    group: null,
    createdAt: '2026-10-07T09:24:00.000Z',
    ...over,
  };
}

const tip = row({
  id: 'tip-1',
  direction: 'in',
  category: 'earning',
  amountKobo: 200_000,
  fee: { providerFeeKobo: 0, wawuFeeKobo: 0, totalFeeKobo: 0 },
  totalKobo: 200_000,
  description: 'Tip · How I frame a shot',
  counterparty: { kind: 'wawu_user', name: 'Bayo Test', avatarUrl: null, wawuUserId: 'u-bayo', bankName: null, accountNumberLast4: null },
  link: { kind: 'tip', targetId: 'c-1', title: 'How I frame a shot' },
  note: 'Great shoot',
  reference: 'REF-TIP-0001',
});

describe('Lagos time: the zone the Hub counts days and months in', () => {
  it('reads the Lagos clock, one hour ahead of UTC', () => {
    expect(clockTime('2026-10-07T09:24:00.000Z')).toBe('10:24');
    expect(clockTime('2026-10-07T23:30:00.000Z')).toBe('00:30');
    expect(clockTime('nonsense')).toBe('');
  });

  it('puts 23:30 UTC on the next Lagos day, so a row never lands under the wrong label', () => {
    expect(dayKey('2026-10-07T23:30:00.000Z')).toBe('2026-10-08');
    expect(dayKey('2026-10-07T22:59:59.000Z')).toBe('2026-10-07');
    expect(dayKey('nonsense')).toBe('');
  });

  it('labels a day Today, Yesterday, then by weekday and date, with the year only when it is not this one', () => {
    const now = new Date('2026-10-07T12:00:00.000Z');
    expect(dayLabel('2026-10-07T00:10:00.000Z', now)).toBe('Today');
    expect(dayLabel('2026-10-06T20:00:00.000Z', now)).toBe('Yesterday');
    expect(dayLabel('2026-10-02T09:00:00.000Z', now)).toBe('Fri, 2 Oct');
    expect(dayLabel('2025-12-24T09:00:00.000Z', now)).toBe('Wed, 24 Dec 2025');
    // A time ahead of the phone's clock reads as today, never as a day in the future.
    expect(dayLabel('2026-10-09T09:00:00.000Z', now)).toBe('Today');
  });

  it('writes W27’s date as "7 Oct 2026, 10:24"', () => {
    expect(longDateTime('2026-10-07T09:24:00.000Z')).toBe('7 Oct 2026, 10:24');
  });

  it('names the month the summary is for in Lagos time: 23:30 UTC on 30 September is already October there', () => {
    expect(monthKey(new Date('2026-09-30T22:30:00.000Z'))).toBe('2026-09');
    expect(monthKey(new Date('2026-09-30T23:30:00.000Z'))).toBe('2026-10');
    expect(monthName(new Date('2026-09-30T22:30:00.000Z'))).toBe('September');
    expect(monthName(new Date('2026-09-30T23:30:00.000Z'))).toBe('October');
  });

  it('keeps W1’s row times as they were: the clock today, Yesterday, a weekday within the week, then the date', () => {
    const now = new Date('2026-10-07T12:00:00.000Z');
    expect(rowTime('2026-10-07T09:24:00.000Z', now)).toBe('10:24');
    expect(rowTime('2026-10-06T09:24:00.000Z', now)).toBe('Yesterday');
    expect(rowTime('2026-10-03T09:24:00.000Z', now)).toBe('Sat');
    expect(rowTime('2026-09-22T09:24:00.000Z', now)).toBe('22 Sep');
    expect(rowTime('2025-09-22T09:24:00.000Z', now)).toBe('22 Sep 2025');
  });
});

describe('the search the Hub is asked for', () => {
  it('waits for two characters after the spaces are dropped, and never asks with more than the Hub takes', () => {
    expect(searchOf('')).toBeNull();
    expect(searchOf(' a ')).toBeNull();
    expect(searchOf('  ng ')).toBe('ng');
    expect(searchOf('x'.repeat(80))).toHaveLength(60);
  });
});

describe('a row, as W1 and W26 draw it', () => {
  it('shows a debit as the total that left the wallet, fees included, and a credit as it arrived', () => {
    expect(rowFace(row()).amountKobo).toBe(-2_506_500);
    expect(rowFace(tip).amountKobo).toBe(200_000);
  });

  it('names a person with an avatar and the line under them as the description; a bank or a bill gets an icon', () => {
    const face = rowFace(tip);
    expect(face.title).toBe('Bayo Test');
    expect(face.subtitle).toBe('Tip · How I frame a shot');
    expect(face.lead).toMatchObject({ kind: 'avatar', name: 'Bayo Test' });
    expect(rowFace(row()).lead).toEqual({ kind: 'icon', icon: 'ArrowUpRight', tone: 'neutral' });
    expect(rowFace(row({ category: 'bill', description: 'Bill · Power', counterparty: null })).lead).toMatchObject({ icon: 'Receipt' });
    expect(rowFace(row({ direction: 'in', counterparty: null, description: 'Top up' })).lead).toEqual({ kind: 'icon', icon: 'ArrowDownLeft', tone: 'in' });
  });

  it('shows a row with nobody named by its description alone', () => {
    const face = rowFace(row({ counterparty: null, description: 'Held payment' }));
    expect(face.title).toBe('Held payment');
    expect(face.subtitle).toBeUndefined();
  });

  it('splits a grouped row into the unlock and its count, so W26 reads "Unlock · piece" over "3 buyers"', () => {
    const group = row({
      direction: 'in',
      category: 'earning',
      description: 'Unlock · Night shoots · 3 buyers',
      counterparty: null,
      link: { kind: 'content_unlock', targetId: 'c-9', title: 'Night shoots' },
      group: { key: 'g2.abc', count: 3, firstAt: '2026-10-07T07:00:00.000Z', lastAt: '2026-10-07T09:00:00.000Z' },
    });
    const face = rowFace(group);
    expect(face.title).toBe('Unlock · Night shoots');
    expect(face.subtitle).toBe('3 buyers');
    expect(face.lead).toEqual({ kind: 'icon', icon: 'LockOpen', tone: 'in' });
    // A group whose description has no count part keeps the whole description.
    expect(rowFace({ ...group, description: 'Unlock' }).title).toBe('Unlock');
  });

  it('says what is not done: Pending, Failed or Reversed before the time, and nothing for a completed row', () => {
    expect(clockMeta(row())).toBe('10:24');
    expect(clockMeta(row({ status: 'pending' }))).toBe('Pending · 10:24');
    expect(clockMeta(row({ status: 'failed' }))).toBe('Failed · 10:24');
    expect(clockMeta(row({ status: 'reversed' }))).toBe('Reversed · 10:24');
    expect(rowFace(row({ status: 'pending' })).status).toBe('Pending');
    expect(rowFace(row()).status).toBeUndefined();
  });
});

describe('the list under day labels', () => {
  const now = new Date('2026-10-07T12:00:00.000Z');
  const at = (id: string, iso: string) => row({ id, createdAt: iso });

  it('puts a label over each Lagos day, newest first as the Hub sent them', () => {
    const entries = entriesOf([[at('a', '2026-10-07T10:00:00.000Z'), at('b', '2026-10-07T08:00:00.000Z'), at('c', '2026-10-06T10:00:00.000Z')]], now);
    expect(entries.map((e) => (e.kind === 'day' ? e.label : e.row.id))).toEqual(['Today', 'a', 'b', 'Yesterday', 'c']);
    expect(rowCount(entries)).toBe(3);
  });

  it('keeps one label for a day that carries on to the next page', () => {
    const entries = entriesOf([[at('a', '2026-10-07T10:00:00.000Z')], [at('b', '2026-10-07T08:00:00.000Z'), at('c', '2026-10-05T08:00:00.000Z')]], now);
    expect(entries.map((e) => (e.kind === 'day' ? e.label : e.row.id))).toEqual(['Today', 'a', 'b', 'Mon, 5 Oct', 'c']);
  });

  it('draws a row the Hub sent twice once, where it was first seen, so no key is used twice', () => {
    const entries = entriesOf([[at('a', '2026-10-07T10:00:00.000Z')], [at('a', '2026-10-07T10:00:00.000Z'), at('b', '2026-10-07T08:00:00.000Z')]], now);
    expect(entries.filter((e) => e.kind === 'row').map((e) => e.key)).toEqual(['a', 'b']);
    expect(new Set(entries.map((e) => e.key)).size).toBe(entries.length);
  });

  it('puts a row whose time cannot be read under the label above it, not under an empty one', () => {
    const entries = entriesOf([[at('a', '2026-10-07T10:00:00.000Z'), at('b', 'garbled')]], now);
    expect(entries.map((e) => (e.kind === 'day' ? e.label : e.row.id))).toEqual(['Today', 'a', 'b']);
  });

  it('is empty with no pages', () => {
    expect(entriesOf([], now)).toEqual([]);
    expect(entriesOf([[]], now)).toEqual([]);
  });
});

describe('the chips and what each says when it has nothing (W28)', () => {
  it('are the 16 Oct board’s four (no Bills, R-52), in its order, with the contract’s values', () => {
    expect(FILTER_CHIPS.map((c) => [c.value, c.label])).toEqual([
      ['all', 'All'],
      ['money_in', 'Money in'],
      ['money_out', 'Money out'],
      ['content', 'Content'],
    ]);
  });

  it('gives Content W28’s words ("No content sales"), and every chip words of its own with no mention of bills', () => {
    expect(emptyWords('content', null)).toMatchObject({ title: 'No content sales yet', message: 'Sales and unlocks of your work show here.' });
    for (const chip of ['all', 'money_in', 'money_out', 'content'] as const) {
      const words = emptyWords(chip, null);
      expect(words.title).not.toMatch(/—|bill/i);
      expect(words.message).not.toMatch(/—|bill/i);
    }
    // The contract still has a bills filter and no chip offers it: it is never worded as bills.
    expect(emptyWords('bills', null)).toEqual(emptyWords('all', null));
  });

  it('says what a search found nothing for, and under which chip', () => {
    expect(emptyWords('all', 'zzz')).toMatchObject({ icon: 'Search', title: 'No results' });
    expect(emptyWords('all', 'zzz').message).toContain('“zzz”');
    expect(emptyWords('money_out', 'zzz').message).toContain('under Money out');
  });
});

describe('W27: the receipt of one movement', () => {
  it('reads the type from the description and builds the headline as the Hub’s own receipt does', () => {
    expect(typeLabel(tip)).toBe('Tip');
    expect(typeLabel(row())).toBe('Transfer');
    expect(typeLabel({ description: '' })).toBe('Transaction');
    expect(headlineOf(tip)).toBe('Tip from Bayo Test');
    expect(headlineOf(row())).toBe('Transfer to Ngozi Test');
    expect(headlineOf(row({ counterparty: null, description: 'Top up' }))).toBe('Top up');
  });

  it('lists a tip received: type, what it was on, from, to the Naira wallet, a note, the Lagos date and the reference, with no charges', () => {
    const receipt = receiptOf(tip);
    expect(receipt.lines.map((l) => [l.key, l.label, l.value])).toEqual([
      ['type', 'Type', 'Tip'],
      ['on', 'On', 'How I frame a shot'],
      ['from', 'From', 'Bayo Test'],
      ['to', 'To', 'Naira wallet'],
      ['note', 'Note', 'Great shoot'],
      ['date', 'Date', '7 Oct 2026, 10:24'],
      ['reference', 'Reference', 'REF-TIP-0001'],
    ]);
    expect(receipt.lines.find((l) => l.key === 'reference')?.copy).toBe(true);
    // What a person wrote, and a title, wrap when long instead of being cut.
    expect(receipt.lines.filter((l) => l.wrap).map((l) => l.key)).toEqual(['on', 'note']);
    expect(receipt.amountKobo).toBe(200_000);
    expect(receipt.status).toEqual({ label: 'Completed', tone: 'positive', icon: 'Check' });
    expect(receipt.cost).toBeNull();
  });

  it('shows a debit’s parts as the Hub sent them: ₦25,000 + (₦40 + ₦25) = ₦25,065 (BRIEF W27, R-10), the total being what left', () => {
    const receipt = receiptOf(row());
    expect(receipt.amountKobo).toBe(-2_506_500);
    expect(receipt.cost?.map((c) => [c.label, c.kobo])).toEqual([
      ['Amount', 2_500_000],
      ["Bank charge", 4_000],
      ["WAWU's fee", 2_500],
      ['Total', 2_506_500],
    ]);
    expect(receipt.lines.find((l) => l.key === 'from')?.value).toBe('Naira wallet');
    expect(receipt.lines.find((l) => l.key === 'to')?.value).toBe('Ngozi Test');
    expect(receipt.lines.find((l) => l.key === 'account')?.value).toBe('GTBank ••6789');
  });

  it('leaves WAWU’s fee out when there is none, and keeps the provider’s charge even when it is ₦0 (an airtime top-up)', () => {
    const receipt = receiptOf(
      row({ category: 'bill', description: 'Bill · MTN airtime', counterparty: null, amountKobo: 200_000, totalKobo: 200_000, fee: { providerFeeKobo: 0, wawuFeeKobo: 0, totalFeeKobo: 0 } }),
    );
    expect(receipt.cost?.map((c) => [c.label, c.kobo])).toEqual([
      ['Amount', 200_000],
      ["Bank charge", 0],
      ['Total', 200_000],
    ]);
    // Nobody named: no From or To line is made up for the other side.
    expect(receipt.lines.map((l) => l.key)).toEqual(['type', 'from', 'date', 'reference']);
  });

  it('shows the status in words as well as a tone, so colour is never the only signal', () => {
    expect(receiptOf(row({ status: 'pending' })).status).toEqual({ label: 'Pending', tone: 'warning', icon: 'Clock' });
    expect(receiptOf(row({ status: 'failed' })).status).toEqual({ label: 'Failed', tone: 'danger', icon: 'X' });
    expect(receiptOf(row({ status: 'reversed' })).status).toEqual({ label: 'Reversed', tone: 'neutral', icon: 'RotateCcw' });
  });

  it('writes the other side’s account as the bank and the last four digits, or nothing', () => {
    expect(accountLine({ kind: 'bank_account', name: 'N', avatarUrl: null, wawuUserId: null, bankName: 'GTBank', accountNumberLast4: '6789' })).toBe('GTBank ••6789');
    expect(accountLine({ kind: 'bank_account', name: 'N', avatarUrl: null, wawuUserId: null, bankName: null, accountNumberLast4: '6789' })).toBe('••6789');
    expect(accountLine({ kind: 'wawu_user', name: 'N', avatarUrl: null, wawuUserId: 'u', bankName: null, accountNumberLast4: null })).toBeNull();
  });
});

describe('Share receipt: the text the phone’s share sheet is given (R-33)', () => {
  it('carries the headline, the status, every line and the reference, and its figures are the screen’s', () => {
    const text = shareText(row());
    const lines = text.split('\n');
    expect(lines[0]).toBe('Who Made This? receipt');
    expect(lines[1]).toBe('Transfer to Ngozi Test');
    expect(lines[2]).toBe('−₦25,065.00 completed');
    expect(text).toContain('Amount: ₦25,000.00');
    expect(text).toContain("Bank charge: ₦40.00");
    expect(text).toContain("WAWU's fee: ₦25.00");
    expect(text).toContain('Total: ₦25,065.00');
    expect(lines.at(-2)).toBe('Date: 7 Oct 2026, 10:24');
    expect(lines.at(-1)).toBe('Reference: REF-TEST-0001');
  });

  it('is the same for money in, with no charges, and never holds an em-dash', () => {
    const text = shareText(tip);
    expect(text).toContain('₦2,000.00 completed');
    expect(text).not.toMatch(/charge|fee/i);
    expect(text).toContain('Reference: REF-TIP-0001');
    expect(shareText(row())).not.toContain('—');
  });
});
