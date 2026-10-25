import type { FxAccount, FxCurrencies } from '../fx/api';
import { sidesOf, startingSides } from '../fx/swap/model';

/*
 * R2-MONEY D-01: a person who opened from outside Nigeria has no naira account, so a swap is between their own accounts (the Hub answers a
 * naira side with "You have no naira account. Swap between your other accounts."). The naira side is left out for them.
 */
const account = (id: string, currency: string, status = 'open'): FxAccount =>
  ({ id, currency, kind: 'fiat', decimals: 2, chain: null, status, balance: { currency, availableMinor: 500, bookedMinor: 500 }, details: null, detailsStatus: 'pending', detailsNote: null, openedAt: '2026-10-20T09:00:00.000Z' }) as unknown as FxAccount;
const currencies = { naira: { decimals: 2 }, currencies: [], products: { openAccount: true, swap: true } } as unknown as FxCurrencies;

describe('the sides of a swap', () => {
  it('start with the naira wallet for a person who has one', () => {
    const sides = sidesOf(currencies, [account('a1', 'USD')], 100_000);
    expect(sides.map((s) => s.code)).toEqual(['NGN', 'USD']);
  });

  it('leave the naira wallet out for a person outside Nigeria, and start from the account the route names', () => {
    const sides = sidesOf(currencies, [account('a1', 'GBP'), account('a2', 'EUR'), account('a3', 'USD', 'opening')], null, false);
    expect(sides.map((s) => s.code)).toEqual(['EUR', 'GBP']);
    const start = startingSides(sides, 'GBP', undefined);
    expect(start.from?.code).toBe('GBP');
    expect(start.to?.code).toBe('EUR');
  });

  it('have no pair when a person outside Nigeria holds one account', () => {
    const sides = sidesOf(currencies, [account('a1', 'GBP')], null, false);
    const start = startingSides(sides, 'GBP', undefined);
    expect(start.from?.code).toBe('GBP');
    expect(start.to).toBeUndefined();
  });
});
