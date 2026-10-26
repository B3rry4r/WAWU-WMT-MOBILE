import { detailRows } from '../fx/FxDetailsSheet';
import type { FxDetails } from '../fx/api';

const details = (over: Partial<FxDetails>): FxDetails => ({
  status: 'active',
  beneficiaryName: 'Ada Okafor',
  accountNumber: null,
  routingNumber: null,
  swiftCode: null,
  iban: null,
  sortCode: null,
  bankName: null,
  bankAddress: null,
  chain: null,
  address: null,
  ...over,
});

describe('account details rows (FX-POLISH P4)', () => {
  it('shows a number once when the account number is the IBAN, however it is spaced or cased', () => {
    const same = detailRows(details({ accountNumber: 'GB87CLRB04286206452697', iban: 'GB87 CLRB 0428 6206 4526 97' }));
    expect(same.map((r) => r.label)).toEqual(['Account name', 'Account number (IBAN)']);
    expect(same[1]?.value).toBe('GB87CLRB04286206452697');
    const lower = detailRows(details({ accountNumber: 'gb87clrb04286206452697', iban: 'GB87CLRB04286206452697' }));
    expect(lower.filter((r) => r.label.includes('IBAN'))).toHaveLength(1);
  });

  it('keeps both when they differ', () => {
    const rows = detailRows(details({ accountNumber: '04286206', iban: 'GB87CLRB04286206452697' }));
    expect(rows.map((r) => r.label)).toEqual(['Account name', 'Account number', 'IBAN']);
  });

  it('keeps an IBAN with no account number as the IBAN', () => {
    expect(detailRows(details({ iban: 'DE89370400440532013000' })).map((r) => r.label)).toEqual(['Account name', 'IBAN']);
  });
});
