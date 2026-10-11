import { useCallback, useEffect, useState } from 'react';

/** How often a countdown refreshes. */
const TICK_MS = 1000;
const MS_PER_SECOND = 1000;

/**
 * Milliseconds on a clock that only moves forward and that nobody can set: `performance.now()`. The wall clock
 * (`Date.now()`) moves when the person, the network or a time zone changes it, so a countdown kept against it
 * jumps (WALLET-06 round 3, N2).
 */
const monotonicNow = (): number => performance.now();

/**
 * Whole seconds left of a count that began at `start(seconds)`, refreshed once a second. The count runs on the
 * monotonic clock from the moment `start` is called, so a phone clock changed while it runs moves nothing: ten minutes
 * ahead does not open Resend early, ten minutes behind does not hold it shut. `start(0)` ends it.
 *
 * `start` takes seconds the server sent ("Resend in") or a figure read once from an instant it sent (the PIN's lock).
 * Used by W36's lock line and W37's Resend; the auth feature has its own countdown (`useCountdown`), which this task does
 * not touch.
 */
export function useMonotonicCountdown() {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(monotonicNow);

  const running = endsAt !== null && now < endsAt;
  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => setNow(monotonicNow()), TICK_MS);
    return () => clearInterval(timer);
  }, [running]);

  const start = useCallback((seconds: number) => {
    const at = monotonicNow();
    setNow(at);
    setEndsAt(at + Math.max(0, seconds) * MS_PER_SECOND);
  }, []);

  const seconds = endsAt === null ? 0 : Math.max(0, Math.ceil((endsAt - now) / MS_PER_SECOND));
  return { seconds, start };
}
