import { api, unwrap } from '@/api/client';
import type { components } from '@/api/schema.generated';
import { unreadable, type Envelope } from '@/features/wallet/api/home';

/**
 * The calls behind Clone your own voice (POINTS-16) and the Receptionist (POINTS-12), as the backend contract types them (AITOOLS-11, AITOOLS-06).
 *
 * - `GET /ai-tools/my-voice`: whether the person keeps a clone (`state` none, making or ready), its name, the words they agree to (their own name is in
 *   them) and what the recording must be. `DELETE /ai-tools/my-voice` takes it out of every list at once. Making it is a job (`POST /ai-tools/my-voice`,
 *   `startJob`): the sample's `key`, a name, the words agreed to and the quote's token.
 * - `GET`, `PUT` and `DELETE /ai-tools/receptionist`: the person's own agent (its details, what it knows, the limits and the voices), saved, or cleared with
 *   everything it knew. `POST` and `DELETE /ai-tools/receptionist/knowledge`: add a text, an https link or an uploaded document, or take one away.
 *   A message to it is a job (`POST /ai-tools/receptionist/messages`, `startJob`).
 *
 * Nothing about a telephone, a WhatsApp number or a call is here or anywhere in the app (R-109 point 3).
 */
export type SavedVoice = components['schemas']['SavedVoiceView'];
export type SavedVoiceRemoved = components['schemas']['SavedVoiceRemovedView'];
type ReceptionistView = components['schemas']['ReceptionistView'];
/** The Hub answers `details: null` until it is set up; the app reads that as empty fields. */
export type Receptionist = Omit<ReceptionistView, 'details'> & { details: NonNullable<ReceptionistView['details']> };
export type ReceptionistKnowledge = components['schemas']['ReceptionistKnowledgeView'];
export type ReceptionistDetails = components['schemas']['SaveReceptionistDto'];
export type KnowledgeToAdd = components['schemas']['AddKnowledgeDto'];

const num = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const text = (value: unknown): value is string => typeof value === 'string';
const STATES = ['none', 'making', 'ready'] as const;

export function readSavedVoice(value: unknown): SavedVoice {
  const v = value as Partial<SavedVoice> | null;
  const r = v?.recording as Partial<SavedVoice['recording']> | undefined;
  const ok =
    v &&
    typeof v === 'object' &&
    typeof v.available === 'boolean' &&
    STATES.includes(v.state as (typeof STATES)[number]) &&
    text(v.consent?.line) &&
    r &&
    text(r.folder) &&
    Array.isArray(r.accepts) &&
    num(r.minSeconds) &&
    num(r.maxSeconds) &&
    num(r.maxBytes);
  if (!ok) throw unreadable('your voice');
  return { ...(v as SavedVoice), name: text(v.name) ? v.name : null, createdAt: text(v.createdAt) ? v.createdAt : null };
}

export const savedVoiceKey = (owner: string | null) => ['ai-tools', 'my-voice', owner ?? ''] as const;
export async function fetchSavedVoice(): Promise<SavedVoice> {
  const body = (await unwrap(api.GET('/api/hub/ai-tools/my-voice'))) as unknown as Envelope<SavedVoice>;
  return readSavedVoice(body?.data);
}
export const savedVoiceQuery = (owner: string | null) => ({ queryKey: savedVoiceKey(owner), queryFn: fetchSavedVoice, enabled: Boolean(owner), staleTime: 0 }) as const;

/** Takes the saved voice away. `atProvider` is `gone`, or `pending` while the Hub is still removing the last copy and keeps trying. */
export async function removeSavedVoice(): Promise<SavedVoiceRemoved> {
  const body = (await unwrap(api.DELETE('/api/hub/ai-tools/my-voice'))) as unknown as Envelope<SavedVoiceRemoved>;
  const data = body?.data;
  if (!data || (data.atProvider !== 'gone' && data.atProvider !== 'pending')) throw unreadable('your voice');
  return { myVoice: readSavedVoice(data.myVoice), atProvider: data.atProvider };
}

export function readReceptionist(value: unknown): Receptionist {
  const v = value as Partial<Receptionist> | null;
  const l = v?.limits as Partial<Receptionist['limits']> | undefined;
  const d = v?.details as Partial<Receptionist['details']> | undefined;
  const ok =
    v &&
    typeof v === 'object' &&
    typeof v.available === 'boolean' &&
    typeof v.setUp === 'boolean' &&
    (d === null || d === undefined || (text(d.businessName) && text(d.offer))) &&
    Array.isArray(v.knowledge) &&
    l &&
    num(l.docsMax) &&
    num(l.docMaxBytes) &&
    num(l.textMaxChars) &&
    num(l.messageMaxChars) &&
    Array.isArray(l.languages);
  if (!ok) throw unreadable('your Receptionist');
  const knowledge = (v.knowledge ?? []).filter((k): k is ReceptionistKnowledge => Boolean(k) && text(k.id) && text(k.name) && ['text', 'url', 'file'].includes(k.kind) && num(k.bytes));
  return { ...(v as Receptionist), details: { businessName: d?.businessName ?? '', offer: d?.offer ?? '', replyStyle: text(d?.replyStyle) ? d.replyStyle : '', language: text(d?.language) ? d.language : '', voiceId: text(d?.voiceId) ? d.voiceId : '' }, knowledge, voices: Array.isArray(v.voices) ? v.voices : [] };
}

export const receptionistKey = (owner: string | null) => ['ai-tools', 'receptionist', owner ?? ''] as const;
export async function fetchReceptionist(): Promise<Receptionist> {
  const body = (await unwrap(api.GET('/api/hub/ai-tools/receptionist'))) as unknown as Envelope<Receptionist>;
  return readReceptionist(body?.data);
}
export const receptionistQuery = (owner: string | null) => ({ queryKey: receptionistKey(owner), queryFn: fetchReceptionist, enabled: Boolean(owner), staleTime: 0 }) as const;

/** Sets it up, or changes it. */
export async function saveReceptionist(details: ReceptionistDetails): Promise<Receptionist> {
  const body = (await unwrap(api.PUT('/api/hub/ai-tools/receptionist', { body: details }))) as unknown as Envelope<Receptionist>;
  return readReceptionist(body?.data);
}

/** Clears it: the agent, every document it knew and the earlier messages. `atProvider` is `pending` while the Hub is still removing a copy. */
export async function clearReceptionist(): Promise<{ receptionist: Receptionist; atProvider: 'gone' | 'pending' }> {
  const body = (await unwrap(api.DELETE('/api/hub/ai-tools/receptionist'))) as unknown as Envelope<{ receptionist: Receptionist; atProvider: 'gone' | 'pending' }>;
  const data = body?.data;
  if (!data || (data.atProvider !== 'gone' && data.atProvider !== 'pending')) throw unreadable('your Receptionist');
  return { receptionist: readReceptionist(data.receptionist), atProvider: data.atProvider };
}

export async function addKnowledge(item: KnowledgeToAdd): Promise<Receptionist> {
  const body = (await unwrap(api.POST('/api/hub/ai-tools/receptionist/knowledge', { body: item }))) as unknown as Envelope<Receptionist>;
  return readReceptionist(body?.data);
}

export async function removeKnowledge(id: string): Promise<Receptionist> {
  const body = (await unwrap(api.DELETE('/api/hub/ai-tools/receptionist/knowledge/{id}', { params: { path: { id } } }))) as unknown as Envelope<Receptionist>;
  return readReceptionist(body?.data);
}
