import type { QueryKey } from '@tanstack/react-query';

/**
 * What a pushed notice makes stale while the app is open (WALLET-40).
 *
 * "Your account number is ready" (`wallet_ready`) arrives while the person may
 * be on A28 (Checking your details), which asks the Hub every few seconds. The
 * push does not wait for the next ask: the wallet's reads are marked stale at
 * once, so A28 moves on to A8 as the notice lands and the wallet home shows the
 * number the next time it is drawn. The keys are the ones those reads use:
 * `OPEN_WALLET_KEY` (`src/features/open-wallet/api/account.ts`, the A28 and
 * Open your wallet reads) and `'money'` (the wallet home, `src/features/wallet/api/home.ts`).
 * They are written out here, not imported, so the push bridge does not load the
 * wallet's API client; a test holds them equal.
 */
export const WALLET_READ_KEYS: readonly QueryKey[] = [['open-wallet'], ['money']];

/** The reads a notice makes stale, from the push's `data`; none for a kind that changes no screen's data. */
export function staleKeysForPush(raw: unknown): readonly QueryKey[] {
  if (typeof raw !== 'object' || raw === null) return [];
  return (raw as { kind?: unknown }).kind === 'wallet_ready' ? WALLET_READ_KEYS : [];
}
