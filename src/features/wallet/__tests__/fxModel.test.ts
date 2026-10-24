import {
  chainName,
  formatMinor,
  formatTrim,
  holdClock,
  minorOfText,
  pressAmountKey,
  rateLine,
  secondsUntil,
  spokenMinor,
  textOfMinor,
} from '../fx/amount';
import type { FxAccount, FxCurrencies } from '../fx/api';
import { coinGroups, decimalsFor, maskedNumber, primaryNumber, swapOffered, tabsOf } from '../fx/model';
import { currenciesBody, ADDRESS, usdAccount, usdcAccount, usdtAccount } from '../fx/testing/fxHub';
import { detailRows, shareText } from '../fx/FxDetailsSheet';
import { sendRows, shortAddress, swapRows } from '../fx/FxReceiptScreen';
import { feeRows, feeSummary, quoteProblem, sidesOf, startingSides } from '../fx/swap/model';
import { looksLikeAddress, totalFrom } from '../fx/CryptoSendScreen';

const currencies = currenciesBody() as unknown as FxCurrencies;
const accounts = [usdAccount, usdtAccount, usdcAccount] as unknown as FxAccount[];

describe('WALLET-21 · figures that are not naira use their own places', () => {
  it('writes a figure by its currency and its decimals, and never in a float', () => {
    expect(formatMinor(124_050, 'USD', 2)).toBe('$1,240.50');
    expect(formatMinor(-20_000, 'USD', 2)).toBe('−$200.00');
    expect(formatMinor(1_200, 'EUR', 2, { sign: true })).toBe('+€12.00');
    expect(formatMinor(32_000, 'USDT', 2)).toBe('320.00 USDT');
    // A coin the Hub counts in six places is written in six, not two.
    expect(formatMinor(120_000_000, 'USDC', 6)).toBe('120.000000 USDC');
    expect(formatMinor(5, 'USDT', 6)).toBe('0.000005 USDT');
    // A currency with no places (the Hub may say so) draws none and takes no point.
    expect(formatMinor(1_500, 'GHS', 0)).toBe('GH₵1,500');
    expect(formatMinor(48_525_075, 'NGN', 2)).toBe('₦485,250.75');
    expect(formatMinor(9_007_199_254_740_991, 'USD', 2)).toBe('$90,071,992,547,409.91');
  });

  it('trims the places of whole naira only, as the PIN sheet writes it', () => {
    expect(formatTrim(15_800_000, 'NGN', 2)).toBe('₦158,000');
    expect(formatTrim(15_800_050, 'NGN', 2)).toBe('₦158,000.50');
    expect(formatTrim(10_000, 'USD', 2)).toBe('$100.00');
    expect(formatTrim(12_000, 'USDT', 2)).toBe('120.00 USDT');
    expect(spokenMinor(124_050, 'USD', 2)).toBe('1,240 point 5 0 Dollar');
  });

  it('turns typed text into the smallest unit by whole-number arithmetic', () => {
    expect(minorOfText('120', 2)).toBe(12_000);
    expect(minorOfText('0.10', 2)).toBe(10);
    expect(minorOfText('1.5', 6)).toBe(1_500_000);
    expect(minorOfText('1.', 2)).toBe(100);
    expect(minorOfText('', 2)).toBe(0);
    expect(textOfMinor(12_050, 2)).toBe('120.5');
    expect(textOfMinor(32_000, 2)).toBe('320');
    expect(textOfMinor(1_500_000, 6)).toBe('1.5');
  });

  it('takes keys up to the currency\'s own places and no further', () => {
    const type = (keys: string, decimals: number) => Array.from(keys).reduce((was, k) => pressAmountKey(was, k, decimals), '');
    expect(type('12.345', 2)).toBe('12.34');
    expect(type('12.3456789', 6)).toBe('12.345678');
    expect(type('12.5', 0)).toBe('125');
    expect(type('.5', 2)).toBe('0.5');
    expect(type('007', 2)).toBe('7');
    expect(type('1234567890', 2)).toBe('123456789');
  });

  it('reads the rate as one unit of the foreign side, from the Hub\'s own rate', () => {
    const naira = { fromCurrency: 'NGN' as const, toCurrency: 'USD' as const, fromDecimals: 2, toDecimals: 2, rate: String(100 / 158_000) };
    expect(rateLine(naira)).toBe('$1 = ₦1,580.00');
    expect(rateLine({ ...naira, fromCurrency: 'USD', toCurrency: 'NGN', rate: '1580' })).toBe('$1 = ₦1,580.00');
    expect(rateLine({ fromCurrency: 'NGN', toCurrency: 'USDT', fromDecimals: 2, toDecimals: 6, rate: String(1_000_000 / 158_000) })).toBe('1 USDT = ₦1,580.00');
    expect(rateLine({ ...naira, rate: 'nope' })).toBeNull();
    expect(rateLine({ ...naira, rate: '0' })).toBeNull();
  });

  it('counts the hold from the quote\'s own time, never below zero', () => {
    const now = Date.parse('2026-10-24T09:00:00.000Z');
    expect(secondsUntil('2026-10-24T09:01:30.000Z', now)).toBe(90);
    expect(secondsUntil('2026-10-24T09:00:00.400Z', now)).toBe(1);
    expect(secondsUntil('2026-10-24T08:59:00.000Z', now)).toBe(0);
    expect(secondsUntil('not a time', now)).toBe(0);
    expect(holdClock(90)).toBe('1:30');
    expect(holdClock(28)).toBe('0:28');
    expect(holdClock(-4)).toBe('0:00');
  });
});

describe('WALLET-21 · what the Hub says decides the tabs and the holdings (R-47)', () => {
  it('draws Naira, each currency held or openable, and Crypto', () => {
    expect(tabsOf(currencies, accounts).map((t) => t.key)).toEqual(['naira', 'USD', 'EUR', 'GBP', 'CAD', 'AED', 'GHS', 'crypto']);
    expect(tabsOf(null, accounts)).toEqual([]);
  });

  it('draws no tab for a currency that is switched off and has no account, and none when opening is off', () => {
    const off = currenciesBody({ off: ['EUR', 'AED'] }) as unknown as FxCurrencies;
    expect(tabsOf(off, [usdAccount] as unknown as FxAccount[]).map((t) => t.key)).toEqual(['naira', 'USD', 'GBP', 'CAD', 'GHS', 'crypto']);
    const closed = currenciesBody({ openAccount: false }) as unknown as FxCurrencies;
    expect(tabsOf(closed, [usdAccount] as unknown as FxAccount[]).map((t) => t.key)).toEqual(['naira', 'USD']);
    expect(tabsOf(closed, accounts).map((t) => t.key)).toEqual(['naira', 'USD', 'crypto']);
    // A currency switched off keeps its tab for a person who holds an account in it.
    expect(tabsOf(off, [{ ...usdAccount, currency: 'EUR' }] as unknown as FxAccount[]).map((t) => t.key)).toContain('EUR');
  });

  it('offers Swap only when the Hub has it on and an account is open', () => {
    expect(swapOffered(currencies, accounts)).toBe(true);
    expect(swapOffered(currencies, [usdcAccount] as unknown as FxAccount[])).toBe(false);
    expect(swapOffered({ ...currencies, products: { ...currencies.products, swap: false } }, accounts)).toBe(false);
    expect(swapOffered(currencies, null)).toBe(false);
  });

  it('groups stablecoin accounts by coin, summing the provider\'s own balances, and says when one could not be read', () => {
    const eth2 = { ...usdtAccount, id: 'x', chain: 'base', balance: { currency: 'USDT', availableMinor: 500, bookedMinor: 500 } };
    const groups = coinGroups(currencies, [usdtAccount, eth2, usdcAccount] as unknown as FxAccount[]);
    expect(groups.map((g) => g.code)).toEqual(['USDT', 'USDC']);
    expect(groups[0]).toMatchObject({ availableMinor: 32_500, chains: ['eth', 'base'], name: 'Tether' });
    expect(groups[1]?.availableMinor).toBeNull();
  });

  it('takes decimals from the Hub, and masks an account number to its last four', () => {
    expect(decimalsFor(currencies, accounts as FxAccount[], 'NGN')).toBe(2);
    expect(decimalsFor({ ...currencies, currencies: currencies.currencies.map((c) => (c.code === 'USDC' ? { ...c, decimals: 6 } : c)) }, accounts, 'USDC')).toBe(6);
    expect(primaryNumber(usdAccount as unknown as FxAccount)).toBe('9900004410');
    expect(primaryNumber({ ...usdAccount, details: { ...usdAccount.details, status: 'pending' } } as unknown as FxAccount)).toBeNull();
    expect(maskedNumber('9900004410')).toBe('•••• 4410');
  });
});

describe('WALLET-21 · the swap\'s ends, fees and words', () => {
  it('lists the naira wallet first, then open accounts only', () => {
    const sides = sidesOf(currencies, accounts, 48_525_075);
    expect(sides.map((s) => s.label)).toEqual(['Naira', 'Dollar', 'USDT · Ethereum']);
    expect(sides[0]).toMatchObject({ longLabel: 'Naira wallet', availableMinor: 48_525_075, accountId: null });
    const start = startingSides(sides, 'NGN', 'USD');
    expect([start.from?.code, start.to?.code]).toEqual(['NGN', 'USD']);
    const back = startingSides(sides, 'USD', 'NGN');
    expect([back.from?.code, back.to?.code]).toEqual(['USD', 'NGN']);
    const bare = startingSides(sides, undefined, undefined);
    expect([bare.from?.code, bare.to?.code]).toEqual(['NGN', 'USD']);
  });

  it('writes the fee as the Hub\'s breakdown, never "No fee" for a charge it has not named', () => {
    const q = { fromCurrency: 'NGN' as const, fromDecimals: 2, providerFeeMinor: 0, wawuFeeMinor: 0 };
    expect(feeSummary(q)).toBe('No fee');
    expect(feeSummary({ ...q, providerFeeMinor: null })).toBe('No fee from WAWU');
    expect(feeSummary({ ...q, wawuFeeMinor: 5_000 })).toBe('₦50.00');
    expect(feeRows({ ...q, providerFeeMinor: null, wawuFeeMinor: 5_000 })).toEqual([
      { label: 'Nuvion fee', value: 'Shown on your receipt' },
      { label: 'WAWU fee', value: '₦50.00' },
    ]);
  });

  it('says a provider refusal plainly and by its cause', () => {
    expect(quoteProblem('provider_declined', 'Nuvion cannot swap this pair on dev.')).toEqual({ title: 'This swap was not offered', message: 'Nuvion cannot swap this pair on dev.' });
    expect(quoteProblem('provider_unreachable', '').title).toBe('We couldn’t reach the bank');
    expect(quoteProblem(undefined, 'Boom').message).toBe('Boom');
  });
});

describe('WALLET-21 · receipts, details and sends', () => {
  it('draws the details Nuvion issued and nothing it did not', () => {
    const rows = detailRows(usdAccount.details as never);
    expect(rows.map((r) => r.label)).toEqual(['Account name', 'Account number', 'Routing number', 'SWIFT code', 'Bank', 'Bank address']);
    expect(detailRows({ ...usdAccount.details, status: 'pending' } as never)).toEqual([]);
    expect(shareText('USD', rows.slice(0, 2))).toBe('USD account details\nAccount name: Ada Eze\nAccount number: 9900004410');
  });

  it('writes a send\'s rows in its own places and says the network fee is unnamed until the provider names it', () => {
    const rows = sendRows({ id: 's1', status: 'completed', accountId: 'a', currency: 'USDT', chain: 'eth', decimals: 2, address: ADDRESS, amountMinor: 12_000, providerFeeMinor: null, wawuFeeMinor: 0, failureReason: null, createdAt: '2026-10-24T09:00:00.000Z', completedAt: null } as never);
    expect(Object.fromEntries(rows.map((r) => [r.key, r.value]))).toMatchObject({ network: 'Ethereum', amount: '120.00 USDT', provider: 'None stated', wawu: 'No fee', to: ADDRESS });
    expect(shortAddress(ADDRESS)).toBe('0x71C7...976F');
    expect(chainName('matic')).toBe('Polygon');
  });

  it('writes a swap\'s rate and amounts from the swap itself', () => {
    const rows = swapRows({ id: 'w1', status: 'completed', fromCurrency: 'NGN', toCurrency: 'USD', fromAccountId: null, toAccountId: 'a', amountFromMinor: 15_800_000, amountToMinor: 10_000, fromDecimals: 2, toDecimals: 2, rate: String(100 / 158_000), providerFeeMinor: 0, wawuFeeMinor: 0, failureReason: null, createdAt: '2026-10-24T09:00:00.000Z', completedAt: null } as never);
    expect(Object.fromEntries(rows.map((r) => [r.key, r.value]))).toMatchObject({ gave: '₦158,000.00', got: '$100.00', rate: '$1 = ₦1,580.00', provider: 'No fee' });
  });

  it('only lets an address through that the Hub\'s own check can begin with, and totals what leaves the account', () => {
    expect(looksLikeAddress(ADDRESS)).toBe(true);
    expect(looksLikeAddress('short')).toBe(false);
    expect(looksLikeAddress(`${ADDRESS} `)).toBe(false);
    expect(totalFrom(12_000, 0)).toBe(12_000);
    expect(totalFrom(12_000, 150)).toBe(12_150);
  });
});
