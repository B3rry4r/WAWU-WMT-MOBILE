import { useCallback, useEffect, useState } from 'react';

/** How often a countdown refreshes. */
const TICK_MS = 1000;

/**
 * Seconds left until a deadline, ticking once a second. `start(seconds)` sets a
 * new deadline from the server's own figure; `start(0)` ends it.
 */
export function useCountdown(initialSeconds: number | null = null) {
  const [deadline, setDeadline] = useState<number | null>(() => (initialSeconds === null ? null : Date.now() + initialSeconds * 1000));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (deadline === null) return undefined;
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [deadline]);

  const start = useCallback((next: number) => {
    const at = Date.now();
    setNow(at);
    setDeadline(at + next * 1000);
  }, []);

  const seconds = deadline === null ? 0 : Math.max(0, Math.ceil((deadline - now) / 1000));
  return { seconds, start };
}
