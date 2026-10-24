import { fieldChips, chosenField, credentialLine, credentialTitle, emptyCopy, hasProTick, messagePrice, rowsOf, takesMessages } from '../model';
import { nextFromCounts, type DirectoryEntry } from '../api';

const field = (id: string, label: string) => ({ id, label, categories: [id], applyCategory: id, regulated: false });
const FIELDS = [field('accounting_tax', 'Accounting & Tax'), field('engineering', 'Engineering')];
const row = (id: string) => ({ id }) as DirectoryEntry;

describe('the field chips', () => {
  it('a user sees All first, then every field the Hub serves, in its order', () => {
    expect(fieldChips(FIELDS)).toEqual([
      { value: 'all', label: 'All' },
      { value: 'accounting_tax', label: 'Accounting & Tax' },
      { value: 'engineering', label: 'Engineering' },
    ]);
  });

  it('a link with a served field opens on it; anything else opens All', () => {
    expect(chosenField('engineering', FIELDS)).toBe('engineering');
    expect(chosenField(['engineering', 'x'], FIELDS)).toBe('engineering');
    expect(chosenField('finance', FIELDS)).toBe('all');
    expect(chosenField('', FIELDS)).toBe('all');
    expect(chosenField(undefined, FIELDS)).toBe('all');
    expect(chosenField('engineering', [])).toBe('all');
  });
});

describe('paging', () => {
  it('asks for the next page only while rows remain', () => {
    expect(nextFromCounts({ currentPage: 1, perPage: 20, total: 21 }, 20)).toBe(2);
    expect(nextFromCounts({ currentPage: 1, perPage: 20, total: 20 }, 20)).toBeNull();
    expect(nextFromCounts({ currentPage: 2, perPage: 20, total: 41 }, 20)).toBe(3);
    expect(nextFromCounts({ currentPage: 2, perPage: 20, total: 40 }, 20)).toBeNull();
    expect(nextFromCounts({ currentPage: 1, perPage: 20, total: 99 }, 0)).toBeNull();
  });

  it('shows each professional once when a later page repeats a row', () => {
    const rows = rowsOf([
      { items: [row('a'), row('b')], nextPage: 2 },
      { items: [row('b'), row('c')], nextPage: null },
    ]);
    expect(rows.map((r) => r.id)).toEqual(['a', 'b', 'c']);
    expect(rowsOf(undefined)).toEqual([]);
  });
});

describe('what a row and a profile show', () => {
  it('the price shows only for someone taking messages with a price from the Hub', () => {
    expect(messagePrice({ dmEnabled: true, messagePriceKobo: 500000 })).toBe(500000);
    expect(messagePrice({ dmEnabled: true, messagePriceKobo: 1 })).toBe(1);
    expect(messagePrice({ dmEnabled: false, messagePriceKobo: 500000 })).toBeNull();
    expect(messagePrice({ dmEnabled: true, messagePriceKobo: null })).toBeNull();
    expect(messagePrice({ dmEnabled: true, messagePriceKobo: 0 })).toBeNull();
    expect(messagePrice({ dmEnabled: true, messagePriceKobo: Number.NaN })).toBeNull();
  });

  it('P3 is only for a professional who is not taking messages', () => {
    expect(takesMessages({ dmEnabled: true })).toBe(true);
    expect(takesMessages({ dmEnabled: false })).toBe(false);
  });

  it('the tick is the Hub’s professional tick, not the creator one', () => {
    const v = (creator: boolean, professional: boolean) => ({ verification: { creator: { verified: creator, expiresAt: null }, professional: { verified: professional, expiresAt: null } } }) as Pick<DirectoryEntry, 'verification'>;
    expect(hasProTick(v(false, true))).toBe(true);
    expect(hasProTick(v(true, false))).toBe(false);
  });

  it('the credential is named as P6 offered it, with who issued it', () => {
    expect(credentialTitle('licence')).toBe('Practising licence');
    expect(credentialTitle('qualification')).toBe('Qualification');
    expect(credentialTitle('portfolio')).toBe('Work samples');
    expect(credentialTitle('something')).toBeNull();
    expect(credentialLine('ICAN')).toBe('Issued by ICAN · checked by Who Made This?');
    expect(credentialLine('  ICAN ')).toBe('Issued by ICAN · checked by Who Made This?');
    expect(credentialLine(null)).toBe('Checked by Who Made This?');
    expect(credentialLine('   ')).toBe('Checked by Who Made This?');
  });

  it('P4 names the field that is empty; All says nobody is listed yet', () => {
    expect(emptyCopy('engineering', FIELDS)).toEqual({ title: 'Nobody listed in Engineering yet', message: 'If you do this work, apply to be listed here.' });
    expect(emptyCopy('all', FIELDS).title).toBe('Nobody listed yet');
  });
});
