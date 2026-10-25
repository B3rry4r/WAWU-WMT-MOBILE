import { useState } from 'react';

import { CountryPicker, type PickerItem } from '@/components/CountryPicker';
import { useCountries } from '@/features/geo/useGeo';

import { ChoiceField } from './ChoiceField';

export const PASSPORT_COUNTRY_LABEL = 'Country that issued your passport';
export const PASSPORT_COUNTRY_NEEDS = 'Choose the country that issued your passport.';

export type PassportCountryFieldProps = {
  /** The country now chosen (ISO code): the person's pick, or the country they live in until they change it. */
  code: string | null;
  error?: string;
  onPick: (code: string) => void;
};

/**
 * WALLET-41 round 3 (lead ruling, no board draws it: G-WALLET-41-10): a person outside Nigeria who uses a passport says
 * which country issued it, with the list the profile uses (GEO-03's CountryPicker). The Hub needs it for the claim on the
 * document (one wallet per passport) and refuses a passport without it. It starts as the country they live in.
 */
export function PassportCountryField({ code, error, onPick }: PassportCountryFieldProps) {
  const [picking, setPicking] = useState(false);
  const countries = useCountries();
  const items: PickerItem[] | undefined = countries.data?.map((c) => ({ code: c.code, name: c.name, flag: c.flag }));
  // The name waits for the list; the bare code is shown only when the list could not be read.
  const name = code ? (countries.data?.find((c) => c.code === code)?.name ?? (countries.isError ? code : null)) : null;
  return (
    <>
      <ChoiceField label={PASSPORT_COUNTRY_LABEL} value={name} onPress={() => setPicking(true)} error={error} testID="open-wallet-passport-country" />
      <CountryPicker
        visible={picking}
        onClose={() => setPicking(false)}
        title={PASSPORT_COUNTRY_LABEL}
        searchLabel="Search countries"
        items={items}
        selected={code}
        failed={countries.isError}
        onRetry={() => void countries.refetch()}
        testID="open-wallet-passport-country-sheet"
        onPick={(picked) => {
          setPicking(false);
          onPick(picked);
        }}
      />
    </>
  );
}
