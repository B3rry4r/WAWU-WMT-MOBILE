import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { readPaymentQuote, type PaymentQuote } from '@/features/events/buyApi';
import { bounded } from '@/features/claim/localStore';

/**
 * A school-fee payment, kept on the phone until the Hub has the last word (SCHOOLS-06; the same rule as a ticket's, EVENTS-06).
 *
 * A payment is one `Idempotency-Key`, one enrolment and the quote it carried. If the app does not hear the answer (no network, a
 * timeout, a server fault) the money may have moved, and the only safe next step is to send the SAME request again: the Hub
 * answers a key it knows with the first payment, before it looks at the PIN or the quote. If the Hub took it and said `pending`,
 * the only safe next step is to read the enrolment by its id and never pay again. Both facts have to survive the screen going
 * away: Back, a reload, the app closed and opened. So the intent is written before the request leaves the phone and removed when
 * the Hub gives a final answer (enrolled, failed, or a refusal that proves nothing moved).
 *
 * - `unknown`: the request was sent and no answer proves anything. Send it again, same key, same body.
 * - `processing`: the Hub took it and has not finished. Read the enrolment; never send it again.
 *
 * Nothing here is a secret (the PIN is never kept). Every call is bounded and never throws: a store that fails reads as "nothing
 * remembered", and the memory of this run still holds the intent.
 */
export type EnrolIntent = {
  enrolmentId: string;
  /** The quote the request carries (its total and its token), as the person saw it. */
  payment: PaymentQuote;
  /** The payment's `Idempotency-Key`. */
  key: string;
  phase: 'unknown' | 'processing';
  /** The Hub's id for the payment it took (`processing` only): read while confirming, so a payment that fails is told. Absent in entries written before it was kept. */
  paymentId?: string | null;
  /** When the request was first sent (ms). */
  at: number;
};

/** The Hub keeps a key for at least a day, so an `unknown` intent is trusted for a little less; a `processing` one is read by id, which does not expire. */
export const UNKNOWN_KEEP_MS = 23 * 60 * 60 * 1000;
export const MAX_INTENTS = 8;

const onWeb = Platform.OS === 'web';
export const enrolIntentsKey = (owner: string) => `wmt.schools.enrol.${owner}`;

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
export function readIntent(value: unknown): EnrolIntent | null {
  const v = value as Partial<EnrolIntent> | null;
  if (!v || typeof v !== 'object' || !filled(v.enrolmentId) || !filled(v.key)) return null;
  if (v.phase !== 'unknown' && v.phase !== 'processing') return null;
  if (typeof v.at !== 'number' || !Number.isFinite(v.at)) return null;
  try {
    return { enrolmentId: v.enrolmentId, payment: readPaymentQuote(v.payment), key: v.key, phase: v.phase, paymentId: filled(v.paymentId) ? v.paymentId : null, at: v.at };
  } catch {
    return null;
  }
}

const alive = (intent: EnrolIntent, now: number) => intent.phase === 'processing' || now - intent.at < UNKNOWN_KEEP_MS;

const memory = new Map<string, EnrolIntent[]>();
const loading = new Map<string, Promise<EnrolIntent[]>>();
let writes: Promise<unknown> = Promise.resolve();

function parseRows(raw: string | null, now: number): EnrolIntent[] {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(readIntent).filter((row): row is EnrolIntent => row !== null && alive(row, now)) : [];
  } catch {
    return [];
  }
}

/** The phone forgets what this run held in memory (for tests: a reload, the app closed and opened). What was written stays. */
export function forgetEnrolIntentsInMemory(): void {
  memory.clear();
  loading.clear();
  writes = Promise.resolve();
}

async function load(owner: string): Promise<EnrolIntent[]> {
  const known = memory.get(owner);
  if (known) return known;
  const pending = loading.get(owner);
  if (pending) return pending;
  const reading = (async () => {
    const rows = parseRows(await readRaw(enrolIntentsKey(owner)), Date.now());
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
  const done = writes.then(() => writeRaw(enrolIntentsKey(owner), JSON.stringify(rows)));
  writes = done;
  return done;
}

/** The unresolved payment for this enrolment, if the phone holds one. */
export async function findEnrolIntent(owner: string, enrolmentId: string): Promise<EnrolIntent | null> {
  const rows = await load(owner);
  return rows.find((row) => row.enrolmentId === enrolmentId) ?? null;
}

/** Keeps (or replaces, by enrolment) an intent. True when the store took it; the memory of this run holds it either way. */
export async function putEnrolIntent(owner: string, intent: EnrolIntent): Promise<boolean> {
  const rows = await load(owner);
  const next = [...rows.filter((row) => row.enrolmentId !== intent.enrolmentId), intent].slice(-MAX_INTENTS);
  memory.set(owner, next);
  return persist(owner);
}

/** Removes the intent for this enrolment and key, when the Hub has given a final answer. */
export async function dropEnrolIntent(owner: string, enrolmentId: string, key: string): Promise<void> {
  const rows = await load(owner);
  if (!rows.some((row) => row.enrolmentId === enrolmentId && row.key === key)) return;
  memory.set(owner, rows.filter((row) => !(row.enrolmentId === enrolmentId && row.key === key)));
  await persist(owner);
}
