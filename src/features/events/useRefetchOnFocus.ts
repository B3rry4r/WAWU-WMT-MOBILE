import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/**
 * Asks for these queries again when the screen is shown again after being left (a person comes back from
 * another screen and the server may have moved on: a tier sold out, a ticket scanned at the door). Never on
 * a timer. The first showing is the screen's own first load, so it is skipped.
 */
export function useRefetchOnFocus(queryKey: QueryKey): void {
  const client = useQueryClient();
  const left = useRef(false);
  const key = JSON.stringify(queryKey);
  useFocusEffect(
    useCallback(() => {
      if (left.current) void client.refetchQueries({ queryKey: JSON.parse(key) as QueryKey, type: 'active' });
      return () => {
        left.current = true;
      };
    }, [client, key]),
  );
}
