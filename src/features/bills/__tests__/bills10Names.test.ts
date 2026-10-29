import { isNigerianMobile, phoneDigits, phoneLine } from '../model';
import { sentenceCase, tidyBillerName } from '../names';

describe('a company’s name, tidy wherever it is drawn (BILLS-10)', () => {
  it('a network is its short whole name, matched on the provider’s name', () => {
    expect(tidyBillerName('MTN NIGERIA')).toBe('MTN');
    expect(tidyBillerName('MTN VTU')).toBe('MTN');
    expect(tidyBillerName('Mtn Data')).toBe('MTN');
    expect(tidyBillerName('AIRTEL NIGERIA')).toBe('Airtel');
    expect(tidyBillerName('Airtel')).toBe('Airtel');
    expect(tidyBillerName('GLO NIGERIA')).toBe('Glo');
    expect(tidyBillerName('Globacom')).toBe('Glo');
    expect(tidyBillerName('9MOBILE NIGERIA')).toBe('9mobile');
    expect(tidyBillerName('9Mobile')).toBe('9mobile');
    expect(tidyBillerName('9 MOBILE DATA')).toBe('9mobile');
    expect(tidyBillerName('ETISALAT')).toBe('9mobile');
  });

  it('a network is also matched on the provider’s code when the name says nothing', () => {
    expect(tidyBillerName('Nigeria', 'MTN')).toBe('MTN');
    expect(tidyBillerName('IKEJA ELECTRIC', 'BIL112')).toBe('Ikeja Electric');
  });

  it('a word that merely contains a network’s letters is not that network', () => {
    expect(tidyBillerName('GLOBAL ENERGY')).toBe('Global Energy');
    expect(tidyBillerName('MTNL SERVICES')).toBe('Mtnl Services');
  });

  it('anything else is tidy title case, with the brands and initials kept right', () => {
    expect(tidyBillerName('IKEJA ELECTRIC')).toBe('Ikeja Electric');
    expect(tidyBillerName('EKO ELECTRICITY DISTRIBUTION COMPANY')).toBe('Eko Electricity Distribution Company');
    expect(tidyBillerName('DSTV')).toBe('DStv');
    expect(tidyBillerName('GOTV')).toBe('GOtv');
    expect(tidyBillerName('STARTIMES')).toBe('StarTimes');
    expect(tidyBillerName('IKEDC PREPAID')).toBe('IKEDC Prepaid');
    expect(tidyBillerName('  ikeja   electric ')).toBe('Ikeja Electric');
    expect(tidyBillerName('IKEJA-ELECTRIC (PREPAID)')).toBe('Ikeja-Electric (Prepaid)');
    expect(tidyBillerName('SPECTRANET 5GB')).toBe('Spectranet 5GB');
  });

  it('a name with mixed case is left as it is, an empty one stays empty, and tidying twice changes nothing', () => {
    expect(tidyBillerName('Ikeja Electric')).toBe('Ikeja Electric');
    expect(tidyBillerName('DStv')).toBe('DStv');
    expect(tidyBillerName('')).toBe('');
    expect(tidyBillerName(null)).toBe('');
    for (const raw of ['MTN NIGERIA', '9MOBILE NIGERIA', 'IKEJA ELECTRIC', 'DSTV', 'IKEDC PREPAID']) {
      expect(tidyBillerName(tidyBillerName(raw))).toBe(tidyBillerName(raw));
    }
  });

  it('the provider’s label for a number is worded as the app words its fields', () => {
    expect(sentenceCase('SmartCard Number')).toBe('Smartcard number');
    expect(sentenceCase('Meter Number')).toBe('Meter number');
    expect(sentenceCase('MOBILE NUMBER')).toBe('Mobile number');
    expect(sentenceCase('  ')).toBe('');
  });
});

describe('an airtime or data number is checked on the phone (BILLS-10)', () => {
  it('is a Nigerian mobile number: eleven digits from 07, 08 or 09', () => {
    for (const ok of ['08089925524', '07031234412', '09031234412', '08031234412']) expect(isNigerianMobile(ok)).toBe(true);
    for (const bad of ['01031234412', '0803123441', '080312344123', '8089925524', '18089925524', '', 'abcdefghijk']) expect(isNigerianMobile(bad)).toBe(false);
  });

  it('reads the +234 form as the same number, and keeps a short number as typed', () => {
    expect(phoneDigits('+234 808 992 5524')).toBe('08089925524');
    expect(phoneDigits('2348089925524')).toBe('08089925524');
    expect(phoneDigits('+234 0808 992 5524')).toBe('08089925524');
    expect(phoneDigits('0808 992 5524')).toBe('08089925524');
    expect(phoneDigits('234')).toBe('234');
    expect(phoneDigits('2348')).toBe('08');
  });

  it('says nothing while the number is short, and names the fix for eleven digits that are not a mobile number', () => {
    expect(phoneLine('0808')).toEqual({ kind: 'none' });
    expect(phoneLine('0808992552')).toEqual({ kind: 'none' });
    expect(phoneLine('08089925524')).toEqual({ kind: 'ok' });
    expect(phoneLine('01089925524')).toEqual({ kind: 'invalid' });
  });
});
