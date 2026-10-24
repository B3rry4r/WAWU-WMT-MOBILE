import { api, apiBaseUrl, unwrap } from '@/api/client';
import type { components } from '@/api/schema.generated';
import { unreadable, type Envelope } from '@/features/wallet/api/home';

/**
 * The calls behind VoiceOver's four added parts (AITOOLS-07), as the backend contract types them:
 * - `GET /ai-tools/own-voice`, `POST /ai-tools/own-voice/consent`, `DELETE /ai-tools/own-voice`: "Your voice", made from the person's
 *   Voice Intro recording, after they agree to the Hub's words for VoiceOver (the Voice Intro's agreement covers intros only);
 * - `GET /ai-tools/voices/{id}/sample` (a path the catalogue gives as `sampleUrl`): the play button on a voice row;
 * - `POST` and `DELETE /ai-tools/jobs/{id}/save`: Save, "To your library";
 * - `PATCH /product-drafts/{id}` with `mediaJobId`: "Use in a product", "Attach to a draft".
 */
export type OwnVoice = components['schemas']['OwnVoiceView'];
export type OwnVoiceRemoved = components['schemas']['OwnVoiceRemovedView'];
export type SavedJob = components['schemas']['AiJobView'];

/** The id a VoiceOver job names for the person's own voice (the Hub's reserved voice id; it is not in the catalogue's list). */
export const OWN_VOICE_ID = 'own';

const readOwnVoice = (value: unknown): OwnVoice => {
  const v = value as Partial<OwnVoice> | null;
  const ok =
    v &&
    typeof v === 'object' &&
    typeof v.available === 'boolean' &&
    typeof v.hasRecording === 'boolean' &&
    typeof v.ready === 'boolean' &&
    typeof v.consent?.line === 'string' &&
    typeof v.consent.given === 'boolean';
  if (!ok) throw unreadable('voice');
  return v as OwnVoice;
};

export async function fetchOwnVoice(): Promise<OwnVoice> {
  const body = (await unwrap(api.GET('/api/hub/ai-tools/own-voice'))) as unknown as Envelope<OwnVoice>;
  return readOwnVoice(body?.data);
}

export const ownVoiceKey = (owner: string | null) => ['ai-tools', 'own-voice', owner ?? ''] as const;
export const ownVoiceQuery = (owner: string | null) => ({ queryKey: ownVoiceKey(owner), queryFn: fetchOwnVoice, enabled: Boolean(owner), staleTime: 30_000 }) as const;

/** The person agrees: `line` is the words `GET /ai-tools/own-voice` served, sent back unchanged (the Hub refuses any others). */
export async function giveOwnVoiceConsent(line: string): Promise<OwnVoice> {
  const body = (await unwrap(api.POST('/api/hub/ai-tools/own-voice/consent', { body: { line } }))) as unknown as Envelope<OwnVoice>;
  return readOwnVoice(body?.data);
}

/** Takes the agreement back; the Hub has the provider drop every copy of the voice (`atProvider`: `gone`, or `pending` while it keeps trying). */
export async function removeOwnVoice(): Promise<OwnVoiceRemoved> {
  const body = (await unwrap(api.DELETE('/api/hub/ai-tools/own-voice'))) as unknown as Envelope<OwnVoiceRemoved>;
  const data = body?.data;
  if (!data || (data.atProvider !== 'gone' && data.atProvider !== 'pending')) throw unreadable('voice');
  return { own: readOwnVoice(data.own), atProvider: data.atProvider };
}

/** Saves a finished result to the person's library, or takes it out again. Answers the job as it now stands. */
export async function setJobSaved(id: string, saved: boolean): Promise<SavedJob> {
  const params = { params: { path: { id } } };
  const body = (await unwrap(saved ? api.POST('/api/hub/ai-tools/jobs/{id}/save', params) : api.DELETE('/api/hub/ai-tools/jobs/{id}/save', params))) as unknown as Envelope<SavedJob>;
  if (!body?.data || body.data.id !== id) throw unreadable('result');
  return body.data;
}

/** The address a voice's sample plays from: the Hub's own path (`sampleUrl`) on the app's API address. A full address is kept as it is. */
export function sampleAddress(sampleUrl: string): string {
  return /^https?:\/\//.test(sampleUrl) ? sampleUrl : `${apiBaseUrl.replace(/\/+$/, '')}${sampleUrl.startsWith('/') ? '' : '/'}${sampleUrl}`;
}
