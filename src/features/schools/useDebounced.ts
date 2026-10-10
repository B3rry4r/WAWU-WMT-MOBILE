import { useCallback, useEffect, useState } from 'react';

/** How long the search waits after the last key before it asks the Hub. */
export const SEARCH_DELAY_MS = 350;

/**
 * `value` after it has stopped changing for `ms`, and `flush` to take the latest at once (the search key on the keyboard).
 * The first value is returned as it is, so a screen opens on what it was given without waiting.
 */
export function useDebounced(value: string, ms: number): { settled: string; flush: () => void } {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    if (value === settled) return undefined;
    const timer = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(timer);
  }, [value, settled, ms]);
  const flush = useCallback(() => setSettled(value), [value]);
  return { settled, flush };
}
