import { shortReference } from '../reference';
import { failedRows, receiptRows, shareText } from '../model';
import type { Transfer } from '../api';
import { withdrawReceiptRows } from '@/features/withdraw/model';
import { fxReference, swapRows, sendRows } from '@/features/wallet/fx/FxReceiptScreen';

/*
 * R2-MONEY D-03: the receipt shows the board's short reference "WAW-XXXX-XXXX", derived from the stored one by a fixed rule that the Hub's
 * admin lookup (backend `src/money/transfers/transfer-reference.ts`, its spec holds the same fixture) uses to find the send. Any other
 * reference is shown whole: never a reference nobody can search.
 */
const ID = '8f2a91c3-5b7e-4d10-a6c2-0123456789ab';

describe('the short reference', () => {
  it('is the first eight hex digits of the send id, upper case, in two groups of four, for a send to a person and to a bank (the same fixture as the Hub spec)', () => {
    expect(shortReference(`wawu-send-${ID}`)).toBe('WAW-8F2A-91C3');
    expect(shortReference(`wawu-bank-${ID}`)).toBe('WAW-8F2A-91C3');
  });

  it('leaves a reference of another shape whole', () => {
    for (const other of [`wawu-bank-sch-${ID}`, `wawu-send-${ID}-fee`, 'WAW-8F2A-91C3', 'FLW-1234', 'WAW-LEMG-NZYF']) {
      expect(shortReference(other)).toBe(other);
    }
  });
});

describe('where a send shows its reference', () => {
  const transfer = { reference: `wawu-send-${ID}`, kind: 'wawu_user', amountKobo: 500_000, totalKobo: 501_000, fee: { providerFeeKobo: 0, wawuFeeKobo: 1000 }, createdAt: '2026-10-24T10:00:00.000Z', completedAt: '2026-10-24T10:00:05.000Z', note: null, recipient: null } as unknown as Transfer;

  it('W12 shows the short reference, and the shared receipt carries it', () => {
    expect(receiptRows(transfer).find((r) => r.key === 'reference')?.value).toBe('WAW-8F2A-91C3');
    expect(shareText(transfer)).toContain('Reference: WAW-8F2A-91C3');
    expect(shareText(transfer)).not.toContain('wawu-send-');
  });

  it('W14 shows the short reference too', () => {
    const rows = failedRows({ amountKobo: 500_000, reference: `wawu-bank-${ID}`, createdAt: '2026-10-24T10:00:00.000Z', completedAt: null, reversal: null });
    expect(rows.find((r) => r.key === 'reference')?.value).toBe('WAW-8F2A-91C3');
  });

  it('R2-MONEY2 M-03: the withdraw receipt (W19) shows the short reference, never the stored one', () => {
    const rows = withdrawReceiptRows({ reference: `wawu-bank-${ID}`, fee: { providerFeeKobo: 4000, wawuFeeKobo: 2500, totalFeeKobo: 6500 }, totalKobo: 506_500 } as never);
    expect(rows.find((r) => r.key === 'reference')?.value).toBe('WAW-8F2A-91C3');
  });

  it('R2-MONEY2 M-03: a swap (W21) and a crypto send show the short reference from their id, never the id', () => {
    expect(fxReference(ID)).toBe('WAW-8F2A-91C3');
    expect(shortReference(`wawu-fx-${ID}`)).toBe('WAW-8F2A-91C3');
    const swap = swapRows({ id: ID, status: 'completed', fromCurrency: 'NGN', toCurrency: 'USD', fromAccountId: null, toAccountId: 'a', amountFromMinor: 15_000_000, amountToMinor: 10_000, fromDecimals: 2, toDecimals: 2, rate: '0.000666', providerFeeMinor: 0, wawuFeeMinor: 0, failureReason: null, createdAt: '2026-10-24T09:00:00.000Z', completedAt: null } as never);
    expect(swap.find((r) => r.key === 'ref')?.value).toBe('WAW-8F2A-91C3');
    const send = sendRows({ id: ID, status: 'completed', accountId: 'a', currency: 'USDT', chain: 'base', decimals: 6, address: '0x4f2a9c1d00000000000000000000000000009c1d', amountMinor: 1_000_000, providerFeeMinor: 0, wawuFeeMinor: 0, failureReason: null, createdAt: '2026-10-24T09:00:00.000Z', completedAt: null } as never);
    expect(send.find((r) => r.key === 'ref')?.value).toBe('WAW-8F2A-91C3');
  });
});
