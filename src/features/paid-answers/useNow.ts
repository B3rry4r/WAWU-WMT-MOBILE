import { useEffect, useState } from 'react';

/** The clock the countdowns read, moved on every `everyMs` (30 seconds: a pill counts in minutes). */
export function useNow(everyMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(timer);
  }, [everyMs]);
  return now;
}
