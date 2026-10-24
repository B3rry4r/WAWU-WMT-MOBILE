import { useMemo, useState } from 'react';

import type { GeoCountry } from './geoApi';
import { FALLBACK_COUNTRY, startingCountry } from './deviceRegion';
import { countryFollowing, formatTyped, isInternational, readPhone, type PhoneRead } from './phone';

export type PhoneInput = {
  /** The country dialled from (ISO alpha-2): the one picked or followed, else the device's, else Nigeria. */
  country: string;
  /** The Hub's record of that country; null until the list has loaded. */
  record: GeoCountry | null;
  /** The number as the field shows it, in the country's grouping. */
  value: string;
  setText: (typed: string) => void;
  /** The person chose a country in the list. */
  pick: (code: string) => void;
  /** The number in E.164, or why it cannot be one. */
  read: PhoneRead;
};

/**
 * The state behind a `PhoneField` (GEO-03): the country, the number and what it reads as. The country starts as the device's
 * own when the Hub's list holds it, else Nigeria; a number typed with its country code (`+233...`) moves the country to it,
 * and a country picked in the list changes how the number is grouped and read.
 */
export function usePhoneInput(countries: readonly GeoCountry[] | undefined, region?: string | null, initialText = ''): PhoneInput {
  const dialable = useMemo(() => (countries ?? []).filter((c) => c.dialCode), [countries]);
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState(initialText);
  const country = picked ?? (dialable.length > 0 ? startingCountry(dialable, region) : FALLBACK_COUNTRY);
  const value = formatTyped(typed, country);

  return {
    country,
    record: (countries ?? []).find((c) => c.code === country && c.dialCode) ?? null,
    value,
    setText: (next) => {
      setTyped(next);
      const followed = isInternational(next) ? countryFollowing(next, dialable) : null;
      if (followed && followed !== country) setPicked(followed);
    },
    pick: (code) => {
      // A number written with its own code belongs to that code; picking another country starts the number again.
      if (isInternational(typed)) setTyped('');
      setPicked(code);
    },
    read: readPhone(value, country),
  };
}
