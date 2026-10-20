import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
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
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data` (SHARED-CHANGES.md row 11), so each call
 * reads `data` itself and refuses an answer that is not the view it expects. Nothing here names or calls a voice provider.
 */
type Envelope<T> = { statusCode?: number; message?: string; data?: T | null };

export type MyVoice = components['schemas']['MyVoiceView'];
export type NamePreview = components['schemas']['NamePreviewView'];
export type VoiceIntro = components['schemas']['VoiceIntroView'];

export const voiceKey = ['voice', 'name'] as const;
export const voiceIntroKey = ['voice', 'intro'] as const;

/** The name field's limits as the contract states them (`NamePreviewDto.name` 60, `phonetic` 80); the Hub refuses anything longer. */
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

/** Keeps the Voice Intro's words. */
export async function saveVoiceIntroText(text: string): Promise<VoiceIntro> {
  const body = (await unwrap(api.PUT('/api/hub/me/voice-intro/text', { body: { text } }))) as unknown as Envelope<VoiceIntro>;
  if (!isIntro(body?.data)) throw unreadable('Voice Intro');
  return body.data;
}
