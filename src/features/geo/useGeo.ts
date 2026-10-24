import { useQuery } from '@tanstack/react-query';

import { fetchCountries, fetchMyLocation, fetchRegions } from './geoApi';

export const countriesKey = ['geo', 'countries'] as const;
export const regionsKey = (code: string) => ['geo', 'regions', code.toUpperCase()] as const;
export const myPlaceKey = ['geo', 'mine'] as const;

/** Every country, once per run: the Hub's lists change only with a release. */
export function useCountries() {
  return useQuery({ queryKey: countriesKey, queryFn: fetchCountries, staleTime: Infinity });
}

/** One country's regions; nothing is asked until a country is chosen. */
export function useRegions(code: string | null) {
  return useQuery({ queryKey: regionsKey(code ?? ''), queryFn: () => fetchRegions(code ?? ''), enabled: Boolean(code), staleTime: Infinity });
}

/** The signed-in person's own place (read once after sign-in by `PlaceBridge`, and again by Edit profile). */
export function useMyPlace(enabled = true) {
  return useQuery({ queryKey: myPlaceKey, queryFn: fetchMyLocation, enabled, staleTime: 60_000 });
}
