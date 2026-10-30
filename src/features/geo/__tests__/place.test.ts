import { locationText, regionWord, whereLine } from '../place';
import { deviceRegion, startingCountry } from '../deviceRegion';

describe('a profile shows where a person is', () => {
  it('a person with a city and a region shows both with their country', () => {
    expect(whereLine({ city: 'Ikeja', regionName: 'Lagos', countryName: 'Nigeria', location: 'Lagos' })).toBe('Ikeja, Lagos, Nigeria');
    expect(whereLine({ regionName: 'Greater Accra', countryName: 'Ghana' })).toBe('Greater Accra, Ghana');
  });
  it('a person who only has the older free text keeps it, and it beats a country alone', () => {
    expect(whereLine({ location: 'Lekki, Lagos', countryName: 'Nigeria' })).toBe('Lekki, Lagos');
  });
  it('a person with only a country shows the country, and one with nothing shows nothing', () => {
    expect(whereLine({ countryName: 'Ghana' })).toBe('Ghana');
    expect(whereLine({ city: ' ', regionName: null, countryName: null, location: '  ' })).toBeNull();
  });
  it('saving writes the line the web reads from the same three parts', () => {
    expect(locationText({ city: 'Ikeja', regionName: 'Lagos', countryName: 'Nigeria' })).toBe('Ikeja, Lagos, Nigeria');
    expect(locationText({ city: '', regionName: '', countryName: null })).toBeNull();
  });
});

describe('a region field uses the country\'s own word', () => {
  const of = (type: string, n: number) => Array.from({ length: n }, () => ({ type }));
  it('Nigeria says State, Kenya says County, Canada says Province', () => {
    expect(regionWord([...of('State', 36), ...of('Capital territory', 1)])).toBe('State');
    expect(regionWord(of('County', 47))).toBe('County');
    expect(regionWord([...of('Province', 10), ...of('Territory', 3)])).toBe('Province');
  });
  it('a formal type reads as the plain word: France Department, Austria State, Libya District', () => {
    expect(regionWord([...of('Metropolitan department', 96), ...of('Metropolitan region', 5)])).toBe('Department');
    expect(regionWord(of('Federal länder', 9))).toBe('State');
    expect(regionWord(of('Popularate', 22))).toBe('District');
    expect(regionWord(of('Canton', 26))).toBe('Canton');
  });
  it('a long description for a type just says Region', () => {
    expect(regionWord(of('Geographical entity', 1))).toBe('Region');
    expect(regionWord(of('Islands, groups of islands', 9))).toBe('Region');
    expect(regionWord(of('Autonomous region', 5))).toBe('Region');
  });
  it('a country of several kinds in equal measure, or with none, just says Region', () => {
    expect(regionWord([...of('Country', 4), ...of('Unitary authority', 60), ...of('London borough', 33), ...of('Council area', 32)])).toBe('Region');
    expect(regionWord([])).toBe('Region');
  });
});

describe('the phone field starts on the phone\'s own country', () => {
  const listed = [
    { code: 'NG', dialCode: '+234' },
    { code: 'GH', dialCode: '+233' },
    { code: 'AQ', dialCode: null },
  ];
  it('the device\'s region is used when the Hub\'s list holds it with a calling code, else Nigeria', () => {
    expect(startingCountry(listed, 'GH')).toBe('GH');
    expect(startingCountry(listed, 'FR')).toBe('NG');
    expect(startingCountry(listed, 'AQ')).toBe('NG');
    expect(startingCountry(listed, null)).toBe('NG');
  });
  it('the region is read from the system\'s locale through Intl, and a locale without one gives none', () => {
    const real = Intl.DateTimeFormat;
    const lie = (locale: string) => {
      jest.spyOn(Intl, 'DateTimeFormat').mockImplementation((() => ({ resolvedOptions: () => ({ locale }) })) as unknown as typeof Intl.DateTimeFormat);
    };
    lie('en-NG');
    expect(deviceRegion()).toBe('NG');
    lie('pt_BR');
    expect(deviceRegion()).toBe('BR');
    lie('zh-Hant-TW');
    expect(deviceRegion()).toBe('TW');
    lie('en');
    expect(deviceRegion()).toBeNull();
    jest.restoreAllMocks();
    expect(Intl.DateTimeFormat).toBe(real);
  });

  // WALK-FIX H3 (29 Oct walk): an Android phone set to "English (United States)" in Nigeria started sign-up on +1 / United States, because
  // the region was read from the LANGUAGE locale. The phone's zone names where it is.
  describe('WALK-FIX H3 · the phone\'s region, not its language', () => {
    const phone = (locale: string | null, timeZone: string | null) => () => ({ locale, timeZone });
    it('an English (United States) phone in Nigeria starts on Nigeria', () => {
      expect(deviceRegion(phone('en-US', 'Africa/Lagos'))).toBe('NG');
      expect(startingCountry([{ code: 'US', dialCode: '+1' }, { code: 'NG', dialCode: '+234' }], deviceRegion(phone('en-US', 'Africa/Lagos')))).toBe('NG');
    });
    it('an English (United States) phone in Ghana starts on Ghana', () => {
      expect(deviceRegion(phone('en-US', 'Africa/Accra'))).toBe('GH');
    });
    it('a phone with no region at all gives none, so the field starts on Nigeria', () => {
      expect(deviceRegion(phone('en', null))).toBeNull();
      expect(deviceRegion(phone(null, null))).toBeNull();
      expect(startingCountry([{ code: 'US', dialCode: '+1' }, { code: 'NG', dialCode: '+234' }], deviceRegion(phone('en', null)))).toBe('NG');
    });
    it('a phone whose region is the United Kingdom starts on the United Kingdom', () => {
      expect(deviceRegion(phone('en-GB', 'Europe/London'))).toBe('GB');
    });
    it('a phone whose region is the United States still starts on the United States', () => {
      expect(deviceRegion(phone('en-US', 'America/New_York'))).toBe('US');
      expect(startingCountry([{ code: 'US', dialCode: '+1' }, { code: 'NG', dialCode: '+234' }], deviceRegion(phone('en-US', 'America/Chicago')))).toBe('US');
    });
    it('a runtime that throws asking gives none', () => {
      expect(deviceRegion(() => {
        throw new Error('no Intl');
      })).toBeNull();
    });
  });
});
