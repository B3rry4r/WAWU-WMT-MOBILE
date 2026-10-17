import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { bounded } from '@/features/claim/localStore';

import { readOrder, readPaymentQuote, type PaymentQuote, type WalletOrder } from './buyApi';

/**
 * A ticket payment, kept on the phone until the Hub has the last word (EVENTS-06).
 *
 * A payment is one `Idempotency-Key`, one order and the quote it carried. If the app does not hear the answer (no network, a
 * timeout, a server fault) the money may have moved, and the only safe next step is to send the SAME request again: the Hub
 * answers a key it knows with the first payment, before it looks at the PIN or the quote. If the Hub took it and said
 * `processing`, the only safe next step is to read the order by its id and never pay again. Both facts have to survive the
 * screen going away: Back, a reload, the app closed and opened. So the intent is written before the request leaves the phone and
 * removed when the Hub gives a final answer (paid, failed, or a refusal that proves nothing moved).
 *
 * - `unknown`: the request was sent and no answer proves anything. Send it again, same key, same body.
 * - `processing`: the Hub took it and has not finished. Read the order; never send it again.
 *
 * Nothing here is a secret (the PIN is never kept). The secure store is the one store the app already ships, and the browser
 * build keeps it in localStorage. Every call is bounded and never throws: a store that fails reads as "nothing remembered", and
 * the memory of this run still holds the intent.
 */
export type BuyIntent = {
  eventId: string;
  /** The order being paid, and the quote the request carries (its total and its token), as the person saw them. */
  order: WalletOrder;
  payment: PaymentQuote;
  /** The payment's `Idempotency-Key`. */
  key: string;
  phase: 'unknown' | 'processing';
  /** When the request was first sent (ms). */
  at: number;
};

/** The Hub keeps a key for at least a day, so an `unknown` intent is trusted for a little less; a `processing` one is read by id, which does not expire. */
export const UNKNOWN_KEEP_MS = 23 * 60 * 60 * 1000;
export const MAX_INTENTS = 8;

const onWeb = Platform.OS === 'web';
export const buyIntentsKey = (owner: string) => `wmt.events.buy.${owner}`;

const readRaw = (key: string): Promise<string | null> =>
  bounded(async () => (onWeb ? (globalThis.localStorage?.getItem(key) ?? null) : SecureStore.getItemAsync(key)), null);

const writeRaw = (key: string, value: string): Promise<boolean> =>
  bounded(async () => {
    if (onWeb) globalThis.localStorage?.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
    return true;
  }, false);

const filled = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

/** One stored entry, or null when it is not whole (a half-written or foreign entry is dropped, never used). */
export function readIntent(value: unknown): BuyIntent | null {
  const v = value as Partial<BuyIntent> | null;
  if (!v || typeof v !== 'object') return null;
  if (!filled(v.eventId) || !filled(v.key)) return null;
  if (v.phase !== 'unknown' && v.phase !== 'processing') return null;
  if (typeof v.at !== 'number' || !Number.isFinite(v.at)) return null;
  try {
    return { eventId: v.eventId, order: readOrder(v.order), payment: readPaymentQuote(v.payment), key: v.key, phase: v.phase, at: v.at };
  } catch {
    return null;
  }
}

const intentAlive = (intent: BuyIntent, now: number) => intent.phase === 'processing' || now - intent.at < UNKNOWN_KEEP_MS;

const memory = new Map<string, BuyIntent[]>();
const loading = new Map<string, Promise<BuyIntent[]>>();
let writes: Promise<unknown> = Promise.resolve();

function parseRows(raw: string | null, now: number): BuyIntent[] {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(readIntent).filter((row): row is BuyIntent => row !== null && intentAlive(row, now)) : [];
  } catch {
    return [];
  }
}

/** The phone forgets what this run held in memory (for tests: a reload, the app closed and opened). What was written stays. */
export function forgetBuyIntentsInMemory(): void {
  memory.clear();
  loading.clear();
  writes = Promise.resolve();
}

async function load(owner: string): Promise<BuyIntent[]> {
  const known = memory.get(owner);
  if (known) return known;
  const pending = loading.get(owner);
  if (pending) return pending;
  const reading = (async () => {
    const rows = parseRows(await readRaw(buyIntentsKey(owner)), Date.now());
    // Whatever this run put in memory while the phone was being asked is newer than the store.
    const settled = memory.get(owner) ?? rows;
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
  const done = writes.then(() => writeRaw(buyIntentsKey(owner), JSON.stringify(rows)));
  writes = done;
  return done;
}

/** The unresolved payment for this event, if the phone holds one. */
export async function findBuyIntent(owner: string, eventId: string): Promise<BuyIntent | null> {
  const rows = await load(owner);
  return rows.find((row) => row.eventId === eventId) ?? null;
}

/** Keeps (or replaces, by event) an intent. True when the store took it; the memory of this run holds it either way. */
export async function putBuyIntent(owner: string, intent: BuyIntent): Promise<boolean> {
  const rows = await load(owner);
  const next = [...rows.filter((row) => row.eventId !== intent.eventId), intent].slice(-MAX_INTENTS);
  memory.set(owner, next);
  return persist(owner);
}

/** Removes the intent for this event and key, when the Hub has given a final answer. */
export async function dropBuyIntent(owner: string, eventId: string, key: string): Promise<void> {
  const rows = await load(owner);
  if (!rows.some((row) => row.eventId === eventId && row.key === key)) return;
  memory.set(owner, rows.filter((row) => !(row.eventId === eventId && row.key === key)));
  await persist(owner);
}
