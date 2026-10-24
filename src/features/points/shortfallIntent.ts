import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { onSessionEnd } from '@/api/session';
import { bounded } from '@/features/claim/localStore';

import type { JobAction } from './studioApi';

/**
 * A "buy the missing points" intent, kept on the phone until the Hub has the last word (V8: the same Confirm sent twice buys once).
 *
 * One intent is one `Idempotency-Key` and one request body (the job as it was quoted, the wallet total and the quote token). If the app
 * does not hear the answer (no network, a timeout, a server fault, the same key still running) the money may have moved, so the only safe
 * next step is to send the SAME request again: the Hub answers a key it knows with the first purchase, before it looks at the PIN or the
 * quote. If the Hub took it and said `pending`, the only safe next step is to read it by its id. Both facts have to survive the sheet
 * going away (Back, a reload, the app closed and opened), so the intent is written here before the request leaves the phone and removed
 * when the Hub gives a final answer (a paid or failed purchase, or a refusal that proves none exists for the key).
 *
 * - `unknown`: sent, and no answer proves anything. Send it again, same key, same body.
 * - `pending`: the Hub took it and has not finished (the bank has not confirmed the debit). Read it by `shortfallId`; never send it again.
 *
 * Nothing here is a secret (the PIN is never kept). One intent per account: a person buys the missing points of one job at a time.
 * Every call is bounded and never throws: a store that fails reads as "nothing remembered", and this run's memory still holds it.
 */
export type ShortfallIntent = {
  /** The `Idempotency-Key`. */
  key: string;
  action: JobAction;
  units: number;
  languages?: number;
  characters?: number;
  /** What the request carries: the wallet total the person saw and the quote's token. */
  expectedTotalKobo: number;
  quoteToken: string;
  phase: 'unknown' | 'pending';
  /** The purchase's id once the Hub has answered `pending`. */
  shortfallId: string | null;
  /** When the request was first sent (ms). */
  at: number;
};

/** The Hub keeps a key for at least a day, so past this the same key could no longer be trusted to find the first purchase. A pending intent is read by id, which does not expire. */
export const UNKNOWN_KEEP_MS = 23 * 60 * 60 * 1000;

const onWeb = Platform.OS === 'web';

export const intentKey = (owner: string) => `wmt.points.shortfall.${owner}`;

const filled = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const positive = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

/** The stored entry, or null when it is not whole (a half-written or foreign entry is dropped, never used). */
export function readIntent(value: unknown): ShortfallIntent | null {
  const v = value as Partial<ShortfallIntent> | null;
  if (!v || typeof v !== 'object' || !filled(v.key) || !filled(v.quoteToken) || !filled(v.action) || !positive(v.units) || !positive(v.expectedTotalKobo)) return null;
  if (v.phase !== 'unknown' && v.phase !== 'pending') return null;
  if (typeof v.at !== 'number' || !Number.isFinite(v.at)) return null;
  const shortfallId = filled(v.shortfallId) ? v.shortfallId : null;
  if (v.phase === 'pending' && shortfallId === null) return null;
  return {
    key: v.key,
    action: v.action,
    units: v.units,
    ...(positive(v.languages) ? { languages: v.languages } : {}),
    ...(positive(v.characters) ? { characters: v.characters } : {}),
    expectedTotalKobo: v.expectedTotalKobo,
    quoteToken: v.quoteToken,
    phase: v.phase,
    shortfallId,
    at: v.at,
  };
}

/** True when the intent can still be trusted at `now`. */
export const intentAlive = (intent: ShortfallIntent, now: number): boolean => intent.phase === 'pending' || now - intent.at < UNKNOWN_KEEP_MS;

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

const memory = new Map<string, ShortfallIntent | null>();
let writes: Promise<unknown> = Promise.resolve();

/** The phone forgets what this run held in memory (for tests: a reload, the app closed and opened). What was written stays. */
export function forgetIntentInMemory(): void {
  memory.clear();
  writes = Promise.resolve();
}

/** The unresolved intent for this account, if the phone holds one that can still be trusted. */
export async function findIntent(owner: string): Promise<ShortfallIntent | null> {
  if (memory.has(owner)) return memory.get(owner) ?? null;
  let found: ShortfallIntent | null = null;
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
function persist(owner: string, intent: ShortfallIntent | null): Promise<boolean> {
  const done = writes.then(() => writeRaw(intentKey(owner), intent === null ? null : JSON.stringify(intent)));
  writes = done;
  return done;
}

/**
 * Keeps the intent. The memory changes at once; the promise settles when the store has it, so a caller can wait for it before the
 * request leaves the phone. It settles false when the store did not keep it: the memory then goes back to what it held, because a
 * request that is not sent leaves nothing to remember. The caller does not send.
 */
export async function putIntent(owner: string, intent: ShortfallIntent): Promise<boolean> {
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
