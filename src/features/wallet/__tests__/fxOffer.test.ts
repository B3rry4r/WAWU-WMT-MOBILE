import { addOptions, offerWords, otherBalances } from '../fx/model';
import { currenciesBody, usdAccount, usdcAccount, usdtAccount } from '../fx/testing/fxHub';
import type { FxAccount, FxCurrencies } from '../fx/api';

const body = currenciesBody() as unknown as FxCurrencies;

describe('the currencies a person is offered, in the Hub\'s words (FX-POLISH P1, P2, D2)', () => {
  it('lists what the Hub has on and the person does not hold, coins too, and never a coin the Hub has off', () => {
    const options = addOptions(body, new Set(['USD', 'USDT']));
    expect(options.map((o) => o.value)).toEqual(['EUR', 'GBP', 'CAD', 'AED', 'GHS', 'USDC']);
    expect(options.find((o) => o.value === 'USDC')).toEqual({ value: 'USDC', label: 'USD Coin (USDC)', coin: true });
  });

  it('offers nothing while the Hub has opening accounts off, or before it has answered', () => {
    expect(addOptions(currenciesBody({ openAccount: false }) as unknown as FxCurrencies, new Set())).toEqual([]);
    expect(addOptions(null, new Set())).toEqual([]);
  });

  it('names the currencies as the Hub offers them, and every coin as "crypto"', () => {
    expect(offerWords(addOptions(body, new Set()))).toBe('dollars, euros, pounds, Canadian dollars, dirhams, cedis and crypto');
    expect(offerWords(addOptions(body, new Set(['EUR', 'GBP', 'CAD', 'AED', 'GHS', 'USDT', 'USDC'])))).toBe('dollars');
    expect(offerWords(addOptions(body, new Set(['USD', 'EUR', 'GBP', 'CAD', 'AED', 'GHS'])))).toBe('crypto');
    expect(offerWords([])).toBe('');
  });
});

describe('Home\'s other balances (D1)', () => {
  const eur = { ...usdAccount, id: 'e1', currency: 'EUR', balance: { currency: 'EUR', availableMinor: 310, bookedMinor: 310 } } as unknown as FxAccount;
  const gbpUnread = { ...usdAccount, id: 'g1', currency: 'GBP', balance: null } as unknown as FxAccount;
  const usdtBase = { ...usdtAccount, id: 'u2', chain: 'base', balance: { currency: 'USDT', availableMinor: 1_000, bookedMinor: 1_000 } } as unknown as FxAccount;

  it('gives each held currency its own figure, in the Hub\'s order, and never one total', () => {
    expect(otherBalances([eur, usdAccount as unknown as FxAccount])).toEqual([
      { code: 'USD', minor: 124_050, decimals: 2 },
      { code: 'EUR', minor: 310, decimals: 2 },
    ]);
  });

  it('leaves out an account whose balance was not read or that is not open, rather than draw a 0 the provider did not say', () => {
    expect(otherBalances([gbpUnread, usdcAccount as unknown as FxAccount])).toEqual([]);
    expect(otherBalances(null)).toEqual([]);
  });

  it('draws a coin held on two networks as one coin, its networks\' own figures together, and none when one network could not be read', () => {
    expect(otherBalances([usdtAccount as unknown as FxAccount, usdtBase])).toEqual([{ code: 'USDT', minor: 33_000, decimals: 2 }]);
    expect(otherBalances([usdtAccount as unknown as FxAccount, { ...usdtBase, balance: null }])).toEqual([]);
  });
});
