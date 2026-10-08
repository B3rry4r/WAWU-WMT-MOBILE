import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import { isApiError } from '@/api/client';

import { heldGoing, patchGoing, setGoing } from './api';

/**
 * The Going toggle every screen shares. The flag flips at once and the Hub's
 * answer (the flag and the count) replaces it; if the Hub refuses, the flag
 * goes back and `failure` says so. One request per event at a time, so a
 * double tap sends one.
 */
export function useGoing() {
  const client = useQueryClient();
  const inFlight = useRef(new Set<string>());
  const [busy, setBusy] = useState<ReadonlySet<string>>(new Set());
  const [failure, setFailure] = useState<string | null>(null);

  const toggle = useCallback(
    async (id: string) => {
      const before = heldGoing(client, id);
      if (!before || inFlight.current.has(id)) return;
      inFlight.current.add(id);
      setBusy(new Set(inFlight.current));
      setFailure(null);
      const wants = !before.userGoing;
      patchGoing(client, id, { userGoing: wants, goingCount: Math.max(0, before.goingCount + (wants ? 1 : -1)) });
      try {
        const answer = await setGoing(id, wants);
        patchGoing(client, id, { userGoing: answer.userGoing, goingCount: answer.goingCount });
      } catch (error) {
        patchGoing(client, id, before);
        setFailure(isApiError(error) ? error.message : 'Could not update that. Try again.');
      } finally {
        inFlight.current.delete(id);
        setBusy(new Set(inFlight.current));
      }
    },
    [client],
  );

  return { toggle, busy, failure, clearFailure: () => setFailure(null) };
}
