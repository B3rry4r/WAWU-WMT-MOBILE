import { useEffect, useState } from 'react';

/** The time now (ms), moved on every second while `active`: the clock of a quote's hold. */
export function useNow(active: boolean, everyMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    // The clock is read again right away (the hook may have idled before it was active), then every `everyMs`.
    const first = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [active, everyMs]);
  return now;
}
