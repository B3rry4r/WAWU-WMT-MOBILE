import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

import { ticketsKey } from './api';

/**
 * E2 asks for the tiers again when the screen is shown again after being left (a person comes back
 * from another screen and a tier may have sold out meanwhile). Never on a timer. The first showing
 * is the screen's own first load, so it is skipped.
 */
export function useRefetchTiersOnFocus(id: string): void {
  const client = useQueryClient();
  const left = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (left.current) void client.refetchQueries({ queryKey: ticketsKey(id), type: 'active' });
      return () => {
        left.current = true;
      };
    }, [client, id]),
  );
}
