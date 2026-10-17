import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { onSessionEnd } from '@/api/session';
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
  /** Who gets it: a WAWU user's id, or for a bank account the key `bank:<code>:<number>` (WALLET-03). */
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
  /**
   * A bank send to an account that is not saved carries the `nameToken` of the name check the person saw (WALLET-09); the same request
   * sent again carries the same one. Left out for a WAWU user and for a saved account.
   */
  nameToken?: string | null;
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

/** True when the store took the value. A store that throws or takes longer than `STORE_WAIT_MS` has not kept it. */
const writeRaw = (key: string, value: string): Promise<boolean> =>
  bounded(async () => {
    if (onWeb) globalThis.localStorage?.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
    return true;
  }, false);

/** What the store holds now: `{ raw: null }` when nothing is kept, null when the store could not be read (never the same thing). */
const readStored = (key: string): Promise<{ raw: string | null } | null> =>
  bounded<{ raw: string | null } | null>(async () => ({ raw: onWeb ? (globalThis.localStorage?.getItem(key) ?? null) : await SecureStore.getItemAsync(key) }), null);

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
  return { key: v.key, payeeId: v.payeeId, amountKobo: v.amountKobo, note: v.note, quote, phase: v.phase, transferId, at: v.at, ...(filled(v.nameToken) ? { nameToken: v.nameToken } : {}) };
}

/** True when the intent can still be trusted at `now`. */
export const intentAlive = (intent: SendIntent, now: number): boolean => intent.phase === 'pending' || now - intent.at < UNKNOWN_KEEP_MS;

const memory = new Map<string, SendIntent[]>();
const loading = new Map<string, Promise<SendIntent[]>>();
let writes: Promise<unknown> = Promise.resolve();

/** The whole entries in a stored value that can still be trusted at `now`; anything unreadable is nothing. */
function parseRows(raw: string | null, now: number): SendIntent[] {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(readIntent).filter((row): row is SendIntent => row !== null && intentAlive(row, now)) : [];
  } catch {
    return [];
  }
}

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
    const rows = parseRows(await readRaw(intentsKey(owner)), Date.now());
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
function persist(owner: string): Promise<boolean> {
  const rows = memory.get(owner) ?? [];
  const done = writes.then(() => writeRaw(intentsKey(owner), JSON.stringify(rows)));
  writes = done;
  return done;
}

/** The unresolved intent for this person and amount, if the phone holds one. */
export async function findIntent(owner: string, payeeId: string, amountKobo: number): Promise<SendIntent | null> {
  const rows = await load(owner);
  return rows.find((row) => row.payeeId === payeeId && row.amountKobo === amountKobo) ?? null;
}

/**
 * Keeps the intent (replacing the one with its key, or the one for the same person and amount). The memory changes at once; the
 * promise settles when the store has it, so a caller can wait for it before the request leaves the phone. It settles false when
 * the store did not keep it (a failure or no answer in time): the memory then goes back to what it held, because a request that
 * is not sent leaves nothing to remember. The caller does not send.
 */
export async function putIntent(owner: string, intent: SendIntent): Promise<boolean> {
  const rows = await load(owner);
  const next = [intent, ...rows.filter((row) => row.key !== intent.key && !(row.payeeId === intent.payeeId && row.amountKobo === intent.amountKobo))].slice(0, MAX_INTENTS);
  memory.set(owner, next);
  const kept = await persist(owner);
  if (!kept && memory.get(owner) === next) memory.set(owner, rows);
  return kept;
}

/**
 * The intent for this person and amount as the store holds it NOW. Another copy of the app on the same storage (a second browser
 * tab; a phone has one) may have sent since this screen opened, and its key and request are the ones that must be used. Waits for
 * this run's own writes first, so the store is read only after everything this run already decided has been written. Adopts the stored entry
 * when this run holds none for the person and amount, or holds the same send as unknown while the store has it pending. Never
 * replaces a different key this run already sent with: that send's own key is the one to repeat.
 */
export async function rereadIntent(owner: string, payeeId: string, amountKobo: number): Promise<SendIntent | null> {
  const rows = await load(owner);
  await writes;
  const stored = await readStored(intentsKey(owner));
  const mine = memory.get(owner) ?? rows;
  const here = mine.find((row) => row.payeeId === payeeId && row.amountKobo === amountKobo) ?? null;
  if (!stored) return here;
  const there = parseRows(stored.raw, Date.now()).find((row) => row.payeeId === payeeId && row.amountKobo === amountKobo) ?? null;
  if (!there) return here;
  const adopt = !here || (here.key === there.key && there.phase === 'pending' && here.phase !== 'pending');
  if (!adopt) return here;
  memory.set(owner, [there, ...mine.filter((row) => row.key !== there.key && row !== here)].slice(0, MAX_INTENTS));
  return there;
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

/** Lets go of the intent whose send the Hub has decided, found by the send's id (a receipt that shows it decided calls this). */
export async function dropIntentOfTransfer(owner: string, transferId: string): Promise<void> {
  const rows = await load(owner);
  const row = rows.find((r) => r.transferId === transferId);
  if (row) await dropIntent(owner, row.key);
}

/**
 * Sign-out keeps only what is still unresolved (WALLET-02 round 3). An unknown or pending send protects the person from paying
 * twice when they sign back in, so it stays in the store, under their account's own key. What has run out (an unknown send past
 * `UNKNOWN_KEEP_MS`) is written out of the store, and nothing of this run's memory outlives the session. A send the Hub decided
 * is already gone: the review and the receipt drop it the moment they see the answer.
 */
export async function settleIntentsAtSignOut(): Promise<void> {
  const now = Date.now();
  const owners = [...memory.keys()];
  for (const owner of owners) {
    const rows = memory.get(owner) ?? [];
    const kept = rows.filter((row) => intentAlive(row, now));
    if (kept.length !== rows.length) {
      memory.set(owner, kept);
      void persist(owner);
    }
  }
  memory.clear();
  loading.clear();
  await writes;
}

onSessionEnd(() => {
  void settleIntentsAtSignOut();
});
