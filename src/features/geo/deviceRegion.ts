/**
 * The country this phone is set to, from the system's own locale through `Intl` (no native module): "en-NG" is "NG".
 * Null when the locale names no region ("en") or the runtime has no `Intl` locale to ask.
 */
export function deviceRegion(): string | null {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
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
