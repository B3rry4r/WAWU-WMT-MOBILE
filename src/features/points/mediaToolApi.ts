import { api, resendsUnderKey, unwrap } from '@/api/client';
import type { components } from '@/api/schema.generated';
import { releaseUpload } from '@/features/create/api';
import { unreadable, type Envelope } from '@/features/wallet/api/home';

import { readJobQuote, type JobQuote } from './studioApi';
import { readVoiceJob, type VoiceJob } from './voiceoverApi';

/**
 * The calls behind the done view of every Studio tool and behind the picture and video tools (POINTS-13 to POINTS-15), as the
 * backend contract types them (AITOOLS-08 to AITOOLS-10):
 *
 * - `POST /ai-tools/jobs/{id}/piece` with an `Idempotency-Key`: the Hub copies one output of a finished job into the person's own
 *   `content/full` folder as an upload and answers what Create's draft holds. Nothing is published and no preview is made.
 * - `POST /ai-tools/talking-photo/quote`: the Hub opens the voice, reads its length and prices the seconds.
 * - `GET /ai-tools/jobs`: the person's own jobs, newest first, so a finished voice result can be picked as a Talking photo's voice.
 * - `POST /uploads/release`: lets a photo the person replaced or took away go (the Hub frees the space).
 */
export type AiPiece = components['schemas']['AiPieceView'];
export type PieceFormat = AiPiece['format'];

const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const count = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const FORMATS: readonly string[] = ['video', 'audio', 'image'];

/** A piece the draft can hold: a format Create has, and a whole file. */
export function readPiece(value: unknown): AiPiece {
  const p = value as Partial<AiPiece> | null;
  const f = p?.full as Partial<AiPiece['full']> | undefined;
  const ok = p && typeof p === 'object' && FORMATS.includes(p.format as string) && f && filled(f.key) && filled(f.fileUrl) && filled(f.contentType) && count(f.bytes) && filled(f.name);
  if (!ok) throw unreadable('piece');
  return { format: p.format as PieceFormat, full: f as AiPiece['full'], suggestedTitle: typeof p.suggestedTitle === 'string' ? p.suggestedTitle : '' };
}

/** POST /ai-tools/jobs/{id}/piece. Rejects with the Hub's own sentence and `code` (`tier_required`, `product_limit_reached`, `storage_limit_reached`, `no_format`, `job_not_ready`). */
export async function makePiece(jobId: string, outputIndex: number, key: string): Promise<AiPiece> {
  const raw = (await unwrap(
    api.POST('/api/hub/ai-tools/jobs/{id}/piece', { params: { path: { id: jobId }, header: { 'Idempotency-Key': key } }, body: { outputIndex }, fetch: resendsUnderKey }),
  )) as unknown as Envelope<AiPiece> | AiPiece;
  return readPiece('data' in raw && raw.data ? raw.data : raw);
}

/** A Talking photo's quote: the cost of the voice's seconds, and the seconds the Hub read from it. */
export type SpeechQuote = JobQuote & { speech: { seconds: number } };

export function readSpeechQuote(value: unknown): SpeechQuote {
  const quote = readJobQuote(value);
  const seconds = (value as { speech?: { seconds?: unknown } } | null)?.speech?.seconds;
  if (!count(seconds) || seconds < 1) throw unreadable('the length of this voice');
  return { ...quote, speech: { seconds } };
}

/** The voice a Talking photo speaks: an uploaded recording's `key`, or the id of one of the person's own finished voice results. */
export type Voice = { audioKey: string } | { sourceJobId: string };

/** POST /ai-tools/talking-photo/quote. Rejects with the Hub's own sentence when the voice cannot be read. */
export async function fetchSpeechQuote(voice: Voice): Promise<SpeechQuote> {
  const out = (await unwrap(api.POST('/api/hub/ai-tools/talking-photo/quote', { body: voice }))) as unknown as Envelope<SpeechQuote>;
  return readSpeechQuote(out?.data);
}

/** The person's recent jobs; a finished one with audio is a voice they can lend a Talking photo. */
export async function fetchRecentJobs(): Promise<VoiceJob[]> {
  const out = (await unwrap(api.GET('/api/hub/ai-tools/jobs', { params: { query: { limit: 50 } } }))) as unknown as Envelope<{ items?: unknown }>;
  const items = out?.data?.items;
  if (!Array.isArray(items)) throw unreadable('your results');
  const jobs: VoiceJob[] = [];
  for (const item of items) {
    try {
      jobs.push(readVoiceJob(item));
    } catch {
      // A row that is not whole is left out, never drawn half empty.
    }
  }
  return jobs;
}

export const recentJobsKey = (owner: string | null) => ['ai-tools', 'recent-jobs', owner ?? ''] as const;

/** The voice results a Talking photo can use: done, with audio, and made by a tool that reads words aloud (the Hub takes MP3 or WAV, which only those make). */
export const voiceResultsOf = (jobs: readonly VoiceJob[]): VoiceJob[] => jobs.filter((j) => j.state === 'done' && j.audioUrl && (j.tool === 'voiceover' || j.tool === 'quick-voice'));

/** Lets an uploaded photo go (replaced, or taken away). Sent and forgotten: the screen never waits on it. */
export function releaseInput(key: string): void {
  void releaseUpload(key).catch(() => undefined);
}
