import type { QueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { queryClient } from '@/api/query';

import { listServicesTarget, type ListServicesTarget } from './door';
import { sentenceOf } from './model';

/** How long the "could not open" line stays up (the shared `Toast`'s `duration`). A screen timing, not a fact. */
export const SERVICES_DOOR_NOTICE_MS = 4000;

/** What a screen with the door draws: the door while the reads run, and the line when one failed. */
export type ServicesDoor = {
  /** The two reads are on their way: the door shows it is working. */
  busy: boolean;
  /** The app's own words for a read that failed; null when there is none to show. */
  notice: string | null;
  dismiss: () => void;
};

/**
 * The tap on "List your services" (Explore) or Service (Create), with feedback (SERVICES-FEEDBACK 1). The door shows `busy` the moment it
 * is tapped, a second tap while the reads run does nothing, the screen opens when they answer, and a read that fails leaves the person
 * where they are with `notice` (drawn as the shared `Toast`), so tapping again asks again.
 */
export function useListServicesDoor(open: (target: ListServicesTarget) => void, client: QueryClient = queryClient): ServicesDoor & { start: () => void } {
  const running = useRef(false);
  const mounted = useRef(true);
  const opener = useRef(open);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    opener.current = open;
  });
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const start = useCallback(() => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setNotice(null);
    void (async () => {
      try {
        opener.current(await listServicesTarget(client));
      } catch (error) {
        if (mounted.current) setNotice(sentenceOf(error, 'Something went wrong. Try again.'));
      } finally {
        running.current = false;
        if (mounted.current) setBusy(false);
      }
    })();
  }, [client]);
  const dismiss = useCallback(() => setNotice(null), []);
  return { busy, notice, dismiss, start };
}
