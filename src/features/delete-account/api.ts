import { api } from '@/api/client';
import { ApiError, toApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * Asking the Hub to delete the account (`DELETE /account`, SETTINGS-06): the Hub checks the money first and answers 200 with
 * the date the 30 days end (`deletionScheduledAt`), or `409 account_deletion_blocked` with its own sentence and what to settle.
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data` (SHARED-CHANGES.md row 11).
 */
export type LeavingReason = NonNullable<components['schemas']['DeleteAccountDto']['reason']>;
export type DeletionBlocker = components['schemas']['AccountDeletionBlockedReason']['blockers'][number];

export type DeletionAnswer =
  | { kind: 'scheduled'; at: string }
  /** The Hub refused: `message` is its own sentence, shown as it is; `withdraw` is true when the wallet holds money (Z6's Withdraw). */
  | { kind: 'blocked'; message: string; withdraw: boolean };

type Envelope<T> = { statusCode: number; message: string; data: T | null };

function blockedOf(error: unknown): Extract<DeletionAnswer, { kind: 'blocked' }> | null {
  const reason = (error as Partial<components['schemas']['AccountDeletionBlockedBody']> | undefined)?.reason;
  if (!reason || reason.code !== 'account_deletion_blocked' || typeof reason.message !== 'string' || reason.message.trim() === '') return null;
  return { kind: 'blocked', message: reason.message, withdraw: Array.isArray(reason.blockers) && reason.blockers.includes('wallet_balance') };
}

/**
 * One request. A repeat while a deletion is waiting is answered with the same date by the Hub, so a second tap or a retry after a
 * lost answer never schedules twice. Anything but those two answers rejects with the app's one ApiError (the Hub's own sentence).
 */
export async function requestDeletion(reason: LeavingReason | null): Promise<DeletionAnswer> {
  const { data, error, response } = await api.DELETE('/api/hub/account', { body: reason ? { reason } : {} });
  if (response.status === 409) {
    const blocked = blockedOf(error);
    if (blocked) return blocked;
  }
  if (!response.ok) throw toApiError(response.status, error, response.headers);
  const at = (data as unknown as Envelope<{ deletionScheduledAt?: unknown }> | undefined)?.data?.deletionScheduledAt;
  if (typeof at !== 'string' || Number.isNaN(Date.parse(at))) throw new ApiError('unknown', 200, 'We could not read the answer. Try again.');
  return { kind: 'scheduled', at };
}
