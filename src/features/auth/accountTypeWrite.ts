import type { HubAccountType } from '@/features/after-signup/hubAccountType';

/**
 * The write of the sign-up's account type to the Hub (`PUT /users/me/account-type`) that this session made, kept so a step that depends on
 * what the Hub holds can ask whether it has just been written (TIER-OFFER round 2, F1). Whether the tier offer is shown follows the account
 * type the Hub holds: the offer step asks the Hub once, and when the Hub says no while a creator write has just landed, it asks once more.
 *
 * It lives apart from the gate so the offer step does not import the whole sign-up gate. The gate notes each write it makes and clears it
 * with the session; nothing here is a copy of the account type to read back as truth.
 */
let current: Promise<HubAccountType | null> | null = null;

/** The gate made a write. `write` answers with the type the Hub holds after it, or null when no write was needed or it failed. */
export function noteAccountTypeWrite(write: Promise<HubAccountType | null>): void {
  current = write.catch(() => null);
}

/**
 * The type the Hub held when this session's write finished: 'creator' when a creator was written (or already held) by that write, null when
 * none was made, none was needed (an ordinary start of a finished account) or it failed. Waits while a write is still on its way.
 */
export function accountTypeWriteResult(): Promise<HubAccountType | null> {
  return current ?? Promise.resolve(null);
}

/** Signed out, or the session ended. */
export function resetAccountTypeWrite(): void {
  current = null;
}
