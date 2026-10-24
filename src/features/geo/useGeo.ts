import { useQuery } from '@tanstack/react-query';

import { fetchCountries, fetchRegions } from './geoApi';

export const countriesKey = ['geo', 'countries'] as const;
export const regionsKey = (code: string) => ['geo', 'regions', code.toUpperCase()] as const;
/** The signed-in person's own place, kept by `PlaceBridge` after it asks the Hub once per sign-in. */
export const myPlaceKey = ['geo', 'mine'] as const;

/** Every country, once per run: the Hub's lists change only with a release. */
export function useCountries() {
  return useQuery({ queryKey: countriesKey, queryFn: fetchCountries, staleTime: Infinity });
}

/** One country's regions; nothing is asked until a country is chosen. */
export function useRegions(code: string | null) {
  return useQuery({ queryKey: regionsKey(code ?? ''), queryFn: () => fetchRegions(code ?? ''), enabled: Boolean(code), staleTime: Infinity });
}
