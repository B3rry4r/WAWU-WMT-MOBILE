import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * The calls behind Wallet settings, the PIN change and the PIN reset (WALLET-06), as the backend contract types them.
 *
 * - `GET /money/wallet` (MONEY-12): what W35 reads. It never asks the bank. It carries the account, the PIN's state
 *   (when it was set or last changed, the lock), how many beneficiaries are saved and the limits when the server has
 *   any (it sends none today, BACKEND_GAPS G-7).
 * - `GET /money/pin` and `POST /money/pin/verify` (MONEY-09): the PIN's state, and a check of the current PIN that
 *   moves nothing. A wrong PIN uses a try there exactly as on a payment.
 * - `PUT /money/pin` (MONEY-09): change the PIN. The current PIN is the `X-Transaction-Pin` header; the new one and its
 *   second entry are the body.
 * - `POST /money/pin/reset` and `/reset/confirm` (MONEY-14): a code to the person, then the code with a new PIN.
 *
 * The change and the confirm take an optional `Idempotency-Key` (WALLET-06 round 2, backend CONVENTIONS section 4, "On the
 * PIN routes"). The screen makes one key per attempt and sends the SAME request again with the SAME key when no answer
 * came: if the first landed the server answers it again without looking at the PIN, so no try is spent, and if it did
 * not land the repeat is the request. Nothing here judges by `changedAt`, which moves for any change by anyone.
 *
 * Nothing here keeps, logs or echoes a PIN or a code: they go out in one request and the caller drops them when it
 * is answered.
 */
type WalletView = components['schemas']['WalletView'];
type WalletAccount = components['schemas']['WalletAccountView'];
type PinState = components['schemas']['PinStateView'];
type PinReset = components['schemas']['PinResetView'];

export type WalletState = WalletView['state'];

/** The Hub's success body; the contract types only its `data` (SHARED-CHANGES.md row 11). */
type Envelope<T> = { statusCode: number; message: string; data: T | null };

const states: readonly WalletState[] = ['not_open', 'opening', 'open', 'frozen'];
const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const orNull = (value: unknown): string | null => (filled(value) ? value : null);

let keyCounter = 0;

/**
 * One key for one attempt to change or reset the PIN: 8 to 128 of `[A-Za-z0-9_-]` (the Hub's rule). A UUID where the
 * runtime has one; otherwise the time, a counter and random digits, which cannot repeat for one person within the
 * 48 hours the Hub keeps a key. It is a label for the attempt, not a secret, and carries nothing about the PIN.
 */
export function newRequestKey(): string {
  const made = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (typeof made?.randomUUID === 'function') return made.randomUUID();
  keyCounter += 1;
  const random = Array.from({ length: 4 }, () => Math.floor(Math.random() * 36 ** 4).toString(36).padStart(4, '0')).join('');
  return `w-${Date.now().toString(36)}-${keyCounter.toString(36)}-${random}`;
}

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `Your ${what} could not be read. Try again.`);
}

/** Where a PIN stands: set (and since when), and the lock if there is one. */
export type PinSummary = { isSet: boolean; changedAt: string | null; lockedUntil: string | null };

/** W35's view of the wallet: everything the screen draws, and nothing it would have to make up. */
export type WalletSettings = {
  state: WalletState;
  account: { accountNumber: string; accountName: string; bankName: string; licenceLine: string | null; depositInsuranceLine: string | null } | null;
  /** The limit the server sends, whole kobo. Null when it sends none: the limits row is then not drawn. */
  limits: { tier: string | null; dailyLimitKobo: number; remainingTodayKobo: number } | null;
  pin: PinSummary;
  beneficiaryCount: number;
};

function readPin(value: unknown): PinSummary {
  const v = value as Partial<PinState> | null | undefined;
  if (!v || typeof v !== 'object' || typeof v.isSet !== 'boolean') throw unreadable('PIN');
  return { isSet: v.isSet, changedAt: orNull(v.changedAt), lockedUntil: orNull(v.lockedUntil) };
}

function readAccount(value: unknown): WalletSettings['account'] {
  if (value === null || value === undefined) return null;
  const v = value as Partial<WalletAccount>;
  if (typeof v !== 'object' || !filled(v.accountNumber) || !filled(v.accountName) || !filled(v.bankName)) throw unreadable('wallet');
  return {
    accountNumber: v.accountNumber,
    accountName: v.accountName,
    bankName: v.bankName,
    licenceLine: orNull(v.licenceLine),
    depositInsuranceLine: orNull(v.depositInsuranceLine),
  };
}

/** A limit is drawn only as the server sends it, in whole kobo; anything else is no limits row, never a 0 or a guess. */
function readLimits(value: unknown): WalletSettings['limits'] {
  const v = value as Partial<NonNullable<WalletView['limits']>> | null | undefined;
  if (v === null || v === undefined || typeof v !== 'object') return null;
  if (!Number.isSafeInteger(v.dailyLimitKobo) || (v.dailyLimitKobo as number) <= 0) return null;
  if (!Number.isSafeInteger(v.remainingTodayKobo) || (v.remainingTodayKobo as number) < 0) return null;
  return { tier: orNull(v.tier), dailyLimitKobo: v.dailyLimitKobo as number, remainingTodayKobo: v.remainingTodayKobo as number };
}

/** GET /money/wallet. An open wallet without its account is refused, never drawn half empty. */
export async function fetchWalletSettings(): Promise<WalletSettings> {
  const body = (await unwrap(api.GET('/api/hub/money/wallet'))) as unknown as Envelope<WalletView>;
  const view = body?.data;
  if (!view || typeof view !== 'object' || !states.includes(view.state)) throw unreadable('wallet');
  const account = readAccount(view.account);
  if ((view.state === 'open' || view.state === 'frozen') && account === null) throw unreadable('wallet');
  const count = view.beneficiaryCount;
  if (!Number.isSafeInteger(count) || count < 0) throw unreadable('wallet');
  return { state: view.state, account, limits: readLimits(view.limits), pin: readPin(view.pin), beneficiaryCount: count };
}

/** W35's read, keyed by the signed-in account and never fresh from the cache: the screen asks again each time it is shown. */
export function walletSettingsQuery(owner: string | null) {
  return { queryKey: ['money', 'wallet-settings', owner ?? ''] as const, queryFn: fetchWalletSettings, staleTime: 0, enabled: Boolean(owner) };
}

/** GET /money/pin: whether a PIN is set, since when, and the lock if any. */
export async function fetchPinState(): Promise<PinSummary> {
  const body = (await unwrap(api.GET('/api/hub/money/pin'))) as unknown as Envelope<PinState>;
  return readPin(body?.data);
}

/** POST /money/pin/verify: resolves when the PIN is right. Rejects with the server's refusal (`pin_incorrect`, `pin_locked`, ...). */
export async function verifyPin(pin: string): Promise<void> {
  await unwrap(api.POST('/api/hub/money/pin/verify', { params: { header: { 'X-Transaction-Pin': pin } } }));
}

/**
 * PUT /money/pin. `current` is the header; the two new entries are the body, and the server compares them (`400
 * pin_mismatch`). `key` is the attempt's Idempotency-Key: sent again unchanged when no answer came.
 */
export async function changePin(input: { current: string; newPin: string; newPinConfirmation: string; key: string }): Promise<PinSummary> {
  const body = (await unwrap(
    api.PUT('/api/hub/money/pin', {
      params: { header: { 'X-Transaction-Pin': input.current, 'Idempotency-Key': input.key } },
      body: { newPin: input.newPin, newPinConfirmation: input.newPinConfirmation },
    }),
  )) as unknown as Envelope<PinState>;
  const state = readPin(body?.data);
  if (!state.isSet) throw unreadable('PIN');
  return state;
}

/**
 * What a reset code was sent to and when the next one can be asked for. `sentTo` is the server's own words (a masked phone,
 * or a masked email under Nuvion). `resendInSeconds` is the server's count of seconds until Resend opens, taken as it
 * answered: the countdown starts from it on the phone's own timer, never from `resendAvailableAt` against the phone's clock.
 */
export type PinResetStarted = { resetId: string; sentTo: string; resendAvailableAt: string; resendInSeconds: number; expiresAt: string };

/**
 * POST /money/pin/reset: sends a code. Asked again before `resendAvailableAt` it answers the same reset and sends
 * nothing; after it, a new code (the old one stops working).
 */
export async function startPinReset(): Promise<PinResetStarted> {
  const body = (await unwrap(api.POST('/api/hub/money/pin/reset'))) as unknown as Envelope<PinReset>;
  const v = body?.data;
  if (!v || typeof v !== 'object' || !filled(v.resetId) || !filled(v.sentTo) || !filled(v.resendAvailableAt) || !filled(v.expiresAt)) {
    throw unreadable('code');
  }
  if (!Number.isSafeInteger(v.resendInSeconds) || (v.resendInSeconds as number) < 0) throw unreadable('code');
  return { resetId: v.resetId, sentTo: v.sentTo, resendAvailableAt: v.resendAvailableAt, resendInSeconds: v.resendInSeconds as number, expiresAt: v.expiresAt };
}

/**
 * POST /money/pin/reset/confirm: the code and the new PIN with its second entry. Clears the lock and turns off fingerprint
 * or face approval. `key` is the attempt's Idempotency-Key: sent again unchanged when no answer came (a code works once, so
 * without it the repeat of a reset that landed would be refused as a dead code).
 */
export async function confirmPinReset(input: { resetId: string; code: string; newPin: string; newPinConfirmation: string; key: string }): Promise<PinSummary> {
  const { key, ...request } = input;
  const body = (await unwrap(
    api.POST('/api/hub/money/pin/reset/confirm', { params: { header: { 'Idempotency-Key': key } }, body: request }),
  )) as unknown as Envelope<PinState>;
  const state = readPin(body?.data);
  if (!state.isSet) throw unreadable('PIN');
  return state;
}
