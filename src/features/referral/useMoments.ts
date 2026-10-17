import { useCallback, useEffect, useState } from 'react';

import { getAccessToken } from '@/api/session';
import { readClaims } from '@/features/claim/tokenClaims';

import type { Referrals } from './api';
import { momentsOf, type Moment } from './model';
import { readSeen, writeSeen } from './seen';

export type Moments = {
  /** False until this phone's memory of what it has shown has been read: nothing is drawn before then, so RF1 never flashes in front of an RF3. */
  ready: boolean;
  /** The moment to tell now (the oldest not yet shown), or null. */
  current: Moment | null;
  /** The person tapped "Keep inviting": this one is never shown again on this phone. */
  done: (id: string) => void;
};

/**
 * RF3 and RF3a: when the Hub says points became available (a reward past its hold, a milestone granted), tell the
 * person once. The first look on a phone shows nothing and takes everything already listed as seen (see `seen.ts`).
 */
export function useMoments(view: Referrals | undefined): Moments {
  const [seen, setSeen] = useState<ReadonlySet<string> | null>(null);
  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    if (!view || seen) return;
    let cancelled = false;
    void (async () => {
      const sub = readClaims(await getAccessToken())?.sub ?? null;
      const stored = sub ? await readSeen(sub) : null;
      if (cancelled) return;
      const known = stored ?? new Set(momentsOf(view).map((m) => m.id));
      if (!stored && sub) void writeSeen(sub, known);
      setAccount(sub);
      setSeen(known);
    })();
    return () => {
      cancelled = true;
    };
  }, [view, seen]);

  const done = useCallback(
    (id: string) => {
      if (!seen) return;
      const next = new Set(seen).add(id);
      setSeen(next);
      if (account) void writeSeen(account, next);
    },
    [seen, account],
  );

  const current = view && seen ? (momentsOf(view).find((m) => !seen.has(m.id)) ?? null) : null;
  return { ready: seen !== null, current, done };
}
