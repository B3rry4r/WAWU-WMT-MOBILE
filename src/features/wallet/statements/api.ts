import { api, resendsUnderKey, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * The calls behind W38 (WALLET-35), as the backend contract types them.
 *
 * - `GET /money/statements/delivery`: where a statement can go and in which formats. The address is the person's own
 *   confirmed email, masked, and never typed; the formats are what the server accepts today.
 * - `POST /money/statements/email`: builds the statement for the period and mails it to that address. The body is the
 *   two days and the format and nothing else.
 */
type DeliveryView = components['schemas']['StatementDeliveryView'];
type SentView = components['schemas']['StatementEmailView'];

/** The Hub's success body; the contract types only its `data` (SHARED-CHANGES.md row 11). */
type Envelope<T> = { statusCode: number; message: string; data: T | null };

export type StatementFormat = DeliveryView['formats'][number];

export type StatementDelivery = {
  /** The account's own address, masked by the server; null when a statement cannot be emailed yet. */
  email: string | null;
  canEmail: boolean;
  formats: StatementFormat[];
};

export type StatementSent = { sentTo: string; from: string; to: string; fileName: string; rowCount: number };

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `Your ${what} could not be read. Try again.`);
}

/** GET /money/statements/delivery. A body that is not what the contract says is refused, never drawn half empty. */
export async function fetchStatementDelivery(): Promise<StatementDelivery> {
  const body = (await unwrap(api.GET('/api/hub/money/statements/delivery'))) as unknown as Envelope<DeliveryView>;
  const v = body?.data;
  if (!v || typeof v !== 'object' || typeof v.canEmail !== 'boolean' || !Array.isArray(v.formats)) throw unreadable('statement options');
  const formats = v.formats.filter((f): f is StatementFormat => typeof f === 'string' && f.length > 0);
  const email = typeof v.email === 'string' && v.email.trim().length > 0 ? v.email : null;
  if (v.canEmail && email === null) throw unreadable('statement options');
  return { email: v.canEmail ? email : null, canEmail: v.canEmail, formats };
}

/** The read, keyed by the signed-in account, asked again each time the screen is shown. */
export function statementDeliveryQuery(owner: string | null) {
  return { queryKey: ['money', 'statement-delivery', owner ?? ''] as const, queryFn: fetchStatementDelivery, staleTime: 0, enabled: Boolean(owner) };
}

/**
 * POST /money/statements/email. `key` is the attempt's Idempotency-Key: sent again unchanged when no answer came, so a
 * repeat of a mail that already went is answered with the first and never sends a second.
 */
export async function sendStatement(input: { from: string; to: string; format: StatementFormat; key: string }): Promise<StatementSent> {
  const { key, ...request } = input;
  const body = (await unwrap(
    api.POST('/api/hub/money/statements/email', { params: { header: { 'Idempotency-Key': key } }, body: request, fetch: resendsUnderKey }),
  )) as unknown as Envelope<SentView>;
  const v = body?.data;
  if (!v || typeof v !== 'object' || typeof v.sentTo !== 'string' || v.sentTo.length === 0) throw unreadable('statement');
  return { sentTo: v.sentTo, from: v.from, to: v.to, fileName: v.fileName, rowCount: v.rowCount };
}
