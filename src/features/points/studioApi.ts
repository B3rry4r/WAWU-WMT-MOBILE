import { api, unwrap } from '@/api/client';
import type { components } from '@/api/schema.generated';
import { unreadable, type Envelope } from '@/features/wallet/api/home';

import { readVoiceJob, type VoiceJob } from './voiceoverApi';

/**
 * The calls behind Studio (PT1, PT1a) and the checks before a job runs (PT3, PT3a, PT3b, PT7), as the backend contract types them
 * (AITOOLS-01, POINTS-03).
 *
 * - `GET /ai-tools`: the tools the Hub can run, each with its cost in points for one unit, whether it is `enabled`, and the plan's caps.
 *   Only what the Hub lists is drawn, and every cost is the Hub's, never the board's (R-65).
 * - `POST /points/quote`: what one job costs before it runs: the balance, the shortfall, the cap that stops it (PT7) and, with a shortfall
 *   and "Use wallet" on, the wallet money for exactly the shortfall with the signed quote the purchase carries. It holds nothing and
 *   takes nothing.
 *
 * Buying the missing points is not here any more: points are bought in the store sheet (R-86, `@/features/store`), so the quote's wallet
 * offer is not drawn.
 */
/**
 * One tool of `GET /ai-tools`. The entry's `input.kind` says what the tool takes (`text` or `prompt`); an entry that does not say is a
 * tool that takes words, as every entry was before AITOOLS-03, so the app reads a missing kind as `text` and never requires one.
 */
export type AiTool = Omit<components['schemas']['AiToolView'], 'input'> & { input: Omit<components['schemas']['AiToolView']['input'], 'kind'> & { kind?: components['schemas']['AiToolView']['input']['kind'] } };
export type AiTools = Omit<components['schemas']['AiToolsView'], 'tools'> & { tools: AiTool[] };
export type JobQuote = components['schemas']['PointsQuoteView'];
export type JobCap = components['schemas']['PointsCapView'];
export type JobAction = components['schemas']['PointsQuoteDto']['action'];

/** The job as it was quoted: the same words go to the quote, the purchase and (POINTS-08) the job itself. */
export type JobInput = { action: JobAction; units: number; languages?: number; characters?: number };

const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const count = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const whole = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const isTime = (value: unknown): value is string => typeof value === 'string' && !Number.isNaN(new Date(value).getTime());

/** The tools and caps the screen can draw: whole tools (a name, a cost, a flag) or nothing (an answer that is not whole is refused, never drawn half empty). */
export function readAiTools(value: unknown): AiTools {
  const v = value as Partial<AiTools> | null;
  if (!v || typeof v !== 'object' || !Array.isArray(v.tools)) throw unreadable('AI tools');
  const tools = v.tools.map((row): AiTool => {
    const t = row as Partial<AiTool> | null;
    if (!t || typeof t !== 'object' || !filled(t.id) || !filled(t.name) || !count(t.costPointsPerUnit) || typeof t.enabled !== 'boolean') throw unreadable('AI tools');
    return {
      id: t.id as AiTool['id'],
      action: filled(t.action) ? t.action : '',
      name: t.name.trim(),
      description: typeof t.description === 'string' ? t.description : '',
      unit: t.unit as AiTool['unit'],
      costPointsPerUnit: t.costPointsPerUnit,
      enabled: t.enabled,
      input: t.input ?? { kind: 'text', maxCharacters: 0, charactersPerUnit: 0 },
      voices: Array.isArray(t.voices) ? t.voices : [],
    };
  });
  const caps = v.caps as Partial<AiTools['caps']> | undefined;
  if (!caps || typeof caps !== 'object' || !count(caps.dailyPoints)) throw unreadable('AI tools');
  return { tools, caps: { dailyPoints: caps.dailyPoints, maxCharactersPerJob: count(caps.maxCharactersPerJob) ? caps.maxCharactersPerJob : 0, maxAudioMinutesPerJob: count(caps.maxAudioMinutesPerJob) ? caps.maxAudioMinutesPerJob : 0 } };
}

/** GET /ai-tools. */
export async function fetchAiTools(): Promise<AiTools> {
  const body = (await unwrap(api.GET('/api/hub/ai-tools'))) as unknown as Envelope<AiTools>;
  return readAiTools(body?.data);
}

/** Read again each time Studio is shown: the Hub can switch a tool off, and costs are its settings. */
export const aiToolsQuery = (owner: string | null) => ({ queryKey: ['ai-tools', owner ?? ''] as const, queryFn: fetchAiTools, staleTime: 0, enabled: Boolean(owner) }) as const;

const CAPS = ['daily', 'characters_per_job', 'minutes_per_job'] as const;

/** What a quote must hold for a screen to act on it: whole points, a token, a known cap or none, and a whole wallet offer or none. */
export function readJobQuote(value: unknown): JobQuote {
  const q = value as Partial<JobQuote> | null;
  const cap = q?.cap as Partial<JobCap> | null | undefined;
  const wallet = q?.wallet as Partial<NonNullable<JobQuote['wallet']>> | null | undefined;
  const pay = wallet?.payment as Partial<NonNullable<JobQuote['wallet']>['payment']> | undefined;
  const capOk =
    cap === null ||
    cap === undefined ||
    (typeof cap === 'object' && CAPS.includes(cap.cap as (typeof CAPS)[number]) && count(cap.limit) && filled(cap.message) && (cap.resetsAt === null || cap.resetsAt === undefined || isTime(cap.resetsAt)));
  const walletOk =
    wallet === null ||
    wallet === undefined ||
    (typeof wallet === 'object' && whole(wallet.priceKobo) && count(wallet.points) && pay && whole(pay.priceKobo) && whole(pay.totalKobo) && pay.fee && whole(pay.fee.totalFeeKobo) && filled(pay.quoteToken));
  const ok =
    q &&
    typeof q === 'object' &&
    filled(q.action) &&
    count(q.costPoints) &&
    count(q.balancePoints) &&
    count(q.shortfallPoints) &&
    typeof q.useWallet === 'boolean' &&
    typeof q.canRun === 'boolean' &&
    filled(q.quoteToken) &&
    capOk &&
    walletOk;
  if (!ok) throw unreadable('the cost of this job');
  return {
    ...(q as JobQuote),
    title: typeof q.title === 'string' ? q.title : '',
    cap: cap ? ({ ...cap, resetsAt: cap.resetsAt ?? null, usedPoints: cap.usedPoints ?? null, remainingPoints: cap.remainingPoints ?? null } as JobCap) : null,
    wallet: wallet ? (wallet as NonNullable<JobQuote['wallet']>) : null,
    walletNote: typeof q.walletNote === 'string' ? q.walletNote : null,
  };
}

/** POST /points/quote for one job. Holds and takes nothing. */
export async function fetchJobQuote(job: JobInput): Promise<JobQuote> {
  const body = (await unwrap(api.POST('/api/hub/points/quote', { body: job }))) as unknown as Envelope<JobQuote>;
  return readJobQuote(body?.data);
}

/**
 * `GET /ai-tools/jobs?limit=10`: the person's own jobs of every tool, newest first (STUDIO-HOME, R-113). Studio's home shows the finished ones as
 * Recent. A row that is not whole is left out, never drawn half empty; the page itself is refused when it is not a page.
 */
export async function fetchRecentJobs(limit = 10): Promise<VoiceJob[]> {
  const body = (await unwrap(api.GET('/api/hub/ai-tools/jobs', { params: { query: { limit } } }))) as unknown as Envelope<{ items?: unknown }>;
  const items = body?.data?.items;
  if (!Array.isArray(items)) throw unreadable('your recent results');
  const jobs: VoiceJob[] = [];
  for (const item of items) {
    try {
      jobs.push(readVoiceJob(item));
    } catch {
      // A row the app cannot read is not drawn.
    }
  }
  return jobs;
}

/** Read again each time Studio is shown: a job finished since is a new card. */
export const recentJobsQuery = (owner: string | null) => ({ queryKey: ['ai-tools', 'recent', owner ?? ''] as const, queryFn: () => fetchRecentJobs(10), staleTime: 0, enabled: Boolean(owner) }) as const;
