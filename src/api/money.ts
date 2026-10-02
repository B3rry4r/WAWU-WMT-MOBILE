import { api, unwrap } from './client';
import { ApiError, isApiError } from './errors';
import type { components } from './schema.generated';

/**
 * The Naira wallet's balance (backend task MONEY-11), as the contract types it.
 * `availableKobo` is integer kobo, Fintava's figure at `asOf`: it goes straight
 * into `<Money minorUnits={...} />` (R-21). Nothing here converts, rounds or
 * adds anything up, and nothing here ever stands a 0 in for a figure it lacks.
 */
export type WalletBalance = components['schemas']['WalletBalanceView'];

/** Every `reason.code` a money route can answer with. */
export type MoneyErrorCode = components['schemas']['MoneyErrorReason']['code'];

/**
 * The Hub's success body, `{ statusCode, message, data }` (its
 * ResponseInterceptor). The contract types only the inner `data` (the
 * contract's info block, "ENVELOPE"), and `unwrap` resolves with the body as
 * sent, so the call reads `data` itself (SHARED-CHANGES.md row 11).
 */
type Envelope<T> = { statusCode: number; message: string; data: T | null };

/**
 * GET /money/wallet/balance. Rejects with an ApiError whose `code` is the money
 * reason. An answer without a whole-kobo figure is refused, never read as 0.
 */
export async function fetchWalletBalance(): Promise<WalletBalance> {
  const body = (await unwrap(api.GET('/api/hub/money/wallet/balance'))) as unknown as Envelope<WalletBalance>;
  const balance = body?.data;
  if (!balance || !Number.isSafeInteger(balance.availableKobo) || typeof balance.asOf !== 'string') {
    throw new ApiError('unknown', 200, 'Your balance could not be read. Try again.');
  }
  return balance;
}

/**
 * The query a wallet screen reads the balance through. Never fresh from the
 * cache: every screen that shows it asks again (the backend asks Fintava on
 * every call and answers `Cache-Control: no-store`).
 */
export const walletBalanceQuery = {
  queryKey: ['money', 'wallet', 'balance'] as const,
  queryFn: fetchWalletBalance,
  staleTime: 0,
};

/**
 * Why there is no balance to show, for the screen to pick its state:
 * - `unreachable`: the bank did not answer (W6, "We couldn't reach your
 *   account"); the backend's `503 provider_unreachable`;
 * - `no_wallet`: nobody has a wallet until they open one (R-6); the screen
 *   leads to Open your wallet (MONEY-12, MONEY-13);
 * - `opening`: Open your wallet finished and the account is still being made;
 * - `frozen`: the wallet is frozen at the bank;
 * - `other`: anything else (no connection, signed out, a server fault); the
 *   app's usual error state.
 */
export type BalanceProblem = 'unreachable' | 'no_wallet' | 'opening' | 'frozen' | 'other';

const problems: Partial<Record<MoneyErrorCode, BalanceProblem>> = {
  provider_unreachable: 'unreachable',
  wallet_not_open: 'no_wallet',
  wallet_opening: 'opening',
  wallet_frozen: 'frozen',
};

export function balanceProblem(error: unknown): BalanceProblem {
  if (!isApiError(error) || !error.code) return 'other';
  return problems[error.code as MoneyErrorCode] ?? 'other';
}
