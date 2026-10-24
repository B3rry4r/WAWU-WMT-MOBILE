import { api, resendsUnderKey, unwrap } from '@/api/client';
import type { components } from '@/api/schema.generated';
import { unreadable, type Envelope } from '@/features/wallet/api/home';

/**
 * The calls behind one AI tool's screen (PT2, PT2a, PT2b, PT2c), as the backend contract types them (AITOOLS-01 to AITOOLS-03).
 *
 * - `POST /ai-tools/{tool}/jobs`: starts a job. A tool that takes the person's own recording (Captions, Clean audio) sends the `key` of the
 *   file they uploaded and the `quoteToken` of the cost they saw. A tool that reads words aloud (VoiceOver, Quick voice) sends the words, a voice id from
 *   `GET /ai-tools` and the `quoteToken` of the `POST /points/quote` the person saw; a tool that takes a description (Sound effect,
 *   Music track) sends the description and the `quoteToken`. The `Idempotency-Key` is one per job and travels again, unchanged, on every retry of the same
 *   job: the Hub answers a key it knows with the first job (`200`) and holds nothing more. It answers `202` with the job `working`.
 * - `GET /ai-tools/jobs/{id}`: one job as it stands now: `working`, `done` with an audio link, or `failed` with the Hub's own sentence.
 *
 * The Hub's refusals carry a `reason.code` and its own words, and the shared `ApiError` keeps only the code, so the start reads its own
 * answer and hands the screen one of `StartOutcome`.
 */
export type VoiceJob = components['schemas']['AiJobView'];
export type JobOutput = components['schemas']['AiJobOutputView'];

const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const whole = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const STATES = ['working', 'done', 'failed'] as const;

/** A job the screen can draw: a known state and whole figures. A `done` job with no audio link yet is still `done`; the link comes on the next read. */
export function readVoiceJob(value: unknown): VoiceJob {
  const j = value as Partial<VoiceJob> | null;
  const ok = j && typeof j === 'object' && filled(j.id) && STATES.includes(j.state as (typeof STATES)[number]) && whole(j.costPoints) && whole(j.units) && whole(j.characters);
  if (!ok) throw unreadable('job');
  return {
    ...(j as VoiceJob),
    audioUrl: filled(j.audioUrl) ? j.audioUrl : null,
    // What a done job made (POINTS-10): a transcript and its subtitle file are words, not a link. An output that is not whole is dropped, never drawn.
    outputs: Array.isArray(j.outputs) ? j.outputs.filter((o): o is JobOutput => Boolean(o) && typeof o === 'object' && ['audio', 'text', 'subtitles'].includes(o.kind)) : [],
    message: filled(j.message) ? j.message : null,
    finishedAt: j.finishedAt ?? null,
  };
}

/** The words a done job made, by kind (`text`: the transcript, `subtitles`: the SRT), or null when it made none. */
export function outputText(job: Pick<VoiceJob, 'outputs'>, kind: 'text' | 'subtitles'): string | null {
  const found = job.outputs?.find((o) => o.kind === kind && filled(o.text));
  return found?.text ?? null;
}

/** True when a done job has what it made to show: the audio link, or a transcript. A done job with neither is still being filed; the next read has it. */
export const hasResult = (job: Pick<VoiceJob, 'audioUrl' | 'outputs'>): boolean => filled(job.audioUrl) || outputText(job, 'text') !== null;

/** GET /ai-tools/jobs/{id}. */
export async function fetchVoiceJob(id: string): Promise<VoiceJob> {
  const body = (await unwrap(api.GET('/api/hub/ai-tools/jobs/{id}', { params: { path: { id } } }))) as unknown as Envelope<VoiceJob>;
  return readVoiceJob(body?.data);
}

/** Read again while the job is working (the Hub makes the audio after it has answered). */
export const voiceJobQuery = (owner: string | null, id: string | null) =>
  ({ queryKey: ['ai-tools', 'job', owner ?? '', id ?? ''] as const, queryFn: () => fetchVoiceJob(id as string), staleTime: 0, enabled: Boolean(owner) && Boolean(id) }) as const;

/** How often a working job is read again, in ms. */
export const JOB_POLL_MS = 2000;

/** What the screen branches on after a start. Never a thrown error. */
export type StartOutcome =
  /** The Hub has the job (new, or the first one for this key): it is `working`, `done` or `failed`. */
  | { kind: 'started'; job: VoiceJob }
  /** No answer that proves anything (no connection, a timeout, a server fault, the same key still running): send the SAME request again. */
  | { kind: 'unanswered' }
  /** The Hub refused and nothing was held, in its own sentence. The key is free to use once the cause is fixed. */
  | { kind: 'refused'; code: string | null; message: string };

/** What a job carries, by the kind of input the tool takes (`GET /ai-tools`, `input.kind`). */
export type JobRequest = { kind: 'text'; text: string; voiceId: string } | { kind: 'prompt'; prompt: string } | { kind: 'file'; fileKey: string };

export type StartInput = {
  /** The Hub's id for the tool (`GET /ai-tools`): it names the route. */
  toolId: string;
  request: JobRequest;
  quoteToken: string;
  /** One per job, kept across retries of the same job. */
  key: string;
};

const HTTP_OK = 200;
const HTTP_ACCEPTED = 202;
const HTTP_SERVER_MIN = 500;

/** Shown for `points_hold_settled` on a job start: the first try failed on the Hub's side and its points are back. */
const SETTLED_WORDS = 'That did not start, and no points were taken. Run it again.';

type Reason = { code?: unknown; message?: unknown };

function reasonOf(error: unknown): { code: string | null; message: string } {
  const record = typeof error === 'object' && error !== null ? (error as { reason?: unknown; message?: unknown }) : {};
  const reason: Reason = typeof record.reason === 'object' && record.reason !== null ? (record.reason as Reason) : {};
  const raw = record.message;
  const message = Array.isArray(raw) ? raw.filter((p) => typeof p === 'string').join('. ') : typeof raw === 'string' ? raw : '';
  return { code: typeof reason.code === 'string' ? reason.code : null, message: typeof reason.message === 'string' && reason.message ? reason.message : message };
}

/** The one POST each tool's route takes, with the body its kind carries. A tool this build has no route for is `null`. */
function post(input: StartInput) {
  const { toolId, request, quoteToken, key } = input;
  const options = { params: { header: { 'Idempotency-Key': key } }, fetch: resendsUnderKey } as const;
  if (request.kind === 'text') {
    const body = { text: request.text, voiceId: request.voiceId, quoteToken };
    if (toolId === 'voiceover') return api.POST('/api/hub/ai-tools/voiceover/jobs', { ...options, body });
    if (toolId === 'quick-voice') return api.POST('/api/hub/ai-tools/quick-voice/jobs', { ...options, body });
    return null;
  }
  if (request.kind === 'file') {
    // The person's own file (AITOOLS-04): its `key` from the upload, and the quote token of the cost they were shown. Captions detects the language.
    const body = { fileKey: request.fileKey, quoteToken };
    if (toolId === 'captions') return api.POST('/api/hub/ai-tools/captions/jobs', { ...options, body });
    if (toolId === 'clean-audio') return api.POST('/api/hub/ai-tools/clean-audio/jobs', { ...options, body });
    return null;
  }
  const body = { prompt: request.prompt, quoteToken };
  if (toolId === 'sound-effect') return api.POST('/api/hub/ai-tools/sound-effect/jobs', { ...options, body });
  if (toolId === 'music') return api.POST('/api/hub/ai-tools/music/jobs', { ...options, body });
  return null;
}

/**
 * POST /ai-tools/{tool}/jobs. A request that got no answer is `unanswered`, and so is every 5xx and the key still running: points may
 * be held, so only the SAME key is safe to send again.
 */
export async function startJob(input: StartInput): Promise<StartOutcome> {
  let result;
  try {
    const sent = post(input);
    if (sent === null) return { kind: 'refused', code: null, message: 'That did not start. Try again.' };
    result = await sent;
  } catch {
    return { kind: 'unanswered' };
  }
  const { data, error, response } = result;
  if (response.status === HTTP_ACCEPTED || response.status === HTTP_OK) {
    try {
      return { kind: 'started', job: readVoiceJob((data as unknown as Envelope<VoiceJob> | undefined)?.data) };
    } catch {
      // The Hub said it took the job and the answer cannot be read: the job may exist, so it is not a refusal.
      return { kind: 'unanswered' };
    }
  }
  const { code, message } = reasonOf(error);
  // The one 5xx that is an answer: the Hub says the tool is off and that nothing was held.
  if (code === 'ai_tool_unavailable' && message) return { kind: 'refused', code, message };
  if (response.status >= HTTP_SERVER_MIN || code === 'idempotency_in_progress') return { kind: 'unanswered' };
  // The Hub could not write the job, gave the points back, and the same key now meets that spent hold (SWEEP-MONEY, AITOOLS-01 L2b):
  // the key is finished with, so this is a refusal (the record goes) and the next Run is a new attempt under a new key.
  if (code === 'points_hold_settled') return { kind: 'refused', code, message: SETTLED_WORDS };
  return { kind: 'refused', code, message: message || 'That did not start. Try again.' };
}
