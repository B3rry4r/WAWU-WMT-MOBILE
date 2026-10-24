import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

import { OPEN_WALLET_KEY, type WalletState } from './account';
import { readWorld, type WorldProgress } from './world';

/**
 * The two calls after the account opens (KYC-04): A8 reads the account
 * Fintava gave (`GET /money/wallet`, MONEY-12), and A10 sets the transaction
 * PIN (`POST /money/pin`, MONEY-09).
 *
 * The bank name, account name and number are the server's (the bank name
 * from its config, "Loma Bank" by default, R-1; the rest Fintava's at
 * opening). The limit is the server's `limits` when it sends one, and A8
 * shows no limit row while it is null (BACKEND_GAPS G-7, G-114). Nothing here
 * is ever a balance: `GET /money/wallet` carries none.
 */
type WalletView = components['schemas']['WalletView'];
type WalletAccount = components['schemas']['WalletAccountView'];
type WalletLimits = components['schemas']['WalletLimitsView'];
type PinState = components['schemas']['PinStateView'];

type Envelope<T> = { statusCode: number; message: string; data: T | null };

/** A8's view of the wallet: where it stands, the account once open, the limit if one is sent, and whether a PIN is set. */
export type OpenedWallet = {
  state: WalletState;
  account: Pick<WalletAccount, 'accountNumber' | 'accountName' | 'bankName'> | null;
  limits: Pick<WalletLimits, 'dailyLimitKobo'> | null;
  pinIsSet: boolean;
  /** WALLET-41: the world part of the wallet, for a person who opened from outside Nigeria; they have no naira account. */
  world: WorldProgress | null;
};

function unreadable(): ApiError {
  return new ApiError('unknown', 200, 'Your account details could not be read. Try again.');
}

const states: readonly WalletState[] = ['not_open', 'opening', 'open', 'frozen'];
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

function readAccount(value: unknown): OpenedWallet['account'] {
  const v = value as Partial<WalletAccount> | null;
  if (v === null) return null;
  if (typeof v !== 'object' || !text(v.accountNumber) || !text(v.accountName) || !text(v.bankName)) throw unreadable();
  return { accountNumber: v.accountNumber, accountName: v.accountName, bankName: v.bankName };
}

function readLimits(value: unknown): OpenedWallet['limits'] {
  const v = value as Partial<WalletLimits> | null | undefined;
  if (v === null || v === undefined) return null;
  // A limit is shown only as the server sends it, in whole kobo; anything else is no limit row, never a 0 or a guess.
  if (typeof v !== 'object' || !Number.isSafeInteger(v.dailyLimitKobo) || (v.dailyLimitKobo as number) <= 0) return null;
  return { dailyLimitKobo: v.dailyLimitKobo as number };
}

/** GET /money/wallet, as A8 reads it. An open wallet without its account details is refused, never shown half empty. */
export async function fetchOpenedWallet(): Promise<OpenedWallet> {
  const body = (await unwrap(api.GET('/api/hub/money/wallet'))) as unknown as Envelope<WalletView>;
  const view = body?.data;
  if (!view || typeof view !== 'object' || !states.includes(view.state)) throw unreadable();
  const pin = view.pin as Partial<PinState> | undefined;
  if (!pin || typeof pin.isSet !== 'boolean') throw unreadable();
  const account = readAccount(view.account ?? null);
  const world = readWorld((view as { world?: unknown }).world);
  // A person outside Nigeria has a wallet with no naira account (WALLET-41): everyone else is refused without one.
  if ((view.state === 'open' || view.state === 'frozen') && account === null && world === null) throw unreadable();
  return { state: view.state, account, limits: readLimits(view.limits), pinIsSet: pin.isSet, world };
}

/**
 * A8's read, under the step's own key prefix (dropped with the rest of Open
 * your wallet) and keyed by the account, so one person's account number is
 * never answered to another from the shared cache.
 */
export function openedWalletQuery(owner: string | undefined) {
  return { queryKey: [OPEN_WALLET_KEY, 'account', owner ?? ''] as const, queryFn: fetchOpenedWallet, staleTime: 0, enabled: Boolean(owner) };
}

/**
 * POST /money/pin (A9 then A10): the PIN and its second entry, in the body
 * (contract CONVENTIONS section 5: a new PIN is the subject of its own
 * request). The server compares the two (`400 pin_mismatch`) and stores only
 * a slow hash. Nothing here keeps, logs or echoes either entry; the caller
 * drops them once this answers.
 */
export async function setTransactionPin(pin: string, pinConfirmation: string): Promise<void> {
  const body = (await unwrap(api.POST('/api/hub/money/pin', { body: { pin, pinConfirmation } }))) as unknown as Envelope<PinState>;
  if (body?.data?.isSet !== true) throw unreadable();
}
