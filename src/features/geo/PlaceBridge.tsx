import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { fetchMyLocation } from './geoApi';
import { myPlaceKey } from './useGeo';

/**
 * Tells the Hub where the signed-in person is, once per sign-in (GEO-03, R-85): `GET /me/location` records the country WAWU ID
 * holds (else the phone's) for a person who has not chosen one, so the dashboard counts everyone who opens the app and not only
 * those who edit a profile. Mounted once by the root layout, with `live` true when the tabs are reachable. It has no screen,
 * and a call that fails is not shown: the next sign-in asks again. Edit profile reads the place from `GET /users/me/profile-fields`, which the Hub fills from this one call.
 */
export function PlaceBridge({ live }: { live: boolean }) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!live) return;
    void queryClient.fetchQuery({ queryKey: myPlaceKey, queryFn: fetchMyLocation, staleTime: 60_000 }).catch(() => undefined);
  }, [live, queryClient]);
  return null;
}
