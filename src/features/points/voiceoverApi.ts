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
    outputs: Array.isArray(j.outputs) ? j.outputs.filter((o): o is JobOutput => Boolean(o) && typeof o === 'object' && ['audio', 'text', 'subtitles', 'image', 'video'].includes(o.kind)) : [],
    message: filled(j.message) ? j.message : null,
    finishedAt: j.finishedAt ?? null,
  };
}

/** The words a done job made, by kind (`text`: the transcript, `subtitles`: the SRT), or null when it made none. */
export function outputText(job: Pick<VoiceJob, 'outputs'>, kind: 'text' | 'subtitles'): string | null {
  const found = job.outputs?.find((o) => o.kind === kind && filled(o.text));
  return found?.text ?? null;
}

/** One file a done job made (audio, a picture or a video), with its place in `outputs` (POINTS-13: the Hub's piece route names an output by that place). */
export type ResultFile = { index: number; output: JobOutput & { url: string } };

/** The files a done job made, in the Hub's order. Words (a transcript, subtitles) are not files. */
export function resultFiles(job: Pick<VoiceJob, 'outputs'>): ResultFile[] {
  const found: ResultFile[] = [];
  (job.outputs ?? []).forEach((output, index) => {
    if ((output.kind === 'audio' || output.kind === 'image' || output.kind === 'video') && filled(output.url)) found.push({ index, output: output as ResultFile['output'] });
  });
  return found;
}

/** The picture or the video a done job made, or null (the audio of the older tools is `audioUrl`). */
export const mediaResult = (job: Pick<VoiceJob, 'outputs'>): ResultFile | null => resultFiles(job).find((f) => f.output.kind === 'image' || f.output.kind === 'video') ?? null;

/** True when a done job has what it made to show: the audio link, a picture or a video, or a transcript. A done job with none is still being filed; the next read has it. */
export const hasResult = (job: Pick<VoiceJob, 'audioUrl' | 'outputs'>): boolean =>
  filled(job.audioUrl) || mediaResult(job) !== null || outputText(job, 'text') !== null || resultFiles(job).some((f) => f.output.kind === 'audio');

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

/** The tools whose job takes minutes: a dub (POINTS-11), an audiobook and a podcast (POINTS-18). */
const LONG_TOOLS: readonly string[] = ['dubbing', 'audiobook', 'podcast'];

/**
 * How often a working job is read again, by the tool and how long the job has been going (POINTS-11, POINTS-18). Every tool is read each 2 seconds. A dub,
 * an audiobook and a podcast take minutes, so after their first minute the reads slow: every 5 seconds until the fifth minute, then every 10. The age is the Hub's
 * `createdAt` against the phone's clock; a time that cannot be read, or one ahead of the phone's clock, counts as a job that has just started.
 */
export function pollMsFor(toolId: string, createdAt: string | null | undefined, now: number = Date.now()): number {
  if (!LONG_TOOLS.includes(toolId)) return JOB_POLL_MS;
  const started = createdAt ? new Date(createdAt).getTime() : Number.NaN;
  const age = Number.isFinite(started) ? Math.max(0, now - started) : 0;
  return age < 60_000 ? JOB_POLL_MS : age < 300_000 ? 5000 : 10_000;
}

/** What the screen branches on after a start. Never a thrown error. */
export type StartOutcome =
  /** The Hub has the job (new, or the first one for this key): it is `working`, `done` or `failed`. */
  | { kind: 'started'; job: VoiceJob }
  /** No answer that proves anything (no connection, a timeout, a server fault, the same key still running): send the SAME request again. */
  | { kind: 'unanswered' }
  /** The Hub refused and nothing was held, in its own sentence. The key is free to use once the cause is fixed. */
  | { kind: 'refused'; code: string | null; message: string };

/** What a job carries, by the kind of input the tool takes (`GET /ai-tools`, `input.kind`). */
export type JobRequest =
  | { kind: 'text'; text: string; voiceId: string }
  | { kind: 'prompt'; prompt: string }
  | { kind: 'file'; fileKey: string; targetLanguage?: string; /** Voice changer: the voice to hear it in. */ voiceId?: string; /** Split a song: two parts or six. */ parts?: number; /** Music for a video: the mood, in words. */ description?: string }
  /** Dialogue (POINTS-16): the lines in order, each with its voice. */
  | { kind: 'dialogue'; lines: { text: string; voiceId: string }[] }
  /** Podcast maker (POINTS-18): a text or an https link, one host or two, a length and a language. */
  | { kind: 'podcast'; source: { text: string } | { url: string }; mode: 'conversation' | 'bulletin'; voiceIds: string[]; duration: 'short' | 'standard' | 'long'; language: string }
  /** Receptionist (POINTS-12): one message to the person's own agent. */
  | { kind: 'message'; message: string }
  /** Clone your own voice (POINTS-16): the sample's `key`, the name and the words agreed to. */
  | { kind: 'clone'; fileKey: string; name: string; consentLine: string }
  /** Make an image (no photo) and Edit a photo (the photo's `key`), POINTS-14. */
  | { kind: 'image'; prompt: string; shape?: string; photoKey?: string }
  /** Make a video, with the length it is priced by and an optional photo to start from, POINTS-15. */
  | { kind: 'video'; prompt: string; shape?: string; seconds: number; photoKey?: string }
  /** Talking photo: the photo and the voice (an uploaded recording, or one of the person's own finished voice results), POINTS-15. */
  | { kind: 'talking'; photoKey: string; audioKey?: string; sourceJobId?: string };

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
    // Audiobook (POINTS-18): the whole text and a voice; the Hub speaks the chapters one after another and joins them into one file.
    if (toolId === 'audiobook') return api.POST('/api/hub/ai-tools/audiobook/jobs', { ...options, body });
    return null;
  }
  if (request.kind === 'dialogue') {
    return toolId === 'dialogue' ? api.POST('/api/hub/ai-tools/dialogue/jobs', { ...options, body: { lines: request.lines, quoteToken } }) : null;
  }
  if (request.kind === 'podcast') {
    const body = { source: request.source, mode: request.mode, voiceIds: request.voiceIds, duration: request.duration, language: request.language, quoteToken };
    return toolId === 'podcast' ? api.POST('/api/hub/ai-tools/podcast/jobs', { ...options, body }) : null;
  }
  if (request.kind === 'message') {
    return toolId === 'receptionist' ? api.POST('/api/hub/ai-tools/receptionist/messages', { ...options, body: { message: request.message, quoteToken } }) : null;
  }
  if (request.kind === 'clone') {
    return toolId === 'my-voice' ? api.POST('/api/hub/ai-tools/my-voice', { ...options, body: { fileKey: request.fileKey, name: request.name, consentLine: request.consentLine, quoteToken } }) : null;
  }
  if (request.kind === 'file') {
    // The person's own file (AITOOLS-04): its `key` from the upload, and the quote token of the cost they were shown. Captions detects the language.
    const body = { fileKey: request.fileKey, quoteToken };
    if (toolId === 'captions') return api.POST('/api/hub/ai-tools/captions/jobs', { ...options, body });
    if (toolId === 'clean-audio') return api.POST('/api/hub/ai-tools/clean-audio/jobs', { ...options, body });
    // POINTS-16 and POINTS-17: the voice to hear a recording in, the mood of a video's music, and the parts of a song.
    if (toolId === 'voice-changer' && request.voiceId) return api.POST('/api/hub/ai-tools/voice-changer/jobs', { ...options, body: { ...body, voiceId: request.voiceId } });
    if (toolId === 'video-music') return api.POST('/api/hub/ai-tools/video-music/jobs', { ...options, body: { ...body, ...(request.description ? { description: request.description } : {}) } });
    if (toolId === 'stems') return api.POST('/api/hub/ai-tools/stems/jobs', { ...options, body: { ...body, ...(request.parts === 2 || request.parts === 6 ? { parts: request.parts } : {}) } });
    // Dubbing (AITOOLS-05): the same file and quote, and the language to hear it in, one of the Hub's own list. The language spoken is left out: the Hub detects it.
    if (toolId === 'dubbing' && request.targetLanguage) return api.POST('/api/hub/ai-tools/dubbing/jobs', { ...options, body: { ...body, targetLanguage: request.targetLanguage } });
    return null;
  }
  if (request.kind === 'image') {
    const body = { prompt: request.prompt, ...(request.shape ? { shape: request.shape } : {}), quoteToken };
    if (toolId === 'image') return api.POST('/api/hub/ai-tools/image/jobs', { ...options, body });
    if (toolId === 'photo-edit' && request.photoKey) return api.POST('/api/hub/ai-tools/photo-edit/jobs', { ...options, body: { ...body, photoKey: request.photoKey } });
    return null;
  }
  if (request.kind === 'video') {
    const body = { prompt: request.prompt, ...(request.shape ? { shape: request.shape } : {}), seconds: request.seconds, ...(request.photoKey ? { photoKey: request.photoKey } : {}), quoteToken };
    return toolId === 'video' ? api.POST('/api/hub/ai-tools/video/jobs', { ...options, body }) : null;
  }
  if (request.kind === 'talking') {
    const voice = request.audioKey ? { audioKey: request.audioKey } : request.sourceJobId ? { sourceJobId: request.sourceJobId } : null;
    if (toolId !== 'talking-photo' || !voice) return null;
    return api.POST('/api/hub/ai-tools/talking-photo/jobs', { ...options, body: { photoKey: request.photoKey, ...voice, quoteToken } });
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
