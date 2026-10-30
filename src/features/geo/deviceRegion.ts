/**
 * Africa's time zones by country, by the zone's own name. A phone keeps its zone in step with where it is, and unlike the language
 * ("English (United States)", which many phones in Nigeria are set to) it names the country the person is in. expo-localization is not
 * in this app, and a native module is not added for this, so the zone is the region signal the runtime hands us. A zone not listed
 * (America/New_York, Europe/London) is not read as a country: the locale's own region stands for it.
 */
const ZONE_COUNTRY: Readonly<Record<string, string>> = {
  'Africa/Abidjan': 'CI',
  'Africa/Accra': 'GH',
  'Africa/Addis_Ababa': 'ET',
  'Africa/Algiers': 'DZ',
  'Africa/Asmara': 'ER',
  'Africa/Asmera': 'ER',
  'Africa/Bamako': 'ML',
  'Africa/Bangui': 'CF',
  'Africa/Banjul': 'GM',
  'Africa/Bissau': 'GW',
  'Africa/Blantyre': 'MW',
  'Africa/Brazzaville': 'CG',
  'Africa/Bujumbura': 'BI',
  'Africa/Cairo': 'EG',
  'Africa/Casablanca': 'MA',
  'Africa/Conakry': 'GN',
  'Africa/Dakar': 'SN',
  'Africa/Dar_es_Salaam': 'TZ',
  'Africa/Djibouti': 'DJ',
  'Africa/Douala': 'CM',
  'Africa/Freetown': 'SL',
  'Africa/Gaborone': 'BW',
  'Africa/Harare': 'ZW',
  'Africa/Johannesburg': 'ZA',
  'Africa/Juba': 'SS',
  'Africa/Kampala': 'UG',
  'Africa/Khartoum': 'SD',
  'Africa/Kigali': 'RW',
  'Africa/Kinshasa': 'CD',
  'Africa/Lagos': 'NG',
  'Africa/Libreville': 'GA',
  'Africa/Lome': 'TG',
  'Africa/Luanda': 'AO',
  'Africa/Lubumbashi': 'CD',
  'Africa/Lusaka': 'ZM',
  'Africa/Malabo': 'GQ',
  'Africa/Maputo': 'MZ',
  'Africa/Maseru': 'LS',
  'Africa/Mbabane': 'SZ',
  'Africa/Mogadishu': 'SO',
  'Africa/Monrovia': 'LR',
  'Africa/Nairobi': 'KE',
  'Africa/Ndjamena': 'TD',
  'Africa/Niamey': 'NE',
  'Africa/Nouakchott': 'MR',
  'Africa/Ouagadougou': 'BF',
  'Africa/Porto-Novo': 'BJ',
  'Africa/Sao_Tome': 'ST',
  'Africa/Timbuktu': 'ML',
  'Africa/Tripoli': 'LY',
  'Africa/Tunis': 'TN',
  'Africa/Windhoek': 'NA',
  'Atlantic/Cape_Verde': 'CV',
  'Indian/Antananarivo': 'MG',
  'Indian/Comoro': 'KM',
  'Indian/Mahe': 'SC',
  'Indian/Mauritius': 'MU',
};

/** What the runtime says about the phone's settings. Read through `Intl` (no native module). */
export type DeviceLocale = { locale: string | null; timeZone: string | null };

function readDeviceLocale(): DeviceLocale {
  try {
    const options = Intl.DateTimeFormat().resolvedOptions();
    return { locale: typeof options.locale === 'string' ? options.locale : null, timeZone: typeof options.timeZone === 'string' ? options.timeZone : null };
  } catch {
    return { locale: null, timeZone: null };
  }
}

/** The region subtag of a locale tag: "en-US" is "US", "pt_BR" is "BR", "zh-Hant-TW" is "TW", "en" is none. */
function localeRegion(locale: string | null): string | null {
  if (typeof locale !== 'string') return null;
  let region: string | undefined;
  try {
    region = new Intl.Locale(locale).region;
  } catch {
    region = undefined;
  }
  // Hermes and older runtimes: the region is the two-letter subtag after the language ("en-US", "pt_BR", "zh-Hant-TW").
  region ??= locale.split(/[-_]/).slice(1).find((part) => /^[A-Za-z]{2}$/.test(part));
  return region && /^[A-Za-z]{2}$/.test(region) ? region.toUpperCase() : null;
}

/**
 * The country this phone is in, from its own settings through `Intl` (no native module). WALK-FIX H3: the language locale alone said
 * "English (United States)" for many phones in Nigeria and started sign-up on +1. So the zone comes first: when the phone's time zone
 * is one of Africa's, the country it names is the region. Otherwise the locale's region ("en-GB" is "GB", and a phone really set to
 * "en-US" in the United States still is "US"). Null when neither names one ("en" with no zone); the field then starts on Nigeria.
 */
export function deviceRegion(read: () => DeviceLocale = readDeviceLocale): string | null {
  try {
    const { locale, timeZone } = read();
    return (timeZone ? ZONE_COUNTRY[timeZone] : undefined) ?? localeRegion(locale);
  } catch {
    return null;
  }
}

/** Nigeria, the country WAWU starts from when the phone names none or names one the Hub's list does not hold. */
export const FALLBACK_COUNTRY = 'NG';

/** The country a phone field starts on: the device's own when the list holds it (and it has a calling code), else Nigeria. */
export function startingCountry(listed: readonly { code: string; dialCode: string | null }[], region: string | null = deviceRegion()): string {
  const home = region ? listed.find((c) => c.code === region && c.dialCode) : undefined;
  return home ? home.code : FALLBACK_COUNTRY;
}
