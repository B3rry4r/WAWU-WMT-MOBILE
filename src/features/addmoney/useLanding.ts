import { useEffect, useState } from 'react';

import { fetchWalletBalance } from '@/api/money';
import { queryClient } from '@/api/query';
import type { WalletTransaction } from '@/features/wallet/api/home';

import { fetchLatestRows } from './api';
import { LEDGER_GRACE_MS, landingOf } from './model';

export type Landing =
  /** The person has not copied or shared the details yet: nothing is awaited. */
  | { phase: 'idle' }
  /** The details went out: the bank's balance is asked for until it changes. */
  | { phase: 'waiting' }
  /** A transfer landed: the ledger row that says what it was, and the bank's balance after it. */
  | { phase: 'landed'; credit: WalletTransaction; balanceKobo: number };

/**
 * W45 to W46: once `started`, the bank's balance is asked for every `pollMs` (`GET /money/wallet/balance`, never a sum of ours).
 * The rows the person already had are read first, then the balance. When the balance changes, the newest ledger row that is a
 * settled transfer in and was not there before is the landing (W46). A change with no such row (an earning, a payment) only moves
 * the baseline, and the wait goes on. An answer that does not come, or a ledger that cannot be read, is asked again on the next
 * tick: a landing is never guessed from a balance alone, and nothing here ends the wait but a landing or the screen going away.
 *
 * The bank's balance moves the moment the money lands, but the Hub writes the ledger row when the bank's notice reaches it, which can be a
 * little later. So a change with no row yet is remembered: the ledger is asked again on every tick for `LEDGER_GRACE_MS` and the
 * landing is shown as soon as its row is there. A change that never gets a transfer-in row in that time is not ours.
 *
 * When it lands, every money read is asked again once, so the Wallet tab shows the new balance the next time it is seen.
 */
export function useLanding(owner: string | null, started: boolean, pollMs: number): Landing {
  const [landed, setLanded] = useState<{ credit: WalletTransaction; balanceKobo: number } | null>(null);

  useEffect(() => {
    if (!owner || !started) return undefined;
    let live = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let baseline: number | null = null;
    let known = new Set<string>();
    // When the balance first changed with no transfer in on the ledger yet (null: nothing unexplained).
    let unexplainedSince: number | null = null;

    const step = async () => {
      try {
        if (baseline === null) {
          // The rows first, then the balance: a transfer between the two is in the balance and not in the rows, never the other way.
          known = new Set((await fetchLatestRows()).map((row) => row.id));
          baseline = (await fetchWalletBalance()).availableKobo;
        } else {
          const balance = await fetchWalletBalance();
          if (balance.availableKobo !== baseline || unexplainedSince !== null) {
            const credit = landingOf(await fetchLatestRows(), known);
            if (credit) {
              if (live) setLanded({ credit, balanceKobo: balance.availableKobo });
              void queryClient.invalidateQueries({ queryKey: ['money'] });
              return;
            }
            if (balance.availableKobo !== baseline) unexplainedSince ??= Date.now();
            else if (unexplainedSince !== null && Date.now() - unexplainedSince > LEDGER_GRACE_MS) unexplainedSince = null;
            baseline = balance.availableKobo;
          }
        }
      } catch {
        // No answer this time: the next tick asks again.
      }
      if (live) timer = setTimeout(() => void step(), pollMs);
    };
    void step();

    return () => {
      live = false;
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [owner, started, pollMs]);

  if (!started) return { phase: 'idle' };
  return landed ? { phase: 'landed', ...landed } : { phase: 'waiting' };
}
