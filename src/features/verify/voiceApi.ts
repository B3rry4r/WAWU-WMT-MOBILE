import { api, resendsUnderKey, unwrap } from '@/api/client';
import { ApiError, failureOf } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * The Voice calls VF3 and VF4 make (VERIFY-02), as VOICE-01's contract types them:
 * - `GET /me/voice`: how the person's name is said (`namePhonetic`, `nameSavedAt`) and whether voices are on (`available`).
 * - `POST /me/voice/name-preview`: the name said in the studio voice. Free, limited per hour by a Hub setting (`429 voice_preview_limit`);
 *   `503 voice_unavailable` when voices are not set up. `phonetic` is how it sounds when the plain spelling is not said right.
 * - `PUT /me/voice/name`: keeps the phonetic spelling (`null` puts the name back to its plain spelling).
 * - `GET /me/voice-intro`: the words, the limit (`textMaxChars`, a Hub setting), the audio and the rest of the intro's state.
 * - `PUT /me/voice-intro/text`: keeps the words (`400 voice_text_too_long` over the limit).
 *
 * VERIFY-03 adds the rest of VOICE-01's routes: `POST /me/voice-intro/consent` (the Hub's own line, sent back unchanged),
 * `POST /uploads/presign` (folder `voice/sample`) and `/confirm` for the recording, `POST /me/voice-intro/sample` (keeps the landed file),
 * `POST /me/voice-intro/generate` (keyed, `202`, then `GET /me/voice-intro` is polled). `GET /users/{wawuId}/voice-intro` (what a listener hears)
 * is read by a visitor's profile (M5, FIX-103) for the Bio player; the owner's own profile (M1) plays `audioUrl` from `GET /me/voice-intro`.
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data` (SHARED-CHANGES.md row 11), so each call
 * reads `data` itself and refuses an answer that is not the view it expects. Nothing here names or calls a voice provider.
 */
type Envelope<T> = { statusCode?: number; message?: string; data?: T | null };

export type MyVoice = components['schemas']['MyVoiceView'];
export type NamePreview = components['schemas']['NamePreviewView'];
export type VoiceIntro = components['schemas']['VoiceIntroView'];

/** What a listener hears on someone's profile (`GET /users/{wawuId}/voice-intro`): the audio's link, or null for a person with none. */
export type PublicVoiceIntro = NonNullable<components['schemas']['PublicVoiceIntroView']['voiceIntro']>;

export const voiceKey = ['voice', 'name'] as const;
export const voiceIntroKey = ['voice', 'intro'] as const;
export const publicVoiceIntroKey = (wawuUserId: string) => ['voice', 'public-intro', wawuUserId] as const;

/**
 * The name field's limits as the contract states them (`NamePreviewDto.name` 60, `phonetic` 80); the Hub refuses anything longer. The Hub
 * serves neither figure (BACKEND_GAPS G-SWEEP-VOICE-1), so they stay literals until it does, and then `GET /me/voice` is where they are read.
 * PROVISIONAL(VOICE-NAME-LIMITS, owner=VOICE-01, why=the Hub serves no limit for the name or its spelling; these are the contract DTO's maxLength and the Hub refuses longer).
 */
export const NAME_MAX = 60;
export const PHONETIC_MAX = 80;

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `Your ${what} could not be read. Try again.`);
}

/** How the person's name is said. An answer that is not a voice view is refused, never drawn as "no voice". */
export async function fetchMyVoice(): Promise<MyVoice> {
  const body = (await unwrap(api.GET('/api/hub/me/voice'))) as unknown as Envelope<MyVoice>;
  const voice = body?.data;
  if (!voice || typeof voice !== 'object' || typeof voice.available !== 'boolean') throw unreadable('voice');
  return voice;
}

/** The name said in the studio voice: a link to the audio the Hub made. `phonetic` is sent only when there is one. */
export async function previewName(name: string, phonetic?: string): Promise<NamePreview> {
  const body = (await unwrap(
    api.POST('/api/hub/me/voice/name-preview', { body: { name: name.slice(0, NAME_MAX), ...(phonetic ? { phonetic: phonetic.slice(0, PHONETIC_MAX) } : {}) } }),
  )) as unknown as Envelope<NamePreview>;
  const preview = body?.data;
  if (!preview || typeof preview.audioUrl !== 'string' || preview.audioUrl.length === 0) throw unreadable('name');
  return preview;
}

/** Keeps how the name is said; `null` puts it back to the plain spelling. */
export async function saveNameSpelling(phonetic: string | null): Promise<MyVoice> {
  const body = (await unwrap(api.PUT('/api/hub/me/voice/name', { body: { phonetic } }))) as unknown as Envelope<MyVoice>;
  const voice = body?.data;
  if (!voice || typeof voice !== 'object' || typeof voice.available !== 'boolean') throw unreadable('voice');
  return voice;
}

const isIntro = (value: unknown): value is VoiceIntro =>
  !!value && typeof value === 'object' && typeof (value as VoiceIntro).textMaxChars === 'number' && (value as VoiceIntro).textMaxChars > 0;

/** The Voice Intro as it stands. An answer with no limit is refused: the limit is the Hub's, and the screen never draws one of its own. */
export async function fetchVoiceIntro(): Promise<VoiceIntro> {
  const body = (await unwrap(api.GET('/api/hub/me/voice-intro'))) as unknown as Envelope<VoiceIntro>;
  if (!isIntro(body?.data)) throw unreadable('Voice Intro');
  return body.data;
}

/**
 * Another person's Voice Intro, as a listener on their profile gets it: `null` when they have none (a plain account, or no intro made yet).
 * The Hub answers `404` for a person who does not exist or who blocked the viewer. `wawuUserId` is the person's id from their profile,
 * never a handle (the route takes a UUID). An answer that is neither `{ voiceIntro: null }` nor one with a link is refused, never drawn as "none".
 */
export async function fetchPublicVoiceIntro(wawuUserId: string): Promise<PublicVoiceIntro | null> {
  const body = (await unwrap(
    api.GET('/api/hub/users/{wawuId}/voice-intro', { params: { path: { wawuId: wawuUserId } } }),
  )) as unknown as Envelope<{ voiceIntro?: PublicVoiceIntro | null }>;
  const data = body?.data;
  if (!data || typeof data !== 'object' || !('voiceIntro' in data)) throw unreadable('Voice Intro');
  const intro = data.voiceIntro;
  if (intro === null) return null;
  if (!intro || typeof intro.url !== 'string' || intro.url.length === 0) throw unreadable('Voice Intro');
  return intro;
}

/** Keeps the Voice Intro's words. */
export async function saveVoiceIntroText(text: string): Promise<VoiceIntro> {
  const body = (await unwrap(api.PUT('/api/hub/me/voice-intro/text', { body: { text } }))) as unknown as Envelope<VoiceIntro>;
  if (!isIntro(body?.data)) throw unreadable('Voice Intro');
  return body.data;
}


/** The person agrees. `line` is the words `GET /me/voice-intro` served in `consent.line`: the Hub refuses any other (`409 voice_consent_line_changed`). */
export async function giveVoiceConsent(line: string): Promise<VoiceIntro> {
  const body = (await unwrap(api.POST('/api/hub/me/voice-intro/consent', { body: { line } }))) as unknown as Envelope<VoiceIntro>;
  if (!isIntro(body?.data)) throw unreadable('Voice Intro');
  return body.data;
}

/** The code of the error a recording's own upload raises, so a screen knows its sentence is ready to show. */
export const RECORDING_UPLOAD_FAILED = 'upload_failed';
const UPLOAD_FAILED = 'Your recording did not upload. Try again.';

export type RecordingFile = { uri: string; contentType: string; extension: string };

/**
 * How long the app waits on the phone or the browser to hand over the take, and on the storage host to take the bytes, before it calls the
 * upload failed (R2-AUTHME3, VF10a). Without a limit a host that never answers left "Use this" spinning with nothing said.
 * PROVISIONAL(VOICE-UPLOAD-WAIT, owner=VOICE-01, why=no ruling names a wait; a 30 second take is under a megabyte, so a minute is generous on any connection that works).
 */
export const READ_TAKE_MS = 15_000;
export const UPLOAD_PUT_MS = 60_000;
const UPLOAD_SLOW = 'Your recording is taking too long to upload. Check your connection and try again.';

function withinMs<T>(ms: number, work: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    work().then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Sends the recording the Hub's way: `POST /uploads/presign` (folder `voice/sample`, the exact byte length), a PUT of the bytes to the
 * address it gave, then `POST /uploads/confirm`, which asks the storage host whether the file landed. A file the host says is not there
 * (`abandoned`) is an upload that failed. Answers the file's address, which `keepVoiceSample` takes.
 */
export async function uploadVoiceSample(file: RecordingFile): Promise<string> {
  let blob: Blob;
  try {
    blob = await withinMs(READ_TAKE_MS, async () => (await fetch(file.uri)).blob());
  } catch {
    throw new ApiError('unknown', 0, 'We could not read your recording. Record it again.', RECORDING_UPLOAD_FAILED);
  }
  const signed = (await unwrap(
    api.POST('/api/hub/uploads/presign', { body: { folder: 'voice/sample', contentType: file.contentType, extension: file.extension, contentLength: blob.size } }),
  )) as unknown as Envelope<{ uploadUrl?: unknown; fileUrl?: unknown }>;
  const target = signed?.data;
  if (!target || typeof target.uploadUrl !== 'string' || typeof target.fileUrl !== 'string') throw unreadable('upload');
  let sent: Response;
  const stop = new AbortController();
  const timer = setTimeout(() => stop.abort(), UPLOAD_PUT_MS);
  try {
    sent = await fetch(target.uploadUrl, { method: 'PUT', headers: { 'content-type': file.contentType }, body: blob, signal: stop.signal });
  } catch (error) {
    if (stop.signal.aborted) throw new ApiError('network', 0, UPLOAD_SLOW, RECORDING_UPLOAD_FAILED);
    throw failureOf(error);
  } finally {
    clearTimeout(timer);
  }
  if (!sent.ok) throw new ApiError('server', sent.status, UPLOAD_FAILED, RECORDING_UPLOAD_FAILED);
  const settled = (await unwrap(api.POST('/api/hub/uploads/confirm', { body: { key: target.fileUrl } }))) as unknown as Envelope<{ status?: unknown }>;
  if (settled?.data?.status === 'abandoned') throw new ApiError('server', 0, UPLOAD_FAILED, RECORDING_UPLOAD_FAILED);
  return target.fileUrl;
}

/** Keeps the landed recording as the person's sample (`400 voice_sample_unusable` when the Hub cannot use it, `409 voice_consent_required` before consent). */
export async function keepVoiceSample(fileUrl: string): Promise<VoiceIntro> {
  const body = (await unwrap(api.POST('/api/hub/me/voice-intro/sample', { body: { fileUrl } }))) as unknown as Envelope<VoiceIntro>;
  if (!isIntro(body?.data)) throw unreadable('Voice Intro');
  return body.data;
}

/**
 * Starts making the Voice Intro (`202`, the try `working`). The key is one per try and travels again, unchanged, when no answer came:
 * the same key answers the first try and takes nothing more, so a repeat can never take points twice.
 */
export async function startVoiceIntro(key: string): Promise<VoiceIntro> {
  const body = (await unwrap(
    api.POST('/api/hub/me/voice-intro/generate', { params: { header: { 'Idempotency-Key': key } }, fetch: resendsUnderKey }),
  )) as unknown as Envelope<VoiceIntro>;
  if (!isIntro(body?.data)) throw unreadable('Voice Intro');
  return body.data;
}

/** A new Idempotency-Key for one try (8 to 128 of letters, digits, `-` and `_`). */
export function newTryKey(): string {
  const made = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (typeof made?.randomUUID === 'function') return `voice-${made.randomUUID()}`;
  return `voice-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
