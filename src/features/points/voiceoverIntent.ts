import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { onSessionEnd } from '@/api/session';
import { bounded } from '@/features/claim/localStore';

/**
 * A job the person started, kept on the phone until they have seen its end (V8: the same Run sent twice makes one job).
 *
 * One intent is one `Idempotency-Key` and one request body (the words or the description, the voice if the tool has one, and the quote's token). If the app does not hear the
 * Hub's answer (no network, a timeout, a server fault, the same key still running) points may be held, so the only safe next step is to
 * send the SAME request again: the Hub answers a key it knows with the first job, before it looks at the quote. Once the Hub has
 * answered, the job's id is all that is needed and the job is read by it ("You can leave this screen" is true: the job is found again
 * when the person comes back). The words are the person's own and stay on this phone; the Hub never keeps them.
 *
 * - `jobId` null: sent, and no answer proves anything. Send it again, same key, same body.
 * - `jobId` set: the Hub has the job. Read it by id; never send it again.
 *
 * Removed when the person has seen the job's end (done or failed), or the Hub refused the key outright (nothing exists for it). One
 * intent per account and per tool: a person makes one job at a time in each tool, and a job left running in one tool is never
 * written over by a Run in another. VoiceOver's record stays where it always was; every other tool's sits beside it under its own id. Every call is bounded and never throws: a store that fails reads as "nothing
 * remembered", and this run's memory still holds it.
 */
export type JobIntent = {
  key: string;
  toolId: string;
  action: string;
  /** The voice of a tool that reads words aloud; empty for a tool that takes a description (Sound effect, Music track). */
  voiceId: string;
  /** The words to speak, or the description of the sound or track: the person's own, kept on this phone only. */
  text: string;
  units: number;
  characters: number;
  quoteToken: string;
  /** A tool that takes the person's own recording (Captions, Clean audio): the `key` the upload gave. `text` then holds the file's name. */
  fileKey?: string;
  /** Dubbing: the language to hear the recording in, one of the Hub's own list (`input.file.dubbing.languages`). */
  targetLanguage?: string;
  jobId: string | null;
  /** When the request was first sent (ms). */
  at: number;
};

/** The Hub keeps a key for at least a day, so past this the same key could no longer be trusted to find the first job. A job with its id is read by id, which does not expire. */
export const UNKNOWN_KEEP_MS = 23 * 60 * 60 * 1000;

const onWeb = Platform.OS === 'web';

/** VoiceOver's record keeps the key it has always had (a job left running before an update is still found); every other tool adds its id. */
export const jobIntentKey = (owner: string, toolId: string = 'voiceover') => (toolId === 'voiceover' ? `wmt.points.job.${owner}` : `wmt.points.job.${owner}.${toolId}`);

const filled = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const positive = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

/** The stored entry, or null when it is not whole (a half-written or foreign entry is dropped, never used). */
export function readJobIntent(value: unknown): JobIntent | null {
  const v = value as Partial<JobIntent> | null;
  if (!v || typeof v !== 'object') return null;
  if (!filled(v.key) || !filled(v.toolId) || !filled(v.action) || typeof v.voiceId !== 'string' || !filled(v.text) || !filled(v.quoteToken)) return null;
  const file = filled(v.fileKey);
  // A recording's job counts minutes, not characters: its `characters` is 0.
  if (!positive(v.units) || !(file ? v.characters === 0 : positive(v.characters)) || typeof v.at !== 'number' || !Number.isFinite(v.at)) return null;
  return {
    key: v.key,
    toolId: v.toolId,
    action: v.action,
    voiceId: v.voiceId,
    text: v.text,
    units: v.units,
    characters: v.characters as number,
    quoteToken: v.quoteToken,
    ...(file ? { fileKey: v.fileKey as string } : {}),
    ...(file && filled(v.targetLanguage) ? { targetLanguage: v.targetLanguage } : {}),
    jobId: filled(v.jobId) ? v.jobId : null,
    at: v.at,
  };
}

/** True when the intent can still be trusted at `now`. */
export const jobIntentAlive = (intent: JobIntent, now: number): boolean => intent.jobId !== null || now - intent.at < UNKNOWN_KEEP_MS;

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

/** By the store's key: one record per account and tool. */
const memory = new Map<string, JobIntent | null>();
let writes: Promise<unknown> = Promise.resolve();

/** The phone forgets what this run held in memory (for tests: a reload, the app closed and opened). What was written stays. */
export function forgetJobIntentInMemory(): void {
  memory.clear();
  writes = Promise.resolve();
}

/** The unresolved job for this account in this tool, if the phone holds one that can still be trusted. */
export async function findJobIntent(owner: string, toolId: string = 'voiceover'): Promise<JobIntent | null> {
  const slot = jobIntentKey(owner, toolId);
  if (memory.has(slot)) return memory.get(slot) ?? null;
  let found: JobIntent | null = null;
  try {
    const raw = await readRaw(slot);
    found = raw ? readJobIntent(JSON.parse(raw)) : null;
  } catch {
    found = null;
  }
  if (found && (found.toolId !== toolId || !jobIntentAlive(found, Date.now()))) found = null;
  // Whatever this run put in memory while the phone was being asked is newer than the store.
  if (!memory.has(slot)) memory.set(slot, found);
  return memory.get(slot) ?? null;
}

/** Writes are one after another, so an older write never lands over a newer one. */
function persist(slot: string, intent: JobIntent | null): Promise<boolean> {
  const done = writes.then(() => writeRaw(slot, intent === null ? null : JSON.stringify(intent)));
  writes = done;
  return done;
}

/** Keeps the intent. The memory changes at once, so a retry in this run is the same request even if the store is slow or refuses. */
export async function putJobIntent(owner: string, intent: JobIntent): Promise<boolean> {
  const slot = jobIntentKey(owner, intent.toolId);
  memory.set(slot, intent);
  return persist(slot, intent);
}

/** Lets the intent go: the person has seen the job's end, or the Hub refused the key. */
export async function dropJobIntent(owner: string, key: string, toolId: string = 'voiceover'): Promise<void> {
  const slot = jobIntentKey(owner, toolId);
  const known = memory.has(slot) ? (memory.get(slot) ?? null) : await findJobIntent(owner, toolId);
  if (!known || known.key !== key) return;
  memory.set(slot, null);
  await persist(slot, null);
}

/** Sign-out keeps only what is still unresolved: nothing of this run's memory outlives the session. */
onSessionEnd(() => {
  const now = Date.now();
  for (const [slot, intent] of [...memory.entries()]) {
    if (intent && !jobIntentAlive(intent, now)) void persist(slot, null);
  }
  memory.clear();
});
