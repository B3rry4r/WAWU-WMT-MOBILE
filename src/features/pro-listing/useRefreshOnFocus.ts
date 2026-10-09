import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

import { proKeys } from './api';

/**
 * Asks the Hub again each time the screen comes back to the front (not on its first showing, which already asked): a
 * person reviews applications in admin, so a cached answer from a minute ago can be wrong, and a screen under this one
 * keeps its own copy of the list alive, which stops a new screen's mount from asking.
 */
export function useRefreshOnFocus(): void {
  const client = useQueryClient();
  const first = useRef(true);
  // Opening the screen: a copy another screen kept alive does not make the new screen's observer ask, so ask here when nothing is on its way.
  useEffect(() => {
    if (client.isFetching({ queryKey: proKeys.mine }) === 0) void client.invalidateQueries({ queryKey: proKeys.mine });
  }, [client]);
  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      void client.invalidateQueries({ queryKey: proKeys.mine });
    }, [client]),
  );
}
