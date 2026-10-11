import { useEffect, useState } from 'react';

/** `value` after it has stopped changing for `ms`. The first value is returned as it is, so a screen opens on what it was given. */
export function useSettled(value: string, ms: number): string {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    if (value === settled) return undefined;
    const timer = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(timer);
  }, [value, settled, ms]);
  return settled;
}
