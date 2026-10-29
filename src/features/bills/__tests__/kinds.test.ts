import { categoryCodeOf, categoryOfKind, kindOfCategory, kindOfRecord, kindsListed, recentNumber } from '../kinds';

const category = (name: string, code?: string) => ({ id: 1, name, code });

describe('the kinds of bill', () => {
  it('matches the provider’s categories by code first, then by name, and keeps no code of its own', () => {
    expect(kindOfCategory(category('Airtime', 'AIRTIME'))).toBe('airtime');
    expect(kindOfCategory(category('Mobile Data Service', 'MOBILEDATA'))).toBe('data');
    expect(kindOfCategory(category('Data Bundle', 'DATA_BUNDLE'))).toBe('data');
    expect(kindOfCategory(category('Utility Bills', 'UTILITYBILLS'))).toBe('electricity');
    expect(kindOfCategory(category('Power', 'POWER'))).toBe('electricity');
    expect(kindOfCategory(category('Cable Bill Payment', 'CABLEBILLS'))).toBe('cable');
    // No code: the name decides.
    expect(kindOfCategory(category('Cable TV'))).toBe('cable');
    expect(kindOfCategory(category('Electricity'))).toBe('electricity');
  });

  it('does not sell what the app has no tile for', () => {
    expect(kindOfCategory(category('Internet Service', 'INTSERVICE'))).toBeNull();
    expect(kindOfCategory(category('School fees', 'EDUCATION'))).toBeNull();
    expect(kindOfCategory(category('Tax', 'TAX'))).toBeNull();
  });

  it('draws the kinds the provider lists, in the board’s order, and none it does not', () => {
    const listed = [category('Cable Bill Payment', 'CABLEBILLS'), category('Airtime', 'AIRTIME'), category('Tax', 'TAX')];
    expect(kindsListed(listed).map((k) => k.kind)).toEqual(['airtime', 'cable']);
    expect(kindsListed([])).toEqual([]);
    expect(categoryOfKind('electricity', listed)).toBeUndefined();
    expect(categoryOfKind('cable', listed)?.name).toBe('Cable Bill Payment');
  });

  it('lists billers by the category’s code, else its name', () => {
    expect(categoryCodeOf(category('Cable Bill Payment', 'CABLEBILLS'))).toBe('CABLEBILLS');
    expect(categoryCodeOf(category('Airtime'))).toBe('Airtime');
  });

  it('knows a recorded bill’s kind from the category name the app sent', () => {
    expect(kindOfRecord('Cable Bill Payment')).toBe('cable');
    expect(kindOfRecord('Airtime')).toBe('airtime');
    expect(kindOfRecord('Something else')).toBeNull();
  });

  it('draws a recent number as the board does: a meter in full, a phone or smartcard with its middle hidden', () => {
    expect(recentNumber('electricity', '04123456789')).toBe('Meter 0412 3456 789');
    expect(recentNumber('airtime', '08031234412')).toBe('0803 ••• 4412');
    expect(recentNumber('cable', '7021345688')).toBe('Smartcard 7021 ••• 88');
    expect(recentNumber('data', '123')).toBe('123');
  });
});
