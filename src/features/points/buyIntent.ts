import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { onSessionEnd } from '@/api/session';
import { bounded } from '@/features/claim/localStore';

/**
 * A points-pack purchase intent, kept on the phone until the Hub has the last word (V8: the same Pay sent twice buys one pack).
 *
 * A purchase is one `Idempotency-Key`, one request body (the pack, the way it is paid, the total and the quote token). If the app does
 * not hear the answer (no network, a timeout, a server fault, the same key still running) the money may have moved, so the only safe
 * next step is to send the SAME request again: the Hub answers a key it knows with the first purchase, before it looks at the PIN or the
 * quote. If the Hub did take it and said `pending` (or, for a bank transfer, `awaiting_transfer`), the only safe next step is to read it
 * by its id. Both facts have to survive the screen going away (Back, a reload, the app closed and opened), so the intent is written here
 * before the request leaves the phone and removed when the Hub gives a final answer (a paid or failed purchase, or a refusal that
 * proves none exists for the key).
 *
 * - `unknown`: sent, and no answer proves anything. Send it again, same key, same body.
 * - `pending`: the Hub took it and has not finished (the bank has not confirmed, or the transfer has not landed). Read it by
 *   `purchaseId`; never send it again.
 *
 * Nothing here is a secret (the PIN is never kept). One intent per account: a person buys one pack at a time. Every call is bounded and
 * never throws: a store that fails reads as "nothing remembered", and this run's memory still holds it.
 */
export type BuyIntent = {
  /** The `Idempotency-Key`. */
  key: string;
  packId: string;
  method: 'wallet' | 'transfer';
  /** What the request carries: the total the person saw and the quote's token. */
  expectedTotalKobo: number;
  quoteToken: string;
  phase: 'unknown' | 'pending';
  /** The purchase's id once the Hub has answered `pending` or `awaiting_transfer`. */
  purchaseId: string | null;
  /** When the request was first sent (ms). */
  at: number;
};

/**
 * How long an intent with no answer is kept. The Hub keeps a key for at least a day, so past this the same key could no longer be
 * trusted to find the first purchase; the person has long since seen the outcome in their points, and a new one is their own act.
 * A pending intent is read by id, which does not expire.
 */
export const UNKNOWN_KEEP_MS = 23 * 60 * 60 * 1000;

const onWeb = Platform.OS === 'web';

/** One account's key in the store. A WAWU ID `sub` is a UUID, which the secure store accepts in a key. */
export const intentKey = (owner: string) => `wmt.points.buy.${owner}`;

const filled = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

/** The stored entry, or null when it is not whole (a half-written or foreign entry is dropped, never used). */
export function readIntent(value: unknown): BuyIntent | null {
  const v = value as Partial<BuyIntent> | null;
  if (!v || typeof v !== 'object' || !filled(v.key) || !filled(v.quoteToken) || !filled(v.packId)) return null;
  if (v.method !== 'wallet' && v.method !== 'transfer') return null;
  if (typeof v.expectedTotalKobo !== 'number' || !Number.isSafeInteger(v.expectedTotalKobo) || v.expectedTotalKobo <= 0) return null;
  if (v.phase !== 'unknown' && v.phase !== 'pending') return null;
  if (typeof v.at !== 'number' || !Number.isFinite(v.at)) return null;
  const purchaseId = filled(v.purchaseId) ? v.purchaseId : null;
  if (v.phase === 'pending' && purchaseId === null) return null;
  return { key: v.key, packId: v.packId, method: v.method, expectedTotalKobo: v.expectedTotalKobo, quoteToken: v.quoteToken, phase: v.phase, purchaseId, at: v.at };
}

/** True when the intent can still be trusted at `now`. */
export const intentAlive = (intent: BuyIntent, now: number): boolean => intent.phase === 'pending' || now - intent.at < UNKNOWN_KEEP_MS;

const readRaw = (key: string): Promise<string | null> =>
  bounded(async () => (onWeb ? (globalThis.localStorage?.getItem(key) ?? null) : SecureStore.getItemAsync(key)), null);

/** True when the store took the value. A store that throws or takes too long has not kept it. */
const writeRaw = (key: string, value: string | null): Promise<boolean> =>
  bounded(async () => {
    if (onWeb) {
      if (value === null) globalThis.localStorage?.removeItem(key);
      else globalThis.localStorage?.setItem(key, value);
    } else if (value === null) await SecureStore.deleteItemAsync(key);
    else await SecureStore.setItemAsync(key, value);
    return true;
  }, false);

const memory = new Map<string, BuyIntent | null>();
let writes: Promise<unknown> = Promise.resolve();

/** The phone forgets what this run held in memory (for tests: a reload, the app closed and opened). What was written stays. */
export function forgetIntentInMemory(): void {
  memory.clear();
  writes = Promise.resolve();
}

/** The unresolved intent for this account, if the phone holds one that can still be trusted. */
export async function findIntent(owner: string): Promise<BuyIntent | null> {
  if (memory.has(owner)) return memory.get(owner) ?? null;
  let found: BuyIntent | null = null;
  try {
    const raw = await readRaw(intentKey(owner));
    found = raw ? readIntent(JSON.parse(raw)) : null;
  } catch {
    found = null;
  }
  if (found && !intentAlive(found, Date.now())) found = null;
  // Whatever this run put in memory while the phone was being asked is newer than the store.
  if (!memory.has(owner)) memory.set(owner, found);
  return memory.get(owner) ?? null;
}

/** Writes are one after another, so an older write never lands over a newer one. */
function persist(owner: string, intent: BuyIntent | null): Promise<boolean> {
  const done = writes.then(() => writeRaw(intentKey(owner), intent === null ? null : JSON.stringify(intent)));
  writes = done;
  return done;
}

/**
 * Keeps the intent. The memory changes at once; the promise settles when the store has it, so a caller can wait for it before the
 * request leaves the phone. It settles false when the store did not keep it: the memory then goes back to what it held, because a
 * request that is not sent leaves nothing to remember. The caller does not send.
 */
export async function putIntent(owner: string, intent: BuyIntent): Promise<boolean> {
  const before = memory.has(owner) ? (memory.get(owner) ?? null) : await findIntent(owner);
  memory.set(owner, intent);
  const kept = await persist(owner, intent);
  if (!kept && memory.get(owner) === intent) memory.set(owner, before);
  return kept;
}

/** Lets the intent go: the Hub has given a final answer for its key. */
export async function dropIntent(owner: string, key: string): Promise<void> {
  const known = memory.has(owner) ? (memory.get(owner) ?? null) : await findIntent(owner);
  if (!known || known.key !== key) return;
  memory.set(owner, null);
  await persist(owner, null);
}

/** Sign-out keeps only what is still unresolved: nothing of this run's memory outlives the session. */
onSessionEnd(() => {
  const now = Date.now();
  for (const [owner, intent] of [...memory.entries()]) {
    if (intent && !intentAlive(intent, now)) void persist(owner, null);
  }
  memory.clear();
});
