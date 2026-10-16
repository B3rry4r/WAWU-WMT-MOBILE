import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { bounded } from '@/features/claim/localStore';

import { readQuote, type FeeQuote } from './api';

/**
 * A payment intent, kept on the phone until the Hub has the last word (WALLET-02 round 2).
 *
 * A send is one `Idempotency-Key`, one request body and the quote it carried. If the app does not hear the answer (no network,
 * a timeout, a server fault, the same key still running) the money may have moved, and the only safe next step is to send the
 * SAME request again: the Hub answers a key it knows with the first payment, before it looks at the PIN or the quote. If the
 * Hub did take it and said `pending`, the only safe next step is to read it by its id. Both facts have to survive the screen
 * going away: Back, a reload, the app closed and opened. So the intent is written here before the request leaves the phone
 * and removed when the Hub gives a final answer (a completed or failed send, or a refusal that proves no payment exists for
 * the key).
 *
 * - `unknown`: the request was sent and no answer proves anything. Send it again, same key, same body.
 * - `pending`: the Hub took it and the provider has not decided. Read it by `transferId`; never send it again.
 *
 * Nothing here is a secret (the PIN is never kept) and nothing is sent anywhere. The secure store is the one store the app
 * already ships, and the browser build used for development keeps it in localStorage. Every call is bounded and never throws:
 * a store that fails reads as "nothing remembered", and the memory of this run still holds the intent.
 */
export type SendIntent = {
  /** The `Idempotency-Key`, one per payment intent. */
  key: string;
  /** Who gets it. */
  payeeId: string;
  /** What they get, kobo. */
  amountKobo: number;
  note: string;
  /** The quote the request carries (its token and its total). */
  quote: FeeQuote;
  phase: 'unknown' | 'pending';
  /** The send's id once the Hub has answered `pending`. */
  transferId: string | null;
  /** When the request was first sent (ms). */
  at: number;
};

/**
 * How long an intent with no answer is kept. The Hub keeps a key for at least a day (`IDEMPOTENCY_KEY_HOURS`, never sooner),
 * so past this the same key could no longer be trusted to find the first payment; the person has long since seen the outcome
 * in Wallet activity, and a new send is their own act. A pending intent is read by id, which does not expire.
 */
export const UNKNOWN_KEEP_MS = 23 * 60 * 60 * 1000;

/** The most intents kept for one account; the newest stay. */
export const MAX_INTENTS = 8;

const onWeb = Platform.OS === 'web';

/** One account's key in the store. A WAWU ID `sub` is a UUID, which the secure store accepts in a key. */
export const intentsKey = (owner: string) => `wmt.send.intents.${owner}`;

const readRaw = (key: string): Promise<string | null> =>
  bounded(async () => (onWeb ? (globalThis.localStorage?.getItem(key) ?? null) : SecureStore.getItemAsync(key)), null);

const writeRaw = (key: string, value: string): Promise<void> =>
  bounded(async () => {
    if (onWeb) globalThis.localStorage?.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  }, undefined);

const filled = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

/** One stored entry, or null when it is not whole (a half-written or foreign entry is dropped, never used). */
export function readIntent(value: unknown): SendIntent | null {
  const v = value as Partial<SendIntent> | null;
  if (!v || typeof v !== 'object') return null;
  if (!filled(v.key) || !filled(v.payeeId) || typeof v.note !== 'string') return null;
  if (typeof v.amountKobo !== 'number' || !Number.isSafeInteger(v.amountKobo) || v.amountKobo <= 0) return null;
  if (v.phase !== 'unknown' && v.phase !== 'pending') return null;
  if (typeof v.at !== 'number' || !Number.isFinite(v.at)) return null;
  const transferId = filled(v.transferId) ? v.transferId : null;
  if (v.phase === 'pending' && transferId === null) return null;
  let quote: FeeQuote;
  try {
    quote = readQuote(v.quote);
  } catch {
    return null;
  }
  return { key: v.key, payeeId: v.payeeId, amountKobo: v.amountKobo, note: v.note, quote, phase: v.phase, transferId, at: v.at };
}

/** True when the intent can still be trusted at `now`. */
export const intentAlive = (intent: SendIntent, now: number): boolean => intent.phase === 'pending' || now - intent.at < UNKNOWN_KEEP_MS;

const memory = new Map<string, SendIntent[]>();
const loading = new Map<string, Promise<SendIntent[]>>();
let writes: Promise<void> = Promise.resolve();

/** The phone forgets what this run held in memory (for tests: a reload, the app closed and opened). What was written stays. */
export function forgetIntentsInMemory(): void {
  memory.clear();
  loading.clear();
  writes = Promise.resolve();
}

async function load(owner: string): Promise<SendIntent[]> {
  const known = memory.get(owner);
  if (known) return known;
  const pending = loading.get(owner);
  if (pending) return pending;
  const reading = (async () => {
    let rows: SendIntent[] = [];
    try {
      const raw = await readRaw(intentsKey(owner));
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        const now = Date.now();
        rows = parsed.map(readIntent).filter((row): row is SendIntent => row !== null && intentAlive(row, now));
      }
    } catch {
      rows = [];
    }
    // Whatever this run put in memory while the phone was being asked is newer than the store.
    const meanwhile = memory.get(owner);
    const settled = meanwhile ?? rows;
    memory.set(owner, settled);
    loading.delete(owner);
    return settled;
  })();
  loading.set(owner, reading);
  return reading;
}

/** Writes are one after another, so an older write never lands over a newer one. */
function persist(owner: string): Promise<void> {
  const rows = memory.get(owner) ?? [];
  writes = writes.then(() => writeRaw(intentsKey(owner), JSON.stringify(rows)));
  return writes;
}

/** The unresolved intent for this person and amount, if the phone holds one. */
export async function findIntent(owner: string, payeeId: string, amountKobo: number): Promise<SendIntent | null> {
  const rows = await load(owner);
  return rows.find((row) => row.payeeId === payeeId && row.amountKobo === amountKobo) ?? null;
}

/**
 * Keeps the intent (replacing the one with its key, or the one for the same person and amount). The memory changes at once; the
 * promise settles when the store has it, so a caller can wait for it before the request leaves the phone.
 */
export async function putIntent(owner: string, intent: SendIntent): Promise<void> {
  const rows = await load(owner);
  const next = [intent, ...rows.filter((row) => row.key !== intent.key && !(row.payeeId === intent.payeeId && row.amountKobo === intent.amountKobo))].slice(0, MAX_INTENTS);
  memory.set(owner, next);
  await persist(owner);
}

/** Lets the intent go: the Hub has given a final answer for its key. */
export async function dropIntent(owner: string, key: string): Promise<void> {
  const rows = await load(owner);
  if (!rows.some((row) => row.key === key)) return;
  memory.set(
    owner,
    rows.filter((row) => row.key !== key),
  );
  await persist(owner);
}
