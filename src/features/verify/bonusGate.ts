import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { queryClient } from '@/api/query';
import { fetchMe, meKey } from '@/features/profile-edit/api';

/**
 * What VF1 knows about the person before it decides anything (SHARED-CHANGES VERIFY-01 #1). The Hub's `accountType` on their own
 * profile has four answers, and only two of them end the once-only step:
 *
 *   - `creator`: VF1 is drawn.
 *   - `other`: a known non-creator (the Hub says `user`). There is no shop to build, so the step ends and they go Home.
 *   - `checking`: the read is in flight, or the Hub does not know the type yet (`null`: a brand new account's Hub profile is
 *     written a moment after sign-up, AUTH-06). VF1 neither finishes nor leaves: it shows its loading state and asks again.
 *   - `waiting` and `error`: the type is still unknown after the last ask, or the read failed. VF1 says so with "Try again".
 *     The step is never finished by a failure, because it comes only once.
 */
export type BonusGate = 'checking' | 'creator' | 'other' | 'waiting' | 'error';

/** The pauses between asks while the Hub does not know the type yet: six asks over about 31 s, then it stops and offers "Try again". */
const DEFAULT_DELAYS_MS: readonly number[] = [1000, 2000, 4000, 8000, 8000, 8000];
let delays = DEFAULT_DELAYS_MS;

/** For tests: shorter pauses, or `null` for the real ones. */
export function setBonusGateDelaysForTests(next: readonly number[] | null): void {
  delays = next ?? DEFAULT_DELAYS_MS;
}

export function useBonusGate(enabled: boolean): { gate: BonusGate; error: unknown; retry: () => void } {
  const me = useQuery(
    { queryKey: meKey, queryFn: fetchMe, enabled, select: (profile): string | null => (typeof profile.accountType === 'string' ? profile.accountType : null) },
    queryClient,
  );
  const [asked, setAsked] = useState(0);
  const { refetch } = me;
  const unknown = me.data === null;
  const idle = !me.isFetching && !me.isError;

  useEffect(() => {
    if (!enabled || !unknown || !idle || asked >= delays.length) return;
    const timer = setTimeout(() => {
      setAsked((count) => count + 1);
      void refetch();
    }, delays[asked]);
    return () => clearTimeout(timer);
  }, [enabled, unknown, idle, asked, refetch]);

  const retry = () => {
    setAsked(0);
    void refetch();
  };

  const type = me.data;
  let gate: BonusGate;
  if (type === 'creator') gate = 'creator';
  else if (typeof type === 'string') gate = 'other';
  else if (me.isFetching || me.isPending) gate = 'checking';
  else if (me.isError) gate = 'error';
  else gate = asked < delays.length ? 'checking' : 'waiting';
  return { gate, error: me.error, retry };
}
