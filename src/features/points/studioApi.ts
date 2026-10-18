import { api, resendsUnderKey, unwrap } from '@/api/client';
import type { components } from '@/api/schema.generated';
import { unreadable, type Envelope } from '@/features/wallet/api/home';

/**
 * The calls behind Studio (PT1, PT1a) and the checks before a job runs (PT3, PT3a, PT3b, PT7), as the backend contract types them
 * (AITOOLS-01, POINTS-03).
 *
 * - `GET /ai-tools`: the tools the Hub can run, each with its cost in points for one unit, whether it is `enabled`, and the plan's caps.
 *   Only what the Hub lists is drawn, and every cost is the Hub's, never the board's (R-65).
 * - `POST /points/quote`: what one job costs before it runs: the balance, the shortfall, the cap that stops it (PT7) and, with a shortfall
 *   and "Use wallet" on, the wallet money for exactly the shortfall with the signed quote the purchase carries. It holds nothing and
 *   takes nothing.
 * - `POST /points/shortfall`: buys exactly the shortfall from the wallet, once. The PIN is the `X-Transaction-Pin` header and nothing
 *   else keeps it; the `Idempotency-Key` is one per intent and travels again, unchanged, on every retry of that intent.
 * - `GET /points/shortfall/{id}`: one purchase as it stands now, which the app reads after `pending`.
 *
 * The Hub's refusals carry more than a code (`reason.triesLeft`), and the shared `ApiError` keeps only the code, so the purchase reads its
 * own answer and hands the screen one of `ShortfallOutcome` (as Send, Convert and Buy points do).
 */
export type AiTool = components['schemas']['AiToolView'];
export type AiTools = components['schemas']['AiToolsView'];
export type JobQuote = components['schemas']['PointsQuoteView'];
export type JobCap = components['schemas']['PointsCapView'];
export type Shortfall = components['schemas']['PointsShortfallView'];
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
      input: t.input ?? { maxCharacters: 0, charactersPerUnit: 0 },
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

const STATUSES = ['pending', 'failed', 'reversed', 'paid'] as const;

/** A purchase as the screens read it: a known status and whole figures. Anything else is refused, never drawn. */
export function readShortfall(value: unknown): Shortfall {
  const p = value as Partial<Shortfall> | null;
  const ok = p && typeof p === 'object' && filled(p.id) && STATUSES.includes(p.status as (typeof STATUSES)[number]) && whole(p.points) && whole(p.amountKobo) && filled(p.createdAt);
  if (!ok) throw unreadable('purchase');
  return { ...(p as Shortfall), statusMessage: typeof p.statusMessage === 'string' ? p.statusMessage : null, grant: p.grant ?? null, paidAt: p.paidAt ?? null };
}

/** GET /points/shortfall/{id}: our own record of one purchase, what the app reads after `pending`. */
export async function fetchShortfall(id: string): Promise<Shortfall> {
  const body = (await unwrap(api.GET('/api/hub/points/shortfall/{id}', { params: { path: { id } } }))) as unknown as Envelope<Shortfall>;
  return readShortfall(body?.data);
}

export const shortfallQuery = (owner: string | null, id: string | null) =>
  ({ queryKey: ['points', 'shortfall', owner ?? '', id ?? ''] as const, queryFn: () => fetchShortfall(id as string), staleTime: 0, enabled: Boolean(owner) && Boolean(id) }) as const;

/** Why the Hub did not take the purchase, in the shapes the sheet branches on. */
export type ShortfallOutcome =
  /** The Hub took the request and answered with the purchase. Its `status` says how it stands: paid, pending, failed, reversed. */
  | { kind: 'done'; purchase: Shortfall }
  | { kind: 'pin_incorrect'; triesLeft: number }
  | { kind: 'pin_locked'; lockedUntil: string }
  | { kind: 'pin_not_set' }
  | { kind: 'no_wallet' }
  /** `402 insufficient_funds`: the wallet is short for the money; nothing moved. */
  | { kind: 'wallet_short' }
  /** `409 quote_changed`: what the person was shown is not what is true now. The sheet asks for the quote again; nothing is sent until the person confirms again. */
  | { kind: 'quote_changed'; message: string }
  /** `409 points_not_short`: the person has enough points now (they were added since). Nothing moved. */
  | { kind: 'not_short' }
  /** `422 points_cap_reached`: buying points would not let the job run. Nothing moved. */
  | { kind: 'cap_reached'; message: string }
  /** No answer that proves anything (no connection, a timeout, a server fault, the same key still running): send the SAME request again. */
  | { kind: 'unanswered' }
  /** Any other refusal, in the Hub's own sentence. Nothing moved. */
  | { kind: 'refused'; code: string | null; message: string };

export type ShortfallInput = JobInput & {
  /** `wallet.payment.totalKobo` and `wallet.payment.quoteToken` of the quote the person saw. */
  expectedTotalKobo: number;
  quoteToken: string;
  /** One per intent, kept across retries of the same intent. */
  key: string;
  pin: string;
};

const HTTP_CREATED = 201;
const HTTP_SERVER_MIN = 500;

type Reason = { code?: unknown; message?: unknown; triesLeft?: unknown; lockedUntil?: unknown };

function reasonOf(error: unknown): { reason: Reason; message: string } {
  const record = typeof error === 'object' && error !== null ? (error as { reason?: unknown; message?: unknown }) : {};
  const reason = typeof record.reason === 'object' && record.reason !== null ? (record.reason as Reason) : {};
  const raw = record.message;
  const message = Array.isArray(raw) ? raw.filter((p) => typeof p === 'string').join('. ') : typeof raw === 'string' ? raw : '';
  return { reason, message: typeof reason.message === 'string' && reason.message ? reason.message : message };
}

/**
 * POST /points/shortfall. Never rejects: whatever came back (or did not) is a `ShortfallOutcome`, so the sheet decides in one place. A
 * request that got no answer is `unanswered`, and so is every 5xx: money may have moved, so only the SAME key is safe to send again.
 */
export async function buyShortfall(input: ShortfallInput): Promise<ShortfallOutcome> {
  const { pin, key, ...rest } = input;
  let result;
  try {
    result = await api.POST('/api/hub/points/shortfall', { params: { header: { 'X-Transaction-Pin': pin, 'Idempotency-Key': key } }, body: rest, fetch: resendsUnderKey });
  } catch {
    return { kind: 'unanswered' };
  }
  const { data, error, response } = result;
  if (response.status === HTTP_CREATED) {
    try {
      return { kind: 'done', purchase: readShortfall((data as unknown as Envelope<Shortfall> | undefined)?.data) };
    } catch {
      // The Hub said created and the answer cannot be read: the purchase may exist, so it is not a refusal.
      return { kind: 'unanswered' };
    }
  }
  if (response.status >= HTTP_SERVER_MIN) return { kind: 'unanswered' };
  const { reason, message } = reasonOf(error);
  const code = typeof reason.code === 'string' ? reason.code : null;
  switch (code) {
    case 'pin_incorrect':
      return { kind: 'pin_incorrect', triesLeft: typeof reason.triesLeft === 'number' ? reason.triesLeft : 0 };
    case 'pin_locked':
      return filled(reason.lockedUntil) ? { kind: 'pin_locked', lockedUntil: reason.lockedUntil } : { kind: 'unanswered' };
    case 'pin_not_set':
      return { kind: 'pin_not_set' };
    case 'wallet_not_open':
      return { kind: 'no_wallet' };
    case 'idempotency_in_progress':
    case 'payment_in_progress':
      return { kind: 'unanswered' };
    case 'insufficient_funds':
      return { kind: 'wallet_short' };
    case 'quote_changed':
      return { kind: 'quote_changed', message };
    case 'points_not_short':
      return { kind: 'not_short' };
    case 'points_cap_reached':
      return { kind: 'cap_reached', message };
    default:
      return { kind: 'refused', code, message: message || 'This purchase was not taken. Nothing left your wallet.' };
  }
}
